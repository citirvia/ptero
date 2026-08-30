"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronDown, Shield } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { useUI } from "@/store/ui";
import { useAuth } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { NAV, ADMIN_NAV, ADMIN_CONTENT_NAV } from "@/components/dashboard/nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { user } = useAuth();
  const isAdmin = pathname.startsWith("/dashboard/admin");
  const [adminOpen, setAdminOpen] = useState(isAdmin);
  // Only OWNER/ADMIN roles see the Admin group.
  const canAdmin = user?.role === "OWNER" || user?.role === "ADMIN";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-card transition-[width] duration-300 lg:flex",
        sidebarCollapsed ? "w-[68px]" : "w-60",
      )}
    >
      <div className="flex h-16 items-center border-b border-hairline px-4">
        {sidebarCollapsed ? <LogoMark /> : <Logo href="/dashboard/overview" />}
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto p-3 no-scrollbar">
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
                title={item.label}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/15 text-ink"
                    : "text-ink-muted hover:bg-overlay2 hover:text-ink",
                  sidebarCollapsed && "justify-center px-0",
                )}
              >
                <item.icon
                  className={cn("size-[18px] shrink-0", active && "text-accent-soft")}
                />
                {!sidebarCollapsed && item.label}
                {active && !sidebarCollapsed && (
                  <span className="ml-auto size-1.5 rounded-full bg-accent-soft" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Admin group (collapsible) ── */}
        {canAdmin && (
        <div className="mt-auto pt-3">
          <div className="mb-1 border-t border-hairline pt-3" />
          {sidebarCollapsed ? (
            <Link
              href="/dashboard/admin/overview"
              title="Admin"
              className={cn(
                "flex items-center justify-center rounded-xl py-2.5 transition-colors",
                isAdmin
                  ? "bg-accent/15 text-accent-soft"
                  : "text-ink-muted hover:bg-overlay2 hover:text-ink",
              )}
            >
              <Shield className="size-[18px] shrink-0" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => setAdminOpen((v) => !v)}
                aria-expanded={adminOpen}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isAdmin
                    ? "text-ink"
                    : "text-ink-muted hover:bg-overlay2 hover:text-ink",
                )}
              >
                <Shield
                  className={cn("size-[18px] shrink-0", isAdmin && "text-accent-soft")}
                />
                Admin
                <span className="ml-auto flex items-center gap-2">
                  <span className="rounded-md border border-line bg-elevated px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                    Staff
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-ink-muted transition-transform duration-200",
                      adminOpen && "rotate-180",
                    )}
                  />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {adminOpen && (
                  <motion.div
                    key="admin-sub"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-0.5 pl-3">
                      <div className="ml-[7px] border-l border-line pl-3.5">
                        {ADMIN_NAV.map((item, i) => {
                          const active = pathname === item.href;
                          return (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: adminOpen ? 0.04 + i * 0.04 : 0,
                                ease: "easeOut",
                              }}
                            >
                              <Link
                                href={item.href}
                                className={cn(
                                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                                  active
                                    ? "bg-accent/15 text-ink"
                                    : "text-ink-muted hover:bg-overlay2 hover:text-ink",
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    "size-4 shrink-0",
                                    active && "text-accent-soft",
                                  )}
                                />
                                {item.label}
                                {active && (
                                  <span className="ml-auto size-1.5 rounded-full bg-accent-soft" />
                                )}
                              </Link>
                            </motion.div>
                          );
                        })}
                        <div className="my-1.5 px-2.5">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-disabled">
                            Content
                          </p>
                        </div>
                        {ADMIN_CONTENT_NAV.map((item, i) => {
                          const active = pathname.startsWith(item.href);
                          return (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: adminOpen
                                  ? 0.04 + (ADMIN_NAV.length + i) * 0.04
                                  : 0,
                                ease: "easeOut",
                              }}
                            >
                              <Link
                                href={item.href}
                                className={cn(
                                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                                  active
                                    ? "bg-accent/15 text-ink"
                                    : "text-ink-muted hover:bg-overlay2 hover:text-ink",
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    "size-4 shrink-0",
                                    active && "text-accent-soft",
                                  )}
                                />
                                {item.label}
                                {active && (
                                  <span className="ml-auto size-1.5 rounded-full bg-accent-soft" />
                                )}
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
        )}
      </nav>

      <div className="border-t border-hairline p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-overlay2 hover:text-ink"
        >
          <ChevronLeft
            className={cn(
              "size-[18px] shrink-0 transition-transform",
              sidebarCollapsed && "rotate-180",
            )}
          />
          {!sidebarCollapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
