"""Image upload validation."""
from __future__ import annotations

from io import BytesIO
from typing import Tuple

from PIL import Image, UnidentifiedImageError

from config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIMES = {"image/jpeg", "image/jpg", "image/png"}

# Reasonable dimension limits (px)
MIN_DIMENSION = 64
MAX_DIMENSION = 4096


class InvalidImageError(Exception):
    """Raised when an uploaded file fails validation."""


def validate_image_file(filename: str, content: bytes, content_type: str | None = None) -> Tuple[str, Image.Image]:
    """Validate an uploaded image file.

    Returns: (extension, PIL.Image) — extension is normalized to lowercase with dot.

    Raises InvalidImageError on any failure.
    """
    if not filename:
        raise InvalidImageError("Filename is required.")

    # 1. Extension check
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidImageError(
            f"Unsupported file type '{ext or 'none'}'. Allowed: JPG, JPEG, PNG."
        )

    # 2. MIME check (best effort — browsers send this, but don't trust blindly)
    if content_type and content_type not in ALLOWED_MIMES:
        raise InvalidImageError(
            f"Unsupported MIME type '{content_type}'. Allowed: image/jpeg, image/png."
        )

    # 3. Size check
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise InvalidImageError(
            f"File too large: {size_mb:.2f}MB. Max allowed: {settings.MAX_UPLOAD_MB}MB."
        )
    if len(content) == 0:
        raise InvalidImageError("Empty file.")

    # 4. Readable image check
    try:
        img = Image.open(BytesIO(content))
        img.verify()  # Verify it's a real image (does not load pixel data)
    except UnidentifiedImageError as e:
        raise InvalidImageError("File is not a valid image (corrupted or unsupported).") from e
    except Exception as e:  # pragma: no cover
        raise InvalidImageError(f"Image verification failed: {e}") from e

    # Re-open for actual pixel access (verify() invalidates the image)
    img = Image.open(BytesIO(content))

    # 5. Dimension check
    w, h = img.size
    if w < MIN_DIMENSION or h < MIN_DIMENSION:
        raise InvalidImageError(
            f"Image dimensions too small: {w}x{h}. Minimum: {MIN_DIMENSION}px."
        )
    if w > MAX_DIMENSION or h > MAX_DIMENSION:
        raise InvalidImageError(
            f"Image dimensions too large: {w}x{h}. Maximum: {MAX_DIMENSION}px."
        )

    return ext, img
