import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translate, type Language } from "@/lib/i18n";

const KEY = "polaris-twin:language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => undefined, t: (text) => text });

/** UI language (English / Hindi), saved on the phone. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === "hi") setLanguageState("hi");
      })
      .catch(() => undefined);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ language, setLanguage, t: (text: string) => translate(text, language) }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function useT(): (text: string) => string {
  return useContext(LanguageContext).t;
}
