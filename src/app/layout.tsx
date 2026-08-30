import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { themeScript } from "@/store/theme";
import { prefScript } from "@/store/preferences";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ptero.app"),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
    apple: [{ url: "/icon.svg" }],
  },
  title: {
    default: "Ptero — Modern infrastructure for bots & runtimes",
    template: "%s · Ptero",
  },
  description:
    "Deploy Discord bots, Node.js, and Python apps on bare-metal Ryzen infrastructure. Git deploy, web console, realtime monitoring, and DDoS protection.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: prefScript }} />
      </head>
      <body className="min-h-full bg-bg text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
