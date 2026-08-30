"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { GridBackdrop, GlowOrb } from "@/components/decor";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real app this would report to an error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center">
      <GridBackdrop />
      <GlowOrb className="-top-20 left-1/2 size-[520px] -translate-x-1/2" color="rgba(248,81,73,0.18)" />
      <div className="relative flex flex-col items-center gap-6">
        <Logo />
        <span className="flex size-16 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
          <AlertTriangle className="size-8" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Something went wrong
        </h1>
        <p className="max-w-md text-pretty text-ink-muted">
          An unexpected error occurred while rendering this page. Our team has been
          notified — you can retry or head back home.
        </p>
        {error?.digest && (
          <p className="rounded-lg border border-line bg-card px-3 py-1.5 font-mono text-xs text-ink-muted">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>
            <RotateCw className="size-4" /> Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <Home className="size-4" /> Back home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
