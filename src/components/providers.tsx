"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsModal } from "@/components/shortcuts-modal";
import { AuthProvider } from "@/lib/api/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <CommandPalette />
      <ShortcutsModal />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#f5f5f5",
            borderRadius: "0.85rem",
          },
        }}
      />
    </QueryClientProvider>
  );
}
