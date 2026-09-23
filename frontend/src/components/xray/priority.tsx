"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PriorityBadge } from "./badges";
import { Flag, ArrowUp, ArrowRight, ArrowDown, Info } from "lucide-react";
import type { Priority } from "@/lib/types";

export function PriorityCard({
  priority,
  prediction,
  score,
  confidence,
}: {
  priority: Priority;
  prediction: "NORMAL" | "PNEUMONIA";
  score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}) {
  const Icon =
    priority === "HIGH" ? ArrowUp : priority === "MEDIUM" ? ArrowRight : ArrowDown;
  const tone =
    priority === "HIGH"
      ? "danger"
      : priority === "MEDIUM"
      ? "warning"
      : "neutral";

  let reason = "";
  if (priority === "HIGH") {
    reason =
      prediction === "PNEUMONIA"
        ? "Pneumonia-suspected result with high model score."
        : "High model score for normal pattern.";
  } else if (priority === "MEDIUM") {
    reason =
      confidence === "LOW"
        ? "Low model confidence — reviewer should confirm."
        : "Medium model confidence — review recommended.";
  } else {
    reason = "Low model score — routine review.";
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14.5px]">Case Priority</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Workflow prioritization — not clinical severity.
            </p>
          </div>
          <PriorityBadge priority={priority} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              tone === "danger" && "bg-rose-50 text-rose-700",
              tone === "warning" && "bg-amber-50 text-amber-700",
              tone === "neutral" && "bg-muted text-foreground"
            )}
          >
            <Flag className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Priority level
            </span>
            <span
              className={cn(
                "text-[18px] font-semibold leading-tight",
                tone === "danger" && "text-rose-700",
                tone === "warning" && "text-amber-700",
                tone === "neutral" && "text-foreground"
              )}
            >
              {priority === "HIGH"
                ? "High Priority"
                : priority === "MEDIUM"
                ? "Medium Priority"
                : "Low Priority"}
            </span>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-[12px]">
          <div className="mb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Reason
          </div>
          <p className="text-foreground">{reason}</p>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-border bg-background p-3 text-[11.5px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="leading-relaxed">
            Priority is intended to help organize cases for review and does
            not represent clinical severity. Final decisions must be made by a
            qualified healthcare professional.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
