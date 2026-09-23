"""Image preprocessing for ResNet18 inference.

Preprocessing MUST match what was used during training:
  1. Convert to RGB
  2. Resize to 224x224
  3. Convert to tensor (scale to [0,1])
  4. Normalize with ImageNet mean/std
  5. Add batch dimension

No augmentation at inference time.
"""
from __future__ import annotations

from io import BytesIO
from typing import Tuple

import numpy as np
from PIL import Image

# ImageNet normalization
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

MODEL_INPUT_SIZE: Tuple[int, int] = (224, 224)  # (width, height)


def preprocess_image(image: Image.Image) -> "torch.Tensor":  # type: ignore[name-defined]
    """Preprocess a PIL image into a normalized tensor ready for ResNet18.

    Returns a tensor of shape (1, 3, 224, 224).
    """
    import torch
    from torchvision import transforms

    transform = transforms.Compose(
        [
            transforms.Resize(MODEL_INPUT_SIZE),       # Resize to 224x224
            transforms.ToTensor(),                     # PIL -> tensor [0,1]
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )

    # Ensure RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    tensor = transform(image).unsqueeze(0)  # Add batch dim -> (1, 3, 224, 224)
    return tensor


def preprocess_image_keras(image: Image.Image) -> "torch.Tensor":  # type: ignore[name-defined]
    """Preprocess a PIL image into a channels-last tensor ready for Keras models.

    Returns a tensor of shape (1, 224, 224, 3) with float32 values [0..255].
    The internal Keras EfficientNet layers handle scaling and normalization.
    """
    import torch

    img_rgb = image.convert("RGB").resize(MODEL_INPUT_SIZE)
    arr = np.array(img_rgb, dtype=np.float32)
    return torch.from_numpy(arr).unsqueeze(0)


def preprocess_for_gradcam(image: Image.Image, is_keras: bool = True) -> Tuple["torch.Tensor", np.ndarray]:  # type: ignore[name-defined]
    """Preprocess and also return the original 224x224 RGB numpy array (0..255).

    The numpy array is used for the Grad-CAM overlay base.
    """
    import torch

    # For Grad-CAM we also need the resized RGB image as numpy
    img_rgb = image.convert("RGB").resize(MODEL_INPUT_SIZE)
    np_image = np.array(img_rgb, dtype=np.uint8)  # (224, 224, 3)

    if is_keras:
        tensor = torch.from_numpy(np_image.astype(np.float32)).unsqueeze(0)
    else:
        tensor = preprocess_image(img_rgb)
    return tensor, np_image
