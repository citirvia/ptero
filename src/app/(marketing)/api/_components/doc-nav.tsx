"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface DocSection {
  id: string;
  label: string;
}

export function DocNav({ sections }: { sections: DocSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="API reference sections" className="flex flex-col gap-1">
      <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-disabled">
        Reference
      </p>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn(
            "focus-ring rounded-lg border-l-2 px-3 py-2 text-sm transition-colors",
            active === s.id
              ? "border-accent-soft bg-accent/10 text-ink"
              : "border-transparent text-ink-muted hover:border-line-hover hover:text-ink-secondary",
          )}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
