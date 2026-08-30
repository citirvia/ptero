"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { Card } from "@/components/ui/card";
import { ADMIN_CONTENT_NAV } from "@/components/dashboard/nav-items";

const DESCRIPTIONS: Record<string, string> = {
  Incidents: "Status-page incidents with severity, services and live updates.",
  Roadmap: "Public roadmap columns — planned, in-progress and shipped items.",
  Changelog: "Versioned release notes published to the marketing site.",
  Locations: "Map pins, hardware and capacity for every region.",
};

export default function AdminContentIndexPage() {
  return (
    <>
      <AdminHeader
        title="Marketing CMS"
        description="Edit the content that appears on every public-facing page."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {ADMIN_CONTENT_NAV.map(({ label, href, icon: Icon }) => (
          <Card key={href} hover className="flex items-center gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-elevated text-accent-soft">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-ink">{label}</p>
              <p className="mt-1 text-sm text-ink-muted">{DESCRIPTIONS[label]}</p>
            </div>
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink-secondary transition-colors hover:border-line-active hover:bg-overlay hover:text-ink"
            >
              Open <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
