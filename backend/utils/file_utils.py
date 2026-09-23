"""File handling helpers."""
from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import Optional

from config import settings


def ensure_dirs() -> None:
    """Create upload / result / model dirs if missing."""
    settings.ensure_directories()


def safe_filename(original: str, ext: str = ".jpg") -> str:
    """Generate a safe random filename, preserving extension.

    Args:
        original: The user-provided filename (used only to derive extension).
        ext: Fallback extension if original has none.
    """
    if "." in original:
        ext = "." + original.rsplit(".", 1)[-1].lower()
    # Force safe extensions only
    if ext.lower() not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"
    return f"{secrets.token_hex(8)}{ext}"


def save_upload(data: bytes, filename: str, subfolder: str = "") -> str:
    """Save raw bytes into UPLOAD_DIR/subfolder/filename.

    Returns the relative path (from backend root) that can be stored in DB.
    """
    base = Path(settings.UPLOAD_DIR)
    if subfolder:
        base = base / subfolder
    base.mkdir(parents=True, exist_ok=True)
    target = base / filename
    # Prevent path traversal — filename must be a bare name
    if os.path.commonpath([str(target.resolve()), str(base.resolve())]) != str(base.resolve()):
        raise ValueError("Unsafe filename (path traversal attempt)")
    target.write_bytes(data)
    # Return path relative to backend root for storage / serving
    return str(target).replace("\\", "/")
