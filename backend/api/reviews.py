"""PATCH /api/cases/{case_id}/review"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.case import Case
from models.database import get_db
from models.schemas import ReviewRequest, CaseDetail, ImageQuality
from .cases import _case_to_detail

logger = logging.getLogger("xray_squared.api.reviews")

router = APIRouter()


@router.patch(
    "/api/cases/{case_id}/review",
    response_model=CaseDetail,
    tags=["Review"],
    summary="Submit human review for a case",
    description=(
        "The human review is the FINAL review status. The AI cannot override it. "
        "Allowed decisions: AGREE_WITH_AI, DISAGREE_WITH_AI, NEEDS_FURTHER_REVIEW."
    ),
)
def submit_review(case_id: str, body: ReviewRequest, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail={"error": "CASE_NOT_FOUND", "message": f"Case {case_id} not found."},
        )

    case.human_decision = body.human_decision
    case.reviewer_notes = body.reviewer_notes
    case.reviewer_name = body.reviewer_name
    case.review_status = "REVIEWED"
    case.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(case)
    return _case_to_detail(case)
