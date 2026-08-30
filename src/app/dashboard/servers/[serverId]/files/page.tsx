"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  File as FileIcon,
  Folder,
  Search,
  Upload,
  FolderPlus,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatBytes, formatDate } from "@/lib/utils";
import { useServerId } from "../_components/use-server";
import { SectionTitle } from "../_components/shared";
import {
  useFiles,
  useCreateFolder,
  useDeleteFiles,
  useDownloadFileUrl,
  useUploadFileUrl,
} from "@/lib/api/hooks";

// Live Pterodactyl file object shape (subset).
type FileObject = {
  name: string;
  mode: string;
  size: number;
  is_file: boolean;
  mimetype: string;
  modified_at: string;
};

type FilesResponse = {
  files: FileObject[];
  access: { restricted: boolean };
};

export default function FilesPage() {
  const id = useServerId();
  const searchParams = useSearchParams();
  const initialPath = useMemo(() => {
    const dirParam = searchParams.get("dir") ?? "/";
    return dirParam
      .split("/")
      .map((seg) => seg.trim())
      .filter(Boolean);
  }, [searchParams]);
  const [path, setPath] = useState<string[]>(initialPath);
  const [query, setQuery] = useState("");
  const [folderName, setFolderName] = useState("");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const dir = "/" + path.join("/");
  const filesQuery = useFiles(id, dir);
  const createFolder = useCreateFolder(id);
  const deleteFiles = useDeleteFiles(id);
  const downloadUrl = useDownloadFileUrl(id);
  const uploadUrl = useUploadFileUrl(id);
  const fileAccessRestricted =
    Boolean((filesQuery.data as FilesResponse | undefined)?.access?.restricted);

  return (
    <div className="space-y-6">
      <SectionTitle title="File manager" description="Browse and manage server files" />

      <Card>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-hairline p-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" disabled={fileAccessRestricted}>
                  <FolderPlus className="size-3.5" /> New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create folder</DialogTitle>
                  <DialogDescription>
                    Created inside <code className="font-mono text-xs">{dir}</code>.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="folder-name">Name</Label>
                  <Input
                    id="folder-name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="src"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      size="sm"
                      disabled={!folderName.trim() || createFolder.isPending}
                      onClick={() =>
                        createFolder.mutate(
                          { root: dir, name: folderName.trim() },
                          {
                            onSuccess: () => {
                              toast.success(`Created ${folderName.trim()}`);
                              setFolderName("");
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
            {fileAccessRestricted ? (
              <Button variant="ghost" size="sm" className="gap-1.5" disabled>
                New file
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href={`/dashboard/servers/${id}/files/new?dir=${encodeURIComponent(dir)}`}>
                  New file
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={uploadUrl.isPending || fileAccessRestricted}
              onClick={() => uploadInputRef.current?.click()}
            >
              <Upload className="size-3.5" /> Upload
            </Button>
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                if (files.length === 0) return;
                uploadUrl.mutate(
                  { directory: dir, files },
                  {
                    onSuccess: ({ uploaded }) => {
                      toast.success(
                        uploaded === 1
                          ? `Uploaded ${files[0]?.name ?? "file"}`
                          : `Uploaded ${uploaded} files`,
                      );
                      event.currentTarget.value = "";
                  },
                  onError: (e: Error) => toast.error(e.message),
                  },
                );
              }}
            />
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 border-b border-hairline px-3 py-2 text-xs">
            <button onClick={() => setPath([])} className="text-ink-muted hover:text-ink">
              root
            </button>
            {path.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="size-3 text-ink-disabled" />
                <button
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className="text-ink-muted hover:text-ink"
                >
                  {seg}
                </button>
              </span>
            ))}
          </div>

          {/* Listing */}
          <DataState
            query={filesQuery}
            loading={<TableSkeleton rows={6} columns={3} />}
            isEmpty={(data) => (data as FilesResponse).files.length === 0}
            empty={
              <EmptyState
                icon={<Folder />}
                title="Empty directory"
                description="No files in this directory yet."
              />
            }
          >
            {(data) => {
              const payload = data as FilesResponse;
              const files = payload.files
                .map((f) => ({
                  name: f.name,
                  type: (f.is_file ? "file" : "dir") as "file" | "dir",
                  size: f.is_file ? f.size : undefined,
                  modified: f.modified_at,
                }))
                .filter((n) => n.name.toLowerCase().includes(query.toLowerCase()))
                .sort((a, b) => {
                  if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
                  return a.name.localeCompare(b.name);
                });

              if (files.length === 0) {
                return (
                  <EmptyState
                    icon={<Search />}
                    title="No matches"
                    description={`No files matched "${query}".`}
                  />
                );
              }

              return (
                <div className="divide-y divide-hairline">
                  {payload.access.restricted ? (
                    <div className="border-b border-hairline bg-elevated/30 px-4 py-2 text-xs text-ink-muted">
                      This template only shows the files and folders selected by the template author.
                    </div>
                  ) : null}
                  {files.map((node) => {
                    const fullPath = `${dir === "/" ? "" : dir}/${node.name}`;
                    const openHref =
                      node.type === "file"
                        ? `/dashboard/servers/${id}/files/edit?file=${encodeURIComponent(fullPath)}&dir=${encodeURIComponent(dir)}`
                        : null;
                    return (
                      <div
                        key={node.name}
                        className="group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-overlay"
                      >
                        {node.type === "dir" ? (
                          <button
                            onClick={() => setPath([...path, node.name])}
                            className="flex flex-1 items-center gap-3 text-left"
                          >
                            <Folder className="size-4 text-info" />
                            <span className="flex-1 text-ink-secondary">{node.name}</span>
                            <span className="text-xs text-ink-muted">
                              {node.size ? formatBytes(node.size) : "—"}
                            </span>
                            <span className="hidden text-xs text-ink-disabled sm:block">
                              {formatDate(node.modified)}
                            </span>
                          </button>
                        ) : (
                          <Link
                            href={openHref!}
                            className="flex flex-1 items-center gap-3 text-left"
                          >
                            <FileIcon className="size-4 text-ink-muted" />
                            <span className="flex-1 text-ink-secondary">{node.name}</span>
                            <span className="text-xs text-ink-muted">
                              {node.size ? formatBytes(node.size) : "—"}
                            </span>
                            <span className="hidden text-xs text-ink-disabled sm:block">
                              {formatDate(node.modified)}
                            </span>
                          </Link>
                        )}
                        <div className="relative z-10 flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                          {node.type === "file" ? (
                            <Button asChild variant="ghost" size="icon-sm" aria-label="Open file">
                              <Link href={openHref!}>
                                <ExternalLink />
                              </Link>
                            </Button>
                          ) : null}
                          {node.type === "file" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Download"
                              onClick={() =>
                                downloadUrl.mutate(fullPath, {
                                  onSuccess: (url) => {
                                    if (typeof window !== "undefined") window.open(url, "_blank");
                                  },
                                  onError: (e: Error) => toast.error(e.message),
                                })
                              }
                            >
                              <Download />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete"
                            disabled={payload.access.restricted}
                            onClick={() =>
                              deleteFiles.mutate(
                                { root: dir, files: [node.name] },
                                {
                                  onSuccess: () => toast.success(`Deleted ${node.name}`),
                                  onError: (e: Error) => toast.error(e.message),
                                },
                              )
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </DataState>
        </CardContent>
      </Card>
    </div>
  );
}
