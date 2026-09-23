"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  Prediction,
  ConfidenceLevel,
  Priority,
  ReviewStatus,
  ReviewDecision,
} from "@/lib/types";

export function PredictionBadge({
  prediction,
  className,
}: {
  prediction: Prediction;
  className?: string;
}) {
  if (prediction === "PNEUMONIA") {
    return (
      <Badge
        className={cn(
          "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
          className
        )}
      >
        Pneumonia Suspected
      </Badge>
    );
  }
  return (
    <Badge
      className={cn(
        "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800",
        className
      )}
    >
      Normal
    </Badge>
  );
}

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: ConfidenceLevel;
  className?: string;
}) {
  const styles = {
    HIGH: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800",
    MEDIUM:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
    LOW: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50 hover:text-rose-800",
  } as const;
  return (
    <Badge className={cn(styles[confidence], className)}>
      {confidence === "HIGH" ? "High" : confidence === "MEDIUM" ? "Medium" : "Low"}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const styles = {
    HIGH: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50 hover:text-rose-800",
    MEDIUM:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
    LOW: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-700",
  } as const;
  return (
    <Badge className={cn(styles[priority], className)}>
      {priority === "HIGH" ? "High" : priority === "MEDIUM" ? "Medium" : "Low"}
    </Badge>
  );
}

export function ReviewStatusBadge({
  status,
  className,
}: {
  status: ReviewStatus;
  className?: string;
}) {
  if (status === "REVIEWED") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800",
          className
        )}
      >
        Reviewed
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
        className
      )}
    >
      Needs Review
    </Badge>
  );
}

export function ReviewDecisionBadge({
  decision,
  className,
}: {
  decision: ReviewDecision;
  className?: string;
}) {
  const styles = {
    AGREE:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800",
    DISAGREE:
      "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50 hover:text-rose-800",
    NEEDS_REVIEW:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
  } as const;
  const labels = {
    AGREE: "Agreed with AI",
    DISAGREE: "Disagreed with AI",
    NEEDS_REVIEW: "Needs Further Review",
  } as const;
  return (
    <Badge className={cn(styles[decision], className)}>{labels[decision]}</Badge>
  );
}

export function QualityBadge({
  status,
  className,
}: {
  status: "GOOD" | "MODERATE" | "POOR";
  className?: string;
}) {
  const styles = {
    GOOD: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800",
    MODERATE:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
    POOR: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50 hover:text-rose-800",
  } as const;
  return (
    <Badge className={cn(styles[status], className)}>
      {status === "GOOD" ? "Good" : status === "MODERATE" ? "Moderate" : "Poor"}
    </Badge>
  );
}
