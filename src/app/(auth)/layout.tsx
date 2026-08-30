import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Terminal } from "@/components/marketing/terminal";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { RouteTransition } from "@/components/route-transition";
import { TRUST_STATS } from "@/lib/marketing-content";
import { formatNumber } from "@/lib/utils";

const PANEL_STATS = [
  { value: formatNumber(TRUST_STATS[0].value), suffix: "+", label: "Developers building on Ptero" },
  { value: formatNumber(TRUST_STATS[1].value), suffix: "", label: "Servers running in production" },
  { value: "99.99", suffix: "%", label: "Uptime SLA across every region" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh bg-bg lg:grid-cols-2">
      {/* ── Left: form content ── */}
      <div className="relative flex min-h-svh flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Logo />
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </main>

        <footer className="px-6 py-6 sm:px-10">
          <p className="font-mono text-xs text-ink-muted">
            © 2026 Ptero · <Link href="/legal/terms" className="transition-colors hover:text-ink-secondary">Terms</Link> · <Link href="/legal/privacy" className="transition-colors hover:text-ink-secondary">Privacy</Link>
          </p>
        </footer>
      </div>

      {/* ── Right: branded panel (hidden < lg) ── */}
      <aside className="relative hidden overflow-hidden border-l border-hairline bg-surface lg:flex lg:flex-col lg:justify-between">
        <GridBackdrop />
        <GlowOrb className="-top-32 right-0 size-[520px]" />
        <GlowOrb className="bottom-0 -left-20 size-[420px]" color="rgba(47,107,133,0.18)" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-bg/80" />

        <div className="relative flex flex-col gap-3 px-12 pt-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-card/60 px-3 py-1 font-mono text-xs text-accent-soft backdrop-blur">
            <span className="size-1.5 rounded-full bg-online animate-pulse-ring" />
            All systems operational
          </span>
          <h2 className="max-w-sm text-balance text-2xl font-semibold tracking-tight text-ink">
            Ship bots & runtimes on{" "}
            <span className="accent-text">bare-metal</span> in seconds.
          </h2>
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-ink-muted">
            Push to deploy, watch it go live, and monitor it in realtime — no
            DevOps required.
          </p>
        </div>

        <div className="relative px-12">
          <Terminal />
        </div>

        <div className="relative grid grid-cols-3 gap-6 border-t border-hairline px-12 py-10">
          {PANEL_STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="font-mono text-2xl font-semibold tracking-tight text-ink">
                {s.value}
                <span className="text-accent-soft">{s.suffix}</span>
              </span>
              <span className="text-xs leading-snug text-ink-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
