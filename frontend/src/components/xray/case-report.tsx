"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Printer,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer } from "./demo-disclaimer";
import {
  PredictionBadge,
  ConfidenceBadge,
  PriorityBadge,
  ReviewStatusBadge,
  QualityBadge,
  ReviewDecisionBadge,
} from "./badges";
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

export function CaseReport({ caseItem }: { caseItem: XRayCase }) {
  const [generating, setGenerating] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  function generate() {
    setGenerating(true);
    setTimeout(() => {
      const id = `RPT-${String(Math.floor(Math.random() * 9000) + 500).padStart(4, "0")}`;
      setReportId(id);
      setGenerating(false);
      toast.success(`Report ${id} generated.`);
    }, 700);
  }

  function download() {
    const content = buildPlainTextReport(caseItem, reportId ?? "DRAFT");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseItem.caseId}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded.");
  }

  function print() {
    window.print();
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14.5px]">
              AI-Assisted Case Report
            </CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Preview the report before generating or downloading.
            </p>
          </div>
          {reportId && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {reportId}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 p-5">
        {/* Report preview */}
        <div
          id="report-printable"
          className="rounded-lg border border-border bg-white p-5 print:border-0 print:shadow-none"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-[12px] font-bold">X²</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-foreground">
                  X-RAY SQUARED
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  AI-Assisted Case Report
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end text-[11px] text-muted-foreground">
              <span>
                Generated:{" "}
                {new Date().toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>
                Report ID:{" "}
                <span className="font-mono">{reportId ?? "DRAFT"}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-3 py-4 sm:grid-cols-2">
            <ReportRow label="Case ID" value={caseItem.caseId} mono />
            <ReportRow label="Date" value={formatDate(caseItem.date)} />
            <ReportRow
              label="Image Quality"
              valueNode={<QualityBadge status={caseItem.quality.status} />}
            />
            <ReportRow
              label="AI Prediction"
              valueNode={<PredictionBadge prediction={caseItem.prediction} />}
            />
            <ReportRow
              label="Model Score"
              value={caseItem.score.toFixed(2)}
              mono
            />
            {caseItem.uncertainty != null && (
              <ReportRow
                label="Uncertainty"
                value={`${(caseItem.uncertainty * 100).toFixed(0)}%`}
                mono
              />
            )}
            <ReportRow
              label="Confidence"
              valueNode={<ConfidenceBadge confidence={caseItem.confidence} />}
            />
            <ReportRow
              label="Case Priority"
              valueNode={<PriorityBadge priority={caseItem.priority} />}
            />
            <ReportRow
              label="Explainability"
              valueNode={
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Grad-CAM available
                </span>
              }
            />
            <ReportRow
              label="Human Review Status"
              valueNode={<ReviewStatusBadge status={caseItem.reviewStatus} />}
            />
            {caseItem.reviewDecision && (
              <ReportRow
                label="Reviewer Decision"
                valueNode={
                  <ReviewDecisionBadge decision={caseItem.reviewDecision} />
                }
              />
            )}
            {caseItem.fileName && (
              <ReportRow label="Image File" value={caseItem.fileName} mono />
            )}
          </div>

          {caseItem.reviewerNotes && (
            <div className="border-t border-border py-3">
              <div className="mb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                Reviewer Notes
              </div>
              <p className="text-[12.5px] leading-relaxed text-foreground">
                {caseItem.reviewerNotes}
              </p>
            </div>
          )}

          <div className="mt-2 border-t border-border pt-3">
            <div className="mb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Disclaimer
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              This platform provides AI-assisted screening support for research
              and educational purposes. It does not provide a medical
              diagnosis or replace qualified medical professionals. Final
              decisions must be made by a qualified healthcare professional.
            </p>
          </div>
        </div>

        <AiDisclaimer />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Generate Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={download}
            disabled={!reportId}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={print}
            disabled={!reportId}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportRow({
  label,
  value,
  valueNode,
  mono,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {value ? (
        <span
          className={
            mono
              ? "font-mono text-[12.5px] text-foreground"
              : "text-[12.5px] text-foreground"
          }
        >
          {value}
        </span>
      ) : (
        valueNode
      )}
    </div>
  );
}

function buildPlainTextReport(c: XRayCase, reportId: string) {
  const lines = [
    "X-RAY SQUARED — AI-Assisted Case Report",
    "========================================",
    "",
    `Report ID:        ${reportId}`,
    `Generated:       ${new Date().toLocaleString()}`,
    "",
    `Case ID:          ${c.caseId}`,
    `Date:             ${formatDate(c.date)}`,
    `Image Quality:    ${c.quality.status}`,
    `AI Prediction:    ${c.prediction}`,
    `Model Score:      ${c.score.toFixed(2)} (model confidence/score, not a calibrated probability)`,
    `Uncertainty:      ${c.uncertainty != null ? (c.uncertainty * 100).toFixed(0) + "%" : "N/A"} (1 - max(probs); prototype indicator)`,
    `Confidence:       ${c.confidence}`,
    `Case Priority:    ${c.priority}`,
    `Explainability:   ${c.gradcamAvailable ? "Grad-CAM available" : "Not available"}`,
    `Human Review:     ${c.reviewStatus}${c.reviewDecision ? ` (${c.reviewDecision})` : ""}`,
    "",
    "Reviewer Notes:",
    c.reviewerNotes ? `  ${c.reviewerNotes}` : "  (none)",
    "",
    "Disclaimer:",
    "  This platform provides AI-assisted screening support for research and",
    "  educational purposes. It does not provide a medical diagnosis or replace",
    "  qualified medical professionals. Final decisions must be made by a",
    "  qualified healthcare professional.",
    "",
  ];
  return lines.join("\n");
}
