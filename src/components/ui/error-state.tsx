import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Surface for query errors. Includes a retry CTA when `onRetry` is given.
 * Defaults are friendly; pass `description` from the actual error for context.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger [&_svg]:size-5">
        <AlertTriangle />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-ink">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
