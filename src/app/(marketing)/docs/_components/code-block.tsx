"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  label,
  code,
  lang = "bash",
  className,
}: {
  label?: string;
  code: string;
  lang?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-[#0a0a0a] shadow-panel",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-hairline bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-danger/60" />
          <span className="size-2.5 rounded-full bg-warn/60" />
          <span className="size-2.5 rounded-full bg-online/60" />
          {label && (
            <span className="ml-2 font-mono text-[11px] text-ink-muted">
              {label}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-2 py-1 font-mono text-[11px] text-ink-secondary transition-colors hover:border-line-hover hover:text-ink"
        >
          {copied ? (
            <>
              <Check className="size-3 text-online" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink-secondary no-scrollbar">
        <code data-lang={lang}>{code}</code>
      </pre>
    </div>
  );
}
