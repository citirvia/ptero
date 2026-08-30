"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useChangePassword } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-danger", "bg-danger", "bg-warn", "bg-info", "bg-online"];

export default function SecurityPage() {
  const [pw, setPw] = useState("");
  const changePassword = useChangePassword();
  const s = strength(pw);

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const current = (form.elements.namedItem("current") as HTMLInputElement)?.value ?? "";
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement)?.value ?? "";
    if (pw !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    changePassword.mutate(
      { currentPassword: current, newPassword: pw },
      {
        onSuccess: () => {
          form.reset();
          setPw("");
          toast.success("Password updated");
        },
        onError: (err: Error) => toast.error(err.message ?? "Could not update password"),
      },
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleChangePassword}>
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <p className="text-sm text-ink-muted">
              Use a long, unique password you don&apos;t use elsewhere.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" name="current" type="password" autoComplete="current-password" required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
              </div>
            </div>
            {pw && (
              <div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i < s ? COLORS[s] : "bg-elevated",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  Strength: <span className="text-ink-secondary">{LABELS[s]}</span>
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-dashed border-hairline bg-bg/40 px-4 py-3 text-xs text-ink-muted">
              Changing your password keeps this device signed in and revokes your other active sessions.
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" size="sm" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Updating…" : "Update password"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
