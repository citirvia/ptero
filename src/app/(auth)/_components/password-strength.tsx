"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "An uppercase & lowercase letter", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "At least one number", test: (v) => /\d/.test(v) },
  { label: "A symbol (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const LEVELS = [
  { label: "Too weak", color: "bg-danger", text: "text-danger" },
  { label: "Weak", color: "bg-danger", text: "text-danger" },
  { label: "Fair", color: "bg-warn", text: "text-warn" },
  { label: "Good", color: "bg-info", text: "text-info" },
  { label: "Strong", color: "bg-online", text: "text-online" },
] as const;

export function passwordScore(value: string): number {
  if (!value) return 0;
  return PASSWORD_RULES.reduce((acc, rule) => acc + (rule.test(value) ? 1 : 0), 0);
}

/** Live strength meter (4 segments). */
export function PasswordStrengthBar({ value }: { value: string }) {
  const score = passwordScore(value);
  const level = LEVELS[score];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {PASSWORD_RULES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < score ? level.color : "bg-line",
            )}
          />
        ))}
      </div>
      {value && (
        <p className="font-mono text-xs">
          <span className="text-ink-muted">Strength: </span>
          <span className={level.text}>{level.label}</span>
        </p>
      )}
    </div>
  );
}

/** Requirements checklist that lights up as rules pass. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              ok ? "text-online" : "text-ink-muted",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full transition-colors",
                ok ? "bg-online/15" : "bg-overlay2",
              )}
            >
              {ok ? <Check className="size-3" /> : <X className="size-3" />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
