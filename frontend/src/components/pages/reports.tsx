"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  Download,
  Printer,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  PredictionBadge,
  ReviewStatusBadge,
} from "@/components/xray/badges";
import { DemoBadge } from "@/components/xray/demo-disclaimer";
import { toast } from "sonner";
import type { XRayCase } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportsPage() {
  const cases = useAppStore((s) => s.cases);
  const reportIds = useAppStore((s) => s.reportIds);
  const [query, setQuery] = useState("");

  // Reports are case-derived; combine the demo reportIds with case data.
  const reports = reportIds
    .map((r) => {
      const caseItem = cases.find((c) => c.caseId === r.caseId);
      if (!caseItem) return null;
      return { ...r, caseItem };
    })
    .filter(Boolean) as { reportId: string; caseId: string; generatedAt: string; caseItem: XRayCase }[];

  const filtered = query
    ? reports.filter((r) => r.reportId.toLowerCase().includes(query.toLowerCase()) || r.caseId.toLowerCase().includes(query.toLowerCase()))
    : reports;

  function download(c: XRayCase, reportId: string) {
    const content = [
      `X-RAY SQUARED — AI-Assisted Case Report`,
      `Report ID: ${reportId}`,
      `Case ID: ${c.caseId}`,
      `Date: ${c.date}`,
      `Prediction: ${c.prediction}`,
      `Model Score: ${c.score.toFixed(2)}`,
      `Confidence: ${c.confidence}`,
      `Priority: ${c.priority}`,
      `Review Status: ${c.reviewStatus}`,
      c.reviewerNotes ? `Reviewer Notes: ${c.reviewerNotes}` : "",
      "",
      "Disclaimer: This platform provides AI-assisted screening support for research",
      "and educational purposes. It does not provide a medical diagnosis or replace",
      "qualified medical professionals.",
    ].filter(Boolean).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${reportId}.`);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              Reports
            </h2>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-muted-foreground">
            View, download and print AI-assisted case reports.
          </p>
        </div>
        <Badge variant="secondary" className="text-[11px]">
          {filtered.length} reports
        </Badge>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Report or Case ID..."
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-9 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/50 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Report ID</th>
                  <th className="px-5 py-2.5 font-medium">Case ID</th>
                  <th className="px-5 py-2.5 font-medium">Prediction</th>
                  <th className="px-5 py-2.5 font-medium">Review Status</th>
                  <th className="px-5 py-2.5 font-medium">Generated</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[12px] text-muted-foreground">
                      <FileText className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
                      No reports match the current search.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.reportId} className="hover:bg-accent/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-foreground">
                      {r.reportId}
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">
                      {r.caseId}
                    </td>
                    <td className="px-5 py-3">
                      <PredictionBadge prediction={r.caseItem.prediction} />
                    </td>
                    <td className="px-5 py-3">
                      <ReviewStatusBadge status={r.caseItem.reviewStatus} />
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted-foreground">
                      {formatDate(r.generatedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px]"
                          onClick={() => {
                            useAppStore.getState().selectCase(r.caseId);
                            useAppStore.getState().setPage("cases");
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px]"
                          onClick={() => download(r.caseItem, r.reportId)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[12px]"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
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
