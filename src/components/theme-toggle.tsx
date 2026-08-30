"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/store/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-xl border border-line bg-card text-ink-muted transition-colors hover:border-line-hover hover:text-ink",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-300",
          theme === "light" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-300",
          theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
        )}
      />
    </button>
  );
}
