"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Per-navigation entrance animation. Re-mounts (via key) on route change so the
 * fade/lift replays. The transform is cleared once the animation finishes, so it
 * never leaves a containing block that would break sticky sub-navs.
 *
 * scope="dashboard" collapses the server-detail tab routes to a single key, so
 * switching tabs animates only the inner tab content (wrapped separately), not
 * the whole server shell.
 */
export function RouteTransition({
  children,
  scope,
}: {
  children: React.ReactNode;
  scope?: "dashboard";
}) {
  const pathname = usePathname() ?? "/";
  const ref = useRef<HTMLDivElement>(null);

  let key = pathname;
  if (scope === "dashboard") {
    const m = pathname.match(/^\/dashboard\/servers\/[^/]+/);
    if (m) key = m[0];
  }

  return (
    <motion.div
      ref={ref}
      key={key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </motion.div>
  );
}
