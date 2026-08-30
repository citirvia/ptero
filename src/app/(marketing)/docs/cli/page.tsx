import type { Metadata } from "next";
import { DocsShell } from "../_components/docs-shell";
import { CodeBlock } from "../_components/code-block";
import { DocTitle, H2, P, Code, Callout, NextSteps } from "../_components/prose";

export const metadata: Metadata = {
  title: "CLI — Ptero Docs",
  description:
    "Install and use the Ptero CLI to deploy, stream logs, manage secrets and scale your servers from the terminal.",
};

const INSTALL = `# npm
npm install -g @ptero/cli

# verify
ptero --version   # ptero/2.4.0`;

const AUTH = `# Opens your browser to authorize the CLI
ptero login

# Or authenticate non-interactively in CI
export PTERO_API_KEY=ptr_live_a91f...
ptero whoami      # selim@ptero.app (Owner)`;

const COMMANDS = [
  { cmd: "ptero deploy", desc: "Build and ship the current directory to production." },
  { cmd: "ptero deploys list", desc: "Show recent deploys with status and commit." },
  { cmd: "ptero rollback <id>", desc: "Re-promote a previous deploy instantly." },
  { cmd: "ptero logs --follow", desc: "Stream live console output over websockets." },
  { cmd: "ptero env set KEY=val", desc: "Set an environment variable (add --secret to encrypt)." },
  { cmd: "ptero env pull", desc: "Write remote variables to a local .env file." },
  { cmd: "ptero restart", desc: "Restart the running server in under a second." },
  { cmd: "ptero scale --ram 4", desc: "Resize CPU/RAM with no downtime." },
  { cmd: "ptero ssh", desc: "Open an interactive shell into the running server." },
];

const EXAMPLE = `# Deploy, then tail logs until it's healthy
ptero deploy && ptero logs --follow

# Set a secret and trigger a redeploy
ptero env set DISCORD_TOKEN=*** --secret
ptero deploy`;

export default function CliPage() {
  return (
    <DocsShell>
      <DocTitle
        eyebrow="CLI"
        title="Command-line interface"
        description="The Ptero CLI drives everything you can do in the dashboard — deploys, logs, secrets and scaling — straight from your terminal and CI."
      />

      <H2 id="install">Install</H2>
      <P>
        The CLI is published as <Code>@ptero/cli</Code> and ships as a single
        binary. Install it globally with your package manager of choice.
      </P>
      <CodeBlock label="Install" lang="bash" code={INSTALL} />

      <H2 id="auth">Authentication</H2>
      <P>
        Run <Code>ptero login</Code> for interactive use. In CI, set a{" "}
        <Code>PTERO_API_KEY</Code> environment variable with a scoped live key
        and the CLI will pick it up automatically.
      </P>
      <CodeBlock label="Authenticate" lang="bash" code={AUTH} />

      <Callout type="warn" title="Use scoped keys in CI">
        Create a dedicated key limited to <Code>servers:deploy</Code> for your
        pipeline rather than reusing a personal token. Revoke it any time from
        the dashboard.
      </Callout>

      <H2 id="commands">Commands</H2>
      <P>The most common commands. Run <Code>ptero help &lt;command&gt;</Code> for full flags.</P>
      <div className="overflow-hidden rounded-2xl border border-hairline">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-hairline bg-surface">
              <tr className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                <th className="px-5 py-3 font-medium">Command</th>
                <th className="px-5 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {COMMANDS.map((c) => (
                <tr key={c.cmd} className="bg-card transition-colors hover:bg-elevated">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-[13px] text-accent-soft">
                    {c.cmd}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <H2>Putting it together</H2>
      <P>Common workflows chain a few commands together:</P>
      <CodeBlock label="Workflows" lang="bash" code={EXAMPLE} />

      <H2>Next steps</H2>
      <NextSteps
        cards={[
          { href: "/docs/deployments", title: "Deployments", desc: "What happens after ptero deploy." },
          { href: "/docs/runtimes", title: "Runtimes", desc: "Versions, detection, and runtime-specific deploy behavior." },
        ]}
      />
    </DocsShell>
  );
}
