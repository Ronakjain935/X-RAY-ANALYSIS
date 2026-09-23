"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Cpu,
  Network,
  Eye,
  ClipboardCheck,
  Image as ImageIcon,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { AiDisclaimer, DemoBadge } from "@/components/xray/demo-disclaimer";

const CONCEPTS = [
  {
    icon: ImageIcon,
    title: "Computer Vision",
    desc: "Image-based pattern recognition applied to chest radiographs.",
  },
  {
    icon: Brain,
    title: "Deep Learning",
    desc: "Neural networks trained on large image datasets to learn visual patterns.",
  },
  {
    icon: Network,
    title: "Transfer Learning",
    desc: "Reusing a model pre-trained on a large corpus and fine-tuning for X-ray analysis.",
  },
  {
    icon: Eye,
    title: "Explainable AI",
    desc: "Techniques such as Grad-CAM that surface which image regions influenced the prediction.",
  },
  {
    icon: ClipboardCheck,
    title: "Human-in-the-Loop AI",
    desc: "Designs that keep a qualified human as the final decision maker in the workflow.",
  },
  {
    icon: Cpu,
    title: "Medical Image Analysis",
    desc: "The broader field of applying computational methods to medical imaging data.",
  },
];

const RESPONSIBLE_USE = [
  "This platform does not provide a medical diagnosis.",
  "It does not replace a qualified healthcare professional.",
  "The model score is a model confidence/score, not a calibrated probability.",
  "Grad-CAM is for model interpretability, not proof of disease.",
  "Priority is workflow prioritization, not clinical severity.",
  "All metrics and cases shown are demo data, not clinical statistics.",
];

export function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              About X-RAY SQUARED
            </h2>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-muted-foreground">
            An academic AI project exploring explainable and human-in-the-loop
            chest X-ray screening.
          </p>
        </div>
      </div>

      {/* Hero */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Academic Project
            </span>
            <h3 className="text-[18px] font-semibold tracking-tight text-foreground">
              Smarter X-Rays. Clearer AI Insights.
            </h3>
            <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              X-RAY SQUARED is an academic AI project designed to explore
              explainable and human-in-the-loop chest X-ray screening. It
              combines deep learning-based image analysis with explainability
              tools and a structured review workflow, so that the AI never
              replaces the human reviewer but supports them with prioritized,
              interpretable findings.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-[16px] font-bold">X²</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key concepts */}
      <div>
        <h3 className="mb-3 text-[14px] font-semibold text-foreground">
          Key Concepts
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CONCEPTS.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-semibold text-foreground">
                      {c.title}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {c.desc}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pipeline summary */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-[15px]">Project Workflow</CardTitle>
          <CardDescription className="text-[12.5px]">
            A short overview of the human-in-the-loop pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <PipelineTile icon={ImageIcon} label="Upload" desc="X-ray ingestion" />
          <PipelineTile icon={Brain} label="AI Screening" desc="Model + score" />
          <PipelineTile icon={Eye} label="Explainability" desc="Grad-CAM" />
          <PipelineTile icon={ClipboardCheck} label="Human Review" desc="Final decision" />
        </CardContent>
      </Card>

      {/* Responsible use */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-[15px]">Responsible Use</CardTitle>
            </div>
            <CardDescription className="text-[12.5px]">
              What this platform is — and what it is not.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-5">
            <ul className="flex flex-col gap-2">
              {RESPONSIBLE_USE.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[12.5px] text-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-[15px]">What We Do Not Claim</CardTitle>
            </div>
            <CardDescription className="text-[12.5px]">
              Unsupported claims this platform deliberately avoids.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-5">
            <ul className="flex flex-col gap-2">
              {[
                "First of its kind",
                "100% accurate",
                "Replaces radiologists",
                "Clinically proven",
                "Provides medical diagnosis",
                "Calibrated probability output",
              ].map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[12.5px] text-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="line-through decoration-rose-400/70">
                    {r}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <AiDisclaimer />

      {/* Footer note */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
        <Stethoscope className="h-4 w-4" />
        Final medical decisions must always remain with a qualified healthcare
        professional.
      </div>
    </div>
  );
}

function PipelineTile({
  icon: Icon,
  label,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[12.5px] font-medium text-foreground">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{desc}</span>
      </div>
    </div>
  );
}
