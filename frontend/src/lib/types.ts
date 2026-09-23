// Core domain types for X-RAY SQUARED
// These describe the data contracts used by both the UI and the (future) FastAPI backend.

export type PageKey =
  | "dashboard"
  | "analyze"
  | "cases"
  | "history"
  | "reports"
  | "analytics"
  | "how-it-works"
  | "about"
  | "settings"
  | "help";

export type Prediction = "NORMAL" | "PNEUMONIA";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export type QualityStatus = "GOOD" | "MODERATE" | "POOR" | "WARNING";

export type ReviewStatus = "PENDING" | "REVIEWED";

export type ReviewDecision = "AGREE" | "DISAGREE" | "NEEDS_REVIEW";

export interface ImageQuality {
  status: QualityStatus;
  brightness: QualityStatus;
  contrast: QualityStatus;
  resolution: QualityStatus;
  visibility?: QualityStatus;
  // Optional numeric metrics from backend (prototype — NOT clinically calibrated)
  brightness_value?: number;
  contrast_value?: number;
  resolution_value?: string;
  note?: string;
}

export interface Probabilities {
  NORMAL: number;
  PNEUMONIA: number;
}

export interface HumanReviewInfo {
  required: boolean;
  decision?: ReviewDecision | "AGREE_WITH_AI" | "DISAGREE_WITH_AI" | "NEEDS_FURTHER_REVIEW" | null;
  notes?: string | null;
}

export interface XRayCase {
  caseId: string;
  date: string; // ISO string
  prediction: Prediction;
  score: number; // 0..1 raw model score
  confidence: ConfidenceLevel;
  uncertainty?: number; // 0..1, prototype indicator
  probabilities?: Probabilities;
  priority: Priority;
  quality: ImageQuality;
  reviewStatus: ReviewStatus;
  reviewDecision?: ReviewDecision;
  reviewerNotes?: string;
  gradcamAvailable: boolean;
  gradcamUrl?: string; // Full URL or path to Grad-CAM image
  // For demo preview only — base64 or URL of the source X-ray image
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface AnalysisResponse {
  case_id: string;
  filename?: string;
  prediction: Prediction;
  score: number;
  confidence: ConfidenceLevel;
  uncertainty?: number;
  priority: Priority;
  quality: ImageQuality;
  probabilities?: Probabilities;
  gradcam_url: string | null;
  review_status?: ReviewStatus;
  human_review?: HumanReviewInfo;
}

export interface BatchAnalysisItem {
  filename: string;
  result: AnalysisResponse | null;
  error?: string;
}

export interface BatchAnalysisResponse {
  batch_id: string;
  results: BatchAnalysisItem[];
}

// ---------- Backend case list / detail ----------
// These match the FastAPI schemas in backend/models/schemas.py.

export interface BackendCaseBrief {
  case_id: string;
  filename: string;
  prediction: Prediction;
  score: number;
  confidence: ConfidenceLevel;
  uncertainty: number;
  priority: Priority;
  review_status: ReviewStatus;
  human_decision?: "AGREE_WITH_AI" | "DISAGREE_WITH_AI" | "NEEDS_FURTHER_REVIEW" | null;
  created_at: string;
}

export interface BackendCaseDetail extends BackendCaseBrief {
  quality: ImageQuality;
  probabilities?: Probabilities | null;
  gradcam_url?: string | null;
  original_image_url?: string | null;
  reviewer_notes?: string | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  updated_at: string;
}

export interface BackendCaseListResponse {
  total: number;
  page: number;
  page_size: number;
  cases: BackendCaseBrief[];
}

export interface BackendReviewRequest {
  human_decision: "AGREE_WITH_AI" | "DISAGREE_WITH_AI" | "NEEDS_FURTHER_REVIEW";
  reviewer_notes?: string | null;
  reviewer_name?: string | null;
}

export interface BackendAnalyticsSummary {
  total_cases: number;
  normal_cases: number;
  pneumonia_cases: number;
  pending_reviews: number;
  reviewed_cases: number;
  agreed_with_ai: number;
  disagreed_with_ai: number;
  needs_further_review: number;
  high_priority_cases: number;
  medium_priority_cases: number;
  low_priority_cases: number;
  prediction_distribution: Record<string, number>;
  confidence_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
}

export interface BackendCaseReport {
  case_id: string;
  filename: string;
  created_at: string;
  ai_prediction: Prediction;
  model_score: number;
  prototype_confidence: ConfidenceLevel;
  uncertainty: number;
  image_quality: ImageQuality;
  gradcam_available: boolean;
  workflow_priority: Priority;
  review_status: ReviewStatus;
  human_decision?: "AGREE_WITH_AI" | "DISAGREE_WITH_AI" | "NEEDS_FURTHER_REVIEW" | null;
  reviewer_notes?: string | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  disclaimer: string;
}

// ---------- Convenience labels ----------
export const PREDICTION_LABEL: Record<Prediction, string> = {
  NORMAL: "Normal",
  PNEUMONIA: "Pneumonia Suspected",
};

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "High Priority",
  MEDIUM: "Medium Priority",
  LOW: "Low Priority",
};

export const REVIEW_DECISION_LABEL: Record<ReviewDecision, string> = {
  AGREE: "Agreed with AI",
  DISAGREE: "Disagreed with AI",
  NEEDS_REVIEW: "Needs Further Review",
};
