import { PageHeader } from "@/components/dashboard/page-header";
import { NotificationsView } from "./_components/notifications-view";

export const metadata = { title: "Notifications · Ptero" };

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Activity across your servers, billing and team."
      />
      <NotificationsView />
    </div>
  );
}
