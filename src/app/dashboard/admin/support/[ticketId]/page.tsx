import { AdminHeader } from "@/components/dashboard/admin-header";
import { AdminSupportTicketDetail } from "../_components/admin-support-ticket-detail";

export const metadata = { title: "Support Ticket · Admin" };

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  return (
    <>
      <AdminHeader
        title="Support Ticket"
        description="Open a selected ticket on its own page to manage ownership, lifecycle and replies."
      />
      <AdminSupportTicketDetail ticketId={ticketId} />
    </>
  );
}
