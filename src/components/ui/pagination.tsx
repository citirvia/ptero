"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Build a compact list of page numbers with ellipsis gaps.
 * Returns entries that are either a 1-based page number or the string "…".
 */
function buildPages(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < pageCount - 1) pages.push("…");
  pages.push(pageCount);
  return pages;
}

const itemClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-line bg-card px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-line-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = buildPages(page, pageCount);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={itemClass}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-xs text-ink-muted"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className={cn(
              itemClass,
              p === page &&
                "border-accent/40 bg-accent/15 text-ink hover:border-accent/40",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className={itemClass}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

/**
 * Client-side pagination over an in-memory list.
 * Resets to page 1 whenever the item count shrinks below the current window
 * (e.g. when filters change), keeping the view in a valid range.
 */
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp the page back into range when the data set changes (filtering, etc.).
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, pageItems, pageCount };
}
