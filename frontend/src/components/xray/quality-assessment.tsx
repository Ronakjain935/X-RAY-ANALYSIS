"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QualityBadge } from "./badges";
import { Sun, Contrast, Maximize, Eye, AlertTriangle, Activity } from "lucide-react";
import type { ImageQuality, QualityStatus } from "@/lib/types";

export function QualityAssessment({ quality }: { quality: ImageQuality }) {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14.5px]">
              Image Quality Assessment
            </CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Prototype quality check — not clinical-grade image QC.
            </p>
          </div>
          <QualityBadge status={quality.status} />
        </div>
      </CardHeader>
      <CardContent className={cn("grid grid-cols-2 gap-3 p-4", quality.sharpness ? "sm:grid-cols-5" : "sm:grid-cols-4")}>
        <QualityMetric
          icon={Sun}
          label="Brightness"
          status={quality.brightness}
        />
        <QualityMetric
          icon={Contrast}
          label="Contrast"
          status={quality.contrast}
        />
        <QualityMetric
          icon={Maximize}
          label="Resolution"
          status={quality.resolution}
        />
        {quality.sharpness && (
          <QualityMetric
            icon={Activity}
            label="Sharpness"
            status={quality.sharpness}
          />
        )}
        <QualityMetric
          icon={Eye}
          label="Visibility"
          status={quality.visibility ?? quality.contrast}
        />
      </CardContent>

      {quality.status !== "GOOD" && quality.note && (
        <div className="mx-4 mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            {quality.note ||
              "Image quality may affect AI analysis. Human review is recommended."}
          </p>
        </div>
      )}
    </Card>
  );
}

function QualityMetric({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  status?: QualityStatus;
}) {
  const safeStatus: QualityStatus = status ?? "GOOD";
  const styles: Record<QualityStatus, string> = {
    GOOD: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
    MODERATE: "border-amber-200 bg-amber-50/40 text-amber-700",
    WARNING: "border-amber-300 bg-amber-100/50 text-amber-800",
    POOR: "border-rose-200 bg-rose-50/40 text-rose-700",
  };
  const labels: Record<QualityStatus, string> = {
    GOOD: "Good",
    MODERATE: "Moderate",
    WARNING: "Warning",
    POOR: "Poor",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-lg border p-3",
        styles[safeStatus]
      )}
    >
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-[13px] font-medium">
          {labels[safeStatus]}
        </span>
      </div>
    </div>
  );
}
