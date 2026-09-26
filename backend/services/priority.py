"""Case priority service.

Priority helps organize the human-review workflow queue.
It is NOT a clinical severity score and NOT a medical risk score.
"""
from __future__ import annotations

import logging
from typing import Literal

from config import settings
from models.schemas import ImageQuality

logger = logging.getLogger("xray_squared.priority")

Priority = Literal["HIGH", "MEDIUM", "LOW"]


def compute_priority(
    prediction: str,
    score: float,
    confidence: str,
    quality: ImageQuality,
) -> Priority:
    """Compute a workflow priority for a case.

    Rules (configurable via thresholds in .env):
      - Pneumonia-suspected + high model score        -> HIGH
      - Pneumonia-suspected + medium model score      -> MEDIUM (or HIGH if quality poor)
      - Normal + low model score                      -> LOW (or MEDIUM if quality poor)
      - Any case with POOR image quality              -> at least MEDIUM (flag for review)
      - Low-confidence cases                          -> at least MEDIUM

    Returns "HIGH" | "MEDIUM" | "LOW".
    """
    poor_quality = quality.status == "POOR"
    warning_quality = quality.status == "WARNING"
    low_conf = confidence == "LOW"
    med_conf = confidence == "MEDIUM"

    # Pneumonia-suspected cases
    if prediction == "PNEUMONIA":
        if score >= settings.HIGH_CONFIDENCE_THRESHOLD:
            return "HIGH"
        if score >= settings.MEDIUM_CONFIDENCE_THRESHOLD:
            # Medium score — escalate if quality is poor
            return "HIGH" if poor_quality else "MEDIUM"
        # Low score on a pneumonia-suspected case = uncertain
        return "MEDIUM"

    # Normal cases
    if score < settings.MEDIUM_CONFIDENCE_THRESHOLD:
        # Low model score on normal — uncertain normal, flag for review
        return "HIGH" if poor_quality else "MEDIUM"

    # Confident normal
    if poor_quality:
        return "MEDIUM"
    if warning_quality or low_conf or med_conf:
        return "MEDIUM"
    return "LOW"
