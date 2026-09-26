"""Basic prototype image quality check.

This is NOT a clinically validated X-ray quality model. It performs simple
heuristic checks on resolution, brightness and contrast so the UI can flag
obviously problematic uploads for human review.
"""
from __future__ import annotations

import logging
from typing import Literal

import numpy as np
from PIL import Image

from config import settings
from models.schemas import ImageQuality

logger = logging.getLogger("xray_squared.quality")

QualityStatus = Literal["GOOD", "WARNING", "POOR"]


# Tunable heuristic thresholds (NOT clinically calibrated)
MIN_RESOLUTION_PX = 200       # Below this, mark as WARNING
MIN_BRIGHTNESS_MEAN = 40      # Below this, image is too dark
MAX_BRIGHTNESS_MEAN = 220     # Above this, image is too bright
MIN_CONTRAST_STD = 25         # Below this, image is too flat


def _check_resolution(img: Image.Image) -> QualityStatus:
    w, h = img.size
    min_dim = min(w, h)
    if min_dim < MIN_RESOLUTION_PX:
        return "POOR"
    if min_dim < 500:
        return "WARNING"
    return "GOOD"


def _check_brightness(gray: np.ndarray) -> QualityStatus:
    mean = float(gray.mean())
    if mean < 20 or mean > 240:
        return "POOR"
    if mean < MIN_BRIGHTNESS_MEAN or mean > MAX_BRIGHTNESS_MEAN:
        return "WARNING"
    return "GOOD"


def _check_contrast(gray: np.ndarray) -> QualityStatus:
    std = float(gray.std())
    if std < 10:
        return "POOR"
    if std < MIN_CONTRAST_STD:
        return "WARNING"
    return "GOOD"


def _check_sharpness(gray: np.ndarray) -> tuple[QualityStatus, float]:
    """Check image sharpness using Laplacian variance.

    Prototype heuristic:
      - variance < BLUR_THRESHOLD_POOR -> POOR
      - variance < BLUR_THRESHOLD_WARNING -> WARNING
      - else -> GOOD

    NOTE: This is a prototype heuristic. The threshold values must be validated
    against a clinically verified chest X-ray dataset before any diagnostic use.
    """
    try:
        import cv2
        lap = cv2.Laplacian(gray.astype(np.float64), cv2.CV_64F)
        var = float(lap.var())
    except Exception:
        # Fallback 2D convolution with 3x3 Laplacian kernel
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        h, w = gray.shape
        kh, kw = kernel.shape
        # Simple valid convolution
        sub_matrices = np.lib.stride_tricks.sliding_window_view(gray, (kh, kw))
        lap = np.einsum('ijkl,kl->ij', sub_matrices, kernel)
        var = float(lap.var())

    if var < settings.BLUR_THRESHOLD_POOR:
        status: QualityStatus = "POOR"
    elif var < settings.BLUR_THRESHOLD_WARNING:
        status = "WARNING"
    else:
        status = "GOOD"
    return status, round(var, 2)


def _aggregate(
    brightness: QualityStatus,
    contrast: QualityStatus,
    resolution: QualityStatus,
    sharpness: QualityStatus,
) -> QualityStatus:
    """Overall quality = the worst of the four checks."""
    rank = {"GOOD": 0, "WARNING": 1, "POOR": 2}
    worst = max(brightness, contrast, resolution, sharpness, key=lambda s: rank[s])
    return worst  # type: ignore[return-value]


def assess_quality(img: Image.Image) -> ImageQuality:
    """Run prototype quality checks on a PIL image.

    Returns an ImageQuality schema. The 'visibility' field from the frontend
    is approximated by contrast for now (a real QC model would replace this).
    """
    try:
        gray = np.array(img.convert("L"), dtype=np.float32)
        brightness = _check_brightness(gray)
        contrast = _check_contrast(gray)
        resolution = _check_resolution(img)
        sharpness, sharpness_value = _check_sharpness(gray)
        status = _aggregate(brightness, contrast, resolution, sharpness)

        # Numeric values for the UI to display.
        brightness_value = round(float(gray.mean()), 2)
        contrast_value = round(float(gray.std()), 2)
        resolution_value = f"{img.size[0]}x{img.size[1]}"

        note = None
        if status == "POOR":
            note = (
                "Image quality may affect AI analysis. "
                "Human review is recommended."
            )
        elif status == "WARNING":
            if sharpness == "WARNING":
                note = "Image sharpness is borderline; please review fine details carefully."
            else:
                note = "Prototype quality check flagged a minor concern."

        return ImageQuality(
            status=status,
            brightness=brightness,
            contrast=contrast,
            resolution=resolution,
            sharpness=sharpness,
            brightness_value=brightness_value,
            contrast_value=contrast_value,
            resolution_value=resolution_value,
            sharpness_value=sharpness_value,
            note=note,
        )
    except Exception:  # pragma: no cover
        logger.exception("Quality check failed")
        # Fail-safe: mark as WARNING rather than block analysis
        return ImageQuality(
            status="WARNING",
            brightness="WARNING",
            contrast="WARNING",
            resolution="WARNING",
            sharpness="WARNING",
        )
