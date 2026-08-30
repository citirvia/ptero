import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plug } from "lucide-react";
import { Container, Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { Gallery } from "./_components/gallery";

export const metadata: Metadata = {
  title: "Integrations — Ptero",
  description:
    "Connect Ptero to your source control, observability stack, comms tools and deploy pipeline.",
};

export default function IntegrationsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-32 left-1/2 size-[560px] -translate-x-1/2" />
        <Container className="relative py-16 sm:py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
              <Plug className="size-3.5" />
              Integrations
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Plug Ptero into your{" "}
              <span className="accent-text">existing stack</span>
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
              Connect source control, observability, comms and deploy tooling in
              a few clicks. Your workflow stays exactly where it is — Ptero just
              slots in.
            </p>
          </div>
        </Container>
      </section>

      {/* Gallery */}
      <Section className="py-14 sm:py-16">
        <Container>
          <Gallery />
        </Container>
      </Section>

      {/* CTA */}
      <Section className="border-t border-hairline bg-surface">
        <Container>
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Need an integration we don&apos;t have yet?
            </h2>
            <p className="max-w-md text-ink-muted">
              Everything is built on signed webhooks and a REST API — wire up
              anything, or ask us to build it.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard/support">
                  Request an integration <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/enterprise">Talk to us</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
