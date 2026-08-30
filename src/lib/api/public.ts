"use client";

import { useQuery } from "@tanstack/react-query";
import { API_URL, LIVE } from "./client";

/** Public (unauthenticated) fetch for marketing pages. */
async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`);
  if (!res.ok) throw new Error(`public ${path} failed`);
  return res.json() as Promise<T>;
}

export type PublicLocation = {
  id: string;
  city: string;
  country: string;
  nodes: number;
  online: number;
  capacity: number;
  hardware: string;
};

export type PublicStatus = {
  overall: string;
  services: { name: string; status: string }[];
  nodes: { name: string; status: string }[];
  incidents: { title: string; status: string }[];
};

export function usePublicLocations() {
  return useQuery({
    queryKey: ["public", "locations"],
    queryFn: () => publicGet<{ locations: PublicLocation[]; nodes: number }>("/public/locations"),
    enabled: LIVE,
    retry: 0,
  });
}

export function usePublicStatus() {
  return useQuery({
    queryKey: ["public", "status"],
    queryFn: () => publicGet<PublicStatus>("/public/status"),
    enabled: LIVE,
    retry: 0,
  });
}

export { LIVE };
