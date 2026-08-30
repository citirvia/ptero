"use client";

import { useState } from "react";
import { Clock, Play, Plus, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Label } from "@/components/ui/input";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { useServerId } from "../_components/use-server";
import {
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useRunSchedule,
} from "@/lib/api/hooks";

type ClientSchedule = {
  id: number;
  name: string;
  cron: {
    minute: string;
    hour: string;
    day_of_week: string;
    day_of_month: string;
    month: string;
  };
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
};

const PRESETS: Record<string, { minute: string; hour: string; day_of_week: string; day_of_month: string; month: string }> = {
  "0 4 * * *": { minute: "0", hour: "4", day_of_month: "*", month: "*", day_of_week: "*" },
  "0 * * * *": { minute: "0", hour: "*", day_of_month: "*", month: "*", day_of_week: "*" },
  "0 3 * * 0": { minute: "0", hour: "3", day_of_month: "*", month: "*", day_of_week: "0" },
};

function parseCron(input: string) {
  const parts = input.trim().split(/\s+/);
  if (PRESETS[input.trim()]) return PRESETS[input.trim()];
  const [minute = "*", hour = "*", day_of_month = "*", month = "*", day_of_week = "*"] = parts;
  return { minute, hour, day_of_month, month, day_of_week };
}

export default function SchedulesPage() {
  const id = useServerId();
  const query = useSchedules(id);
  const createSchedule = useCreateSchedule(id);
  const updateSchedule = useUpdateSchedule(id);
  const deleteSchedule = useDeleteSchedule(id);
  const runSchedule = useRunSchedule(id);

  const [name, setName] = useState("");
  const [cron, setCron] = useState("0 4 * * *");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Schedules</h2>
          <p className="text-xs text-ink-muted">
            Cron-based automation tasks for this server
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Create schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create schedule</DialogTitle>
              <DialogDescription>
                Run an action on a recurring cron schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sc-name">Name</Label>
                <Input
                  id="sc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nightly restart"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sc-cron">Cron expression</Label>
                <Input
                  id="sc-cron"
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                  className="font-mono"
                  placeholder="0 4 * * *"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  size="sm"
                  disabled={!name.trim() || createSchedule.isPending}
                  onClick={() => {
                    const c = parseCron(cron);
                    createSchedule.mutate(
                      {
                        name: name.trim(),
                        minute: c.minute,
                        hour: c.hour,
                        day_of_month: c.day_of_month,
                        month: c.month,
                        day_of_week: c.day_of_week,
                        is_active: true,
                        only_when_online: false,
                      },
                      {
                        onSuccess: () => {
                          toast.success("Schedule created");
                          setName("");
                        },
                        onError: (e: Error) => toast.error(e.message),
                      },
                    );
                  }}
                >
                  Create
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataState
        query={query}
        loading={<TableSkeleton rows={3} columns={4} />}
        empty={
          <EmptyState
            icon={<Timer />}
            title="No schedules"
            description="Create a cron schedule to automate restarts and backups."
          />
        }
      >
        {(data) => {
          const schedules = data as ClientSchedule[];
          return (
            <div className="space-y-3">
              {schedules.map((s) => {
                const cronStr = `${s.cron.minute} ${s.cron.hour} ${s.cron.day_of_month} ${s.cron.month} ${s.cron.day_of_week}`;
                return (
                  <Card key={s.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
                          <Timer className="size-4.5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{s.name}</p>
                          <code className="font-mono text-xs text-accent-soft">
                            {cronStr}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden text-right sm:block">
                          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <Clock className="size-3" /> Last run
                          </p>
                          <p className="font-mono text-xs text-ink-secondary">
                            {formatDateTime(s.last_run_at ?? "")}
                          </p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-ink-muted">Next run</p>
                          <p className="font-mono text-xs text-ink-secondary">
                            {formatDateTime(s.next_run_at ?? "")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Run ${s.name}`}
                          disabled={runSchedule.isPending}
                          onClick={() =>
                            runSchedule.mutate(s.id, {
                              onSuccess: () => toast.success(`${s.name} executed`),
                              onError: (e: Error) => toast.error(e.message),
                            })
                          }
                        >
                          <Play />
                        </Button>
                        <Switch
                          checked={s.is_active}
                          onCheckedChange={(v) =>
                            updateSchedule.mutate(
                              {
                                scheduleId: s.id,
                                body: {
                                  name: s.name,
                                  minute: s.cron.minute,
                                  hour: s.cron.hour,
                                  day_of_month: s.cron.day_of_month,
                                  month: s.cron.month,
                                  day_of_week: s.cron.day_of_week,
                                  is_active: v,
                                  only_when_online: false,
                                },
                              },
                              {
                                onSuccess: () =>
                                  toast(v ? `${s.name} enabled` : `${s.name} disabled`),
                                onError: (e: Error) => toast.error(e.message),
                              },
                            )
                          }
                          aria-label={`Toggle ${s.name}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${s.name}`}
                          disabled={deleteSchedule.isPending}
                          onClick={() =>
                            deleteSchedule.mutate(s.id, {
                              onSuccess: () => toast.success("Schedule deleted"),
                              onError: (e: Error) => toast.error(e.message),
                            })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
