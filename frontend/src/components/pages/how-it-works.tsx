"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  UploadCloud,
  Sun,
  Brain,
  Eye,
  Flag,
  ClipboardCheck,
  FileText,
  ArrowDown,
  Server,
  Cpu,
  Image as ImageIcon,
  Activity,
  User,
  Monitor,
} from "lucide-react";
import { DemoBadge } from "@/components/xray/demo-disclaimer";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload X-Ray",
    desc: "Radiographer or operator uploads one or more chest X-ray images (JPG, JPEG or PNG).",
    detail:
      "Multiple images can be queued and analyzed together. Each image retains its own analysis state.",
  },
  {
    icon: Sun,
    title: "Image Quality Check",
    desc: "The platform performs a prototype quality assessment before AI screening.",
    detail:
      "Brightness, contrast, resolution and visibility are evaluated. Poor quality images are flagged for human review.",
  },
  {
    icon: Brain,
    title: "AI Screening",
    desc: "A PyTorch CNN model produces a prediction and raw model score.",
    detail:
      "The raw model score is a model confidence/score, not a medically calibrated probability. It must not be used as a standalone diagnosis.",
  },
  {
    icon: Eye,
    title: "Explainable AI",
    desc: "Grad-CAM highlights regions that most influenced the model prediction.",
    detail:
      "This visualization supports interpretability. It does not prove the presence of disease or localise pathology with clinical certainty.",
  },
  {
    icon: Flag,
    title: "Case Prioritization",
    desc: "Cases are sorted into High, Medium or Low priority for review.",
    detail:
      "Priority helps organize the review queue — it is workflow prioritization, not clinical severity.",
  },
  {
    icon: ClipboardCheck,
    title: "Human Review",
    desc: "A qualified reviewer records a final decision: agree, disagree, or needs further review.",
    detail:
      "The human review is the final review status. The AI cannot override the reviewer decision.",
  },
];

const PIPELINE = [
  { icon: User, label: "User" },
  { icon: Monitor, label: "Frontend" },
  { icon: Server, label: "FastAPI Backend" },
  { icon: ImageIcon, label: "Image Preprocessing" },
  { icon: Cpu, label: "PyTorch CNN Model" },
  { icon: Activity, label: "Prediction" },
  { icon: Eye, label: "Confidence + Grad-CAM + Priority" },
  { icon: ClipboardCheck, label: "Human Review" },
  { icon: FileText, label: "Report" },
];

export function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              How It Works
            </h2>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-muted-foreground">
            A visual walkthrough of the AI-assisted screening workflow.
          </p>
        </div>
      </div>

      {/* Six-step workflow */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={i} className="relative">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-[12px] font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[14.5px] font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-[12.5px] text-foreground/80">
                    {step.desc}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Architecture diagram */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-[15px]">
            System Architecture
          </CardTitle>
          <CardDescription className="text-[12.5px]">
            Reference architecture for connecting this UI to a real FastAPI
            backend. The frontend uses a service abstraction so swapping mock
            for real is a single-flag change.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col items-stretch gap-2">
            {PIPELINE.map((node, i) => {
              const Icon = node.icon;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12.5px] font-medium text-foreground">
                        {node.label}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">
                        Step {i + 1} of {PIPELINE.length}
                      </span>
                    </div>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="flex h-7 items-center">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-md border border-border bg-background p-3 text-[11.5px] text-muted-foreground">
            <strong className="font-medium text-foreground">
              API contract:
            </strong>{" "}
            <code className="font-mono text-foreground">POST /api/analyze</code>{" "}
            (single image) and{" "}
            <code className="font-mono text-foreground">
              POST /api/analyze-batch
            </code>{" "}
            (multiple images). The UI talks only to the service module in{" "}
            <code className="font-mono text-foreground">/lib/api.ts</code> —
            flipping <code>USE_MOCK=false</code> activates the real backend
            without changing any component.
          </div>
        </CardContent>
      </Card>

      {/* API response shape */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-[15px]">Expected API Response</CardTitle>
          <CardDescription className="text-[12.5px]">
            Single-image analysis response contract.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <pre className="overflow-x-auto scrollbar-thin bg-muted/40 p-4 text-[11.5px] leading-relaxed text-foreground">
            <code>{`{
  "case_id": "XR-0001",
  "prediction": "PNEUMONIA",
  "score": 0.91,
  "confidence": "HIGH",
  "priority": "HIGH",
  "quality": {
    "status": "GOOD",
    "brightness": "GOOD",
    "contrast": "GOOD",
    "resolution": "GOOD",
    "visibility": "GOOD"
  },
  "gradcam_url": "/results/XR-0001-gradcam.png"
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
