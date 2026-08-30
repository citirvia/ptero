import { cn } from "@/lib/utils";

export function GlowOrb({
  className,
  color = "rgba(37,84,104,0.25)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full blur-[120px]", className)}
      style={{ background: color }}
    />
  );
}

export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]",
        className,
      )}
    />
  );
}

export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 spotlight", className)}
    />
  );
}
