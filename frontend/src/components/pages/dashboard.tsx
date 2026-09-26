"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Brain,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Search,
  Eye,
  Filter,
  FolderOpen,
  Plus,
  Wifi,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, type BackendStatus } from "@/lib/api";
import type { BackendAnalyticsSummary, XRayCase } from "@/lib/types";
import {
  PredictionBadge,
  ConfidenceBadge,
  PriorityBadge,
  ReviewStatusBadge,
} from "@/components/xray/badges";
import { DemoBadge } from "@/components/xray/demo-disclaimer";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardPage() {
  const storeCases = useAppStore((s) => s.cases);
  const setPage = useAppStore((s) => s.setPage);
  const selectCase = useAppStore((s) => s.selectCase);

  // Backend mode detection
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [summary, setSummary] = useState<BackendAnalyticsSummary | null>(null);
  const [backendCases, setBackendCases] = useState<XRayCase[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.detectMode().then((s) => {
      if (mounted) setBackendStatus(s);
    });
    return () => { mounted = false; };
  }, []);

  const isLive = backendStatus?.mode === "live";

  const refresh = async () => {
    if (!isLive) return;
    setLoading(true);
    try {
      const [summ, resp] = await Promise.all([
        api.getAnalytics(),
        api.getCases({ page: 1, page_size: 10 }),
      ]);
      if (summ) setSummary(summ);
      if (resp) {
        setBackendCases(
          resp.cases.map((c) => ({
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
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLive) {
      queueMicrotask(() => {
        void refresh();
      });
    }
  }, [isLive]);

  // Use backend data when live; fall back to store (demo) otherwise.
  const rawCases = isLive ? (backendCases ?? []) : storeCases;
  const cases = useMemo(() => {
    const seen = new Set<string>();
    return rawCases.filter((c) => {
      if (!c?.caseId || seen.has(c.caseId)) return false;
      seen.add(c.caseId);
      return true;
    });
  }, [rawCases]);

  // KPIs
  const totalCases = isLive && summary ? summary.total_cases : storeCases.length;
  const aiAnalyzed = totalCases; // every persisted case has been analyzed
  const pneumoniaSuspected = isLive && summary ? summary.pneumonia_cases : storeCases.filter((c) => c.prediction === "PNEUMONIA").length;
  const needsReview = isLive && summary ? summary.pending_reviews : storeCases.filter((c) => c.reviewStatus === "PENDING").length;

  const recent = [...cases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Review queue categories
  const highPriority = (isLive && summary ? summary.high_priority_cases : storeCases.filter((c) => c.priority === "HIGH").length);
  const needsFurtherReview = (isLive && summary ? summary.needs_further_review : storeCases.filter((c) => c.reviewStatus === "REVIEWED" && c.reviewDecision === "NEEDS_REVIEW").length);
  const lowConfidence = isLive && summary ? (summary.confidence_distribution.LOW ?? 0) : storeCases.filter((c) => c.confidence === "LOW").length;
  const pendingReview = needsReview;

  function openCase(caseId: string) {
    selectCase(caseId);
    setPage("cases");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page hero */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
            Today at a glance
          </h2>
          {isLive ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800">
              <Wifi className="mr-1 h-3 w-3" />
              Live Backend
            </Badge>
          ) : (
            <DemoBadge />
          )}
          {isLive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[11px]"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </Button>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground">
          {isLive
            ? "Live metrics from the FastAPI backend — real cases from the database."
            : "A workflow-first overview of AI-assisted screenings awaiting human review."}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Cases"
          value={totalCases}
          description="All cases in the platform"
          icon={FolderOpen}
          trend="up"
          trendValue="+3 today"
        />
        <KpiCard
          label="AI Analyzed"
          value={aiAnalyzed}
          description="Cases processed by AI"
          icon={Brain}
          accent="primary"
        />
        <KpiCard
          label="Pneumonia Suspected"
          value={pneumoniaSuspected}
          description="Flagged by AI for review"
          icon={AlertTriangle}
          accent="warning"
        />
        <KpiCard
          label="Needs Human Review"
          value={needsReview}
          description="Pending reviewer decision"
          icon={ClipboardCheck}
          accent="info"
          trend="down"
          trendValue="-2 vs yesterday"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Recent cases */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[15px]">
                  Recent X-Ray Cases
                </CardTitle>
                <CardDescription className="mt-1 text-[12.5px]">
                  Latest AI-assisted analyses awaiting or recently reviewed.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-[12.5px]"
                onClick={() => setPage("cases")}
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
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
                    <th className="px-5 py-2.5 font-medium">Review</th>
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((c) => (
                    <tr
                      key={c.caseId}
                      className="hover:bg-accent/40"
                    >
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
                        <div className="flex flex-col">
                          <span>{formatDate(c.date)}</span>
                          <span className="text-[11px] text-muted-foreground/80">
                            {formatTime(c.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px]"
                          onClick={() => openCase(c.caseId)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI review queue */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-[15px]">AI Review Queue</CardTitle>
                  <CardDescription className="mt-1 text-[12.5px]">
                    Workflow-driven prioritization — not clinical severity.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10.5px]">
                  Demo Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
              <QueueItem
                label="High Priority"
                count={highPriority}
                tone="danger"
                hint="High model score, flagged pneumonia"
                icon={AlertTriangle}
                onClick={() => setPage("cases")}
              />
              <QueueItem
                label="Needs Further Review"
                count={needsFurtherReview}
                tone="warning"
                hint="Reviewer requested more info"
                icon={ClipboardCheck}
                onClick={() => setPage("cases")}
              />
              <QueueItem
                label="Low Confidence"
                count={lowConfidence}
                tone="info"
                hint="Model uncertain about these cases"
                icon={Activity}
                onClick={() => setPage("cases")}
              />
              <QueueItem
                label="Pending Human Review"
                count={pendingReview}
                tone="neutral"
                hint="Awaiting reviewer decision"
                icon={Eye}
                onClick={() => setPage("cases")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-[15px]">Quick Actions</CardTitle>
              <CardDescription className="mt-1 text-[12.5px]">
                Jump into the core workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 p-3">
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-2.5 text-left"
                onClick={() => setPage("analyze")}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">Analyze new X-Ray</span>
                  <span className="text-[11px] text-muted-foreground">
                    Upload and run AI screening
                  </span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-2.5 text-left"
                onClick={() => setPage("cases")}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">Open case list</span>
                  <span className="text-[11px] text-muted-foreground">
                    Search and review existing cases
                  </span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-2.5 text-left"
                onClick={() => setPage("analytics")}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">View analytics</span>
                  <span className="text-[11px] text-muted-foreground">
                    AI–human agreement metrics
                  </span>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  accent = "default",
}: {
  label: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
  trendValue?: string;
  accent?: "default" | "primary" | "warning" | "info";
}) {
  const accentClasses = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-sky-50 text-sky-700",
  } as const;

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-[28px] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">{description}</span>
            {trend && trendValue && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-medium",
                  trend === "up" ? "text-emerald-700" : "text-rose-700"
                )}
              >
                {trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trendValue}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accentClasses[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function QueueItem({
  label,
  count,
  tone,
  hint,
  icon: Icon,
  onClick,
}: {
  label: string;
  count: number;
  tone: "danger" | "warning" | "info" | "neutral";
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  const tones = {
    danger: "bg-rose-50 text-rose-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-sky-50 text-sky-700",
    neutral: "bg-muted text-foreground",
  } as const;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-lg border border-border p-3 text-left transition hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center justify-between gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", tones[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[18px] font-semibold leading-none tracking-tight">
          {count}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[12.5px] font-medium text-foreground">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
    </button>
  );
}
