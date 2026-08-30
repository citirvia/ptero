import type { Metadata } from "next";
import { Gauge, Activity, MemoryStick, Network } from "lucide-react";
import { HostingLanding, type HostingConfig } from "../_hosting/hosting-landing";

export const metadata: Metadata = {
  title: "Node.js Hosting — Ptero",
  description:
    "Deploy Node.js 18, 20, and 22 apps on bare-metal Ryzen with fast cold starts, git-push deploys, and realtime monitoring. Express, Fastify, NestJS, Next.js.",
};

const config: HostingConfig = {
  runtimeKey: "node",
  accent: "#68a063",
  eyebrow: "Node.js 18 · 20 · 22",
  headline: (
    <>
      Node.js hosting that feels like{" "}
      <span className="accent-text">bare metal</span>
    </>
  ),
  subheadline:
    "Run Express APIs, Fastify services, NestJS apps, and full Next.js sites on dedicated Ryzen cores. Pick your Node version, push to deploy, and watch the event loop in realtime.",
  heroBadge: "320ms cold start",
  metrics: [
    { icon: Gauge, label: "Cold start", value: "320", unit: "ms", sub: "Process to first request served." },
    { icon: Activity, label: "Throughput", value: "48", unit: "k req/s", sub: "Fastify on a single Ryzen core." },
    { icon: Network, label: "Event-loop lag", value: "1.2", unit: "ms", sub: "p99 under sustained production load." },
    { icon: MemoryStick, label: "Idle memory", value: "62", unit: "MB", sub: "Resident set for a typical Express app." },
  ],
  frameworksTitle: "Built for the Node ecosystem",
  frameworksDescription:
    "From thin HTTP servers to full-stack frameworks, every common Node setup builds and runs without configuration.",
  frameworks: [
    { name: "Express", abbr: "Ex", desc: "The classic. Zero-config builds, instant restarts.", color: "#68a063" },
    { name: "Fastify", abbr: "Fa", desc: "Schema-based routing at 48k+ req/s per core.", color: "#000000" },
    { name: "NestJS", abbr: "Ne", desc: "TypeScript DI framework with first-class build caching.", color: "#e0234e" },
    { name: "Next.js", abbr: "Nx", desc: "SSR and API routes with persistent Node servers.", color: "#ffffff" },
  ],
  faqs: [
    {
      q: "Which Node.js versions can I run?",
      a: "Node 18, 20, and 22 are available, including the latest LTS and current releases. Pin the version with an engines field in package.json or pick it in the dashboard; we rebuild on the matching runtime automatically.",
    },
    {
      q: "How do builds and installs work?",
      a: "On every push we detect your package manager (npm, pnpm, or yarn), restore a dependency cache, run your build script, and start the app. Build logs stream live to the web console.",
    },
    {
      q: "Can I run a full Next.js app, not just an API?",
      a: "Yes. Next.js runs as a long-lived Node server, so SSR, API routes, and middleware all work. For static-only exports you can serve the output directly with the same git-push flow.",
    },
    {
      q: "What about background workers and websockets?",
      a: "Your process is a persistent service, so long-running websocket connections, BullMQ workers, and cron-style tasks all keep running. Use the built-in scheduler for periodic jobs.",
    },
    {
      q: "Do you support TypeScript out of the box?",
      a: "Absolutely. Run your tsc or bundler build step at deploy time, or use a runtime like tsx — either works. Environment variables are injected at runtime and typed however you prefer.",
    },
  ],
  finalCta: {
    title: "Ship your Node.js app in the next minute",
    description:
      "Connect a repo, push, and your server is live on dedicated Ryzen cores. Rollbacks are one click away.",
  },
};

export default function NodejsHostingPage() {
  return <HostingLanding config={config} />;
}
