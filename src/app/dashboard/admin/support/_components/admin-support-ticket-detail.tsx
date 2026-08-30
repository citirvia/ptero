"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/api/auth";
import { supportAttachmentUrl } from "@/lib/api/client";
import {
  useAdminReplySupportTicket,
  useAdminSupportTicket,
  useAdminUsers,
  useAdminUpdateSupportTicket,
} from "@/lib/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import {
  filesToPayload,
  formatAttachmentSize,
  PendingAttachment,
  PRIORITY_META,
  STATUS_META,
  SUPPORT_SELECT_CLASS,
  ticketNumber,
} from "../../../support/_components/support-shared";

type TicketStatus = "OPEN" | "WAITING_ON_STAFF" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type StaffMember = {
  id: number;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "BILLING" | "VIEWER";
};

type TicketDetail = {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string } | null;
  messages: {
    id: string;
    body: string;
    internal: boolean;
    createdAt: string;
    authorId: string | null;
    authorName: string;
    attachments?: {
      id: string;
      name: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: string;
    }[];
  }[];
};

export function AdminSupportTicketDetail({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const [internal, setInternal] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<PendingAttachment[]>([]);

  const detailQ = useAdminSupportTicket(ticketId);
  const detail = (detailQ.data ?? null) as TicketDetail | null;
  const staffQ = useAdminUsers(1);
  const staff = (((staffQ.data as { users?: Array<Record<string, unknown>> } | undefined)?.users ?? [])
    .map((member) => ({
      id: Number(member.id),
      name:
        (typeof member.linked_app_user_name === "string" && member.linked_app_user_name) ||
        `${String(member.first_name ?? "")} ${String(member.last_name ?? "")}`.trim() ||
        String(member.username ?? "Unknown"),
      email:
        (typeof member.linked_app_user_email === "string" && member.linked_app_user_email) ||
        String(member.email ?? "unknown@example.com"),
      role: member.root_admin ? "OWNER" : "ADMIN",
    })) as StaffMember[]).filter((member) => Number.isFinite(member.id));
  const updateMut = useAdminUpdateSupportTicket(ticketId);
  const replyMut = useAdminReplySupportTicket(ticketId);

  function patchTicket(body: { status?: string; priority?: string; assigneeId?: string | null }) {
    updateMut.mutate(body, {
      onSuccess: () => toast.success("Ticket updated."),
      onError: (error) => toast.error((error as Error).message),
    });
  }

  function reply(form: HTMLFormElement) {
    const body = String(new FormData(form).get("reply") ?? "").trim();
    if (!body) return;
    replyMut.mutate(
      { body, internal, attachments: replyAttachments },
      {
        onSuccess: () => {
          form.reset();
          setInternal(false);
          setReplyAttachments([]);
          toast.success(internal ? "Internal note added." : "Reply sent to customer.");
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  if (detailQ.isLoading) {
    return (
      <Card className="overflow-hidden border-hairline bg-bg/60">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (detailQ.isError) {
    return (
      <Card className="overflow-hidden border-hairline bg-bg/60">
        <CardContent className="p-6">
          <ErrorState
            title="Could not load ticket"
            description={(detailQ.error as Error)?.message}
            onRetry={() => void detailQ.refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card className="overflow-hidden border-hairline bg-bg/60">
        <CardContent className="p-0">
          <EmptyState
            icon={<MessageCircle />}
            title="Ticket not found"
            description="This ticket may have been removed or you may not have access to it."
            className="min-h-[520px]"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/admin/support">
            <ArrowLeft className="size-4" />
            Back to queue
          </Link>
        </Button>
        <p className="text-sm text-ink-muted">
          {ticketNumber(detail.number)} · {detail.subject}
        </p>
      </div>

      <Card className="overflow-hidden border-hairline bg-bg/60">
        <CardHeader className="border-b border-hairline bg-bg/60">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-mono text-xs text-ink-muted">{ticketNumber(detail.number)}</p>
              <CardTitle className="mt-1 font-serif text-2xl">{detail.subject}</CardTitle>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                All replies, evidence files and lifecycle changes remain attached to this case for a complete support record.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={STATUS_META[detail.status].variant}>
                  {STATUS_META[detail.status].label}
                </Badge>
                <Badge variant={PRIORITY_META[detail.priority]}>
                  {detail.priority.toLowerCase()}
                </Badge>
                <Badge variant="outline">{detail.category.toLowerCase()}</Badge>
                {detail.requester.email ? <Badge variant="outline">{detail.requester.email}</Badge> : null}
                {detail.assignee?.name ? <Badge variant="outline">{detail.assignee.name}</Badge> : null}
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-[320px] lg:items-stretch">
              <div className="flex justify-start lg:justify-end">
                {detail.status === "CLOSED" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={updateMut.isPending}
                    onClick={() => patchTicket({ status: "OPEN" })}
                  >
                    Reopen
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={updateMut.isPending}
                    onClick={() => patchTicket({ status: "CLOSED" })}
                  >
                    <Lock className="size-4" />
                    Close ticket
                  </Button>
                )}
              </div>
              <div className="space-y-3 rounded-[20px] border border-dashed border-hairline bg-bg/50 px-4 py-3 text-xs text-ink-muted">
                <p className="flex items-center gap-2 font-medium text-ink-secondary">
                  <ShieldCheck className="size-4 text-accent-soft" />
                  Admin Controls
                </p>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-status">Status</Label>
                    <select
                      id="ticket-status"
                      value={detail.status}
                      onChange={(event) => patchTicket({ status: event.target.value })}
                      className={SUPPORT_SELECT_CLASS}
                      disabled={updateMut.isPending}
                    >
                      <option value="OPEN">open</option>
                      <option value="WAITING_ON_STAFF">waiting on staff</option>
                      <option value="WAITING_ON_CUSTOMER">waiting on customer</option>
                      <option value="RESOLVED">resolved</option>
                      <option value="CLOSED">closed</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-priority">Priority</Label>
                    <select
                      id="ticket-priority"
                      value={detail.priority}
                      onChange={(event) => patchTicket({ priority: event.target.value })}
                      className={SUPPORT_SELECT_CLASS}
                      disabled={updateMut.isPending}
                    >
                      <option value="LOW">low</option>
                      <option value="NORMAL">normal</option>
                      <option value="HIGH">high</option>
                      <option value="URGENT">urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-assignee">Assignee</Label>
                    <select
                      id="ticket-assignee"
                      value={detail.assignee?.id ?? ""}
                      onChange={(event) => patchTicket({ assigneeId: event.target.value || null })}
                      className={SUPPORT_SELECT_CLASS}
                      disabled={updateMut.isPending || staffQ.isLoading}
                    >
                      <option value="">unassigned</option>
                      {staff.map((member) => (
                        <option key={member.id} value={String(member.id)}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden border-hairline bg-bg/60">
        <CardHeader className="border-b border-hairline">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Messages</CardTitle>
              <p className="mt-1 text-sm text-ink-muted">
                Real-time style conversation view for this support request.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_META[detail.status].variant}>
                  {STATUS_META[detail.status].label}
                </Badge>
                <Badge variant={PRIORITY_META[detail.priority]}>{detail.priority.toLowerCase()}</Badge>
                <Badge variant="outline">{detail.requester.email}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex h-[720px] flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto bg-bg/55 px-5 py-5 sm:px-6">
            {detail.messages.map((message) => {
              const mine = message.authorId != null && message.authorId === user?.sub;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className="max-w-[88%] space-y-2">
                    <div className={cn("flex items-center gap-2 px-1 text-[11px] text-ink-muted", mine ? "justify-end" : "justify-start")}>
                      {!mine ? <span className="font-medium text-ink-secondary">{message.authorName}</span> : null}
                      {message.internal ? <Badge variant="warn">internal</Badge> : null}
                      <span>{formatDate(message.createdAt)}</span>
                      {mine ? <span className="font-medium text-ink-secondary">You</span> : null}
                    </div>
                    <div
                      className={cn(
                        "rounded-[26px] border px-4 py-4",
                        message.internal
                          ? "border-warn/30 bg-warn/10"
                          : mine
                            ? "border-accent/30 bg-accent/10"
                            : "border-hairline bg-bg/70",
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{message.body}</p>
                      {message.attachments?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={supportAttachmentUrl(attachment.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-line bg-bg/60 px-2.5 py-1 text-xs text-ink-secondary hover:border-line-hover hover:text-ink"
                            >
                              <Paperclip className="size-3" />
                              {attachment.name} · {formatAttachmentSize(attachment.sizeBytes)}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="shrink-0 border-t border-hairline bg-bg/60 px-5 py-5 sm:px-6">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                reply(event.currentTarget);
              }}
            >
              <div className="rounded-[26px] border border-hairline bg-bg/70 p-3">
                <Textarea
                  name="reply"
                  rows={6}
                  placeholder="Mesajinizi yazin..."
                  maxLength={10_000}
                  className="min-h-[132px] resize-none border-0 bg-transparent px-1 py-1 shadow-none focus-visible:ring-0"
                  required
                />
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
                  <Input
                    type="file"
                    multiple
                    accept=".csv,.gif,.jpeg,.jpg,.json,.log,.md,.pdf,.png,.txt,.webp,.zip,text/plain,text/log,text/csv,text/markdown,application/json,application/pdf,application/zip,image/*"
                    className="max-w-sm"
                    onChange={async (event) => {
                      try {
                        const payload = await filesToPayload(event.target.files);
                        setReplyAttachments(payload);
                      } catch (error) {
                        event.currentTarget.value = "";
                        setReplyAttachments([]);
                        toast.error((error as Error).message);
                      }
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm text-ink-secondary">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(event) => setInternal(event.target.checked)}
                      className="size-4 rounded border-line"
                    />
                    Save as internal note
                  </label>
                  <div className="ml-auto flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={replyMut.isPending}>
                      <Send className="size-4" />
                      {replyMut.isPending ? "Sending..." : internal ? "Add note" : "Send"}
                    </Button>
                  </div>
                </div>
              </div>

              {replyAttachments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((attachment) => (
                    <Badge key={`${attachment.name}-${attachment.sizeBytes}`} variant="outline">
                      <Paperclip className="size-3" />
                      {attachment.name} · {formatAttachmentSize(attachment.sizeBytes)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
