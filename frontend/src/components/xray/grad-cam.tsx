"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import type { Prediction } from "@/lib/types";

interface GradCamProps {
  imageUrl: string;
  gradcamUrl?: string | null;
  prediction: Prediction;
  caseId: string;
  className?: string;
  compact?: boolean;
}

export function GradCamView({
  imageUrl,
  gradcamUrl,
  prediction,
  caseId,
  className,
  compact = false,
}: GradCamProps) {
  const hasGradCam = Boolean(gradcamUrl);
  const [tab, setTab] = useState<"original" | "overlay">(hasGradCam ? "overlay" : "original");
  const [imgError, setImgError] = useState(false);
  const [gradcamError, setGradcamError] = useState(false);

  const safeImageUrl = imgError
    ? `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'><rect width='1024' height='1024' fill='#0a0a0a'/><g stroke='#1f2937' stroke-width='3' fill='none'><path d='M 200 240 Q 512 180 824 240'/><path d='M 210 300 Q 512 250 834 300'/><path d='M 220 360 Q 512 320 844 360'/><path d='M 230 420 Q 512 390 854 420'/><path d='M 240 480 Q 512 460 864 480'/><path d='M 250 540 Q 512 530 874 540'/></g><rect x='500' y='180' width='24' height='540' rx='12' fill='#0b1220' fill-opacity='0.6'/></svg>`
      )}`
    : imageUrl;

  return (
    <Card className={className}>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className={cn(compact ? "text-[13.5px]" : "text-[14.5px]")}>
              Explainable AI — Grad-CAM Feature Attribution
            </CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Grad-CAM highlights radiographic regions that most influenced the model prediction.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="gap-3">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="original" className="text-[12px]">
              Original X-Ray
            </TabsTrigger>
            <TabsTrigger value="overlay" className="text-[12px]">
              Grad-CAM Overlay
            </TabsTrigger>
          </TabsList>

          <div className={cn("relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-black", compact ? "max-w-[480px]" : "max-w-[640px]")}>
            <div className="relative aspect-square">
              {tab === "original" ? (
                <img
                  src={safeImageUrl}
                  alt={`Chest X-ray ${caseId}`}
                  onError={() => setImgError(true)}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : hasGradCam && !gradcamError ? (
                <img
                  src={gradcamUrl!}
                  alt={`Grad-CAM overlay for ${caseId}`}
                  onError={() => setGradcamError(true)}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <p className="text-[13px] font-medium text-foreground/80">
                    Grad-CAM visualization is unavailable for this analysis.
                  </p>
                  <p className="mt-1 text-[11.5px] max-w-sm text-muted-foreground">
                    The model prediction was computed, but spatial activation maps could not be generated.
                  </p>
                </div>
              )}

              {/* Colorbar only shown on active overlay view */}
              {tab === "overlay" && hasGradCam && !gradcamError && (
                <div className="absolute right-2 top-2 flex flex-col items-center gap-1 rounded-md bg-black/60 px-1.5 py-2 backdrop-blur">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-white">
                    High
                  </span>
                  <div className="h-28 w-2 rounded-full bg-gradient-to-t from-blue-600 via-green-500 via-yellow-400 to-red-500" />
                  <span className="text-[9px] font-medium uppercase tracking-wider text-white">
                    Low
                  </span>
                </div>
              )}

              <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
                {tab === "original"
                  ? "Original X-Ray"
                  : hasGradCam && !gradcamError
                  ? "Real Grad-CAM Overlay"
                  : "Grad-CAM Unavailable"}
              </div>
            </div>
          </div>
        </Tabs>

        <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-[11.5px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="leading-relaxed">
            Highlighted regions represent image features that most influenced the model
            prediction. This visualization is an interpretability tool and does not prove the
            presence or absence of disease. Human review is required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
