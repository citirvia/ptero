"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Lock,
  MessageCircle,
  Paperclip,
  Send,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/api/auth";
import { supportAttachmentUrl } from "@/lib/api/client";
import {
  useReplySupportTicket,
  useSupportTicket,
  useUpdateSupportTicket,
} from "@/lib/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import {
  filesToPayload,
  formatAttachmentSize,
  MAX_SUPPORT_ATTACHMENTS,
  PendingAttachment,
  PRIORITY_META,
  STATUS_META,
  TicketPriority,
  TicketStatus,
  ticketNumber,
} from "./support-shared";

type TicketDetail = {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  serverIdentifier: string | null;
  createdAt: string;
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

export function SupportTicketDetail({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const detailQ = useSupportTicket(ticketId);
  const detail = (detailQ.data ?? null) as TicketDetail | null;
  const replyMut = useReplySupportTicket(ticketId);
  const ticketMut = useUpdateSupportTicket(ticketId);
  const [replyAttachments, setReplyAttachments] = useState<PendingAttachment[]>([]);

  function updateStatus(status: "OPEN" | "CLOSED") {
    ticketMut.mutate(
      { status },
      {
        onSuccess: () => toast.success(status === "CLOSED" ? "Ticket closed." : "Ticket reopened."),
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  function handleReply(form: HTMLFormElement) {
    const body = String(new FormData(form).get("reply") ?? "").trim();
    if (!body) return;
    replyMut.mutate(
      { body, attachments: replyAttachments },
      {
        onSuccess: () => {
          form.reset();
          setReplyAttachments([]);
          toast.success("Reply sent.");
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  if (detailQ.isLoading) {
    return (
      <Card className="min-h-[720px] overflow-hidden border-hairline bg-bg/60">
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
          <Link href="/dashboard/support">
            <ArrowLeft className="size-4" /> Back to tickets
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
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_META[detail.status].variant}>
                  {STATUS_META[detail.status].label}
                </Badge>
                <Badge variant={PRIORITY_META[detail.priority]}>{detail.priority.toLowerCase()}</Badge>
                <Badge variant="outline">{detail.category.toLowerCase()}</Badge>
                {detail.serverIdentifier ? (
                  <Badge variant="outline">
                    <Server className="size-3" /> {detail.serverIdentifier}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {detail.status === "CLOSED" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={ticketMut.isPending}
                  onClick={() => updateStatus("OPEN")}
                >
                  Reopen
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={ticketMut.isPending}
                  onClick={() => updateStatus("CLOSED")}
                >
                  <Lock className="size-4" /> Close ticket
                </Button>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-hairline bg-bg/70 px-4 py-4 text-xs text-ink-muted">
              <span className="mb-2 flex items-center gap-2 font-medium text-ink-secondary">
                <UserRound className="size-3.5" /> Requester
              </span>
              <p className="text-sm text-ink">{detail.requester.name}</p>
            </div>
            <div className="rounded-[24px] border border-hairline bg-bg/70 px-4 py-4 text-xs text-ink-muted">
              <span className="mb-2 flex items-center gap-2 font-medium text-ink-secondary">
                <MessageCircle className="size-3.5" /> Assigned staff
              </span>
              <p className="text-sm text-ink">{detail.assignee?.name ?? "Unassigned"}</p>
            </div>
            <div className="rounded-[24px] border border-hairline bg-bg/70 px-4 py-4 text-xs text-ink-muted">
              <span className="mb-2 flex items-center gap-2 font-medium text-ink-secondary">
                <Clock3 className="size-3.5" /> Created
              </span>
              <p className="text-sm text-ink">{formatDate(detail.createdAt)}</p>
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
        <CardContent className="flex h-[850px] flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto bg-bg/55 px-5 py-5 sm:px-6">
            {detail.messages.map((message) => {
              const mine = message.authorId != null && message.authorId === user?.sub;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className="max-w-[88%] space-y-2">
                    <div className={cn("flex items-center gap-2 px-1 text-[11px] text-ink-muted", mine ? "justify-end" : "justify-start")}>
                      {!mine ? <span className="font-medium text-ink-secondary">{message.authorName}</span> : null}
                      <span>{formatDate(message.createdAt)}</span>
                      {mine ? <span className="font-medium text-ink-secondary">You</span> : null}
                    </div>
                    <div
                      className={cn(
                        "rounded-[26px] border px-4 py-4",
                        mine
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
                handleReply(event.currentTarget);
              }}
            >
              <div className="rounded-[26px] border border-hairline bg-bg/70 p-3">
                <Textarea
                  id="reply"
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
                  <div className="ml-auto flex items-center gap-2">
                    {detail.status === "CLOSED" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={ticketMut.isPending}
                        onClick={() => updateStatus("OPEN")}
                      >
                        Reopen
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={ticketMut.isPending}
                        onClick={() => updateStatus("CLOSED")}
                      >
                        <Lock className="size-4" />
                        Close ticket
                      </Button>
                    )}
                    <Button type="submit" size="sm" disabled={replyMut.isPending}>
                      <Send className="size-4" />
                      {replyMut.isPending ? "Sending..." : "Send"}
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

              <div className="grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_1.2fr]">
                <div className="rounded-[20px] border border-hairline bg-bg/60 px-4 py-3 text-xs text-ink-muted">
                  <span className="mb-2 flex items-center gap-2 font-medium text-ink-secondary">
                    <UserRound className="size-3.5" />
                    Requester
                  </span>
                  <p className="text-sm text-ink">{detail.requester.name}</p>
                </div>
                <div className="rounded-[20px] border border-hairline bg-bg/60 px-4 py-3 text-xs text-ink-muted">
                  <span className="mb-2 flex items-center gap-2 font-medium text-ink-secondary">
                    <MessageCircle className="size-3.5" />
                    Assigned staff
                  </span>
                  <p className="text-sm text-ink">{detail.assignee?.name ?? "Unassigned"}</p>
                </div>
                <div className="rounded-[20px] border border-hairline bg-bg/60 px-4 py-3 text-xs text-ink-muted">
                  <span className="mb-2 flex items-center gap-2 font-medium text-ink-secondary">
                    <Clock3 className="size-3.5" />
                    Created
                  </span>
                  <p className="text-sm text-ink">{formatDate(detail.createdAt)}</p>
                </div>
                <div className="rounded-[20px] border border-dashed border-hairline bg-bg/50 px-4 py-3 text-xs text-ink-muted">
                  <p className="flex items-center gap-2 font-medium text-ink-secondary">
                    <ShieldCheck className="size-4 text-accent-soft" />
                    Attachment Safety
                  </p>
                  <p className="mt-2">
                    Up to {MAX_SUPPORT_ATTACHMENTS} files, 5 MB each. New customer replies automatically reopen resolved or closed tickets.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
