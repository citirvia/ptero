"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
  MemoryStick,
  Cpu,
  HardDrive,
  DatabaseBackup,
  Database,
  Network,
  Sparkles,
  Server,
} from "lucide-react";
import { Container, Section, SectionHeading, Eyebrow } from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { cn } from "@/lib/utils";
import { usePublicPlans } from "@/lib/api/hooks";

/* ── Plan row from the public API (Prisma Plan shape) ── */
interface PlanRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  ramMb: number;
  cpuPct: number;
  diskMb: number;
  dbCount: number;
  backups: number;
  creditCost: number;
  region: "EU" | "US" | "TR" | "GLOBAL";
  featured: boolean;
  popular: boolean;
  sortIndex: number;
}

/* ── UI plan shape (display-friendly numbers) ── */
interface UiPlan {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  monthlyCredits: number;
  ram: number; // GB
  cpu: number; // vCPU
  storage: number; // GB
  backups: number;
  databases: number;
  networkPriority: "Standard" | "Priority" | "Dedicated";
  popular: boolean;
  region: "EU" | "US" | "TR" | "GLOBAL";
}

function isEnterprise(slug: string) {
  return /enterprise/i.test(slug);
}

function isStarter(slug: string) {
  return /starter|free/i.test(slug);
}

function networkPriorityFor(slug: string): UiPlan["networkPriority"] {
  if (isEnterprise(slug)) return "Dedicated";
  if (/scale|pro\+|business/i.test(slug)) return "Priority";
  return "Standard";
}

function toUiPlan(p: PlanRow): UiPlan {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? "",
    monthlyCredits: p.creditCost,
    ram: Math.round((p.ramMb / 1024) * 10) / 10,
    cpu: Math.max(1, Math.round((p.cpuPct / 100) * 10) / 10),
    storage: Math.round(p.diskMb / 1024),
    backups: p.backups,
    databases: p.dbCount,
    networkPriority: networkPriorityFor(p.slug),
    popular: p.popular,
    region: p.region,
  };
}

/* ── Region list ── */
const REGIONS = [
  { id: "EU", label: "EU", flag: "🇪🇺", note: "Frankfurt · London" },
  { id: "US", label: "US", flag: "🇺🇸", note: "Ashburn · San Jose" },
  { id: "TR", label: "TR", flag: "🇹🇷", note: "Istanbul" },
] as const;

type RegionId = (typeof REGIONS)[number]["id"];

/* ── Per-plan spec rows (icon + label + accessor) ── */
const SPECS: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: (p: UiPlan) => string;
}[] = [
  { icon: MemoryStick, label: "Memory", value: (p) => `${p.ram} GB RAM` },
  { icon: Cpu, label: "Compute", value: (p) => `${p.cpu} vCPU` },
  { icon: HardDrive, label: "Storage", value: (p) => `${p.storage} GB NVMe` },
  { icon: DatabaseBackup, label: "Backups", value: (p) => `${p.backups} snapshots` },
  { icon: Database, label: "Databases", value: (p) => `${p.databases} databases` },
  { icon: Network, label: "Network", value: (p) => `${p.networkPriority} routing` },
];

function creditsFor(plan: UiPlan, billing: "monthly" | "yearly") {
  return billing === "yearly" ? plan.monthlyCredits * 12 : plan.monthlyCredits;
}

function fmtCredits(n: number) {
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

/* ──────────────────────────────────────────────────────────────────────── */

export function PricingInteractive() {
  const [billing, setBilling] = React.useState<"monthly" | "yearly">("monthly");
  const [region, setRegion] = React.useState<RegionId>("EU");

  const plansQuery = usePublicPlans<PlanRow>();

  return (
    <>
      {/* ── Hero + controls ── */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-40 left-1/2 size-[640px] -translate-x-1/2" />
        <Container className="relative flex flex-col items-center gap-10 py-20 text-center sm:py-28">
          <div className="flex flex-col items-center gap-4">
            <Eyebrow>Simple, transparent pricing</Eyebrow>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
              Bare-metal power,{" "}
              <span className="accent-text">priced for builders</span>
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
              Every plan runs on Ryzen hardware with always-on DDoS protection.
              No hidden egress fees. Scale up or down in seconds.
            </p>
          </div>

          {/* Billing toggle */}
          <BillingToggle billing={billing} onChange={setBilling} />

          {/* Region chips */}
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
              Choose a region
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {REGIONS.map((r) => {
                const active = r.id === region;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegion(r.id)}
                    aria-pressed={active}
                    className={cn(
                      "group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-ring",
                      active
                        ? "border-accent bg-accent/15 text-ink"
                        : "border-line bg-card text-ink-secondary hover:border-line-hover hover:text-ink",
                    )}
                  >
                    <span className="text-base leading-none">{r.flag}</span>
                    <span className="font-medium">{r.label}</span>
                    <span className="hidden font-mono text-[11px] text-ink-muted sm:inline">
                      {r.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Plan cards ── */}
      <Section className="pb-12">
        <Container>
          <DataState
            query={plansQuery}
            loading={<CardSkeleton count={4} className="xl:grid-cols-4" />}
            empty={
              <EmptyState
                icon={<Server />}
                title="No plans published yet"
                description="Plans will appear here once they're configured."
              />
            }
            isEmpty={(data: { items?: PlanRow[] }) => !data?.items?.length}
          >
            {(data: { items: PlanRow[] }) => {
              const plans = data.items.map(toUiPlan);
              return (
                <>
                  <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
                    {plans.map((plan, i) => (
                      <Reveal key={plan.id} delay={i * 0.07}>
                        <PlanCard plan={plan} billing={billing} />
                      </Reveal>
                    ))}
                  </div>
                  <p className="mt-8 text-center font-mono text-xs text-ink-muted">
                    Costs shown in {region} ·{" "}
                    {billing === "yearly" ? "charged yearly" : "charged monthly"} · credits
                  </p>
                </>
              );
            }}
          </DataState>
        </Container>
      </Section>

      {/* ── Resource calculator ── */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Estimate"
            title="Build your own plan"
            description="Drag the sliders to size a custom configuration. We'll estimate the monthly credit cost in realtime."
          />
          <Reveal>
            <ResourceCalculator region={region} />
          </Reveal>
        </Container>
      </Section>

      {/* ── Feature comparison table ── */}
      <Section>
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Compare"
            title="Every plan, side by side"
            description="All the details, no surprises. Scroll horizontally on smaller screens."
          />
          <Reveal>
            <DataState
              query={plansQuery}
              loading={<CardSkeleton count={1} className="lg:grid-cols-1" />}
              empty={null}
              isEmpty={(data: { items?: PlanRow[] }) => !data?.items?.length}
            >
              {(data: { items: PlanRow[] }) => (
                <ComparisonTable
                  plans={data.items.map(toUiPlan)}
                  billing={billing}
                />
              )}
            </DataState>
          </Reveal>
        </Container>
      </Section>

      {/* ── FAQ ── */}
      <Section className="border-t border-hairline bg-surface">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Questions, answered
            </h2>
            <p className="max-w-sm text-ink-muted">
              Can&apos;t find what you&apos;re looking for? Our team replies in
              minutes, not days.
            </p>
            <Button asChild variant="secondary" className="mt-2 w-fit">
              <Link href="/dashboard/support">
                Contact support <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <PricingFAQ />
        </Container>
      </Section>

      {/* ── Final CTA ── */}
      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card px-8 py-16 text-center sm:px-16 sm:py-20">
            <GlowOrb className="-bottom-32 left-1/2 size-[500px] -translate-x-1/2" />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Start free, upgrade when you grow
              </h2>
              <p className="max-w-md text-ink-muted">
                Start with credits and upgrade anytime. Resource renewals continue on your selected billing cycle.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/overview">
                    Deploy Now <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/support">Talk to sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function BillingToggle({
  billing,
  onChange,
}: {
  billing: "monthly" | "yearly";
  onChange: (v: "monthly" | "yearly") => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center rounded-full border border-line bg-card p-1">
        {(["monthly", "yearly"] as const).map((opt) => {
          const active = billing === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={cn(
                "relative z-10 rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors focus-ring",
                active ? "text-ink" : "text-ink-muted hover:text-ink-secondary",
              )}
            >
              {active && (
                <span className="absolute inset-0 -z-10 rounded-full accent-gradient shadow-glow" />
              )}
              {opt}
            </button>
          );
        })}
      </div>
      <Badge variant="accent" className="gap-1">
        <Sparkles className="size-3" /> Save 2 months
      </Badge>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function PlanCard({
  plan,
  billing,
}: {
  plan: UiPlan;
  billing: "monthly" | "yearly";
}) {
  const enterprise = isEnterprise(plan.slug);
  const credits = creditsFor(plan, billing);

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col p-7",
        plan.popular
          ? "border-accent/60 ring-1 ring-accent/40 shadow-glow"
          : "",
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="accent" className="gap-1 px-3 py-1 shadow-glow">
            <Sparkles className="size-3" /> Most popular
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
        <p className="text-sm text-ink-muted">{plan.tagline}</p>
      </div>

      <div className="mt-6 flex items-baseline gap-1.5">
        {enterprise ? (
          <span className="font-mono text-4xl font-semibold tracking-tight text-ink">
            Custom
          </span>
        ) : (
          <>
            <span className="font-mono text-4xl font-semibold tracking-tight text-ink">
              {fmtCredits(credits)}
            </span>
            <span className="text-sm text-ink-muted">credits</span>
          </>
        )}
      </div>
      {!enterprise && billing === "yearly" && (
        <p className="mt-1 font-mono text-xs text-online">
          {fmtCredits(plan.monthlyCredits * 12)} credits billed yearly
        </p>
      )}
      {enterprise && (
        <p className="mt-1 text-xs text-ink-muted">Volume & SLA pricing</p>
      )}

      <Button
        asChild
        className="mt-6 w-full"
        variant={plan.popular ? "primary" : "secondary"}
      >
        <Link href={enterprise ? "/dashboard/support" : "/dashboard/overview"}>
          {enterprise ? "Contact sales" : `Choose ${plan.name}`}
          <ArrowRight className="size-4" />
        </Link>
      </Button>

      <div className="my-6 h-px w-full bg-overlay2" />

      <ul className="flex flex-1 flex-col gap-3.5">
        {SPECS.map((spec) => (
          <li key={spec.label} className="flex items-center gap-3 text-sm">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-elevated text-accent-soft">
              <spec.icon className="size-3.5" />
            </span>
            <span className="text-ink-secondary">{spec.value(plan)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function ResourceCalculator({
  region,
}: {
  region: RegionId;
}) {
  const [ram, setRam] = React.useState(2);
  const [cpu, setCpu] = React.useState(2);
  const [storage, setStorage] = React.useState(20);

  const estimate = Math.max(
    1,
    Math.ceil(
      ram * 40
      + cpu * 25
      + (storage / 10) * 8,
    ),
  );

  const rows = [
    {
      label: "Memory",
      icon: MemoryStick,
      value: ram,
      unit: "GB",
      min: 1,
      max: 16,
      step: 1,
      set: setRam,
      sub: "40 credits / GB",
    },
    {
      label: "vCPU",
      icon: Cpu,
      value: cpu,
      unit: "cores",
      min: 1,
      max: 8,
      step: 1,
      set: setCpu,
      sub: "25 credits / core",
    },
    {
      label: "Storage",
      icon: HardDrive,
      value: storage,
      unit: "GB",
      min: 5,
      max: 200,
      step: 5,
      set: setStorage,
      sub: "8 credits / 10 GB",
    },
  ];

  return (
    <Card className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-8">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                <span className="flex size-7 items-center justify-center rounded-lg border border-hairline bg-elevated text-accent-soft">
                  <row.icon className="size-3.5" />
                </span>
                {row.label}
                <span className="font-mono text-xs text-ink-muted">
                  {row.sub}
                </span>
              </span>
              <span className="font-mono text-sm text-ink">
                {row.value} {row.unit}
              </span>
            </div>
            <Slider
              value={[row.value]}
              min={row.min}
              max={row.max}
              step={row.step}
              onValueChange={(v) => row.set(v[0])}
              aria-label={row.label}
            />
            <div className="flex justify-between font-mono text-[10px] text-ink-disabled">
              <span>
                {row.min} {row.unit}
              </span>
              <span>
                {row.max} {row.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-center gap-4 rounded-2xl border border-hairline bg-gradient-to-br from-accent/15 to-accent-deep/5 p-8 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
          Estimated / month
        </span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-mono text-5xl font-semibold tracking-tight text-ink">
            {fmtCredits(estimate)}
          </span>
        </div>
        <p className="font-mono text-xs text-ink-muted">
          {ram} GB · {cpu} vCPU · {storage} GB · {region} · monthly credits
        </p>
        <Button asChild className="mt-2">
          <Link href="/dashboard/overview">
            Deploy this config <ArrowRight className="size-4" />
          </Link>
        </Button>
        <p className="text-[11px] leading-relaxed text-ink-disabled">
          Estimate only. Final credit cost is based on the published plan.
        </p>
      </div>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

const COMPARE_ROWS: {
  label: string;
  render: (p: UiPlan) => React.ReactNode;
}[] = [
  { label: "Memory (RAM)", render: (p) => `${p.ram} GB` },
  { label: "vCPU cores", render: (p) => `${p.cpu}` },
  { label: "NVMe storage", render: (p) => `${p.storage} GB` },
  { label: "Backup snapshots", render: (p) => `${p.backups}` },
  { label: "Databases", render: (p) => `${p.databases}` },
  { label: "Network priority", render: (p) => p.networkPriority },
];

const BOOL_ROWS: { label: string; has: (p: UiPlan) => boolean }[] = [
  { label: "Web console & SFTP", has: () => true },
  { label: "Realtime monitoring", has: () => true },
  { label: "DDoS protection (L3/L4/L7)", has: () => true },
  { label: "Cron scheduler", has: (p) => !isStarter(p.slug) },
  {
    label: "Priority support",
    has: (p) => /scale|enterprise/i.test(p.slug),
  },
  { label: "99.99% uptime SLA", has: (p) => isEnterprise(p.slug) },
  { label: "SSO / SAML", has: (p) => isEnterprise(p.slug) },
  { label: "Dedicated capacity", has: (p) => isEnterprise(p.slug) },
];

function ComparisonTable({
  plans,
  billing,
}: {
  plans: UiPlan[];
  billing: "monthly" | "yearly";
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-hairline no-scrollbar">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-elevated">
            <th className="w-[28%] p-5 text-left align-bottom">
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">
                Feature
              </span>
            </th>
            {plans.map((p) => (
              <th
                key={p.id}
                className={cn(
                  "p-5 text-left align-bottom",
                  p.popular && "bg-accent/10",
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    {p.name}
                    {p.popular && (
                      <Badge variant="accent" className="px-1.5 py-0 text-[10px]">
                        Popular
                      </Badge>
                    )}
                  </span>
                  <span className="font-mono text-xs text-ink-muted">
                    {isEnterprise(p.slug)
                      ? "Custom"
                      : `${fmtCredits(creditsFor(p, billing))} credits`}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SectionRow label="Resources" cols={plans.length + 1} />
          {COMPARE_ROWS.map((row, ri) => (
            <tr
              key={row.label}
              className={cn(
                "border-t border-hairline",
                ri % 2 === 1 && "bg-overlay",
              )}
            >
              <td className="p-4 text-ink-secondary">{row.label}</td>
              {plans.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "p-4 font-mono text-ink",
                    p.popular && "bg-accent/[0.06]",
                  )}
                >
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
          <SectionRow label="Platform" cols={plans.length + 1} />
          {BOOL_ROWS.map((row, ri) => (
            <tr
              key={row.label}
              className={cn(
                "border-t border-hairline",
                ri % 2 === 1 && "bg-overlay",
              )}
            >
              <td className="p-4 text-ink-secondary">{row.label}</td>
              {plans.map((p) => (
                <td
                  key={p.id}
                  className={cn("p-4", p.popular && "bg-accent/[0.06]")}
                >
                  {row.has(p) ? (
                    <Check className="size-4 text-online" aria-label="Included" />
                  ) : (
                    <Minus
                      className="size-4 text-ink-disabled"
                      aria-label="Not included"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr className="border-t border-hairline bg-surface">
      <td
        colSpan={cols}
        className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-soft"
      >
        {label}
      </td>
    </tr>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. Upgrade or downgrade instantly from the dashboard. Billing is prorated to the second, so you only ever pay for what you use. Resource changes apply on the next restart, which takes under a second.",
  },
  {
    q: "What's the difference between monthly and yearly billing?",
    a: "Yearly billing charges 10 months up front for 12 months of service — effectively two free months. You can switch between monthly and yearly at any renewal, and switching to yearly mid-cycle credits your remaining monthly balance.",
  },
  {
    q: "Does the region affect my price?",
    a: "Slightly. Istanbul (TR) capacity is priced ~10% lower thanks to local hardware costs, while EU and US regions share the same baseline. Latency and hardware specs are shown per region on each plan card.",
  },
  {
    q: "Are there any hidden bandwidth or egress fees?",
    a: "No. Every plan includes generous bandwidth on premium-routed 10 Gbps uplinks with no metered egress charges for typical bot and API workloads. We'll reach out before you ever hit a soft cap.",
  },
  {
    q: "What happens if I exceed my plan's resources?",
    a: "Your server keeps running. We notify you in the dashboard and via email when you approach RAM, CPU, or storage limits, and you can scale up in one click. Sustained overages are billed at standard per-resource rates.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 7-day money-back guarantee on first purchases, no questions asked. Enterprise contracts follow the terms in your MSA. Reach out to support and we'll sort it out the same day.",
  },
];

function PricingFAQ() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((item, i) => (
        <AccordionItem key={item.q} value={`faq-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
