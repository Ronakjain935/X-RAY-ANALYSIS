"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  UploadCloud,
  Gauge,
  Eye,
  Flag,
  ClipboardCheck,
  HelpCircle,
} from "lucide-react";
import { AiDisclaimer } from "@/components/xray/demo-disclaimer";

const TOPICS = [
  {
    id: "upload",
    icon: UploadCloud,
    q: "How to upload an X-ray?",
    a: "Go to the Analyze X-Ray page. Drag and drop one or more chest X-ray images onto the upload area, or click the area to browse your device. Supported formats are JPG, JPEG and PNG. Each image appears in a queue with its own analysis status. Click Analyze to start the AI workflow.",
  },
  {
    id: "confidence",
    icon: Gauge,
    q: "Understanding confidence",
    a: "Confidence (High / Medium / Low) reflects how certain the AI model is about its prediction. It is derived from the raw model score but is not a calibrated probability. A Low confidence case is flagged for additional human assessment — the model itself is signalling uncertainty.",
  },
  {
    id: "gradcam",
    icon: Eye,
    q: "Understanding Grad-CAM",
    a: "Grad-CAM is an explainability technique that highlights image regions which most influenced the model prediction. The heatmap should be interpreted as a tool for model interpretability, not as proof of disease or as a clinically localized lesion.",
  },
  {
    id: "priority",
    icon: Flag,
    q: "Understanding case priority",
    a: "Case priority (High / Medium / Low) helps organize the review queue. It is workflow prioritization — not clinical severity. A High priority case simply means the AI flagged a strong result that the reviewer should look at first. It does not represent the clinical severity of any underlying condition.",
  },
  {
    id: "human-review",
    icon: ClipboardCheck,
    q: "How does the human review workflow work?",
    a: "After AI screening, a qualified reviewer records one of three decisions: Agree with AI, Disagree with AI, or Needs Further Review. The reviewer can also add notes. The human review is the final review status — the AI cannot override it. If the reviewer disagrees, the case is updated accordingly and the report reflects the human decision.",
  },
  {
    id: "quality",
    icon: UploadCloud,
    q: "What happens when image quality is poor?",
    a: "The platform performs a prototype quality check before AI screening. If brightness, contrast, resolution or visibility are flagged as moderate or poor, the UI shows a warning and recommends human review. The platform does not claim to perform clinical-grade image QC — this is a prototype heuristic.",
  },
];

export function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              Help & Documentation
            </h2>
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-[13px] text-muted-foreground">
            Quick references for using the platform safely and effectively.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-[15px]">Frequently Asked</CardTitle>
            <CardDescription className="text-[12.5px]">
              Core topics for working with the AI-assisted screening workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Accordion
              type="single"
              defaultValue="upload"
              collapsible
              className="flex flex-col gap-1"
            >
              {TOPICS.map((t) => {
                const Icon = t.icon;
                return (
                  <AccordionItem
                    key={t.id}
                    value={t.id}
                    className="rounded-lg border border-border bg-background px-3 data-[state=open]:bg-accent/30"
                  >
                    <AccordionTrigger className="py-3 text-left text-[13px] font-medium hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {t.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 text-[12.5px] leading-relaxed text-muted-foreground">
                      {t.a}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-[15px]">Quick Tips</CardTitle>
              <CardDescription className="text-[12.5px]">
                Short pointers for getting the most out of the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              <Tip text="Always review Grad-CAM alongside the original X-ray, not in isolation." />
              <Tip text="Low confidence always means: human review recommended." />
              <Tip text="Priority ≠ clinical severity. It only sorts the review queue." />
              <Tip text="Reviewer decisions are final — AI cannot override them." />
              <Tip text="Reports include the disclaimer by default. Don't remove it." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-[15px]">Glossary</CardTitle>
              <CardDescription className="text-[12.5px]">
                Common terms used in this platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 text-[12.5px]">
              <GlossaryItem term="Model Score" def="Raw output of the AI model, 0..1. Not a calibrated probability." />
              <GlossaryItem term="Confidence" def="High/Medium/Low bucket derived from the model score." />
              <GlossaryItem term="Grad-CAM" def="Highlight overlay showing image regions that influenced the model." />
              <GlossaryItem term="Priority" def="High/Medium/Low workflow prioritization, not clinical severity." />
              <GlossaryItem term="Human Review" def="Final reviewer decision — Agree, Disagree or Needs Review." />
            </CardContent>
          </Card>
        </div>
      </div>

      <AiDisclaimer />
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-[12px] text-foreground">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      {text}
    </div>
  );
}

function GlossaryItem({ term, def }: { term: string; def: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-1.5 last:border-b-0">
      <span className="text-[12.5px] font-medium text-foreground">{term}</span>
      <span className="text-[11.5px] text-muted-foreground">{def}</span>
    </div>
  );
}
