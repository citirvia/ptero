"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ServerCrash } from "lucide-react";
import { useAuth } from "@/lib/api/auth";

/**
 * Gates the dashboard against a live backend session. Three terminal states:
 *
 * - `NEXT_PUBLIC_API_URL` not set → setup screen (the app can't render the
 *   dashboard without a backend).
 * - Authenticated check in flight → spinner.
 * - Anonymous → redirect to /auth/login.
 */
export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { live, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (live && !loading && !user) router.replace("/auth/login");
  }, [live, loading, user, router]);

  if (!live) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="card-base flex max-w-md flex-col items-center gap-4 px-8 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-hairline bg-elevated text-warn">
            <ServerCrash className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-medium text-ink">Backend not configured</h2>
            <p className="text-sm text-ink-muted">
              Set <code className="rounded-md border border-hairline bg-elevated px-1.5 py-0.5 font-mono text-xs text-ink">NEXT_PUBLIC_API_URL</code>{" "}
              to point at the BFF and restart the dev server. Until then the dashboard
              has nothing to render against.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <Loader2 className="size-6 animate-spin text-accent-soft" />
          <p className="text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
