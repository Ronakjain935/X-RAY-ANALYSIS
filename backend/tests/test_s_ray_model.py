"""Test live S_RAY Keras model inference and X-Ray Gate check."""
from __future__ import annotations

import io
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

from main import app
from services import prediction

client = TestClient(app)


def test_s_ray_model_status():
    """Verify S_RAY model is loaded."""
    status = prediction.model_status()
    assert status["available"] is True
    assert status["model_type"] == "keras"
    assert status["gate_available"] is True


def test_s_ray_rejects_non_xray():
    """Verify non-X-rays (e.g. flat image or color photo) are rejected with 400 NOT_AN_XRAY."""
    buf = io.BytesIO()
    Image.new("RGB", (224, 224), (255, 100, 50)).save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/analyze",
        files={"file": ("color_photo.jpg", buf.getvalue(), "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["error"] == "NOT_AN_XRAY"


def test_s_ray_analyze_real_xray():
    """Test full /api/analyze flow with an actual chest X-ray image."""
    xray_path = Path(__file__).resolve().parent.parent / "uploads" / "b6c78bd4db761d16.jpg"
    if not xray_path.exists():
        # Fallback to any file in uploads
        uploads = list((Path(__file__).resolve().parent.parent / "uploads").glob("*.jpg"))
        if uploads:
            xray_path = uploads[0]
        else:
            return

    with open(xray_path, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/api/analyze",
        files={"file": ("chest_xray.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "case_id" in data
    assert data["prediction"] in ("NORMAL", "PNEUMONIA")
    assert 0.0 <= data["score"] <= 1.0
    assert 0.0 <= data["probabilities"]["NORMAL"] <= 1.0
    assert 0.0 <= data["probabilities"]["PNEUMONIA"] <= 1.0
    assert data["gradcam_url"] is not None
