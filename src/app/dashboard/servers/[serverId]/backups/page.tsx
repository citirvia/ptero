"use client";

import {
  Download,
  HardDriveDownload,
  Lock,
  MoreVertical,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { formatBytes } from "@/lib/utils";
import { RelTime, SectionTitle } from "../_components/shared";
import { useServerId } from "../_components/use-server";
import {
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useLockBackup,
  useRestoreBackup,
  useDownloadBackupUrl,
} from "@/lib/api/hooks";

type ClientBackup = {
  uuid: string;
  name: string;
  bytes: number;
  is_locked: boolean;
  is_successful: boolean;
  created_at: string;
  completed_at: string | null;
};

const STORAGE_LIMIT = 10 * 1024 ** 3; // 10 GB

export default function BackupsPage() {
  const id = useServerId();
  const query = useBackups(id);
  const createBackup = useCreateBackup(id);
  const deleteBackup = useDeleteBackup(id);
  const restoreBackup = useRestoreBackup(id);
  const lockBackup = useLockBackup(id);
  const downloadBackup = useDownloadBackupUrl(id);

  return (
    <DataState
      query={query}
      loading={
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <TableSkeleton rows={1} columns={3} />
            </CardContent>
          </Card>
          <Card className="overflow-hidden p-0">
            <TableSkeleton rows={4} columns={4} />
          </Card>
        </div>
      }
      empty={
        <div className="space-y-6">
          <BackupHeader
            count={0}
            used={0}
            disabled={createBackup.isPending}
            onCreate={() =>
              createBackup.mutate(undefined, {
                onSuccess: () => toast.success("Backup started"),
                onError: (e: Error) => toast.error(e.message),
              })
            }
          />
          <EmptyState
            icon={<HardDriveDownload />}
            title="No backups yet"
            description="Take your first snapshot to enable restore."
          />
        </div>
      }
    >
      {(data) => {
        const backups = data as ClientBackup[];
        const used = backups.reduce((a, b) => a + b.bytes, 0);
        const pct = Math.round((used / STORAGE_LIMIT) * 100);
        return (
          <div className="space-y-6">
            <BackupHeader
              count={backups.length}
              used={used}
              pct={pct}
              disabled={createBackup.isPending}
              onCreate={() =>
                createBackup.mutate(undefined, {
                  onSuccess: () => toast.success("Backup started"),
                  onError: (e: Error) => toast.error(e.message),
                })
              }
            />

            <div>
              <SectionTitle title="Snapshots" description="Restore points for this server" />
              <Card className="overflow-hidden p-0">
                <div className="divide-y divide-hairline">
                  {backups.map((b) => (
                    <div
                      key={b.uuid}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-overlay sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-ink-muted">
                          {b.is_locked ? (
                            <Lock className="size-4 text-warn" />
                          ) : (
                            <HardDriveDownload className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm text-ink">{b.name}</p>
                          <p className="text-xs text-ink-muted">
                            <RelTime date={b.created_at} /> · {formatBytes(b.bytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={b.is_successful ? "info" : "warn"}>
                          {b.is_successful ? "Complete" : "Pending"}
                        </Badge>
                        {b.is_locked && (
                          <Badge variant="warn" className="hidden sm:inline-flex">
                            <Lock className="size-3" />
                            Locked
                          </Badge>
                        )}
                        <Dropdown>
                          <DropdownTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Backup actions"
                            >
                              <MoreVertical />
                            </Button>
                          </DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem
                              onSelect={() =>
                                restoreBackup.mutate(
                                  { backup: b.uuid, truncate: false },
                                  {
                                    onSuccess: () => toast(`Restoring ${b.name}…`),
                                    onError: (e: Error) => toast.error(e.message),
                                  },
                                )
                              }
                            >
                              <RotateCcw />
                              Restore
                            </DropdownItem>
                            <DropdownItem
                              onSelect={() =>
                                downloadBackup.mutate(b.uuid, {
                                  onSuccess: (url) => {
                                    if (typeof window !== "undefined") window.open(url, "_blank");
                                    toast.success("Download started");
                                  },
                                  onError: (e: Error) => toast.error(e.message),
                                })
                              }
                            >
                              <Download />
                              Download
                            </DropdownItem>
                            <DropdownItem
                              onSelect={() =>
                                lockBackup.mutate(b.uuid, {
                                  onSuccess: () =>
                                    toast.success(b.is_locked ? "Unlocked" : "Locked"),
                                  onError: (e: Error) => toast.error(e.message),
                                })
                              }
                            >
                              <Lock />
                              {b.is_locked ? "Unlock" : "Lock"}
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem
                              destructive
                              disabled={b.is_locked}
                              onSelect={() =>
                                b.is_locked
                                  ? toast.error("Backup is locked")
                                  : deleteBackup.mutate(b.uuid, {
                                      onSuccess: () => toast.success("Backup deleted"),
                                      onError: (e: Error) => toast.error(e.message),
                                    })
                              }
                            >
                              <Trash2 />
                              Delete
                            </DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );
      }}
    </DataState>
  );
}

function BackupHeader({
  count,
  used,
  pct = 0,
  disabled,
  onCreate,
}: {
  count: number;
  used: number;
  pct?: number;
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-accent-soft">
              <HardDriveDownload className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Backup storage</p>
              <p className="font-mono text-xs text-ink-muted">
                {formatBytes(used)} of {formatBytes(STORAGE_LIMIT)} used · {count} snapshots
              </p>
            </div>
          </div>
          <Button size="sm" disabled={disabled} onClick={onCreate}>
            <Plus />
            Create backup
          </Button>
        </div>
        <Progress value={pct} indicatorClassName={pct > 80 ? "bg-warn" : undefined} />
      </CardContent>
    </Card>
  );
}
