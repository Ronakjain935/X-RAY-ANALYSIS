// API service abstraction for X-RAY SQUARED.
//
// The UI talks ONLY to this module. Two modes:
//
//   1. LIVE mode  — when NEXT_PUBLIC_API_URL is set AND the backend is reachable.
//                   Real FastAPI + PyTorch predictions are returned.
//
//   2. DEMO mode  — when no NEXT_PUBLIC_API_URL is set OR the backend is unreachable.
//                   Clearly labeled DEMO data is shown in the UI.
//
// To enable LIVE mode, create a .env.local file in the project root with:
//
//     NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
//
// Then restart `npm run dev`.
//
// Expected backend endpoints (see backend/README.md):
//   POST /api/analyze        (multipart/form-data, single image, field name: "file")
//   POST /api/analyze-batch  (multipart/form-data, multiple images)
//   GET  /api/cases
//   GET  /api/cases/{id}
//   PATCH /api/cases/{id}/review
//   GET  /api/cases/{id}/report
//   GET  /api/analytics/summary
//   GET  /health

import type {
  AnalysisResponse,
  BatchAnalysisResponse,
  Probabilities,
  BackendCaseListResponse,
  BackendCaseDetail,
  BackendReviewRequest,
  BackendAnalyticsSummary,
  BackendCaseReport,
} from "@/lib/types";
import { generateCaseId } from "@/lib/demo-data";

// ---------- Configuration ----------

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

// Demo mode is active only when no API URL is configured or backend is in demo mode.

// ---------- Error types ----------

export class ApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class ModelNotAvailableError extends ApiError {
  constructor(message = "Trained model not available.") {
    super(message, 503, "MODEL_NOT_AVAILABLE");
    this.name = "ModelNotAvailableError";
  }
}

// ---------- Mock helpers (DEMO mode only) ----------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function deriveConfidence(score: number) {
  if (score >= 0.8) return "HIGH" as const;
  if (score >= 0.6) return "MEDIUM" as const;
  return "LOW" as const;
}

function derivePriority(score: number, confidence: string) {
  if (score >= 0.7) return "HIGH" as const;
  if (score >= 0.45 || confidence === "LOW") return "MEDIUM" as const;
  return "LOW" as const;
}

async function mockAnalyze(file: File): Promise<AnalysisResponse> {
  await sleep(1200 + Math.random() * 900);

  const seedStr = `${file.name}:${file.size}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
  }
  const rand = Math.abs(Math.sin(hash)) % 1;

  const isPneumonia = rand > 0.45;
  const pneumoniaProb = isPneumonia ? 0.55 + rand * 0.4 : 0.05 + rand * 0.3;
  const normalProb = 1 - pneumoniaProb;
  const score = Math.round(pneumoniaProb * 100) / 100;
  const confidence = deriveConfidence(score);
  const priority = derivePriority(score, confidence);
  const uncertainty = Math.round((1 - Math.max(pneumoniaProb, normalProb)) * 100) / 100;

  const qualityRoll = Math.abs(Math.cos(hash)) % 1;
  const qualityStatus = qualityRoll > 0.85 ? "POOR" : qualityRoll > 0.65 ? "MODERATE" : "GOOD";
  const brightnessStatus =
    qualityRoll > 0.85 ? "POOR" : qualityRoll > 0.65 ? "MODERATE" : "GOOD";
  const contrastStatus = qualityRoll > 0.9 ? "MODERATE" : "GOOD";
  const resolutionStatus = "GOOD";

  const caseId = generateCaseId();

  return {
    case_id: caseId,
    filename: file.name,
    prediction: isPneumonia ? "PNEUMONIA" : "NORMAL",
    score,
    confidence: confidence as AnalysisResponse["confidence"],
    uncertainty,
    priority: priority as AnalysisResponse["priority"],
    quality: {
      status: qualityStatus as AnalysisResponse["quality"]["status"],
      brightness: brightnessStatus as AnalysisResponse["quality"]["brightness"],
      contrast: contrastStatus as AnalysisResponse["quality"]["contrast"],
      resolution: resolutionStatus as AnalysisResponse["quality"]["resolution"],
      visibility: brightnessStatus as AnalysisResponse["quality"]["brightness"],
      brightness_value: 80 + (hash % 140),
      contrast_value: 30 + (hash % 50),
      resolution_value: "1024x1024",
      note:
        qualityStatus === "POOR"
          ? "Image quality may affect AI analysis. Human review is recommended."
          : undefined,
    },
    probabilities: {
      NORMAL: Math.round(normalProb * 100) / 100,
      PNEUMONIA: Math.round(pneumoniaProb * 100) / 100,
    } as Probabilities,
    gradcam_url: `/results/${caseId}-gradcam.png`,
    review_status: "PENDING",
    human_review: { required: true },
  };
}

// ---------- Helpers ----------

function buildUrl(path: string): string {
  if (!API_URL) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${p}`;
}

/** Convert a backend-relative gradcam_url into a fully-qualified URL. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_URL) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function parseError(res: Response): Promise<ApiError> {
  let code: string | undefined;
  let message = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    // Backend FastAPI HTTPException detail shape: { error, message }
    if (body?.detail?.error) code = body.detail.error;
    if (body?.detail?.message) message = body.detail.message;
    else if (body?.message) message = body.message;
    else if (typeof body?.detail === "string") message = body.detail;
  } catch {
    // Not JSON — keep default message
  }
  if (res.status === 503) return new ModelNotAvailableError(message);
  return new ApiError(message, res.status, code);
}

// ---------- Public service API ----------

export interface AnalyzeOptions {
  signal?: AbortSignal;
}

export type BackendStatus =
  | { mode: "demo"; reason: "no_url" | "unreachable" }
  | { mode: "live"; modelAvailable: boolean };

let _cachedStatus: BackendStatus | null = null;

export const api = {
  /** True iff the app is configured to call a real FastAPI backend. */
  isLiveMode(): boolean {
    return !!API_URL;
  },

  /** True iff the app is currently showing mock/demo data. */
  isMockMode(): boolean {
    return !API_URL || _cachedStatus?.mode === "demo";
  },

  /**
   * Ping the backend to detect live vs demo mode.
   * Result is cached for the session — call once on app startup.
   */
  async detectMode(): Promise<BackendStatus> {
    if (!API_URL) {
      _cachedStatus = { mode: "demo", reason: "no_url" };
      return _cachedStatus;
    }
    try {
      const res = await fetch(buildUrl("/health"), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      _cachedStatus = {
        mode: "live",
        modelAvailable: !!body.model_available,
      };
      return _cachedStatus;
    } catch {
      _cachedStatus = { mode: "demo", reason: "unreachable" };
      return _cachedStatus;
    }
  },

  /** Return the cached backend status (or null if detectMode hasn't run yet). */
  getCachedStatus(): BackendStatus | null {
    return _cachedStatus;
  },

  /**
   * Analyze a single chest X-ray image.
   * Real predictions in live mode; throws ApiError / ModelNotAvailableError on failure.
   */
  async analyze(image: File, opts: AnalyzeOptions = {}): Promise<AnalysisResponse> {
    if (!API_URL || _cachedStatus?.mode === "demo") {
      return mockAnalyze(image);
    }

    const form = new FormData();
    // Backend FastAPI endpoint expects the field name "file"
    form.append("file", image);

    let res: Response;
    try {
      res = await fetch(buildUrl("/api/analyze"), {
        method: "POST",
        body: form,
        signal: opts.signal,
      });
    } catch (e: any) {
      throw new ApiError(
        e?.message ?? "Network error while calling /api/analyze",
        0,
        "NETWORK"
      );
    }

    if (!res.ok) {
      throw await parseError(res);
    }
    return (await res.json()) as AnalysisResponse;
  },

  /**
   * Analyze a batch of chest X-ray images (parallelized client-side).
   */
  async analyzeBatch(
    images: File[],
    opts: AnalyzeOptions = {}
  ): Promise<BatchAnalysisResponse> {
    if (!API_URL || _cachedStatus?.mode === "demo") {
      const results = await Promise.all(
        images.map(async (file) => {
          try {
            const r = await mockAnalyze(file);
            return { filename: file.name, result: r, error: undefined } as const;
          } catch (e: any) {
            return {
              filename: file.name,
              result: null,
              error: e?.message ?? "Unknown error",
            } as const;
          }
        })
      );
      return {
        batch_id: `BATCH-${Date.now()}`,
        results: results as any,
      };
    }

    const form = new FormData();
    images.forEach((img) => form.append("files", img));

    let res: Response;
    try {
      res = await fetch(buildUrl("/api/analyze-batch"), {
        method: "POST",
        body: form,
        signal: opts.signal,
      });
    } catch (e: any) {
      throw new ApiError(
        e?.message ?? "Network error while calling /api/analyze-batch",
        0,
        "NETWORK"
      );
    }

    if (!res.ok) {
      throw await parseError(res);
    }
    return (await res.json()) as BatchAnalysisResponse;
  },

  // ---------- Cases ----------

  /**
   * List cases from the backend with pagination + optional filters.
   * Returns null when in demo mode (caller falls back to local store).
   */
  async getCases(params: {
    page?: number;
    page_size?: number;
    prediction?: string;
    priority?: string;
    review_status?: string;
  } = {}): Promise<BackendCaseListResponse | null> {
    if (!API_URL || _cachedStatus?.mode === "demo") return null;
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.page_size) qs.set("page_size", String(params.page_size));
    if (params.prediction) qs.set("prediction", params.prediction);
    if (params.priority) qs.set("priority", params.priority);
    if (params.review_status) qs.set("review_status", params.review_status);
    const url = buildUrl("/api/cases") + (qs.toString() ? `?${qs}` : "");
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw await parseError(res);
    return (await res.json()) as BackendCaseListResponse;
  },

  /**
   * Get a single case detail from the backend.
   * Returns null when in demo mode.
   */
  async getCase(caseId: string): Promise<BackendCaseDetail | null> {
    if (!API_URL || _cachedStatus?.mode === "demo") return null;
    const res = await fetch(buildUrl(`/api/cases/${encodeURIComponent(caseId)}`), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw await parseError(res);
    return (await res.json()) as BackendCaseDetail;
  },

  /**
   * Delete a case on the backend.
   * Returns true on success, false in demo mode.
   */
  async deleteCase(caseId: string): Promise<boolean> {
    if (!API_URL || _cachedStatus?.mode === "demo") return false;
    const res = await fetch(
      buildUrl(`/api/cases/${encodeURIComponent(caseId)}`),
      { method: "DELETE" }
    );
    if (!res.ok) throw await parseError(res);
    return true;
  },

  /**
   * Submit human review to the backend.
   * Returns the updated case detail, or null in demo mode.
   */
  async submitReview(
    caseId: string,
    body: BackendReviewRequest
  ): Promise<BackendCaseDetail | null> {
    if (!API_URL || _cachedStatus?.mode === "demo") return null;
    const res = await fetch(
      buildUrl(`/api/cases/${encodeURIComponent(caseId)}/review`),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw await parseError(res);
    return (await res.json()) as BackendCaseDetail;
  },

  // ---------- Analytics ----------

  /**
   * Fetch the analytics summary from the backend.
   * Returns null in demo mode (caller falls back to local computations).
   */
  async getAnalytics(): Promise<BackendAnalyticsSummary | null> {
    if (!API_URL || _cachedStatus?.mode === "demo") return null;
    const res = await fetch(buildUrl("/api/analytics/summary"), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw await parseError(res);
    return (await res.json()) as BackendAnalyticsSummary;
  },

  // ---------- Reports ----------

  /**
   * Fetch the AI-assisted case report (JSON) from the backend.
   * Returns null in demo mode.
   */
  async getReport(caseId: string): Promise<BackendCaseReport | null> {
    if (!API_URL || _cachedStatus?.mode === "demo") return null;
    const res = await fetch(
      buildUrl(`/api/cases/${encodeURIComponent(caseId)}/report`),
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw await parseError(res);
    return (await res.json()) as BackendCaseReport;
  },

  /**
   * Download the plain-text version of the case report.
   * Returns the text content, or null in demo mode.
   */
  async getReportText(caseId: string): Promise<string | null> {
    if (!API_URL || _cachedStatus?.mode === "demo") return null;
    const res = await fetch(
      buildUrl(`/api/cases/${encodeURIComponent(caseId)}/report.txt`)
    );
    if (!res.ok) throw await parseError(res);
    return await res.text();
  },
};
