"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  UserX,
  LogIn,
  Mail,
  Ban,
  CheckCircle2,
  Plus,
  Pencil,
  ShieldCheck,
  Users as UsersIcon,
  Coins,
  ChevronRight,
  Globe,
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
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { DataState } from "@/components/ui/data-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useAdminUserDetail,
  useAdminImpersonateUser,
  useAdminUpdateUserStatus,
  useAdminAdjustCredits,
} from "@/lib/api/hooks";
import { toUiPlatformUser, type PteroAppUser } from "@/lib/api/adapters";
import { formatDate } from "@/lib/utils";

type UiUser = ReturnType<typeof toUiPlatformUser> & { pteroId: number };

type AdminUserDetailResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    language?: string;
    root_admin?: boolean;
    "2fa"?: boolean;
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
    flag?: string;
    lastIp?: string | null;
  };
};

const STATUS_VARIANT: Record<string, "online" | "danger" | "warn"> = {
  active: "online",
  suspended: "danger",
  pending: "warn",
};

const ROLE_VARIANT = {
  admin: "accent",
  user: "outline",
} as const;

function formatRoleLabel(role?: string | null, rootAdmin?: boolean) {
  if (rootAdmin) return "Admin";
  switch ((role ?? "").toUpperCase()) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "DEVELOPER":
      return "Developer";
    case "BILLING":
      return "Billing";
    case "VIEWER":
      return "User";
    default:
      return "User";
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{
    raw: PteroAppUser;
    ui: UiUser;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailTarget, setDetailTarget] = useState<{ raw: PteroAppUser; ui: UiUser } | null>(null);

  const usersQ = useAdminUsers(page);
  const userDetailQ = useAdminUserDetail(detailTarget?.raw.id);
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const deleteMut = useDeleteUser();
  const impersonateMut = useAdminImpersonateUser();
  const statusMut = useAdminUpdateUserStatus();
  const creditsMut = useAdminAdjustCredits();
  const [creditTarget, setCreditTarget] = useState<{
    raw: PteroAppUser;
    ui: UiUser;
  } | null>(null);

  const meta = (usersQ.data as { meta?: { totalPages?: number } } | undefined)?.meta;
  const pageCount = meta?.totalPages ?? 1;

  return (
    <>
      <AdminHeader
        title="User management"
        description="Search, filter, and manage every customer account on the platform."
      >
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> New user
        </Button>
      </AdminHeader>

      <Card className="overflow-hidden">
        <div className="border-b border-hairline p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>
        </div>

        <DataState
          query={usersQ}
          loading={<TableSkeleton rows={6} columns={6} />}
          isEmpty={(d) => {
            const raw = (d as { users?: unknown[] }).users ?? [];
            return raw.length === 0;
          }}
          empty={
            <EmptyState
              icon={<UsersIcon />}
              title="No users yet"
              description="Create your first platform account to get started."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New user
                </Button>
              }
            />
          }
        >
          {(data) => {
            const raw = ((data as { users?: PteroAppUser[] }).users ?? []) as PteroAppUser[];
            const filtered = raw.filter((u) => {
              const q = query.toLowerCase();
              if (!q) return true;
              return (
                u.email.toLowerCase().includes(q) ||
                u.username?.toLowerCase().includes(q) ||
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
              );
            });
            const ui: { raw: PteroAppUser; ui: UiUser }[] = filtered.map((u) => ({
              raw: u,
              ui: { ...toUiPlatformUser(u), pteroId: u.id },
            }));

            return (
              <>
                <div className="grid grid-cols-2 gap-4 border-b border-hairline p-4 lg:grid-cols-4">
                  <StatCard label="Total accounts" value={raw.length} icon={CheckCircle2} accent />
                  <StatCard label="Admins" value={raw.filter((u) => u.root_admin).length} />
                  <StatCard label="Page" value={`${page}/${pageCount}`} />
                  <StatCard label="Total credits" value={raw.reduce((sum, user) => sum + (user.credit_balance ?? 0), 0)} icon={Coins} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                        <th className="px-5 py-3 font-medium">User</th>
                        <th className="px-5 py-3 font-medium">Role</th>
                        <th className="px-5 py-3 font-medium">Credits</th>
                        <th className="px-5 py-3 font-medium">Servers</th>
                        <th className="px-5 py-3 font-medium">Country</th>
                        <th className="px-5 py-3 font-medium">Joined</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {ui.map(({ raw: r, ui: u }) => (
                        <tr key={u.id} className="border-b border-hairline last:border-0 hover:bg-overlay">
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => setDetailTarget({ raw: r, ui: u })}
                              className="group flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-overlay2"
                            >
                              <Avatar name={u.name} src={u.avatarUrl} className="size-9" />
                              <div>
                                <p className="font-medium text-ink">{u.name}</p>
                                <p className="font-mono text-[11px] text-ink-muted">{u.email}</p>
                              </div>
                              <ChevronRight className="ml-auto size-4 text-ink-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-ink-muted" />
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={r.root_admin ? ROLE_VARIANT.admin : ROLE_VARIANT.user}>
                              {formatRoleLabel(undefined, r.root_admin)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="accent">{r.credit_balance ?? 0}</Badge>
                          </td>
                          <td className="px-5 py-3 font-mono text-ink-secondary">{u.servers}</td>
                          <td className="px-5 py-3 text-ink-secondary">
                            {u.flag} {u.country}
                          </td>
                          <td className="px-5 py-3 font-mono text-[12px] text-ink-muted">
                            {u.joined ? formatDate(u.joined) : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
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
                                <DropdownLabel>{u.name}</DropdownLabel>
                                <DropdownSeparator />
                                <DropdownItem onSelect={() => setEditing({ raw: r, ui: u })}>
                                  <Pencil /> Edit
                                </DropdownItem>
                                <DropdownItem
                                  onSelect={() =>
                                    updateMut.mutate(
                                      {
                                        id: r.id,
                                        body: { root_admin: !r.root_admin },
                                      },
                                      {
                                        onSuccess: () =>
                                          toast.success(
                                            r.root_admin
                                              ? `${u.name} is now a standard user`
                                              : `${u.name} is now an admin`,
                                          ),
                                        onError: (e) => toast.error((e as Error).message),
                                      },
                                    )
                                  }
                                >
                                  <ShieldCheck />
                                  {r.root_admin ? "Remove admin" : "Make admin"}
                                </DropdownItem>
                                <DropdownItem onSelect={() => setCreditTarget({ raw: r, ui: u })}>
                                  <Coins /> Adjust credits
                                </DropdownItem>
                                <DropdownItem
                                  onSelect={() =>
                                    impersonateMut.mutate(r.id, {
                                      onSuccess: () => {
                                        toast.success(`Signed in as ${u.name}`);
                                        router.push("/dashboard");
                                        router.refresh();
                                      },
                                      onError: (e) => toast.error((e as Error).message),
                                    })
                                  }
                                >
                                  <LogIn /> Impersonate
                                </DropdownItem>
                                <DropdownItem
                                  onSelect={() => {
                                    window.location.href = `mailto:${u.email}`;
                                  }}
                                >
                                  <Mail /> Send email
                                </DropdownItem>
                                <DropdownSeparator />
                                <DropdownItem
                                  destructive={u.status !== "suspended"}
                                  onSelect={() =>
                                    statusMut.mutate(
                                      {
                                        id: r.id,
                                        status: u.status === "suspended" ? "ACTIVE" : "SUSPENDED",
                                      },
                                      {
                                        onSuccess: () =>
                                          toast.success(
                                            u.status === "suspended"
                                              ? `${u.name} reactivated`
                                              : `${u.name} suspended`,
                                          ),
                                        onError: (e) => toast.error((e as Error).message),
                                      },
                                    )
                                  }
                                >
                                  {u.status === "suspended" ? <ShieldCheck /> : <Ban />}
                                  {u.status === "suspended" ? "Reactivate" : "Suspend"}
                                </DropdownItem>
                                <DropdownItem
                                  destructive
                                  onSelect={() => {
                                    if (!confirm(`Delete ${u.name}?`)) return;
                                    deleteMut.mutate(r.id, {
                                      onSuccess: () => toast.success(`Deleted ${u.name}`),
                                      onError: (e) => toast.error((e as Error).message),
                                    });
                                  }}
                                >
                                  <UserX /> Delete account
                                </DropdownItem>
                              </DropdownContent>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <Search className="size-6 text-ink-disabled" />
                      <p className="text-sm text-ink-muted">No users match your search.</p>
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

      <UserDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(body) =>
          createMut.mutate(body, {
            onSuccess: () => {
              toast.success("User created");
              setCreating(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
        submitting={createMut.isPending}
      />

      <UserDialog
        open={!!editing}
        initial={editing?.raw}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (!editing) return;
          updateMut.mutate(
            { id: editing.raw.id, body },
            {
              onSuccess: () => {
                toast.success("User updated");
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={updateMut.isPending}
      />

      <CreditsDialog
        open={!!creditTarget}
        target={creditTarget?.ui}
        currentBalance={creditTarget?.raw.credit_balance ?? 0}
        onClose={() => setCreditTarget(null)}
        onSubmit={(body) => {
          if (!creditTarget) return;
          creditsMut.mutate(
            {
              id: creditTarget.raw.id,
              amount: body.amount,
              description: body.description,
            },
            {
              onSuccess: () => {
                toast.success("Credits updated");
                setCreditTarget(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
        submitting={creditsMut.isPending}
      />

      <UserProfileDialog
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        data={(userDetailQ.data as AdminUserDetailResponse | undefined) ?? null}
        fallback={detailTarget?.ui ?? null}
        loading={userDetailQ.isLoading}
      />
    </>
  );
}

function UserDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: PteroAppUser;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the Pterodactyl panel account." : "Provision a new Pterodactyl panel account."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const body: Record<string, unknown> = {
              email: f.get("email"),
              username: f.get("username"),
              first_name: f.get("first_name"),
              last_name: f.get("last_name"),
              root_admin: f.get("root_admin") === "on",
            };
            const password = f.get("password");
            if (password) body.password = password;
            onSubmit(body);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" name="email" type="email" required defaultValue={initial?.email} />
            <Field label="Username" name="username" required defaultValue={initial?.username} />
            <Field label="First name" name="first_name" defaultValue={initial?.first_name} />
            <Field label="Last name" name="last_name" defaultValue={initial?.last_name} />
          </div>
          <Field
            label={editing ? "New password (leave blank to keep)" : "Password"}
            name="password"
            type="password"
            required={!editing}
          />
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              name="root_admin"
              defaultChecked={initial?.root_admin ?? false}
              className="size-4 rounded border-line bg-bg"
            />
            Root admin
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create user"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreditsDialog({
  open,
  target,
  currentBalance,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  target?: UiUser | null;
  currentBalance: number;
  onClose: () => void;
  onSubmit: (body: { amount: number; description?: string }) => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust credits</DialogTitle>
          <DialogDescription>
            {target ? `Add or remove credits for ${target.name}.` : "Update user credits."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            onSubmit({
              amount: Number(form.get("amount") ?? 0),
              description: String(form.get("description") ?? ""),
            });
          }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-line bg-card p-3">
            <div className="text-xs text-ink-muted">Current balance</div>
            <div className="mt-1 text-lg font-semibold text-ink">
              {currentBalance} credits
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" placeholder="100 or -50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Manual bonus" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              <Coins className="size-4" /> Save credits
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserProfileDialog({
  open,
  onClose,
  data,
  fallback,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  data: AdminUserDetailResponse | null;
  fallback: UiUser | null;
  loading: boolean;
}) {
  const panelName =
    `${data?.user.first_name ?? ""} ${data?.user.last_name ?? ""}`.trim() ||
    data?.user.username ||
    fallback?.name ||
    "User profile";
  const appName = data?.linkedAppUser?.name ?? fallback?.name ?? panelName;
  const appEmail = data?.linkedAppUser?.email ?? fallback?.email ?? data?.user.email ?? "Unknown";
  const siteRole = formatRoleLabel(data?.linkedAppUser?.role, data?.user.root_admin);

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>
            View the site account, profile photo, and linked Pterodactyl details together.
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
                <Avatar name={appName} src={data.linkedAppUser?.avatarUrl ?? fallback?.avatarUrl} className="size-16" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 break-words text-lg font-semibold text-ink">{appName}</p>
                    <Badge variant="outline">{data.summary.flag ?? "🌐"} {data.summary.country ?? "Unknown"}</Badge>
                    <Badge variant={data.linkedAppUser?.status === "ACTIVE" ? "online" : "outline"}>
                      {data.linkedAppUser?.status?.toLowerCase() ?? "unlinked"}
                    </Badge>
                  </div>
                  <p className="mt-1 break-all font-mono text-[12px] text-ink-muted">{appEmail}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-secondary">
                    <span className="rounded-full border border-hairline px-3 py-1">Servers {data.summary.serverCount}</span>
                    <span className="rounded-full border border-hairline px-3 py-1">Credits {data.linkedAppUser?.creditBalance ?? 0}</span>
                    <span className="max-w-full break-all rounded-full border border-hairline px-3 py-1">Last IP {data.summary.lastIp ?? "Unknown"}</span>
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
                  <InfoRow label="Role" value={siteRole} />
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
              <MiniStat icon={<Mail className="size-4" />} label="Primary email" value={appEmail} />
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
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span
        className={
          mono
            ? "min-w-0 max-w-[65%] break-all text-right font-mono text-[12px] text-ink"
            : "min-w-0 max-w-[65%] break-words text-right text-ink"
        }
      >
        {value}
      </span>
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
      <p className="break-words text-sm text-ink">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
