import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  ShieldCheck,
  GitBranch,
  KeyRound,
  RotateCw,
  TerminalSquare,
  FolderTree,
  DatabaseBackup,
  CalendarClock,
  LineChart,
  Zap,
} from "lucide-react";
import { Container, Section, SectionHeading, Eyebrow } from "@/components/marketing/section";
import { HeroCopy } from "./_components/hero-copy";
import { Reveal } from "@/components/marketing/reveal";
import { Terminal } from "@/components/marketing/terminal";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Counter } from "@/components/marketing/counter";
import { WorldMap } from "@/components/marketing/world-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { TRUST_STATS, LIVE_METRICS, TESTIMONIALS } from "@/lib/marketing-content";
import { DiscordMark, NodeMark, PythonMark } from "@/components/marketing/workload-marks";

const WORKLOADS = [
  {
    label: "Discord Bots",
    icon: DiscordMark,
    color: "#5865f2",
    versions: "discord.js · Eris · discord.py",
    boot: "27ms gateway",
  },
  {
    label: "Node.js",
    icon: NodeMark,
    color: "#68a063",
    versions: "18 · 20 · 22",
    boot: "20ms",
  },
  {
    label: "Python",
    icon: PythonMark,
    color: "#3776ab",
    versions: "3.10 – 3.12",
    boot: "27ms",
  },
] as const;

const INFRA = [
  { icon: Cpu, title: "Ryzen CPUs", desc: "7950X / 7900X bare-metal cores. No noisy neighbors." },
  { icon: MemoryStick, title: "DDR5 Memory", desc: "High-frequency ECC DDR5 across every node." },
  { icon: HardDrive, title: "NVMe RAID", desc: "Mirrored Gen4 NVMe. Sub-ms disk latency." },
  { icon: Network, title: "10 Gbps Network", desc: "Premium-routed uplinks with anycast edge." },
  { icon: ShieldCheck, title: "DDoS Protection", desc: "Always-on L3/L4/L7 mitigation, no extra cost." },
];

const FEATURES = [
  { icon: GitBranch, title: "Git Deploy", desc: "Push to deploy. Automatic builds on every commit." },
  { icon: KeyRound, title: "Environment Variables", desc: "Encrypted secrets, injected at runtime." },
  { icon: RotateCw, title: "Instant Restart", desc: "Optimistic restarts in under a second." },
  { icon: TerminalSquare, title: "Web Console", desc: "Real websocket terminal with ANSI colors." },
  { icon: FolderTree, title: "SFTP Access", desc: "Full file access with a built-in editor." },
  { icon: DatabaseBackup, title: "Backups", desc: "Scheduled snapshots, one-click restore." },
  { icon: CalendarClock, title: "Scheduler", desc: "Cron tasks for restarts and maintenance." },
  { icon: LineChart, title: "Monitoring", desc: "Realtime CPU, RAM, disk and network graphs." },
];

export default function HomePage() {
  return (
    <>
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-40 left-1/2 size-[640px] -translate-x-1/2" />
        <Container className="relative grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:py-32">
          <HeroCopy />

          <div className="relative flex flex-col gap-4">
            <Terminal />
            <div className="ml-auto w-[78%] -mt-2">
              <DashboardPreview />
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Trusted By ── */}
      <Section className="border-b border-hairline py-14 sm:py-16">
        <Container>
          <p className="mb-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            Powering production workloads worldwide
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {TRUST_STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  <Counter
                    value={s.value}
                    suffix={s.suffix}
                    decimal={"decimal" in s ? s.decimal : false}
                  />
                </span>
                <span className="text-sm text-ink-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 3. Workloads ── */}
      <Section>
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Workloads"
            title="Built for Discord bots, Node.js, and Python"
            description="Pick the stack you actually use and deploy fast. Each path is tuned for long-lived services and realtime visibility."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WORKLOADS.map((r, i) => {
              return (
                <Reveal key={r.label} delay={i * 0.08}>
                  <Card hover className="group h-full p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <span
                        className="flex size-11 items-center justify-center rounded-xl border border-hairline shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        style={{ color: r.color, background: `${r.color}14` }}
                      >
                        <r.icon className="size-5" />
                      </span>
                      <Badge variant="accent">{r.boot}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-ink">{r.label}</h3>
                    <dl className="mt-4 space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Versions</dt>
                        <dd className="font-mono text-ink-secondary">{r.versions}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Startup</dt>
                        <dd className="font-mono text-ink-secondary">{r.boot}</dd>
                      </div>
                    </dl>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ── 4. Infrastructure ── */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Infrastructure"
            title="Bare-metal you can feel"
            description="No oversold VPS. Real hardware, premium networking, always-on protection."
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-overlay2 sm:grid-cols-2 lg:grid-cols-3">
            {INFRA.map((item) => (
              <div key={item.title} className="group bg-card p-7 transition-colors hover:bg-elevated">
                <item.icon className="mb-4 size-6 text-accent-soft" />
                <h3 className="mb-1.5 font-semibold text-ink">{item.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{item.desc}</p>
              </div>
            ))}
            <div className="flex flex-col justify-center bg-gradient-to-br from-accent/20 to-accent-deep/10 p-7">
              <Zap className="mb-4 size-6 text-accent-soft" />
              <h3 className="mb-1.5 font-semibold text-ink">Built for speed</h3>
              <p className="text-sm leading-relaxed text-ink-secondary">
                Every layer optimized so your bot wakes instantly and never stalls.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 5. Features ── */}
      <Section>
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to run in production"
            description="A dashboard that treats your bot like real infrastructure, not a toy."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.06}>
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
        </Container>
      </Section>

      {/* ── 6. Live Metrics ── */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            align="left"
            title="The whole fleet, in realtime"
            description="Streaming straight from the control plane. This is what your dashboard feels like."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LIVE_METRICS.map((m) => (
              <Card key={m.label} className="p-6">
                <div className="flex items-center justify-between">
                  <span className="size-2 rounded-full bg-online animate-pulse-ring" />
                  <Badge variant="online">{m.trend}</Badge>
                </div>
                <p className="mt-4 font-mono text-3xl font-semibold text-ink">{m.value}</p>
                <p className="mt-1 text-sm text-ink-muted">{m.label}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 7. Locations ── */}
      <Section>
        <Container className="flex flex-col gap-12">
          <SectionHeading
            eyebrow="Global"
            title="Deploy close to your users"
            description="Low-latency regions across Europe, the US, and Turkey — with more on the way."
          />
          <Reveal>
            <WorldMap />
          </Reveal>
        </Container>
      </Section>

      {/* ── 8. Developer Experience ── */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Eyebrow>Developer experience</Eyebrow>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Your existing Git workflow,{" "}
              <span className="accent-text">supercharged</span>
            </h2>
            <p className="max-w-md text-ink-muted">
              Connect a repo, push to your production branch, and Ptero builds,
              provisions, and deploys automatically — with rollbacks one click away.
            </p>
            <ul className="flex flex-col gap-3">
              {["GitHub & GitLab integration", "Automatic deploy on push", "Build hooks & preview environments"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent/15 text-accent-soft">
                    <ArrowRight className="size-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Terminal />
        </Container>
      </Section>

      {/* ── 9. Testimonials ── */}
      <Section>
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Loved by builders"
            title="Trusted by thousands of developers"
          />
          <div className="grid gap-5 md:grid-cols-2">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 2) * 0.08}>
                <Card className="flex h-full flex-col gap-5 p-7">
                  <p className="text-pretty text-[15px] leading-relaxed text-ink-secondary">
                    “{t.quote}”
                  </p>
                  <div className="mt-auto flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent-soft">
                      {t.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{t.name}</p>
                      <p className="text-xs text-ink-muted">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 10. Final CTA ── */}
      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card px-8 py-16 text-center sm:px-16 sm:py-20">
            <GlowOrb className="-bottom-32 left-1/2 size-[500px] -translate-x-1/2" />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Deploy your first bot in the next 60 seconds
              </h2>
              <p className="max-w-md text-ink-muted">
                No credit card. No DevOps. Just push and go live.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/overview">
                    Start Deploying <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/support">Talk to us</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
