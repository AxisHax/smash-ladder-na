export type Theme = "light" | "dark";

// No "system" option — only an explicit light/dark stays stored. A
// first-time visitor (nothing in localStorage yet) still gets the OS
// preference as the initial pick, matching the inline anti-FOUC script in
// layout.tsx.
export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark") return v;
  } catch {
    /* localStorage unavailable */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
