"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  Boxes,
  HardDrive,
  Map as MapIcon,
  ArrowRight,
  AlertTriangle,
  Server as ServerIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { StatCard } from "@/components/dashboard/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ErrorState } from "@/components/ui/error-state";
import {
  useAdminStats,
  useAdminNodes,
  useAdminServers,
  useAdminSignupBonusSettings,
  useUpdateAdminSignupBonusSettings,
} from "@/lib/api/hooks";
import { useAuth } from "@/lib/api/auth";
import { formatNumber } from "@/lib/utils";

type RawNode = {
  id: number;
  name: string;
  fqdn: string;
  maintenance_mode?: boolean;
  memory: number;
  allocated_resources?: { memory: number };
};
type RawServer = { id: number; name: string; node: number; suspended?: boolean };

type AdminStats = {
  users?: number;
  servers?: number;
  nodes?: number;
  locations?: number;
  capacity?: number;
  nodesOnline?: number;
};

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const statsQ = useAdminStats();
  const nodesQ = useAdminNodes();
  const serversQ = useAdminServers();
  const signupBonusQ = useAdminSignupBonusSettings();
  const updateSignupBonus = useUpdateAdminSignupBonusSettings();
  const [signupBonusInput, setSignupBonusInput] = useState("0");

  const stats = (statsQ.data ?? undefined) as AdminStats | undefined;
  const nodes: RawNode[] = Array.isArray(nodesQ.data) ? (nodesQ.data as RawNode[]) : [];
  const servers: RawServer[] =
    serversQ.data && Array.isArray((serversQ.data as { servers?: unknown[] }).servers)
      ? ((serversQ.data as { servers: RawServer[] }).servers)
      : [];

  if (statsQ.isError && nodesQ.isError) {
    return (
      <>
        <AdminHeader title="Platform overview" />
        <ErrorState
          description={(statsQ.error as Error)?.message ?? "Failed to load admin overview."}
          onRetry={() => {
            void statsQ.refetch();
            void nodesQ.refetch();
            void serversQ.refetch();
          }}
        />
      </>
    );
  }

  useEffect(() => {
    if (signupBonusQ.data?.signupBonusCredits === undefined) return;
    setSignupBonusInput(String(signupBonusQ.data.signupBonusCredits));
  }, [signupBonusQ.data?.signupBonusCredits]);

  const loading = statsQ.isLoading || nodesQ.isLoading || serversQ.isLoading;
  const canEditSignupBonus = user?.role === "OWNER";
  const parsedSignupBonus = Number(signupBonusInput);
  const signupBonusChanged =
    signupBonusQ.data?.signupBonusCredits !== undefined &&
    parsedSignupBonus === parsedSignupBonus &&
    parsedSignupBonus !== signupBonusQ.data.signupBonusCredits;

  const totalUsers = stats?.users ?? 0;
  const totalServers = stats?.servers ?? servers.length;
  const totalNodes = stats?.nodes ?? nodes.length;
  const totalLocations = stats?.locations ?? 0;
  const nodesOnline =
    stats?.nodesOnline ?? nodes.filter((n) => n?.maintenance_mode === false).length;

  // Fleet snapshot: servers per node.
  const serversPerNode = nodes.map((n) => ({
    node: n.name,
    count: servers.filter((s) => s.node === n.id).length,
  }));
  const maxPerNode = Math.max(1, ...serversPerNode.map((x) => x.count));

  // Incidents derived from maintenance nodes + suspended servers.
  const incidents = [
    ...nodes
      .filter((n) => n?.maintenance_mode === true)
      .map((n) => ({ id: `node-${n.id}`, title: `${n.name} is in maintenance`, kind: "Maintenance" })),
    ...servers
      .filter((s) => s?.suspended === true)
      .map((s) => ({ id: `srv-${s.id}`, title: `${s.name} is suspended`, kind: "Suspended" })),
  ];

  return (
    <>
      <AdminHeader
        title="Platform overview"
        description="Fleet-wide health and capacity across all customers."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={formatNumber(totalUsers)} icon={Users} accent />
        <StatCard label="Servers running" value={formatNumber(totalServers)} sub="across all nodes" icon={Boxes} />
        <StatCard label="Nodes online" value={`${nodesOnline}/${totalNodes}`} icon={HardDrive} />
        <StatCard label="Locations" value={formatNumber(totalLocations)} icon={MapIcon} accent />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Signup bonus credits</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
            <p className="text-sm text-ink-muted">
              Applied once to newly registered accounts, including first-time Discord sign-ups.
            </p>
            <div className="rounded-xl border border-hairline bg-bg/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-ink-muted">Current bonus</div>
              <div className="mt-1 text-lg font-semibold text-ink">
                {signupBonusQ.data?.signupBonusCredits ?? 0} coins
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Input
                type="number"
                min={0}
                max={100000}
                step={1}
                value={signupBonusInput}
                onChange={(e) => setSignupBonusInput(e.target.value)}
                disabled={signupBonusQ.isLoading || updateSignupBonus.isPending || !canEditSignupBonus}
                aria-label="Signup bonus credits"
              />
              <p className="text-xs text-ink-muted">
                Set `0` to disable the bonus. Only owners can update this setting.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!signupBonusChanged || updateSignupBonus.isPending}
                onClick={() =>
                  setSignupBonusInput(String(signupBonusQ.data?.signupBonusCredits ?? 0))
                }
              >
                Reset
              </Button>
              <Button
                size="sm"
                disabled={
                  !canEditSignupBonus
                  || !Number.isInteger(parsedSignupBonus)
                  || parsedSignupBonus < 0
                  || parsedSignupBonus > 100000
                  || !signupBonusChanged
                  || updateSignupBonus.isPending
                }
                onClick={() =>
                  updateSignupBonus.mutate(parsedSignupBonus, {
                    onSuccess: (data) => {
                      setSignupBonusInput(String(data.signupBonusCredits));
                      toast.success(`Signup bonus updated to ${data.signupBonusCredits} coins.`);
                    },
                    onError: (error) => toast.error((error as Error).message),
                  })
                }
              >
                {updateSignupBonus.isPending ? "Saving..." : "Save bonus"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Fleet snapshot */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fleet snapshot · servers per node</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 px-5 pb-6 sm:px-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-ink-muted">Loading…</p>
            ) : serversPerNode.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                No nodes configured yet.
              </p>
            ) : (
              serversPerNode.map((x) => (
                <div key={x.node} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate font-mono text-xs text-ink-secondary">
                    {x.node}
                  </span>
                  <Progress value={(x.count / maxPerNode) * 100} className="flex-1" />
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted">
                    {x.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Incidents */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Open incidents</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 px-5 pb-5 sm:px-6">
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="size-6 text-online" />
                <p className="text-sm text-ink-muted">No open incidents.</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="rounded-xl border border-hairline bg-bg/40 p-3.5">
                  <div className="mb-1 flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-warn" />
                    <Badge variant="warn">{inc.kind}</Badge>
                  </div>
                  <p className="text-sm font-medium text-ink">{inc.title}</p>
                </div>
              ))
            )}
            <Link
              href="/dashboard/admin/content/incidents"
              className="mt-auto flex items-center gap-1.5 text-sm text-accent-soft hover:underline"
            >
              Manage incidents <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Node health */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Node health</CardTitle>
            <Link href="/dashboard/admin/nodes" className="text-xs text-accent-soft hover:underline">
              All nodes
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-3 px-5 pb-5 sm:px-6">
            {nodes.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">No nodes yet.</p>
            ) : (
              nodes.slice(0, 6).map((n) => {
                const load = n.memory ? Math.round(((n.allocated_resources?.memory ?? 0) / n.memory) * 100) : 0;
                return (
                  <div key={n.id} className="flex items-center gap-3">
                    <span className={`size-1.5 shrink-0 rounded-full ${n.maintenance_mode ? "bg-warn" : "bg-online"}`} />
                    <span className="w-32 shrink-0 truncate font-mono text-xs text-ink-secondary">{n.name}</span>
                    <Progress value={load} className="flex-1" />
                    <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted">{load}%</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Servers list */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent servers</CardTitle>
            <Link href="/dashboard/admin/servers" className="text-xs text-accent-soft hover:underline">
              All servers
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-1 px-3 pb-4">
            {servers.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">No servers yet.</p>
            ) : (
              servers.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-overlay">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-hairline bg-elevated text-accent-soft">
                    <ServerIcon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  </div>
                  <Badge variant={s.suspended ? "warn" : "online"}>
                    {s.suspended ? "Suspended" : "Active"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
