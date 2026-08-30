import type { Metadata } from "next";
import { DocsShell } from "../_components/docs-shell";
import { CodeBlock } from "../_components/code-block";
import { DocTitle, H2, H3, P, Code, List, Callout, NextSteps } from "../_components/prose";

export const metadata: Metadata = {
  title: "Deployments — Ptero Docs",
  description:
    "How deploys work on Ptero: Git integration, the build pipeline, health checks and instant rollbacks.",
};

const GIT_DEPLOY = `# Connect once from the dashboard, then:
git push origin main

# Ptero receives the webhook, builds the commit,
# boots a fresh instance, health-checks it, and
# swaps traffic over with zero downtime.`;

const HOOK = `[build]
command = "npm ci && npm run build"
# Optional lifecycle hooks
pre_deploy = "npm run migrate"
post_deploy = "curl -fsS $HEALTHCHECK_URL"`;

const ROLLBACK = `# List recent deploys
ptero deploys list

# ID        COMMIT   STATUS    AGE
# d1        3f2a1c   live      4m
# d2        a91be4   inactive  21h
# d3        7c0d22   inactive  2d

# Roll back to a previous deploy instantly
ptero rollback d2`;

export default function DeploymentsPage() {
  return (
    <DocsShell>
      <DocTitle
        eyebrow="Deployments"
        title="Deployments"
        description="A deploy turns a commit into a running instance. Ptero builds in an isolated environment, health-checks the result, and only then routes production traffic to it."
      />

      <H2 id="git">Git deploys</H2>
      <P>
        Connect a GitHub or GitLab repository and pick a production branch. Every
        push to that branch triggers a new deploy. Pull requests can optionally
        spin up ephemeral preview environments that are torn down on merge.
      </P>
      <CodeBlock label="Push to deploy" lang="bash" code={GIT_DEPLOY} />

      <List
        items={[
          <>Builds run on the exact commit SHA — no drift between environments.</>,
          <>
            Each deploy is immutable and addressable by its short SHA for
            auditing and rollback.
          </>,
          <>
            Status is reported back to your Git provider as a commit check.
          </>,
        ]}
      />

      <H2 id="builds">Builds</H2>
      <P>
        The build runs your <Code>[build].command</Code> in a clean builder
        image with your repo mounted. The resulting artifact is cached and shipped
        to your server. Lifecycle hooks let you run migrations or warm caches
        around the swap.
      </P>
      <CodeBlock label="ptero.toml" lang="toml" code={HOOK} />

      <Callout type="info" title="Build cache">
        Dependency layers are cached between deploys keyed on your lockfile. A
        no-dependency change typically builds in a few seconds.
      </Callout>

      <H3>Health checks</H3>
      <P>
        Before traffic is swapped, the new instance must pass a health check.
        By default Ptero waits for the process to bind its port; you can override
        this with an HTTP path or a custom command.
      </P>

      <H2 id="rollbacks">Rollbacks</H2>
      <P>
        Every previous deploy stays warm and ready. Rolling back re-promotes a
        prior immutable deploy — there is no rebuild, so it completes in under a
        second.
      </P>
      <CodeBlock label="Rollback" lang="bash" code={ROLLBACK} />

      <Callout type="tip" title="One click in the dashboard">
        The deploy timeline shows every build with its commit, author and
        duration. Hover any entry and click <Code>Promote</Code> to roll back
        without touching the CLI.
      </Callout>

      <H2>Next steps</H2>
      <NextSteps
        cards={[
          { href: "/docs/runtimes", title: "Runtimes", desc: "Tune builds and cold starts per runtime." },
          { href: "/docs/cli", title: "CLI reference", desc: "Drive deploys and rollbacks from your shell." },
        ]}
      />
    </DocsShell>
  );
}
