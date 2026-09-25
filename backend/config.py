# Internal config module — reads from environment / .env
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend/ directory (one level up from this file).
# override=True so backend's .env takes precedence over any inherited env
# (e.g., the Next.js project's DATABASE_URL must not leak in here).
load_dotenv(Path(__file__).resolve().parent / ".env", override=False)


# Set Keras backend to PyTorch before any keras import
os.environ.setdefault("KERAS_BACKEND", "torch")


class Settings:
    """Application settings (read from environment variables)."""

    # Model paths
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        "models/S_RAY_Pneumonia_Model.keras"
        if (Path(__file__).resolve().parent / "models" / "S_RAY_Pneumonia_Model.keras").exists()
        else "trained_models/pneumonia_resnet18_best.pth",
    )
    GATE_MODEL_PATH: str = os.getenv(
        "GATE_MODEL_PATH",
        "models/S_RAY_Xray_Gate.keras",
    )
    CONFIG_PATH: str = os.getenv("CONFIG_PATH", "../s_ray_config.json")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./xray_squared.db")

    # Directories
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    RESULT_DIR: str = os.getenv("RESULT_DIR", "results")

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]

    # Confidence thresholds
    HIGH_CONFIDENCE_THRESHOLD: float = float(os.getenv("HIGH_CONFIDENCE_THRESHOLD", "0.80"))
    MEDIUM_CONFIDENCE_THRESHOLD: float = float(os.getenv("MEDIUM_CONFIDENCE_THRESHOLD", "0.60"))

    # S_RAY model thresholds
    PNEUMONIA_THRESHOLD: float = float(os.getenv("PNEUMONIA_THRESHOLD", "0.50"))
    XRAY_THRESHOLD: float = float(os.getenv("XRAY_THRESHOLD", "0.70"))

    # Upload limit
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10"))

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "10000"))

    @property
    def BACKEND_ROOT(self) -> Path:
        # config.py lives at backend/config.py, so backend/ is its parent.
        return Path(__file__).resolve().parent

    @property
    def MODEL_ABS_PATH(self) -> Path:
        p = Path(self.MODEL_PATH)
        if not p.is_absolute():
            p = self.BACKEND_ROOT / p
        return p

    @property
    def GATE_MODEL_ABS_PATH(self) -> Path:
        p = Path(self.GATE_MODEL_PATH)
        if not p.is_absolute():
            p = self.BACKEND_ROOT / p
        return p

    @property
    def CONFIG_ABS_PATH(self) -> Path:
        p = Path(self.CONFIG_PATH)
        if not p.is_absolute():
            p = (self.BACKEND_ROOT / p).resolve()
        return p

    def ensure_directories(self) -> None:
        """Create upload / result / model directories if missing."""
        for d in (self.UPLOAD_DIR, self.RESULT_DIR, "trained_models", "models"):
            p = Path(d)
            if not p.is_absolute():
                p = self.BACKEND_ROOT / p
            p.mkdir(parents=True, exist_ok=True)


settings = Settings()
