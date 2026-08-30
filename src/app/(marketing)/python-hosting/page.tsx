import type { Metadata } from "next";
import { Gauge, Activity, MemoryStick, Feather } from "lucide-react";
import { HostingLanding, type HostingConfig } from "../_hosting/hosting-landing";

export const metadata: Metadata = {
  title: "Python Hosting — Ptero",
  description:
    "Deploy Python 3.10–3.12 apps on bare-metal Ryzen with fast boots, git-push deploys, and realtime monitoring. Optimized for FastAPI, discord.py, aiohttp, Flask.",
};

const config: HostingConfig = {
  runtimeKey: "python",
  accent: "#4b8bbe",
  eyebrow: "Python 3.10 – 3.12",
  headline: (
    <>
      Python hosting for{" "}
      <span className="accent-text">async-first</span> services
    </>
  ),
  subheadline:
    "Run FastAPI services, discord.py bots, aiohttp servers, and Flask apps on dedicated Ryzen cores. Pick your Python version, push to deploy, and monitor every request live.",
  heroBadge: "410ms cold start",
  metrics: [
    { icon: Gauge, label: "Cold start", value: "410", unit: "ms", sub: "Interpreter ready to first request." },
    { icon: Activity, label: "Throughput", value: "29", unit: "k req/s", sub: "FastAPI with Uvicorn on a single core." },
    { icon: MemoryStick, label: "Idle memory", value: "74", unit: "MB", sub: "Resident set for a typical FastAPI app." },
    { icon: Feather, label: "Install time", value: "3.2", unit: "s", sub: "pip install on a warm wheel cache." },
  ],
  frameworksTitle: "Built for the Python ecosystem",
  frameworksDescription:
    "Async web frameworks and bot libraries the Python community runs in production — with the ASGI/WSGI server wired up for you.",
  frameworks: [
    { name: "FastAPI", abbr: "Fa", desc: "Async ASGI APIs with automatic OpenAPI docs.", color: "#009688" },
    { name: "discord.py", abbr: "dp", desc: "Async Discord bots with cogs and slash commands.", color: "#4b8bbe" },
    { name: "aiohttp", abbr: "ah", desc: "Async HTTP client and server for high-concurrency I/O.", color: "#2c5bb4" },
    { name: "Flask", abbr: "Fl", desc: "The classic WSGI microframework, served via Gunicorn.", color: "#ffffff" },
  ],
  faqs: [
    {
      q: "Which Python versions are supported?",
      a: "Python 3.10, 3.11, and 3.12 are available. Pin the version with a runtime file or in the dashboard, and we rebuild on the matching interpreter on every push.",
    },
    {
      q: "How are dependencies installed?",
      a: "We detect requirements.txt, Poetry, or pip-tools, restore a wheel cache, and install before starting your app. Build logs stream live to the web console, and the cache keeps reinstalls fast.",
    },
    {
      q: "Do you run ASGI and WSGI apps?",
      a: "Both. FastAPI and other ASGI apps run under Uvicorn; Flask and Django run under Gunicorn. You can override the start command to tune worker counts for your plan's cores.",
    },
    {
      q: "Can I host a discord.py bot here?",
      a: "Yes. discord.py runs as a persistent service with an always-on gateway connection and automatic reconnects, exactly like our dedicated Discord bot hosting. Secrets are injected as encrypted environment variables.",
    },
    {
      q: "What about background tasks and Celery?",
      a: "Your process is long-lived, so asyncio tasks, APScheduler, and Celery workers all keep running. Use the built-in scheduler for cron-style jobs and add a Redis or Postgres database in a click.",
    },
  ],
  finalCta: {
    title: "Deploy your Python app in 60 seconds",
    description:
      "Connect a repo, push, and your service is live on dedicated Ryzen cores. No DevOps, no servers to manage.",
  },
};

export default function PythonHostingPage() {
  return <HostingLanding config={config} />;
}
