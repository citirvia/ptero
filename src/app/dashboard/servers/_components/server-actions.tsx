"use client";

import { MoreVertical, Play, Square, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { usePower } from "@/lib/api/hooks";
import type { Server } from "@/lib/api/types";
import { canStartServer, canStopServer } from "@/lib/server-status";

type PowerSignal = "start" | "stop" | "restart" | "kill";

function usePowerHandlers(server: Server) {
  const power = usePower(server.id);

  function run(signal: PowerSignal, label: string) {
    power.mutate(signal, {
      onSuccess: () => {
        if (signal === "start") toast.success(`Starting ${server.name}…`);
        else if (signal === "restart")
          toast(`Restarting ${server.name}…`, {
            description: "Graceful restart in progress.",
          });
        else toast(`Stopping ${server.name}…`);
      },
      onError: (err) => {
        toast.error(`${label} ${server.name} failed`, {
          description: err instanceof Error ? err.message : undefined,
        });
      },
    });
  }

  return { run, pending: power.isPending };
}

export function ServerActions({ server }: { server: Server }) {
  const canStart = canStartServer(server.status);
  const canStop = canStopServer(server.status);
  const { run, pending } = usePowerHandlers(server);

  function act(e: React.MouseEvent, fn: () => void) {
    // prevent the surrounding card link from navigating
    e.preventDefault();
    e.stopPropagation();
    fn();
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${server.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreVertical />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownLabel>{server.name}</DropdownLabel>
        <DropdownItem
          disabled={!canStart || pending}
          onClick={(e) => act(e, () => run("start", "Start"))}
        >
          <Play />
          Start
        </DropdownItem>
        <DropdownItem
          disabled={pending}
          onClick={(e) => act(e, () => run("restart", "Restart"))}
        >
          <RotateCw />
          Restart
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          destructive
          disabled={!canStop || pending}
          onClick={(e) => act(e, () => run("stop", "Stop"))}
        >
          <Square />
          Stop
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function QuickActionButtons({ server }: { server: Server }) {
  const canStart = canStartServer(server.status);
  const canStop = canStopServer(server.status);
  const { run, pending } = usePowerHandlers(server);

  function act(e: React.MouseEvent, fn: () => void) {
    e.preventDefault();
    e.stopPropagation();
    fn();
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Start ${server.name}`}
        disabled={!canStart || pending}
        onClick={(e) => act(e, () => run("start", "Start"))}
      >
        <Play />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Restart ${server.name}`}
        disabled={pending}
        onClick={(e) => act(e, () => run("restart", "Restart"))}
      >
        <RotateCw />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Stop ${server.name}`}
        disabled={!canStop || pending}
        onClick={(e) => act(e, () => run("stop", "Stop"))}
      >
        <Square />
      </Button>
    </div>
  );
}
