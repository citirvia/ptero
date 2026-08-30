"use client";

import { useMemo, useState } from "react";
import { Laptop, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevokeSession, useSessions, type Session } from "@/lib/api/hooks";
import { relativeTime } from "@/lib/utils";

type Row = {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  current: boolean;
  mobile?: boolean;
};

function parseUserAgent(ua: string): { device: string; browser: string; mobile: boolean } {
  if (!ua) return { device: "Unknown device", browser: "Unknown", mobile: false };
  const mobile = /iPhone|Android|iPad|Mobile/i.test(ua);

  let os = "Unknown OS";
  if (/iPhone/i.test(ua)) os = "iPhone";
  else if (/iPad/i.test(ua)) os = "iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  return { device: os, browser: `${browser} · ${os}`, mobile };
}

function toRow(s: Session): Row {
  const ua = parseUserAgent(s.userAgent);
  return {
    id: s.id,
    device: ua.device,
    browser: ua.browser,
    ip: s.ip,
    lastActive: s.current ? "Active now" : relativeTime(s.createdAt),
    current: s.current,
    mobile: ua.mobile,
  };
}

export default function SessionsPage() {
  const query = useSessions();
  const revokeSession = useRevokeSession();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows = useMemo<Row[]>(() => (query.data ?? []).map(toRow), [query.data]);

  function revoke(id: string) {
    revokeSession.mutate(id, {
      onSuccess: () => {
        toast.success("Session revoked");
        setConfirmId(null);
      },
      onError: (err: Error) => toast.error(err.message ?? "Could not revoke session"),
    });
  }

  const others = rows.filter((s) => !s.current).length;
  const pending = revokeSession.isPending;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Active sessions</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Devices currently signed in to your account.
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          disabled={others === 0 || pending}
          onClick={() => {
            rows.filter((s) => !s.current).forEach((s) => revokeSession.mutate(s.id));
            toast.success("Signed out of all other sessions");
          }}
        >
          <LogOut /> Revoke all others
        </Button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <DataState
          query={query}
          loading={
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
              ))}
            </div>
          }
          empty={
            <EmptyState
              icon={<ShieldCheck />}
              title="No active sessions"
              description="You'll see signed-in devices here."
            />
          }
          isEmpty={() => rows.length === 0}
        >
          {() =>
            rows.map((s) => {
              const Icon = s.mobile ? Smartphone : Laptop;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-elevated/40 px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-bg text-ink-secondary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {s.device}
                        </p>
                        {s.current && <Badge variant="accent">Current</Badge>}
                      </div>
                      <p className="truncate text-xs text-ink-muted">{s.browser}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-muted">
                        <span className="font-mono">{s.ip}</span>
                        <span className="text-ink-disabled">·</span>
                        <span>{s.lastActive}</span>
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                      onClick={() => setConfirmId(s.id)}
                      disabled={pending}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })
          }
        </DataState>

        <Dialog
          open={!!confirmId}
          onOpenChange={(o) => {
            if (!o) setConfirmId(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke session?</DialogTitle>
              <DialogDescription>
                This device will be signed out immediately. They&apos;ll need
                to sign in again to access your account.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="danger"
                size="sm"
                onClick={() => confirmId && revoke(confirmId)}
                disabled={pending}
              >
                {pending ? "Revoking…" : "Revoke session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
