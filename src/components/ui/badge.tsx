import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-line bg-elevated text-ink-secondary",
        accent: "border-accent/30 bg-accent/10 text-accent-soft",
        online: "border-online/30 bg-online/10 text-online",
        warn: "border-warn/30 bg-warn/10 text-warn",
        danger: "border-danger/30 bg-danger/10 text-danger",
        info: "border-info/30 bg-info/10 text-info",
        outline: "border-line text-ink-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

type Status = "online" | "offline" | "installing" | "restarting" | "starting" | "stopping";

const statusMap: Record<Status, { label: string; dot: string; variant: BadgeProps["variant"] }> = {
  online: { label: "Online", dot: "bg-online", variant: "online" },
  offline: { label: "Offline", dot: "bg-ink-disabled", variant: "default" },
  installing: { label: "Installing", dot: "bg-info", variant: "info" },
  restarting: { label: "Restarting", dot: "bg-warn", variant: "warn" },
  starting: { label: "Starting", dot: "bg-info", variant: "info" },
  stopping: { label: "Stopping", dot: "bg-warn", variant: "warn" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = statusMap[status];
  return (
    <Badge variant={s.variant}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          s.dot,
          (status === "online" || status === "installing" || status === "restarting" || status === "starting") &&
            "animate-pulse-ring",
        )}
      />
      {s.label}
    </Badge>
  );
}
