import { Container } from "@/components/marketing/section";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { LegalToc } from "./legal-toc";

export interface LegalSection {
  id: string;
  title: string;
  /** Paragraphs and/or bullet lists. */
  body: React.ReactNode;
}

export function LegalDoc({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-32 left-1/2 size-[480px] -translate-x-1/2" />
        <Container className="relative py-16 sm:py-20">
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
              <span className="size-1.5 rounded-full bg-accent-soft" />
              {eyebrow}
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
              {intro}
            </p>
            <p className="font-mono text-xs text-ink-muted">
              Last updated: {lastUpdated}
            </p>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-20">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <LegalToc sections={sections} />
        </aside>

        <article className="flex min-w-0 max-w-2xl flex-col gap-12">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-ink">
                <span className="font-mono text-sm text-accent-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-ink-secondary [&_a]:text-accent-soft [&_a]:underline [&_li]:flex [&_li]:gap-2.5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2.5">
                {s.body}
              </div>
            </section>
          ))}

          <div className="rounded-2xl border border-hairline bg-surface p-6 text-sm leading-relaxed text-ink-muted">
            Questions about this document? Reach our team at{" "}
            <a
              href="mailto:legal@ptero.app"
              className="font-mono text-accent-soft underline"
            >
              legal@ptero.app
            </a>
            .
          </div>
        </article>
      </Container>
    </>
  );
}

/** Small bullet helper for consistent list markers in legal bodies. */
export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-soft/70" />
      <span>{children}</span>
    </li>
  );
}
