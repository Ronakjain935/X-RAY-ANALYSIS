"""Model loading + prediction service supporting S_RAY Keras and PyTorch models.

Design:
  - Supports .keras models (S_RAY EfficientNetB0 Pneumonia Model + X-ray Gate)
    running via Keras 3 with PyTorch backend.
  - Supports .pth models (ResNet18) for backwards compatibility.
  - Model is loaded lazily on startup/first prediction.
  - If model file is missing, reports model_available=False and /api/analyze returns HTTP 503.
  - The backend itself stays healthy and serves other endpoints.

Class mapping:
    0 -> NORMAL
    1 -> PNEUMONIA
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Literal, Optional, Tuple

# Ensure Keras backend is torch before importing keras
os.environ.setdefault("KERAS_BACKEND", "torch")

from config import settings
from models.schemas import PredictionType

logger = logging.getLogger("xray_squared.prediction")

# Fixed class mapping
CLASS_NAMES: dict[int, PredictionType] = {0: "NORMAL", 1: "PNEUMONIA"}
NUM_CLASSES: int = 2

# Global model cache
_model_cache: dict[str, Any] = {
    "model": None,
    "gate_model": None,
    "model_type": None,  # "keras" or "torch"
    "device": None,
    "loaded": False,
    "available": None,  # None = not yet checked
    "gate_available": False,
    "error": None,
    "pneumonia_threshold": 0.5,
    "xray_threshold": 0.7,
}


class ModelNotAvailableError(RuntimeError):
    """Raised when the trained model file is not present."""


def _load_s_ray_config() -> None:
    """Load s_ray_config.json if available to read thresholds and classes."""
    cfg_path = settings.CONFIG_ABS_PATH
    if cfg_path.exists():
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            _model_cache["pneumonia_threshold"] = float(cfg.get("pneumonia_threshold", 0.5))
            _model_cache["xray_threshold"] = float(cfg.get("xray_threshold", 0.7))
            logger.info(
                "Loaded S_RAY config: pneumonia_threshold=%.2f, xray_threshold=%.2f",
                _model_cache["pneumonia_threshold"],
                _model_cache["xray_threshold"],
            )
        except Exception as e:
            logger.warning("Could not read s_ray_config.json: %s", e)


def _build_resnet18(num_classes: int = NUM_CLASSES):
    """Build a fresh ResNet18 with num_classes output features."""
    import torch
    from torchvision import models

    model = models.resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = torch.nn.Linear(in_features, num_classes)
    return model


def _select_device() -> "torch.device":  # type: ignore[name-defined]
    import torch

    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _load_state_dict_flexible(path: Path) -> dict:
    """Load a PyTorch state_dict from a .pth file."""
    import torch

    obj = torch.load(path, map_location="cpu", weights_only=False)
    if isinstance(obj, dict):
        for key in ("state_dict", "model_state_dict", "model"):
            if key in obj and isinstance(obj[key], dict):
                logger.info("Loaded state_dict from checkpoint key '%s'", key)
                return obj[key]
        return obj
    raise ModelNotAvailableError(f"Unexpected checkpoint format at {path}")


def load_model(force: bool = False) -> None:
    """Load the model into cache. Safe to call multiple times.

    Supports both .keras (Keras 3 on PyTorch) and .pth (PyTorch ResNet18).
    Also loads the S_RAY X-ray Gate model if available.
    """
    if _model_cache["loaded"] and not force:
        return

    _load_s_ray_config()
    model_path = settings.MODEL_ABS_PATH

    # If configured path doesn't exist, check fallback
    if not model_path.exists():
        keras_fallback = settings.BACKEND_ROOT / "models" / "S_RAY_Pneumonia_Model.keras"
        pth_fallback = settings.BACKEND_ROOT / "trained_models" / "pneumonia_resnet18_best.pth"
        if keras_fallback.exists():
            model_path = keras_fallback
        elif pth_fallback.exists():
            model_path = pth_fallback
        else:
            logger.warning("Model file not found at %s", model_path)
            _model_cache.update(
                model=None,
                gate_model=None,
                device=None,
                loaded=True,
                available=False,
                error=f"Model file not found: {model_path}",
            )
            return

    # Check for .keras model
    if model_path.suffix.lower() == ".keras":
        try:
            import torch
            import keras

            device = _select_device()
            logger.info("Loading Keras model from %s...", model_path)
            model = keras.models.load_model(str(model_path))

            # Also attempt to load Gate model
            gate_model = None
            gate_available = False
            gate_path = settings.GATE_MODEL_ABS_PATH
            if not gate_path.exists():
                alt_gate = settings.BACKEND_ROOT / "models" / "S_RAY_Xray_Gate.keras"
                if alt_gate.exists():
                    gate_path = alt_gate

            if gate_path.exists():
                try:
                    logger.info("Loading S_RAY X-Ray Gate model from %s...", gate_path)
                    gate_model = keras.models.load_model(str(gate_path))
                    gate_available = True
                    logger.info("S_RAY X-Ray Gate model loaded successfully.")
                except Exception as ge:
                    logger.warning("Failed to load gate model: %s", ge)

            _model_cache.update(
                model=model,
                gate_model=gate_model,
                model_type="keras",
                device=device,
                loaded=True,
                available=True,
                gate_available=gate_available,
                error=None,
            )
            logger.info("S_RAY Keras model loaded successfully on device=%s", device)
            return
        except Exception as e:
            logger.exception("Failed to load Keras model")
            _model_cache.update(
                model=None,
                gate_model=None,
                device=None,
                loaded=True,
                available=False,
                error=str(e),
            )
            return

    # Otherwise load PyTorch .pth model
    try:
        import torch

        device = _select_device()
        model = _build_resnet18(NUM_CLASSES)
        state_dict = _load_state_dict_flexible(model_path)
        cleaned = {
            (k[7:] if k.startswith("module.") else k): v
            for k, v in state_dict.items()
        }
        model.load_state_dict(cleaned)
        model.eval()
        model.to(device)

        _model_cache.update(
            model=model,
            gate_model=None,
            model_type="torch",
            device=device,
            loaded=True,
            available=True,
            gate_available=False,
            error=None,
        )
        logger.info("PyTorch ResNet18 model loaded successfully on device=%s", device)
    except Exception as e:
        logger.exception("Failed to load PyTorch model")
        _model_cache.update(
            model=None,
            gate_model=None,
            device=None,
            loaded=True,
            available=False,
            error=str(e),
        )


def model_available() -> bool:
    """True iff the trained model is available and loaded successfully."""
    if _model_cache["available"] is None:
        load_model()
    return bool(_model_cache["available"])


def is_keras_model() -> bool:
    """True if active model is a Keras model."""
    if _model_cache["available"] is None:
        load_model()
    return _model_cache.get("model_type") == "keras"


def model_status() -> dict:
    """Return a status dict for health checks / debugging."""
    if _model_cache["available"] is None:
        load_model()
    return {
        "available": bool(_model_cache["available"]),
        "model_type": _model_cache["model_type"],
        "gate_available": bool(_model_cache["gate_available"]),
        "device": str(_model_cache["device"]) if _model_cache["device"] else None,
        "error": _model_cache["error"],
        "model_path": str(settings.MODEL_ABS_PATH),
        "pneumonia_threshold": _model_cache.get("pneumonia_threshold", 0.5),
        "xray_threshold": _model_cache.get("xray_threshold", 0.7),
    }


def validate_chest_xray(pil_img, tensor=None) -> Tuple[bool, str, float]:
    """Strictly validate that an image is a genuine chest X-ray radiograph.

    Checks:
      1. Chromaticity & color variance (photos of people, scenery, objects have high color deviation).
      2. Radiographic density & contrast distribution (rejects plain documents, solid white/black, flat graphics).
      3. AI X-Ray Gate Model (S_RAY_Xray_Gate.keras) feature space validation.

    Returns:
        (is_xray: bool, reason: str, confidence: float in [0, 1])
    """
    import numpy as np

    # 1. Chromatic check: genuine chest X-rays are monochromatic/radiographic
    rgb = np.array(pil_img.convert("RGB"), dtype=np.float32)
    mean_dev = float((
        np.abs(rgb[:, :, 0] - rgb[:, :, 1]).mean()
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2]).mean()
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2]).mean()
    ) / 3.0)
    color_complexity = float(
        np.std(rgb[:, :, 0] - rgb[:, :, 1])
        + np.std(rgb[:, :, 0] - rgb[:, :, 2])
        + np.std(rgb[:, :, 1] - rgb[:, :, 2])
    )

    if mean_dev > 10.0 or color_complexity > 50.0:
        return (
            False,
            "Color photograph detected. Chest X-rays are monochromatic radiographs.",
            0.0,
        )

    # 2. Radiographic density & contrast check
    gray = np.array(pil_img.convert("L"), dtype=np.float32)
    mean_val = float(gray.mean())
    std_val = float(gray.std())
    if mean_val > 230 or mean_val < 15:
        return False, "Image lacks radiographic density variation.", 0.0
    if std_val < 18:
        return False, "Image has insufficient radiographic contrast.", 0.0

    # 3. AI Gate model evaluation (if available)
    if _model_cache.get("gate_model") is not None and tensor is not None:
        try:
            gate_model = _model_cache["gate_model"]
            device = _model_cache["device"]
            x = tensor.to(device)
            import torch

            with torch.no_grad():
                out = gate_model(x, training=False)
                gate_score = float(out[0, 0].detach().cpu().item())

            # In S_RAY gate model, genuine chest X-rays produce score <= 0.40.
            # Non-X-rays (documents, portraits, noise) produce score >= 0.45.
            if gate_score > 0.42:
                conf = max(0.0, round((0.65 - gate_score) / 0.25, 2))
                return (
                    False,
                    f"AI X-ray Gate identified non-chest-X-ray pattern (gate score: {gate_score:.3f}).",
                    conf,
                )

            conf = min(1.0, max(0.70, round(1.0 - (gate_score - 0.30), 2)))
            return True, f"Verified chest X-ray (confidence: {int(conf * 100)}%).", conf
        except Exception as e:
            logger.warning("Gate model inference error: %s", e)

    return True, "Verified radiographic characteristics.", 0.85


def check_xray_gate(tensor, pil_img=None) -> Tuple[bool, float]:
    """Check if image is a chest X-Ray using radiographic validation and gate model.

    Returns:
        (is_xray: bool, score: float in [0, 1])
    """
    if pil_img is not None:
        valid, _, conf = validate_chest_xray(pil_img, tensor)
        return valid, conf

    if not model_available() or not _model_cache["gate_available"]:
        return True, 1.0

    gate_model = _model_cache["gate_model"]
    device = _model_cache["device"]
    x = tensor.to(device)

    try:
        import torch

        with torch.no_grad():
            out = gate_model(x, training=False)
            gate_score = float(out[0, 0].detach().cpu().item())
            is_xray = gate_score <= 0.42
            conf = min(1.0, max(0.0, round(1.0 - (gate_score - 0.30), 2))) if is_xray else 0.0
            return is_xray, conf
    except Exception as e:
        logger.warning("X-ray gate check failed: %s", e)
        return True, 1.0


def predict(tensor) -> Tuple[PredictionType, float, float, float]:
    """Run inference on a preprocessed input tensor.

    Returns:
        (prediction_label, score, prob_normal, prob_pneumonia)
    """
    import torch

    if not model_available():
        raise ModelNotAvailableError(
            "The trained pneumonia model is not available."
        )

    model = _model_cache["model"]
    device = _model_cache["device"]
    model_type = _model_cache["model_type"]
    tensor = tensor.to(device)

    if model_type == "keras":
        with torch.no_grad():
            out = model(tensor, training=False)
            prob_pneumonia = float(out[0, 0].detach().cpu().item())
            prob_pneumonia = max(0.0, min(1.0, prob_pneumonia))
            prob_normal = max(0.0, min(1.0, 1.0 - prob_pneumonia))

        threshold = float(_model_cache.get("pneumonia_threshold", 0.5))
        label: PredictionType = "PNEUMONIA" if prob_pneumonia >= threshold else "NORMAL"
        return label, round(prob_pneumonia, 4), round(prob_normal, 4), round(prob_pneumonia, 4)

    # Standard PyTorch ResNet18 inference
    with torch.no_grad():
        logits = model(tensor)  # (1, 2)
        probs = torch.softmax(logits, dim=1)
        prob_normal = float(probs[0, 0].cpu().item())
        prob_pneumonia = float(probs[0, 1].cpu().item())

    label_pt: PredictionType = "PNEUMONIA" if prob_pneumonia >= 0.5 else "NORMAL"
    return label_pt, round(prob_pneumonia, 4), round(prob_normal, 4), round(prob_pneumonia, 4)
