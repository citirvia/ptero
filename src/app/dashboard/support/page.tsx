import { PageHeader } from "@/components/dashboard/page-header";
import { SupportView } from "./_components/support-view";

export const metadata = { title: "Support Requests · Ptero" };

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        title="Support Requests"
        description="Review all support requests, track their status, and open any request on its own detail page."
      />
      <SupportView mode="inbox" />
    </div>
  );
}
