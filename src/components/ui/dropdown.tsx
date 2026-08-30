"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Solid card background — menus need full legibility, no glass tint.
        // Tiny blur is a safety net for any browser that fails to render the
        // background paint synchronously.
        "z-100 min-w-52 overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-panel backdrop-blur-sm",
        "data-[state=open]:animate-fade-up",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownContent.displayName = "DropdownContent";

export const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    destructive?: boolean;
  }
>(({ className, destructive, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-secondary outline-none transition-colors [&_svg]:size-4 [&_svg]:text-ink-muted",
      destructive
        ? "hover:bg-danger/10 hover:text-danger [&_svg]:hover:text-danger"
        : "hover:bg-overlay2 hover:text-ink",
      className,
    )}
    {...props}
  />
));
DropdownItem.displayName = "DropdownItem";

export function DropdownLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="my-1.5 h-px bg-overlay2" />;
}
