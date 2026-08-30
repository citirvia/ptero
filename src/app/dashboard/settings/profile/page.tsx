"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useAuth } from "@/lib/api/auth";
import { useUpdateProfile } from "@/lib/api/hooks";

const TIMEZONES = [
  "Europe/Istanbul (GMT+3)",
  "Europe/Berlin (GMT+1)",
  "Europe/London (GMT+0)",
  "America/New_York (GMT-5)",
  "America/Los_Angeles (GMT-8)",
];

const selectClass =
  "flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");

  // Sync local state once the auth user finishes hydrating.
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(
      {
        name,
        email,
        avatarUrl: avatarUrl || null,
      },
      {
        onSuccess: async () => {
          await refreshUser();
          toast.success("Profile saved");
        },
        onError: (err: Error) => toast.error(err.message ?? "Could not save profile"),
      },
    );
  }

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-ink-muted">
            This information is shown across your account profile.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={name || user?.name || ""}
              src={avatarUrl || undefined}
              className="size-16 text-base"
            />
            <div>
              <p className="text-xs text-ink-muted">
                Avatar uploads will be wired in once the storage endpoint ships.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue="Building Discord infrastructure at Ptero."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tz">Timezone</Label>
            <select id="tz" name="tz" className={selectClass} defaultValue={TIMEZONES[0]}>
              {TIMEZONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" size="sm" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
