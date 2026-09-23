"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfidenceBadge, PredictionBadge } from "./badges";
import { Activity, Gauge, Brain, ShieldQuestion } from "lucide-react";
import type {
  Prediction,
  ConfidenceLevel,
  Priority,
  Probabilities,
} from "@/lib/types";

interface AiResultProps {
  prediction: Prediction;
  score: number;
  confidence: ConfidenceLevel;
  priority: Priority;
  caseId: string;
  uncertainty?: number;
  probabilities?: Probabilities;
}

export function AiResultCard({
  prediction,
  score,
  confidence,
  priority,
  caseId,
  uncertainty,
  probabilities,
}: AiResultProps) {
  const isPneumonia = prediction === "PNEUMONIA";
  const pct = Math.round(score * 100);
  const uncPct = uncertainty != null ? Math.round(uncertainty * 100) : null;
  const probNormal = probabilities?.NORMAL ?? (isPneumonia ? 1 - score : score);
  const probPneumonia = probabilities?.PNEUMONIA ?? (isPneumonia ? score : 1 - score);

  return (
    <Card className={cn("overflow-hidden")}>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14.5px]">AI Screening Result</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Output of the AI model — not a medical diagnosis.
            </p>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {caseId}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {/* Prediction + score visual */}
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border p-4",
            isPneumonia
              ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
              : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          )}
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Prediction
          </div>
          <div className="mt-2 flex items-center gap-3">
            <PredictionBadge prediction={prediction} className="text-[13px]" />
            <span
              className={cn(
                "text-[11.5px] text-muted-foreground",
                isPneumonia ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {isPneumonia
                ? "AI flagged possible pneumonia pattern"
                : "AI did not flag pneumonia pattern"}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Model Score
              </span>
              <span className="font-mono text-[28px] font-semibold leading-none tracking-tight text-foreground">
                {score.toFixed(2)}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                Model confidence/score (not a calibrated probability)
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Level
              </span>
              <ConfidenceBadge confidence={confidence} className="text-[12px]" />
            </div>
          </div>

          <div className="mt-3">
            <Progress
              value={pct}
              className={cn(
                "h-2",
                isPneumonia
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-emerald-500"
              )}
            />
            <div className="mt-1 flex items-center justify-between text-[10.5px] text-muted-foreground">
              <span>0.00</span>
              <span>Raw model output</span>
              <span>1.00</span>
            </div>
          </div>

          {/* Per-class probabilities */}
          <div className="mt-4 border-t border-border/60 pt-3">
            <div className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Per-class model output
            </div>
            <ProbBar
              label="NORMAL"
              value={probNormal}
              color="emerald"
            />
            <div className="mt-2">
              <ProbBar
                label="PNEUMONIA"
                value={probPneumonia}
                color="amber"
              />
            </div>
          </div>
        </div>

        {/* Analysis status grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatusTile
            icon={Gauge}
            label="Model Score"
            value={score.toFixed(2)}
            tone="neutral"
          />
          <StatusTile
            icon={Brain}
            label="Confidence"
            value={confidence}
            tone={
              confidence === "HIGH"
                ? "good"
                : confidence === "MEDIUM"
                ? "warning"
                : "danger"
            }
          />
          <StatusTile
            icon={ShieldQuestion}
            label="Uncertainty"
            value={uncPct != null ? `${(uncertainty! * 100).toFixed(0)}%` : "—"}
            tone={
              uncPct == null
                ? "neutral"
                : uncPct >= 30
                ? "danger"
                : uncPct >= 15
                ? "warning"
                : "good"
            }
            hint="1 − max(probs). Prototype indicator."
          />
          <StatusTile
            icon={Activity}
            label="Priority"
            value={priority === "HIGH" ? "High" : priority === "MEDIUM" ? "Medium" : "Low"}
            tone={
              priority === "HIGH"
                ? "danger"
                : priority === "MEDIUM"
                ? "warning"
                : "neutral"
            }
          />
          {uncPct != null && uncPct >= 30 && (
            <div className="col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11.5px] text-rose-900">
              AI is less certain about this case. Human review is recommended.
              Uncertainty is a prototype indicator — not a clinical metric.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProbBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber";
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-[78px] shrink-0 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-[11px] text-foreground">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "good" | "warning" | "danger" | "neutral";
  hint?: string;
}) {
  const tones = {
    good: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-rose-700",
    neutral: "text-foreground",
  } as const;
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <span className={cn("text-[14px] font-semibold", tones[tone])}>
        {value}
      </span>
      {hint && (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
