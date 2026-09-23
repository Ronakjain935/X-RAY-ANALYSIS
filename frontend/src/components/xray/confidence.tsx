"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfidenceBadge } from "./badges";
import { AlertTriangle, Gauge } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/types";

export function ConfidenceCard({
  confidence,
  score,
  uncertainty,
}: {
  confidence: ConfidenceLevel;
  score: number;
  uncertainty?: number;
}) {
  const pct = Math.round(score * 100);
  const low = confidence === "LOW";
  const medium = confidence === "MEDIUM";
  const uncPct = uncertainty != null ? Math.round(uncertainty * 100) : null;

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14.5px]">
              AI Confidence &amp; Uncertainty
            </CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              How confident the model is about this prediction.
            </p>
          </div>
          <ConfidenceBadge confidence={confidence} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-border">
            <span
              className={cn(
                "font-mono text-[16px] font-semibold",
                low ? "text-rose-700" : medium ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {pct}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Confidence level</span>
              <span
                className={cn(
                  "font-semibold",
                  low
                    ? "text-rose-700"
                    : medium
                    ? "text-amber-700"
                    : "text-emerald-700"
                )}
              >
                {confidence === "HIGH"
                  ? "High"
                  : confidence === "MEDIUM"
                  ? "Medium"
                  : "Low"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  low
                    ? "bg-rose-500"
                    : medium
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" /> Model confidence/score: {score.toFixed(2)}
              </span>
              <span>{pct}%</span>
            </div>
            {uncPct != null && (
              <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Uncertainty (1 − max)
                </span>
                <span
                  className={cn(
                    "font-medium",
                    uncPct >= 30
                      ? "text-rose-700"
                      : uncPct >= 15
                      ? "text-amber-700"
                      : "text-emerald-700"
                  )}
                >
                  {(uncertainty! * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {low ? (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="leading-relaxed">
              The model is uncertain about this case. Additional human
              assessment is recommended. This is not a medical diagnosis.
            </p>
          </div>
        ) : medium ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="leading-relaxed">
              Confidence is moderate. Reviewer should confirm before any
              clinical use.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-900">
            <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="leading-relaxed">
              Model confidence is high. A human reviewer should still confirm
              the result before any clinical use.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
