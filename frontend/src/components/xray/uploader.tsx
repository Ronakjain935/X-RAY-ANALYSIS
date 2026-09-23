"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileImage,
  X,
  Loader2,
  ScanLine,
  Trash2,
  Plus,
  RotateCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/types";
import { makePlaceholderXray } from "@/lib/demo-data";
import { Progress } from "@/components/ui/progress";

export interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "analyzing" | "done" | "error";
  result?: AnalysisResponse;
  error?: string;
  progress?: number;
}

interface UploaderProps {
  onAnalyze: (items: QueueItem[]) => void;
}

export function XrayUploader({ onAnalyze }: UploaderProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = ".jpg,.jpeg,.png,image/jpeg,image/png";

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(
      (f) => f.type === "image/jpeg" || f.type === "image/png" || /\.(jpe?g|png)$/i.test(f.name)
    );
    if (arr.length === 0) {
      toast.warning("Please upload JPG, JPEG or PNG images.");
      return;
    }
    const next = arr.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "queued" as const,
    }));
    setItems((prev) => [...prev, ...next]);
    toast.success(`${arr.length} image${arr.length > 1 ? "s" : ""} added to queue.`);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function clearAll() {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
  }

  async function analyzeAll() {
    if (items.length === 0) {
      toast.warning("Add at least one X-ray image first.");
      return;
    }
    // Prevent duplicate analysis requests while one is already running.
    if (analyzing) return;

    setAnalyzing(true);

    // Track the latest snapshot of items in a plain local variable.
    // This lets us call `onAnalyze(...)` after the loop WITHOUT reading
    // stale state and WITHOUT calling it inside a setState updater
    // (which would trigger the "Cannot update a component while rendering
    // a different component" React warning).
    let working = items;

    // Sequentially analyze to keep the demo deterministic and avoid duplicate case IDs.
    for (let i = 0; i < working.length; i++) {
      const item = working[i];
      if (item.status === "done") continue;

      // Mark this item as analyzing — update both local snapshot and state.
      working = working.map((it) =>
        it.id === item.id ? { ...it, status: "analyzing", progress: 20 } : it
      );
      setItems(working);

      try {
        // Animate progress while waiting.
        // The setState updater here is pure (only computes new state from prev),
        // so it's safe — no side effects, no parent setState calls.
        const progressTimer = setInterval(() => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    progress: Math.min(90, (it.progress ?? 20) + 8),
                  }
                : it
            )
          );
        }, 150);

        const result = await api.analyze(item.file);
        clearInterval(progressTimer);

        // Mark as done in both local snapshot and state.
        working = working.map((it) =>
          it.id === item.id
            ? { ...it, status: "done", result, progress: 100 }
            : it
        );
        setItems(working);
      } catch (e: any) {
        working = working.map((it) =>
          it.id === item.id
            ? { ...it, status: "error", error: e?.message ?? "Analyze failed" }
            : it
        );
        setItems(working);
      }
    }

    setAnalyzing(false);

    // ✅ Notify parent OUTSIDE any setState updater.
    // `working` is a plain local variable (not state), so calling onAnalyze
    // here is a normal post-async-call side effect, which is safe and does
    // not happen during XrayUploader's render phase.
    onAnalyze(working);
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[15px]">Upload Chest X-Rays</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Supports JPG, JPEG and PNG. Multiple images supported.
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[12px] text-muted-foreground"
              onClick={clearAll}
              disabled={analyzing}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "upload-grid-bg flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition",
            dragOver
              ? "border-primary bg-accent/40"
              : "border-border bg-muted/30 hover:border-primary/40 hover:bg-accent/20"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={onFileChange}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-7 w-7" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-medium text-foreground">
              Drag &amp; drop chest X-ray images
            </span>
            <span className="text-[12px] text-muted-foreground">
              or <span className="font-medium text-primary">browse files</span>{" "}
              · JPG, JPEG, PNG · up to 10 images
            </span>
          </div>
        </div>

        {/* Queue */}
        {items.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-foreground">
                Analysis Queue ({items.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                {items.filter((i) => i.status === "done").length}/{items.length}{" "}
                analyzed
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, idx) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  index={idx + 1}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action row — always visible so reviewers can add demo data without uploading */}
        <div className="mt-1 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => {
              // Add a demo placeholder image
              const blob = new Blob(
                [
                  decodeURIComponent(
                    makePlaceholderXray(randomIndex()).split(",")[1] ?? ""
                  ),
                ],
                { type: "image/svg+xml" }
              );
              const file = new File([blob], `sample_xray_${Date.now()}.svg`, {
                type: "image/svg+xml",
              });
              // Override preview with the SVG data URL directly
              const newItem: QueueItem = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUrl: makePlaceholderXray(randomIndex()),
                status: "queued",
              };
              setItems((prev) => [...prev, newItem]);
            }}
            disabled={analyzing}
          >
            <Plus className="h-3.5 w-3.5" />
            Add sample X-ray
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2"
            onClick={analyzeAll}
            disabled={analyzing || items.length === 0 || items.every((i) => i.status === "done")}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ScanLine className="h-3.5 w-3.5" />
                Analyze {items.length > 0 ? `(${items.length})` : ""}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueCard({
  item,
  index,
  onRemove,
}: {
  item: QueueItem;
  index: number;
  onRemove: () => void;
}) {
  const statusLabel = {
    queued: "Queued",
    analyzing: "Analyzing",
    done: "Analysis complete",
    error: "Analysis failed",
  }[item.status];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border border-border bg-black">
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="h-full w-full object-cover"
          />
          <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
            X-Ray {String(index).padStart(2, "0")}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <FileImage className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-[12px] font-medium text-foreground">
              {item.file.name}
            </span>
          </div>
          <span className="text-[10.5px] text-muted-foreground">
            {(item.file.size / 1024).toFixed(0)} KB
          </span>
          <div className="mt-1">
            <StatusPill status={item.status} label={statusLabel} />
          </div>
        </div>
        <button
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-700"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {item.status === "analyzing" && (
        <div className="flex flex-col gap-1">
          <Progress value={item.progress ?? 0} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground ai-pulse">
            {analyzingStageLabel(item.progress ?? 0)}
          </span>
        </div>
      )}

      {item.status === "done" && item.result && (
        <div className="rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[10.5px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prediction</span>
            <span
              className={cn(
                "font-medium",
                item.result.prediction === "PNEUMONIA"
                  ? "text-amber-700"
                  : "text-emerald-700"
              )}
            >
              {item.result.prediction === "PNEUMONIA"
                ? "Pneumonia Suspected"
                : "Normal"}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-muted-foreground">Score</span>
            <span className="font-mono font-medium text-foreground">
              {item.result.score.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {item.status === "error" && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10.5px] text-rose-800">
          {item.error}
        </div>
      )}
    </div>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: QueueItem["status"];
  label: string;
}) {
  const styles = {
    queued: "bg-muted text-foreground",
    analyzing: "bg-primary/10 text-primary",
    done: "bg-emerald-50 text-emerald-700",
    error: "bg-rose-50 text-rose-700",
  } as const;
  const Icon =
    status === "analyzing" ? Loader2 : status === "done" ? Check : status === "error" ? X : RotateCw;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        styles[status]
      )}
    >
      <Icon className={cn("h-2.5 w-2.5", status === "analyzing" && "animate-spin")} />
      {label}
    </span>
  );
}

function randomIndex() {
  return Math.floor(Math.random() * 3);
}

/**
 * Map progress percentage to a human-readable analysis-stage label.
 * Stages mirror the backend workflow:
 *   upload → quality check → model inference → Grad-CAM → results
 */
function analyzingStageLabel(progress: number): string {
  if (progress < 15) return "Uploading X-ray…";
  if (progress < 30) return "Checking image quality…";
  if (progress < 60) return "Running AI model…";
  if (progress < 85) return "Generating Grad-CAM explanation…";
  return "Preparing results…";
}
