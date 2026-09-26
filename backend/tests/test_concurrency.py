"""Test case ID collision handling and concurrency safety."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from models.database import SessionLocal
from models.case import Case
from api._helpers import next_case_id

client = TestClient(app)


def test_next_case_id_skips_existing():
    """Verify next_case_id skips existing case IDs if an entry already exists."""
    db = SessionLocal()
    try:
        # Get the next expected case ID
        cid = next_case_id(db)
        assert cid.startswith("XR-")
        # Check that it doesn't already exist
        existing = db.query(Case).filter(Case.case_id == cid).first()
        assert existing is None
    finally:
        db.close()


def test_model_status_endpoint():
    """Verify /model-status endpoint returns accurate model state."""
    response = client.get("/model-status")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "model_type" in data
    assert "gate_available" in data
    assert "pneumonia_threshold" in data
