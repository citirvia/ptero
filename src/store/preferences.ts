"use client";

import { useEffect, useState } from "react";

export const ACCENTS = {
  teal: { accent: "#255468", hover: "#285c70", soft: "#2f6b85", deep: "#16303d" },
  green: { accent: "#3f7d4e", hover: "#478a57", soft: "#5aa86d", deep: "#1f3d28" },
  blue: { accent: "#2f5fa8", hover: "#356bbd", soft: "#4b8bbe", deep: "#16294a" },
  amber: { accent: "#9a6a1e", hover: "#b07c26", soft: "#c79a3a", deep: "#3d2a0e" },
} as const;

export type AccentId = keyof typeof ACCENTS;
export type Density = "comfortable" | "compact";

const A_KEY = "ptero-accent";
const D_KEY = "ptero-density";

export function applyAccent(id: AccentId) {
  const a = ACCENTS[id] ?? ACCENTS.teal;
  const s = document.documentElement.style;
  s.setProperty("--color-accent", a.accent);
  s.setProperty("--color-accent-hover", a.hover);
  s.setProperty("--color-accent-soft", a.soft);
  s.setProperty("--color-accent-deep", a.deep);
  try {
    localStorage.setItem(A_KEY, id);
  } catch {}
}

export function applyDensity(d: Density) {
  if (d === "compact")
    document.documentElement.setAttribute("data-density", "compact");
  else document.documentElement.removeAttribute("data-density");
  try {
    localStorage.setItem(D_KEY, d);
  } catch {}
}

export function useAppPrefs() {
  const [accent, setAccentState] = useState<AccentId>("teal");
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    try {
      const a = localStorage.getItem(A_KEY) as AccentId | null;
      if (a && a in ACCENTS) setAccentState(a);
      const d = localStorage.getItem(D_KEY) as Density | null;
      if (d) setDensityState(d);
    } catch {}
  }, []);

  return {
    accent,
    density,
    setAccent: (id: AccentId) => {
      setAccentState(id);
      applyAccent(id);
    },
    setDensity: (d: Density) => {
      setDensityState(d);
      applyDensity(d);
    },
  };
}

/** Inline pre-paint script — applies saved accent & density before first render. */
export const prefScript = `(function(){try{var m={teal:['#255468','#285c70','#2f6b85','#16303d'],green:['#3f7d4e','#478a57','#5aa86d','#1f3d28'],blue:['#2f5fa8','#356bbd','#4b8bbe','#16294a'],amber:['#9a6a1e','#b07c26','#c79a3a','#3d2a0e']};var a=localStorage.getItem('${A_KEY}');if(a&&m[a]){var s=document.documentElement.style;s.setProperty('--color-accent',m[a][0]);s.setProperty('--color-accent-hover',m[a][1]);s.setProperty('--color-accent-soft',m[a][2]);s.setProperty('--color-accent-deep',m[a][3]);}if(localStorage.getItem('${D_KEY}')==='compact')document.documentElement.setAttribute('data-density','compact');}catch(e){}})();`;
