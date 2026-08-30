import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Heart,
  Lock,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  Eyebrow,
} from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Counter } from "@/components/marketing/counter";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowOrb, GridBackdrop } from "@/components/decor";

export const metadata: Metadata = {
  title: "About — Ptero",
  description:
    "Ptero is building the bare-metal infrastructure platform developers actually want — fast, honest, and built in the open.",
};

const STATS = [
  { label: "Customers", value: 18420, suffix: "+", decimal: false },
  { label: "Servers running", value: 92118, suffix: "", decimal: false },
  { label: "Datacenters", value: 5, suffix: "", decimal: false },
  { label: "Uptime SLA", value: 99.99, suffix: "%", decimal: true },
];

const VALUES = [
  {
    icon: Gauge,
    title: "Speed is a feature",
    desc: "Cold starts in milliseconds, deploys in seconds. Every layer is tuned because waiting is a tax on builders.",
  },
  {
    icon: Lock,
    title: "Honest infrastructure",
    desc: "Real bare-metal, real numbers. No oversold VPS, no surprise egress bills, no marketing math.",
  },
  {
    icon: Radio,
    title: "Built in the open",
    desc: "Public roadmap, public changelog, public status. We ship by demand and show our work.",
  },
  {
    icon: Heart,
    title: "Developer obsessed",
    desc: "The dashboard, the CLI, the API — all built by people who run production bots themselves.",
  },
  {
    icon: Sparkles,
    title: "Craft over scale",
    desc: "We'd rather ship one feature that feels perfect than ten that feel rushed.",
  },
  {
    icon: Users,
    title: "Small team, big leverage",
    desc: "A tight crew with deep autonomy. Everyone owns what they ship, end to end.",
  },
];

const TEAM = [
  { name: "Selim Melih", role: "Co-founder & CEO" },
  { name: "Aylin Kaya", role: "Co-founder & CTO" },
  { name: "Deniz Yıldız", role: "Head of Infrastructure" },
  { name: "Mert Arslan", role: "Lead Platform Engineer" },
  { name: "Priya Raman", role: "Head of Product" },
  { name: "Tom Whitfield", role: "Developer Experience" },
];

const MILESTONES = [
  { date: "2024", title: "Ptero founded", desc: "Two engineers, one Frankfurt rack, and a frustration with overpriced bot hosting." },
  { date: "2024 Q4", title: "First 1,000 servers", desc: "Closed a pre-seed round and opened the Ashburn region." },
  { date: "2025 Q2", title: "Istanbul + London regions", desc: "Expanded to five datacenters with anycast edge routing." },
  { date: "2025 Q4", title: "Seed round", desc: "Backed by infrastructure-focused funds and a roster of operator angels." },
  { date: "2026", title: "92,000+ servers", desc: "Discord-focused tooling, scoped API keys, and realtime monitoring shipped." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-40 left-1/2 size-[620px] -translate-x-1/2" />
        <Container className="relative py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
            <span className="size-1.5 rounded-full bg-accent-soft" />
            Our mission
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
            Infrastructure that gets out of the{" "}
            <span className="accent-text">way</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
            We started Ptero because shipping a Discord bot or a small service
            shouldn&apos;t require a DevOps team. Our mission is to give every
            developer bare-metal performance with a dashboard that treats their
            workload like real infrastructure.
          </p>
        </Container>
      </section>

      {/* Stats band */}
      <Section className="border-b border-hairline py-14 sm:py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  <Counter value={s.value} suffix={s.suffix} decimal={s.decimal} />
                </span>
                <span className="text-sm text-ink-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Story */}
      <Section>
        <Container className="grid items-start gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Eyebrow>The story</Eyebrow>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              From a single rack to a global fleet
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-pretty leading-relaxed text-ink-secondary">
            <p>
              In 2024 we were running our own bots across a patchwork of cheap
              VPS providers, fighting noisy neighbors, opaque pricing and
              dashboards that felt like afterthoughts. So we bought a Ryzen rack
              in Frankfurt and built the platform we wished existed.
            </p>
            <p>
              That platform turned into Ptero. Today we run mirrored NVMe and
              high-frequency DDR5 across five datacenters, with a control plane
              that streams realtime metrics straight to your dashboard. The same
              hardware powers a hobby bot and a production service handling
              billions of commands a day.
            </p>
            <p>
              We&apos;re still a small, opinionated team — and we still run our
              own workloads on Ptero. That keeps us honest.
            </p>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Values"
            title="What we optimize for"
            description="A few principles that show up in every decision we make."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 0.06}>
                <div className="card-base h-full p-6">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
                    <v.icon className="size-5" />
                  </span>
                  <h3 className="mb-1.5 font-semibold text-ink">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section>
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Team"
            title="The people behind Ptero"
            description="Engineers and operators who'd rather be shipping than in meetings."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m, i) => (
              <Reveal key={m.name} delay={(i % 3) * 0.06}>
                <div className="card-base flex items-center gap-4 p-5">
                  <Avatar name={m.name} className="size-12 text-sm" />
                  <div>
                    <p className="font-medium text-ink">{m.name}</p>
                    <p className="text-sm text-ink-muted">{m.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Backed by / milestones */}
      <Section className="border-y border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Backed by & milestones"
            title="How we got here"
            description="Funded by infrastructure investors and the operators who use us every day."
          />
          <div className="mx-auto w-full max-w-3xl">
            <ol className="relative flex flex-col">
              {MILESTONES.map((m, i) => (
                <li key={m.title} className="relative pl-10 pb-10 last:pb-0 sm:pl-12">
                  {i < MILESTONES.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[7px] top-3 h-full w-px bg-gradient-to-b from-line to-transparent"
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute left-0 top-1 flex size-4 items-center justify-center rounded-full border border-hairline2 bg-bg"
                  >
                    <span className="size-2 rounded-full bg-accent-soft" />
                  </span>
                  <Reveal delay={(i % 3) * 0.05}>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="accent">{m.date}</Badge>
                      <h3 className="font-semibold text-ink">{m.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {m.desc}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
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
                Want to help us build it?
              </h2>
              <p className="max-w-md text-ink-muted">
                We&apos;re hiring across engineering, infrastructure and developer
                experience.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/support">
                    Get in touch <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/support">Get in touch</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
