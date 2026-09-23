"""POST /api/analyze  +  POST /api/analyze-batch"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session

from config import settings
from models.database import get_db
from models.schemas import (
    AnalyzeResponse,
    BatchAnalyzeItem,
    BatchAnalyzeResponse,
    HumanReviewInfo,
    Probabilities,
)
from services import prediction, preprocessing, gradcam, image_quality, priority
from utils.file_utils import safe_filename, save_upload
from utils.validation import validate_image_file, InvalidImageError
from ._helpers import next_case_id, confidence_from_score

logger = logging.getLogger("xray_squared.api.analyze")

router = APIRouter()


def _process_single_image(
    db: Session,
    filename: str,
    content: bytes,
    content_type: Optional[str],
    reviewer_name: Optional[str] = None,
) -> AnalyzeResponse:
    """Validate, save, analyze, persist and return response for one image."""

    # 1. Validate the upload
    try:
        ext, pil_img = validate_image_file(filename, content, content_type)
    except InvalidImageError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_IMAGE", "message": str(e)},
        )

    # 2. Check model availability BEFORE doing any work
    if not prediction.model_available():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "MODEL_NOT_AVAILABLE",
                "message": (
                    "The trained pneumonia model is not available. "
                    "Please place pneumonia_resnet18_best.pth inside trained_models/."
                ),
            },
        )

    # 3. Save the upload with a safe filename
    safe_name = safe_filename(filename, ext)
    rel_path = save_upload(content, safe_name)

    # 4. Image quality (prototype heuristic — NOT clinical QC)
    quality = image_quality.assess_quality(pil_img)

    # 5. Preprocess for the model + Grad-CAM
    is_keras = prediction.is_keras_model()
    tensor, np_image = preprocessing.preprocess_for_gradcam(pil_img, is_keras=is_keras)

    # 5b. Strict Chest X-Ray Gate validation (reject non-X-rays, selfies, photos, documents)
    is_xray, reason, xray_conf = prediction.validate_chest_xray(pil_img, tensor)
    if not is_xray:
        logger.warning(
            "Rejected non-chest-X-ray upload '%s': %s (confidence: %.2f)",
            filename,
            reason,
            xray_conf,
        )
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NOT_AN_XRAY",
                "message": (
                    f"Uploaded image is not a valid chest X-ray ({reason}). "
                    "Only chest X-ray radiographs are accepted for analysis."
                ),
            },
        )

    # 6. Run model prediction
    try:
        label, score, prob_normal, prob_pneumonia = prediction.predict(tensor)
    except prediction.ModelNotAvailableError:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "MODEL_NOT_AVAILABLE",
                "message": "The trained pneumonia model is not available.",
            },
        )
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500,
            detail={"error": "PREDICTION_FAILED", "message": str(e)},
        )

    # 7. Confidence (prototype thresholds, NOT clinically calibrated)
    confidence = confidence_from_score(
        score,
        settings.HIGH_CONFIDENCE_THRESHOLD,
        settings.MEDIUM_CONFIDENCE_THRESHOLD,
    )

    # 8. Uncertainty (1 - max(prob)) — prototype indicator, NOT a clinical metric.
    uncertainty = round(1.0 - max(prob_normal, prob_pneumonia), 4)

    # 9. Workflow priority (NOT clinical severity)
    prio = priority.compute_priority(label, score, confidence, quality)

    # 10. Grad-CAM (best-effort — analysis still succeeds if it fails)
    gradcam_url: Optional[str] = None
    gradcam_rel_path: Optional[str] = None
    case_id = next_case_id(db)
    try:
        heatmap = gradcam.generate_gradcam(
            tensor, target_class_idx=1 if label == "PNEUMONIA" else 0
        )
        if heatmap is not None:
            gradcam_filename = f"{case_id}-gradcam.png"
            gradcam_out = Path(settings.RESULT_DIR) / gradcam_filename
            gradcam.save_gradcam_overlay(np_image, heatmap, gradcam_out)
            gradcam_rel_path = str(gradcam_out).replace("\\", "/")
            gradcam_url = f"/results/{gradcam_filename}"
    except Exception:
        logger.exception("Grad-CAM failed (continuing without it)")

    # 11. Persist the case
    from models.case import Case

    case = Case(
        case_id=case_id,
        filename=filename,
        original_image_path=rel_path,
        gradcam_path=gradcam_rel_path,
        prediction=label,
        score=score,
        confidence=confidence,
        uncertainty=uncertainty,
        prob_normal=prob_normal,
        prob_pneumonia=prob_pneumonia,
        priority=prio,
        quality_status=quality.status,
        brightness_status=quality.brightness,
        contrast_status=quality.contrast,
        resolution_status=quality.resolution,
        review_status="PENDING",
        reviewer_name=reviewer_name,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    return AnalyzeResponse(
        case_id=case.case_id,
        filename=case.filename,
        prediction=case.prediction,  # type: ignore[arg-type]
        score=case.score,
        confidence=case.confidence,  # type: ignore[arg-type]
        uncertainty=uncertainty,
        priority=case.priority,  # type: ignore[arg-type]
        quality=quality,
        probabilities=Probabilities(NORMAL=prob_normal, PNEUMONIA=prob_pneumonia),
        gradcam_url=gradcam_url,
        review_status="PENDING",
        human_review=HumanReviewInfo(required=True),
    )


@router.post(
    "/api/analyze",
    response_model=AnalyzeResponse,
    tags=["Analyze"],
    summary="Analyze a single chest X-ray",
    description=(
        "Accepts a JPG/JPEG/PNG chest X-ray image, runs the AI model, generates "
        "Grad-CAM, computes priority and persists the case. Returns HTTP 503 if "
        "the trained model is not available."
    ),
)
async def analyze(
    file: UploadFile = File(...),
    reviewer_name: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Analyze a single chest X-ray image."""
    content = await file.read()
    return _process_single_image(
        db=db,
        filename=file.filename or "upload.jpg",
        content=content,
        content_type=file.content_type,
        reviewer_name=reviewer_name,
    )


@router.post(
    "/api/analyze-batch",
    response_model=BatchAnalyzeResponse,
    tags=["Analyze"],
    summary="Analyze multiple chest X-rays",
    description=(
        "Accepts multiple image files. Each file is processed independently; "
        "one invalid file does not crash the batch. Each successful result has "
        "its own case_id."
    ),
)
async def analyze_batch(files: List[UploadFile] = File(...)):
    """Analyze multiple chest X-ray images."""
    from models.database import SessionLocal

    if not files:
        raise HTTPException(
            status_code=400,
            detail={"error": "NO_FILES", "message": "No files uploaded."},
        )

    results: List[BatchAnalyzeItem] = []
    successful = 0
    failed = 0

    for f in files:
        try:
            content = await f.read()
            db = SessionLocal()
            try:
                resp = _process_single_image(
                    db=db,
                    filename=f.filename or "upload.jpg",
                    content=content,
                    content_type=f.content_type,
                )
                results.append(
                    BatchAnalyzeItem(filename=f.filename or "upload.jpg", result=resp)
                )
                successful += 1
            finally:
                db.close()
        except HTTPException as e:
            results.append(
                BatchAnalyzeItem(
                    filename=f.filename or "upload.jpg",
                    error=str(e.detail) if e.detail else str(e.status_code),
                )
            )
            failed += 1
        except Exception as e:  # pragma: no cover
            logger.exception("Batch item failed")
            results.append(
                BatchAnalyzeItem(filename=f.filename or "upload.jpg", error=str(e))
            )
            failed += 1

    return BatchAnalyzeResponse(
        total=len(files),
        successful=successful,
        failed=failed,
        results=results,
    )
