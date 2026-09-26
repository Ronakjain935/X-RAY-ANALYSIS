"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { api, type BackendStatus } from "@/lib/api";
import type { BackendAnalyticsSummary } from "@/lib/types";
import { DemoBadge } from "@/components/xray/demo-disclaimer";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageKey } from "@/lib/types";
import { cn } from "@/lib/utils";

function last14Days(cases: { date: string; prediction: string }[]) {
  const days: { date: string; normal: number; pneumonia: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayCases = cases.filter((c) => c.date.slice(0, 10) === key);
    days.push({
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      normal: dayCases.filter((c) => c.prediction === "NORMAL").length,
      pneumonia: dayCases.filter((c) => c.prediction === "PNEUMONIA").length,
    });
  }
  return days;
}

export function AnalyticsPage() {
  const storeCases = useAppStore((s) => s.cases);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [summary, setSummary] = useState<BackendAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.detectMode().then((s) => {
      if (mounted) setBackendStatus(s);
    });
    return () => { mounted = false; };
  }, []);

  const isLive = backendStatus?.mode === "live";

  const refresh = async () => {
    if (!isLive) return;
    setLoading(true);
    try {
      const s = await api.getAnalytics();
      if (s) setSummary(s);
    } catch (e) {
      // ignore — keep prior data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLive) {
      queueMicrotask(() => {
        void refresh();
      });
    }
  }, [isLive]);

  // Choose data source: backend summary when live, otherwise local store.
  // The local store is initialized from DEMO_CASES, so all numbers are
  // clearly demo in that case.
  const cases = storeCases;
  const total = isLive && summary ? summary.total_cases : cases.length;
  const normal = isLive && summary ? summary.normal_cases : cases.filter((c) => c.prediction === "NORMAL").length;
  const pneumonia = isLive && summary ? summary.pneumonia_cases : cases.filter((c) => c.prediction === "PNEUMONIA").length;
  const needsReview = isLive && summary ? summary.pending_reviews : cases.filter((c) => c.reviewStatus === "PENDING").length;

  // Distributions
  const predictionDist = [
    { name: "Normal", value: normal, color: "oklch(0.62 0.10 162)" },
    { name: "Pneumonia Suspected", value: pneumonia, color: "oklch(0.55 0.21 25)" },
  ];

  const confidenceDist = isLive && summary
    ? (["HIGH", "MEDIUM", "LOW"] as const).map((k) => ({
        name: k === "HIGH" ? "High" : k === "MEDIUM" ? "Medium" : "Low",
        value: summary.confidence_distribution[k] ?? 0,
        color:
          k === "HIGH"
            ? "oklch(0.55 0.10 162)"
            : k === "MEDIUM"
            ? "oklch(0.72 0.13 75)"
            : "oklch(0.55 0.21 25)",
      }))
    : (["HIGH", "MEDIUM", "LOW"] as const).map((k) => ({
        name: k === "HIGH" ? "High" : k === "MEDIUM" ? "Medium" : "Low",
        value: cases.filter((c) => c.confidence === k).length,
        color:
          k === "HIGH"
            ? "oklch(0.55 0.10 162)"
            : k === "MEDIUM"
            ? "oklch(0.72 0.13 75)"
            : "oklch(0.55 0.21 25)",
      }));

  const priorityDist = isLive && summary
    ? (["HIGH", "MEDIUM", "LOW"] as const).map((k) => ({
        name: k === "HIGH" ? "High" : k === "MEDIUM" ? "Medium" : "Low",
        value: summary.priority_distribution[k] ?? 0,
        color:
          k === "HIGH"
            ? "oklch(0.55 0.21 25)"
            : k === "MEDIUM"
            ? "oklch(0.72 0.13 75)"
            : "oklch(0.78 0.05 240)",
      }))
    : (["HIGH", "MEDIUM", "LOW"] as const).map((k) => ({
        name: k === "HIGH" ? "High" : k === "MEDIUM" ? "Medium" : "Low",
        value: cases.filter((c) => c.priority === k).length,
        color:
          k === "HIGH"
            ? "oklch(0.55 0.21 25)"
            : k === "MEDIUM"
            ? "oklch(0.72 0.13 75)"
            : "oklch(0.78 0.05 240)",
      }));

  // AI-Human agreement
  const agreed = isLive && summary ? summary.agreed_with_ai : cases.filter((c) => c.reviewStatus === "REVIEWED" && c.reviewDecision === "AGREE").length;
  const disagreed = isLive && summary ? summary.disagreed_with_ai : cases.filter((c) => c.reviewStatus === "REVIEWED" && c.reviewDecision === "DISAGREE").length;
  const further = isLive && summary ? summary.needs_further_review : cases.filter((c) => c.reviewStatus === "REVIEWED" && c.reviewDecision === "NEEDS_REVIEW").length;

  const agreementDist = [
    { name: "Agreed with AI", value: agreed, color: "oklch(0.55 0.10 162)" },
    { name: "Disagreed with AI", value: disagreed, color: "oklch(0.55 0.21 25)" },
    { name: "Further Review", value: further, color: "oklch(0.72 0.13 75)" },
  ];

  const trend = useMemo(() => last14Days(cases), [cases]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              Platform Analytics
            </h2>
            {isLive ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800">
                Live Backend
              </Badge>
            ) : (
              <DemoBadge />
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            {isLive
              ? "Live metrics from the FastAPI backend — real cases from the database."
              : "Operational metrics for the screening workflow and AI–human agreement. All numbers are demo data, not clinical statistics."}
          </p>
        </div>
        {isLive && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[12px]"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniStat icon={Users} label="Total Cases" value={total} tone="neutral" />
        <MiniStat
          icon={CheckCircle2}
          label="Normal"
          value={normal}
          tone="good"
        />
        <MiniStat
          icon={AlertTriangle}
          label="Pneumonia Suspected"
          value={pneumonia}
          tone="warning"
        />
        <MiniStat
          icon={Eye}
          label="Needs Review"
          value={needsReview}
          tone="info"
        />
      </div>

      {/* Top row charts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Prediction Distribution"
          subtitle="Breakdown of AI screening outcomes."
        >
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={predictionDist}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {predictionDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {predictionDist.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ background: d.color }}
                    />
                    <span className="text-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {d.value}{" "}
                    <span className="text-[10.5px] font-normal text-muted-foreground">
                      ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Confidence Distribution"
          subtitle="How confident the AI is across all cases."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={confidenceDist} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.91 0.012 256)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="oklch(0.52 0.018 256)"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="oklch(0.52 0.018 256)" />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {confidenceDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* AI-Human agreement section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-[15px] font-semibold text-foreground">
            AI–Human Review Agreement
          </h3>
          <Badge variant="secondary" className="text-[10.5px]">
            Human-in-the-loop
          </Badge>
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          The platform is designed for human-in-the-loop review. Disagreement
          with the AI is recorded as a normal and expected workflow outcome —
          the reviewer always has the final say.
        </p>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ChartCard
            title="Agreement Breakdown"
            subtitle="Decisions recorded by human reviewers."
            className="xl:col-span-2"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={agreementDist}
                layout="vertical"
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.91 0.012 256)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="oklch(0.52 0.018 256)" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tick={{ fontSize: 12 }}
                  stroke="oklch(0.52 0.018 256)"
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {agreementDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 gap-3">
            <AgreementTile
              tone="good"
              label="Agreed with AI"
              value={agreed}
              hint="Reviewer confirmed AI finding"
            />
            <AgreementTile
              tone="danger"
              label="Disagreed with AI"
              value={disagreed}
              hint="Reviewer overrode AI finding"
            />
            <AgreementTile
              tone="warning"
              label="Further Review"
              value={further}
              hint="Reviewer requested more information"
            />
          </div>
        </div>
      </div>

      {/* Lower row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Priority Distribution"
          subtitle="Workflow prioritization across cases."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityDist} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.91 0.012 256)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.52 0.018 256)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="oklch(0.52 0.018 256)" />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Cases Over Time"
          subtitle="Daily screening volume (last 14 days)."
          action={
            <Badge variant="outline" className="gap-1 text-[10.5px]">
              <TrendingUp className="h-3 w-3" />
              Trend
            </Badge>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.62 0.10 162)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.62 0.10 162)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gPneumonia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.21 25)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.55 0.21 25)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.91 0.012 256)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="oklch(0.52 0.018 256)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="oklch(0.52 0.018 256)" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="normal"
                name="Normal"
                stackId="1"
                stroke="oklch(0.62 0.10 162)"
                fill="url(#gNormal)"
              />
              <Area
                type="monotone"
                dataKey="pneumonia"
                name="Pneumonia"
                stackId="1"
                stroke="oklch(0.55 0.21 25)"
                fill="url(#gPneumonia)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Footnote */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[12px] text-amber-900">
        <strong className="font-medium">Demo Data:</strong> All metrics shown
        above are derived from synthetic demo cases for prototype purposes
        only. They are not clinical statistics and must not be used to evaluate
        model performance or clinical outcomes.
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "good" | "warning" | "info" | "neutral";
}) {
  const tones = {
    good: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-sky-50 text-sky-700",
    neutral: "bg-muted text-foreground",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-[22px] font-semibold leading-none tracking-tight">
            {value}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14px]">{title}</CardTitle>
            {subtitle && (
              <CardDescription className="mt-0.5 text-[11.5px]">
                {subtitle}
              </CardDescription>
            )}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function AgreementTile({
  tone,
  label,
  value,
  hint,
}: {
  tone: "good" | "danger" | "warning";
  label: string;
  value: number;
  hint: string;
}) {
  const tones = {
    good: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    danger: "border-rose-200 bg-rose-50/60 text-rose-700",
    warning: "border-amber-200 bg-amber-50/60 text-amber-700",
  } as const;
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border p-3", tones[tone])}>
      <span className="text-[10.5px] uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span className="text-[24px] font-semibold leading-none">{value}</span>
      <span className="text-[11px] opacity-80">{hint}</span>
    </div>
  );
}
