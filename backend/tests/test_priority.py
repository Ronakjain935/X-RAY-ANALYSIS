"""Unit tests for workflow priority computation."""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path for standalone and pytest runs
backend_path = str(Path(__file__).resolve().parent.parent)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from models.schemas import ImageQuality, QualityStatusType  # noqa: E402
from services.priority import compute_priority  # noqa: E402


def _make_quality(status: QualityStatusType = "GOOD") -> ImageQuality:
    return ImageQuality(
        status=status,
        brightness=status,
        contrast=status,
        resolution=status,
        sharpness=status,
    )


def test_priority_pneumonia_high_score():
    q = _make_quality("GOOD")
    prio = compute_priority(
        prediction="PNEUMONIA", score=0.92, confidence="HIGH", quality=q
    )
    assert prio == "HIGH"


def test_priority_pneumonia_medium_score():
    q_good = _make_quality("GOOD")
    prio = compute_priority(
        prediction="PNEUMONIA", score=0.65, confidence="MEDIUM", quality=q_good
    )
    assert prio == "MEDIUM"

    q_poor = _make_quality("POOR")
    prio_poor = compute_priority(
        prediction="PNEUMONIA", score=0.65, confidence="MEDIUM", quality=q_poor
    )
    assert prio_poor == "HIGH"


def test_priority_pneumonia_low_score():
    q = _make_quality("GOOD")
    # Low score on pneumonia prediction (uncertain)
    prio = compute_priority(
        prediction="PNEUMONIA", score=0.45, confidence="LOW", quality=q
    )
    assert prio == "MEDIUM"


def test_priority_normal_low_score_uncertain():
    q = _make_quality("GOOD")
    prio = compute_priority(
        prediction="NORMAL", score=0.45, confidence="LOW", quality=q
    )
    assert prio == "MEDIUM"

    q_poor = _make_quality("POOR")
    prio_poor = compute_priority(
        prediction="NORMAL", score=0.45, confidence="LOW", quality=q_poor
    )
    assert prio_poor == "HIGH"


def test_priority_normal_confident():
    q_good = _make_quality("GOOD")
    prio = compute_priority(
        prediction="NORMAL", score=0.85, confidence="HIGH", quality=q_good
    )
    assert prio == "LOW"

    q_warning = _make_quality("WARNING")
    prio_warn = compute_priority(
        prediction="NORMAL", score=0.85, confidence="HIGH", quality=q_warning
    )
    assert prio_warn == "MEDIUM"

    q_poor = _make_quality("POOR")
    prio_poor = compute_priority(
        prediction="NORMAL", score=0.85, confidence="HIGH", quality=q_poor
    )
    assert prio_poor == "MEDIUM"

    prio_low_conf = compute_priority(
        prediction="NORMAL", score=0.85, confidence="LOW", quality=q_good
    )
    assert prio_low_conf == "MEDIUM"

    prio_med_conf = compute_priority(
        prediction="NORMAL", score=0.85, confidence="MEDIUM", quality=q_good
    )
    assert prio_med_conf == "MEDIUM"
