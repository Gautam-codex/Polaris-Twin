import { Pressable, View } from "react-native";
import { Text } from "@/components/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import { Screen } from "@/components/chrome";
import { Body, Button, Card, CardTitle, Muted } from "@/components/ui";
import { useT } from "@/context/language";
import { useSession } from "@/context/session";
import { useStation } from "@/context/station";
import { supabase } from "@/lib/supabase";
import { space } from "@/lib/theme";
import { useColors, themedStyles } from "@/context/theme";

const LINKS: { href: Href; title: string; note: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: "/checkin", title: "Wellbeing check-in", note: "Anonymous, once a day", icon: "happy-outline" },
  { href: "/copilot", title: "Ask Polaris", note: "AI copilot in English or Hindi", icon: "chatbubbles-outline" },
  { href: "/settings", title: "Settings", note: "Theme, language and offline sync", icon: "settings-outline" },
];

export default function MoreScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { session } = useSession();
  const { station } = useStation();
  const t = useT();

  return (
    <Screen>
      <Card style={{ paddingVertical: space.xs }}>
        {LINKS.map((l, i) => (
          <Pressable
            key={l.title}
            onPress={() => router.push(l.href)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.link, i > 0 && styles.divider, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name={l.icon} size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>{t(l.title)}</Text>
              <Muted>{l.note}</Muted>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>

      <Card style={{ gap: space.sm }}>
        <CardTitle>Station</CardTitle>
        <Body style={{ fontWeight: "600" }}>{station.name}</Body>
        <Muted>{station.region}</Muted>
        <Muted>
          {Math.abs(station.lat).toFixed(2)}° S, {station.lon.toFixed(2)}° E · established {station.established}
        </Muted>
      </Card>

      <Card style={{ gap: space.sm }}>
        <CardTitle>Account</CardTitle>
        <Muted>Signed in as {session?.user.email ?? "unknown"}</Muted>
        <Button label="Sign out" variant="outline" onPress={() => void supabase.auth.signOut()} />
      </Card>

      <Muted style={{ textAlign: "center" }}>Polaris Twin · prototype with a simulated sensor feed. Not an official NCPOR system.</Muted>
    </Screen>
  );
}

const useStyles = themedStyles((colors) => ({
  link: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  linkTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
}));
