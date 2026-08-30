"use client";

import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MiniArea } from "@/components/charts/area";
import { timeSeries } from "@/lib/marketing-charts";
import { formatCurrency } from "@/lib/utils";

const PAYOUT_SERIES = timeSeries(7, 12, 180, 540);

const REFERRALS = [
  { handle: "@buildwithjara", plan: "Scale", mrr: 28, status: "active", joined: "May 02" },
  { handle: "@kenan_dev", plan: "Pro", mrr: 12, status: "active", joined: "Apr 27" },
  { handle: "@priyacodes", plan: "Pro", mrr: 12, status: "active", joined: "Apr 19" },
  { handle: "@tom.w", plan: "Starter", mrr: 4, status: "trial", joined: "May 21" },
  { handle: "@nightlybot", plan: "Scale", mrr: 28, status: "active", joined: "Mar 30" },
];

export function AffiliateDashboardPreview() {
  const totalMrr = REFERRALS.filter((r) => r.status === "active").reduce(
    (sum, r) => sum + r.mrr,
    0,
  );
  const monthlyShare = totalMrr * 0.25;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Earnings card */}
      <div className="card-base flex flex-col gap-5 p-6 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
            Available balance
          </span>
          <Badge variant="online">
            <TrendingUp className="size-3" /> +18%
          </Badge>
        </div>
        <p className="font-mono text-4xl font-semibold tracking-tight text-ink">
          {formatCurrency(1284.5)}
        </p>
        <div className="grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-sm">
          <div>
            <p className="text-ink-muted">Recurring / mo</p>
            <p className="mt-0.5 font-mono text-ink">
              {formatCurrency(monthlyShare)}
            </p>
          </div>
          <div>
            <p className="text-ink-muted">Lifetime</p>
            <p className="mt-0.5 font-mono text-ink">{formatCurrency(7920)}</p>
          </div>
          <div>
            <p className="text-ink-muted">Referrals</p>
            <p className="mt-0.5 font-mono text-ink">{REFERRALS.length}</p>
          </div>
          <div>
            <p className="text-ink-muted">Conversion</p>
            <p className="mt-0.5 font-mono text-ink">34%</p>
          </div>
        </div>
      </div>

      {/* Payout chart */}
      <div className="card-base flex flex-col gap-3 p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Payouts</p>
            <p className="text-xs text-ink-muted">Last 12 months</p>
          </div>
          <span className="font-mono text-sm text-accent-soft">
            {formatCurrency(4860)} paid
          </span>
        </div>
        <div className="-mx-1">
          <MiniArea data={PAYOUT_SERIES} height={160} color="#2f6b85" />
        </div>
      </div>

      {/* Referrals table */}
      <div className="card-base overflow-hidden lg:col-span-3">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <p className="text-sm font-medium text-ink">Recent referrals</p>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
            View all <ArrowUpRight className="size-3" />
          </span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-hairline bg-surface">
              <tr className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                <th className="px-5 py-2.5 font-medium">Referral</th>
                <th className="px-5 py-2.5 font-medium">Plan</th>
                <th className="px-5 py-2.5 font-medium">Their MRR</th>
                <th className="px-5 py-2.5 font-medium">Your share</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {REFERRALS.map((r) => (
                <tr key={r.handle} className="transition-colors hover:bg-elevated">
                  <td className="px-5 py-3 font-mono text-[13px] text-ink">
                    {r.handle}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{r.plan}</td>
                  <td className="px-5 py-3 font-mono text-ink-secondary">
                    {formatCurrency(r.mrr)}
                  </td>
                  <td className="px-5 py-3 font-mono text-accent-soft">
                    {formatCurrency(r.mrr * 0.25)}
                  </td>
                  <td className="px-5 py-3">
                    {r.status === "active" ? (
                      <Badge variant="online">Active</Badge>
                    ) : (
                      <Badge variant="warn">Trial</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-muted">
                    {r.joined}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
