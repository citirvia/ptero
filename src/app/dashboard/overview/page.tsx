"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Server as ServerIcon,
  Activity,
  CreditCard,
  BellRing,
  ArrowRight,
  Coins,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DataState } from "@/components/ui/data-state";
import { useRedeemPromoCode, useServers, useNotifications } from "@/lib/api/hooks";
import { toUiServer, type PteroClientServer } from "@/lib/api/adapters";
import { useAuth } from "@/lib/api/auth";
import type { Server } from "@/lib/api/types";
import { UsageGraph } from "./_components/usage-graph";
import { OverviewServerCard } from "./_components/server-card";
import { ActivityFeed } from "./_components/activity-feed";
import { AlertsPanel } from "./_components/alerts-panel";
import { NewServerButton } from "./_components/new-server-button";
import { Onboarding } from "./_components/onboarding";

export default function OverviewPage() {
  const serversQ = useServers();
  const notifQ = useNotifications();
  const { user, refreshUser } = useAuth();
  const redeemPromo = useRedeemPromoCode();
  const [redeemCode, setRedeemCode] = useState("");

  const rawServers = (serversQ.data as PteroClientServer[] | undefined) ?? [];
  const servers: Server[] = rawServers.map((s) => toUiServer(s));
  const total = servers.length;
  const online = servers.filter((s) => s.status === "online").length;

  // Monthly spend is a billing concern — not exposed by current backend yet.
  const monthlySpend = 0;
  const openAlerts = (notifQ.data as { unread?: number } | undefined)?.unread ?? 0;

  const firstName = (user?.name ?? "there").split(" ")[0];

  async function handleRedeemCode() {
    const couponCode = redeemCode.trim().toUpperCase();
    if (!couponCode) return;
    try {
      const result = await redeemPromo.mutateAsync({ couponCode });
      await refreshUser();
      setRedeemCode("");
      toast.success(`${result.amount} coins added`, {
        description: `${result.code} redeemed successfully.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Promo code could not be redeemed.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${firstName}. Here's how your fleet is doing.`}
      >
        <NewServerButton />
      </PageHeader>

      <Onboarding />

      {/* Stat cards */}
      <DataState
        query={serversQ}
        loading={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="card-base h-[116px] animate-pulse p-5"
                aria-hidden
              />
            ))}
          </div>
        }
        error={(e, retry) => (
          <ErrorState description={e.message} onRetry={retry} />
        )}
        isEmpty={() => false}
      >
        {() => (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total servers"
              value={total}
              sub="Across all regions"
              icon={ServerIcon}
            />
            <StatCard
              label="Online now"
              value={`${online}/${total}`}
              sub={`${total - online} not running`}
              icon={Activity}
              accent
            />
            <StatCard
              label="Monthly spend"
              value={`${monthlySpend} coins`}
              sub="Current billing period"
              icon={CreditCard}
            />
            <StatCard
              label="Open alerts"
              value={openAlerts}
              sub={openAlerts === 0 ? "All clear" : "Needs attention"}
              icon={BellRing}
            />
          </div>
        )}
      </DataState>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UsageGraph />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Active servers
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/servers">
                  View all
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <DataState
              query={serversQ}
              loading={
                <CardSkeleton
                  count={6}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                />
              }
              empty={
                <EmptyState
                  icon={<ServerIcon />}
                  title="No servers yet"
                  description="Spin up your first server to start shipping."
                  action={
                    <Button asChild size="sm">
                      <Link href="/dashboard/servers/new">Deploy a server</Link>
                    </Button>
                  }
                />
              }
              error={(e, retry) => (
                <ErrorState description={e.message} onRetry={retry} />
              )}
            >
              {() => (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {servers.map((server) => (
                    <OverviewServerCard key={server.id} server={server} />
                  ))}
                </div>
              )}
            </DataState>
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coins & redeem</CardTitle>
            </CardHeader>
            <div className="space-y-4 px-5 pb-5 sm:px-6">
              <div className="rounded-xl border border-hairline bg-bg/40 px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-muted">
                  <Coins className="size-3.5" /> Current balance
                </div>
                <div className="mt-1 text-lg font-semibold text-ink">
                  {user?.creditBalance ?? 0} coins
                </div>
              </div>
              <div className="rounded-xl border border-hairline bg-card p-4">
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-elevated/40">
                    <TicketPercent className="size-4 text-accent-soft" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">Redeem a coin code</p>
                    <p className="text-xs text-ink-muted">
                      Use balance promo codes here. Deploy discount codes still work in the new server wizard.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="FREE500"
                    className="font-mono uppercase"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRedeemCode}
                    disabled={!redeemCode.trim() || redeemPromo.isPending}
                  >
                    {redeemPromo.isPending ? "Redeeming..." : "Redeem code"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          <AlertsPanel />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
