"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";
import { ErrorState } from "@/components/ui/error-state";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerId } from "../../_components/use-server";
import { useReadFile, useWriteFile } from "@/lib/api/hooks";

export default function EditFilePage() {
  const searchParams = useSearchParams();
  const id = useServerId();
  const file = useMemo(() => searchParams.get("file"), [searchParams]);
  const readFile = useReadFile(id, file);
  const writeFile = useWriteFile(id);
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div>
      <DataState
        query={readFile}
        loading={<Skeleton className="h-[520px]" />}
        error={(err, retry) => <ErrorState description={err.message} onRetry={retry} />}
        isEmpty={() => !file}
      >
        {(content) => {
          const value = draft ?? (content as string);
          const dirty = draft !== null && draft !== (content as string);
          return (
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex-row justify-end px-0 pt-0">
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    disabled={!dirty || writeFile.isPending || !file}
                    onClick={() =>
                      writeFile.mutate(
                        { file: file!, content: value },
                        {
                          onSuccess: () => {
                            toast.success("File saved");
                            setDraft(value);
                          },
                          onError: (e: Error) => toast.error(e.message),
                        },
                      )
                    }
                  >
                    <Save />
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="rounded-2xl border border-hairline bg-elevated/30 p-3">
                  <Textarea
                    id="file-editor"
                    value={value}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-[calc(100vh-14rem)] border-0 bg-transparent px-2 py-1 font-mono text-xs shadow-none focus-visible:ring-0"
                    spellCheck={false}
                  />
                </div>
              </CardContent>
            </Card>
          );
        }}
      </DataState>
    </div>
  );
}
