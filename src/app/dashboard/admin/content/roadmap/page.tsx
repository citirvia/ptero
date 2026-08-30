"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreHorizontal, Map as MapIcon } from "lucide-react";
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
  useAdminRoadmap,
  useCreateRoadmapItem,
  useUpdateRoadmapItem,
  useDeleteRoadmapItem,
} from "@/lib/api/hooks";

const STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED"] as const;
type RoadmapStatus = (typeof STATUSES)[number];

type RoadmapItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: RoadmapStatus;
  votes: number;
  eta?: string | null;
  sortIndex: number;
};

const STATUS_VARIANT: Record<RoadmapStatus, "outline" | "info" | "online"> = {
  PLANNED: "outline",
  IN_PROGRESS: "info",
  COMPLETED: "online",
};

export default function AdminRoadmapPage() {
  const listQ = useAdminRoadmap();
  const createMut = useCreateRoadmapItem();
  const updateMut = useUpdateRoadmapItem();
  const deleteMut = useDeleteRoadmapItem();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);

  return (
    <>
      <AdminHeader title="Roadmap" description="Public roadmap columns — planned, in-progress and shipped items.">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New item
        </Button>
      </AdminHeader>

      <Card className="overflow-hidden">
        <DataState
          query={listQ}
          loading={<TableSkeleton rows={6} columns={5} />}
          isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
          empty={
            <EmptyState
              icon={<MapIcon />}
              title="No roadmap items yet"
              description="Add a feature or bug to your public roadmap."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New item
                </Button>
              }
            />
          }
        >
          {(data) => {
            const rows = ((data as RoadmapItem[]) ?? [])
              .slice()
              .sort((a, b) => a.sortIndex - b.sortIndex);
            return (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Votes</th>
                      <th className="px-5 py-3 font-medium">ETA</th>
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((it) => (
                      <tr key={it.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{it.title}</p>
                          <p className="line-clamp-1 text-[11px] text-ink-muted">{it.body}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-secondary">{it.category}</td>
                        <td className="px-5 py-3">
                          <Badge variant={STATUS_VARIANT[it.status]}>{it.status}</Badge>
                        </td>
                        <td className="px-5 py-3 font-mono text-ink-secondary">{it.votes}</td>
                        <td className="px-5 py-3 font-mono text-[11px] text-ink-muted">{it.eta ?? "—"}</td>
                        <td className="px-5 py-3 font-mono text-[11px] text-ink-muted">{it.sortIndex}</td>
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
                              <DropdownItem onSelect={() => setEditing(it)}>
                                <Pencil /> Edit
                              </DropdownItem>
                              <DropdownSeparator />
                              <DropdownItem
                                destructive
                                onSelect={() => {
                                  if (!confirm(`Delete "${it.title}"?`)) return;
                                  deleteMut.mutate(it.id, {
                                    onSuccess: () => toast.success("Item deleted"),
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

      <RoadmapDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("Roadmap item created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <RoadmapDialog
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Roadmap item updated");
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

function RoadmapDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: RoadmapItem;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit roadmap item" : "Create roadmap item"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              title: f.get("title"),
              body: f.get("body"),
              category: f.get("category"),
              status: f.get("status"),
              votes: Number(f.get("votes")),
              eta: (f.get("eta") as string) || null,
              sortIndex: Number(f.get("sortIndex")),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initial?.title} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" name="body" rows={4} required defaultValue={initial?.body} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={initial?.category ?? "general"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? "PLANNED"}
                className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="votes">Votes</Label>
              <Input id="votes" name="votes" type="number" min={0} defaultValue={initial?.votes ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eta">ETA</Label>
              <Input id="eta" name="eta" placeholder="Q2 2026" defaultValue={initial?.eta ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortIndex">Sort index</Label>
              <Input id="sortIndex" name="sortIndex" type="number" defaultValue={initial?.sortIndex ?? 0} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
