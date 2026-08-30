"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  ServerOff,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DataState } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RUNTIME_META,
  type Runtime,
  type Server,
} from "@/lib/api/types";
import { useServers } from "@/lib/api/hooks";
import { toUiServer, type PteroClientServer } from "@/lib/api/adapters";
import { cn } from "@/lib/utils";
import { ServerGridCard, ServerListRow } from "./_components/server-card";

type RuntimeFilter = "all" | Runtime;
type StatusFilter = "all" | "online" | "offline" | "installing" | "starting" | "stopping";
type View = "grid" | "list";

const RUNTIME_OPTIONS: { value: RuntimeFilter; label: string }[] = [
  { value: "all", label: "All runtimes" },
  ...(Object.keys(RUNTIME_META) as Runtime[]).map((r) => ({
    value: r,
    label: RUNTIME_META[r].label,
  })),
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "installing", label: "Installing" },
  { value: "starting", label: "Starting" },
  { value: "stopping", label: "Stopping" },
];

const selectClass =
  "h-9 rounded-xl border border-line bg-bg px-3 text-sm text-ink-secondary transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function ServersPage() {
  const [query, setQuery] = useState("");
  const [runtime, setRuntime] = useState<RuntimeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [region, setRegion] = useState("all");
  const [view, setView] = useState<View>("grid");

  const liveQ = useServers();
  const servers: Server[] = useMemo(
    () =>
      ((liveQ.data as PteroClientServer[] | undefined) ?? []).map((s) =>
        toUiServer(s),
      ),
    [liveQ.data],
  );

  const regionOptions = useMemo(
    () => [
      { value: "all", label: "All regions" },
      ...Array.from(new Set(servers.map((s) => s.region))).map((r) => ({
        value: r,
        label: r,
      })),
    ],
    [servers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (runtime !== "all" && s.runtime !== runtime) return false;
      if (status === "online" && s.status !== "online") return false;
      if (status === "offline" && s.status !== "offline") return false;
      if (status === "installing" && s.status !== "installing") return false;
      if (status === "starting" && s.status !== "starting") return false;
      if (status === "stopping" && s.status !== "stopping") return false;
      if (region !== "all" && s.region !== region) return false;
      return true;
    });
  }, [servers, query, runtime, status, region]);

  const hasFilters =
    query !== "" || runtime !== "all" || status !== "all" || region !== "all";

  function clearFilters() {
    setQuery("");
    setRuntime("all");
    setStatus("all");
    setRegion("all");
  }

  const totalCount = servers.length;
  const onlineCount = servers.filter((s) => s.status === "online").length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Servers"
        description={
          liveQ.isLoading
            ? "Loading your fleet…"
            : `${totalCount} servers · ${onlineCount} online`
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search servers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-44 pl-9 sm:w-56"
            aria-label="Search servers"
          />
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/servers/new">
            <Plus />
            New server
          </Link>
        </Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-card p-3">
        <select
          value={runtime}
          onChange={(e) => setRuntime(e.target.value as RuntimeFilter)}
          className={selectClass}
          aria-label="Filter by runtime"
        >
          {RUNTIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className={selectClass}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={selectClass}
          aria-label="Filter by region"
        >
          {regionOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X />
            Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-xs text-ink-muted sm:inline">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-line bg-bg p-1">
            <ViewButton
              active={view === "grid"}
              onClick={() => setView("grid")}
              label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </ViewButton>
            <ViewButton
              active={view === "list"}
              onClick={() => setView("list")}
              label="List view"
            >
              <List className="size-4" />
            </ViewButton>
          </div>
        </div>
      </div>

      {/* Results */}
      <DataState
        query={liveQ}
        loading={
          view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-base p-5">
                  <Skeleton className="h-44 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-base">
              <TableSkeleton rows={6} columns={5} />
            </div>
          )
        }
        error={(e, retry) => (
          <ErrorState description={e.message} onRetry={retry} />
        )}
        empty={
          <EmptyState
            icon={<ServerOff />}
            title="No servers yet"
            description="Spin up your first server to start shipping."
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/servers/new">
                  <Plus />
                  Deploy a server
                </Link>
              </Button>
            }
          />
        }
      >
        {() =>
          filtered.length === 0 ? (
            <FilteredEmptyState onClear={clearFilters} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <ServerGridCard key={s.id} server={s} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <ServerListRow key={s.id} server={s} />
              ))}
            </div>
          )
        }
      </DataState>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-7 items-center justify-center rounded-lg transition-colors",
        active ? "bg-elevated text-ink" : "text-ink-muted hover:text-ink-secondary",
      )}
    >
      {children}
    </button>
  );
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/50 px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-line bg-elevated text-ink-muted">
        <ServerOff className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink">No servers match</h3>
      <p className="mt-1 max-w-xs text-sm text-ink-muted">
        Try adjusting your search or filters to find what you&apos;re looking
        for.
      </p>
      <Button variant="secondary" size="sm" className="mt-5" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
