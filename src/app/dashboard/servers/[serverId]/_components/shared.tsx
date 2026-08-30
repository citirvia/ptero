"use client";

import * as React from "react";
import { cn, relativeTime } from "@/lib/utils";

/**
 * Hydration-safe relative time. `relativeTime` reads Date.now(), so we render
 * a stable placeholder on the server / first paint and fill in after mount.
 */
export function RelTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [label, setLabel] = React.useState<string | null>(null);
  React.useEffect(() => {
    setLabel(relativeTime(date));
  }, [date]);
  return (
    <span className={className} suppressHydrationWarning>
      {label ?? "—"}
    </span>
  );
}

export function SectionTitle({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-elevated text-ink-muted">
            <Icon className="size-4" />
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span
        className={cn(
          "text-right text-sm text-ink-secondary",
          mono && "font-mono text-xs text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
