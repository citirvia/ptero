import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { GridBackdrop, GlowOrb } from "@/components/decor";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center">
      <GridBackdrop />
      <GlowOrb className="-top-20 left-1/2 size-[520px] -translate-x-1/2" />
      <div className="relative flex flex-col items-center gap-6">
        <Logo />
        <p className="font-mono text-[7rem] font-semibold leading-none accent-text sm:text-[9rem]">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          This page drifted out of orbit
        </h1>
        <p className="max-w-md text-pretty text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Check the URL, or head back to familiar ground.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" /> Back home
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/overview">
              <LayoutDashboard className="size-4" /> Go to dashboard
            </Link>
          </Button>
        </div>
        <p className="font-mono text-xs text-ink-muted">
          error: route_not_found · status 404
        </p>
      </div>
    </div>
  );
}
