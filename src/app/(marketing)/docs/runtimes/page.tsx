import type { Metadata } from "next";
import { DocsShell } from "../_components/docs-shell";
import { CodeBlock } from "../_components/code-block";
import { DocTitle, H2, P, Code, List, Callout, NextSteps } from "../_components/prose";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Runtimes — Ptero Docs",
  description:
    "Supported workloads on Ptero: Discord bots, Node.js, and Python. Detection, versions, and deployment characteristics.",
};

const WORKLOADS = [
  {
    id: "discord",
    label: "Discord bots",
    mono: "DS",
    color: "#5865f2",
    detect: "discord.js / Eris / discord.py",
    versions: "Managed bot process",
    boot: "27ms gateway",
    note: "Best for long-lived bot processes with slash commands, sharding, and reconnect handling.",
  },
  {
    id: "node",
    label: "Node.js",
    mono: "No",
    color: "#68a063",
    detect: "package.json",
    versions: "18 · 20 · 22",
    boot: "320ms",
    note: "Detected via package.json. Pin with an engines.node field or the runtime config.",
  },
  {
    id: "python",
    label: "Python",
    mono: "Py",
    color: "#3776ab",
    detect: "requirements.txt / pyproject.toml",
    versions: "3.10 – 3.12",
    boot: "410ms",
    note: "Creates an isolated venv and installs from your lockfile.",
  },
] as const;

const PIN_NODE = `# ptero.toml
runtime = "node"

[runtime_config]
version = "20"   # 18 | 20 | 22`;

const DISCORD_ENV = `# .env
DISCORD_TOKEN=***
SHARD_COUNT=auto
LOG_LEVEL=info`;

export default function RuntimesPage() {
  return (
    <DocsShell>
      <DocTitle
        eyebrow="Runtimes"
        title="Runtimes"
        description="Ptero supports three first-class deployment paths: Discord bots, Node.js, and Python. Each is tuned for long-lived processes and fast deploys."
      />

      <H2 id="overview">Overview</H2>
      <div className="overflow-hidden rounded-2xl border border-hairline">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-hairline bg-surface">
              <tr className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                <th className="px-5 py-3 font-medium">Runtime</th>
                <th className="px-5 py-3 font-medium">Detected by</th>
                <th className="px-5 py-3 font-medium">Versions</th>
                <th className="px-5 py-3 font-medium">Cold start</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {WORKLOADS.map((r) => {
                return (
                  <tr key={r.id} className="bg-card transition-colors hover:bg-elevated">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="flex size-7 items-center justify-center rounded-lg border border-hairline font-mono text-[11px] font-bold"
                          style={{ color: r.color, background: `${r.color}14` }}
                        >
                          {r.mono}
                        </span>
                        <span className="font-medium text-ink">{r.label}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12.5px] text-ink-muted">{r.detect}</td>
                    <td className="px-5 py-3 font-mono text-ink-secondary">{r.versions}</td>
                    <td className="px-5 py-3">
                      <Badge variant="accent">{r.boot}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <H2 id="node">Node.js</H2>
      <P>
        Detected from <Code>package.json</Code>. Ptero runs your{" "}
        <Code>install</Code> and <Code>start</Code> scripts and respects an{" "}
        <Code>engines.node</Code> range. Pin a major version explicitly when you
        need reproducibility.
      </P>
      <CodeBlock label="Pin a version" lang="toml" code={PIN_NODE} />

      <H2 id="discord">Discord bots</H2>
      <P>
        Ptero is tuned for long-lived Discord bot processes that need stable
        gateway sessions, fast reconnects, and visible logs. The dashboard,
        console, and monitoring all assume you care about uptime more than toy
        preview deploys.
      </P>
      <CodeBlock label="Typical bot env" lang="bash" code={DISCORD_ENV} />
      <Callout type="tip" title="Best for sharded bots">
        If your bot runs multiple shards or workers, keep each process focused
        and use the dashboard graphs to watch per-process CPU and RAM headroom.
      </Callout>

      <H2 id="python">Python</H2>
      <P>
        Detected from <Code>requirements.txt</Code> or <Code>pyproject.toml</Code>.
        Ptero builds an isolated virtual environment and installs your pinned
        dependencies.
      </P>
      <List
        items={[
          <>Supports <Code>pip</Code>, <Code>poetry</Code> and <Code>uv</Code> lockfiles.</>,
          <>Async frameworks (discord.py, FastAPI) run under a managed supervisor.</>,
        ]}
      />

      <H2>Next steps</H2>
      <NextSteps
        cards={[
          { href: "/docs/deployments", title: "Deployments", desc: "How builds and rollbacks work across supported workloads." },
          { href: "/docs/cli", title: "CLI reference", desc: "Set the runtime and version from your shell." },
        ]}
      />
    </DocsShell>
  );
}
