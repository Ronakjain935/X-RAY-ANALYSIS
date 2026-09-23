"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  HelpCircle,
  Eye,
  Brain,
  Gauge,
  ImageIcon,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  PredictionBadge,
  ConfidenceBadge,
  ReviewStatusBadge,
} from "./badges";
import { api } from "@/lib/api";
import type {
  Prediction,
  ConfidenceLevel,
  ReviewStatus,
  ReviewDecision,
} from "@/lib/types";

// Map internal ReviewDecision enum → backend human_decision strings
const DECISION_TO_BACKEND: Record<ReviewDecision, "AGREE_WITH_AI" | "DISAGREE_WITH_AI" | "NEEDS_FURTHER_REVIEW"> = {
  AGREE: "AGREE_WITH_AI",
  DISAGREE: "DISAGREE_WITH_AI",
  NEEDS_REVIEW: "NEEDS_FURTHER_REVIEW",
};

interface HumanReviewProps {
  caseId: string;
  prediction: Prediction;
  confidence: ConfidenceLevel;
  gradcamAvailable: boolean;
  reviewStatus: ReviewStatus;
  initialDecision?: ReviewDecision;
  initialNotes?: string;
  onSave: (decision: ReviewDecision, notes: string, status: ReviewStatus) => void;
}

export function HumanReview({
  caseId,
  prediction,
  confidence,
  gradcamAvailable,
  reviewStatus,
  initialDecision,
  initialNotes,
  onSave,
}: HumanReviewProps) {
  const [decision, setDecision] = useState<ReviewDecision | null>(
    initialDecision ?? null
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  const reviewed = reviewStatus === "REVIEWED";

  async function save() {
    if (!decision) {
      toast.warning("Please select a review decision before saving.");
      return;
    }
    setSaving(true);

    // When live, persist the review to the backend FIRST.
    // If the backend call fails, we don't update local state — show the error.
    if (api.isLiveMode()) {
      try {
        await api.submitReview(caseId, {
          human_decision: DECISION_TO_BACKEND[decision],
          reviewer_notes: notes || null,
        });
      } catch (e: any) {
        setSaving(false);
        toast.error(e?.message ?? "Failed to submit review to backend.");
        return;
      }
    }

    // Update local state (Zustand store + parent component)
    onSave(decision, notes, "REVIEWED");
    setTimeout(() => {
      setSaving(false);
      toast.success(
        api.isLiveMode()
          ? "Review saved to backend. Human review is the final review status."
          : "Review saved locally (demo mode). Human review is the final review status."
      );
    }, 200);
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14.5px]">Human Review</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              The human review is the final review status. AI cannot override
              this decision.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Status</span>
            <ReviewStatusBadge status={reviewStatus} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 p-5">
        {/* AI summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            AI Output Summary
          </div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryItem
              icon={Brain}
              label="AI Prediction"
            >
              <PredictionBadge prediction={prediction} />
            </SummaryItem>
            <SummaryItem icon={Gauge} label="AI Confidence">
              <ConfidenceBadge confidence={confidence} />
            </SummaryItem>
            <SummaryItem icon={ImageIcon} label="AI Explanation">
              {gradcamAvailable ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                  Grad-CAM available
                </span>
              ) : (
                <span className="text-[12px] text-muted-foreground">
                  Not available
                </span>
              )}
            </SummaryItem>
          </div>
        </div>

        {/* Decision actions */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">
              Reviewer Decision
            </span>
            {reviewed && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reviewer has reviewed this case
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DecisionButton
              icon={Check}
              label="Agree with AI"
              tone="good"
              active={decision === "AGREE"}
              onClick={() => setDecision("AGREE")}
            />
            <DecisionButton
              icon={X}
              label="Disagree with AI"
              tone="danger"
              active={decision === "DISAGREE"}
              onClick={() => setDecision("DISAGREE")}
            />
            <DecisionButton
              icon={HelpCircle}
              label="Needs Further Review"
              tone="warning"
              active={decision === "NEEDS_REVIEW"}
              onClick={() => setDecision("NEEDS_REVIEW")}
            />
          </div>
        </div>

        {/* Reviewer notes */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-medium text-foreground">
            Reviewer Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add review comments..."
            className="min-h-[100px] text-[13px]"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-muted-foreground">
            Case ID:{" "}
            <span className="font-mono text-foreground">{caseId}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => {
                setDecision(null);
                setNotes("");
              }}
              disabled={saving}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="h-9 gap-2"
              onClick={save}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Review
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function DecisionButton({
  icon: Icon,
  label,
  tone,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "good" | "warning" | "danger";
  active: boolean;
  onClick: () => void;
}) {
  const tones = {
    good: {
      idle: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
      active: "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200",
      iconIdle: "bg-emerald-100 text-emerald-700",
      iconActive: "bg-emerald-500 text-white",
    },
    warning: {
      idle: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
      active: "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200",
      iconIdle: "bg-amber-100 text-amber-700",
      iconActive: "bg-amber-500 text-white",
    },
    danger: {
      idle: "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
      active: "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-200",
      iconIdle: "bg-rose-100 text-rose-700",
      iconActive: "bg-rose-500 text-white",
    },
  } as const;
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition",
        active ? t.active : t.idle
      )}
      aria-pressed={active}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          active ? t.iconActive : t.iconIdle
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[12.5px] font-medium">{label}</span>
        <span className="text-[10.5px] text-muted-foreground">
          {tone === "good"
            ? "Confirm AI finding"
            : tone === "warning"
            ? "Request more info"
            : "Override AI finding"}
        </span>
      </div>
    </button>
  );
}
