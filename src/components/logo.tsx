import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-8 items-center justify-center rounded-[10px] accent-gradient shadow-glow",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4 text-white">
        <path
          d="M5 19V6.5C5 5.12 6.12 4 7.5 4h5.25C15.65 4 18 6.35 18 9.25S15.65 14.5 12.75 14.5H9"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        Ptero
      </span>
    </Link>
  );
}
