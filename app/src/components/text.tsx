import { Children, type ReactNode } from "react";
import { Text as NativeText, type TextProps } from "react-native";
import { useLanguage } from "@/context/language";
import { toHindi } from "@shared/i18n";

/** Translate string children: a run of plain strings and numbers is translated as one sentence. */
function translateChildren(children: ReactNode): ReactNode {
  const items = Children.toArray(children);
  if (items.every((c) => typeof c === "string" || typeof c === "number")) {
    const joined = items.join("");
    return joined ? toHindi(joined) : children;
  }
  return items.map((c) => (typeof c === "string" ? toHindi(c) : c));
}

/**
 * Drop-in replacement for React Native's Text that shows Hindi when the app language is Hindi.
 * Numbers inside the text are kept ("117 days" → "117 दिन").
 */
export function Text({ children, accessibilityLabel, ...props }: TextProps) {
  const { language } = useLanguage();
  if (language !== "hi") return <NativeText accessibilityLabel={accessibilityLabel} {...props}>{children}</NativeText>;
  return (
    <NativeText accessibilityLabel={accessibilityLabel ? toHindi(accessibilityLabel) : undefined} {...props}>
      {translateChildren(children)}
    </NativeText>
  );
}
