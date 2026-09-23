"""AI-assisted case report generation.

The report is a structured JSON object containing all case information
plus an explicit disclaimer. The frontend can render it however it likes.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from models.case import Case
from models.schemas import (
    CaseReport,
    ImageQuality,
)


DISCLAIMER = (
    "This platform provides AI-assisted screening support for research and "
    "educational purposes. It does not provide a medical diagnosis and does "
    "not replace qualified medical professionals. Final clinical decisions "
    "must be made by a qualified healthcare professional."
)


def build_report(case: Case, gradcam_url: Optional[str] = None) -> CaseReport:
    """Build an AI-assisted case report from a Case row."""
    quality = ImageQuality(
        status=case.quality_status,
        brightness=case.brightness_status,
        contrast=case.contrast_status,
        resolution=case.resolution_status,
    )

    return CaseReport(
        case_id=case.case_id,
        filename=case.filename,
        created_at=case.created_at,
        ai_prediction=case.prediction,  # type: ignore[arg-type]
        model_score=case.score,
        prototype_confidence=case.confidence,  # type: ignore[arg-type]
        uncertainty=case.uncertainty,
        image_quality=quality,
        gradcam_available=bool(case.gradcam_path),
        workflow_priority=case.priority,  # type: ignore[arg-type]
        review_status=case.review_status,  # type: ignore[arg-type]
        human_decision=case.human_decision,  # type: ignore[arg-type]
        reviewer_notes=case.reviewer_notes,
        reviewer_name=case.reviewer_name,
        reviewed_at=case.reviewed_at,
        disclaimer=DISCLAIMER,
    )


def build_text_report(report: CaseReport) -> str:
    """Build a plain-text version of the report (used for .txt download)."""
    lines = [
        "X-RAY SQUARED — AI-Assisted Case Report",
        "========================================",
        "",
        f"Case ID:              {report.case_id}",
        f"Filename:             {report.filename}",
        f"Generated:            {datetime.utcnow().isoformat()}Z",
        "",
        f"AI Prediction:        {report.ai_prediction}",
        f"Model Score:          {report.model_score:.2f}  (NOT a calibrated probability)",
        f"Prototype Confidence: {report.prototype_confidence}",
        f"Uncertainty:          {report.uncertainty:.2f}  (1 - max(probabilities))",
        f"Workflow Priority:    {report.workflow_priority}",
        "",
        "Image Quality:",
        f"  Overall:    {report.image_quality.status}",
        f"  Brightness: {report.image_quality.brightness}",
        f"  Contrast:   {report.image_quality.contrast}",
        f"  Resolution: {report.image_quality.resolution}",
        "",
        f"Grad-CAM Available:   {report.gradcam_available}",
        f"Review Status:        {report.review_status}",
        f"Human Decision:       {report.human_decision or '(none)'}",
    ]
    if report.reviewer_name:
        lines.append(f"Reviewer Name:        {report.reviewer_name}")
    if report.reviewed_at:
        lines.append(f"Reviewed At:          {report.reviewed_at.isoformat()}Z")
    if report.reviewer_notes:
        lines.append("")
        lines.append("Reviewer Notes:")
        lines.append(f"  {report.reviewer_notes}")

    lines.extend(
        [
            "",
            "Disclaimer:",
            f"  {report.disclaimer}",
            "",
        ]
    )
    return "\n".join(lines)
