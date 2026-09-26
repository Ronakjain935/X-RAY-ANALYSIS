"""Case ORM model."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Case(Base):
    """A single chest X-ray analysis case."""

    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # e.g. XR-000001
    filename: Mapped[str] = mapped_column(String, nullable=False)

    # File paths (relative to backend/ for portability)
    original_image_path: Mapped[str] = mapped_column(String, nullable=False)
    gradcam_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # AI output
    prediction: Mapped[str] = mapped_column(String, nullable=False)  # NORMAL | PNEUMONIA
    score: Mapped[float] = mapped_column(Float, nullable=False)         # raw model score (0..1)
    confidence: Mapped[str] = mapped_column(String, nullable=False)  # HIGH | MEDIUM | LOW
    uncertainty: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # 1 - max(prob)
    prob_normal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)   # P(NORMAL)
    prob_pneumonia: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # P(PNEUMONIA)
    priority: Mapped[str] = mapped_column(String, nullable=False)    # HIGH | MEDIUM | LOW

    # Image quality
    quality_status: Mapped[str] = mapped_column(String, nullable=False)   # GOOD | WARNING | POOR
    brightness_status: Mapped[str] = mapped_column(String, nullable=False)
    contrast_status: Mapped[str] = mapped_column(String, nullable=False)
    resolution_status: Mapped[str] = mapped_column(String, nullable=False)
    sharpness_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Human review
    review_status: Mapped[str] = mapped_column(String, nullable=False, default="PENDING")  # PENDING | REVIEWED
    human_decision: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # AGREE_WITH_AI | DISAGREE_WITH_AI | NEEDS_FURTHER_REVIEW
    reviewer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Case {self.case_id} {self.prediction} score={self.score}>"
