"""GET /api/cases/{case_id}/report"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.case import Case
from models.database import get_db
from models.schemas import CaseReport
from services.report import build_report, build_text_report

logger = logging.getLogger("xray_squared.api.reports")

router = APIRouter()


@router.get(
    "/api/cases/{case_id}/report",
    response_model=CaseReport,
    tags=["Reports"],
    summary="Get the AI-assisted case report (JSON)",
)
def get_report(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail={"error": "CASE_NOT_FOUND", "message": f"Case {case_id} not found."},
        )
    return build_report(case)


@router.get(
    "/api/cases/{case_id}/report.txt",
    tags=["Reports"],
    summary="Download the AI-assisted case report as plain text",
)
def get_report_text(case_id: str, db: Session = Depends(get_db)):
    from fastapi.responses import PlainTextResponse

    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail={"error": "CASE_NOT_FOUND", "message": f"Case {case_id} not found."},
        )
    report = build_report(case)
    text = build_text_report(report)
    return PlainTextResponse(
        content=text,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={case_id}-report.txt"},
    )
