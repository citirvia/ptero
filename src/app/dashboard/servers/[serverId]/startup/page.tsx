"use client";

import { useState } from "react";
import { Boxes, Eye, EyeOff, KeyRound, Save, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { RUNTIME_META } from "@/lib/api/types";
import { useServer, useServerId } from "../_components/use-server";
import {
  useStartup,
  useSetStartupVar,
  useDockerImages,
  useSetDockerImage,
} from "@/lib/api/hooks";

type StartupVariable = {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string;
  is_editable: boolean;
  rules: string;
};

type StartupResponse = {
  variables: StartupVariable[];
  meta: { startup_command?: string; raw_startup_command?: string };
};

const SECRET_RE = /secret|token|key|password|auth/i;

export default function StartupPage() {
  const id = useServerId();
  const server = useServer();
  const startupQuery = useStartup(id);
  const setVar = useSetStartupVar(id);
  const setDockerImage = useSetDockerImage(id);
  const dockerImagesQuery = useDockerImages(id);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (!server) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const runtime = RUNTIME_META[server.runtime];

  return (
    <DataState
      query={startupQuery}
      loading={
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
          <Skeleton className="h-72" />
        </div>
      }
      error={(err, retry) => (
        <ErrorState description={err.message} onRetry={retry} />
      )}
    >
      {(data) => {
        const startup = data as StartupResponse;
        const dockerImages = (dockerImagesQuery.data ?? {}) as Record<string, string>;
        const imageOptions = Object.entries(dockerImages);

        return (
          <div className="mx-auto max-w-5xl space-y-6">
            <Card>
              <CardHeader className="flex-row items-center gap-2.5">
                <Terminal className="size-4 text-accent-soft" />
                <CardTitle>Startup command</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={startup.meta?.startup_command ?? ""}
                  readOnly
                  className="min-h-28 font-mono text-sm"
                  spellCheck={false}
                />
                <p className="mt-2 text-xs text-ink-muted">
                  Variables wrapped in{" "}
                  <code className="font-mono text-ink-secondary">{"${...}"}</code>{" "}
                  are substituted from environment variables at boot. Edit the
                  underlying command from the panel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-2.5">
                <Boxes className="size-4 text-accent-soft" />
                <CardTitle>Runtime</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-hairline bg-elevated/40 p-4">
                  <div className="space-y-1.5">
                  <Label htmlFor="docker-image">Runtime image</Label>
                  {imageOptions.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      No alternate images available for this egg.
                    </p>
                  ) : (
                    <select
                      id="docker-image"
                      className="h-10 w-full rounded-xl border border-line bg-bg px-3.5 font-mono text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      onChange={(e) =>
                        setDockerImage.mutate(e.target.value, {
                          onSuccess: () => toast.success("Runtime image updated"),
                          onError: (err: Error) => toast.error(err.message),
                        })
                      }
                    >
                      {imageOptions.map(([label, img]) => (
                        <option key={img} value={img}>
                          {label} — {img}
                        </option>
                      ))}
                    </select>
                  )}
                  </div>
                </div>
                <div className="rounded-2xl border border-hairline bg-elevated/40 p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="runtime-version">Runtime</Label>
                    <div
                      id="runtime-version"
                      className="flex h-10 items-center rounded-xl border border-line bg-bg px-3.5 font-mono text-sm text-ink"
                    >
                      {runtime.label} {server.runtimeVersion}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variables sit directly under Runtime so the page reads top
                 to bottom without a tall second column floating to the side. */}
            <Card className="overflow-hidden p-0">
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="size-4 text-accent-soft" />
                  <CardTitle>Startup variables</CardTitle>
                </div>
                <Badge variant="outline">{startup.variables.length} vars</Badge>
              </CardHeader>
              <div className="border-t border-hairline">
                <div className="hidden grid-cols-[1fr_1.4fr_auto] gap-4 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted sm:grid">
                  <span>Key</span>
                  <span>Value</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-hairline">
                {startup.variables.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-ink-muted">
                    This egg has no startup variables.
                  </p>
                ) : (
                  startup.variables.map((v) => {
                    const key = v.env_variable;
                    const secret = SECRET_RE.test(key);
                    const draft = drafts[key];
                    const current = draft ?? (v.server_value ?? "");
                    const dirty =
                      draft !== undefined &&
                      draft !== (v.server_value ?? "");
                    const show = revealed[key] || !secret;
                    return (
                      <div
                        key={key}
                        className="grid grid-cols-1 gap-3 px-5 py-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <code className="font-mono text-xs text-ink-secondary">
                            {key}
                          </code>
                          {v.description && (
                            <p className="mt-1 text-[11px] text-ink-muted">
                              {v.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type={show ? "text" : "password"}
                            value={current}
                            disabled={!v.is_editable}
                            onChange={(e) =>
                              setDrafts((p) => ({ ...p, [key]: e.target.value }))
                            }
                            className="h-9 font-mono text-xs"
                            aria-label={`${key} value`}
                          />
                          {secret && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={show ? "Hide value" : "Reveal value"}
                              onClick={() =>
                                setRevealed((p) => ({ ...p, [key]: !p[key] }))
                              }
                            >
                              {show ? <EyeOff /> : <Eye />}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          {secret && (
                            <Badge variant="warn" className="hidden sm:inline-flex">
                              secret
                            </Badge>
                          )}
                          {!v.is_editable && (
                            <Badge variant="outline" className="hidden sm:inline-flex">
                              read-only
                            </Badge>
                          )}
                          {dirty && v.is_editable && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={setVar.isPending}
                              onClick={() =>
                                setVar.mutate(
                                  { key, value: current },
                                  {
                                    onSuccess: () => {
                                      toast.success(`${key} saved`);
                                      setDrafts((p) => {
                                        const next = { ...p };
                                        delete next[key];
                                        return next;
                                      });
                                    },
                                    onError: (err: Error) => toast.error(err.message),
                                  },
                                )
                              }
                            >
                              <Save />
                              Save
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>
              <CardContent className="border-t border-hairline pt-5">
                <p className="text-xs text-ink-muted">
                  Variables are defined by the egg; only the values can be changed.
                  Changes apply on next boot.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </DataState>
  );
}
