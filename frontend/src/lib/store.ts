import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PageKey,
  XRayCase,
  ReviewDecision,
  ReviewStatus,
  AnalysisResponse,
} from "@/lib/types";
import { DEMO_CASES } from "@/lib/demo-data";

export interface AppSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  showRawScore: boolean;
  autoGenerateReport: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface AppState {
  // Navigation
  currentPage: PageKey;
  setPage: (page: PageKey) => void;
  selectedCaseId: string | null;
  selectCase: (caseId: string | null) => void;

  // Cases dataset (initialized from demo data)
  cases: XRayCase[];
  addCase: (c: XRayCase) => void;
  updateCase: (caseId: string, patch: Partial<XRayCase>) => void;
  removeCase: (caseId: string) => void;

  // Reports
  reportIds: { reportId: string; caseId: string; generatedAt: string }[];
  generateReport: (caseId: string) => string;

  // Settings
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;

  // Simulated analysis results — keyed by caseId (one per upload)
  // Used by the Analyze page so re-mounting preserves results within a session.
  lastResults: Record<string, AnalysisResponse>;
  setLastResult: (caseId: string, r: AnalysisResponse) => void;

  // Human review actions
  saveReview: (
    caseId: string,
    decision: ReviewDecision,
    notes: string,
    status: ReviewStatus
  ) => void;
}

const STORAGE_KEY = "xray-squared-state-v1";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: "dashboard",
      setPage: (page) => set({ currentPage: page, selectedCaseId: null }),

      selectedCaseId: null,
      selectCase: (caseId) => set({ selectedCaseId: caseId }),

      cases: DEMO_CASES,
      addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
      updateCase: (caseId, patch) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.caseId === caseId ? { ...c, ...patch } : c
          ),
        })),
      removeCase: (caseId) =>
        set((s) => ({ cases: s.cases.filter((c) => c.caseId !== caseId) })),

      reportIds: [
        { reportId: "RPT-0421", caseId: "XR-0011", generatedAt: new Date().toISOString() },
        { reportId: "RPT-0420", caseId: "XR-0004", generatedAt: new Date().toISOString() },
        { reportId: "RPT-0419", caseId: "XR-0002", generatedAt: new Date().toISOString() },
      ],
      generateReport: (caseId) => {
        const reportId = `RPT-${String(Math.floor(Math.random() * 9000) + 500).padStart(4, "0")}`;
        set((s) => ({
          reportIds: [
            { reportId, caseId, generatedAt: new Date().toISOString() },
            ...s.reportIds,
          ],
        }));
        return reportId;
      },

      settings: {
        theme: "light",
        notifications: true,
        showRawScore: true,
        autoGenerateReport: false,
        highContrast: false,
        reducedMotion: false,
      },
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      lastResults: {},
      setLastResult: (caseId, r) =>
        set((s) => ({ lastResults: { ...s.lastResults, [caseId]: r } })),

      saveReview: (caseId, decision, notes, status) => {
        get().updateCase(caseId, {
          reviewDecision: decision,
          reviewerNotes: notes,
          reviewStatus: status,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist settings + cases (not transient nav)
      partialize: (s) => ({
        cases: s.cases,
        settings: s.settings,
        reportIds: s.reportIds,
      }),
    }
  )
);
