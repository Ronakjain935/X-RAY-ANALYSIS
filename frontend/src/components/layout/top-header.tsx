"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  PanelLeft,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import type { PageKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PageMeta {
  title: string;
  subtitle: string;
}

const PAGE_META: Record<PageKey, PageMeta> = {
  dashboard: {
    title: "AI-Assisted Chest X-Ray Screening",
    subtitle:
      "Review AI findings and prioritize cases for human assessment.",
  },
  analyze: {
    title: "Analyze Chest X-Ray",
    subtitle:
      "Upload a chest X-ray for AI-assisted screening and explainable analysis.",
  },
  cases: {
    title: "Case Management",
    subtitle: "Browse, search and review all X-ray screening cases.",
  },
  history: {
    title: "Analysis History",
    subtitle: "Review prior analyses and their outcomes.",
  },
  reports: {
    title: "Reports",
    subtitle: "View, download and print AI-assisted case reports.",
  },
  analytics: {
    title: "Platform Analytics",
    subtitle:
      "Operational metrics for screening workflow and AI–human agreement.",
  },
  "how-it-works": {
    title: "How It Works",
    subtitle: "A visual walkthrough of the AI-assisted screening workflow.",
  },
  about: {
    title: "About X-RAY SQUARED",
    subtitle:
      "Academic project exploring explainable, human-in-the-loop X-ray screening.",
  },
  settings: {
    title: "Settings",
    subtitle: "Configure interface, notifications and report preferences.",
  },
  help: {
    title: "Help & Documentation",
    subtitle: "Quick references for using the platform safely and effectively.",
  },
};

export function TopHeader({
  onToggleSidebar,
}: {
  onToggleSidebar?: () => void;
}) {
  const currentPage = useAppStore((s) => s.currentPage);
  const meta = PAGE_META[currentPage];
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
          {meta.title}
        </h1>
        <p className="hidden truncate text-[12.5px] text-muted-foreground sm:block">
          {meta.subtitle}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases, reports..."
          className="h-9 w-56 pl-9 text-[13px] lg:w-64"
        />
      </div>

      {/* Notifications */}
      <NotificationsButton />

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 text-left transition hover:border-border hover:bg-accent"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-primary text-primary-foreground text-[12px] font-semibold">
                DR
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-[12.5px] font-medium text-foreground">
                Dr. Rivera
              </span>
              <span className="text-[10.5px] text-muted-foreground">
                Reviewer
              </span>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function NotificationsButton() {
  // Demo notifications — labeled as DEMO DATA elsewhere.
  const items = [
    {
      id: 1,
      type: "alert" as const,
      title: "High-priority case awaiting review",
      desc: "XR-0001 — Pneumonia suspected, score 0.91",
    },
    {
      id: 2,
      type: "info" as const,
      title: "New case analyzed",
      desc: "XR-0010 — Confidence: medium",
    },
    {
      id: 3,
      type: "ok" as const,
      title: "Report generated",
      desc: "RPT-0421 ready for download",
    },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[13px] font-semibold">Notifications</span>
          <Badge variant="secondary" className="text-[10px]">
            Demo Data
          </Badge>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {items.map((n) => (
            <div
              key={n.id}
              className="flex gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-accent/60"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  n.type === "alert" && "bg-destructive/10 text-destructive",
                  n.type === "info" && "bg-primary/10 text-primary",
                  n.type === "ok" && "bg-emerald-100 text-emerald-700"
                )}
              >
                {n.type === "alert" && <AlertCircle className="h-4 w-4" />}
                {n.type === "info" && <Bell className="h-4 w-4" />}
                {n.type === "ok" && <Check className="h-4 w-4" />}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12.5px] font-medium text-foreground">
                  {n.title}
                </span>
                <span className="truncate text-[11.5px] text-muted-foreground">
                  {n.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-3 py-2 text-center">
          <button className="text-[12px] font-medium text-primary hover:underline">
            View all
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
