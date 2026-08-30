"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HardDrive,
  Cpu,
  MemoryStick,
  Boxes,
  MoreHorizontal,
  Wrench,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { StatCard } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminNodes,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
} from "@/lib/api/hooks";
import { toUiNode, type PteroAppNode } from "@/lib/api/adapters";

function loadColor(v: number) {
  if (v >= 80) return "bg-danger";
  if (v >= 70) return "bg-warn";
  if (v === 0) return "bg-ink-disabled";
  return "accent-gradient";
}

export default function AdminNodesPage() {
  const nodesQ = useAdminNodes();
  const createMut = useCreateNode();
  const updateMut = useUpdateNode();
  const deleteMut = useDeleteNode();

  const [editing, setEditing] = useState<PteroAppNode | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <AdminHeader
        title="Compute nodes"
        description="The bare-metal fleet powering every customer workload."
      >
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New node
        </Button>
      </AdminHeader>

      <DataState
        query={nodesQ}
        loading={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col p-5">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        }
        isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
        empty={
          <EmptyState
            icon={<HardDrive />}
            title="No nodes yet"
            description="Add a Pterodactyl node to start provisioning servers."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus /> New node
              </Button>
            }
          />
        }
      >
        {(data) => {
          const raw = (data as PteroAppNode[]) ?? [];
          const ui = raw.map(toUiNode);
          const online = ui.filter((n) => n.status === "online").length;
          const totalServers = ui.reduce((a, n) => a + n.servers, 0);
          const avgLoad = ui.length
            ? Math.round(ui.reduce((a, n) => a + n.cpuLoad, 0) / ui.length)
            : 0;

          return (
            <>
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Nodes online" value={`${online}/${ui.length}`} icon={HardDrive} accent />
                <StatCard label="Servers hosted" value={totalServers} icon={Boxes} />
                <StatCard label="Avg CPU load" value={`${avgLoad}%`} icon={Cpu} />
                <StatCard label="Maintenance" value={ui.filter((n) => n.status === "maintenance").length} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ui.map((node, i) => {
                  const rawNode = raw[i];
                  const status = node.status;
                  const ramPct = node.ram.total ? Math.round((node.ram.used / node.ram.total) * 100) : 0;
                  const diskPct = node.disk.total ? Math.round((node.disk.used / node.disk.total) * 100) : 0;
                  return (
                    <Card key={rawNode.id} hover className="flex flex-col p-5">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
                            <HardDrive className="size-5" />
                          </span>
                          <div>
                            <p className="font-mono text-sm font-medium text-ink">{node.name}</p>
                            <p className="text-xs text-ink-muted">{node.region}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={status === "online" ? "online" : status === "maintenance" ? "warn" : "default"}>
                            <span
                              className={`size-1.5 rounded-full ${
                                status === "online" ? "bg-online animate-pulse-ring" : status === "maintenance" ? "bg-warn" : "bg-ink-disabled"
                              }`}
                            />
                            {status}
                          </Badge>
                          <Dropdown>
                            <DropdownTrigger asChild>
                              <button
                                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-overlay2 hover:text-ink"
                                aria-label="Node actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownTrigger>
                            <DropdownContent align="end">
                              <DropdownItem onSelect={() => setEditing(rawNode)}>
                                <Pencil /> Edit
                              </DropdownItem>
                              <DropdownItem
                                onSelect={() => {
                                  updateMut.mutate(
                                    { id: rawNode.id, body: { maintenance_mode: !rawNode.maintenance_mode } },
                                    {
                                      onSuccess: () =>
                                        toast(`${node.name} maintenance ${rawNode.maintenance_mode ? "off" : "on"}`),
                                      onError: (e) => toast.error((e as Error).message),
                                    },
                                  );
                                }}
                              >
                                <Wrench /> Toggle maintenance
                              </DropdownItem>
                              <DropdownSeparator />
                              <DropdownItem
                                destructive
                                onSelect={() => {
                                  if (!confirm(`Delete node ${node.name}?`)) return;
                                  deleteMut.mutate(rawNode.id, {
                                    onSuccess: () => toast.success(`Deleted ${node.name}`),
                                    onError: (e) => toast.error((e as Error).message),
                                  });
                                }}
                              >
                                <Trash2 /> Delete node
                              </DropdownItem>
                            </DropdownContent>
                          </Dropdown>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Meter icon={Cpu} label="CPU" value={`${node.cpuLoad}%`} pct={node.cpuLoad} color={loadColor(node.cpuLoad)} />
                        <Meter icon={MemoryStick} label="RAM" value={`${node.ram.used} / ${node.ram.total} GB`} pct={ramPct} color={loadColor(ramPct)} />
                        <Meter icon={HardDrive} label="Disk" value={`${(node.disk.used / 1000).toFixed(1)} / ${(node.disk.total / 1000).toFixed(0)} TB`} pct={diskPct} color={loadColor(diskPct)} />
                      </div>

                      <p className="mt-4 truncate border-t border-hairline pt-3 font-mono text-[10px] text-ink-disabled">
                        {node.hardware}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </>
          );
        }}
      </DataState>

      <NodeDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("Node created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <NodeDialog
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Node updated");
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={updateMut.isPending}
      />
    </>
  );
}

function Meter({
  icon: Icon,
  label,
  value,
  pct,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-ink-muted">
          <Icon className="size-3.5" /> {label}
        </span>
        <span className="font-mono text-ink-secondary">{value}</span>
      </div>
      <Progress value={pct} indicatorClassName={color} />
    </div>
  );
}

function NodeDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: PteroAppNode;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit node" : "Create node"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              name: f.get("name"),
              fqdn: f.get("fqdn"),
              location_id: Number(f.get("location_id")),
              memory: Number(f.get("memory")),
              disk: Number(f.get("disk")),
              daemon_listen: Number(f.get("daemon_listen")),
              daemon_sftp: Number(f.get("daemon_sftp")),
              maintenance_mode: f.get("maintenance_mode") === "on",
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" name="name" required defaultValue={initial?.name} />
            <Field label="FQDN" name="fqdn" required defaultValue={initial?.fqdn} />
            <Field label="Location ID" name="location_id" type="number" min={1} required defaultValue={initial?.location_id ?? 1} />
            <Field label="Daemon port" name="daemon_listen" type="number" defaultValue={initial?.daemon_listen ?? 8080} />
            <Field label="SFTP port" name="daemon_sftp" type="number" defaultValue={initial?.daemon_sftp ?? 2022} />
            <Field label="Memory (MB)" name="memory" type="number" required defaultValue={initial?.memory ?? 0} />
            <Field label="Disk (MB)" name="disk" type="number" required defaultValue={initial?.disk ?? 0} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              name="maintenance_mode"
              defaultChecked={initial?.maintenance_mode ?? false}
              className="size-4 rounded border-line bg-bg"
            />
            Maintenance mode
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create node"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
