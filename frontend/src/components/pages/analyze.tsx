"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { api, resolveMediaUrl, type BackendStatus } from "@/lib/api";
import type { XRayCase, AnalysisResponse } from "@/lib/types";
import { XrayUploader, type QueueItem } from "@/components/xray/uploader";
import { QualityAssessment } from "@/components/xray/quality-assessment";
import { AiResultCard } from "@/components/xray/ai-result";
import { GradCamView } from "@/components/xray/grad-cam";
import { ConfidenceCard } from "@/components/xray/confidence";
import { PriorityCard } from "@/components/xray/priority";
import { HumanReview } from "@/components/xray/human-review";
import { CaseReport } from "@/components/xray/case-report";
import { AiDisclaimer, DemoBadge } from "@/components/xray/demo-disclaimer";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Workflow,
  Wifi,
  WifiOff,
  Cpu,
} from "lucide-react";

interface ActiveCase {
  caseItem: XRayCase;
  previewUrl: string;
}

export function AnalyzePage() {
  const [activeCases, setActiveCases] = useState<ActiveCase[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  const addCase = useAppStore((s) => s.addCase);
  const updateCase = useAppStore((s) => s.updateCase);
  const saveReview = useAppStore((s) => s.saveReview);

  // Detect backend mode once on mount.
  useEffect(() => {
    let mounted = true;
    api.detectMode().then((s) => {
      if (mounted) setBackendStatus(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  function handleAnalyze(items: QueueItem[]) {
    const done = items.filter((i) => i.status === "done" && i.result);
    if (done.length === 0) {
      setActiveCases([]);
      return;
    }
    const newCases: ActiveCase[] = done.map((item) => {
      const r: AnalysisResponse = item.result!;
      const caseItem: XRayCase = {
        caseId: r.case_id,
        date: new Date().toISOString(),
        prediction: r.prediction,
        score: r.score,
        confidence: r.confidence,
        uncertainty: r.uncertainty,
        probabilities: r.probabilities,
        priority: r.priority,
        quality: r.quality,
        reviewStatus: "PENDING",
        gradcamAvailable: !!r.gradcam_url,
        gradcamUrl: r.gradcam_url ? resolveMediaUrl(r.gradcam_url) ?? undefined : undefined,
        imageUrl: item.previewUrl,
        fileName: item.file.name,
        fileSize: `${(item.file.size / 1024).toFixed(0)} KB`,
      };
      addCase(caseItem);
      return { caseItem, previewUrl: item.previewUrl };
    });
    setActiveCases(newCases);
    setActiveIdx(0);
  }

  const active = activeCases[activeIdx];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-gradient-to-br from-primary/[0.05] via-background to-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              Analyze Chest X-Ray
            </h2>
            {backendStatus?.mode === "live" ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800">
                <Wifi className="mr-1 h-3 w-3" />
                Live Backend
              </Badge>
            ) : (
              <DemoBadge />
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Upload a chest X-ray for AI-assisted screening and explainable
            analysis.
          </p>
          {backendStatus?.mode === "live" && (
            <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Cpu className="h-3 w-3" />
              {backendStatus.modelAvailable
                ? "Trained model loaded — real predictions will be served."
                : "Backend online but trained model is not available — /api/analyze returns HTTP 503. Please ensure S_RAY_Pneumonia_Model.keras or pneumonia_resnet18_best.pth is available."}
            </div>
          )}
          {backendStatus?.mode === "demo" &&
            backendStatus.reason === "unreachable" && (
              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-amber-700">
                <WifiOff className="h-3 w-3" />
                Could not reach FastAPI backend at{" "}
                <code className="font-mono">
                  {process.env.NEXT_PUBLIC_API_URL}
                </code>
                . Showing DEMO data.
              </div>
            )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="text-[11.5px] text-muted-foreground">
            Upload → Quality → Screening → Grad-CAM → Priority → Review → Report
          </span>
        </div>
      </div>

      <XrayUploader onAnalyze={handleAnalyze} />

      {active && (
        <>
          {/* Multiple results switcher */}
          {activeCases.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                Results:
              </span>
              {activeCases.map((ac, i) => (
                <button
                  key={ac.caseItem.caseId}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition",
                    i === activeIdx
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  )}
                >
                  <span className="font-mono">{ac.caseItem.caseId}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {/* Case workflow */}
          <div className="flex flex-col gap-6">
            {/* Quality assessment */}
            <WorkflowStep
              step={1}
              title="Image Quality Check"
              subtitle="Before AI screening, evaluate the upload quality."
            >
              <QualityAssessment quality={active.caseItem.quality} />
            </WorkflowStep>

            {/* AI Result */}
            <WorkflowStep
              step={2}
              title="AI Screening Result"
              subtitle="Model prediction, raw score and confidence level."
            >
              <AiResultCard
                prediction={active.caseItem.prediction}
                score={active.caseItem.score}
                confidence={active.caseItem.confidence}
                priority={active.caseItem.priority}
                caseId={active.caseItem.caseId}
                uncertainty={active.caseItem.uncertainty}
                probabilities={active.caseItem.probabilities}
              />
            </WorkflowStep>

            {/* Grad-CAM */}
            <WorkflowStep
              step={3}
              title="Explainable AI — Grad-CAM"
              subtitle="Visualize regions that influenced the prediction."
            >
              <GradCamView
                imageUrl={active.previewUrl}
                gradcamUrl={active.caseItem.gradcamUrl}
                prediction={active.caseItem.prediction}
                caseId={active.caseItem.caseId}
              />
            </WorkflowStep>

            {/* Uncertainty + Priority in two columns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <WorkflowStep
                step={4}
                title="Confidence & Uncertainty"
                subtitle="How certain the AI is about its prediction."
              >
                <ConfidenceCard
                  confidence={active.caseItem.confidence}
                  score={active.caseItem.score}
                  uncertainty={active.caseItem.uncertainty}
                />
              </WorkflowStep>
              <WorkflowStep
                step={5}
                title="Case Priority"
                subtitle="Workflow prioritization, not clinical severity."
              >
                <PriorityCard
                  priority={active.caseItem.priority}
                  prediction={active.caseItem.prediction}
                  score={active.caseItem.score}
                  confidence={active.caseItem.confidence}
                />
              </WorkflowStep>
            </div>

            {/* Human review */}
            <WorkflowStep
              step={6}
              title="Human Review"
              subtitle="The final review status — AI cannot override this."
            >
              <HumanReview
                caseId={active.caseItem.caseId}
                prediction={active.caseItem.prediction}
                confidence={active.caseItem.confidence}
                gradcamAvailable={active.caseItem.gradcamAvailable}
                reviewStatus={active.caseItem.reviewStatus}
                initialDecision={active.caseItem.reviewDecision}
                initialNotes={active.caseItem.reviewerNotes}
                onSave={(decision, notes, status) => {
                  saveReview(active.caseItem.caseId, decision, notes, status);
                  // Update the local active case so the UI reflects the saved state
                  setActiveCases((prev) =>
                    prev.map((ac, i) =>
                      i === activeIdx
                        ? {
                            ...ac,
                            caseItem: {
                              ...ac.caseItem,
                              reviewDecision: decision,
                              reviewerNotes: notes,
                              reviewStatus: status,
                            },
                          }
                        : ac
                    )
                  );
                }}
              />
            </WorkflowStep>

            {/* Report */}
            <WorkflowStep
              step={7}
              title="AI-Assisted Report"
              subtitle="Generate, download or print the case report."
            >
              <CaseReport caseItem={active.caseItem} />
            </WorkflowStep>

            <AiDisclaimer />

            {/* Closing CTA */}
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-medium text-foreground">
                      Workflow complete for {active.caseItem.caseId}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      All AI-assisted outputs have been reviewed by a human.
                      Final decisions remain with a qualified healthcare
                      professional.
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() => {
                    setActiveCases([]);
                  }}
                >
                  Start new analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!active && activeCases.length === 0 && (
        <EmptyStateHint />
      )}
    </div>
  );
}

function WorkflowStep({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
          {step}
        </div>
        <div className="flex flex-col">
          <h3 className="text-[14.5px] font-semibold text-foreground">{title}</h3>
          <p className="text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="ml-1 border-l-2 border-dashed border-border pl-9">
        {children}
      </div>
    </section>
  );
}

function EmptyStateHint() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Workflow className="h-7 w-7" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-foreground">
            No analyses yet
          </span>
          <span className="max-w-md text-[12px] text-muted-foreground">
            Upload one or more chest X-rays above to start the AI-assisted
            workflow: quality check, screening, Grad-CAM, priority and human
            review.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
