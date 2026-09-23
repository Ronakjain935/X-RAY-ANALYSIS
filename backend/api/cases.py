"""GET /api/cases  +  GET /api/cases/{id}  +  DELETE /api/cases/{id}"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config import settings
from models.case import Case
from models.database import get_db
from models.schemas import CaseBrief, CaseDetail, CaseListResponse, ImageQuality

logger = logging.getLogger("xray_squared.api.cases")

router = APIRouter()


def _case_to_brief(c: Case) -> CaseBrief:
    return CaseBrief(
        case_id=c.case_id,
        filename=c.filename,
        prediction=c.prediction,
        score=c.score,
        confidence=c.confidence,
        uncertainty=c.uncertainty,
        priority=c.priority,
        review_status=c.review_status,
        human_decision=c.human_decision,
        created_at=c.created_at,
    )


def _case_to_detail(c: Case) -> CaseDetail:
    quality = ImageQuality(
        status=c.quality_status,
        brightness=c.brightness_status,
        contrast=c.contrast_status,
        resolution=c.resolution_status,
    )
    probabilities = None
    if c.prob_normal is not None and c.prob_pneumonia is not None:
        from models.schemas import Probabilities

        probabilities = Probabilities(
            NORMAL=c.prob_normal, PNEUMONIA=c.prob_pneumonia
        )
    gradcam_url = None
    if c.gradcam_path:
        gradcam_url = f"/results/{Path(c.gradcam_path).name}"
    original_url = None
    if c.original_image_path:
        original_url = f"/uploads/{Path(c.original_image_path).name}"
    return CaseDetail(
        case_id=c.case_id,
        filename=c.filename,
        prediction=c.prediction,
        score=c.score,
        confidence=c.confidence,
        uncertainty=c.uncertainty,
        priority=c.priority,
        review_status=c.review_status,
        human_decision=c.human_decision,
        created_at=c.created_at,
        quality=quality,
        probabilities=probabilities,
        gradcam_url=gradcam_url,
        original_image_url=original_url,
        reviewer_notes=c.reviewer_notes,
        reviewer_name=c.reviewer_name,
        reviewed_at=c.reviewed_at,
        updated_at=c.updated_at,
    )


@router.get(
    "/api/cases",
    response_model=CaseListResponse,
    tags=["Cases"],
    summary="List cases with pagination and filters",
)
def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    prediction: Optional[str] = Query(None, description="Filter by NORMAL | PNEUMONIA"),
    priority: Optional[str] = Query(None, description="Filter by HIGH | MEDIUM | LOW"),
    review_status: Optional[str] = Query(None, description="Filter by PENDING | REVIEWED"),
    db: Session = Depends(get_db),
):
    """Return paginated cases with optional filters."""
    q = db.query(Case)
    if prediction:
        q = q.filter(Case.prediction == prediction.upper())
    if priority:
        q = q.filter(Case.priority == priority.upper())
    if review_status:
        q = q.filter(Case.review_status == review_status.upper())

    total = q.count()
    rows = (
        q.order_by(Case.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return CaseListResponse(
        total=total,
        page=page,
        page_size=page_size,
        cases=[_case_to_brief(c) for c in rows],
    )


@router.get(
    "/api/cases/{case_id}",
    response_model=CaseDetail,
    tags=["Cases"],
    summary="Get full case detail",
)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail={"error": "CASE_NOT_FOUND", "message": f"Case {case_id} not found."},
        )
    return _case_to_detail(case)


@router.delete(
    "/api/cases/{case_id}",
    tags=["Cases"],
    summary="Delete a case and its files",
)
def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail={"error": "CASE_NOT_FOUND", "message": f"Case {case_id} not found."},
        )

    # Safely delete associated files
    for path_attr in ("original_image_path", "gradcam_path"):
        p = getattr(case, path_attr, None)
        if not p:
            continue
        try:
            full = Path(p)
            if not full.is_absolute():
                full = settings.BACKEND_ROOT / full
            if full.exists() and full.is_file():
                # Make sure we're not deleting outside upload/result dirs
                uploads_root = (settings.BACKEND_ROOT / settings.UPLOAD_DIR).resolve()
                results_root = (settings.BACKEND_ROOT / settings.RESULT_DIR).resolve()
                if (
                    str(full.resolve()).startswith(str(uploads_root))
                    or str(full.resolve()).startswith(str(results_root))
                ):
                    full.unlink()
        except Exception:
            logger.exception("Failed to delete file %s", p)

    db.delete(case)
    db.commit()
    return {"status": "deleted", "case_id": case_id}
