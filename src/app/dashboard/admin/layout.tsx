"use client";

import Link from "next/link";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";

/**
 * Admin area gate. Only OWNER/ADMIN roles may view /dashboard/admin/*.
 * The outer DashboardGuard already ensures the user is authenticated and
 * the BFF is reachable, so this layer only checks the role.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-accent-soft" />
      </div>
    );
  }

  const isAdmin = user?.role === "OWNER" || user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="text-xl font-semibold text-ink">Admin access required</h1>
        <p className="text-sm text-ink-muted">
          Your account ({user?.role?.toLowerCase() ?? "viewer"}) doesn&apos;t have
          permission to view the admin area.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/overview">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
