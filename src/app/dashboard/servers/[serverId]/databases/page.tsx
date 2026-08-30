"use client";

import { useState } from "react";
import { Check, Copy, Database, KeyRound, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input, Label } from "@/components/ui/input";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useServerId } from "../_components/use-server";
import {
  useDatabases,
  useCreateDatabase,
  useDeleteDatabase,
  useRotateDbPassword,
} from "@/lib/api/hooks";

type ClientDatabase = {
  id: string;
  name: string;
  username: string;
  host: { address: string; port: number };
  connections_from: string;
  max_connections: number;
};

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink-secondary">
        {value}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Copy connection string"
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => {});
          setCopied(true);
          toast.success("Connection string copied");
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="text-online" /> : <Copy />}
      </Button>
    </div>
  );
}

export default function DatabasesPage() {
  const id = useServerId();
  const query = useDatabases(id);
  const createDb = useCreateDatabase(id);
  const deleteDb = useDeleteDatabase(id);
  const rotate = useRotateDbPassword(id);

  const [name, setName] = useState("");
  const [remote, setRemote] = useState("%");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Databases</h2>
          <p className="text-xs text-ink-muted">
            Managed databases provisioned for this server
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Create database
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create database</DialogTitle>
              <DialogDescription>
                Provision a new managed database for this server.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="db-name">Name</Label>
                <Input
                  id="db-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="atlas_jobs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="db-remote">Allowed remote</Label>
                <Input
                  id="db-remote"
                  value={remote}
                  onChange={(e) => setRemote(e.target.value)}
                  placeholder="% or 1.2.3.4/32"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  size="sm"
                  disabled={!name.trim() || createDb.isPending}
                  onClick={() =>
                    createDb.mutate(
                      { database: name.trim(), remote: remote.trim() || "%" },
                      {
                        onSuccess: () => {
                          toast.success("Database created");
                          setName("");
                        },
                        onError: (e: Error) => toast.error(e.message),
                      },
                    )
                  }
                >
                  Create
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataState
        query={query}
        loading={<CardSkeleton count={2} />}
        empty={
          <EmptyState
            icon={<Database />}
            title="No databases yet"
            description="Provision one above to get a connection string."
          />
        }
      >
        {(data) => {
          const rows = data as ClientDatabase[];
          return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {rows.map((db) => {
                const host = `${db.host.address}:${db.host.port}`;
                const max = db.max_connections || 25;
                const pct = 0;
                return (
                  <Card key={db.id}>
                    <CardHeader className="flex-row items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent-soft">
                          <Database className="size-4.5" />
                        </span>
                        <div>
                          <CardTitle className="font-mono">{db.name}</CardTitle>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {db.username}
                          </p>
                        </div>
                      </div>
                      <Badge variant="accent">{max} max</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Host</span>
                        <span className="font-mono text-ink-secondary">{host}</span>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-ink-muted">Allowed from</span>
                          <span className="font-mono text-ink-secondary">
                            {db.connections_from}
                          </span>
                        </div>
                        <Progress value={pct} />
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs text-ink-muted">
                          Connection string
                        </p>
                        <CopyRow
                          value={`mysql://${db.username}:••••@${host}/${db.name}`}
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rotate.isPending}
                          onClick={() =>
                            rotate.mutate(db.id, {
                              onSuccess: () => toast.success("Password rotated"),
                              onError: (e: Error) => toast.error(e.message),
                            })
                          }
                        >
                          <KeyRound /> Rotate
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deleteDb.isPending}
                          onClick={() =>
                            deleteDb.mutate(db.id, {
                              onSuccess: () => toast.success("Database deleted"),
                              onError: (e: Error) => toast.error(e.message),
                            })
                          }
                        >
                          <Trash2 /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
