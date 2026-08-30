import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { AuditView } from "./_components/audit-view";

export const metadata = { title: "Audit Logs · Ptero" };

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Review the actions tied to your account, including sign-ins, settings changes, and server activity."
      >
        <Badge variant="outline">365-day retention</Badge>
      </PageHeader>
      <AuditView />
    </div>
  );
}
