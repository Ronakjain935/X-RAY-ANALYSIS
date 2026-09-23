"""Tests for /health endpoint."""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend root to path so we can import without installing
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_returns_ok():
    """GET /health should always return 200 with status=ok."""
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    # model_available is a boolean (True/False depending on whether .pth exists)
    assert isinstance(body["model_available"], bool)


def test_root_returns_app_info():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "X-RAY SQUARED"
    assert "model_available" in body
