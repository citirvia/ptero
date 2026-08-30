"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  ExternalLink,
  RotateCw,
  Ban,
  CheckCircle2,
  Trash2,
  Boxes,
  Pencil,
  ChevronRight,
  Globe,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { StatCard } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { DataState } from "@/components/ui/data-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useAdminServers,
  useSuspendServer,
  useUnsuspendServer,
  useReinstallAdminServer,
  useDeleteAdminServer,
  useAdminUserDetail,
  useEggs,
  useUpdateServerBuild,
  useUpdateServerDetails,
} from "@/lib/api/hooks";
import { RUNTIME_META, type Runtime } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type AdminServer = {
  id: number;
  identifier?: string;
  uuid?: string;
  name: string;
  description?: string;
  owner?: number;
  user?: number;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_avatar_url?: string | null;
  owner_app_user_id?: string | null;
  node?: number;
  suspended?: boolean;
  nest?: number;
  egg?: number;
  docker_image?: string;
  limits?: { memory?: number; cpu?: number; disk?: number; swap?: number; io?: number };
  feature_limits?: { databases?: number; allocations?: number; backups?: number };
};

type AdminOwnerDetailResponse = {
  user: {
    id: number;
    uuid?: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    language?: string;
    root_admin?: boolean;
    "2fa"?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  linkedAppUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatarUrl?: string | null;
    creditBalance?: number;
    pteroUserId?: number | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  summary: {
    serverCount: number;
    country?: string;
    countryCode?: string | null;
    flag?: string;
    lastIp?: string | null;
  };
};

type AdminEgg = {
  id: number;
  nest: number;
  name?: string;
  description?: string;
  docker_image?: string;
};

function guessRuntime(...parts: Array<string | undefined>): Runtime {
  const img = parts.filter(Boolean).join(" ").toLowerCase();
  if (/bun/.test(img)) return "bun";
  if (/python/.test(img)) return "python";
  if (/node|js/.test(img)) return "node";
  return "docker";
}

export default function AdminServersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminServer | null>(null);
  const [ownerDetailId, setOwnerDetailId] = useState<number | null>(null);
  const [tab, setTab] = useState<"details" | "build">("details");

  const serversQ = useAdminServers(page);
  const eggsQ = useEggs();
  const ownerDetailQ = useAdminUserDetail(ownerDetailId);
  const suspendMut = useSuspendServer();
  const unsuspendMut = useUnsuspendServer();
  const reinstallMut = useReinstallAdminServer();
  const deleteMut = useDeleteAdminServer();
  const buildMut = useUpdateServerBuild();
  const detailsMut = useUpdateServerDetails();
  const eggLookup = useMemo(() => {
    const eggs = (eggsQ.data as AdminEgg[] | undefined) ?? [];
    return new Map<string, AdminEgg>(eggs.map((egg) => [`${egg.nest}:${egg.id}`, egg]));
  }, [eggsQ.data]);

  const meta = (serversQ.data as { meta?: { totalPages?: number } } | undefined)?.meta;
  const pageCount = meta?.totalPages ?? 1;

  return (
    <>
      <AdminHeader
        title="All servers"
        description="Every server across every customer and node on the platform."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-hairline p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search server, owner, or node…"
              className="pl-9"
            />
          </div>
        </div>

        <DataState
          query={serversQ}
          loading={<TableSkeleton rows={8} columns={6} />}
          isEmpty={(d) => ((d as { servers?: unknown[] }).servers ?? []).length === 0}
          empty={
            <EmptyState
              icon={<Boxes />}
              title="No servers yet"
              description="Provisioned servers will appear here once customers deploy."
            />
          }
        >
          {(data) => {
            const all = ((data as { servers?: AdminServer[] }).servers ?? []) as AdminServer[];
            const filtered = all.filter((s) => {
              const q = query.toLowerCase();
              return (
                !q ||
                s.name?.toLowerCase().includes(q) ||
                String(s.owner ?? s.user ?? "").includes(q) ||
                String(s.node ?? "").includes(q)
              );
            });
            const active = all.filter((s) => !s.suspended).length;
            const suspended = all.filter((s) => !!s.suspended).length;

            return (
              <>
                <div className="grid grid-cols-2 gap-4 border-b border-hairline p-4 lg:grid-cols-4">
                  <StatCard label="Total servers" value={all.length} accent />
                  <StatCard label="Active" value={active} />
                  <StatCard label="Suspended" value={suspended} />
                  <StatCard label="Page" value={`${page}/${pageCount}`} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                        <th className="px-5 py-3 font-medium">Server</th>
                        <th className="px-5 py-3 font-medium">Owner</th>
                        <th className="px-5 py-3 font-medium">Runtime</th>
                        <th className="px-5 py-3 font-medium">Node</th>
                        <th className="px-5 py-3 font-medium">RAM</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => {
                        const matchedEgg = eggLookup.get(`${s.nest ?? ""}:${s.egg ?? ""}`);
                        const runtime = guessRuntime(
                          matchedEgg?.name,
                          matchedEgg?.description,
                          matchedEgg?.docker_image,
                          s.docker_image,
                        );
                        const rmeta = RUNTIME_META[runtime];
                        const ram = s.limits?.memory ?? 0;
                        const status = s.suspended ? "suspended" : "active";
                        return (
                          <tr key={s.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                            <td className="px-5 py-3 font-mono font-medium text-ink">{s.name}</td>
                            <td className="px-5 py-3">
                              {s.user ? (
                                <button
                                  type="button"
                                  onClick={() => setOwnerDetailId(s.user ?? null)}
                                  className="group inline-flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-overlay2"
                                >
                                  <Avatar
                                    name={s.owner_name ?? String(s.owner ?? s.user)}
                                    src={s.owner_avatar_url ?? undefined}
                                    className="size-9"
                                  />
                                  <span className="flex flex-col">
                                    <span className="font-medium text-ink">
                                      {s.owner_name ?? `User #${s.owner ?? s.user}`}
                                    </span>
                                    <span className="font-mono text-[11px] text-ink-muted">
                                      {s.owner_email ?? `Panel #${s.user}`}
                                    </span>
                                  </span>
                                  <ChevronRight className="size-4 text-ink-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-ink-muted" />
                                </button>
                              ) : (
                                <span className="text-ink-secondary">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full" style={{ background: rmeta.color }} />
                                <span className="text-ink-secondary">{rmeta.label}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-[12px] text-ink-muted">{s.node ?? "—"}</td>
                            <td className="px-5 py-3 font-mono text-ink-secondary">{ram ? `${ram} MB` : "—"}</td>
                            <td className="px-5 py-3">
                              <Badge variant={s.suspended ? "warn" : "online"}>
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    !s.suspended && "bg-online animate-pulse-ring",
                                    s.suspended && "bg-warn",
                                  )}
                                />
                                {status}
                              </Badge>
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
                                  <DropdownItem asChild>
                                    <Link href={`/dashboard/servers/${s.identifier ?? s.uuid ?? ""}/overview`}>
                                      <ExternalLink /> Open server
                                    </Link>
                                  </DropdownItem>
                                  <DropdownItem
                                    onSelect={() => {
                                      setTab("details");
                                      setEditing(s);
                                    }}
                                  >
                                    <Pencil /> Edit
                                  </DropdownItem>
                                  <DropdownItem
                                    onSelect={() => {
                                      if (!confirm(`Reinstall ${s.name}?`)) return;
                                      reinstallMut.mutate(s.id, {
                                        onSuccess: () => toast.success(`Reinstall queued for ${s.name}`),
                                        onError: (e) => toast.error((e as Error).message),
                                      });
                                    }}
                                  >
                                    <RotateCw /> Reinstall
                                  </DropdownItem>
                                  <DropdownSeparator />
                                  {s.suspended ? (
                                    <DropdownItem
                                      onSelect={() =>
                                        unsuspendMut.mutate(s.id, {
                                          onSuccess: () => toast.success(`Unsuspended ${s.name}`),
                                          onError: (e) => toast.error((e as Error).message),
                                        })
                                      }
                                    >
                                      <CheckCircle2 /> Unsuspend
                                    </DropdownItem>
                                  ) : (
                                    <DropdownItem
                                      destructive
                                      onSelect={() =>
                                        suspendMut.mutate(s.id, {
                                          onSuccess: () => toast.warning(`Suspended ${s.name}`),
                                          onError: (e) => toast.error((e as Error).message),
                                        })
                                      }
                                    >
                                      <Ban /> Suspend
                                    </DropdownItem>
                                  )}
                                  <DropdownItem
                                    destructive
                                    onSelect={() => {
                                      if (!confirm(`Permanently delete ${s.name}?`)) return;
                                      deleteMut.mutate(s.id, {
                                        onSuccess: () => toast.success(`Deleted ${s.name}`),
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
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <Search className="size-6 text-ink-disabled" />
                      <p className="text-sm text-ink-muted">No servers match your search.</p>
                    </div>
                  )}
                </div>
                {pageCount > 1 && (
                  <div className="border-t border-hairline p-4">
                    <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
                  </div>
                )}
              </>
            );
          }}
        </DataState>
      </Card>

      <ServerEditDialog
        server={editing}
        tab={tab}
        onTabChange={setTab}
        onClose={() => setEditing(null)}
        onSubmitDetails={(body) => {
          if (!editing) return;
          detailsMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Details updated");
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        onSubmitBuild={(body) => {
          if (!editing) return;
          buildMut.mutate(
            { id: editing.id, body },
            {
              onSuccess: () => {
                toast.success("Build updated");
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={detailsMut.isPending || buildMut.isPending}
      />
      <OwnerDetailDialog
        open={!!ownerDetailId}
        onClose={() => setOwnerDetailId(null)}
        data={(ownerDetailQ.data as AdminOwnerDetailResponse | undefined) ?? null}
        loading={ownerDetailQ.isLoading}
      />
    </>
  );
}

function OwnerDetailDialog({
  open,
  onClose,
  data,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  data: AdminOwnerDetailResponse | null;
  loading: boolean;
}) {
  const panelName =
    `${data?.user.first_name ?? ""} ${data?.user.last_name ?? ""}`.trim() ||
    data?.user.username ||
    "User profile";
  const appName = data?.linkedAppUser?.name ?? panelName;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Owner details</DialogTitle>
          <DialogDescription>
            View the site account and linked Pterodactyl profile in one place.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-2xl border border-hairline bg-elevated" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-2xl border border-hairline bg-elevated" />
              <div className="h-44 animate-pulse rounded-2xl border border-hairline bg-elevated" />
            </div>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-hairline bg-bg/60 p-5">
              <div className="flex items-start gap-4">
                <Avatar name={appName} src={data.linkedAppUser?.avatarUrl ?? undefined} className="size-16" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-ink">{appName}</p>
                    <Badge variant="outline">{data.summary.flag ?? "🌐"} {data.summary.country ?? "Unknown"}</Badge>
                    <Badge variant={data.linkedAppUser?.status === "ACTIVE" ? "online" : "outline"}>
                      {data.linkedAppUser?.status?.toLowerCase() ?? "unlinked"}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-[12px] text-ink-muted">
                    {data.linkedAppUser?.email ?? data.user.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-secondary">
                    <span className="rounded-full border border-hairline px-3 py-1">Servers {data.summary.serverCount}</span>
                    <span className="rounded-full border border-hairline px-3 py-1">Credits {data.linkedAppUser?.creditBalance ?? 0}</span>
                    <span className="rounded-full border border-hairline px-3 py-1">Last IP {data.summary.lastIp ?? "Unknown"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-hairline bg-bg/45 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                  <UserRound className="size-4 text-accent-soft" />
                  Site account
                </div>
                <div className="space-y-2 text-sm text-ink-secondary">
                  <InfoRow label="Name" value={data.linkedAppUser?.name ?? "Not linked"} />
                  <InfoRow label="Email" value={data.linkedAppUser?.email ?? "Not linked"} />
                  <InfoRow label="Role" value={data.linkedAppUser?.role ?? "Not linked"} />
                  <InfoRow label="Status" value={data.linkedAppUser?.status ?? "Not linked"} />
                  <InfoRow label="App user ID" value={data.linkedAppUser?.id ?? "Not linked"} mono />
                </div>
              </div>

              <div className="rounded-[22px] border border-hairline bg-bg/45 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                  <ShieldCheck className="size-4 text-accent-soft" />
                  Pterodactyl account
                </div>
                <div className="space-y-2 text-sm text-ink-secondary">
                  <InfoRow label="Panel ID" value={String(data.user.id)} mono />
                  <InfoRow label="Username" value={data.user.username} mono />
                  <InfoRow label="Email" value={data.user.email} />
                  <InfoRow label="Language" value={data.user.language ?? "Unknown"} />
                  <InfoRow label="Root admin" value={data.user.root_admin ? "Yes" : "No"} />
                  <InfoRow label="2FA" value={data.user["2fa"] ? "Enabled" : "Disabled"} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <MiniStat icon={<Mail className="size-4" />} label="Primary email" value={data.user.email} />
              <MiniStat icon={<Globe className="size-4" />} label="Country" value={`${data.summary.flag ?? "🌐"} ${data.summary.country ?? "Unknown"}`} />
              <MiniStat icon={<UserRound className="size-4" />} label="Panel name" value={panelName} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-hairline p-6 text-sm text-ink-muted">
            Could not load user details.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-hairline/70 bg-bg/40 px-3 py-2">
      <span className="text-ink-muted">{label}</span>
      <span className={cn("text-right text-ink", mono && "font-mono text-[12px]")}>{value}</span>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-hairline bg-bg/45 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}

function ServerEditDialog({
  server,
  tab,
  onTabChange,
  onClose,
  onSubmitDetails,
  onSubmitBuild,
  submitting,
}: {
  server: AdminServer | null;
  tab: "details" | "build";
  onTabChange: (t: "details" | "build") => void;
  onClose: () => void;
  onSubmitDetails: (body: Record<string, unknown>) => void;
  onSubmitBuild: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={!!server} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit server {server?.name}</DialogTitle>
        </DialogHeader>

        <div className="mb-3 flex gap-1 border-b border-hairline">
          {(["details", "build"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors",
                tab === t ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "details" && server && (
          <form
            key={`details-${server.id}`}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              onSubmitDetails({
                name: f.get("name"),
                description: f.get("description"),
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={server.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={server.description ?? ""} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Saving…" : "Save details"}
              </Button>
            </div>
          </form>
        )}

        {tab === "build" && server && (
          <form
            key={`build-${server.id}`}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              onSubmitBuild({
                memory: Number(f.get("memory")),
                cpu: Number(f.get("cpu")),
                disk: Number(f.get("disk")),
                feature_limits: {
                  databases: Number(f.get("databases")),
                  allocations: Number(f.get("allocations")),
                  backups: Number(f.get("backups")),
                },
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <NumField label="RAM (MB)" name="memory" defaultValue={server.limits?.memory ?? 0} />
              <NumField label="CPU (%)" name="cpu" defaultValue={server.limits?.cpu ?? 0} />
              <NumField label="Disk (MB)" name="disk" defaultValue={server.limits?.disk ?? 0} />
              <NumField label="Databases" name="databases" defaultValue={server.feature_limits?.databases ?? 0} />
              <NumField label="Allocations" name="allocations" defaultValue={server.feature_limits?.allocations ?? 0} />
              <NumField label="Backups" name="backups" defaultValue={server.feature_limits?.backups ?? 0} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Saving…" : "Save build"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NumField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} defaultValue={defaultValue} />
    </div>
  );
}
