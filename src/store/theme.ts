"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "ptero-theme";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    setThemeState(current);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return { theme, setTheme, toggle };
}

/** Inline script string — runs before paint to avoid a flash of the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;
