"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "cn";
import { translate, type Language } from "@/lib/i18n";

const STORAGE_KEY = "polaris-twin:language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** UI language (English / Hindi), remembered in localStorage. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Read the saved choice after mount so server and client render the same first frame.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === "hi") setLanguageState("hi");
      } catch {
        // Storage unavailable; stay in English.
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; the choice lasts for this page view.
    }
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, t: (text: string, vars?: Record<string, string | number>) => translate(text, language, vars) }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return value;
}

/** Shorthand for the translate function. */
export function useT() {
  return useLanguage().t;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={cn("inline-flex rounded-md border border-border bg-card p-0.5 text-xs", className)} role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLanguage(l)}
          aria-pressed={language === l}
          className={cn("rounded px-2 py-0.5", language === l ? "bg-secondary font-medium text-primary" : "text-muted-foreground")}
        >
          {l === "en" ? "EN" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}
