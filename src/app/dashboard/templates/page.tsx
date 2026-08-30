"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  LayoutTemplate,
  BadgeCheck,
  Eye,
  Rocket,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { type Template } from "@/lib/api/types";
import { useDeleteTemplate, useTemplates } from "@/lib/api/hooks";
import { useAuth } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

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

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const canManageTemplates = user?.role === "OWNER" || user?.role === "ADMIN";
  const templatesQuery = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  const templates = useMemo(
    () => (((templatesQuery.data as unknown[]) ?? []).map(toTemplate)),
    [templatesQuery.data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(q)
        || template.framework.toLowerCase().includes(q)
        || template.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [query, templates]);

  return (
    <>
      <PageHeader
        title="Templates"
        description={
          canManageTemplates
            ? "Browse published custom templates, deploy from them, and manage the catalog."
            : "Browse published custom templates curated by the admin team."
        }
      >
        {canManageTemplates ? (
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/templates/new">
              Create a template
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink-muted">
          Published custom templates
        </div>
        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search custom templates…"
            className="pl-9"
          />
        </div>
      </div>

      <DataState
        query={templatesQuery}
        loading={
          <Card className="overflow-hidden">
            <TableSkeleton rows={6} columns={3} />
          </Card>
        }
        empty={
          <EmptyState
            icon={<LayoutTemplate />}
            title={query ? "No matching templates" : "No custom templates yet"}
            description={
              query
                ? "No custom templates match your search."
                : "Published custom templates will appear here as they are approved."
            }
          />
        }
        isEmpty={() => filtered.length === 0}
      >
        {() => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((template) => (
              <Card
                key={template.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/templates/${template.slug}`)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  router.push(`/dashboard/templates/${template.slug}`);
                }}
                className="group flex cursor-pointer flex-col p-5 transition-all duration-300 hover:border-hairline2 hover:shadow-glow"
              >
                <div className="flex items-start gap-3">
                  <RuntimeMark template={template} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold text-ink">
                        {template.name}
                      </h3>
                      {template.official && (
                        <BadgeCheck className="size-4 shrink-0 text-accent-soft" />
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-ink-muted">
                      {template.framework} · {template.language}
                    </p>
                  </div>
                  <Badge variant="outline">Template</Badge>
                </div>

                <p className="mt-3 line-clamp-2 flex-1 text-sm text-ink-muted">
                  {template.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/dashboard/templates/${template.slug}`);
                      }}
                    >
                      <Eye className="size-4" />
                      View page
                    </Button>
                    {template.eggId && template.nestId ? (
                      <Button
                        asChild
                        size="sm"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Link href={`/dashboard/servers/new?template=${template.id}`}>
                          <Rocket className="size-4" />
                          Use template
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                  {canManageTemplates ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deleteTemplate.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!window.confirm(`Delete "${template.name}" from the catalog?`)) return;
                        deleteTemplate.mutate(template.id, {
                          onSuccess: () => toast.success("Template deleted."),
                          onError: (error: Error) => toast.error(error.message),
                        });
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </DataState>
    </>
  );
}

function RuntimeMark({ template }: { template: Template }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl border border-hairline font-mono text-sm font-bold",
      )}
      style={{ color: template.color, background: `${template.color}1f` }}
      title={template.framework}
    >
      {template.abbr}
    </span>
  );
}
