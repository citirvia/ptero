"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";
import { NAV, ADMIN_NAV } from "@/components/dashboard/nav-items";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUI();
  const pathname = usePathname();

  // close on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  return (
    <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in lg:hidden" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-100 flex w-72 max-w-[82vw] flex-col border-r border-hairline bg-card shadow-panel duration-300 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 lg:hidden"
          style={{ transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <div className="flex h-16 items-center justify-between border-b border-hairline px-4">
            <Logo href="/dashboard/overview" />
            <Dialog.Close className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-overlay2 hover:text-ink">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 no-scrollbar">
            <div className="space-y-1">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard/overview" &&
                    pathname.startsWith(item.href.replace("/profile", "")));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent/15 text-ink"
                        : "text-ink-muted hover:bg-overlay2 hover:text-ink",
                    )}
                  >
                    <item.icon
                      className={cn("size-[18px] shrink-0", active && "text-accent-soft")}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 border-t border-hairline pt-3">
              <p className="flex items-center gap-2 px-3 pb-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                <Shield className="size-3.5" /> Admin
              </p>
              <div className="space-y-0.5">
                {ADMIN_NAV.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent/15 text-ink"
                          : "text-ink-muted hover:bg-overlay2 hover:text-ink",
                      )}
                    >
                      <item.icon
                        className={cn("size-[18px] shrink-0", active && "text-accent-soft")}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
