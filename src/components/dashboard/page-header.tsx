import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        {Icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border border-line",
              accent ? "bg-accent/15 text-accent-soft" : "bg-elevated text-ink-muted",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}
