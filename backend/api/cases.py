"""GET /api/cases  +  GET /api/cases/{id}  +  DELETE /api/cases/{id}"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config import settings
from models.case import Case
from models.database import get_db
from models.schemas import CaseBrief, CaseDetail, CaseListResponse, ImageQuality

logger = logging.getLogger("xray_squared.api.cases")

router = APIRouter()


def _case_to_brief(c: Case) -> CaseBrief:
    return CaseBrief.model_validate(c)


def _case_to_detail(c: Case) -> CaseDetail:
    obj: Any = c
    quality = ImageQuality(
        status=obj.quality_status,
        brightness=obj.brightness_status,
        contrast=obj.contrast_status,
        resolution=obj.resolution_status,
        sharpness=getattr(c, "sharpness_status", None),
    )
    probabilities = None
    if obj.prob_normal is not None and obj.prob_pneumonia is not None:
        from models.schemas import Probabilities

        probabilities = Probabilities(
            NORMAL=obj.prob_normal, PNEUMONIA=obj.prob_pneumonia
        )
    gradcam_url = None
    if obj.gradcam_path:
        gradcam_url = f"/results/{Path(str(obj.gradcam_path)).name}"
    original_url = None
    if obj.original_image_path:
        original_url = f"/uploads/{Path(str(obj.original_image_path)).name}"
    return CaseDetail(
        case_id=obj.case_id,
        filename=obj.filename,
        prediction=obj.prediction,
        score=obj.score,
        confidence=obj.confidence,
        uncertainty=obj.uncertainty,
        priority=obj.priority,
        review_status=obj.review_status,
        human_decision=obj.human_decision,
        created_at=obj.created_at,
        quality=quality,
        probabilities=probabilities,
        gradcam_url=gradcam_url,
        original_image_url=original_url,
        reviewer_notes=obj.reviewer_notes,
        reviewer_name=obj.reviewer_name,
        reviewed_at=obj.reviewed_at,
        updated_at=obj.updated_at,
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
