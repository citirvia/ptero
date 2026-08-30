"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const GROUPS = [
  {
    title: "General",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["?"], label: "Show keyboard shortcuts" },
      { keys: ["Esc"], label: "Close dialogs & menus" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["G", "O"], label: "Go to Overview" },
      { keys: ["G", "S"], label: "Go to Servers" },
      { keys: ["G", "T"], label: "Go to Templates" },
    ],
  },
  {
    title: "Actions",
    items: [
      { keys: ["N"], label: "New server" },
      { keys: ["T"], label: "Toggle theme" },
      { keys: ["/"], label: "Focus search" },
    ],
  },
];

function Kbd({ k }: { k: string }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-secondary">
      {k}
    </kbd>
  );
}

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (typing) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move faster across Ptero.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col gap-2.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                {g.title}
              </p>
              {g.items.map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, i) => (
                      <Kbd key={i} k={k} />
                    ))}
                  </div>
                  <span className="text-xs text-ink-muted">{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
