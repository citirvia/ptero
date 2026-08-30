import { PageHeader } from "@/components/dashboard/page-header";
import { SupportTicketDetail } from "../_components/support-ticket-detail";

export const metadata = { title: "Case File · Ptero" };

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  return (
    <div>
      <PageHeader
        title="Case File"
        description="Review the complete case history, monitor lifecycle changes and send structured replies from a dedicated record."
      />
      <SupportTicketDetail ticketId={ticketId} />
    </div>
  );
}
