"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Sparkles,
  CircleCheck,
  Loader2,
  ArrowRight,
  KeyRound,
  AlertTriangle,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { RUNTIME_META } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useCreateServer, useDeployMetadata, usePromoCodePreview, usePublicPlans, useTemplates } from "@/lib/api/hooks";
import { useAuth } from "@/lib/api/auth";
import { toUiTemplate, type PteroEgg } from "@/lib/api/adapters";

const STEPS = ["Source", "Region", "Plan", "Review"] as const;
const DEPLOY_STAGES = [
  "Provisioning server",
  "Preparing runtime",
  "Installing dependencies",
  "Building project",
  "Starting process",
];

type DeployMeta = {
  nodes: { id: number; name: string; location_id: number }[];
  nests: { id: number; name: string }[];
  eggs: { id: number; nest: number; name: string; description: string; docker_image: string }[];
  locations: { id: number; short: string; long: string }[];
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  ramMb: number;
  cpuPct: number;
  diskMb: number;
  dbCount: number;
  backups: number;
  creditCost: number;
  featured: boolean;
  popular: boolean;
  published: boolean;
};

type CatalogTemplate = {
  id: string;
  name: string;
  description: string;
  runtime: keyof typeof RUNTIME_META;
  framework: string;
  language: string;
  eggId: number;
  nestId: number;
};

function toCatalogTemplate(raw: unknown): CatalogTemplate | null {
  const row = raw as Record<string, unknown>;
  const eggId = typeof row.eggId === "number" ? row.eggId : Number(row.eggId);
  const nestId = typeof row.nestId === "number" ? row.nestId : Number(row.nestId);
  if (!Number.isInteger(eggId) || !Number.isInteger(nestId)) return null;
  const runtime = String(row.runtime ?? "node") as keyof typeof RUNTIME_META;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Untitled template"),
    description: String(row.description ?? ""),
    runtime: runtime in RUNTIME_META ? runtime : "node",
    framework: String(row.framework ?? "Custom"),
    language: String(row.language ?? "Unknown"),
    eggId,
    nestId,
  };
}

export default function NewServerPage() {
  const searchParams = useSearchParams();
  const metaQuery = useDeployMetadata();
  const templatesQuery = useTemplates();
  const plansQuery = usePublicPlans<PlanRow>();
  const createServer = useCreateServer();
  const { user, refreshUser } = useAuth();

  const meta = metaQuery.data as DeployMeta | undefined;
  const templates = useMemo(
    () => (((templatesQuery.data as unknown[]) ?? []).map(toCatalogTemplate).filter(Boolean) as CatalogTemplate[]),
    [templatesQuery.data],
  );
  const plans = ((plansQuery.data as { items?: PlanRow[] } | undefined)?.items ?? [])
    .filter((plan) => plan.published);
  const preferredTemplateId = searchParams.get("template")?.trim() || null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Deploy a new server"
        description="Pick a starting point, choose where it runs, and go live."
      >
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/servers">
            <ChevronLeft className="size-4" /> Servers
          </Link>
        </Button>
      </PageHeader>

      {(metaQuery.isLoading || plansQuery.isLoading || templatesQuery.isLoading) ? (
        <WizardSkeleton />
      ) : metaQuery.isError ? (
        <ErrorState description={(metaQuery.error as Error).message} onRetry={() => void metaQuery.refetch()} />
      ) : templatesQuery.isError ? (
        <ErrorState description={(templatesQuery.error as Error).message} onRetry={() => void templatesQuery.refetch()} />
      ) : plansQuery.isError ? (
        <ErrorState description={(plansQuery.error as Error).message} onRetry={() => void plansQuery.refetch()} />
      ) : !meta || meta.eggs.length === 0 || meta.nodes.length === 0 || plans.length === 0 ? (
        <EmptyState
          icon={<Rocket />}
          title="No deploy targets available"
          description="A published plan, node, or egg is missing. Add at least one deploy target in the admin panel."
        />
      ) : (
        <Wizard
          meta={meta}
          templates={templates}
          preferredTemplateId={preferredTemplateId}
          plans={plans}
          pteroUserId={user?.pteroUserId ?? null}
          creditBalance={user?.creditBalance ?? 0}
          onSubmit={async (body) => {
            const result = await createServer.mutateAsync(body);
            await refreshUser();
            return result;
          }}
        />
      )}
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
      <div className="card-base min-h-[360px] p-5 sm:p-6">
        <Skeleton className="h-9 w-40" />
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Wizard({
  meta,
  templates,
  preferredTemplateId,
  plans,
  pteroUserId,
  creditBalance,
  onSubmit,
}: {
  meta: DeployMeta;
  templates: CatalogTemplate[];
  preferredTemplateId: string | null;
  plans: PlanRow[];
  pteroUserId: number | null;
  creditBalance: number;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const eggs = useMemo(() => meta.eggs.map((e) => toUiTemplate(e as PteroEgg)), [meta]);
  const regions = useMemo(
    () =>
      meta.nodes.map((n) => ({
        id: String(n.id),
        city: n.name,
        country: "Node",
        flag: "🖥️",
      })),
    [meta],
  );

  const [step, setStep] = useState(0);
  const [eggId, setEggId] = useState(eggs[0]?.id ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(preferredTemplateId ?? "");
  const [region, setRegion] = useState(regions[0]?.id ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"form" | "deploying" | "done">("form");
  const [deployError, setDeployError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    label?: string | null;
    discountCredits: number;
    finalCredits: number;
  } | null>(null);
  const previewPromo = usePromoCodePreview();

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const egg = eggs.find((t) => t.id === eggId) ?? eggs[0];
  const loc = regions.find((l) => l.id === region) ?? regions[0];
  const plan = plans.find((item) => item.id === planId) ?? plans[0];
  const effectiveCharge = appliedCoupon?.finalCredits ?? (plan?.creditCost ?? 0);
  const balanceAfterDeploy = creditBalance - effectiveCharge;

  const canNext =
    (step === 0 && (!!selectedTemplate || !!eggId)) ||
    step === 1 ||
    (step === 2 && !!planId) ||
    step === 3;

  useEffect(() => {
    if (!preferredTemplateId) {
      return;
    }
    const preferred = templates.find((template) => template.id === preferredTemplateId);
    if (!preferred) {
      setSelectedTemplateId("");
      return;
    }
    setSelectedTemplateId(preferred.id);
    setEggId(String(preferred.eggId));
  }, [preferredTemplateId, templates]);

  useEffect(() => {
    setAppliedCoupon(null);
  }, [planId]);

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code || !plan?.id) {
      setAppliedCoupon(null);
      return;
    }
    try {
      const result = await previewPromo.mutateAsync({
        planId: plan.id,
        couponCode: code,
      });
      setAppliedCoupon({
        code: result.promo.code,
        label: result.promo.label,
        discountCredits: result.discountCredits,
        finalCredits: result.finalCredits,
      });
      toast.success("Promo code applied");
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(err instanceof Error ? err.message : "Promo code could not be applied.");
    }
  }

  async function startDeploy() {
    setDeployError(null);
    if (!pteroUserId) {
      setDeployError(
        "Link your Pterodactyl panel key in Settings before deploying.",
      );
      return;
    }
    const selectedEgg = selectedTemplate
      ? meta.eggs.find((item) => item.id === selectedTemplate.eggId && item.nest === selectedTemplate.nestId)
      : (meta.eggs.find((e) => String(e.id) === egg?.id) ?? meta.eggs[0]);
    const nodeId = Number(region);
    if (!selectedEgg || !Number.isFinite(nodeId)) {
      setDeployError("Pick a template or egg and node first.");
      return;
    }
    setPhase("deploying");
    try {
      await onSubmit({
        name: name || "new-bot",
        planId: plan.id,
        couponCode: couponCode.trim() || undefined,
        templateId: selectedTemplate?.id,
        nestId: selectedEgg.nest,
        eggId: selectedEgg.id,
        nodeId,
        allocations: 1,
      });
      toast.success(`Provisioning ${name || "new-bot"}`, {
        description: "Your server is being created on the panel.",
      });
      setPhase("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Provisioning failed.";
      toast.error("Deploy failed", { description: msg });
      setDeployError(msg);
      setPhase("form");
    }
  }

  if (phase === "deploying")
    return <Deploying name={name || "new-bot"} onDone={() => setPhase("done")} />;
  if (phase === "done")
    return <DoneScreen name={name || "new-bot"} onAgain={() => location.reload()} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      {/* Step rail */}
      <ol className="flex gap-3 lg:flex-col">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                i < step
                  ? "border-accent/40 bg-accent/15 text-accent-soft"
                  : i === step
                    ? "accent-gradient border-transparent text-white"
                    : "border-line text-ink-muted",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                i === step ? "text-ink" : "text-ink-muted",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      {/* Step content */}
      <div className="card-base min-h-[360px] p-5 sm:p-6">
        {!pteroUserId && <LinkPanelBanner />}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
          >
            {step === 0 && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-ink">
                    Choose a source
                  </h3>
                  <p className="text-sm text-ink-muted">
                    Start from a published template or pick a panel egg directly.
                  </p>
                </div>
                {selectedTemplate ? (
                  <div className="mb-4 rounded-xl border border-accent/30 bg-accent/[0.08] p-3.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">Selected template: {selectedTemplate.name}</p>
                        <p className="text-xs text-ink-muted">
                          {selectedTemplate.framework} · {selectedTemplate.language}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTemplateId("")}>
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : null}
                {templates.length > 0 ? (
                  <div className="mb-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
                      Published templates
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplateId(template.id);
                            setEggId(String(template.eggId));
                          }}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            selectedTemplateId === template.id
                              ? "border-accent/40 bg-accent/[0.08]"
                              : "border-line hover:border-line-hover",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-medium text-ink">
                                {template.name}
                              </span>
                              <span className="block truncate text-xs text-ink-muted">
                                {template.framework} · {template.language}
                              </span>
                            </div>
                            {selectedTemplateId === template.id ? (
                              <CircleCheck className="size-4 shrink-0 text-accent-soft" />
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-ink-muted">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {eggs.length === 0 ? (
                  <EmptyState
                    title="No eggs available"
                    description="Your panel has no eggs imported yet."
                  />
                ) : (
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
                      Panel eggs
                    </p>
                    <div className="grid max-h-[320px] gap-2.5 overflow-y-auto sm:grid-cols-2">
                      {eggs.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTemplateId("");
                            setEggId(t.id);
                          }}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                            !selectedTemplateId && eggId === t.id
                              ? "border-accent/40 bg-accent/[0.08]"
                              : "border-line hover:border-line-hover",
                          )}
                        >
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline font-mono text-xs font-bold"
                            style={{ color: t.color, background: `${t.color}1f` }}
                          >
                            {t.abbr}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink">
                              {t.name}
                            </span>
                            <span className="block truncate text-xs text-ink-muted">
                              {t.framework} · {t.language}
                            </span>
                          </span>
                          {!selectedTemplateId && eggId === t.id ? (
                            <CircleCheck className="ml-auto size-4 shrink-0 text-accent-soft" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <StepGrid
                title="Choose a region"
                subtitle="Deploy close to your users."
              >
                {regions.length === 0 ? (
                  <EmptyState
                    title="No nodes available"
                    description="An admin needs to add a node before you can deploy."
                  />
                ) : (
                  regions.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setRegion(l.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 text-left transition-colors",
                        region === l.id
                          ? "border-accent/40 bg-accent/[0.08]"
                          : "border-line hover:border-line-hover",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{l.flag}</span>
                        <span>
                          <span className="block text-sm font-medium text-ink">
                            {l.city}
                          </span>
                          <span className="block font-mono text-xs text-ink-muted">
                            Pterodactyl node
                          </span>
                        </span>
                      </span>
                      {region === l.id && (
                        <CircleCheck className="size-4 text-accent-soft" />
                      )}
                    </button>
                  ))
                )}
              </StepGrid>
            )}

            {step === 2 && (
              <StepGrid title="Choose a plan" subtitle="Pick one of the published plans for this deployment.">
                {plans.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPlanId(item.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      planId === item.id
                        ? "border-accent/40 bg-accent/[0.08]"
                        : "border-line hover:border-line-hover",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">
                        {item.name}
                      </span>
                      {item.featured && (
                        <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[10px] text-accent-soft">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-semibold text-ink">
                      {item.creditCost} credits
                      <span className="ml-1 text-xs font-normal text-ink-muted">/ month</span>
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {Math.round((item.ramMb / 1024) * 10) / 10} GB RAM · {Math.max(1, Math.round((item.cpuPct / 100) * 10) / 10)} vCPU · {Math.round(item.diskMb / 1024)} GB Disk
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {item.dbCount} DB · {item.backups} Backup
                    </p>
                  </button>
                ))}
              </StepGrid>
            )}

            {step === 3 && egg && loc && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    Name & review
                  </h3>
                  <p className="text-sm text-ink-muted">
                    Confirm your configuration.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="srv">Server name</Label>
                  <Input
                    id="srv"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="my-discord-bot"
                    autoFocus
                  />
                </div>
                <div className="rounded-xl border border-hairline bg-card p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-elevated/40">
                      <TicketPercent className="size-4 text-accent-soft" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">Coupon / promo code</p>
                      <p className="text-xs text-ink-muted">
                        Apply a valid code to reduce the first monthly charge for this server.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (appliedCoupon && e.target.value.trim().toUpperCase() !== appliedCoupon.code) {
                          setAppliedCoupon(null);
                        }
                      }}
                      placeholder="SUMMER25"
                      className="font-mono uppercase"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || previewPromo.isPending}
                    >
                      {previewPromo.isPending ? "Checking…" : "Apply code"}
                    </Button>
                  </div>
                  {appliedCoupon ? (
                    <div className="mt-3 rounded-lg border border-online/30 bg-online/10 px-3 py-2 text-sm text-ink">
                      <span className="font-medium">{appliedCoupon.code}</span>
                      {" "}applied{appliedCoupon.label ? ` · ${appliedCoupon.label}` : ""}.
                      {" "}You save {appliedCoupon.discountCredits} credits on the first month.
                    </div>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline text-sm">
                  <Summary label="Egg">{egg.name}</Summary>
                  <Summary label="Template">
                    {selectedTemplate ? selectedTemplate.name : "Custom egg selection"}
                  </Summary>
                  <Summary label="Runtime">
                    {RUNTIME_META[egg.runtime].label}
                  </Summary>
                  <Summary label="Region">
                    {loc.flag} {loc.city}
                  </Summary>
                  <Summary label="Plan">{plan.name}</Summary>
                  <Summary label="Resources">
                    {Math.round((plan.ramMb / 1024) * 10) / 10} GB RAM · {Math.max(1, Math.round((plan.cpuPct / 100) * 10) / 10)} vCPU · {Math.round(plan.diskMb / 1024)} GB Disk
                  </Summary>
                  <Summary label="Monthly charge">
                    {plan.creditCost} credits / month
                  </Summary>
                  <Summary label="First month charge">
                    {effectiveCharge} credits
                  </Summary>
                  <Summary label="Discount">
                    {appliedCoupon ? `${appliedCoupon.discountCredits} credits` : "No promo code"}
                  </Summary>
                  <Summary label="Current balance">
                    {creditBalance} credits
                  </Summary>
                  <Summary label="Balance after deploy">
                    <span className={balanceAfterDeploy < 0 ? "text-danger" : undefined}>
                      {balanceAfterDeploy} credits
                    </span>
                  </Summary>
                </dl>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {deployError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            <AlertTriangle className="size-4 shrink-0" /> {deployError}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between border-t border-hairline pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={startDeploy} disabled={!pteroUserId}>
              <Rocket className="size-4" /> Deploy server
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkPanelBanner() {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 p-3.5">
      <KeyRound className="mt-0.5 size-4 shrink-0 text-warn" />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">
          Link your panel account first
        </p>
        <p className="mt-0.5 text-xs text-ink-secondary">
          Deploying requires a linked Pterodactyl panel user. Add your panel
          API key in settings to enable provisioning.
        </p>
      </div>
      <Button asChild size="sm" variant="secondary">
        <Link href="/dashboard/settings/api-keys">Link panel key</Link>
      </Button>
    </div>
  );
}

function StepGrid({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Summary({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card p-3.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children}</dd>
    </div>
  );
}

function Deploying({ name, onDone }: { name: string; onDone: () => void }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= DEPLOY_STAGES.length) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), 900);
    return () => clearTimeout(t);
  }, [done, onDone]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="relative flex size-16 items-center justify-center rounded-2xl accent-gradient shadow-glow-lg">
        <Rocket className="size-7 text-white" />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-ink">Deploying {name}…</h2>
        <p className="text-sm text-ink-muted">
          This usually takes a few seconds.
        </p>
      </div>
      <ul className="w-full space-y-2 text-left">
        {DEPLOY_STAGES.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-3"
          >
            {i < done ? (
              <CircleCheck className="size-4 text-online" />
            ) : i === done ? (
              <Loader2 className="size-4 animate-spin text-accent-soft" />
            ) : (
              <span className="size-4 rounded-full border border-line" />
            )}
            <span
              className={cn(
                "font-mono text-sm",
                i <= done ? "text-ink-secondary" : "text-ink-muted",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DoneScreen({ name, onAgain }: { name: string; onAgain: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="flex size-16 items-center justify-center rounded-2xl border border-online/30 bg-online/10 text-online"
      >
        <Check className="size-8" />
      </motion.span>
      <div>
        <h2 className="text-xl font-semibold text-ink">{name} is live</h2>
        <p className="text-sm text-ink-muted">
          Your server has been provisioned and is now running.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard/servers">
            Open servers <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="secondary" onClick={onAgain}>
          <Sparkles className="size-4" /> Deploy another
        </Button>
      </div>
    </div>
  );
}
