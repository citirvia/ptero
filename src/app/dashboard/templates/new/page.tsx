"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import JSZip from "jszip";
import { ArrowLeft, ArrowRight, Check, FolderUp, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/api/auth";
import { useDeployMetadata, useSubmitTemplate } from "@/lib/api/hooks";
import { RUNTIME_META } from "@/lib/api/types";
import { cn } from "@/lib/utils";

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

const RUNTIMES = ["node", "bun", "python", "docker"] as const;
const MAX_TEMPLATE_ARCHIVE_BYTES = 15 * 1024 * 1024;

type DeployEgg = {
  id: number;
  nestId: number;
  name: string;
};

type ArchiveSelectablePath = {
  path: string;
  type: "file" | "dir";
};

type ArchiveDraft = {
  archiveName: string;
  archiveBase64: string;
  selectablePaths: ArchiveSelectablePath[];
  visiblePaths: string[];
};

function normalizeArchivePath(input: string) {
  const normalized = input.replace(/\\/g, "/").trim().replace(/^\/+/, "");
  const parts = normalized
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) return "";
  return parts.join("/");
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let output = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    const chunk = bytes.subarray(index, index + 0x8000);
    output += String.fromCharCode(...chunk);
  }
  return btoa(output);
}

async function inspectArchive(file: File): Promise<ArchiveDraft> {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Template package must be a .zip file.");
  }
  if (file.size <= 0 || file.size > MAX_TEMPLATE_ARCHIVE_BYTES) {
    throw new Error("Template package must be smaller than 15 MB.");
  }

  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const files = new Set<string>();
  const directories = new Set<string>();

  for (const rawPath of Object.keys(zip.files)) {
    const normalized = normalizeArchivePath(rawPath);
    if (!normalized || normalized.startsWith("__MACOSX/")) continue;
    const entry = zip.files[rawPath];
    const segments = normalized.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      directories.add(segments.slice(0, index).join("/"));
    }
    if (entry?.dir) {
      directories.add(normalized);
    } else {
      files.add(normalized);
    }
  }

  const selectablePaths = [
    ...Array.from(directories, (path) => ({ path, type: "dir" as const })),
    ...Array.from(files, (path) => ({ path, type: "file" as const })),
  ].sort((left, right) => left.path.localeCompare(right.path));

  if (selectablePaths.length === 0) {
    throw new Error("The zip archive does not contain any usable files.");
  }

  return {
    archiveName: file.name,
    archiveBase64: arrayBufferToBase64(buffer),
    selectablePaths,
    visiblePaths: selectablePaths
      .filter((entry) => /(^|\/)(\.env(\.[^/]+)?|config[^/]*\.(json|js|ts|yaml|yml|toml|ini))$/i.test(entry.path))
      .map((entry) => entry.path)
      .slice(0, 8),
  };
}

export default function NewTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const canManageTemplates = user?.role === "OWNER" || user?.role === "ADMIN";
  const deployMetaQuery = useDeployMetadata(canManageTemplates);
  const submitTemplate = useSubmitTemplate();

  const [step, setStep] = useState(0);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveDraft, setArchiveDraft] = useState<ArchiveDraft | null>(null);
  const [form, setForm] = useState({
    name: "",
    framework: "",
    runtime: "node",
    category: "Starter",
    language: "",
    eggId: "",
    tags: "",
    description: "",
  });

  const adminEggs = useMemo<DeployEgg[]>(() => {
    const rows = ((deployMetaQuery.data as { eggs?: unknown[] } | undefined)?.eggs ?? []);
    return rows.flatMap((raw) => {
      const egg = raw as Record<string, unknown>;
      const id = Number(egg.id);
      const nestId = Number(egg.nest);
      const name = String(egg.name ?? "").trim();
      if (!Number.isInteger(id) || !Number.isInteger(nestId) || !name) return [];
      return [{ id, nestId, name }];
    });
  }, [deployMetaQuery.data]);

  const selectedEgg = adminEggs.find((egg) => egg.id === Number(form.eggId)) ?? null;
  const tags = form.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const detailsReady =
    Boolean(form.name.trim())
    && Boolean(form.framework.trim())
    && Boolean(form.language.trim())
    && Boolean(form.description.trim())
    && Boolean(selectedEgg);
  const packageReady = Boolean(archiveDraft);
  const visibilityReady = Boolean(archiveDraft && archiveDraft.visiblePaths.length > 0);

  const steps = [
    { title: "Details", description: "Basic metadata and deploy source" },
    { title: "Package", description: "Upload the template zip" },
    { title: "Visibility", description: "Choose visible files and folders" },
  ];

  function validateStep(index: number) {
    if (index === 0) {
      if (!form.name.trim() || !form.framework.trim() || !form.language.trim() || !form.description.trim()) {
        toast.error("Fill in all required template details first.");
        return false;
      }
      if (!selectedEgg) {
        toast.error("Choose a deploy source first.");
        return false;
      }
    }
    if (index === 1 && !archiveDraft) {
      toast.error("Upload a template zip package first.");
      return false;
    }
    return true;
  }

  if (!canManageTemplates) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Create Template" description="Only admin accounts can create templates." />
        <EmptyState
          icon={<PackageOpen />}
          title="Admin access required"
          description="Switch to an admin account to create or package templates."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Create Template"
        description="Build a deployable template in clear steps without the modal scroll bug."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/templates">
            <ArrowLeft className="size-4" />
            Back to templates
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="space-y-3 p-4">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                if (index > step && !validateStep(step)) return;
                setStep(index);
              }}
              className={cn(
                "w-full rounded-2xl border p-3 text-left transition-colors",
                step === index ? "border-accent/40 bg-accent/[0.08]" : "border-line hover:border-line-hover",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                    step > index
                      ? "border-accent/40 bg-accent/15 text-accent-soft"
                      : step === index
                        ? "border-accent/40 bg-accent/10 text-accent-soft"
                        : "border-line text-ink-muted",
                  )}
                >
                  {step > index ? <Check className="size-4" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink-muted">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </Card>

        <Card className="space-y-6 p-5 sm:p-6">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-ink">Template details</h2>
                <p className="text-sm text-ink-muted">
                  Define the catalog entry and pick the egg this template should deploy with.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Template name" htmlFor="name">
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="discord-ticket-bot"
                  />
                </Field>
                <Field label="Framework" htmlFor="framework">
                  <Input
                    id="framework"
                    value={form.framework}
                    onChange={(event) => setForm((current) => ({ ...current, framework: event.target.value }))}
                    placeholder="discord.js"
                  />
                </Field>
                <Field label="Runtime" htmlFor="runtime">
                  <select
                    id="runtime"
                    value={form.runtime}
                    onChange={(event) => setForm((current) => ({ ...current, runtime: event.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors duration-200 hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {RUNTIMES.map((runtime) => (
                      <option key={runtime} value={runtime}>
                        {RUNTIME_META[runtime].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Category" htmlFor="category">
                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors duration-200 hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Language" htmlFor="language">
                  <Input
                    id="language"
                    value={form.language}
                    onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                    placeholder="TypeScript"
                  />
                </Field>
                <Field
                  label="Deploy source"
                  htmlFor="eggId"
                  hint={deployMetaQuery.isLoading ? "Loading eggs..." : `${adminEggs.length} eggs available`}
                >
                  <select
                    id="eggId"
                    value={form.eggId}
                    onChange={(event) => setForm((current) => ({ ...current, eggId: event.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors duration-200 hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    disabled={deployMetaQuery.isLoading || adminEggs.length === 0}
                  >
                    <option value="">Select an egg</option>
                    {adminEggs.map((egg) => (
                      <option key={egg.id} value={egg.id}>
                        {egg.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Tags" htmlFor="tags" hint="Comma-separated, max 8 tags">
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="discord, moderation, tickets"
                />
              </Field>

              <Field label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  placeholder="Explain what the template includes and who it is for."
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-ink">Upload package</h2>
                <p className="text-sm text-ink-muted">
                  Upload a `.zip` archive. The next step lets you choose which files or folders should stay visible in the dashboard.
                </p>
              </div>

              <Card className="border-dashed p-5">
                <div className="flex items-start gap-3">
                  <FolderUp className="mt-0.5 size-5 text-accent-soft" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="font-medium text-ink">Template package</p>
                      <p className="text-sm text-ink-muted">
                        Upload one `.zip` file up to 15 MB.
                      </p>
                    </div>

                    <Input
                      type="file"
                      accept=".zip,application/zip"
                      onChange={async (event) => {
                        const file = event.currentTarget.files?.[0];
                        if (!file) {
                          setArchiveDraft(null);
                          return;
                        }
                        setArchiveBusy(true);
                        try {
                          const nextDraft = await inspectArchive(file);
                          setArchiveDraft(nextDraft);
                          toast.success(`Loaded ${nextDraft.selectablePaths.length} template paths.`);
                        } catch (error) {
                          event.currentTarget.value = "";
                          setArchiveDraft(null);
                          toast.error((error as Error).message);
                        } finally {
                          setArchiveBusy(false);
                        }
                      }}
                    />

                    {archiveDraft ? (
                      <div className="rounded-xl border border-line bg-elevated/30 p-3 text-sm">
                        <p className="font-medium text-ink">{archiveDraft.archiveName}</p>
                        <p className="text-xs text-ink-muted">
                          {archiveDraft.selectablePaths.length} files and folders ready for the visibility step.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Visible files and folders</h2>
                  <p className="text-sm text-ink-muted">
                    Select the files or folders you want users to see in the dashboard after the template is deployed.
                  </p>
                </div>
                <Badge variant="outline">
                  {archiveDraft?.visiblePaths.length ?? 0} selected
                </Badge>
              </div>

              {!archiveDraft ? (
                <EmptyState
                  icon={<PackageOpen />}
                  title="No package uploaded"
                  description="Go back one step and upload a template zip first."
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setArchiveDraft((current) =>
                          current
                            ? { ...current, visiblePaths: current.selectablePaths.map((entry) => entry.path) }
                            : current,
                        )
                      }
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setArchiveDraft((current) =>
                          current ? { ...current, visiblePaths: [] } : current,
                        )
                      }
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="grid max-h-[560px] gap-2 overflow-y-auto rounded-2xl border border-line bg-elevated/20 p-3 sm:grid-cols-2">
                    {archiveDraft.selectablePaths.map((entry) => {
                      const checked = archiveDraft.visiblePaths.includes(entry.path);
                      return (
                        <label
                          key={entry.path}
                          className="flex items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm hover:border-line hover:bg-overlay"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setArchiveDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      visiblePaths: event.target.checked
                                        ? [...current.visiblePaths, entry.path]
                                        : current.visiblePaths.filter((path) => path !== entry.path),
                                    }
                                  : current,
                              )
                            }
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-ink">{entry.path}</span>
                            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                              {entry.type}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                type="button"
                disabled={archiveBusy}
                onClick={() => {
                  if (!validateStep(step)) return;
                  setStep((current) => Math.min(steps.length - 1, current + 1));
                }}
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={submitTemplate.isPending || !detailsReady || !packageReady || !visibilityReady}
                onClick={() => {
                  if (!validateStep(0) || !validateStep(1) || !archiveDraft || archiveDraft.visiblePaths.length === 0) {
                    if (archiveDraft && archiveDraft.visiblePaths.length === 0) {
                      toast.error("Choose at least one file or folder to show in the dashboard.");
                    }
                    return;
                  }

                  submitTemplate.mutate(
                    {
                      name: form.name.trim(),
                      description: form.description.trim(),
                      runtime: form.runtime,
                      framework: form.framework.trim(),
                      category: form.category,
                      language: form.language.trim(),
                      tags,
                      eggId: selectedEgg!.id,
                      nestId: selectedEgg!.nestId,
                      archiveName: archiveDraft.archiveName,
                      archiveBase64: archiveDraft.archiveBase64,
                      visiblePaths: archiveDraft.visiblePaths,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Template created successfully.");
                        router.push("/dashboard/templates");
                      },
                      onError: (error: Error) => toast.error(error.message),
                    },
                  );
                }}
              >
                {submitTemplate.isPending ? "Creating..." : "Create template"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
