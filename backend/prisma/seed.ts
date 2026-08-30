import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto.js";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = env.AUTH_ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Admin user already exists: ${email}`);
    return existing;
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: "Administrator",
      role: "OWNER",
      status: "ACTIVE",
      passwordHash: await hashPassword(env.AUTH_ADMIN_PASSWORD),
    },
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEM",
      title: "Welcome to Ptero",
      body: "Your admin account is ready. Connect your Pterodactyl client key in Settings to manage servers.",
    },
  });
  console.log(`✓ Seeded admin user: ${email}`);
  return user;
}

/** Idempotent upsert by `slug` so re-running the seed never duplicates rows. */
async function seedPlans() {
  const plans = [
    {
      slug: "starter",
      name: "Starter",
      tagline: "For side-projects & small bots",
      ramMb: 1024,
      cpuPct: 100,
      diskMb: 5120,
      dbCount: 1,
      backups: 1,
      priceMonth: 400, // $4.00
      priceYear: 4000, // $40.00
      region: "GLOBAL" as const,
      published: true,
      sortIndex: 1,
    },
    {
      slug: "pro",
      name: "Pro",
      tagline: "For production bots & services",
      ramMb: 2048,
      cpuPct: 200,
      diskMb: 20480,
      dbCount: 3,
      backups: 5,
      priceMonth: 1200,
      priceYear: 12000,
      region: "GLOBAL" as const,
      published: true,
      popular: true,
      sortIndex: 2,
    },
    {
      slug: "scale",
      name: "Scale",
      tagline: "For high-traffic workloads",
      ramMb: 4096,
      cpuPct: 400,
      diskMb: 51200,
      dbCount: 8,
      backups: 14,
      priceMonth: 2800,
      priceYear: 28000,
      region: "GLOBAL" as const,
      published: true,
      sortIndex: 3,
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      tagline: "Dedicated capacity & SLA",
      ramMb: 16384,
      cpuPct: 800,
      diskMb: 204800,
      dbCount: 25,
      backups: 30,
      priceMonth: 0,
      priceYear: 0,
      region: "GLOBAL" as const,
      published: true,
      featured: true,
      sortIndex: 4,
    },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { slug: p.slug }, create: p, update: p });
  }
  console.log(`✓ Seeded ${plans.length} plans`);
}

async function seedLocations() {
  const locations = [
    {
      slug: "fra",
      city: "Frankfurt",
      country: "Germany",
      region: "EU",
      flag: "🇩🇪",
      lat: 50.1109,
      lng: 8.6821,
      hardware: "Ryzen 9 7950X · DDR5 · NVMe RAID",
      capacity: 61,
      sortIndex: 1,
    },
    {
      slug: "lon",
      city: "London",
      country: "United Kingdom",
      region: "EU",
      flag: "🇬🇧",
      lat: 51.5074,
      lng: -0.1278,
      hardware: "Ryzen 9 7950X · DDR5 · NVMe RAID",
      capacity: 54,
      sortIndex: 2,
    },
    {
      slug: "iad",
      city: "Ashburn",
      country: "United States",
      region: "US",
      flag: "🇺🇸",
      lat: 39.0438,
      lng: -77.4874,
      hardware: "Ryzen 9 7900X · DDR5 · NVMe RAID",
      capacity: 47,
      sortIndex: 3,
    },
    {
      slug: "sjc",
      city: "San Jose",
      country: "United States",
      region: "US",
      flag: "🇺🇸",
      lat: 37.3382,
      lng: -121.8863,
      hardware: "Ryzen 9 7900X · DDR5 · NVMe RAID",
      capacity: 38,
      sortIndex: 4,
    },
    {
      slug: "ist",
      city: "Istanbul",
      country: "Türkiye",
      region: "TR",
      flag: "🇹🇷",
      lat: 41.0082,
      lng: 28.9784,
      hardware: "Ryzen 9 5950X · DDR4 · NVMe RAID",
      capacity: 72,
      sortIndex: 5,
    },
  ];
  for (const l of locations) {
    await prisma.location.upsert({ where: { slug: l.slug }, create: l, update: l });
  }
  console.log(`✓ Seeded ${locations.length} locations`);
}

async function seedRoadmap() {
  const items = [
    { title: "Deno runtime support", body: "First-class Deno 2.x runtime with permission flags.", status: "PLANNED" as const, votes: 184, category: "Runtime", sortIndex: 1 },
    { title: "Edge regions (APAC)", body: "Singapore & Tokyo datacenters.", status: "PLANNED" as const, votes: 142, category: "Infra", sortIndex: 2 },
    { title: "Team SSO (SAML)", body: "Enterprise SAML / SCIM provisioning.", status: "PLANNED" as const, votes: 96, category: "Security", sortIndex: 3 },
    { title: "Live log search", body: "Full-text search across streaming console logs.", status: "IN_PROGRESS" as const, votes: 211, category: "Console", sortIndex: 1 },
    { title: "Auto-scaling policies", body: "Scale RAM/CPU on threshold rules.", status: "IN_PROGRESS" as const, votes: 167, category: "Compute", sortIndex: 2 },
    { title: "Git deploy previews", body: "Ephemeral preview environments per PR.", status: "COMPLETED" as const, votes: 240, category: "Deploy", sortIndex: 1 },
    { title: "Scoped API keys", body: "Granular permission scopes per key.", status: "COMPLETED" as const, votes: 130, category: "API", sortIndex: 2 },
  ];
  const existingCount = await prisma.roadmapItem.count();
  if (existingCount > 0) {
    console.log(`✓ Roadmap already has ${existingCount} items, skipping seed`);
    return;
  }
  await prisma.roadmapItem.createMany({ data: items });
  console.log(`✓ Seeded ${items.length} roadmap items`);
}

async function seedChangelog() {
  const entries = [
    {
      slug: "v3-8-0",
      version: "v3.8.0",
      title: "Bun 1.1 runtime & faster cold starts",
      body: "Added first-class Bun 1.1 support with sub-200ms cold starts. New websocket reconnect handling in the web console. Per-server deploy timeline visualization.",
      tags: ["feature", "bun", "console"],
      publishedAt: new Date("2026-05-24"),
    },
    {
      slug: "v3-7-2",
      version: "v3.7.2",
      title: "Monitoring graphs & audit log filters",
      body: "Realtime CPU/RAM graphs now stream over websockets. Audit logs can be filtered by actor, type, and date.",
      tags: ["improvement", "monitoring"],
      publishedAt: new Date("2026-05-10"),
    },
    {
      slug: "v3-7-0",
      version: "v3.7.0",
      title: "Scoped API keys",
      body: "Create API keys with granular scopes and expiry. Last-used tracking per key.",
      tags: ["feature", "api"],
      publishedAt: new Date("2026-04-28"),
    },
    {
      slug: "v3-6-5",
      version: "v3.6.5",
      title: "Stability fixes",
      body: "Fixed SFTP timeout under heavy file trees. Resolved a rare backup race condition.",
      tags: ["fix"],
      publishedAt: new Date("2026-04-12"),
    },
  ];
  for (const e of entries) {
    await prisma.changelogEntry.upsert({ where: { slug: e.slug }, create: e, update: e });
  }
  console.log(`✓ Seeded ${entries.length} changelog entries`);
}

async function seedIncidents() {
  const existing = await prisma.incident.count();
  if (existing > 0) {
    console.log(`✓ Incident history already has ${existing} entries, skipping seed`);
    return;
  }
  const inc = await prisma.incident.create({
    data: {
      slug: "inc-2026-05-21",
      title: "Elevated API latency in EU region",
      severity: "MINOR",
      status: "RESOLVED",
      services: ["API", "Dashboard"],
      body: "We observed elevated p95 latency on the EU API edge between 13:55 and 14:42 UTC. Mitigated by rerouting traffic to fra-node-09.",
      startedAt: new Date("2026-05-21T13:55:00Z"),
      resolvedAt: new Date("2026-05-21T14:42:00Z"),
    },
  });
  await prisma.incidentUpdate.createMany({
    data: [
      { incidentId: inc.id, label: "Investigating", body: "We are investigating elevated p95 latency on the EU API edge.", postedAt: new Date("2026-05-21T13:55:00Z") },
      { incidentId: inc.id, label: "Monitoring", body: "Applied a mitigation; observing recovery.", postedAt: new Date("2026-05-21T14:10:00Z") },
      { incidentId: inc.id, label: "Resolved", body: "Latency back to baseline after rerouting traffic to fra-node-09.", postedAt: new Date("2026-05-21T14:42:00Z") },
    ],
  });
  console.log(`✓ Seeded 1 incident with 3 updates`);
}

async function main() {
  await seedAdmin();
  await seedPlans();
  await seedLocations();
  await seedRoadmap();
  await seedChangelog();
  await seedIncidents();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
