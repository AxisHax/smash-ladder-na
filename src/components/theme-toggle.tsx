"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStored();
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

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

  // Prevent hydration mismatch — render nothing on first pass
  if (!mounted) {
    return (
      <button className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-muted hover:text-foreground">
        <Sun className="size-3.5 opacity-0" />
        <span className="opacity-0">Theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
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
