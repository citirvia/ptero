import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ptero — Infrastructure for bots & runtimes",
    short_name: "Ptero",
    description:
      "Deploy Discord bots, Node.js, and Python apps on bare-metal Ryzen infrastructure.",
    start_url: "/dashboard/overview",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
