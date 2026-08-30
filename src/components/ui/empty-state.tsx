import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Soft "nothing here yet" panel. Pairs with `card-base` page chrome —
 * use it inside a card or table body, not page-fullscreen.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-2xl border border-hairline bg-elevated text-ink-muted [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-medium text-ink">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
