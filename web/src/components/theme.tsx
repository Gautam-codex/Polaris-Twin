"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

export type Theme = "light" | "dark";
const KEY = "polaris-twin:theme";

/** Runs before first paint (inlined in <head>) so the saved or system theme never flashes. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function current(): Theme {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // The boot script already set the class; mirror it into state after mount.
  useEffect(() => {
    const id = setTimeout(() => setThemeState(current()), 0);
    return () => clearTimeout(id);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    setThemeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage unavailable; the theme lasts for this page view.
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}

/** Sun / moon button that switches between light and dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={cn(
        "relative grid size-8 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <Sun className={cn("absolute size-4 transition-all duration-300", dark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} />
      <Moon className={cn("absolute size-4 transition-all duration-300", dark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0")} />
    </button>
  );
}
