"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Inbox,
  Paperclip,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateSupportTicket, useSupportTickets } from "@/lib/api/hooks";
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
  MAX_SUPPORT_ATTACHMENTS,
  PendingAttachment,
  PRIORITY_META,
  STATUS_META,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_SELECT_CLASS,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  ticketNumber,
} from "./support-shared";

type TicketSummary = {
  id: string;
  number: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  serverIdentifier: string | null;
  updatedAt: string;
  createdAt: string;
  lastReplyAt: string;
  messages?: { body: string; createdAt: string; authorName: string; internal: boolean }[];
  assignee?: { id: string; name: string; email: string } | null;
};

type SupportViewProps = {
  mode?: "inbox" | "new";
};

export function SupportView({ mode = "inbox" }: SupportViewProps) {
  const router = useRouter();
  const ticketsQ = useSupportTickets();
  const tickets = (ticketsQ.data ?? []) as TicketSummary[];
  const createMut = useCreateSupportTicket();
  const [createAttachments, setCreateAttachments] = useState<PendingAttachment[]>([]);
  const isCreateMode = mode === "new";

  function handleCreate(formData: FormData, form: HTMLFormElement) {
    createMut.mutate(
      {
        subject: String(formData.get("subject") ?? "").trim(),
        category: String(formData.get("category") ?? "OTHER"),
        priority: String(formData.get("priority") ?? "NORMAL"),
        serverIdentifier: String(formData.get("serverIdentifier") ?? "").trim() || undefined,
        message: String(formData.get("message") ?? "").trim(),
        attachments: createAttachments,
      },
      {
        onSuccess: (data) => {
          const ticket = (data as { ticket?: { id?: string } }).ticket;
          form.reset();
          setCreateAttachments([]);
          toast.success("Ticket created successfully.");
          if (ticket?.id) {
            router.push(`/dashboard/support/${ticket.id}`);
          }
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  if (ticketsQ.isError) {
    return (
      <ErrorState
        title="Support is unavailable"
        description={(ticketsQ.error as Error)?.message}
        onRetry={() => void ticketsQ.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isCreateMode ? (
        <Card className="overflow-hidden border-hairline bg-bg/60">
          <CardHeader className="border-b border-hairline bg-bg/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">New Support Request</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">
                  Describe the issue, attach files if needed, and submit the request.
                </p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard/support">
                  <ArrowLeft className="size-4" />
                  Back to support requests
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreate(new FormData(event.currentTarget), event.currentTarget);
              }}
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor="subject">Case Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Example: Billing invoice mismatch for May cycle"
                    maxLength={160}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" name="category" className={SUPPORT_SELECT_CLASS} defaultValue="DEPLOYMENT">
                    {SUPPORT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <select id="priority" name="priority" className={SUPPORT_SELECT_CLASS} defaultValue="NORMAL">
                    {SUPPORT_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor="serverIdentifier">Related Server</Label>
                  <Input
                    id="serverIdentifier"
                    name="serverIdentifier"
                    placeholder="Optional: server identifier or UUID"
                    maxLength={64}
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor="message">Case Description</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={8}
                    placeholder="Describe the issue, expected behavior, recent changes, timestamps and any reproducible steps."
                    maxLength={10_000}
                    className="resize-none"
                    required
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="create-attachments">Evidence Files</Label>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Allowed: pdf, images, txt, log, json, zip</span>
                  </div>
                  <Input
                    id="create-attachments"
                    type="file"
                    multiple
                    accept=".csv,.gif,.jpeg,.jpg,.json,.log,.md,.pdf,.png,.txt,.webp,.zip,text/plain,text/log,text/csv,text/markdown,application/json,application/pdf,application/zip,image/*"
                    onChange={async (event) => {
                      try {
                        const payload = await filesToPayload(event.target.files);
                        setCreateAttachments(payload);
                      } catch (error) {
                        event.currentTarget.value = "";
                        setCreateAttachments([]);
                        toast.error((error as Error).message);
                      }
                    }}
                  />
                  {createAttachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {createAttachments.map((attachment) => (
                        <Badge key={`${attachment.name}-${attachment.sizeBytes}`} variant="outline">
                          <Paperclip className="size-3" />
                          {attachment.name} · {formatAttachmentSize(attachment.sizeBytes)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="rounded-[24px] border border-dashed border-hairline bg-bg/45 p-4 text-sm text-ink-muted">
                Upload up to {MAX_SUPPORT_ATTACHMENTS} attachments, 5 MB each. Unsupported file types are rejected before submission to reduce unsafe uploads.
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={createMut.isPending}>
                  <Send className="size-4" />
                  {createMut.isPending ? "Submitting..." : "Submit Case"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-hairline bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
          <CardHeader className="border-b border-hairline">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Support Requests</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">Open and archived conversations, each kept as a formal ticket record.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-hairline bg-bg/70 px-3 py-1 text-xs text-ink-secondary">
                  {tickets.length} cases
                </span>
                <Button asChild size="sm">
                  <Link href="/dashboard/support/new">
                    <Send className="size-4" />
                    New Support Request
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {ticketsQ.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : tickets.length === 0 ? (
              <EmptyState
                icon={<Inbox />}
                title="No support cases yet"
                description="Create your first case to start a documented conversation with support."
              />
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                    className={cn(
                      "w-full rounded-[24px] border border-hairline bg-bg/40 p-4 text-left transition-colors hover:border-line-hover hover:bg-overlay",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-ink-muted">{ticketNumber(ticket.number)}</p>
                        <p className="mt-1 truncate text-sm font-medium text-ink">{ticket.subject}</p>
                      </div>
                      <Badge variant={STATUS_META[ticket.status].variant}>{STATUS_META[ticket.status].label}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant={PRIORITY_META[ticket.priority]}>{ticket.priority.toLowerCase()}</Badge>
                      <Badge variant="outline">{ticket.category.toLowerCase()}</Badge>
                      {ticket.serverIdentifier ? (
                        <span className="text-xs text-ink-muted">{ticket.serverIdentifier}</span>
                      ) : null}
                    </div>
                    {ticket.messages?.[0] ? (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-muted">{ticket.messages[0].body}</p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Updated {formatDate(ticket.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1 text-ink-secondary">
                        View case <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
