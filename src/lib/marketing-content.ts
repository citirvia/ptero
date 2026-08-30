/**
 * Static marketing copy used by the homepage hero, the auth-flow sidebar, and
 * any visual-only "preview" components. These are *not* live data — they're
 * positioning numbers we control. Live counts (servers running, current
 * uptime, active nodes) come from the public endpoints in `src/lib/api/hooks`.
 */

export const TRUST_STATS = [
  { label: "Customers", value: 18420, suffix: "+" },
  { label: "Servers running", value: 92118, suffix: "" },
  { label: "Commands processed / day", value: 1_240_000_000, suffix: "" },
  { label: "Uptime SLA", value: 99.99, suffix: "%", decimal: true },
] as const;

export const LIVE_METRICS = [
  { label: "Active nodes", value: "48", trend: "+2" },
  { label: "Deploy latency (p50)", value: "1.8s", trend: "-0.3s" },
  { label: "Current uptime", value: "99.99%", trend: "30d" },
  { label: "Running bots", value: "92,118", trend: "+312" },
] as const;

export const TESTIMONIALS = [
  {
    name: "Jara D.",
    role: "Bot developer · 40k servers",
    quote:
      "Moved 12 Discord bots over a weekend. Git push, it's live. The console feels like a real terminal, not a toy.",
    avatar: "",
  },
  {
    name: "Kenan Ö.",
    role: "CTO · Indie SaaS",
    quote:
      "The monitoring is genuinely realtime. We caught a memory leak from the dashboard before our users noticed.",
    avatar: "",
  },
  {
    name: "Priya R.",
    role: "Platform engineer",
    quote:
      "Bare-metal Ryzen pricing with a Vercel-grade dashboard. That combination basically didn't exist before.",
    avatar: "",
  },
  {
    name: "Tom W.",
    role: "Open-source maintainer",
    quote: "Moving our Discord bot here cut reconnect drama to basically zero. The live console is the part I trust most.",
    avatar: "",
  },
] as const;
