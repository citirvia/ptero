"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  MessageSquarePlus,
  X,
} from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useAdminIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useAppendIncidentUpdate,
} from "@/lib/api/hooks";
import { formatDateTime } from "@/lib/utils";

const SEVERITIES = ["MINOR", "MAJOR", "CRITICAL", "MAINTENANCE"] as const;
const STATUSES = [
  "INVESTIGATING",
  "IDENTIFIED",
  "MONITORING",
  "RESOLVED",
  "SCHEDULED",
  "COMPLETED",
] as const;
const UPDATE_LABELS = ["Investigating", "Monitoring", "Resolved", "Update"] as const;

type IncidentUpdate = { id: string; body: string; label: string; postedAt: string };
type Incident = {
  id: string;
  slug: string;
  title: string;
  severity: (typeof SEVERITIES)[number];
  status: (typeof STATUSES)[number];
  services: string[];
  body: string;
  startedAt: string;
  resolvedAt?: string | null;
  updates?: IncidentUpdate[];
};

const SEV_VARIANT: Record<string, "warn" | "danger" | "info" | "outline"> = {
  MINOR: "info",
  MAJOR: "warn",
  CRITICAL: "danger",
  MAINTENANCE: "outline",
};
const STATUS_VARIANT: Record<string, "warn" | "online" | "info"> = {
  INVESTIGATING: "warn",
  IDENTIFIED: "warn",
  MONITORING: "info",
  RESOLVED: "online",
  SCHEDULED: "info",
  COMPLETED: "online",
};

export default function AdminIncidentsPage() {
  const listQ = useAdminIncidents();
  const createMut = useCreateIncident();
  const updateMut = useUpdateIncident();
  const deleteMut = useDeleteIncident();
  const appendMut = useAppendIncidentUpdate();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);

  return (
    <>
      <AdminHeader title="Incidents" description="Status-page incidents with severity, services and live updates.">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New incident
        </Button>
      </AdminHeader>

      <Card className="overflow-hidden">
        <DataState
          query={listQ}
          loading={<TableSkeleton rows={6} columns={5} />}
          isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
          empty={
            <EmptyState
              icon={<AlertTriangle />}
              title="No incidents reported"
              description="Create an incident to start a status timeline."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New incident
                </Button>
              }
            />
          }
        >
          {(data) => {
            const rows = (data as Incident[]) ?? [];
            return (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Severity</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Services</th>
                      <th className="px-5 py-3 font-medium">Started</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((inc) => (
                      <tr key={inc.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{inc.title}</p>
                          <p className="font-mono text-[11px] text-ink-muted">{inc.slug}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={SEV_VARIANT[inc.severity] ?? "outline"}>{inc.severity}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={STATUS_VARIANT[inc.status] ?? "outline"}>{inc.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-ink-secondary">
                          <div className="flex flex-wrap gap-1">
                            {(inc.services ?? []).map((s) => (
                              <Badge key={s} variant="outline">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-ink-muted">
                          {inc.startedAt ? formatDateTime(inc.startedAt) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Dropdown>
                            <DropdownTrigger asChild>
                              <button
                                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-overlay2 hover:text-ink"
                                aria-label="Actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownTrigger>
                            <DropdownContent align="end">
                              <DropdownItem onSelect={() => setEditing(inc)}>
                                <Pencil /> Edit + post update
                              </DropdownItem>
                              <DropdownSeparator />
                              <DropdownItem
                                destructive
                                onSelect={() => {
                                  if (!confirm(`Delete incident "${inc.title}"?`)) return;
                                  deleteMut.mutate(inc.id, {
                                    onSuccess: () => toast.success("Incident deleted"),
                                    onError: (e) => toast.error((e as Error).message),
                                  });
                                }}
                              >
                                <Trash2 /> Delete
                              </DropdownItem>
                            </DropdownContent>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }}
        </DataState>
      </Card>

      <IncidentDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("Incident created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <IncidentDialog
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Incident updated");
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        onAppendUpdate={(body) => {
          if (!editing) return;
          appendMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => toast.success("Update posted"),
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={updateMut.isPending || appendMut.isPending}
      />
    </>
  );
}

function IncidentDialog({
  open,
  initial,
  onClose,
  onSubmit,
  onAppendUpdate,
  submitting,
}: {
  open: boolean;
  initial?: Incident;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  onAppendUpdate?: (body: { body: string; label?: string }) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  const [services, setServices] = useState<string[]>(initial?.services ?? []);
  const [serviceInput, setServiceInput] = useState("");

  // reset chips when opening a new dialog
  function handleOpenChange(o: boolean) {
    if (!o) onClose();
    if (o) {
      setServices(initial?.services ?? []);
      setServiceInput("");
    }
  }

  function addService() {
    const v = serviceInput.trim();
    if (!v) return;
    if (!services.includes(v)) setServices([...services, v]);
    setServiceInput("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit incident" : "Create incident"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const resolvedAt = (f.get("resolvedAt") as string) || null;
            onSubmit({
              slug: f.get("slug"),
              title: f.get("title"),
              severity: f.get("severity"),
              status: f.get("status"),
              services,
              body: f.get("body"),
              resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" name="slug" required defaultValue={initial?.slug} />
            <Field label="Title" name="title" required defaultValue={initial?.title} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Severity" name="severity" options={SEVERITIES} defaultValue={initial?.severity ?? "MINOR"} />
            <SelectField label="Status" name="status" options={STATUSES} defaultValue={initial?.status ?? "INVESTIGATING"} />
          </div>

          <div className="space-y-1.5">
            <Label>Services</Label>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-elevated px-2.5 py-0.5 text-xs text-ink-secondary"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setServices(services.filter((x) => x !== s))}
                    className="text-ink-muted hover:text-ink"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addService();
                  }
                }}
                placeholder="Add service (e.g. Panel, Wings)"
              />
              <Button type="button" variant="outline" size="sm" onClick={addService}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" name="body" rows={4} required defaultValue={initial?.body} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resolvedAt">Resolved at (optional)</Label>
            <Input
              id="resolvedAt"
              name="resolvedAt"
              type="datetime-local"
              defaultValue={
                initial?.resolvedAt ? initial.resolvedAt.slice(0, 16) : ""
              }
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-hairline pt-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create incident"}
            </Button>
          </div>
        </form>

        {editing && onAppendUpdate && (
          <div className="mt-5 border-t border-hairline pt-4">
            <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              <MessageSquarePlus className="size-3.5" /> Post a new update
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const body = String(f.get("update_body") ?? "").trim();
                if (!body) return;
                onAppendUpdate({
                  body,
                  label: String(f.get("update_label") ?? "Update"),
                });
                (e.currentTarget as HTMLFormElement).reset();
              }}
              className="space-y-3"
            >
              <SelectField
                label="Label"
                name="update_label"
                options={UPDATE_LABELS}
                defaultValue="Update"
              />
              <div className="space-y-1.5">
                <Label htmlFor="update_body">Update body</Label>
                <Textarea id="update_body" name="update_body" rows={3} required />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" variant="secondary" disabled={submitting}>
                  Post update
                </Button>
              </div>
            </form>

            {(initial?.updates ?? []).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  Recent updates
                </p>
                {(initial!.updates ?? []).slice(0, 5).map((u) => (
                  <div key={u.id} className="rounded-xl border border-hairline bg-bg/40 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline">{u.label}</Badge>
                      <span className="font-mono text-[10px] text-ink-muted">
                        {formatDateTime(u.postedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-secondary">{u.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
