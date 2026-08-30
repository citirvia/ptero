"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Server,
  Users,
  Bell,
  ScrollText,
  Settings,
  LayoutDashboard,
  Terminal,
  Gauge,
  Search,
  Home,
  Tag,
  Shield,
  HardDrive,
  LayoutTemplate,
  SunMoon,
  PanelLeft,
  Rocket,
} from "lucide-react";
import { useUI } from "@/store/ui";
import { useTheme } from "@/store/theme";

type Item = {
  group: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  keywords?: string;
  action?: string;
};

const ITEMS: Item[] = [
  { group: "Dashboard", label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { group: "Dashboard", label: "Servers", href: "/dashboard/servers", icon: Server },
  { group: "Dashboard", label: "Templates", href: "/dashboard/templates", icon: LayoutTemplate, keywords: "discord bot starter" },
  { group: "Dashboard", label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { group: "Dashboard", label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
  { group: "Dashboard", label: "Settings", href: "/dashboard/settings/profile", icon: Settings },
  { group: "Server", label: "Console", href: "/dashboard/servers/atlas-01/console", icon: Terminal },
  { group: "Server", label: "Monitoring", href: "/dashboard/servers/atlas-01/monitoring", icon: Gauge },
  { group: "Admin", label: "Platform Overview", href: "/dashboard/admin/overview", icon: Shield },
  { group: "Admin", label: "Users", href: "/dashboard/admin/users", icon: Users },
  { group: "Admin", label: "Nodes", href: "/dashboard/admin/nodes", icon: HardDrive },
  { group: "Admin", label: "All Servers", href: "/dashboard/admin/servers", icon: Server },
  { group: "Admin", label: "Plans", href: "/dashboard/admin/plans", icon: Tag },
  { group: "Marketing", label: "Home", href: "/", icon: Home },
  { group: "Marketing", label: "Pricing", href: "/pricing", icon: Tag },
  { group: "Actions", label: "Deploy new server", href: "/dashboard/servers/new", icon: Rocket, keywords: "create add" },
  { group: "Actions", label: "Toggle theme", icon: SunMoon, action: "theme", keywords: "dark light mode" },
  { group: "Actions", label: "Toggle sidebar", icon: PanelLeft, action: "sidebar", keywords: "collapse expand" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen, toggleCommand, toggleSidebar } = useUI();
  const { toggle: toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggleCommand]);

  const runItem = (item: Item) => {
    setCommandOpen(false);
    if (item.action === "theme") toggleTheme();
    else if (item.action === "sidebar") toggleSidebar();
    else if (item.href) router.push(item.href);
  };

  const groups = Array.from(new Set(ITEMS.map((i) => i.group)));

  return (
    <Dialog.Root open={commandOpen} onOpenChange={setCommandOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-[18%] z-100 w-[92vw] max-w-xl -translate-x-1/2">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command className="glass overflow-hidden rounded-2xl shadow-panel">
            <div className="flex items-center gap-3 border-b border-hairline px-4">
              <Search className="size-4 text-ink-muted" />
              <Command.Input
                autoFocus
                placeholder="Search servers, pages, actions…"
                className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-ink-muted">
                No results found.
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-muted"
                >
                  {ITEMS.filter((i) => i.group === group).map((item) => (
                    <Command.Item
                      key={item.href ?? item.label}
                      value={`${item.group} ${item.label} ${item.keywords ?? ""}`}
                      onSelect={() => runItem(item)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-ink-secondary aria-selected:bg-accent/15 aria-selected:text-ink"
                    >
                      <item.icon className="size-4 text-ink-muted" />
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
