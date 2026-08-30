"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tag, Plus, MoreHorizontal, Pencil, Trash2, Star, Eye, EyeOff, TicketPercent } from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { StatCard } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useAdminPlans,
  useAdminPromos,
  useCreatePlan,
  useCreatePromo,
  useUpdatePlan,
  useUpdatePromo,
  useDeletePlan,
  useDeletePromo,
} from "@/lib/api/hooks";

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  ramMb: number;
  cpuPct: number;
  diskMb: number;
  dbCount: number;
  backups: number;
  creditCost: number;
  region: "EU" | "US" | "TR" | "GLOBAL";
  featured: boolean;
  popular: boolean;
  published: boolean;
  sortIndex: number;
};

type PromoRow = {
  id: string;
  code: string;
  label?: string | null;
  description?: string | null;
  scope: "DEPLOY_DISCOUNT" | "CREDIT_BALANCE";
  type: "FIXED_CREDITS" | "PERCENT";
  amount: number;
  maxRedemptions?: number | null;
  maxPerUser: number;
  active: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  _count?: { redemptions: number };
};

const REGIONS = ["EU", "US", "TR", "GLOBAL"] as const;

export default function AdminPlansPage() {
  const plansQ = useAdminPlans();
  const createMut = useCreatePlan();
  const updateMut = useUpdatePlan();
  const deleteMut = useDeletePlan();
  const promosQ = useAdminPromos();
  const createPromoMut = useCreatePromo();
  const updatePromoMut = useUpdatePromo();
  const deletePromoMut = useDeletePromo();

  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoRow | null>(null);
  const [creatingPromo, setCreatingPromo] = useState(false);

  return (
    <>
      <AdminHeader
        title="Server plans"
        description="Yayinli planlar hem marketing pricing sayfasinda hem de server satin alma akisinda kullanilir."
      >
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New plan
        </Button>
      </AdminHeader>

      <DataState
        query={plansQ}
        loading={
          <Card className="overflow-hidden">
            <TableSkeleton rows={6} columns={5} />
          </Card>
        }
        isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
        empty={
          <EmptyState
            icon={<Tag />}
            title="No plans yet"
            description="Create your first pricing plan to publish it on the marketing site."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus /> New plan
              </Button>
            }
          />
        }
      >
        {(data) => {
          const rows = (data as PlanRow[]) ?? [];
          const published = rows.filter((p) => p.published).length;
          const featured = rows.filter((p) => p.featured).length;
          return (
            <>
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total plans" value={rows.length} icon={Tag} accent />
                <StatCard label="Published" value={published} icon={Eye} />
                <StatCard label="Featured" value={featured} icon={Star} />
                <StatCard label="Drafts" value={rows.length - published} />
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                        <th className="px-5 py-3 font-medium">Plan</th>
                        <th className="px-5 py-3 font-medium">Region</th>
                        <th className="px-5 py-3 font-medium">RAM / CPU / Disk</th>
                        <th className="px-5 py-3 font-medium">Credits</th>
                        <th className="px-5 py-3 font-medium">Flags</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .slice()
                        .sort((a, b) => a.sortIndex - b.sortIndex)
                        .map((p) => (
                          <tr key={p.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                            <td className="px-5 py-3">
                              <p className="font-medium text-ink">{p.name}</p>
                              <p className="font-mono text-[11px] text-ink-muted">{p.slug}</p>
                            </td>
                            <td className="px-5 py-3">
                              <Badge variant="outline">{p.region}</Badge>
                            </td>
                            <td className="px-5 py-3 font-mono text-[12px] text-ink-secondary">
                              {p.ramMb} MB · {p.cpuPct}% · {p.diskMb} MB
                            </td>
                            <td className="px-5 py-3 font-mono text-ink">{p.creditCost} credits</td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1">
                                {p.featured && <Badge variant="accent">Featured</Badge>}
                                {p.popular && <Badge variant="info">Popular</Badge>}
                                {!p.published && <Badge variant="warn">Draft</Badge>}
                              </div>
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
                                  <DropdownItem onSelect={() => setEditing(p)}>
                                    <Pencil /> Edit
                                  </DropdownItem>
                                  <DropdownItem
                                    onSelect={() => {
                                      updateMut.mutate(
                                        { id: p.id, body: { published: !p.published } },
                                        {
                                          onSuccess: () =>
                                            toast.success(`Plan ${p.published ? "unpublished" : "published"}`),
                                          onError: (e) => toast.error((e as Error).message),
                                        },
                                      );
                                    }}
                                  >
                                    {p.published ? <EyeOff /> : <Eye />}{" "}
                                    {p.published ? "Unpublish" : "Publish"}
                                  </DropdownItem>
                                  <DropdownSeparator />
                                  <DropdownItem
                                    destructive
                                    onSelect={() => {
                                      if (!confirm(`Delete plan ${p.name}?`)) return;
                                      deleteMut.mutate(p.id, {
                                        onSuccess: () => toast.success(`Deleted ${p.name}`),
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
              </Card>
            </>
          );
        }}
      </DataState>

      <DataState
        query={promosQ}
        loading={
          <Card className="overflow-hidden">
            <TableSkeleton rows={5} columns={5} />
          </Card>
        }
        isEmpty={(d) => (Array.isArray(d) ? d.length === 0 : true)}
        empty={
          <EmptyState
            icon={<TicketPercent />}
            title="No promo codes yet"
            description="Create your first coupon or promo code so users can apply it during deploy."
            action={
              <Button size="sm" onClick={() => setCreatingPromo(true)}>
                <Plus /> New promo code
              </Button>
            }
          />
        }
      >
        {(data) => {
          const rows = (data as PromoRow[]) ?? [];
          const activeCount = rows.filter((promo) => promo.active).length;
          const totalRedemptions = rows.reduce((sum, promo) => sum + (promo._count?.redemptions ?? 0), 0);
          return (
            <>
              <div className="mt-10 mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Coupon / promo codes</h2>
                  <p className="text-sm text-ink-muted">
                    Users can apply these codes in the deploy wizard to reduce the first monthly charge.
                  </p>
                </div>
                <Button size="sm" onClick={() => setCreatingPromo(true)}>
                  <Plus /> New promo code
                </Button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total codes" value={rows.length} icon={TicketPercent} accent />
                <StatCard label="Active" value={activeCount} icon={Eye} />
                <StatCard label="Inactive" value={rows.length - activeCount} icon={EyeOff} />
                <StatCard label="Redemptions" value={totalRedemptions} icon={Tag} />
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                        <th className="px-5 py-3 font-medium">Code</th>
                        <th className="px-5 py-3 font-medium">Kind</th>
                        <th className="px-5 py-3 font-medium">Value</th>
                        <th className="px-5 py-3 font-medium">Limits</th>
                        <th className="px-5 py-3 font-medium">Schedule</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((promo) => (
                        <tr key={promo.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                          <td className="px-5 py-3">
                            <p className="font-medium text-ink">{promo.code}</p>
                            <p className="text-xs text-ink-muted">
                              {promo.label || promo.description || "No label"}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={promo.scope === "CREDIT_BALANCE" ? "info" : "accent"}>
                              {promo.scope === "CREDIT_BALANCE" ? "Coin redeem" : "Deploy discount"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 font-mono text-ink">
                            {promo.type === "PERCENT" ? `${promo.amount}% off` : `${promo.amount} credits off`}
                          </td>
                          <td className="px-5 py-3 text-xs text-ink-secondary">
                            <p>Per user: {promo.maxPerUser}</p>
                            <p>
                              Total: {promo.maxRedemptions ?? "Unlimited"} · Used: {promo._count?.redemptions ?? 0}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-xs text-ink-secondary">
                            <p>{promo.startsAt ? formatDateTime(promo.startsAt) : "Starts immediately"}</p>
                            <p>{promo.expiresAt ? `Ends ${formatDateTime(promo.expiresAt)}` : "No expiry"}</p>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={promo.active ? "accent" : "warn"}>
                                {promo.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
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
                                <DropdownItem onSelect={() => setEditingPromo(promo)}>
                                  <Pencil /> Edit
                                </DropdownItem>
                                <DropdownItem
                                  onSelect={() => {
                                    updatePromoMut.mutate(
                                      { id: promo.id, body: { active: !promo.active } },
                                      {
                                        onSuccess: () =>
                                          toast.success(`Promo code ${promo.active ? "disabled" : "enabled"}`),
                                        onError: (e) => toast.error((e as Error).message),
                                      },
                                    );
                                  }}
                                >
                                  {promo.active ? <EyeOff /> : <Eye />}{" "}
                                  {promo.active ? "Disable" : "Enable"}
                                </DropdownItem>
                                <DropdownSeparator />
                                <DropdownItem
                                  destructive
                                  onSelect={() => {
                                    if (!confirm(`Delete promo code ${promo.code}?`)) return;
                                    deletePromoMut.mutate(promo.id, {
                                      onSuccess: () => toast.success(`Deleted ${promo.code}`),
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
              </Card>
            </>
          );
        }}
      </DataState>

      <PlanDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("Plan created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <PlanDialog
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Plan updated");
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={updateMut.isPending}
      />

      <PromoDialog
        open={creatingPromo}
        onClose={() => setCreatingPromo(false)}
        onSubmit={(body) =>
          createPromoMut.mutate(body, {
            onSuccess: () => {
              toast.success("Promo code created");
              setCreatingPromo(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createPromoMut.isPending}
      />

      <PromoDialog
        open={!!editingPromo}
        initial={editingPromo ?? undefined}
        onClose={() => setEditingPromo(null)}
        onSubmit={(body) => {
          if (!editingPromo) return;
          updatePromoMut.mutate(
            { id: editingPromo.id, body },
            {
              onSuccess: () => {
                toast.success("Promo code updated");
                setEditingPromo(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={updatePromoMut.isPending}
      />
    </>
  );
}

function PlanDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: PlanRow;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit plan" : "Create plan"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              slug: f.get("slug"),
              name: f.get("name"),
              tagline: f.get("tagline") || null,
              ramMb: Number(f.get("ramMb")),
              cpuPct: Number(f.get("cpuPct")),
              diskMb: Number(f.get("diskMb")),
              dbCount: Number(f.get("dbCount")),
              backups: Number(f.get("backups")),
              creditCost: Number(f.get("creditCost")),
              priceMonth: Number(f.get("creditCost")) * 100,
              priceYear: Number(f.get("creditCost")) * 1200,
              region: f.get("region"),
              featured: f.get("featured") === "on",
              popular: f.get("popular") === "on",
              published: f.get("published") === "on",
              sortIndex: Number(f.get("sortIndex")),
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" name="slug" required defaultValue={initial?.slug} />
            <Field label="Name" name="name" required defaultValue={initial?.name} />
          </div>
          <Field label="Tagline" name="tagline" defaultValue={initial?.tagline ?? ""} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="RAM (MB)" name="ramMb" type="number" min={0} required defaultValue={initial?.ramMb ?? 1024} />
            <Field label="CPU (%)" name="cpuPct" type="number" min={0} required defaultValue={initial?.cpuPct ?? 100} />
            <Field label="Disk (MB)" name="diskMb" type="number" min={0} required defaultValue={initial?.diskMb ?? 5000} />
            <Field label="DB count" name="dbCount" type="number" min={0} defaultValue={initial?.dbCount ?? 1} />
            <Field label="Backups" name="backups" type="number" min={0} defaultValue={initial?.backups ?? 1} />
            <Field label="Credit cost" name="creditCost" type="number" min={0} required defaultValue={initial?.creditCost ?? 50} />
            <Field label="Sort index" name="sortIndex" type="number" defaultValue={initial?.sortIndex ?? 0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region">Region</Label>
            <Select id="region" name="region" defaultValue={initial?.region ?? "GLOBAL"}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-4 pt-1 text-sm text-ink-secondary">
            <Check name="published" label="Published" defaultChecked={initial?.published ?? true} />
            <Check name="featured" label="Featured" defaultChecked={initial?.featured ?? false} />
            <Check name="popular" label="Popular" defaultChecked={initial?.popular ?? false} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create plan"}
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

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    />
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 rounded border-line bg-bg" />
      {label}
    </label>
  );
}

function PromoDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: PromoRow;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit promo code" : "Create promo code"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              code: f.get("code"),
              label: f.get("label") || null,
              description: f.get("description") || null,
              scope: f.get("scope") || "DEPLOY_DISCOUNT",
              type: f.get("type"),
              amount: Number(f.get("amount")),
              maxRedemptions: f.get("maxRedemptions") ? Number(f.get("maxRedemptions")) : null,
              maxPerUser: Number(f.get("maxPerUser") || 1),
              active: f.get("active") === "on",
              startsAt: f.get("startsAt") ? new Date(String(f.get("startsAt"))).toISOString() : null,
              expiresAt: f.get("expiresAt") ? new Date(String(f.get("expiresAt"))).toISOString() : null,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code" name="code" required defaultValue={initial?.code} />
            <div className="space-y-1.5">
              <Label htmlFor="scope">Kind</Label>
              <Select id="scope" name="scope" defaultValue={initial?.scope ?? "DEPLOY_DISCOUNT"}>
                <option value="DEPLOY_DISCOUNT">Deploy discount</option>
                <option value="CREDIT_BALANCE">Coin redeem</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Discount type</Label>
              <Select id="type" name="type" defaultValue={initial?.type ?? "PERCENT"}>
                <option value="PERCENT">Percent</option>
                <option value="FIXED_CREDITS">Fixed credits</option>
              </Select>
            </div>
            <Field label="Label" name="label" defaultValue={initial?.label ?? ""} />
            <Field label="Amount" name="amount" type="number" min={1} required defaultValue={initial?.amount ?? 10} />
          </div>
          <Field label="Description" name="description" defaultValue={initial?.description ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Max total redemptions"
              name="maxRedemptions"
              type="number"
              min={1}
              defaultValue={initial?.maxRedemptions ?? ""}
            />
            <Field
              label="Max uses per user"
              name="maxPerUser"
              type="number"
              min={1}
              required
              defaultValue={initial?.maxPerUser ?? 1}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Starts at"
              name="startsAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initial?.startsAt)}
            />
            <Field
              label="Expires at"
              name="expiresAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initial?.expiresAt)}
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-1 text-sm text-ink-secondary">
            <Check name="active" label="Active" defaultChecked={initial?.active ?? true} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create promo code"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
