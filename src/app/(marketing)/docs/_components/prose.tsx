import Link from "next/link";
import { ArrowRight, Info, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-hairline pb-8">
      {eyebrow && (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-soft">
          {eyebrow}
        </p>
      )}
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
    </header>
  );
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 text-2xl font-semibold tracking-tight text-ink"
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold tracking-tight text-ink">{children}</h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-2xl text-pretty leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12.5px] text-ink-secondary">
      {children}
    </code>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex max-w-2xl flex-col gap-2 text-[15px] text-ink-secondary">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-soft" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const calloutMap = {
  info: { icon: Info, cls: "border-info/30 bg-info/5 text-info" },
  warn: { icon: AlertTriangle, cls: "border-warn/30 bg-warn/5 text-warn" },
  tip: { icon: Lightbulb, cls: "border-accent/30 bg-accent/5 text-accent-soft" },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof calloutMap;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, cls } = calloutMap[type];
  return (
    <div className={cn("flex max-w-2xl gap-3 rounded-xl border p-4", cls)}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        {title && <p className="text-sm font-semibold text-ink">{title}</p>}
        <div className="text-sm leading-relaxed text-ink-secondary">
          {children}
        </div>
      </div>
    </div>
  );
}

export function NextSteps({
  cards,
}: {
  cards: { href: string; title: string; desc: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="group card-base flex flex-col gap-1.5 p-5 transition-all duration-300 hover:border-hairline2 hover:shadow-glow"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">{c.title}</p>
            <ArrowRight className="size-4 text-ink-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent-soft" />
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">{c.desc}</p>
        </Link>
      ))}
    </div>
  );
}
