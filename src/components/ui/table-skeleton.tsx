import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/** Pulsing rows that match the dashboard table proportions. */
export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-2 p-4", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                "h-4 flex-1",
                c === 0 && "max-w-[35%]",
                c === columns - 1 && "max-w-[15%]",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
