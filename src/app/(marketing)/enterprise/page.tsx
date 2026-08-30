import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Gauge,
  Server,
  ScrollText,
  Headset,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { ContactForm } from "./_components/contact-form";

export const metadata: Metadata = {
  title: "Enterprise — Ptero",
  description:
    "Ptero for Enterprise: SSO/SAML, 99.99% SLA, dedicated capacity, audit logs, priority support and compliance.",
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "SSO & SAML",
    desc: "SAML 2.0 single sign-on with SCIM provisioning. Enforce your IdP and deprovision in one place.",
  },
  {
    icon: Gauge,
    title: "99.99% SLA",
    desc: "A financially-backed uptime commitment with defined response and resolution targets.",
  },
  {
    icon: Server,
    title: "Dedicated capacity",
    desc: "Reserved Ryzen nodes isolated to your org — no shared tenancy, predictable tail latency.",
  },
  {
    icon: ScrollText,
    title: "Audit logs",
    desc: "Immutable, exportable logs of every action, with SIEM streaming and long retention.",
  },
  {
    icon: Headset,
    title: "Priority support",
    desc: "A dedicated Slack channel, a named solutions engineer, and a 15-minute P1 response.",
  },
  {
    icon: BadgeCheck,
    title: "Compliance",
    desc: "SOC 2 Type II and GDPR-ready, with a signed DPA and data-residency controls.",
  },
];

const LOGOS = ["NORTHWIND", "ACME CORP", "HELIOS", "VANTA LABS", "QUANTIC", "BYTEFORGE"];

const STATS = [
  { value: "99.99%", label: "Contractual uptime SLA" },
  { value: "<15min", label: "P1 incident response" },
  { value: "SOC 2", label: "Type II certified" },
  { value: "24/7", label: "Dedicated support" },
];

const FAQ = [
  {
    q: "How does dedicated capacity work?",
    a: "We reserve entire Ryzen nodes for your organization. Your workloads never share a physical core with another tenant, which keeps tail latency predictable and eliminates noisy-neighbor effects.",
  },
  {
    q: "Which identity providers do you support for SSO?",
    a: "Any SAML 2.0 provider — Okta, Entra ID, Google Workspace, OneLogin and others. SCIM provisioning keeps user lifecycle in sync with your directory automatically.",
  },
  {
    q: "What does the 99.99% SLA cover?",
    a: "The compute control plane and your provisioned nodes. The agreement defines monthly uptime targets, measurement methodology, and service credits if we miss them.",
  },
  {
    q: "Can we get a signed DPA and security review?",
    a: "Yes. We provide a signed Data Processing Agreement, our SOC 2 Type II report under NDA, and a completed security questionnaire as part of procurement.",
  },
  {
    q: "Do you offer data residency?",
    a: "Enterprise workloads can be pinned to specific regions — including EU-only residency — so data never leaves the jurisdictions you choose.",
  },
  {
    q: "What does onboarding look like?",
    a: "A named solutions engineer scopes your migration, sets up SSO and dedicated nodes, and runs a guided cutover. Most teams are fully migrated within two weeks.",
  },
];

export default function EnterprisePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-40 left-1/2 size-[640px] -translate-x-1/2" />
        <Container className="relative py-20 sm:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
              <span className="size-1.5 rounded-full bg-accent-soft" />
              Ptero for Enterprise
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
              Bare-metal infrastructure your{" "}
              <span className="accent-text">security team</span> will sign off on
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
              Dedicated capacity, SSO, a 99.99% SLA and the compliance posture
              large teams require — on the same fast platform your developers
              already love.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="#contact">
                  Talk to sales <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/docs">Read the docs</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <Section className="border-b border-hairline bg-surface py-14 sm:py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="font-mono text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  {s.value}
                </span>
                <span className="text-sm text-ink-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Feature grid */}
      <Section>
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="Capabilities"
            title="Everything procurement asks for"
            description="Enterprise controls built into the platform, not bolted on as an afterthought."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.06}>
                <div className="card-base flex h-full flex-col gap-3 p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="font-semibold text-ink">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Trust / logos */}
      <Section className="border-y border-hairline bg-surface py-14 sm:py-16">
        <Container>
          <p className="mb-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            Trusted by engineering teams scaling on Ptero
          </p>
          <div className="grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {LOGOS.map((name) => (
              <div
                key={name}
                className="flex items-center justify-center font-mono text-sm font-semibold tracking-[0.15em] text-ink-disabled transition-colors hover:text-ink-secondary"
              >
                {name}
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Contact */}
      <Section id="contact" className="scroll-mt-24">
        <Container className="grid items-start gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <SectionHeading
              align="left"
              eyebrow="Talk to sales"
              title="Let's scope your deployment"
              description="Tell us about your workloads and compliance needs. A solutions engineer will get back to you within one business day."
            />
            <ul className="flex flex-col gap-3">
              {[
                "Custom pricing for reserved capacity",
                "Migration support from your current host",
                "Security review, DPA and SOC 2 report",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent/15 text-accent-soft">
                    <ArrowRight className="size-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <ContactForm />
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-hairline bg-surface">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="Everything else is a conversation away — reach out and we'll get specific."
          />
          <div className="mx-auto w-full max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>
    </>
  );
}
