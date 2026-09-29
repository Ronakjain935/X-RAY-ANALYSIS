"""Grad-CAM visualization service for ResNet18.

Grad-CAM highlights image regions that most influenced the model prediction.
It is a model interpretability tool — it does NOT prove the presence of disease.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

from . import prediction

logger = logging.getLogger("xray_squared.gradcam")


def _find_target_layer(model, is_keras: bool = False):
    """Find the target convolutional layer for Grad-CAM.

    For Keras EfficientNetB0, target 'top_activation' (or penultimate layer).
    For ResNet18, target 'layer4[-1]' (the last residual block).
    """
    if is_keras:
        try:
            eff = model.get_layer("efficientnetb0")
            return eff.get_layer("top_activation")
        except Exception:
            return model.layers[-3] if len(model.layers) >= 3 else model.layers[-1]
    return model.layer4[-1]


def generate_gradcam(
    input_tensor,
    target_class_idx: Optional[int] = None,
) -> Optional[np.ndarray]:
    """Generate a Grad-CAM heatmap for the given input tensor.

    Supports both Keras EfficientNetB0 (channels-last) and ResNet18 (channels-first).

    Args:
        input_tensor: preprocessed (1, 224, 224, 3) or (1, 3, 224, 224) tensor
        target_class_idx: class index (0=NORMAL, 1=PNEUMONIA). If None, inferred
            from model prediction.

    Returns:
        heatmap as a (224, 224) float32 array in [0, 1], or None on failure.
    """
    import torch
    import torch.nn.functional as F

    if not prediction.model_available():
        logger.warning("Grad-CAM requested but model not available")
        return None

    model = prediction._model_cache["model"]
    device = prediction._model_cache["device"]

    if not isinstance(input_tensor, torch.Tensor):
        input_tensor = torch.from_numpy(np.asarray(input_tensor, dtype=np.float32))

    input_tensor = input_tensor.to(device).clone().detach().requires_grad_(True)
    is_keras = prediction.is_keras_model()

    # Hook storage
    activations: dict = {}
    gradients: dict = {}

    def forward_hook(_module, _input, output):
        activations["value"] = output

    def backward_hook(_module, _grad_input, _grad_output):
        gradients["value"] = _grad_output[0]

    target_layer = _find_target_layer(model, is_keras=is_keras)
    h_fwd = None
    h_bwd = None

    try:
        h_fwd = target_layer.register_forward_hook(forward_hook)
        h_bwd = target_layer.register_full_backward_hook(backward_hook)

        if is_keras:
            output = model(input_tensor)  # (1, 1) sigmoid score
            if target_class_idx is None:
                thresh = float(prediction._model_cache.get("pneumonia_threshold", 0.5))
                target_class_idx = 1 if float(output[0, 0].item()) >= thresh else 0

            model.zero_grad()
            if target_class_idx == 0:
                # Target NORMAL
                score = 1.0 - output[0, 0]
            else:
                # Target PNEUMONIA
                score = output[0, 0]
            score.backward(retain_graph=False)
        else:
            output = model(input_tensor)  # (1, 2)
            if target_class_idx is None:
                target_class_idx = int(output.argmax(dim=1).item())

            model.zero_grad()
            one_hot = torch.zeros_like(output)
            one_hot[0, target_class_idx] = 1.0
            output.backward(gradient=one_hot, retain_graph=False)

        if "value" not in activations or "value" not in gradients:
            logger.warning("Grad-CAM hooks did not fire")
            return None

        acts = activations["value"]
        grads = gradients["value"]

        if is_keras:
            # Channels-last: (1, H, W, C) = (1, 7, 7, 1280)
            weights = grads.mean(dim=(1, 2), keepdim=True)
            cam = (weights * acts).sum(dim=-1, keepdim=True)
            cam = F.relu(cam).squeeze().detach().cpu().numpy()  # (H, W)
        else:
            # Channels-first: (1, C, H, W)
            weights = grads.mean(dim=(2, 3), keepdim=True)
            cam = (weights * acts).sum(dim=1, keepdim=True)
            cam = F.relu(cam).squeeze().detach().cpu().numpy()  # (H, W)

        # Normalize to [0, 1]
        cam_max = float(cam.max())
        if cam_max > 0:
            cam = cam / cam_max
        else:
            cam = np.zeros_like(cam)

        # Resize to input size (224x224) using modern Pillow Resampling filter
        cam_img = Image.fromarray((np.clip(cam, 0, 1) * 255).astype(np.uint8))
        cam_img = cam_img.resize((224, 224), Image.Resampling.BILINEAR)
        cam = np.array(cam_img).astype(np.float32) / 255.0
        return cam
    except Exception:
        logger.exception("Grad-CAM generation failed")
        return None
    finally:
        if h_fwd is not None:
            h_fwd.remove()
        if h_bwd is not None:
            h_bwd.remove()


def save_gradcam_overlay(
    original_np: np.ndarray,
    heatmap: np.ndarray,
    output_path: Path,
) -> Path:
    """Save a Grad-CAM overlay image to disk.

    Args:
        original_np: (224, 224, 3) uint8 RGB original (or grayscale/any size)
        heatmap: (224, 224) float32 in [0, 1]
        output_path: where to save the PNG

    Returns the output_path.
    """
    import cv2

    # Ensure heatmap is 2D uint8
    heatmap_uint8 = (np.clip(heatmap, 0, 1) * 255).astype(np.uint8)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    base = original_np.copy()
    if base.dtype != np.uint8:
        base = np.clip(base, 0, 255).astype(np.uint8)

    # Convert grayscale to 3-channel RGB if needed
    if len(base.shape) == 2:
        base = cv2.cvtColor(base, cv2.COLOR_GRAY2RGB)
    elif len(base.shape) == 3 and base.shape[2] == 1:
        base = cv2.cvtColor(base, cv2.COLOR_GRAY2RGB)

    # Match base spatial dimensions to heatmap if they differ
    h_h, h_w = heatmap_color.shape[:2]
    if base.shape[:2] != (h_h, h_w):
        base = cv2.resize(base, (h_w, h_h), interpolation=cv2.INTER_AREA)

    # Blend with original (50/50)
    overlay = cv2.addWeighted(base, 0.5, heatmap_color, 0.5, 0)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(overlay).save(str(output_path), format="PNG")
    return output_path
