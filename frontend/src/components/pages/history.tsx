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
  Search,
  Eye,
  Trash2,
  History as HistoryIcon,
  X,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, type BackendStatus } from "@/lib/api";
import type { XRayCase } from "@/lib/types";
import {
  PredictionBadge,
  ConfidenceBadge,
  PriorityBadge,
  ReviewStatusBadge,
} from "@/components/xray/badges";
import { DemoBadge } from "@/components/xray/demo-disclaimer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PageKey } from "@/lib/types";

type SortKey = "date-desc" | "date-asc" | "score-desc" | "score-asc";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HistoryPage() {
  const storeCases = useAppStore((s) => s.cases);
  const removeCase = useAppStore((s) => s.removeCase);
  const selectCase = useAppStore((s) => s.selectCase);
  const setPage = useAppStore((s) => s.setPage);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");

  // Backend connection state (mirrors Cases page)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
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
      const resp = await api.getCases({ page: 1, page_size: 100 });
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
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load history from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLive) refresh();
  }, [isLive]);

  const cases = isLive ? (backendCases ?? []) : storeCases;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? cases.filter((c) => c.caseId.toLowerCase().includes(q))
      : [...cases];
    return filtered.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "score-desc":
          return b.score - a.score;
        case "score-asc":
          return a.score - b.score;
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [cases, query, sort]);

  function openCase(caseId: string) {
    selectCase(caseId);
    setPage("cases");
  }

  async function handleDelete(caseId: string) {
    if (isLive) {
      try {
        await api.deleteCase(caseId);
        toast.success(`Deleted case ${caseId} on backend.`);
        refresh();
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
              Analysis History
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
            Review prior analyses, search by case ID and re-open or delete cases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12px]"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          )}
          <Badge variant="secondary" className="text-[11px]">
            {list.length} records
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
            <div className="flex items-center gap-1.5">
              <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-md border border-border bg-background px-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="score-desc">Highest score</option>
                <option value="score-asc">Lowest score</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/50 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Case ID</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Prediction</th>
                  <th className="px-5 py-2.5 font-medium">Confidence</th>
                  <th className="px-5 py-2.5 font-medium">Priority</th>
                  <th className="px-5 py-2.5 font-medium">Review</th>
                  <th className="px-5 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-[12px] text-muted-foreground"
                    >
                      <HistoryIcon className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
                      No history records match the current search.
                    </td>
                  </tr>
                )}
                {list.map((c) => (
                  <tr key={c.caseId} className="hover:bg-accent/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-foreground">
                      {c.caseId}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted-foreground">
                      {formatDate(c.date)}
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
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px]"
                          onClick={() => openCase(c.caseId)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px] text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          onClick={() => handleDelete(c.caseId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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
    </div>
  );
}
