"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Monitor, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard/settings/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings/security", label: "Security", icon: Shield },
  { href: "/dashboard/settings/sessions", label: "Sessions", icon: Monitor },
  { href: "/dashboard/settings/preferences", label: "Preferences", icon: Bell },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 [&_svg]:size-4",
              active
                ? "bg-elevated text-ink shadow-sm [&_svg]:text-accent-soft"
                : "text-ink-muted hover:bg-overlay hover:text-ink-secondary [&_svg]:text-ink-muted",
            )}
          >
            <Icon />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
