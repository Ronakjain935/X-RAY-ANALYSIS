"""Case ID generation helper (shared across routers)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from models.case import Case
from models.schemas import ConfidenceType


def next_case_id(db: Session) -> str:
    """Generate the next sequential case ID like XR-000001."""
    last = db.query(Case).order_by(Case.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    return f"XR-{next_num:06d}"


def confidence_from_score(score: float, high: float, medium: float) -> ConfidenceType:
    """Map a model score to HIGH/MEDIUM/LOW using configured thresholds."""
    if score >= high:
        return "HIGH"
    if score >= medium:
        return "MEDIUM"
    return "LOW"
