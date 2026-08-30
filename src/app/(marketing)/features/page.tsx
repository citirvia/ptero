import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  TerminalSquare,
  FolderGit2,
  Rocket,
  Webhook,
  Cpu,
  MemoryStick,
  Activity,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
  Layers,
  Gauge,
  CheckCircle2,
} from "lucide-react";
import {
  Container,
  Section,
  Eyebrow,
} from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Terminal } from "@/components/marketing/terminal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { DiscordMark, NodeMark, PythonMark } from "@/components/marketing/workload-marks";
import { MonitoringPreview } from "./_components/monitoring-preview";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Discord bot tooling, Git-push deploys, realtime monitoring, and enterprise-grade security — everything Ptero gives you to run bots and services in production.",
};

/* ── Runtime feature cards ── */
const RUNTIME_FEATURES = [
  {
    icon: Boxes,
    title: "Discord-first",
    desc: "Built around Discord bots, Node.js services, and Python workers with deploy paths that stay simple under real load.",
  },
  {
    icon: TerminalSquare,
    title: "Custom startup",
    desc: "Override the entrypoint, install flags, and environment with a fully editable startup command per server.",
  },
  {
    icon: Webhook,
    title: "Gateway-ready deploys",
    desc: "Long-lived processes, websocket-heavy bots, and slash-command workloads stay stable through restarts and reconnects.",
  },
];

const WORKLOADS = [
  { label: "Discord bots", icon: DiscordMark, color: "#5865f2" },
  { label: "Node.js", icon: NodeMark, color: "#68a063" },
  { label: "Python", icon: PythonMark, color: "#3776ab" },
] as const;

const DEPLOY_FEATURES = [
  {
    icon: FolderGit2,
    title: "File manager",
    desc: "Upload, edit, and organize your bot files from the panel without leaving the browser.",
  },
  {
    icon: Rocket,
    title: "Manual deploy flow",
    desc: "Start, stop, reinstall, and restart your server whenever you need from a single control surface.",
  },
  {
    icon: Webhook,
    title: "Startup control",
    desc: "Adjust startup variables, runtime settings, and launch behavior directly from the dashboard.",
  },
];

const MONITORING_FEATURES = [
  {
    icon: Cpu,
    title: "CPU graphs",
    desc: "Per-core utilization streamed over websockets, with p50/p95 markers and historical retention.",
  },
  {
    icon: MemoryStick,
    title: "RAM graphs",
    desc: "Track RSS, heap, and limit headroom in realtime. Get alerted before an OOM ever happens.",
  },
  {
    icon: Activity,
    title: "Restart analytics",
    desc: "Every restart, crash, and exit code is logged with a timeline so you can spot regressions fast.",
  },
];

const SECURITY_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Process isolation",
    desc: "Each server runs in a hardened, resource-capped environment with no shared filesystem and strict limits.",
  },
  {
    icon: KeyRound,
    title: "Secret env vars",
    desc: "Environment variables are encrypted at rest and injected only into your runtime — never logged or exposed in the UI.",
  },
  {
    icon: ShieldAlert,
    title: "DDoS mitigation",
    desc: "Always-on L3/L4/L7 protection at the edge absorbs volumetric attacks before they reach your service.",
  },
];

function IconGrid({ items }: { items: typeof RUNTIME_FEATURES }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {items.map((f, i) => (
        <Reveal key={f.title} delay={i * 0.07}>
          <Card hover className="h-full p-6">
            <span className="mb-4 flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
              <f.icon className="size-5" />
            </span>
            <h3 className="mb-1.5 font-semibold text-ink">{f.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{f.desc}</p>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-40 left-1/2 size-[640px] -translate-x-1/2" />
        <Container className="relative flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Eyebrow>Built for production</Eyebrow>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
            Everything you need to{" "}
            <span className="accent-text">run in production</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
            From multi-runtime deploys to realtime monitoring and hardened
            security — Ptero treats your bot like the real infrastructure it is.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/dashboard/overview">
                Deploy Now <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* ── 1. Runtime (text left + visual right) ── */}
      <Section>
        <Container className="flex flex-col gap-14">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Eyebrow>Runtimes</Eyebrow>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Built for the stacks people actually deploy
              </h2>
              <p className="max-w-md text-ink-muted">
                Discord bots stay online, Node.js services stay fast, and Python
                workers stay predictable. Ptero keeps the deploy path simple
                without hiding the parts that matter.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Discord bots with gateway visibility and live logs",
                  "Node 18 · 20 · 22 with custom startup control",
                  "Python 3.10 – 3.12 with pip & poetry",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-sm text-ink-secondary"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-accent-soft" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Reveal>
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-muted">
                    supported workloads
                  </span>
                  <Layers className="size-4 text-accent-soft" />
                </div>
                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-overlay2 sm:grid-cols-3">
                  {WORKLOADS.map((item) => {
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 bg-card p-4"
                      >
                        <span
                          className="flex size-9 items-center justify-center rounded-lg border border-hairline shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          style={{
                            color: item.color,
                            background: `${item.color}14`,
                          }}
                        >
                          <item.icon className="size-4.5" />
                        </span>
                        <span className="text-sm font-medium text-ink">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Reveal>
          </div>
          <IconGrid items={RUNTIME_FEATURES} />
        </Container>
      </Section>

      {/* ── 2. Deployment (visual left + text right) ── */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <Terminal />
            </Reveal>
            <div className="order-1 flex flex-col gap-6 lg:order-2">
              <Eyebrow>Deployment</Eyebrow>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Manage files and runtime{" "}
                <span className="accent-text">from one panel</span>
              </h2>
              <p className="max-w-md text-ink-muted">
                Upload your bot files, configure startup settings, and control
                the process directly from the dashboard. No fake Git workflow
                copy, just the tools you actually use to keep the server online.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Browser file manager and SFTP access",
                  "Start, stop, restart, and reinstall controls",
                  "Startup variables and runtime configuration",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-sm text-ink-secondary"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-accent-soft" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <IconGrid items={DEPLOY_FEATURES} />
        </Container>
      </Section>

      {/* ── 3. Monitoring (text left + live preview right) ── */}
      <Section>
        <Container className="flex flex-col gap-14">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Eyebrow>Monitoring</Eyebrow>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Realtime insight into every server
              </h2>
              <p className="max-w-md text-ink-muted">
                CPU, memory, and restart analytics stream straight from the
                control plane — so you catch a memory leak from the dashboard
                before your users ever notice.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Per-core CPU graphs over websockets",
                  "Heap & RSS memory tracking with alerts",
                  "Restart, crash, and exit-code timeline",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-sm text-ink-secondary"
                  >
                    <Gauge className="size-4 shrink-0 text-accent-soft" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Reveal>
              <MonitoringPreview />
            </Reveal>
          </div>
          <IconGrid items={MONITORING_FEATURES} />
        </Container>
      </Section>

      {/* ── 4. Security (visual left + text right) ── */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <Card className="flex flex-col gap-px overflow-hidden bg-overlay2 p-0">
                <div className="flex items-center justify-between bg-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        Threat protection
                      </p>
                      <p className="font-mono text-xs text-ink-muted">
                        edge · always on
                      </p>
                    </div>
                  </div>
                  <Badge variant="online">active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-px bg-overlay2">
                  {[
                    { label: "Attacks blocked (30d)", value: "1,204" },
                      { label: "Isolation breaches", value: "0" },
                    { label: "Secrets encrypted", value: "AES-256" },
                    { label: "Mitigation latency", value: "<5ms" },
                  ].map((s) => (
                    <div key={s.label} className="bg-card p-6">
                      <p className="font-mono text-2xl font-semibold text-ink">
                        {s.value}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
            <div className="order-1 flex flex-col gap-6 lg:order-2">
              <Eyebrow>Security</Eyebrow>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Hardened by default
              </h2>
              <p className="max-w-md text-ink-muted">
                Isolation, encryption, and mitigation are built into every
                layer — not bolted on. Your process is isolated, your secrets
                are sealed, and attacks stop at the edge.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Per-server isolation and strict resource limits",
                  "Encrypted-at-rest secret environment variables",
                  "Always-on L3/L4/L7 DDoS mitigation",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-sm text-ink-secondary"
                  >
                    <ShieldCheck className="size-4 shrink-0 text-accent-soft" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <IconGrid items={SECURITY_FEATURES} />
        </Container>
      </Section>

      {/* ── Final CTA ── */}
      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card px-8 py-16 text-center sm:px-16 sm:py-20">
            <GlowOrb className="-bottom-32 left-1/2 size-[500px] -translate-x-1/2" />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
                See it running in your dashboard
              </h2>
              <p className="max-w-md text-ink-muted">
                Spin up a server and watch every one of these features come
                alive in realtime.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/overview">
                    Open the dashboard <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/pricing">Compare plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
