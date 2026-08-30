import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Check, Minus, ArrowRight, Zap, ShieldCheck, Gauge, Wallet } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare — Ptero vs VPS vs PaaS",
  description:
    "How Ptero compares to a generic VPS and other Platform-as-a-Service hosts on hardware, deploys, scaling and price.",
};

type Cell = boolean | string;

interface Row {
  feature: string;
  ptero: Cell;
  vps: Cell;
  paas: Cell;
}

interface Group {
  group: string;
  rows: Row[];
}

const COLUMNS = ["Ptero", "Generic VPS", "Other PaaS"] as const;

const GROUPS: Group[] = [
  {
    group: "Hardware",
    rows: [
      { feature: "Dedicated Ryzen cores", ptero: true, vps: false, paas: false },
      { feature: "DDR5 + NVMe RAID", ptero: true, vps: "Varies", paas: false },
      { feature: "No oversubscription", ptero: true, vps: false, paas: false },
      { feature: "Always-on DDoS protection", ptero: true, vps: "Add-on", paas: true },
    ],
  },
  {
    group: "Deploys",
    rows: [
      { feature: "Git push to deploy", ptero: true, vps: false, paas: true },
      { feature: "Zero-downtime swaps", ptero: true, vps: false, paas: true },
      { feature: "Instant rollback", ptero: true, vps: false, paas: "Limited" },
      { feature: "Build cache", ptero: true, vps: false, paas: true },
      { feature: "Preview environments", ptero: true, vps: false, paas: "Add-on" },
    ],
  },
  {
    group: "Operations",
    rows: [
      { feature: "Realtime metrics & logs", ptero: true, vps: "DIY", paas: true },
      { feature: "Web console / SSH", ptero: true, vps: true, paas: "Limited" },
      { feature: "Scheduled backups", ptero: true, vps: "DIY", paas: "Add-on" },
      { feature: "Scoped API keys", ptero: true, vps: false, paas: true },
      { feature: "Audit logs", ptero: true, vps: false, paas: "Enterprise" },
    ],
  },
  {
    group: "Pricing",
    rows: [
      { feature: "Transparent flat pricing", ptero: true, vps: true, paas: false },
      { feature: "No egress surprises", ptero: true, vps: "Varies", paas: false },
      { feature: "Free tier to start", ptero: true, vps: false, paas: true },
    ],
  },
];

const WHY = [
  {
    icon: Zap,
    title: "Bare-metal speed, PaaS ergonomics",
    desc: "Most teams pick between fast hardware and a great deploy flow. Ptero gives you both — dedicated Ryzen cores behind a git-push workflow.",
  },
  {
    icon: Wallet,
    title: "Pricing you can actually predict",
    desc: "Flat plans, no metered egress, no per-seat tax. The bill at the end of the month is the number on the pricing page.",
  },
  {
    icon: Gauge,
    title: "Predictable tail latency",
    desc: "No shared cores means your p99 is a function of your code, not a noisy neighbor you can't see or control.",
  },
  {
    icon: ShieldCheck,
    title: "Production-grade from day one",
    desc: "Backups, audit logs, realtime monitoring and instant rollback ship by default — not as enterprise add-ons.",
  },
];

function CellValue({ value, highlight }: { value: Cell; highlight?: boolean }) {
  if (value === true) {
    return (
      <span
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full",
          highlight ? "bg-accent/15 text-accent-soft" : "bg-online/10 text-online",
        )}
      >
        <Check className="size-4" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-overlay text-ink-disabled">
        <Minus className="size-4" />
      </span>
    );
  }
  return (
    <span className="font-mono text-xs text-ink-muted">{value}</span>
  );
}

export default function ComparePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-32 left-1/2 size-[560px] -translate-x-1/2" />
        <Container className="relative py-16 sm:py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
              <span className="size-1.5 rounded-full bg-accent-soft" />
              Compare
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Ptero vs <span className="accent-text">the alternatives</span>
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
              A generic VPS gives you raw hardware and a blank terminal. Other
              PaaS hosts give you a deploy flow on oversold shared hosts. Here&apos;s
              how Ptero stacks up against both.
            </p>
          </div>
        </Container>
      </section>

      {/* Table */}
      <Section className="py-14 sm:py-16">
        <Container>
          <div className="overflow-hidden rounded-2xl border border-hairline shadow-panel">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface">
                    <th className="border-b border-hairline px-5 py-4 text-left font-medium text-ink-muted">
                      <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
                        Feature
                      </span>
                    </th>
                    {COLUMNS.map((col) => {
                      const isPtero = col === "Ptero";
                      return (
                        <th
                          key={col}
                          className={cn(
                            "border-b border-hairline px-5 py-4 text-center",
                            isPtero && "bg-accent/[0.06]",
                          )}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={cn(
                                "font-semibold",
                                isPtero ? "accent-text" : "text-ink",
                              )}
                            >
                              {col}
                            </span>
                            {isPtero && <Badge variant="accent">You are here</Badge>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map((g) => (
                    <Fragment key={g.group}>
                      <tr>
                        <td
                          colSpan={4}
                          className="border-b border-hairline bg-elevated px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted"
                        >
                          {g.group}
                        </td>
                      </tr>
                      {g.rows.map((row) => (
                        <tr
                          key={row.feature}
                          className="border-b border-hairline transition-colors hover:bg-surface"
                        >
                          <td className="px-5 py-3.5 text-ink-secondary">{row.feature}</td>
                          <td className="bg-accent/[0.04] px-5 py-3.5 text-center">
                            <CellValue value={row.ptero} highlight />
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <CellValue value={row.vps} />
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <CellValue value={row.paas} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-ink-muted">
            Comparison reflects typical offerings. Capabilities marked “Add-on”,
            “DIY” or “Enterprise” require extra setup or cost elsewhere.
          </p>
        </Container>
      </Section>

      {/* Why teams switch */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Why teams switch"
            title="The best of both worlds"
            description="Teams move to Ptero when they outgrow a raw VPS but won't trade away the hardware they're paying for."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={(i % 2) * 0.08}>
                <div className="card-base flex h-full gap-4 p-6">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
                    <w.icon className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold text-ink">{w.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-muted">{w.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card px-8 py-16 text-center sm:px-16">
            <GlowOrb className="-bottom-32 left-1/2 size-[500px] -translate-x-1/2" />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                See the difference on your own workload
              </h2>
              <p className="max-w-md text-ink-muted">
                Deploy free in 60 seconds — no credit card, no migration commitment.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/overview">
                    Start free <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
