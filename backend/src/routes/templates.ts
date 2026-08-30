import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import {
  deleteTemplatePackage,
  inspectTemplatePackage,
  persistTemplatePackage,
  validateTemplateVisiblePaths,
} from "../lib/template-packages.js";

const RUNTIMES = ["node", "bun", "python", "docker"] as const;
const CATEGORIES = [
  "Starter",
  "Framework",
  "Music",
  "Moderation",
  "Economy",
  "AI",
  "Utility",
  "Tickets",
] as const;

const tagSchema = z.string().trim().min(1).max(24);
const submissionBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(12).max(600),
  runtime: z.enum(RUNTIMES),
  framework: z.string().trim().min(2).max(50),
  category: z.enum(CATEGORIES),
  language: z.string().trim().min(2).max(30),
  tags: z.array(tagSchema).min(1).max(8),
  repoUrl: z.string().trim().url().max(300),
  notes: z.string().trim().max(1200).optional(),
});
type SubmissionBody = z.infer<typeof submissionBody>;

const templateCreateBody = submissionBody.omit({ repoUrl: true, notes: true }).extend({
  eggId: z.coerce.number().int().positive(),
  nestId: z.coerce.number().int().positive(),
  archiveName: z.string().trim().min(1).max(120),
  archiveBase64: z.string().trim().min(1),
  visiblePaths: z.array(z.string().trim().min(1).max(300)).min(1).max(64),
});
type TemplateCreateBody = z.infer<typeof templateCreateBody>;

function normalizeRepoUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:") {
    throw new Error("Template repositories must use an https URL.");
  }
  if (url.username || url.password) {
    throw new Error("Repository URLs cannot include embedded credentials.");
  }
  url.hash = "";
  return url.toString();
}

function runtimeColor(runtime: (typeof RUNTIMES)[number]) {
  if (runtime === "node") return "#68a063";
  if (runtime === "bun") return "#5865f2";
  if (runtime === "python") return "#4b8bbe";
  return "#2496ed";
}

async function uniqueTemplateSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.customTemplate.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "template";
}

function toAbbr(input: string) {
  return (
    input
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TP"
  );
}

export async function templateRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.get("/templates", async () => {
    const items = await prisma.customTemplate.findMany({
      where: { published: true },
      orderBy: [
        { official: "desc" },
        { popular: "desc" },
        { createdAt: "desc" },
      ],
    });
    return { items };
  });

  app.get(
    "/templates/:slug",
    {
      schema: { params: z.object({ slug: z.string().trim().min(1).max(80) }) },
    },
    async (req, reply) => {
      const item = await prisma.customTemplate.findFirst({
        where: {
          published: true,
          slug: req.params.slug,
        },
      });
      if (!item) {
        return reply.code(404).send({
          error: "TemplateNotFound",
          message: "Template not found.",
        });
      }
      return { item };
    },
  );

  app.post(
    "/templates",
    {
      onRequest: app.requireAdmin,
      bodyLimit: 20 * 1024 * 1024,
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: { body: templateCreateBody },
    },
    async (req, reply) => {
      const body = req.body as TemplateCreateBody;
      const slug = await uniqueTemplateSlug(body.name);
      const inspected = await inspectTemplatePackage(body.archiveName, body.archiveBase64);
      const visiblePaths = validateTemplateVisiblePaths(body.visiblePaths, inspected.selectablePaths);

      const normalizedTags = Array.from(
        new Set(body.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
      ).slice(0, 8);

      let template:
        | Awaited<ReturnType<typeof prisma.customTemplate.create>>
        | null = null;
      try {
        template = await prisma.customTemplate.create({
          data: {
            slug,
            name: body.name,
            description: body.description,
            runtime: body.runtime,
            framework: body.framework,
            category: body.category,
            language: body.language,
            tags: normalizedTags,
            author: req.user.name,
            official: false,
            popular: false,
            abbr: toAbbr(body.name),
            color: runtimeColor(body.runtime),
            eggId: body.eggId,
            nestId: body.nestId,
            packageArchiveName: inspected.archiveName,
            visiblePaths,
            published: true,
          },
        });
        const stored = await persistTemplatePackage(
          template.id,
          inspected.archiveName,
          inspected.archiveBytes,
        );
        template = await prisma.customTemplate.update({
          where: { id: template.id },
          data: { packageStorageKey: stored.storageKey },
        });
      } catch (error) {
        if (template?.id) {
          await prisma.customTemplate.delete({ where: { id: template.id } }).catch(() => {});
        }
        throw error;
      }

      return reply.code(201).send({ template });
    },
  );

  app.delete(
    "/templates/:id",
    {
      onRequest: app.requireAdmin,
      schema: { params: z.object({ id: z.string().min(1) }) },
    },
    async (req, reply) => {
      const existing = await prisma.customTemplate.findUnique({
        where: { id: req.params.id },
        select: { id: true, packageStorageKey: true },
      });
      if (!existing) {
        return reply.code(404).send({
          error: "TemplateNotFound",
          message: "Template not found.",
        });
      }
      await deleteTemplatePackage(existing.packageStorageKey).catch(() => {});
      await prisma.customTemplate.delete({ where: { id: existing.id } });
      return reply.code(204).send();
    },
  );

  app.get(
    "/templates/submissions",
    { onRequest: app.requireAdmin },
    async (req) => {
      const items = await prisma.templateSubmission.findMany({
        where: { userId: req.user.sub },
        orderBy: { createdAt: "desc" },
      });
      return { items };
    },
  );

  app.post(
    "/templates/submissions",
    {
      onRequest: app.requireAdmin,
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: { body: submissionBody },
    },
    async (req, reply) => {
      const body = req.body as SubmissionBody;
      let normalizedRepo: string;
      try {
        normalizedRepo = normalizeRepoUrl(body.repoUrl);
      } catch (error) {
        return reply.code(400).send({
          error: "InvalidRepositoryUrl",
          message: (error as Error).message,
        });
      }
      const normalizedTags = Array.from(
        new Set(body.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
      ).slice(0, 8);

      const duplicateWindow = new Date(Date.now() - 15 * 60_000);
      const duplicate = await prisma.templateSubmission.findFirst({
        where: {
          userId: req.user.sub,
          name: body.name,
          repoUrl: normalizedRepo,
          createdAt: { gte: duplicateWindow },
        },
      });

      if (duplicate) {
        return reply.code(409).send({
          error: "DuplicateSubmission",
          message: "A similar template submission was sent recently. Please wait a bit before trying again.",
        });
      }

      const submission = await prisma.templateSubmission.create({
        data: {
          userId: req.user.sub,
          name: body.name,
          description: body.description,
          runtime: body.runtime,
          framework: body.framework,
          category: body.category,
          language: body.language,
          tags: normalizedTags,
          repoUrl: normalizedRepo,
          notes: body.notes,
        },
      });
      return reply.code(201).send({ submission });
    },
  );
}

export { CATEGORIES as TEMPLATE_CATEGORIES, RUNTIMES as TEMPLATE_RUNTIMES, slugify, toAbbr };
