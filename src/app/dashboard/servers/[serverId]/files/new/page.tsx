"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, FilePlus2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SectionTitle } from "../../_components/shared";
import { useServerId } from "../../_components/use-server";
import { useWriteFile } from "@/lib/api/hooks";

export default function NewFilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = useServerId();
  const writeFile = useWriteFile(id);
  const dir = useMemo(() => searchParams.get("dir") ?? "/", [searchParams]);

  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");

  function createFile() {
    const trimmed = fileName.trim();
    if (!trimmed) return;
    const target = `${dir === "/" ? "" : dir}/${trimmed}`;
    writeFile.mutate(
      { file: target, content },
      {
        onSuccess: () => {
          toast.success(`Created ${trimmed}`);
          router.push(`/dashboard/servers/${id}/files?dir=${encodeURIComponent(dir)}`);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="New file"
        description={`Create a file directly inside ${dir}.`}
      />

      <Card className="mx-auto max-w-4xl">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FilePlus2 className="size-4 text-accent-soft" />
            <CardTitle>Create file</CardTitle>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/servers/${id}/files?dir=${encodeURIComponent(dir)}`}>
              <ArrowLeft />
              Back to files
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
            <div className="rounded-2xl border border-hairline bg-elevated/30 p-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="target-dir">Directory</Label>
                  <Input
                    id="target-dir"
                    value={dir}
                    readOnly
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="file-name">File name</Label>
                  <Input
                    id="file-name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="index.ts"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-hairline bg-elevated/30 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="file-content">Initial content</Label>
                <Textarea
                  id="file-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="// optional"
                  className="min-h-[320px] font-mono text-xs"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/servers/${id}/files?dir=${encodeURIComponent(dir)}`}>
                Cancel
              </Link>
            </Button>
            <Button
              onClick={createFile}
              disabled={!fileName.trim() || writeFile.isPending}
            >
              <Save />
              Create file
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
