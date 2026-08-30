import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { RouteTransition } from "@/components/route-transition";
import { DashboardGuard } from "@/components/dashboard/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGuard>
      <div className="flex min-h-screen bg-bg">
        <MobileNav />
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-5 py-6 sm:px-6 lg:px-8">
            <Breadcrumbs />
            <RouteTransition scope="dashboard">{children}</RouteTransition>
          </main>
        </div>
      </div>
    </DashboardGuard>
  );
}
