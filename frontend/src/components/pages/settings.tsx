"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Palette,
  Bell,
  Gauge,
  FileText,
  Contrast,
  Sparkles,
  Eye,
  Save,
} from "lucide-react";

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  function save() {
    toast.success("Settings saved.");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
            Settings
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Configure interface, notifications and report preferences.
          </p>
        </div>
        <Button size="sm" className="h-9 gap-2" onClick={save}>
          <Save className="h-3.5 w-3.5" />
          Save changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-[14.5px]">Appearance</CardTitle>
            </div>
            <CardDescription className="text-[12.5px]">
              Interface theme and visual preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <Label className="text-[13px]">Theme</Label>
                <span className="text-[11px] text-muted-foreground">
                  Light, dark or follow system.
                </span>
              </div>
              <Select
                value={settings.theme}
                onValueChange={(v) =>
                  updateSettings({ theme: v as any })
                }
              >
                <SelectTrigger className="h-9 w-36 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SettingToggle
              icon={Contrast}
              label="High contrast"
              desc="Increase contrast for accessibility."
              checked={settings.highContrast}
              onChange={(v) => updateSettings({ highContrast: v })}
            />

            <SettingToggle
              icon={Sparkles}
              label="Reduced motion"
              desc="Minimize animations across the UI."
              checked={settings.reducedMotion}
              onChange={(v) => updateSettings({ reducedMotion: v })}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <CardTitle className="text-[14.5px]">Notifications</CardTitle>
            </div>
            <CardDescription className="text-[12.5px]">
              Control which alerts the platform surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            <SettingToggle
              icon={Bell}
              label="Enable notifications"
              desc="Receive notifications for high-priority cases and new analyses."
              checked={settings.notifications}
              onChange={(v) => updateSettings({ notifications: v })}
            />
            <div className="rounded-md border border-border bg-muted/30 p-3 text-[11.5px] text-muted-foreground">
              Notifications are surfaced via the bell icon in the header and
              are demo-only in this prototype.
            </div>
          </CardContent>
        </Card>

        {/* Confidence display */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <CardTitle className="text-[14.5px]">
                Confidence Display
              </CardTitle>
            </div>
            <CardDescription className="text-[12.5px]">
              How AI confidence and model score are shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            <SettingToggle
              icon={Eye}
              label="Show raw model score"
              desc="Display the raw model score alongside the confidence level."
              checked={settings.showRawScore}
              onChange={(v) => updateSettings({ showRawScore: v })}
            />
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[11.5px] text-amber-900">
              The raw model score is labeled as &quot;model confidence/score&quot;
              in the UI and must not be interpreted as a calibrated probability.
            </div>
          </CardContent>
        </Card>

        {/* Report preferences */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-[14.5px]">Report Preferences</CardTitle>
            </div>
            <CardDescription className="text-[12.5px]">
              Defaults for AI-assisted case reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            <SettingToggle
              icon={FileText}
              label="Auto-generate report after review"
              desc="Generate a draft report when a human review is saved."
              checked={settings.autoGenerateReport}
              onChange={(v) => updateSettings({ autoGenerateReport: v })}
            />
            <div className="rounded-md border border-border bg-muted/30 p-3 text-[11.5px] text-muted-foreground">
              Reports always include the AI disclaimer regardless of this
              setting.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label className="text-[13px]">{label}</Label>
          <span className="text-[11.5px] text-muted-foreground">{desc}</span>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
