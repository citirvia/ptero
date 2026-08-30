"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Rocket,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/api/hooks";
import type { Notification } from "@/lib/api/types";
import { cn, relativeTime } from "@/lib/utils";

type Notif = Notification;

function toNotif(raw: unknown): Notif {
  const n = raw as Record<string, unknown>;
  const t = String(n.type ?? "system").toLowerCase();
  const valid = new Set(["deploy", "alert", "billing", "team", "system"]);
  return {
    id: String(n.id ?? ""),
    title: String(n.title ?? "Notification"),
    body: String(n.body ?? ""),
    type: (valid.has(t) ? t : "system") as Notif["type"],
    read: Boolean(n.read),
    time: String(n.time ?? n.createdAt ?? n.created_at ?? ""),
  };
}

const TYPE_META: Record<
  string,
  { icon: React.ElementType; color: string; ring: string }
> = {
  deploy: { icon: Rocket, color: "text-accent-soft", ring: "border-accent/30 bg-accent/10" },
  alert: { icon: AlertTriangle, color: "text-warn", ring: "border-warn/30 bg-warn/10" },
  billing: { icon: CreditCard, color: "text-info", ring: "border-info/30 bg-info/10" },
  team: { icon: Users, color: "text-online", ring: "border-online/30 bg-online/10" },
  system: { icon: Bell, color: "text-ink-secondary", ring: "border-line bg-elevated" },
};

const FILTERS = ["All", "Unread", "deploy", "alert", "billing", "team"] as const;

const PREFS = [
  { id: "email", label: "Email notifications", desc: "Receive a copy by email", on: true },
  { id: "inapp", label: "In-app notifications", desc: "Show in the dashboard bell", on: true },
  { id: "deploy", label: "Deploy events", desc: "Build & deploy outcomes", on: true },
  { id: "billing", label: "Billing events", desc: "Invoices and payments", on: true },
  { id: "security", label: "Security alerts", desc: "Sign-ins and key changes", on: true },
];

export function NotificationsView() {
  const query = useNotifications();
  const qc = useQueryClient();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const removeNotif = useDeleteNotification();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const items = useMemo<Notif[]>(() => {
    const list = (query.data as { notifications?: unknown[] } | undefined)?.notifications ?? [];
    return list.map(toNotif);
  }, [query.data]);

  const unread = items.filter((n) => !n.read).length;

  function handleMarkAll() {
    if (unread === 0) return;
    // Optimistic flip
    qc.setQueryData(["notifications"], (prev: { notifications?: unknown[]; unread?: number } | undefined) => {
      if (!prev) return prev;
      const next = (prev.notifications ?? []).map((raw) => ({
        ...(raw as object),
        read: true,
      }));
      return { ...prev, notifications: next, unread: 0 };
    });
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: (err: Error) => {
        toast.error(err.message ?? "Could not mark notifications as read");
        qc.invalidateQueries({ queryKey: ["notifications"] });
      },
    });
  }

  function handleMarkRead(id: string) {
    qc.setQueryData(["notifications"], (prev: { notifications?: unknown[]; unread?: number } | undefined) => {
      if (!prev) return prev;
      let removed = 0;
      const next = (prev.notifications ?? []).map((raw) => {
        const n = raw as { id?: string; read?: boolean };
        if (n.id === id && !n.read) {
          removed = 1;
          return { ...n, read: true };
        }
        return n;
      });
      return { ...prev, notifications: next, unread: Math.max(0, (prev.unread ?? 0) - removed) };
    });
    markRead.mutate(id, {
      onError: (err: Error) => {
        toast.error(err.message ?? "Could not mark as read");
        qc.invalidateQueries({ queryKey: ["notifications"] });
      },
    });
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    qc.setQueryData(["notifications"], (prev: { notifications?: unknown[]; unread?: number } | undefined) => {
      if (!prev) return prev;
      let removedUnread = 0;
      const next = (prev.notifications ?? []).filter((raw) => {
        const n = raw as { id?: string; read?: boolean };
        if (n.id === id) {
          if (!n.read) removedUnread = 1;
          return false;
        }
        return true;
      });
      return { ...prev, notifications: next, unread: Math.max(0, (prev.unread ?? 0) - removedUnread) };
    });
    removeNotif.mutate(id, {
      onSuccess: () => toast.success("Notification removed"),
      onError: (err: Error) => {
        toast.error(err.message ?? "Could not delete notification");
        qc.invalidateQueries({ queryKey: ["notifications"] });
      },
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1 no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all duration-200",
                  filter === f
                    ? "bg-elevated text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink-secondary",
                )}
              >
                {f}
                {f === "Unread" && unread > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] text-accent-soft">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={unread === 0 || markAllRead.isPending}
          >
            <CheckCheck /> Mark all read
          </Button>
        </div>

        <DataState
          query={query}
          loading={
            <Card className="overflow-hidden">
              <TableSkeleton rows={5} columns={3} />
            </Card>
          }
          empty={
            <Card>
              <EmptyState
                icon={<Bell />}
                title="No notifications yet"
                description="Activity from deploys, billing and your team will show up here."
              />
            </Card>
          }
          isEmpty={() => items.length === 0}
        >
          {() => {
            const rows = items.filter((n) => {
              if (filter === "All") return true;
              if (filter === "Unread") return !n.read;
              return n.type === filter;
            });
            return (
              <Card className="divide-y divide-hairline overflow-hidden">
                {rows.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.system;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      className="group flex w-full items-start gap-3.5 p-4 text-left transition-colors hover:bg-overlay"
                    >
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="flex flex-1 items-start gap-3.5 text-left"
                      >
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                            meta.ring,
                            meta.color,
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "truncate text-sm",
                                n.read ? "text-ink-secondary" : "font-medium text-ink",
                              )}
                            >
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="size-2 shrink-0 rounded-full bg-accent" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>
                          <p className="mt-1 font-mono text-[11px] text-ink-disabled">
                            {relativeTime(n.time)}
                          </p>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete notification"
                        className="text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                        onClick={(e) => handleDelete(n.id, e)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
                {rows.length === 0 && (
                  <div className="p-10 text-center text-sm text-ink-muted">
                    You&apos;re all caught up.
                  </div>
                )}
              </Card>
            );
          }}
        </DataState>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <p className="text-sm text-ink-muted">
            Choose how and when we notify you.
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {PREFS.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Separator className="my-1" />}
              <PrefRow {...p} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PrefRow({
  label,
  desc,
  on,
}: {
  label: string;
  desc: string;
  on: boolean;
}) {
  const [checked, setChecked] = useState(on);
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        <p className="text-xs text-ink-muted">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          setChecked(v);
          toast.success(`${label} ${v ? "enabled" : "disabled"}`);
        }}
        aria-label={label}
      />
    </div>
  );
}
