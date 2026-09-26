"use client";

import { cn } from "@/lib/utils";

/**
 * Reusable skeleton loading primitives.
 * Use these for any async-loaded content (case tables, KPI grids, charts, reports).
 */
export function Skeleton({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer rounded-md", className)}
      style={style}
      aria-hidden
      {...props}
    />
  );
}

/** Skeleton for a single KPI card */
export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton for a single row of the cases table */
export function CaseRowSkeleton() {
  return (
    <tr>
      <td className="px-5 py-3">
        <Skeleton className="h-3.5 w-20" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-5 w-24 rounded-full" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-3.5 w-24" />
      </td>
      <td className="px-5 py-3 text-right">
        <Skeleton className="ml-auto h-7 w-16 rounded-md" />
      </td>
    </tr>
  );
}

/** Skeleton for the cases table */
export function CaseTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="bg-muted/50 px-5 py-2.5 text-[11.5px] uppercase tracking-wider text-muted-foreground">
        Loading cases...
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <CaseRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton grid for KPI cards */
export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a chart container */
export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
      <Skeleton className="w-full" style={{ height }} />
    </div>
  );
}
