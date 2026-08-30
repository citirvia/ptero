"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { validate, loginSchema } from "@/lib/validation";
import { useAuth } from "@/lib/api/auth";
import { API_URL, ApiError, authEndpointUrl } from "@/lib/api/client";
import { useT } from "@/i18n";
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

export default function LoginPage() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const oauthError = searchParams.get("error");
  const [formError, setFormError] = useState<string | null>(() => {
    switch (oauthError) {
      case "discord_unavailable":
        return "Discord sign-in is not configured yet.";
      case "discord_cancelled":
        return "Discord sign-in was cancelled.";
      case "discord_state":
        return "Discord sign-in could not be verified. Please try again.";
      case "discord_email":
        return "Discord sign-in requires a verified Discord email address.";
      case "discord_suspended":
        return "This account is suspended.";
      case "discord_failed":
        return "Discord sign-in failed. Please try again.";
      default:
        return null;
    }
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const fd = new FormData(e.currentTarget);
    const res = validate(loginSchema, {
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await login(res.data.email, res.data.password);
      router.push("/dashboard/overview");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("auth.signinTitle")}
        </h1>
        <p className="text-sm text-ink-muted">{t("auth.signinSub")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="size-4 shrink-0" /> {formError}
          </div>
        )}
        {API_URL && (
          <>
            <Button
              asChild
              type="button"
              size="lg"
              variant="secondary"
              className="w-full"
              disabled={loading}
            >
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
          <Label htmlFor="email">{t("auth.email")}</Label>
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              disabled={loading}
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
          <FieldError msg={errors.password} />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            disabled={loading}
            className="size-4 rounded border-line bg-bg text-accent accent-accent focus-ring"
          />
          {t("auth.keep")}
        </label>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t("auth.signingIn")}
            </>
          ) : (
            t("auth.signin")
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        {t("auth.newToPtero")}{" "}
        <Link
          href="/auth/register"
          className="focus-ring rounded font-medium text-accent-soft transition-colors hover:text-accent"
        >
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}
