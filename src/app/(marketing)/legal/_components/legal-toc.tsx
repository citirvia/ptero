"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LegalSection } from "./legal-doc";

export function LegalToc({ sections }: { sections: LegalSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-1">
      <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-disabled">
        On this page
      </p>
      {sections.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn(
            "focus-ring rounded-lg border-l-2 px-3 py-1.5 text-sm transition-colors",
            active === s.id
              ? "border-accent-soft bg-accent/10 text-ink"
              : "border-transparent text-ink-muted hover:border-line-hover hover:text-ink-secondary",
          )}
        >
          <span className="mr-2 font-mono text-[11px] text-ink-disabled">
            {String(i + 1).padStart(2, "0")}
          </span>
          {s.title}
        </a>
      ))}
    </nav>
  );
}
