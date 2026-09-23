"""Tests for API behavior — especially missing-model handling and validation."""
from __future__ import annotations

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from PIL import Image

from main import app
from services import prediction

client = TestClient(app)


def _make_png_bytes(size=(256, 256)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, (128, 128, 128)).save(buf, format="PNG")
    return buf.getvalue()


def _make_jpg_bytes(size=(256, 256)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, (128, 128, 128)).save(buf, format="JPEG")
    return buf.getvalue()


def test_analyze_rejects_unsupported_file_type():
    """Unsupported extensions should return 400 INVALID_IMAGE."""
    response = client.post(
        "/api/analyze",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert response.status_code == 400
    body = response.json()
    assert body["detail"]["error"] == "INVALID_IMAGE"


def test_analyze_rejects_empty_file():
    """Empty files should be rejected."""
    response = client.post(
        "/api/analyze",
        files={"file": ("empty.png", b"", "image/png")},
    )
    assert response.status_code == 400
    body = response.json()
    assert body["detail"]["error"] == "INVALID_IMAGE"


def test_analyze_handles_missing_model_gracefully():
    """If the model is not available, /api/analyze must return 503 with a clear error.

    This test passes regardless of whether the .pth is present —
    if the model IS available, we skip the missing-model assertion.
    """
    response = client.post(
        "/api/analyze",
        files={"file": ("test.png", _make_png_bytes(), "image/png")},
    )
    if prediction.model_available():
        # Model is loaded — we expect either 200 (success) or a different error,
        # but NOT 503.
        assert response.status_code != 503, (
            "Model is reportedly available but /api/analyze returned 503."
        )
    else:
        # Model missing — must return 503 MODEL_NOT_AVAILABLE
        assert response.status_code == 503
        body = response.json()
        assert body["detail"]["error"] == "MODEL_NOT_AVAILABLE"
        assert "pneumonia_resnet18_best.pth" in body["detail"]["message"]


def test_cases_list_returns_200():
    """GET /api/cases should always return 200 with the paginated shape."""
    response = client.get("/api/cases?page=1&page_size=10")
    assert response.status_code == 200
    body = response.json()
    assert "total" in body
    assert "page" in body
    assert "page_size" in body
    assert "cases" in body
    assert isinstance(body["cases"], list)


def test_analytics_summary_returns_200():
    """GET /api/analytics/summary should return 200 with zero-initialized counts
    when the database is empty."""
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["total_cases"] >= 0
    assert body["normal_cases"] >= 0
    assert body["pneumonia_cases"] >= 0
    # Sum of distributions must equal total
    assert (
        body["prediction_distribution"]["NORMAL"]
        + body["prediction_distribution"]["PNEUMONIA"]
        == body["total_cases"]
    )
    assert (
        body["priority_distribution"]["HIGH"]
        + body["priority_distribution"]["MEDIUM"]
        + body["priority_distribution"]["LOW"]
        == body["total_cases"]
    )


def test_get_nonexistent_case_returns_404():
    response = client.get("/api/cases/XR-999999")
    assert response.status_code == 404
    body = response.json()
    assert body["detail"]["error"] == "CASE_NOT_FOUND"


def test_review_nonexistent_case_returns_404():
    response = client.patch(
        "/api/cases/XR-999999/review",
        json={"human_decision": "AGREE_WITH_AI", "reviewer_notes": "test"},
    )
    assert response.status_code == 404


def test_review_validates_decision_value():
    """Invalid human_decision values should be rejected by Pydantic."""
    response = client.patch(
        "/api/cases/XR-999999/review",
        json={"human_decision": "INVALID_DECISION"},
    )
    assert response.status_code == 422  # Pydantic validation error
