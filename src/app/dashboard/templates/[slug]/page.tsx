"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  LayoutTemplate,
  PlayCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useTemplate } from "@/lib/api/hooks";
import { RUNTIME_META, type Template } from "@/lib/api/types";

function toTemplate(raw: unknown): Template {
  const row = raw as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? row.id ?? ""),
    name: String(row.name ?? "Untitled template"),
    description: String(row.description ?? ""),
    runtime: String(row.runtime ?? "docker") as Template["runtime"],
    framework: String(row.framework ?? row.name ?? "Custom"),
    category: String(row.category ?? "Starter") as Template["category"],
    language: String(row.language ?? "Unknown"),
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
    deploys: Number(row.deploys ?? 0),
    stars: Number(row.stars ?? 0),
    author: String(row.author ?? "Ptero"),
    official: Boolean(row.official),
    popular: Boolean(row.popular),
    abbr: String(row.abbr ?? "TP"),
    color: String(row.color ?? "#2f6b85"),
    eggId: typeof row.eggId === "number" ? row.eggId : undefined,
    nestId: typeof row.nestId === "number" ? row.nestId : undefined,
    visiblePaths: Array.isArray(row.visiblePaths)
      ? row.visiblePaths.map((item) => String(item))
      : [],
    packageArchiveName:
      typeof row.packageArchiveName === "string" ? row.packageArchiveName : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

function formatDate(value?: string) {
  if (!value) return "Recently published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function buildVideoCards(template: Template) {
  return [
    {
      title: "Quick walkthrough",
      body: `A short visual tour for ${template.name} can live here so users immediately see the boot flow, file layout, and expected outcome.`,
    },
    {
      title: "Setup checklist",
      body: "Use this slot for a concise install video or screen capture that covers secrets, startup, and post-deploy checks.",
    },
  ];
}

export default function TemplateDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const templateQuery = useTemplate(slug ?? "", Boolean(slug));

  const template = useMemo(
    () => (templateQuery.data ? toTemplate(templateQuery.data) : null),
    [templateQuery.data],
  );
  const videos = useMemo(() => (template ? buildVideoCards(template) : []), [template]);

  if (templateQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card className="h-56 animate-pulse rounded-[28px] border border-line bg-card/70" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <Card className="h-80 animate-pulse rounded-[28px] border border-line bg-card/70" />
          <Card className="h-80 animate-pulse rounded-[28px] border border-line bg-card/70" />
        </div>
      </div>
    );
  }

  if (templateQuery.isError || !template) {
    return (
      <EmptyState
        icon={<LayoutTemplate />}
        title="Template not found"
        description="This template page could not be loaded or is no longer available."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/templates">
              <ArrowLeft className="size-4" />
              Back to templates
            </Link>
          </Button>
        }
      />
    );
  }

  const runtime = RUNTIME_META[template.runtime];
  const publishedLabel = formatDate(template.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/templates">
            <ArrowLeft className="size-4" />
            Back to templates
          </Link>
        </Button>
        <Badge variant="outline">{publishedLabel}</Badge>
      </div>

      <section className="relative overflow-hidden rounded-[32px] border border-line bg-card">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `radial-gradient(circle at 14% 18%, ${template.color}30, transparent 28%),
linear-gradient(135deg, rgba(8,12,18,0.98) 0%, rgba(11,18,28,0.94) 45%, rgba(9,16,24,0.98) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-25" />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,1.4fr)_340px] lg:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{runtime.label}</Badge>
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant="outline">{template.language}</Badge>
              {template.official ? (
                <Badge variant="online">
                  <BadgeCheck className="size-3.5" />
                  Official
                </Badge>
              ) : null}
              {template.popular ? <Badge variant="accent">Popular</Badge> : null}
            </div>

            <div className="flex items-start gap-4">
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-[22px] border border-white/10 font-mono text-xl font-bold text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                style={{ background: `${template.color}26` }}
              >
                {template.abbr}
              </span>
              <div className="min-w-0">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {template.name}
                </h1>
                <p className="mt-2 max-w-3xl text-base leading-7 text-white/72">
                  {template.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/72"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Metric label="Framework" value={template.framework} />
              <Metric label="Author" value={template.author} />
              <Metric label="Published" value={publishedLabel} />
              <Metric label="Runtime" value={runtime.label} />
            </div>
          </div>
        </div>
      </section>

      <Card className="rounded-[28px] border border-line bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <LayoutTemplate className="size-4 text-accent-soft" />
          Description
        </div>
        <p className="mt-4 text-[15px] leading-7 text-ink-muted">
          {template.description}
        </p>
      </Card>

      <Card className="overflow-hidden rounded-[28px] border border-line bg-card">
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ImageIcon className="size-4 text-accent-soft" />
            Photos
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="relative min-h-[220px] overflow-hidden rounded-[24px] border border-line"
              style={{
                background: `linear-gradient(135deg, ${template.color}1e, rgba(16,20,28,0.94) 72%)`,
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_32%)]" />
              <div className="relative flex h-full flex-col justify-end p-5">
                <span className="mb-3 inline-flex w-fit rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/72">
                  Preview {item}
                </span>
                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  Template preview image area.
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[28px] border border-line bg-card">
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <PlayCircle className="size-4 text-accent-soft" />
            Videos
          </div>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div
            className="relative overflow-hidden rounded-[26px] border border-line p-6"
            style={{
              background: `linear-gradient(135deg, ${template.color}20, rgba(16,20,28,0.92) 70%)`,
            }}
          >
            <div className="flex min-h-[220px] flex-col justify-end">
              <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                <PlayCircle className="size-7" />
              </span>
              <h3 className="text-2xl font-semibold tracking-tight text-white">
                {template.name} video
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
                Template video area.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {videos.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-line bg-elevated/35 p-4"
              >
                <h3 className="font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/48">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
