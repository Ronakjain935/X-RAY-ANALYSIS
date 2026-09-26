"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, resolveMediaUrl, type BackendStatus } from "@/lib/api";
import type { XRayCase } from "@/lib/types";
import {
  PredictionBadge,
  ConfidenceBadge,
  PriorityBadge,
  ReviewStatusBadge,
} from "@/components/xray/badges";
import {
  QualityAssessment,
} from "@/components/xray/quality-assessment";
import { AiResultCard } from "@/components/xray/ai-result";
import { GradCamView } from "@/components/xray/grad-cam";
import { ConfidenceCard } from "@/components/xray/confidence";
import { PriorityCard } from "@/components/xray/priority";
import { HumanReview } from "@/components/xray/human-review";
import { CaseReport } from "@/components/xray/case-report";
import { AiDisclaimer, DemoBadge } from "@/components/xray/demo-disclaimer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FilterKey =
  | "all"
  | "normal"
  | "pneumonia"
  | "high"
  | "review"
  | "reviewed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "normal", label: "Normal" },
  { key: "pneumonia", label: "Pneumonia Suspected" },
  { key: "high", label: "High Priority" },
  { key: "review", label: "Needs Review" },
  { key: "reviewed", label: "Reviewed" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CasesPage({
  initialCaseId,
}: {
  initialCaseId?: string | null;
}) {
  const storeCases = useAppStore((s) => s.cases);
  const removeCase = useAppStore((s) => s.removeCase);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  // Use the initialCaseId as the starting openId. When the user clicks
  // View, the click handler updates the state directly.
  const [openId, setOpenId] = useState<string | null>(initialCaseId ?? null);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [backendCases, setBackendCases] = useState<XRayCase[] | null>(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  // Detect backend mode once on mount
  useEffect(() => {
    let mounted = true;
    api.detectMode().then((s) => {
      if (mounted) setBackendStatus(s);
    });
    return () => { mounted = false; };
  }, []);

  // When live, fetch cases from the backend. In demo mode, fall back to store.
  const isLive = backendStatus?.mode === "live";
  const refreshFromBackend = async () => {
    if (!isLive) return;
    setLoadingBackend(true);
    try {
      const resp = await api.getCases({ page: 1, page_size: 100 });
      if (resp) {
        const mapped: XRayCase[] = resp.cases.map((c) => ({
          caseId: c.case_id,
          date: c.created_at,
          prediction: c.prediction,
          score: c.score,
          confidence: c.confidence,
          uncertainty: c.uncertainty,
          priority: c.priority,
          quality: {
            status: "GOOD",
            brightness: "GOOD",
            contrast: "GOOD",
            resolution: "GOOD",
          },
          reviewStatus: c.review_status,
          reviewDecision:
            c.human_decision === "AGREE_WITH_AI"
              ? "AGREE"
              : c.human_decision === "DISAGREE_WITH_AI"
              ? "DISAGREE"
              : c.human_decision === "NEEDS_FURTHER_REVIEW"
              ? "NEEDS_REVIEW"
              : undefined,
          gradcamAvailable: false,
        }));
        setBackendCases(mapped);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load cases from backend.");
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    if (isLive) {
      queueMicrotask(() => {
        void refreshFromBackend();
      });
    }
  }, [isLive]);

  // In live mode use backendCases (or empty list while loading);
  // in demo mode use the local store.
  const rawCases = isLive ? (backendCases ?? []) : storeCases;
  const cases = useMemo(() => {
    const seen = new Set<string>();
    return rawCases.filter((c) => {
      if (!c?.caseId || seen.has(c.caseId)) return false;
      seen.add(c.caseId);
      return true;
    });
  }, [rawCases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases
      .filter((c) => {
        if (q && !c.caseId.toLowerCase().includes(q)) return false;
        switch (filter) {
          case "normal":
            return c.prediction === "NORMAL";
          case "pneumonia":
            return c.prediction === "PNEUMONIA";
          case "high":
            return c.priority === "HIGH";
          case "review":
            return c.reviewStatus === "PENDING";
          case "reviewed":
            return c.reviewStatus === "REVIEWED";
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cases, query, filter]);

  const openCase = openId ? cases.find((c) => c.caseId === openId) : null;

  async function handleDelete(caseId: string) {
    if (isLive) {
      try {
        await api.deleteCase(caseId);
        toast.success(`Deleted case ${caseId} on backend.`);
        refreshFromBackend();
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to delete case on backend.");
      }
    } else {
      removeCase(caseId);
      toast.success(`Deleted demo case ${caseId}`);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              Case Management
            </h2>
            {isLive ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800">
                Live Backend
              </Badge>
            ) : (
              <DemoBadge />
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Browse, search and review all AI-assisted screening cases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12px]"
              onClick={refreshFromBackend}
              disabled={loadingBackend}
            >
              {loadingBackend ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          )}
          <Badge variant="secondary" className="text-[11px]">
            {filtered.length} of {cases.length}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Case ID..."
                className="h-9 pl-9 text-[13px]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition",
                    filter === f.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/50 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Case ID</th>
                  <th className="px-5 py-2.5 font-medium">Prediction</th>
                  <th className="px-5 py-2.5 font-medium">Confidence</th>
                  <th className="px-5 py-2.5 font-medium">Priority</th>
                  <th className="px-5 py-2.5 font-medium">Review Status</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-[12px] text-muted-foreground">
                      No cases match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.caseId} className="hover:bg-accent/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-foreground">
                      {c.caseId}
                    </td>
                    <td className="px-5 py-3">
                      <PredictionBadge prediction={c.prediction} />
                    </td>
                    <td className="px-5 py-3">
                      <ConfidenceBadge confidence={c.confidence} />
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <ReviewStatusBadge status={c.reviewStatus} />
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted-foreground">
                      {formatDate(c.date)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px]"
                          onClick={() => setOpenId(c.caseId)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px] text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          onClick={() => handleDelete(c.caseId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Case detail dialog */}
      <Dialog open={!!openCase} onOpenChange={(o) => setOpenId(o ? openId : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-thin sm:max-w-3xl">
          {openCase ? (
            <CaseDetail caseItem={openCase} onClose={() => setOpenId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CaseDetail({
  caseItem,
  onClose,
}: {
  caseItem: XRayCase;
  onClose: () => void;
}) {
  const saveReview = useAppStore((s) => s.saveReview);
  const [localCase, setLocalCase] = useState(caseItem);
  const [detailLoading, setDetailLoading] = useState(false);

  // When live, fetch the full case detail (with quality + gradcam_url +
  // probabilities + reviewer notes) from the backend so the dialog shows
  // real persisted data instead of just the brief list-row fields.
  useEffect(() => {
    let mounted = true;
    if (!api.isLiveMode()) return;
    // Defer setState to a microtask so it doesn't fire synchronously during
    // the effect body (avoids the "set-state-in-effect" React warning).
    Promise.resolve().then(() => {
      if (!mounted) return;
      setDetailLoading(true);
      api
        .getCase(caseItem.caseId)
        .then((detail) => {
          if (!mounted || !detail) return;
          setLocalCase((prev) => ({
            ...prev,
            date: detail.created_at,
            score: detail.score,
            uncertainty: detail.uncertainty ?? prev.uncertainty,
            probabilities: detail.probabilities ?? prev.probabilities,
            quality: detail.quality ?? prev.quality,
            reviewStatus: detail.review_status,
            reviewDecision:
              detail.human_decision === "AGREE_WITH_AI"
                ? "AGREE"
                : detail.human_decision === "DISAGREE_WITH_AI"
                ? "DISAGREE"
                : detail.human_decision === "NEEDS_FURTHER_REVIEW"
                ? "NEEDS_REVIEW"
                : prev.reviewDecision,
            reviewerNotes: detail.reviewer_notes ?? prev.reviewerNotes,
            gradcamAvailable: !!detail.gradcam_url,
            gradcamUrl: detail.gradcam_url
              ? resolveMediaUrl(detail.gradcam_url) ?? undefined
              : undefined,
            imageUrl:
              (detail.gradcam_url && resolveMediaUrl(detail.gradcam_url)) ||
              (detail.original_image_url && resolveMediaUrl(detail.original_image_url)) ||
              prev.imageUrl,
          }));
        })
        .catch(() => {
          // Silently keep the brief data — the dialog still works.
        })
        .finally(() => {
          if (mounted) setDetailLoading(false);
        });
    });
    return () => {
      mounted = false;
    };
  }, [caseItem.caseId]);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle className="text-[16px] font-semibold">
            Case {caseItem.caseId}
          </DialogTitle>
          {api.isLiveMode() ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800">
              Live Backend
            </Badge>
          ) : (
            <DemoBadge />
          )}
        </div>
        <DialogDescription>
          AI-assisted screening details and human review.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5 px-1 pb-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetaTile label="Prediction">
            <PredictionBadge prediction={localCase.prediction} />
          </MetaTile>
          <MetaTile label="Confidence">
            <ConfidenceBadge confidence={localCase.confidence} />
          </MetaTile>
          <MetaTile label="Priority">
            <PriorityBadge priority={localCase.priority} />
          </MetaTile>
          <MetaTile label="Review">
            <ReviewStatusBadge status={localCase.reviewStatus} />
          </MetaTile>
        </div>

        <QualityAssessment quality={localCase.quality} />

        <AiResultCard
          prediction={localCase.prediction}
          score={localCase.score}
          confidence={localCase.confidence}
          priority={localCase.priority}
          caseId={localCase.caseId}
          uncertainty={localCase.uncertainty}
          probabilities={localCase.probabilities}
        />

        {localCase.imageUrl && (
          <GradCamView
            imageUrl={localCase.imageUrl}
            gradcamUrl={localCase.gradcamUrl}
            prediction={localCase.prediction}
            caseId={localCase.caseId}
            compact
          />
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ConfidenceCard
            confidence={localCase.confidence}
            score={localCase.score}
            uncertainty={localCase.uncertainty}
          />
          <PriorityCard
            priority={localCase.priority}
            prediction={localCase.prediction}
            score={localCase.score}
            confidence={localCase.confidence}
          />
        </div>

        <HumanReview
          caseId={localCase.caseId}
          prediction={localCase.prediction}
          confidence={localCase.confidence}
          gradcamAvailable={localCase.gradcamAvailable}
          reviewStatus={localCase.reviewStatus}
          initialDecision={localCase.reviewDecision}
          initialNotes={localCase.reviewerNotes}
          onSave={(decision, notes, status) => {
            saveReview(localCase.caseId, decision, notes, status);
            setLocalCase({
              ...localCase,
              reviewDecision: decision,
              reviewerNotes: notes,
              reviewStatus: status,
            });
          }}
        />

        <CaseReport caseItem={localCase} />

        <AiDisclaimer />
      </div>
    </>
  );
}

function MetaTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
      <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
