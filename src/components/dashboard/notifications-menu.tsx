"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Rocket, AlertTriangle, CreditCard, Users, Check } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
} from "@/components/ui/dropdown";
import { useMarkAllNotificationsRead, useNotifications } from "@/lib/api/hooks";
import { relativeTime, cn } from "@/lib/utils";

const ICON: Record<string, React.ElementType> = {
  deploy: Rocket,
  alert: AlertTriangle,
  billing: CreditCard,
  team: Users,
};
const TONE: Record<string, string> = {
  deploy: "text-accent-soft",
  alert: "text-warn",
  billing: "text-online",
  team: "text-info",
};

type Notif = { id: string; type: string; title: string; body: string; read: boolean; time: string };

function normalize(raw: unknown): Notif {
  const n = raw as Record<string, unknown>;
  return {
    id: String(n.id ?? ""),
    type: String(n.type ?? "system").toLowerCase(),
    title: String(n.title ?? ""),
    body: String(n.body ?? ""),
    read: Boolean(n.read),
    time: String(n.time ?? n.createdAt ?? ""),
  };
}

export function NotificationsMenu() {
  const q = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const [localRead, setLocalRead] = useState<Record<string, boolean>>({});

  const source: Notif[] = (q.data?.notifications ?? []).map(normalize);
  const items = source.slice(0, 6);
  const unread = items.filter((n) => !n.read && !localRead[n.id]).length;

  function handleMarkAll() {
    setLocalRead(Object.fromEntries(items.map((n) => [n.id, true])));
    markAll.mutate();
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative flex size-9 items-center justify-center rounded-xl border border-line bg-card text-ink-muted transition-colors hover:border-line-hover hover:text-ink"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 items-center justify-center rounded-full bg-danger ring-2 ring-bg" />
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {items.length > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <Check className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="size-5 text-ink-disabled" />
              <p className="text-sm text-ink-muted">No notifications yet.</p>
            </div>
          ) : (
            items.map((n) => {
              const Icon = ICON[n.type] ?? Bell;
              const isUnread = !n.read && !localRead[n.id];
              return (
                <Link
                  key={n.id}
                  href="/dashboard/notifications"
                  className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-overlay2"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-elevated",
                      TONE[n.type] ?? "text-ink-muted",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                      {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-accent-soft" />}
                    </div>
                    <p className="line-clamp-2 text-xs text-ink-muted">{n.body}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-ink-disabled">
                      {relativeTime(n.time)}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <Link
          href="/dashboard/notifications"
          className="block border-t border-hairline px-4 py-2.5 text-center text-sm font-medium text-accent-soft transition-colors hover:bg-overlay2"
        >
          View all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
