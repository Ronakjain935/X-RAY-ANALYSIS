"""GET /api/analytics/summary"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.case import Case
from models.database import get_db
from models.schemas import AnalyticsSummary

router = APIRouter()


@router.get(
    "/api/analytics/summary",
    response_model=AnalyticsSummary,
    tags=["Analytics"],
    summary="Get dashboard analytics summary",
    description=(
        "Returns aggregated case counts. If the database is empty, all counts "
        "are zero. The backend NEVER fabricates fake analytics."
    ),
)
def get_analytics_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(Case.id)).scalar() or 0
    normal = db.query(func.count(Case.id)).filter(Case.prediction == "NORMAL").scalar() or 0
    pneumonia = db.query(func.count(Case.id)).filter(Case.prediction == "PNEUMONIA").scalar() or 0
    pending = db.query(func.count(Case.id)).filter(Case.review_status == "PENDING").scalar() or 0
    reviewed = db.query(func.count(Case.id)).filter(Case.review_status == "REVIEWED").scalar() or 0

    agreed = (
        db.query(func.count(Case.id))
        .filter(Case.human_decision == "AGREE_WITH_AI")
        .scalar()
        or 0
    )
    disagreed = (
        db.query(func.count(Case.id))
        .filter(Case.human_decision == "DISAGREE_WITH_AI")
        .scalar()
        or 0
    )
    needs_review = (
        db.query(func.count(Case.id))
        .filter(Case.human_decision == "NEEDS_FURTHER_REVIEW")
        .scalar()
        or 0
    )

    high = db.query(func.count(Case.id)).filter(Case.priority == "HIGH").scalar() or 0
    medium = db.query(func.count(Case.id)).filter(Case.priority == "MEDIUM").scalar() or 0
    low = db.query(func.count(Case.id)).filter(Case.priority == "LOW").scalar() or 0

    # Confidence distribution
    conf_rows = (
        db.query(Case.confidence, func.count(Case.id))
        .group_by(Case.confidence)
        .all()
    )
    conf_dict = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for k, v in conf_rows:
        if k in conf_dict:
            conf_dict[k] = v

    return AnalyticsSummary(
        total_cases=total,
        normal_cases=normal,
        pneumonia_cases=pneumonia,
        pending_reviews=pending,
        reviewed_cases=reviewed,
        agreed_with_ai=agreed,
        disagreed_with_ai=disagreed,
        needs_further_review=needs_review,
        high_priority_cases=high,
        medium_priority_cases=medium,
        low_priority_cases=low,
        prediction_distribution={"NORMAL": normal, "PNEUMONIA": pneumonia},
        confidence_distribution=conf_dict,
        priority_distribution={"HIGH": high, "MEDIUM": medium, "LOW": low},
    )
