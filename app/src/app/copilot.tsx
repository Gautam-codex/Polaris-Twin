import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Muted } from "@/components/ui";
import { useLanguage } from "@/context/language";
import { useStation } from "@/context/station";
import { useCopilot, type ChatMessage } from "@/hooks/useCopilot";
import { colors, radius, space, tint } from "@/lib/theme";
import type { CopilotLanguage } from "@shared/types";

function suggestions(site: string, language: CopilotLanguage): string[] {
  return language === "hi"
    ? [`क्या अभी ${site} पर टीम भेजना सुरक्षित है?`, "अगर जहाज़ 20 दिन देर से आए तो डीज़ल कितने दिन चलेगा?", "किस जनरेटर पर ध्यान देने की ज़रूरत है?", "आपूर्ति से पहले कौन से स्पेयर खत्म होंगे?"]
    : [`Is it safe to send a team to ${site} now?`, "How many days of diesel if the ship is 20 days late?", "Which generator needs attention?", "What spares run out before resupply?"];
}

/** Strip simple markdown (bold markers) for plain-text display. */
function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[-*]\s+/gm, "• ");
}

function Bubble({ m }: { m: ChatMessage }) {
  const user = m.role === "user";
  return (
    <View style={[styles.bubble, user ? styles.user : styles.assistant, m.status === "error" && { borderColor: colors.danger, backgroundColor: tint(colors.danger, 0.06) }]}>
      <Text style={[styles.bubbleText, user && { color: colors.primaryText }]}>{plain(m.text)}</Text>
      {m.status === "waiting" && <Text style={styles.waiting}>Offline · will send when the link is back</Text>}
    </View>
  );
}

export default function CopilotScreen() {
  const { language: appLanguage } = useLanguage();
  const [language, setLanguage] = useState<CopilotLanguage>(appLanguage);
  const { stationId } = useStation();
  const { messages, ask, busy, ready, online } = useCopilot(language);
  const [draft, setDraft] = useState("");
  const scroll = useRef<ScrollView>(null);
  const site = stationId === "maitri" ? (language === "hi" ? "प्रियदर्शिनी झील" : "Priyadarshini Lake") : language === "hi" ? "लार्समैन हिल्स रिज" : "the Larsemann Hills ridge";

  useEffect(() => {
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [messages.length, busy]);

  const submit = (text: string) => {
    setDraft("");
    void ask(text);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={styles.top}>
        <Muted style={{ flex: 1 }}>{online ? "Answers use live station data and the SOPs." : "Offline: questions are saved and sent later."}</Muted>
        <View style={styles.toggle}>
          {(["en", "hi"] as const).map((l) => (
            <Pressable key={l} onPress={() => setLanguage(l)} style={[styles.toggleItem, language === l && styles.toggleActive]} accessibilityRole="button" accessibilityState={{ selected: language === l }}>
              <Text style={[styles.toggleText, language === l && { color: colors.primary, fontWeight: "600" }]}>{l === "en" ? "EN" : "हिं"}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {messages.length === 0 &&
          suggestions(site, language).map((s) => (
            <Pressable key={s} onPress={() => submit(s)} disabled={!ready} style={[styles.suggestion, !ready && { opacity: 0.5 }]} accessibilityRole="button">
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        {messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        {busy && <Muted>Polaris is thinking…</Muted>}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={language === "hi" ? "पोलारिस से पूछें…" : "Ask about fuel, weather, generators…"}
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={() => submit(draft)}
          returnKeyType="send"
          maxLength={1000}
        />
        <Pressable
          onPress={() => submit(draft)}
          disabled={!draft.trim() || busy || !ready}
          style={[styles.send, (!draft.trim() || busy || !ready) && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Ionicons name="send" size={18} color={colors.primaryText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  toggle: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 2 },
  toggleItem: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  toggleActive: { backgroundColor: colors.accent },
  toggleText: { fontSize: 13, color: colors.muted },
  list: { padding: space.lg, gap: space.sm },
  suggestion: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md, backgroundColor: colors.card },
  suggestionText: { fontSize: 14, color: colors.text },
  bubble: { maxWidth: "88%", padding: space.md, borderRadius: radius.lg, borderWidth: 1 },
  user: { alignSelf: "flex-end", backgroundColor: colors.primary, borderColor: colors.primary },
  assistant: { alignSelf: "flex-start", backgroundColor: colors.accent, borderColor: colors.border },
  bubbleText: { fontSize: 14, lineHeight: 20, color: colors.text },
  waiting: { marginTop: 4, fontSize: 11, color: colors.brand },
  inputRow: { flexDirection: "row", gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  input: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, fontSize: 15, color: colors.text },
  send: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
