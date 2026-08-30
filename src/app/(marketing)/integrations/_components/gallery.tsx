"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Integration {
  name: string;
  abbr: string;
  color: string;
  category: string;
  desc: string;
}

const INTEGRATIONS: Integration[] = [
  { name: "GitHub", abbr: "GH", color: "#8b949e", category: "Source", desc: "Push to deploy and report build status back as commit checks." },
  { name: "GitLab", abbr: "GL", color: "#fc6d26", category: "Source", desc: "Connect repos and pipelines for automatic git-push deploys." },
  { name: "Datadog", abbr: "DD", color: "#774aa4", category: "Observability", desc: "Stream metrics and traces from your servers into Datadog." },
  { name: "Sentry", abbr: "SN", color: "#e1567c", category: "Observability", desc: "Capture errors and link releases to your Ptero deploys." },
  { name: "Grafana", abbr: "GF", color: "#f46800", category: "Observability", desc: "Scrape the metrics endpoint and build live dashboards." },
  { name: "Discord", abbr: "DS", color: "#5865f2", category: "Comms", desc: "Send deploy, restart and alert notifications to a channel." },
  { name: "Slack", abbr: "SL", color: "#36c5f0", category: "Comms", desc: "Route incident and deploy events to your team's workspace." },
  { name: "Discord Webhooks", abbr: "DW", color: "#5865f2", category: "Comms", desc: "Post deploys, alerts, and incident updates directly into Discord channels." },
  { name: "Webhooks", abbr: "WH", color: "#3fb950", category: "Deploy", desc: "Subscribe to signed events and trigger your own automations." },
];

const CATEGORIES = ["All", "Source", "Observability", "Comms", "Deploy"] as const;
const GROUPS = ["Source", "Observability", "Comms", "Deploy"] as const;

function Cards({ items }: { items: Integration[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i, idx) => (
        <Reveal key={i.name} delay={(idx % 3) * 0.05}>
          <div className="card-base flex h-full flex-col gap-4 p-6 transition-all duration-300 hover:border-hairline2 hover:shadow-glow">
            <div className="flex items-center justify-between">
              <span
                className="flex size-11 items-center justify-center rounded-xl border border-hairline font-mono text-sm font-bold"
                style={{ color: i.color, background: `${i.color}1a` }}
              >
                {i.abbr}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-disabled">
                {i.category}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-semibold text-ink">{i.name}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{i.desc}</p>
            </div>
            <div className="mt-auto flex items-center gap-2 pt-2">
              <Button size="sm">Connect</Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/docs">
                  Docs <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function Gallery() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");

  return (
    <div className="flex flex-col gap-10">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const count =
            cat === "All"
              ? INTEGRATIONS.length
              : INTEGRATIONS.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active === cat
                  ? "border-accent/40 bg-accent/10 text-accent-soft"
                  : "border-line text-ink-muted hover:border-line-hover hover:text-ink-secondary",
              )}
            >
              {cat}
              <span className="font-mono text-[11px] text-ink-disabled">{count}</span>
            </button>
          );
        })}
      </div>

      {active === "All" ? (
        // Grouped view
        <div className="flex flex-col gap-12">
          {GROUPS.map((g) => (
            <div key={g} className="flex flex-col gap-5">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                {g}
              </h2>
              <Cards items={INTEGRATIONS.filter((i) => i.category === g)} />
            </div>
          ))}
        </div>
      ) : (
        <Cards items={INTEGRATIONS.filter((i) => i.category === active)} />
      )}
    </div>
  );
}
