"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Hexagon,
  ServerCog,
  Menu,
  X,
  ChevronDown,
  Search,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/i18n";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";

const HOSTING = [
  { label: "Discord Bot Hosting", href: "/discord-bot-hosting", icon: Bot, desc: "discord.js, Sapphire, Eris" },
  { label: "Node.js Hosting", href: "/nodejs-hosting", icon: Hexagon, desc: "v18 – v22, instant deploy" },
  { label: "Python Hosting", href: "/python-hosting", icon: ServerCog, desc: "3.10 – 3.12, async ready" },
];
type MenuKey = "hosting" | null;

function MegaPanel({ items }: { items: typeof HOSTING }) {
  return (
    <div className="grid w-[440px] gap-1 p-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-overlay2"
        >
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-accent-soft transition-colors group-hover:border-accent/40">
            <item.icon className="size-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-ink">{item.label}</span>
            <span className="text-xs text-ink-muted">{item.desc}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Navbar() {
  const [menu, setMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleCommand = useUI((s) => s.toggleCommand);
  const { t } = useT();

  const dropdown = (key: Exclude<MenuKey, null>, label: string) => (
    <div
      className="relative"
      onMouseEnter={() => setMenu(key)}
      onMouseLeave={() => setMenu(null)}
    >
      <button
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          menu === key ? "text-ink" : "text-ink-secondary hover:text-ink",
        )}
      >
        {label}
        <ChevronDown
          className={cn("size-3.5 transition-transform", menu === key && "rotate-180")}
        />
      </button>
      {menu === key && (
        <div className="absolute left-0 top-full hidden pt-2 lg:block">
          <div className="glass animate-fade-up overflow-hidden rounded-2xl shadow-panel">
            <MegaPanel items={HOSTING} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-1">
          <Logo className="mr-4" />
          <nav className="hidden items-center lg:flex">
            {dropdown("hosting", t("nav.hosting"))}
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink" onMouseEnter={() => setMenu(null)}>
              {t("nav.pricing")}
            </Link>
            <Link href="/features" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink" onMouseEnter={() => setMenu(null)}>
              {t("nav.features")}
            </Link>
            <Link href="/dashboard/support" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink" onMouseEnter={() => setMenu(null)}>
              {t("nav.support")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleCommand}
            className="hidden items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-line-hover md:flex"
          >
            <Search className="size-3.5" />
            <span>{t("nav.search")}</span>
            <kbd className="rounded border border-line bg-bg px-1 font-mono text-[10px]">⌘K</kbd>
          </button>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/dashboard/overview">{t("nav.deploy")}</Link>
          </Button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-ink-secondary lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-bg px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {HOSTING.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-ink-secondary hover:bg-overlay2 hover:text-ink"
              >
                <i.icon className="size-4 text-ink-muted" />
                {i.label}
              </Link>
            ))}
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 text-sm text-ink-secondary hover:text-ink">Pricing</Link>
            <Link href="/features" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 text-sm text-ink-secondary hover:text-ink">Features</Link>
            <Link href="/dashboard/support" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 text-sm text-ink-secondary hover:text-ink">Support</Link>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="secondary" size="sm" className="flex-1">
                <Link href="/auth/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link href="/dashboard/overview">{t("nav.deploy")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
