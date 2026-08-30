import type { MetadataRoute } from "next";

const BASE = "https://ptero.app";

const routes = [
  "",
  "/pricing",
  "/features",
  "/discord-bot-hosting",
  "/nodejs-hosting",
  "/python-hosting",
  "/about",
  "/dashboard/support",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refund-policy",
  "/legal/acceptable-use",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-05-29");
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.7,
  }));
}
