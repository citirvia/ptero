import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { SettingsNav } from "./_components/settings-nav";

export const metadata = { title: "Settings · Ptero" };

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, security and preferences."
      />
      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
          <aside className="border-b border-hairline p-4 lg:border-b-0 lg:border-r lg:p-5">
            <div className="lg:sticky lg:top-6 lg:self-start">
              <SettingsNav />
            </div>
          </aside>
          <div className="min-w-0 p-4 lg:p-6">{children}</div>
        </div>
      </Card>
    </div>
  );
}
