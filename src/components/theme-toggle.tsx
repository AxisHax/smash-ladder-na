"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

// No more "system" option — only an explicit light/dark stays stored from
// here on. A first-time visitor (nothing in localStorage yet) still gets the
// OS preference as the initial pick, matching the inline anti-FOUC script in
// layout.tsx, but the very first toggle click locks in an explicit choice.
function getStored(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark") return v;
  } catch {
    /* localStorage unavailable */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Read-only — no side effects during render.
    if (typeof window !== "undefined") {
      return getStored();
    }
    return "light";
  });

  // Sync the DOM with the current theme after every render, before the browser
  // paints. This is the correct place for DOM mutations that depend on state.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-muted hover:text-foreground"
    >
      {theme === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      {theme === "dark" ? "Dark theme" : "Light theme"}
    </button>
  );
}
