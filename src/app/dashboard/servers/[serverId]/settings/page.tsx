"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useServer, useServerQuery, useServerId } from "../_components/use-server";
import {
  useRenameServer,
  useReinstallServer,
  useSetDockerImage,
  useDockerImages,
  useDeleteServer,
} from "@/lib/api/hooks";

export default function SettingsPage() {
  const router = useRouter();
  const id = useServerId();
  const server = useServer();
  const serverQuery = useServerQuery();
  const renameServer = useRenameServer(id);
  const reinstall = useReinstallServer(id);
  const setDockerImage = useSetDockerImage(id);
  const deleteServer = useDeleteServer(id);
  const dockerImagesQuery = useDockerImages(id);

  const [name, setName] = useState(server?.name ?? "");
  const [confirm, setConfirm] = useState("");

  // Sync local name once the server arrives.
  useEffect(() => {
    if (server?.name) setName(server.name);
  }, [server?.name]);

  if (serverQuery.isError) {
    return (
      <ErrorState
        description={(serverQuery.error as Error)?.message}
        onRetry={() => void serverQuery.refetch()}
      />
    );
  }

  if (!server) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const dockerImages = (dockerImagesQuery.data ?? {}) as Record<string, string>;
  const imageOptions = Object.entries(dockerImages);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rename */}
        <Card>
          <CardHeader className="flex-row items-center gap-2.5">
            <Server className="size-4 text-ink-muted" />
            <CardTitle>Server name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Server name"
            />
            <Button
              size="sm"
              disabled={!name.trim() || name === server.name || renameServer.isPending}
              onClick={() =>
                renameServer.mutate(name.trim(), {
                  onSuccess: () => toast.success("Server renamed"),
                  onError: (e: Error) => toast.error(e.message),
                })
              }
            >
              Save
            </Button>
          </CardContent>
        </Card>

        {/* Runtime image */}
        <Card>
          <CardHeader>
            <CardTitle>Runtime image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imageOptions.length === 0 ? (
              <p className="text-xs text-ink-muted">
                This egg does not expose alternate images.
              </p>
            ) : (
              <select
                onChange={(e) =>
                  setDockerImage.mutate(e.target.value, {
                    onSuccess: () => toast.success("Runtime image updated"),
                    onError: (err: Error) => toast.error(err.message),
                  })
                }
                className="h-10 w-full rounded-xl border border-line bg-bg px-3.5 font-mono text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {imageOptions.map(([label, img]) => (
                  <option key={img} value={img}>
                    {label} — {img}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-ink-muted">
              The new image is applied on next boot.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reinstall */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-2.5">
            <RefreshCw className="size-4 text-warn" />
            <CardTitle>Reinstall</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-ink-muted">
              Re-run the install script. Files in the data directory are
              preserved; dependencies are reinstalled.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Reinstall server
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reinstall {server.name}?</DialogTitle>
                  <DialogDescription>
                    This stops the server and re-runs the install process. It
                    may take a few minutes.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      size="sm"
                      disabled={reinstall.isPending}
                      onClick={() =>
                        reinstall.mutate(undefined, {
                          onSuccess: () => toast("Reinstall started…"),
                          onError: (e: Error) => toast.error(e.message),
                        })
                      }
                    >
                      Confirm reinstall
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Danger zone */}
      <Card className="border-danger/20">
        <CardHeader className="flex-row items-center gap-2.5">
          <AlertTriangle className="size-4 text-danger" />
          <CardTitle className="text-danger">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink">Delete this server</p>
            <p className="text-xs text-ink-muted">
              Permanently destroys the server environment, files, and all backups. This
              cannot be undone.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="danger" size="sm">
                <Trash2 />
                Delete server
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {server.name}</DialogTitle>
                <DialogDescription>
                  Type{" "}
                  <code className="font-mono text-ink">{server.name}</code> to
                  confirm permanent deletion. This action is only available to
                  platform admins.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={server.name}
                className="font-mono"
                aria-label="Type server name to confirm"
              />
              <div className="mt-4 flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </DialogClose>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={confirm !== server.name || deleteServer.isPending}
                  onClick={() =>
                    deleteServer.mutate(undefined, {
                      onSuccess: () => {
                        toast.success("Server deleted");
                        router.push("/dashboard/servers");
                      },
                      onError: (e: Error) => toast.error(e.message),
                    })
                  }
                >
                  Delete forever
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
