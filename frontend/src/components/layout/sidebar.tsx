"use client";

import {
  LayoutDashboard,
  ScanLine,
  FolderOpen,
  History,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Info,
  Workflow,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { PageKey } from "@/lib/types";

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "analyze", label: "Analyze X-Ray", icon: ScanLine },
  { key: "cases", label: "Cases", icon: FolderOpen },
  { key: "history", label: "History", icon: History },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const SECONDARY_NAV: NavItem[] = [
  { key: "how-it-works", label: "How It Works", icon: Workflow },
  { key: "about", label: "About", icon: Info },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "help", label: "Help", icon: HelpCircle },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);

  function go(key: PageKey) {
    setPage(key);
    onNavigate?.();
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <span className="text-lg font-bold tracking-tight">X²</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            X-RAY SQUARED
          </span>
          <span className="text-[11px] text-muted-foreground">
            AI Screening Platform
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        <NavGroup label="Workspace">
          {PRIMARY_NAV.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={currentPage === item.key}
              onClick={() => go(item.key)}
            />
          ))}
        </NavGroup>

        <div className="my-3 h-px bg-sidebar-border" />

        <NavGroup label="Resources">
          {SECONDARY_NAV.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={currentPage === item.key}
              onClick={() => go(item.key)}
            />
          ))}
        </NavGroup>
      </nav>

      {/* Footer status */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-lg bg-accent/60 p-3">
          <div className="flex items-center gap-2 text-[12px] font-medium text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI-assisted screening
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            Human review required
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
        )}
      />
      <span className="truncate">{item.label}</span>
    </button>
  );
}
