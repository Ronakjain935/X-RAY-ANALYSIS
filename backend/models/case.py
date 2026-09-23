"""Case ORM model."""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text

from .database import Base


class Case(Base):
    """A single chest X-ray analysis case."""

    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True, nullable=False)  # e.g. XR-000001
    filename = Column(String, nullable=False)

    # File paths (relative to backend/ for portability)
    original_image_path = Column(String, nullable=False)
    gradcam_path = Column(String, nullable=True)

    # AI output
    prediction = Column(String, nullable=False)  # NORMAL | PNEUMONIA
    score = Column(Float, nullable=False)         # raw model score (0..1)
    confidence = Column(String, nullable=False)  # HIGH | MEDIUM | LOW
    uncertainty = Column(Float, nullable=False, default=0.0)  # 1 - max(prob)
    prob_normal = Column(Float, nullable=True)   # P(NORMAL)
    prob_pneumonia = Column(Float, nullable=True)  # P(PNEUMONIA)
    priority = Column(String, nullable=False)    # HIGH | MEDIUM | LOW

    # Image quality
    quality_status = Column(String, nullable=False)   # GOOD | WARNING | POOR
    brightness_status = Column(String, nullable=False)
    contrast_status = Column(String, nullable=False)
    resolution_status = Column(String, nullable=False)

    # Human review
    review_status = Column(String, nullable=False, default="PENDING")  # PENDING | REVIEWED
    human_decision = Column(String, nullable=True)  # AGREE_WITH_AI | DISAGREE_WITH_AI | NEEDS_FURTHER_REVIEW
    reviewer_notes = Column(Text, nullable=True)
    reviewer_name = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Case {self.case_id} {self.prediction} score={self.score}>"
