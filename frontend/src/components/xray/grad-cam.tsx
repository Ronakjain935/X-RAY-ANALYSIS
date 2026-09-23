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
  prediction: Prediction;
  caseId: string;
  className?: string;
}

export function GradCamView({
  imageUrl,
  prediction,
  caseId,
  className,
}: GradCamProps) {
  const [tab, setTab] = useState<"original" | "heatmap" | "overlay">("overlay");
  const [imgError, setImgError] = useState(false);

  // If the backend-served Grad-CAM image fails to load (e.g., demo mode,
  // network error, or 404), fall back to the inline SVG X-ray placeholder
  // so the viewer remains usable.
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
            <CardTitle className="text-[14.5px]">
              Explainable AI — Why did the AI make this prediction?
            </CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Grad-CAM highlights regions that most influenced the model
              prediction.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="gap-3">
          <TabsList className="grid w-full max-w-sm grid-cols-3">
            <TabsTrigger value="original" className="text-[12px]">
              Original
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-[12px]">
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="overlay" className="text-[12px]">
              Overlay
            </TabsTrigger>
          </TabsList>

          <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-lg border border-border bg-black">
            <div className="relative aspect-square">
              {/* Original X-ray */}
              <img
                src={safeImageUrl}
                alt={`Chest X-ray ${caseId}`}
                onError={() => setImgError(true)}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity",
                  tab === "heatmap" && "opacity-0",
                  tab !== "heatmap" && "opacity-100"
                )}
              />

              {/* Heatmap-only view */}
              {tab === "heatmap" && (
                <div
                  className={cn(
                    "absolute inset-0",
                    prediction === "PNEUMONIA"
                      ? "gradcam-demo"
                      : "gradcam-cool-demo"
                  )}
                  style={{
                    background: "#000",
                  }}
                >
                  <div
                    className={cn(
                      "absolute inset-0",
                      prediction === "PNEUMONIA" ? "gradcam-demo" : "gradcam-cool-demo"
                    )}
                  />
                </div>
              )}

              {/* Overlay view = X-ray + heatmap blended */}
              {tab === "overlay" && (
                <div
                  className={cn(
                    "absolute inset-0 mix-blend-multiply",
                    prediction === "PNEUMONIA" ? "gradcam-demo" : "gradcam-cool-demo"
                  )}
                  aria-hidden
                />
              )}

              {/* Colorbar */}
              <div className="absolute right-2 top-2 flex flex-col items-center gap-1 rounded-md bg-black/60 px-1.5 py-2 backdrop-blur">
                <span className="text-[9px] font-medium uppercase tracking-wider text-white">
                  High
                </span>
                <div className="h-32 w-2 rounded-full bg-gradient-to-t from-blue-600 via-green-500 via-yellow-400 to-red-500" />
                <span className="text-[9px] font-medium uppercase tracking-wider text-white">
                  Low
                </span>
              </div>

              <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
                {tab === "original" && "Original X-Ray"}
                {tab === "heatmap" && "Grad-CAM Heatmap (Demo)"}
                {tab === "overlay" && "Grad-CAM Overlay (Demo)"}
              </div>
            </div>
          </div>
        </Tabs>

        <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-[11.5px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="leading-relaxed">
            Highlighted regions represent areas that influenced the model
            prediction. This visualization is provided for model
            interpretability and does not prove the presence of disease. The
            heatmap shown here is a stylized demo overlay, not a real Grad-CAM
            output from a trained model.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
