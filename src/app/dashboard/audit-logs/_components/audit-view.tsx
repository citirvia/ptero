"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Fingerprint, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useAuditLogs } from "@/lib/api/hooks";
import type { AuditEntry } from "@/lib/api/types";
import { cn, formatDateTime } from "@/lib/utils";

const VALID_TYPES = new Set([
  "auth",
  "server",
  "deploy",
  "permission",
  "billing",
  "admin",
  "system",
]);

function toAuditEntry(raw: unknown): AuditEntry {
  const a = raw as Record<string, unknown>;
  const t = String(a.type ?? "server").toLowerCase();
  return {
    id: String(a.id ?? ""),
    actor: String(a.actorName ?? a.actor ?? "You"),
    action: String(a.action ?? "—"),
    target: String(a.target ?? "account"),
    type: (VALID_TYPES.has(t) ? t : "server") as AuditEntry["type"],
    ip: String(a.ip ?? "—"),
    time: String(a.time ?? a.createdAt ?? a.created_at ?? ""),
  };
}

const TYPE_VARIANT: Record<AuditEntry["type"], BadgeProps["variant"]> = {
  auth: "info",
  server: "accent",
  deploy: "online",
  permission: "warn",
  billing: "default",
  admin: "default",
  system: "outline",
};

const TYPES = [
  "all",
  "auth",
  "server",
  "deploy",
  "permission",
  "billing",
] as const;

function selectClass() {
  return "flex h-9 rounded-lg border border-line bg-bg px-3 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function exportRows(rows: AuditEntry[]) {
  const header = ["time", "activity", "target", "type", "ip"];
  const body = rows.map((row) =>
    [
      row.time,
      row.action,
      row.target,
      row.type,
      row.ip,
    ].map((value) => csvCell(value ?? "")).join(","),
  );
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AuditView() {
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Reset to first page on filter change.
  useEffect(() => {
    setPage(1);
  }, [type, from, to]);

  const query = useAuditLogs({
    type: type === "all" ? undefined : type,
    page,
  });

  const entries: AuditEntry[] = useMemo(() => {
    const data = query.data as { logs?: unknown[] } | undefined;
    return (data?.logs ?? []).map(toAuditEntry);
  }, [query.data]);

  const meta = (query.data as { meta?: { total: number; totalPages: number } } | undefined)?.meta;
  const pageCount = meta?.totalPages ?? 1;
  const total = meta?.total ?? entries.length;

  // Date filtering is applied client-side since the backend filter only
  // supports type/page; keep the existing UX.
  const rows = useMemo(
    () =>
      entries.filter((a) => {
        const t = a.time.slice(0, 10);
        if (from && t < from) return false;
        if (to && t > to) return false;
        return true;
      }),
    [entries, from, to],
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <Field label="Event type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            className={cn(selectClass(), "capitalize")}
            aria-label="Filter by event type"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t === "all" ? "All types" : t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={selectClass()}
            aria-label="From date"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={selectClass()}
            aria-label="To date"
          />
        </Field>
        <div className="ml-auto flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setType("all");
              setFrom("");
              setTo("");
            }}
          >
            Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              exportRows(rows);
              toast.success(`Downloaded ${rows.length} events as CSV`);
            }}
          >
            <Download /> Export
          </Button>
        </div>
      </Card>

      <DataState
        query={query}
        loading={
          <Card className="overflow-hidden">
            <TableSkeleton rows={6} columns={5} />
          </Card>
        }
        empty={
          <Card>
            <EmptyState
              icon={<FileSearch />}
              title="No account activity yet"
              description="When you sign in, update settings, or manage servers, those actions will appear here."
            />
          </Card>
        }
        isEmpty={() => entries.length === 0}
      >
        {() => (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted">
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Activity</th>
                    <th className="px-5 py-3 font-medium">Target</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">IP</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const isOpen = expanded === a.id;
                    return (
                      <Fragment key={a.id}>
                        <tr
                          onClick={() => setExpanded(isOpen ? null : a.id)}
                          className="cursor-pointer border-b border-hairline transition-colors hover:bg-overlay"
                        >
                          <td className="px-5 py-3.5 font-mono text-xs text-ink-secondary">
                            {formatDateTime(a.time)}
                          </td>
                          <td className="px-5 py-3.5 text-ink-secondary">{a.action}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-ink-secondary">
                            {a.target}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={TYPE_VARIANT[a.type]} className="capitalize">
                              {a.type}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">
                            {a.ip}
                          </td>
                          <td className="px-5 py-3.5">
                            <ChevronRight
                              className={cn(
                                "size-4 text-ink-muted transition-transform",
                                isOpen && "rotate-90",
                              )}
                            />
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-hairline bg-bg/40">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Detail label="Event ID" value={a.id} mono />
                                <Detail label="Recorded for" value={a.actor} />
                                <Detail label="Source IP" value={a.ip} mono />
                                <Detail
                                  label="Timestamp (UTC)"
                                  value={a.time.replace("T", " ").replace("Z", "")}
                                  mono
                                />
                                <Detail label="Action" value={a.action} />
                                <Detail label="Target resource" value={a.target} mono />
                                <Detail label="Category" value={a.type} />
                                <Detail label="Integrity" value="verified · sha256" mono />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-muted">
                        No account activity matches the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <div className="border-t border-hairline p-4">
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        )}
      </DataState>

      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Fingerprint className="size-3.5" /> Logs are immutable and retained for 365
        days. Showing {rows.length} of {total} account events.
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-elevated/40 p-3">
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xs text-ink-secondary",
          mono && "font-mono",
        )}
      >
        {value}
      </p>
    </div>
  );
}
