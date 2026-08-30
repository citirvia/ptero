"use client";

import { useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme, type Theme } from "@/store/theme";
import { useAppPrefs, type AccentId, type Density } from "@/store/preferences";
import { useUpdatePreferences } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const THEMES: { id: Theme; label: string; desc: string; icon: typeof Moon }[] = [
  { id: "dark", label: "Dark", desc: "Optimized for infra dashboards.", icon: Moon },
  { id: "light", label: "Light", desc: "Bright, high-contrast surfaces.", icon: Sun },
];

const ACCENTS = [
  { id: "teal", label: "Teal", color: "#2f6b85" },
  { id: "green", label: "Green", color: "#68a063" },
  { id: "blue", label: "Blue", color: "#4b8bbe" },
  { id: "amber", label: "Amber", color: "#c79a3a" },
];

const DENSITIES = [
  { id: "comfortable", label: "Comfortable", desc: "More spacing" },
  { id: "compact", label: "Compact", desc: "Denser layout" },
];

const REGIONS = ["Frankfurt (EU)", "Ashburn (US)", "Istanbul (TR)", "London (EU)"];

const selectClass =
  "flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, density, setDensity } = useAppPrefs();
  const [digest, setDigest] = useState(true);
  const [shortcuts, setShortcuts] = useState(true);

  const updatePrefs = useUpdatePreferences();

  function persistPrefs(payload: { theme?: Theme }) {
    updatePrefs.mutate(payload, {
      onError: (err: Error) => toast.error(err.message ?? "Could not sync preference"),
    });
  }

  function handleTheme(id: Theme) {
    setTheme(id);
    persistPrefs({ theme: id });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <p className="text-sm text-ink-muted">Customize how Ptero looks for you.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-secondary">Theme</p>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTheme(t.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-accent/40 bg-accent/[0.08]"
                        : "border-line hover:border-line-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                        active
                          ? "border-accent/30 bg-accent/10 text-accent-soft"
                          : "border-line bg-elevated text-ink-muted",
                      )}
                    >
                      <t.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        {t.label}
                        {active && <Check className="size-3.5 text-accent-soft" />}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-ink-secondary">Accent color</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAccent(a.id as AccentId);
                    toast.success(`Accent set to ${a.label}`);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    accent === a.id
                      ? "border-line-active bg-elevated text-ink"
                      : "border-line text-ink-muted hover:text-ink-secondary",
                  )}
                >
                  <span
                    className="grid size-4 place-items-center rounded-full"
                    style={{ backgroundColor: a.color }}
                  >
                    {accent === a.id && <Check className="size-3 text-white" />}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-ink-secondary">Density</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DENSITIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDensity(d.id as Density)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    density === d.id
                      ? "border-line-active bg-elevated"
                      : "border-line hover:border-line-hover",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{d.label}</p>
                    <p className="text-xs text-ink-muted">{d.desc}</p>
                  </div>
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full border",
                      density === d.id
                        ? "border-accent bg-accent"
                        : "border-line",
                    )}
                  >
                    {density === d.id && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink-secondary">Default region</p>
            <select
              className={selectClass}
              defaultValue={REGIONS[0]}
              aria-label="Default region"
            >
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <Separator />

          <Toggle
            label="Weekly email digest"
            desc="A summary of deploys, usage and incidents."
            checked={digest}
            onChange={setDigest}
          />
          <Separator />
          <Toggle
            label="Keyboard shortcuts"
            desc="Enable command palette and quick actions."
            checked={shortcuts}
            onChange={setShortcuts}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        <p className="text-xs text-ink-muted">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          onChange(v);
          toast.success(`${label} ${v ? "enabled" : "disabled"}`);
        }}
        aria-label={label}
      />
    </div>
  );
}
