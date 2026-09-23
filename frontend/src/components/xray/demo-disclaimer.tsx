"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800",
        className
      )}
    >
      Demo Data
    </Badge>
  );
}

export function AiDisclaimer({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[12.5px] text-amber-900",
        className
      )}
      role="note"
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
      <p className="leading-relaxed">
        {compact
          ? "AI-assisted screening for research and educational purposes. Not a medical diagnosis."
          : "This platform provides AI-assisted screening support for research and educational purposes. It does not provide a medical diagnosis or replace qualified medical professionals. Final decisions must be made by a qualified healthcare professional."}
      </p>
    </div>
  );
}
