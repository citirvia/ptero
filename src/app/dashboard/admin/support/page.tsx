"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Inbox,
  LifeBuoy,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { StatCard } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSupportTickets } from "@/lib/api/hooks";
import { cn, formatDate } from "@/lib/utils";
import {
  PRIORITY_META,
  STATUS_META,
  SUPPORT_SELECT_CLASS,
  ticketNumber,
} from "../../support/_components/support-shared";

type TicketStatus = "OPEN" | "WAITING_ON_STAFF" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type TicketListItem = {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  updatedAt: string;
  createdAt: string;
  requester: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string } | null;
  messages?: { body: string; createdAt: string; authorName: string; internal: boolean }[];
};

export default function AdminSupportPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const ticketsQ = useAdminSupportTickets({ page, q: query, status, priority });
  const payload = (ticketsQ.data ??
    { tickets: [], meta: { totalPages: 1 }, counts: {} }) as {
    tickets: TicketListItem[];
    meta: { totalPages: number; total: number };
    counts: { open?: number; waitingOnStaff?: number; waitingOnCustomer?: number; resolved?: number; unassigned?: number };
  };

  const stats = useMemo(
    () => ({
      open: payload.counts.open ?? 0,
      waitingOnStaff: payload.counts.waitingOnStaff ?? 0,
      waitingOnCustomer: payload.counts.waitingOnCustomer ?? 0,
      unassigned: payload.counts.unassigned ?? 0,
    }),
    [payload.counts],
  );

  if (ticketsQ.isError) {
    return (
      <>
        <AdminHeader
          title="Support inbox"
          description="Handle customer tickets, assign owners and keep every reply inside the platform."
        />
        <ErrorState
          description={(ticketsQ.error as Error)?.message}
          onRetry={() => void ticketsQ.refetch()}
        />
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Support inbox"
        description="Formal operations desk with ownership, lifecycle control and attachment-safe reply handling."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open" value={stats.open} icon={LifeBuoy} accent />
        <StatCard label="Waiting on staff" value={stats.waitingOnStaff} icon={MessageSquareText} />
        <StatCard label="Waiting on customer" value={stats.waitingOnCustomer} icon={ShieldCheck} />
        <StatCard label="Unassigned" value={stats.unassigned} icon={UserRoundCheck} />
      </div>

      <div className="mt-6">
        <Card className="overflow-hidden border-hairline bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
          <CardHeader className="border-b border-hairline bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Queue</CardTitle>
              <Badge variant="outline">Ops Desk</Badge>
            </div>
            <div className="grid gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setPage(1);
                    setQuery(event.target.value);
                  }}
                  placeholder="Search subject, number or requester..."
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={status}
                  onChange={(event) => {
                    setPage(1);
                    setStatus(event.target.value);
                  }}
                  className={SUPPORT_SELECT_CLASS}
                >
                  <option value="ALL">all statuses</option>
                  <option value="OPEN">open</option>
                  <option value="WAITING_ON_STAFF">waiting on staff</option>
                  <option value="WAITING_ON_CUSTOMER">waiting on customer</option>
                  <option value="RESOLVED">resolved</option>
                  <option value="CLOSED">closed</option>
                </select>
                <select
                  value={priority}
                  onChange={(event) => {
                    setPage(1);
                    setPriority(event.target.value);
                  }}
                  className={SUPPORT_SELECT_CLASS}
                >
                  <option value="ALL">all priorities</option>
                  <option value="LOW">low</option>
                  <option value="NORMAL">normal</option>
                  <option value="HIGH">high</option>
                  <option value="URGENT">urgent</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {ticketsQ.isLoading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : payload.tickets.length === 0 ? (
              <EmptyState
                icon={<Inbox />}
                title="No tickets in this view"
                description="Try a different filter or wait for new customer requests."
              />
            ) : (
              <>
                {payload.tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/admin/support/${ticket.id}`}
                    className={cn(
                      "block w-full rounded-[24px] border border-hairline bg-bg/30 px-4 py-4 text-left transition-colors hover:border-line-hover hover:bg-overlay",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-ink-muted">{ticketNumber(ticket.number)}</p>
                        <p className="truncate text-sm font-medium text-ink">{ticket.subject}</p>
                      </div>
                      <Badge variant={STATUS_META[ticket.status].variant}>
                        {STATUS_META[ticket.status].label}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={PRIORITY_META[ticket.priority]}>
                        {ticket.priority.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-ink-muted">{ticket.requester.name}</span>
                      <span className="text-xs text-ink-muted">
                        {ticket.assignee?.name ?? "Unassigned"}
                      </span>
                    </div>
                    {ticket.messages?.[0] ? (
                      <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{ticket.messages[0].body}</p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>{formatDate(ticket.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1 text-ink-secondary">
                        Open <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
                <Pagination page={page} pageCount={payload.meta.totalPages ?? 1} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
