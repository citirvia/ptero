"use client";

import Link from "next/link";
import { Search, Plus, LogOut, User, Settings, Menu, Coins } from "lucide-react";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { useUI } from "@/store/ui";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { useAuth } from "@/lib/api/auth";

export function Topbar() {
  const toggleCommand = useUI((s) => s.toggleCommand);
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen);
  const { user, logout } = useAuth();
  const displayName = user?.name ?? "—";
  const displayEmail = user?.email ?? "—";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-hairline bg-bg/70 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink-muted transition-colors hover:border-line-hover hover:text-ink lg:hidden"
      >
        <Menu className="size-4" />
      </button>
      <button
        onClick={toggleCommand}
        className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-xl border border-line bg-card px-3 text-sm text-ink-muted transition-colors hover:border-line-hover"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-1.5">
          <Coins className="size-4 text-accent-soft" />
          <span className="text-sm font-medium text-ink">
            {user?.creditBalance ?? 0}
          </span>
        </div>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/dashboard/servers/new">
            <Plus className="size-4" /> New Server
          </Link>
        </Button>
        <ThemeToggle />
        <NotificationsMenu />

        <Dropdown>
          <DropdownTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-line bg-card p-1 pr-2.5 transition-colors hover:border-line-hover">
              <Avatar
                name={displayName}
                src={user?.avatarUrl ?? undefined}
              />
              <span className="hidden text-sm font-medium text-ink sm:block">
                {displayName.split(" ")[0]}
              </span>
            </button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownLabel>{displayEmail}</DropdownLabel>
            <DropdownSeparator />
            <DropdownItem asChild>
              <Link href="/dashboard/settings/profile">
                <User /> Profile
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/dashboard/settings/preferences">
                <Settings /> Settings
              </Link>
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              destructive
              onSelect={async () => {
                await logout();
                window.location.href = "/auth/login";
              }}
            >
              <LogOut /> Sign out
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
}
