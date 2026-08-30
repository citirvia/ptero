"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerId } from "../_components/use-server";
import { useStartup, useSetStartupVar } from "@/lib/api/hooks";

type StartupVariable = {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string;
  is_editable: boolean;
  rules: string;
};

type StartupResponse = { variables: StartupVariable[]; meta: unknown };

const SECRET_RE = /secret|token|key|password|auth/i;

export default function EnvPage() {
  const id = useServerId();
  const startupQuery = useStartup(id);
  const setVar = useSetStartupVar(id);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [bulk, setBulk] = useState("");

  // Reset drafts when fresh data lands (e.g. after a save / refetch).
  useEffect(() => {
    setDrafts({});
  }, [startupQuery.dataUpdatedAt]);

  function persist(key: string, value: string) {
    setVar.mutate(
      { key, value },
      {
        onSuccess: () => {
          toast.success(`${key} saved`);
          setDrafts((p) => {
            const { [key]: _drop, ...rest } = p;
            return rest;
          });
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  function importBulk(variables: StartupVariable[]) {
    const parsed = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const [k, ...rest] = l.split("=");
        return { key: k.trim().toUpperCase(), value: rest.join("=").trim() };
      });
    if (parsed.length === 0) {
      toast.error("No valid KEY=value lines found");
      return;
    }
    const knownKeys = new Set(variables.map((v) => v.env_variable));
    const matched = parsed.filter((p) => knownKeys.has(p.key));
    const unknown = parsed.length - matched.length;
    if (matched.length === 0) {
      toast.error(`No matching variables in this egg (${unknown} ignored)`);
      return;
    }
    Promise.all(
      matched.map(
        (m) =>
          new Promise<void>((resolve) =>
            setVar.mutate(
              { key: m.key, value: m.value },
              {
                onSuccess: () => resolve(),
                onError: () => resolve(),
              },
            ),
          ),
      ),
    ).then(() => {
      toast.success(`Imported ${matched.length} variable(s)${unknown ? `; ${unknown} ignored` : ""}`);
      setBulk("");
    });
  }

  return (
    <div className="space-y-6">
      <DataState
        query={startupQuery}
        loading={<Skeleton className="h-72" />}
        empty={
          <EmptyState
            icon={<KeyRound />}
            title="No environment variables"
            description="This egg does not expose any startup variables."
          />
        }
        isEmpty={(d) => (d as StartupResponse).variables.length === 0}
      >
        {(data) => {
          const vars = (data as StartupResponse).variables;
          return (
            <Card className="overflow-hidden p-0">
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="size-4 text-accent-soft" />
                  <CardTitle>Environment variables</CardTitle>
                </div>
                <Badge variant="outline">{vars.length} vars</Badge>
              </CardHeader>
              <div className="border-t border-hairline">
                <div className="hidden grid-cols-[1fr_1.4fr_auto] gap-4 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted sm:grid">
                  <span>Key</span>
                  <span>Value</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-hairline">
                  {vars.map((v) => {
                    const k = v.env_variable;
                    const secret = SECRET_RE.test(k);
                    const draft = drafts[k];
                    const value = draft ?? (v.server_value ?? "");
                    const dirty = draft !== undefined && draft !== (v.server_value ?? "");
                    const show = revealed[k] || !secret;
                    return (
                      <div
                        key={k}
                        className="grid grid-cols-1 gap-3 px-5 py-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <code className="font-mono text-xs text-ink-secondary">
                            {k}
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
                            value={value}
                            disabled={!v.is_editable}
                            onChange={(e) =>
                              setDrafts((p) => ({ ...p, [k]: e.target.value }))
                            }
                            className="h-9 font-mono text-xs"
                            aria-label={`${k} value`}
                          />
                          {secret && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={show ? "Hide value" : "Reveal value"}
                              onClick={() =>
                                setRevealed((p) => ({ ...p, [k]: !p[k] }))
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
                              onClick={() => persist(k, value)}
                            >
                              <Save />
                              Save
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <CardContent className="border-t border-hairline pt-5">
                <p className="text-xs text-ink-muted">
                  Variables are defined by the egg; only the values can be changed.
                  Changes apply on next boot.
                </p>
              </CardContent>
            </Card>
          );
        }}
      </DataState>

      {/* Bulk import */}
      {startupQuery.data ? (
        <Card>
          <CardHeader className="flex-row items-center gap-2.5">
            <Upload className="size-4 text-ink-muted" />
            <CardTitle>Bulk import (.env)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="bulk" className="text-xs text-ink-muted">
              Paste KEY=value lines. Only keys that already exist in this egg
              are applied.
            </Label>
            <Textarea
              id="bulk"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={"REDIS_URL=redis://...\nSENTRY_DSN=https://...\n# comments are ignored"}
              className="min-h-32 font-mono text-xs"
              spellCheck={false}
            />
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  importBulk((startupQuery.data as StartupResponse).variables)
                }
                disabled={!bulk.trim()}
              >
                Import variables
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
