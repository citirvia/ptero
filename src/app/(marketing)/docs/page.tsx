import type { Metadata } from "next";
import { Rocket, GitBranch, Boxes, TerminalSquare } from "lucide-react";
import { DocsShell } from "./_components/docs-shell";
import { CodeBlock } from "./_components/code-block";
import {
  DocTitle,
  H2,
  H3,
  P,
  Code,
  List,
  Callout,
  NextSteps,
} from "./_components/prose";

export const metadata: Metadata = {
  title: "Docs — Ptero",
  description:
    "Everything you need to deploy and run Discord bots, Node.js apps, and Python services on Ptero. Quickstart, deployments, runtimes and the CLI.",
};

const INSTALL = `# Install the Ptero CLI
npm install -g @ptero/cli

# Log in (opens your browser)
ptero login`;

const DEPLOY = `# Inside your project directory
ptero init           # creates ptero.toml
ptero deploy         # builds & ships to production

# ...or just connect a Git repo and push
git push origin main`;

const CONFIG = `# ptero.toml
name = "atlas-bot"
runtime = "node"          # node | python
region = "fra"            # fra | iad | ist | lon | sjc

[build]
command = "npm ci && npm run build"

[run]
command = "node dist/index.js"

[env]
NODE_ENV = "production"
LOG_LEVEL = "info"`;

export default function DocsHubPage() {
  return (
    <DocsShell>
      <DocTitle
        eyebrow="Getting Started"
        title="Introduction"
        description="Ptero runs your bots, services and runtimes on bare-metal Ryzen infrastructure. Push code, get a live deploy, and monitor it in realtime — no DevOps required."
      />

      <P>
        These docs walk you from zero to a running deploy. If you already have a
        project, the fastest path is to install the CLI, run{" "}
        <Code>ptero deploy</Code>, and watch it go live. Everything you configure
        in the dashboard can also be expressed in a checked-in{" "}
        <Code>ptero.toml</Code>.
      </P>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-overlay2 sm:grid-cols-2">
        {[
          { icon: Rocket, title: "Quickstart", desc: "Ship your first app in under a minute." },
          { icon: GitBranch, title: "Git deploys", desc: "Push to a branch, get an automatic build." },
          { icon: Boxes, title: "Runtimes", desc: "Discord bots, Node.js, and Python." },
          { icon: TerminalSquare, title: "CLI", desc: "Drive deploys, logs and secrets from your shell." },
        ].map((c) => (
          <div key={c.title} className="bg-card p-5">
            <c.icon className="mb-3 size-5 text-accent-soft" />
            <p className="font-semibold text-ink">{c.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      <H2 id="quickstart">Quickstart</H2>
      <P>
        Install the CLI and authenticate. The login flow opens your browser and
        writes a scoped token to <Code>~/.ptero/config.json</Code>.
      </P>
      <CodeBlock label="Install" lang="bash" code={INSTALL} />

      <H3>Deploy your project</H3>
      <P>
        From your project root, initialize a config and deploy. Ptero detects
        your runtime, runs the build, provisions a server and routes traffic to
        it once it passes a health check.
      </P>
      <CodeBlock label="Deploy" lang="bash" code={DEPLOY} />

      <Callout type="tip" title="Zero-config deploys">
        If we can detect your runtime (a <Code>package.json</Code> or{" "}
        <Code>requirements.txt</Code>), you can skip{" "}
        <Code>ptero init</Code> entirely and run <Code>ptero deploy</Code>{" "}
        straight away.
      </Callout>

      <H2 id="project-config">Project config</H2>
      <P>
        <Code>ptero.toml</Code> is the source of truth for your deploy. Commit it
        to your repo so every environment builds the same way. Dashboard changes
        are merged on top at deploy time.
      </P>
      <CodeBlock label="ptero.toml" lang="toml" code={CONFIG} />

      <H3>Key fields</H3>
      <List
        items={[
          <>
            <Code>runtime</Code> — pins the language runtime. Defaults to
            auto-detection.
          </>,
          <>
            <Code>region</Code> — the datacenter your server is provisioned in.
          </>,
          <>
            <Code>[build].command</Code> — runs once per deploy in an isolated
            builder.
          </>,
          <>
            <Code>[run].command</Code> — the long-running process. Restarted
            automatically if it exits.
          </>,
          <>
            <Code>[env]</Code> — non-secret variables. Use{" "}
            <Code>ptero env set</Code> for secrets.
          </>,
        ]}
      />

      <Callout type="warn" title="Secrets never go in ptero.toml">
        Anything sensitive — tokens, database URLs — should be set with{" "}
        <Code>ptero env set KEY=value --secret</Code> so it is encrypted at rest
        and never committed to your repo.
      </Callout>

      <H2>Next steps</H2>
      <NextSteps
        cards={[
          { href: "/docs/deployments", title: "Deployments", desc: "Git deploys, build pipeline and instant rollbacks." },
          { href: "/docs/runtimes", title: "Runtimes", desc: "Per-runtime detection, versions and cold-start tuning." },
          { href: "/docs/cli", title: "CLI reference", desc: "Every command for deploys, logs, env and scaling." },
        ]}
      />
    </DocsShell>
  );
}
