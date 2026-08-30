"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

export function Counter({
  value,
  decimal = false,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimal?: boolean;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const formatted = decimal
    ? display.toFixed(2)
    : display >= 1_000_000_000
      ? `${(display / 1_000_000_000).toFixed(1)}B`
      : display >= 1_000_000
        ? `${(display / 1_000_000).toFixed(1)}M`
        : Math.round(display).toLocaleString("en-US");

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
