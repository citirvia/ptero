export interface BlogBlock {
  type: "p" | "h2" | "code" | "quote" | "list";
  text?: string;
  lang?: string;
  items?: string[];
}

export interface BlogPost {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string; // ISO
  readMin: number;
  featured?: boolean;
  body: BlogBlock[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "discord-bot-console-upgrade",
    tag: "Product",
    title: "A better live console for Discord bots",
    excerpt:
      "We rebuilt the live console around the things Discord bot developers actually watch: shard health, gateway reconnects, and command latency.",
    author: "Selim Melih",
    authorRole: "Founder",
    date: "2026-05-24",
    readMin: 6,
    featured: true,
    body: [
      {
        type: "p",
        text: "A generic process log tells you that your app is alive. A good Discord bot console tells you whether your shards are healthy, your gateway sessions are stable, and your commands are actually replying on time. That's what we rebuilt.",
      },
      { type: "h2", text: "Built around gateway reality" },
      {
        type: "p",
        text: "Discord bots don't fail like CRUD apps do. They reconnect, they miss heartbeats, they hang on one shard, and they quietly stop responding long before the process fully crashes. The new console surfaces those signals first.",
      },
      {
        type: "code",
        lang: "text",
        text: "[19:42:12.307] [READY] [s00] Logged in as atlas#0420\n[19:42:12.442] [DEBUG] [s00] Session resumed ping=27ms\n[19:42:14.049] [WARN]  [s05] Heartbeat ACK delayed 182ms",
      },
      { type: "h2", text: "What changed" },
      {
        type: "p",
        text: "The console now prioritizes the signals bot developers actually care about:",
      },
      {
        type: "list",
        items: [
          "Shard-specific log prefixes instead of generic process noise",
          "Gateway reconnect and heartbeat anomalies in plain view",
          "Cleaner live output that still feels like a real terminal",
        ],
      },
      {
        type: "quote",
        text: "This is the first hosted console that actually helps me debug a Discord bot instead of just proving the process exists. — an early tester",
      },
      {
        type: "p",
        text: "The updated console is available in every region today. If your bot reconnects, stalls, or starts drifting on command latency, the signal is visible immediately instead of getting buried in generic logs.",
      },
    ],
  },
  {
    slug: "anatomy-of-a-zero-downtime-deploy",
    tag: "Engineering",
    title: "The anatomy of a zero-downtime deploy",
    excerpt:
      "From git push to live traffic in under two seconds. A walk through the build, health-check and traffic-swap pipeline that powers every Ptero deploy.",
    author: "Aylin Kaya",
    authorRole: "Platform Engineer",
    date: "2026-05-12",
    readMin: 8,
    body: [
      {
        type: "p",
        text: "A deploy looks like magic from the outside: you push, and a moment later the new version is live with no dropped requests. Underneath it's a carefully ordered sequence of build, boot, verify and swap. Let's pull it apart.",
      },
      { type: "h2", text: "1. The build" },
      {
        type: "p",
        text: "When your webhook fires, we resolve the exact commit SHA and run your build command in an isolated builder image with dependency layers cached on your lockfile. The output is an immutable artifact addressed by that SHA.",
      },
      { type: "h2", text: "2. Boot and health check" },
      {
        type: "p",
        text: "We boot the new instance alongside the old one. It must pass a health check — by default, binding its port — before it's eligible for traffic.",
      },
      {
        type: "code",
        lang: "toml",
        text: '[run]\nhealthcheck = "/healthz"\nhealthcheck_timeout = "10s"',
      },
      { type: "h2", text: "3. The swap" },
      {
        type: "p",
        text: "Only once the new instance is healthy do we atomically swap the router. The old instance drains in-flight requests, then is parked — warm and ready for an instant rollback.",
      },
      {
        type: "quote",
        text: "The whole point is that a deploy can never make things worse than they already are. If the new version is unhealthy, traffic never moves.",
      },
    ],
  },
  {
    slug: "discord-bot-scaling-guide",
    tag: "Guides",
    title: "Scaling a Discord bot past 100k servers",
    excerpt:
      "Sharding, gateway intents, and memory budgets. A practical guide to keeping a large Discord bot healthy as it grows.",
    author: "Deniz Yıldız",
    authorRole: "Developer Advocate",
    date: "2026-04-30",
    readMin: 9,
    body: [
      {
        type: "p",
        text: "A bot in a hundred servers and a bot in a hundred thousand are different programs. The gateway, your memory budget, and your deploy strategy all change. Here's what to plan for.",
      },
      { type: "h2", text: "Shard early" },
      {
        type: "p",
        text: "Discord recommends one shard per 2,500 guilds. Set up a shard manager before you need it — retrofitting sharding into a single-process bot is painful.",
      },
      {
        type: "code",
        lang: "ts",
        text: 'const manager = new ShardingManager("./bot.js", {\n  totalShards: "auto",\n  token: process.env.DISCORD_TOKEN,\n});\nmanager.spawn();',
      },
      { type: "h2", text: "Mind your intents" },
      {
        type: "list",
        items: [
          "Only request the gateway intents you actually use",
          "GuildMembers and MessageContent are privileged — they dominate memory",
          "Cache selectively; an unbounded user cache will OOM you",
        ],
      },
      {
        type: "quote",
        text: "We caught a memory leak from the dashboard before our users noticed. Realtime graphs paid for themselves in one incident.",
      },
    ],
  },
  {
    slug: "why-bare-metal-still-wins",
    tag: "Infrastructure",
    title: "Why bare-metal still wins for predictable workloads",
    excerpt:
      "Oversubscribed VPS instances are a tax on latency-sensitive apps. We explain why dedicated Ryzen cores change the economics.",
    author: "Selim Melih",
    authorRole: "Founder",
    date: "2026-04-15",
    readMin: 5,
    body: [
      {
        type: "p",
        text: "The cloud taught a generation of developers that hardware is someone else's problem. For most workloads that's true. But for latency-sensitive, steady-state services, the abstraction leaks — and it leaks as noisy neighbors.",
      },
      { type: "h2", text: "The noisy-neighbor tax" },
      {
        type: "p",
        text: "On an oversubscribed VPS, your p99 latency is hostage to whatever else is scheduled on the same physical core. You can't see it, you can't fix it, and it shows up at the worst possible time.",
      },
      { type: "h2", text: "Dedicated cores, predictable tails" },
      {
        type: "p",
        text: "We run on dedicated Ryzen 7950X cores with DDR5 and mirrored Gen4 NVMe. No oversubscription means your tail latency is a function of your code, not your neighbors.",
      },
    ],
  },
  {
    slug: "secrets-management-done-right",
    tag: "Security",
    title: "Secrets management done right",
    excerpt:
      "Encrypted at rest, injected at runtime, never in your repo. How Ptero handles environment secrets and why it matters.",
    author: "Mert Arslan",
    authorRole: "Security Engineer",
    date: "2026-03-28",
    readMin: 6,
    body: [
      {
        type: "p",
        text: "The most common security incident we see isn't a sophisticated attack — it's a token committed to a public repo. Good secrets management makes the safe path the easy path.",
      },
      { type: "h2", text: "Never in the repo" },
      {
        type: "code",
        lang: "bash",
        text: "ptero env set DISCORD_TOKEN=*** --secret",
      },
      {
        type: "p",
        text: "Secrets are encrypted at rest and only decrypted into the process environment at boot. They never appear in build logs, the dashboard, or your config files.",
      },
      {
        type: "list",
        items: [
          "Rotate without downtime — set the new value and redeploy",
          "Scope keys to the minimum permissions they need",
          "Audit every secret change from the audit log",
        ],
      },
    ],
  },
  {
    slug: "building-a-status-page-users-trust",
    tag: "Engineering",
    title: "Building a status page your users actually trust",
    excerpt:
      "Honest incident communication beats five-nines marketing. Lessons from running a public status page during real outages.",
    author: "Aylin Kaya",
    authorRole: "Platform Engineer",
    date: "2026-03-10",
    readMin: 7,
    body: [
      {
        type: "p",
        text: "Trust in infrastructure is earned during incidents, not between them. A status page that's green when users are clearly broken does more damage than no status page at all.",
      },
      { type: "h2", text: "Post before you understand" },
      {
        type: "p",
        text: "The instinct to wait until you have a root cause is the wrong one. Acknowledge fast, even with 'we are investigating', and update on a predictable cadence.",
      },
      {
        type: "quote",
        text: "Users forgive outages. They don't forgive silence.",
      },
      {
        type: "p",
        text: "We publish every incident with a timeline of updates, the affected services, and a clear resolution note. The goal is that someone reading it a year later understands exactly what happened.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
