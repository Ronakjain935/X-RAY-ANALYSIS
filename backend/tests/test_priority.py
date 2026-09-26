"""Unit tests for workflow priority computation."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.schemas import ImageQuality
from services.priority import compute_priority


def _make_quality(status="GOOD") -> ImageQuality:
    return ImageQuality(
        status=status,
        brightness=status,
        contrast=status,
        resolution=status,
        sharpness=status,
    )


def test_priority_pneumonia_high_score():
    q = _make_quality("GOOD")
    prio = compute_priority(prediction="PNEUMONIA", score=0.92, confidence="HIGH", quality=q)
    assert prio == "HIGH"


def test_priority_pneumonia_medium_score():
    q_good = _make_quality("GOOD")
    prio = compute_priority(prediction="PNEUMONIA", score=0.65, confidence="MEDIUM", quality=q_good)
    assert prio == "MEDIUM"

    q_poor = _make_quality("POOR")
    prio_poor = compute_priority(prediction="PNEUMONIA", score=0.65, confidence="MEDIUM", quality=q_poor)
    assert prio_poor == "HIGH"


def test_priority_pneumonia_low_score():
    q = _make_quality("GOOD")
    # Low score on pneumonia prediction (uncertain)
    prio = compute_priority(prediction="PNEUMONIA", score=0.45, confidence="LOW", quality=q)
    assert prio == "MEDIUM"


def test_priority_normal_low_score_uncertain():
    q = _make_quality("GOOD")
    prio = compute_priority(prediction="NORMAL", score=0.45, confidence="LOW", quality=q)
    assert prio == "MEDIUM"


def test_priority_normal_confident():
    q_good = _make_quality("GOOD")
    prio = compute_priority(prediction="NORMAL", score=0.85, confidence="HIGH", quality=q_good)
    assert prio == "LOW"

    q_warning = _make_quality("WARNING")
    prio_warn = compute_priority(prediction="NORMAL", score=0.85, confidence="HIGH", quality=q_warning)
    assert prio_warn == "MEDIUM"
