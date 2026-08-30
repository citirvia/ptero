"use client";

import Link from "next/link";
import { FolderGit2, AtSign, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useT } from "@/i18n";

const TITLE_KEYS: Record<string, string> = {
  Product: "footer.product",
  Company: "footer.company",
  Legal: "footer.legal",
};

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Features", href: "/features" },
      { label: "Enterprise", href: "/enterprise" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/dashboard/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Refunds", href: "/legal/refund-policy" },
      { label: "Acceptable Use", href: "/legal/acceptable-use" },
    ],
  },
];

export function Footer() {
  const { t } = useT();
  return (
    <footer className="relative border-t border-hairline bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-2">
              {[MessageCircle, FolderGit2, AtSign].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="flex size-9 items-center justify-center rounded-lg border border-line bg-card text-ink-muted transition-colors hover:border-line-hover hover:text-ink"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                {t(TITLE_KEYS[col.title] ?? col.title)}
              </h4>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-ink-secondary transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 sm:flex-row">
          <p className="font-mono text-xs text-ink-muted">{t("footer.rights")}</p>

        </div>
      </div>
    </footer>
  );
}
