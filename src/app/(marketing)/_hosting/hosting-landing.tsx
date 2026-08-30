import Link from "next/link";
import {
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  Eyebrow,
} from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Terminal } from "@/components/marketing/terminal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/* ── Config contract ── */
export interface HostingMetric {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  sub: string;
}
export interface HostingFramework {
  name: string;
  abbr: string;
  desc: string;
  color: string;
}
export interface HostingFaq {
  q: string;
  a: string;
}
export interface HostingConfig {
  /** mono key used for accents / chip seed, e.g. "node" */
  runtimeKey: string;
  /** runtime accent color (hex) */
  accent: string;
  eyebrow: string;
  /** hero headline — split so the highlighted span can be styled */
  headline: React.ReactNode;
  subheadline: string;
  /** small mono badge under the CTAs */
  heroBadge: string;
  /** terminal window title, e.g. "~/atlas-bot — deploy" */
  metrics: HostingMetric[];
  frameworksTitle: string;
  frameworksDescription: string;
  frameworks: HostingFramework[];
  faqs: HostingFaq[];
  finalCta: {
    title: React.ReactNode;
    description: string;
  };
}

export function HostingLanding({ config }: { config: HostingConfig }) {
  const accent = config.accent;

  return (
    <>
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb
          className="-top-40 left-1/2 size-[640px] -translate-x-1/2"
          color={`${accent}30`}
        />
        <Container className="relative grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div className="flex flex-col items-start gap-6">
            <Eyebrow>{config.eyebrow}</Eyebrow>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
              {config.headline}
            </h1>
            <p className="max-w-lg text-pretty text-lg leading-relaxed text-ink-muted">
              {config.subheadline}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard/overview">
                  Deploy Now <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-online animate-pulse-ring" />
                {config.heroBadge}
              </span>
              <span>·</span>
              <span>No credit card required</span>
            </div>
          </div>

          <div className="relative flex flex-col gap-4">
            <Terminal />
            {/* compact stat strip floating under the terminal */}
            <div className="ml-auto grid w-[82%] grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-overlay2">
              {config.metrics.slice(0, 3).map((m) => (
                <div key={m.label} className="bg-card px-4 py-4">
                  <p className="font-mono text-xl font-semibold text-ink">
                    {m.value}
                    {m.unit && (
                      <span className="ml-0.5 text-xs text-ink-muted">{m.unit}</span>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-ink-muted">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Performance Metrics ── */}
      <Section className="border-b border-hairline">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Performance"
            title="Numbers that hold under load"
            description="Measured across the production fleet on bare-metal Ryzen nodes — not synthetic single-tenant boxes."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {config.metrics.map((m, i) => (
              <Reveal key={m.label} delay={(i % 4) * 0.07}>
                <Card hover className="h-full p-6">
                  <span
                    className="mb-5 flex size-10 items-center justify-center rounded-xl border border-hairline"
                    style={{ color: accent, background: `${accent}14` }}
                  >
                    <m.icon className="size-5" />
                  </span>
                  <p className="font-mono text-3xl font-semibold tracking-tight text-ink">
                    {m.value}
                    {m.unit && (
                      <span className="ml-1 text-base text-ink-muted">{m.unit}</span>
                    )}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-ink-secondary">
                    {m.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {m.sub}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 3. Optimized For ── */}
      <Section className="border-b border-hairline bg-surface">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Optimized for"
            title={config.frameworksTitle}
            description={config.frameworksDescription}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {config.frameworks.map((f, i) => (
              <Reveal key={f.name} delay={(i % 4) * 0.07}>
                <Card hover className="group flex h-full items-start gap-4 p-6">
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-hairline font-mono text-sm font-bold"
                    style={{ color: f.color, background: `${f.color}14` }}
                  >
                    {f.abbr}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{f.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {f.desc}
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 4. FAQ ── */}
      <Section className="border-b border-hairline">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            description="Everything you need to know before you deploy."
          />
          <Accordion type="single" collapsible className="w-full">
            {config.faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* ── 5. Final CTA ── */}
      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card px-8 py-16 text-center sm:px-16 sm:py-20">
            <GlowOrb
              className="-bottom-32 left-1/2 size-[500px] -translate-x-1/2"
              color={`${accent}30`}
            />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
                {config.finalCta.title}
              </h2>
              <p className="max-w-md text-ink-muted">
                {config.finalCta.description}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/overview">
                    Deploy Now <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
