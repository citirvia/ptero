"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Eye,
  EyeOff,
  Cpu,
  MemoryStick,
  HardDrive,
  DatabaseBackup,
  ShieldCheck,
  CreditCard,
  XCircle,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PasswordStrengthBar } from "../../_components/password-strength";
import { validate, registerSchema } from "@/lib/validation";
import { useAuth } from "@/lib/api/auth";
import { API_URL, ApiError, authEndpointUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { DiscordMark } from "@/components/marketing/workload-marks";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-danger">
      <AlertCircle className="size-3" /> {msg}
    </span>
  );
}

// Decorative "Pro plan" sidebar copy. Live plan data ships through
// `usePublicPlans()` on the pricing page; the register page deliberately uses
// a static highlight so the form still renders if the public API is offline.
const PRO = {
  id: "pro",
  name: "Pro",
  monthly: 12,
  ram: 2,
  cpu: 2,
  storage: 20,
  backups: 5,
};

const PLAN_SPECS = [
  { icon: MemoryStick, label: `${PRO.ram} GB RAM` },
  { icon: Cpu, label: `${PRO.cpu} vCPU` },
  { icon: HardDrive, label: `${PRO.storage} GB NVMe` },
  { icon: DatabaseBackup, label: `${PRO.backups} backups` },
];

const TRUST = [
  { icon: CreditCard, label: "No credit card" },
  { icon: XCircle, label: "Cancel anytime" },
  { icon: ShieldCheck, label: "SOC 2 ready" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const fd = new FormData(e.currentTarget);
    const res = validate(registerSchema, {
      name: fd.get("name"),
      email: fd.get("email"),
      password,
    });
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await register(res.data.name, res.data.email, res.data.password);
      router.push("/dashboard/overview");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Could not create account. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Create your account
        </h1>
        <p className="text-sm text-ink-muted">
          Deploy your first bot in under 60 seconds.
        </p>
      </div>

      {/* Compact plan preview */}
      <div className="card-base relative overflow-hidden p-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-soft/60 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
              {PRO.name} plan
            </span>
            <span className="font-mono text-lg font-semibold text-ink">
              ${PRO.monthly}
            </span>
            <span className="text-xs text-ink-muted">/mo</span>
          </div>
          <Badge variant="accent">Most popular</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
          {PLAN_SPECS.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2 py-1 text-xs text-ink-secondary"
            >
              <s.icon className="size-3.5 text-accent-soft" />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              <AlertCircle className="size-4 shrink-0" /> {formError}
            </div>
          )}
          {API_URL && (
            <>
              <Button asChild type="button" size="lg" variant="secondary" className="w-full">
                <a href={authEndpointUrl("/auth/discord/start")}>
                  <DiscordMark className="size-4" />
                  Continue with Discord
                </a>
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-hairline" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.18em] text-ink-muted">
                  <span className="bg-bg px-3">or</span>
                </div>
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Selim Melih"
              disabled={loading}
              aria-invalid={!!errors.name}
              className={cn(errors.name && "border-danger focus:border-danger focus:ring-danger/20")}
            />
            <FieldError msg={errors.name} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              disabled={loading}
              aria-invalid={!!errors.email}
              className={cn(errors.email && "border-danger focus:border-danger focus:ring-danger/20")}
            />
            <FieldError msg={errors.email} />
          </div>

          <div className="flex flex-col gap-2.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                className={cn("pr-10", errors.password && "border-danger focus:border-danger focus:ring-danger/20")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="focus-ring absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:text-ink"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <PasswordStrengthBar value={password} />
            <FieldError msg={errors.password} />
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-xs leading-relaxed text-ink-muted">
            By creating an account you agree to our{" "}
            <Link href="/legal/terms" className="text-ink-secondary underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-ink-secondary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {TRUST.map((t) => (
            <div key={t.label} className="flex items-center gap-1.5 text-xs text-ink-muted">
              <t.icon className="size-3.5 text-online" />
              {t.label}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="focus-ring rounded font-medium text-accent-soft transition-colors hover:text-accent"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
