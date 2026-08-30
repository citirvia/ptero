import { PageHeader } from "@/components/dashboard/page-header";
import { SupportView } from "../_components/support-view";

export const metadata = { title: "New Support Request · Ptero" };

export default function NewSupportTicketPage() {
  return (
    <div>
      <PageHeader
        title="New Support Request"
        description="Create a detailed support request, attach evidence files, and submit it through a dedicated form."
      />
      <SupportView mode="new" />
    </div>
  );
}
