"""Pydantic schemas for request/response validation."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# ---------- Enums ----------

PredictionType = Literal["NORMAL", "PNEUMONIA"]
ConfidenceType = Literal["HIGH", "MEDIUM", "LOW"]
PriorityType = Literal["HIGH", "MEDIUM", "LOW"]
QualityStatusType = Literal["GOOD", "WARNING", "POOR"]
ReviewStatusType = Literal["PENDING", "REVIEWED"]
HumanDecisionType = Literal["AGREE_WITH_AI", "DISAGREE_WITH_AI", "NEEDS_FURTHER_REVIEW"]


# ---------- Image quality ----------

class ImageQuality(BaseModel):
    status: QualityStatusType
    brightness: QualityStatusType
    contrast: QualityStatusType
    resolution: QualityStatusType
    sharpness: Optional[QualityStatusType] = None
    # Prototype numeric metrics — useful for the UI to show actual numbers.
    # NOT clinically calibrated.
    brightness_value: Optional[float] = None
    contrast_value: Optional[float] = None
    resolution_value: Optional[str] = None
    sharpness_value: Optional[float] = None
    note: Optional[str] = None


# ---------- Probabilities ----------

class Probabilities(BaseModel):
    """Per-class model output. Each value is in [0, 1] and the two values
    sum to 1.0. NOT medically calibrated probabilities."""
    NORMAL: float
    PNEUMONIA: float


# ---------- Human review ----------

class HumanReviewInfo(BaseModel):
    """Subset of review info returned with the analyze response."""
    required: bool = True
    decision: Optional[HumanDecisionType] = None
    notes: Optional[str] = None


# ---------- Analyze response ----------

class AnalyzeResponse(BaseModel):
    case_id: str
    filename: str
    prediction: PredictionType
    score: float = Field(..., description="Raw model score in [0, 1]. NOT a calibrated probability.")
    confidence: ConfidenceType
    uncertainty: float = Field(..., description="1 - max(probs). Prototype uncertainty indicator; NOT a clinical metric.")
    priority: PriorityType
    quality: ImageQuality
    probabilities: Probabilities
    gradcam_url: Optional[str] = Field(None, description="URL to Grad-CAM image (or null if unavailable)")
    review_status: ReviewStatusType = "PENDING"
    human_review: HumanReviewInfo = Field(default_factory=HumanReviewInfo)


class BatchAnalyzeItem(BaseModel):
    filename: str
    result: Optional[AnalyzeResponse] = None
    error: Optional[str] = None


class BatchAnalyzeResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: list[BatchAnalyzeItem]


# ---------- Review ----------

class ReviewRequest(BaseModel):
    human_decision: HumanDecisionType
    reviewer_notes: Optional[str] = None
    reviewer_name: Optional[str] = None


# ---------- Case list / detail ----------

class CaseBrief(BaseModel):
    case_id: str
    filename: str
    prediction: PredictionType
    score: float
    confidence: ConfidenceType
    uncertainty: float = 0.0
    priority: PriorityType
    review_status: ReviewStatusType
    human_decision: Optional[HumanDecisionType] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CaseDetail(CaseBrief):
    quality: ImageQuality
    probabilities: Optional[Probabilities] = None
    gradcam_url: Optional[str] = None
    original_image_url: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CaseListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    cases: list[CaseBrief]


# ---------- Analytics ----------

class AnalyticsSummary(BaseModel):
    total_cases: int
    normal_cases: int
    pneumonia_cases: int
    pending_reviews: int
    reviewed_cases: int
    agreed_with_ai: int
    disagreed_with_ai: int
    needs_further_review: int
    high_priority_cases: int
    medium_priority_cases: int
    low_priority_cases: int
    prediction_distribution: dict[str, int]
    confidence_distribution: dict[str, int]
    priority_distribution: dict[str, int]


# ---------- Report ----------

class CaseReport(BaseModel):
    case_id: str
    filename: str
    created_at: datetime
    ai_prediction: PredictionType
    model_score: float
    prototype_confidence: ConfidenceType
    uncertainty: float = 0.0
    image_quality: ImageQuality
    gradcam_available: bool
    workflow_priority: PriorityType
    review_status: ReviewStatusType
    human_decision: Optional[HumanDecisionType] = None
    reviewer_notes: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    disclaimer: str


# ---------- Health ----------

class HealthResponse(BaseModel):
    status: Literal["ok"]
    model_available: bool


# ---------- Errors ----------

class ErrorResponse(BaseModel):
    error: str
    message: str
