"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreHorizontal, Megaphone, X } from "lucide-react";
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
  useAdminChangelog,
  useCreateChangelogEntry,
  useUpdateChangelogEntry,
  useDeleteChangelogEntry,
} from "@/lib/api/hooks";
import { formatDate } from "@/lib/utils";

type ChangelogEntry = {
  id: string;
  slug: string;
  title: string;
  version: string;
  body: string;
  tags: string[];
  publishedAt: string;
};

export default function AdminChangelogPage() {
  const listQ = useAdminChangelog();
  const createMut = useCreateChangelogEntry();
  const updateMut = useUpdateChangelogEntry();
  const deleteMut = useDeleteChangelogEntry();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ChangelogEntry | null>(null);

  return (
    <>
      <AdminHeader title="Changelog" description="Versioned release notes published to the marketing site.">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New entry
        </Button>
      </AdminHeader>

      <Card className="overflow-hidden">
        <DataState
          query={listQ}
          loading={<TableSkeleton rows={6} columns={4} />}
          isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
          empty={
            <EmptyState
              icon={<Megaphone />}
              title="No changelog entries yet"
              description="Publish a release note to ship it on the marketing site."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New entry
                </Button>
              }
            />
          }
        >
          {(data) => {
            const rows = ((data as ChangelogEntry[]) ?? [])
              .slice()
              .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
            return (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="px-5 py-3 font-medium">Version</th>
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Tags</th>
                      <th className="px-5 py-3 font-medium">Published</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={e.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                        <td className="px-5 py-3 font-mono text-ink">{e.version}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{e.title}</p>
                          <p className="font-mono text-[11px] text-ink-muted">{e.slug}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(e.tags ?? []).map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-ink-muted">
                          {e.publishedAt ? formatDate(e.publishedAt) : "—"}
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
                              <DropdownItem onSelect={() => setEditing(e)}>
                                <Pencil /> Edit
                              </DropdownItem>
                              <DropdownSeparator />
                              <DropdownItem
                                destructive
                                onSelect={() => {
                                  if (!confirm(`Delete ${e.version} – ${e.title}?`)) return;
                                  deleteMut.mutate(e.id, {
                                    onSuccess: () => toast.success("Entry deleted"),
                                    onError: (err) => toast.error((err as Error).message),
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

      <ChangelogDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("Entry created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <ChangelogDialog
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Entry updated");
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

function ChangelogDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: ChangelogEntry;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  function handleOpenChange(o: boolean) {
    if (!o) onClose();
    if (o) {
      setTags(initial?.tags ?? []);
      setTagInput("");
    }
  }

  function addTag() {
    const v = tagInput.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit changelog entry" : "Create changelog entry"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const publishedAt = (f.get("publishedAt") as string) || "";
            onSubmit({
              slug: f.get("slug"),
              title: f.get("title"),
              version: f.get("version"),
              body: f.get("body"),
              tags,
              publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required defaultValue={initial?.slug} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="version">Version</Label>
              <Input id="version" name="version" required placeholder="v1.2.0" defaultValue={initial?.version} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initial?.title} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body (Markdown)</Label>
            <Textarea id="body" name="body" rows={6} required defaultValue={initial?.body} />
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-elevated px-2.5 py-0.5 text-xs text-ink-secondary"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="text-ink-muted hover:text-ink"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag (e.g. feature, fix)"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publishedAt">Published at (optional)</Label>
            <Input
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
              defaultValue={initial?.publishedAt ? initial.publishedAt.slice(0, 16) : ""}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
