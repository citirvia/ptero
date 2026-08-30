"use client";

import { Play, Square, RotateCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Server, ServerStatus } from "@/lib/api/types";
import { usePower } from "@/lib/api/hooks";
import { canStartServer, canStopServer } from "@/lib/server-status";

type Signal = "start" | "stop" | "restart" | "kill";

const ACTIONS: {
  id: Signal;
  label: string;
  icon: typeof Play;
  variant: "primary" | "secondary" | "danger";
}[] = [
  { id: "start", label: "Start", icon: Play, variant: "secondary" },
  { id: "restart", label: "Restart", icon: RotateCw, variant: "primary" },
  { id: "stop", label: "Stop", icon: Square, variant: "secondary" },
  { id: "kill", label: "Kill", icon: Zap, variant: "danger" },
];

function notify(signal: Signal, name: string) {
  switch (signal) {
    case "start":
      return toast.success(`Starting ${name}…`);
    case "restart":
      return toast(`Restarting ${name}…`);
    case "stop":
      return toast(`Stopping ${name}…`);
    case "kill":
      return toast.error(`Force-killed ${name}`);
  }
}

export function QuickActions({
  server,
  currentStatus,
  size = "sm",
}: {
  server: Server;
  currentStatus?: ServerStatus;
  size?: "sm" | "md";
}) {
  const power = usePower(server.id);
  const effectiveStatus = currentStatus ?? server.status;
  return (
    <div className="flex items-center gap-2">
      {ACTIONS.map((a) => {
        const disabled =
          power.isPending
          || (a.id === "start" && !canStartServer(effectiveStatus))
          || ((a.id === "stop" || a.id === "kill") && !canStopServer(effectiveStatus));

        return (
          <Button
            key={a.id}
            variant={a.variant}
            size={size}
            disabled={disabled}
            onClick={() =>
              power.mutate(a.id, {
                onSuccess: () => notify(a.id, server.name),
                onError: (e: Error) => toast.error(e.message ?? `Failed to ${a.id}`),
              })
            }
            aria-label={`${a.label} ${server.name}`}
          >
            <a.icon />
            {a.label}
          </Button>
        );
      })}
    </div>
  );
}

export function QuickActionCards({ server }: { server: Server }) {
  const power = usePower(server.id);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          disabled={power.isPending}
          onClick={() =>
            power.mutate(a.id, {
              onSuccess: () => notify(a.id, server.name),
              onError: (e: Error) => toast.error(e.message ?? `Failed to ${a.id}`),
            })
          }
          aria-label={`${a.label} ${server.name}`}
          className={cn(
            "card-base group flex flex-col items-center gap-2 p-5 transition-all duration-300 hover:border-hairline2 hover:shadow-glow focus-ring",
            a.id === "kill" && "hover:border-danger/30",
            power.isPending && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border transition-colors",
              a.id === "restart"
                ? "border-accent/30 bg-accent/15 text-accent-soft"
                : a.id === "kill"
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : "border-line bg-elevated text-ink-secondary group-hover:text-ink",
            )}
          >
            <a.icon className="size-4" />
          </span>
          <span className="text-sm font-medium text-ink">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
