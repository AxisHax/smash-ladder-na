"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useState } from "react";

type Theme = "light" | "dark" | "system";

function getStored(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage unavailable */
  }
  return "system";
}

function getEffective(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const effective = getEffective(theme);
  document.documentElement.classList.toggle("dark", effective === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage synchronously during render on the client.
    // The server always returns "system" (typeof window is undefined).
    if (typeof window !== "undefined") {
      const stored = getStored();
      applyTheme(stored);
      return stored;
    }
    return "system";
  });

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const cycle: Theme[] = ["light", "dark", "system"];
      const idx = cycle.indexOf(prev);
      const next = cycle[(idx + 1) % cycle.length];
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      applyTheme(next);
      return next;
    });
  }, []);

  const isDark = getEffective(theme) === "dark";

  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      {theme === "system"
        ? "System theme"
        : theme === "dark"
          ? "Dark theme"
          : "Light theme"}
    </button>
  );
}
