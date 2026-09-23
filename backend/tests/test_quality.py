"""Tests for image quality service."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from PIL import Image

from services.image_quality import assess_quality


def _make_image(size=(512, 512), color=128, noise=30) -> Image.Image:
    """Create a synthetic test image."""
    arr = np.full((size[1], size[0]), color, dtype=np.uint8)
    if noise > 0:
        rng = np.random.default_rng(42)
        arr = np.clip(arr + rng.integers(-noise, noise, size=arr.shape), 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode="L").convert("RGB")


def test_good_quality_image():
    img = _make_image(size=(1024, 1024), color=128, noise=40)
    q = assess_quality(img)
    assert q.status in ("GOOD", "WARNING")  # Allow some tolerance
    assert q.brightness in ("GOOD", "WARNING")
    assert q.contrast in ("GOOD", "WARNING")
    assert q.resolution == "GOOD"


def test_low_resolution_image_flagged():
    img = _make_image(size=(100, 100), color=128, noise=40)
    q = assess_quality(img)
    # 100px is below MIN_RESOLUTION_PX=200
    assert q.resolution == "POOR"
    assert q.status == "POOR"


def test_too_dark_image_flagged():
    # Pure black image — mean brightness = 0
    arr = np.zeros((512, 512, 3), dtype=np.uint8)
    img = Image.fromarray(arr, mode="RGB")
    q = assess_quality(img)
    assert q.brightness == "POOR"


def test_too_bright_image_flagged():
    # Pure white image — mean brightness = 255
    arr = np.full((512, 512, 3), 255, dtype=np.uint8)
    img = Image.fromarray(arr, mode="RGB")
    q = assess_quality(img)
    assert q.brightness == "POOR"


def test_low_contrast_image_flagged():
    # Flat grey image — std=0
    arr = np.full((512, 512, 3), 128, dtype=np.uint8)
    img = Image.fromarray(arr, mode="RGB")
    q = assess_quality(img)
    assert q.contrast == "POOR"
