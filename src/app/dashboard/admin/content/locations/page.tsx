"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreHorizontal, MapPin } from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  useAdminLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/lib/api/hooks";

const STATUSES = ["ONLINE", "DEGRADED", "MAINTENANCE", "OFFLINE"] as const;
type LocationStatus = (typeof STATUSES)[number];

type Location = {
  id: string;
  slug: string;
  city: string;
  region: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  status: LocationStatus;
  hardware: string;
  capacity: number;
  sortIndex: number;
};

const STATUS_VARIANT: Record<LocationStatus, "online" | "warn" | "info" | "default"> = {
  ONLINE: "online",
  DEGRADED: "warn",
  MAINTENANCE: "info",
  OFFLINE: "default",
};

export default function AdminLocationsPage() {
  const listQ = useAdminLocations();
  const createMut = useCreateLocation();
  const updateMut = useUpdateLocation();
  const deleteMut = useDeleteLocation();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);

  return (
    <>
      <AdminHeader title="Locations" description="Map pins, hardware and capacity for every region.">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New location
        </Button>
      </AdminHeader>

      <Card className="overflow-hidden">
        <DataState
          query={listQ}
          loading={<TableSkeleton rows={6} columns={5} />}
          isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
          empty={
            <EmptyState
              icon={<MapPin />}
              title="No locations yet"
              description="Add a location to populate the world map and marketing pages."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New location
                </Button>
              }
            />
          }
        >
          {(data) => {
            const rows = ((data as Location[]) ?? [])
              .slice()
              .sort((a, b) => a.sortIndex - b.sortIndex);
            return (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="px-5 py-3 font-medium">City</th>
                      <th className="px-5 py-3 font-medium">Region</th>
                      <th className="px-5 py-3 font-medium">Coords</th>
                      <th className="px-5 py-3 font-medium">Hardware</th>
                      <th className="px-5 py-3 font-medium">Capacity</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((l) => (
                      <tr key={l.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                        <td className="px-5 py-3">
                          <p className="flex items-center gap-2 font-medium text-ink">
                            <span className="text-base">{l.flag}</span>
                            {l.city}
                            <span className="font-mono text-[11px] text-ink-muted">/ {l.slug}</span>
                          </p>
                          <p className="text-[11px] text-ink-muted">{l.country}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-secondary">{l.region}</td>
                        <td className="px-5 py-3 font-mono text-[11px] text-ink-muted">
                          {l.lat.toFixed(2)}, {l.lng.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 truncate font-mono text-[11px] text-ink-secondary">
                          {l.hardware}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={l.capacity} className="w-20" />
                            <span className="font-mono text-[11px] text-ink-muted">{l.capacity}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={STATUS_VARIANT[l.status]}>{l.status}</Badge>
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
                              <DropdownItem onSelect={() => setEditing(l)}>
                                <Pencil /> Edit
                              </DropdownItem>
                              <DropdownSeparator />
                              <DropdownItem
                                destructive
                                onSelect={() => {
                                  if (!confirm(`Delete location ${l.city}?`)) return;
                                  deleteMut.mutate(l.id, {
                                    onSuccess: () => toast.success("Location deleted"),
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

      <LocationDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("Location created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <LocationDialog
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Location updated");
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

function LocationDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: Location;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit location" : "Create location"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              slug: f.get("slug"),
              city: f.get("city"),
              region: f.get("region"),
              country: f.get("country"),
              flag: f.get("flag"),
              lat: Number(f.get("lat")),
              lng: Number(f.get("lng")),
              status: f.get("status"),
              hardware: f.get("hardware"),
              capacity: Number(f.get("capacity")),
              sortIndex: Number(f.get("sortIndex")),
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" name="slug" required defaultValue={initial?.slug} />
            <Field label="City" name="city" required defaultValue={initial?.city} />
            <Field label="Region" name="region" required placeholder="EU / US / TR" defaultValue={initial?.region} />
            <Field label="Country" name="country" required defaultValue={initial?.country} />
            <Field label="Flag" name="flag" required placeholder="🇩🇪" defaultValue={initial?.flag} />
            <Field label="Sort index" name="sortIndex" type="number" defaultValue={initial?.sortIndex ?? 0} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Latitude"
              name="lat"
              type="number"
              step="0.0001"
              required
              defaultValue={initial?.lat ?? 0}
            />
            <Field
              label="Longitude"
              name="lng"
              type="number"
              step="0.0001"
              required
              defaultValue={initial?.lng ?? 0}
            />
          </div>
          <Field label="Hardware" name="hardware" required defaultValue={initial?.hardware} />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Capacity (%)"
              name="capacity"
              type="number"
              min={0}
              max={100}
              required
              defaultValue={initial?.capacity ?? 0}
            />
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? "ONLINE"}
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
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create location"}
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
