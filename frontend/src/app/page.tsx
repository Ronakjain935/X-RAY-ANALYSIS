"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/lib/store";
import { DashboardPage } from "@/components/pages/dashboard";
import { AnalyzePage } from "@/components/pages/analyze";
import { CasesPage } from "@/components/pages/cases";
import { HistoryPage } from "@/components/pages/history";
import { ReportsPage } from "@/components/pages/reports";
import { AnalyticsPage } from "@/components/pages/analytics";
import { HowItWorksPage } from "@/components/pages/how-it-works";
import { AboutPage } from "@/components/pages/about";
import { SettingsPage } from "@/components/pages/settings";
import { HelpPage } from "@/components/pages/help";

export default function Home() {
  const currentPage = useAppStore((s) => s.currentPage);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);

  return (
    <AppShell>
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "analyze" && <AnalyzePage />}
      {currentPage === "cases" && (
        <CasesPage initialCaseId={selectedCaseId} />
      )}
      {currentPage === "history" && <HistoryPage />}
      {currentPage === "reports" && <ReportsPage />}
      {currentPage === "analytics" && <AnalyticsPage />}
      {currentPage === "how-it-works" && <HowItWorksPage />}
      {currentPage === "about" && <AboutPage />}
      {currentPage === "settings" && <SettingsPage />}
      {currentPage === "help" && <HelpPage />}
    </AppShell>
  );
}
