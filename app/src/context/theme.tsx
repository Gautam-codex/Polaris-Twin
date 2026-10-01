import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme, type StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createStyleCache, darkColors, lightColors, type Palette } from "@/lib/theme";

export type ThemeMode = "system" | "light" | "dark";
const KEY = "polaris-twin:theme";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  dark: boolean;
  colors: Palette;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: "system", setMode: () => undefined, dark: false, colors: lightColors });

/** Light / dark theme, following the phone by default; the choice is saved on the phone. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark" || saved === "system") setModeState(saved);
      })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  const dark = mode === "dark" || (mode === "system" && system === "dark");
  const value = useMemo(() => ({ mode, setMode, dark, colors: dark ? darkColors : lightColors }), [mode, setMode, dark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}

/** Defines styles that depend on the palette; returns a hook giving the current theme's StyleSheet. */
export function themedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T) {
  const get = createStyleCache(factory);
  return function useStyles(): T {
    return get(useColors());
  };
}
