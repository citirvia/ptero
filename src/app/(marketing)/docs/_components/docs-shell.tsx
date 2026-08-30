"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface DocLink {
  href: string;
  label: string;
}

export interface DocGroup {
  group: string;
  links: DocLink[];
}

export const DOC_NAV: DocGroup[] = [
  {
    group: "Getting Started",
    links: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs#quickstart", label: "Quickstart" },
      { href: "/docs#project-config", label: "Project config" },
    ],
  },
  {
    group: "Deployments",
    links: [
      { href: "/docs/deployments", label: "Git deploys" },
      { href: "/docs/deployments#builds", label: "Builds" },
      { href: "/docs/deployments#rollbacks", label: "Rollbacks" },
    ],
  },
  {
    group: "Runtimes",
    links: [
      { href: "/docs/runtimes", label: "Overview" },
      { href: "/docs/runtimes#discord", label: "Discord bots" },
      { href: "/docs/runtimes#node", label: "Node.js" },
      { href: "/docs/runtimes#python", label: "Python" },
    ],
  },
  {
    group: "CLI",
    links: [
      { href: "/docs/cli", label: "Install" },
      { href: "/docs/cli#auth", label: "Authentication" },
      { href: "/docs/cli#commands", label: "Commands" },
    ],
  },
];

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-16">
      <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2 no-scrollbar">
        <nav aria-label="Docs" className="flex flex-col gap-7">
          {DOC_NAV.map((g) => (
            <div key={g.group} className="flex flex-col gap-1">
              <p className="mb-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-disabled">
                {g.group}
              </p>
              {g.links.map((l) => {
                const base = l.href.split("#")[0];
                const isActive = pathname === base && !l.href.includes("#");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "focus-ring rounded-lg border-l-2 px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-accent-soft bg-accent/10 text-ink"
                        : "border-transparent text-ink-muted hover:border-line-hover hover:text-ink-secondary",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <article className="flex min-w-0 flex-col gap-8 pb-8">{children}</article>
    </div>
  );
}
