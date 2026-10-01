import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Body, Button, Card, ErrorText, Muted } from "@/components/ui";
import { useSession } from "@/context/session";
import { DEMO_EMAIL, DEMO_PASSWORD, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { colors, radius, space } from "@/lib/theme";

function LogoMark() {
  return (
    <Svg width={48} height={48} viewBox="0 0 64 64">
      <Rect width={64} height={64} rx={14} fill={colors.primary} />
      <Path d="M0 64 V55 L16 48 L27 53 L40 45 L52 51 L64 47 V64 Z" fill="#FFFFFF" />
      <Path d="M32 7 L35.2 21.8 L50 25 L35.2 28.2 L32 43 L28.8 28.2 L14 25 L28.8 21.8 Z" fill={colors.brand} />
      <Circle cx={32} cy={25} r={2.2} fill="#FFFFFF" />
    </Svg>
  );
}

export default function LoginScreen() {
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/" />;

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (e) setError(/network/i.test(e.message) ? "No connection. Sign-in needs the network once; after that the app works offline." : e.message);
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <LogoMark />
        <Text style={styles.title}>Polaris Twin</Text>
        <Muted>Crew app for Maitri and Bharati</Muted>

        <Card style={{ marginTop: space.xl, gap: space.md }}>
          <View style={{ gap: 6 }}>
            <Muted>Email</Muted>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
              placeholder="you@station.in"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Muted>Password</Muted>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" style={styles.input} />
          </View>
          {error && <ErrorText message={error} />}
          {!isSupabaseConfigured && <ErrorText message="Supabase keys are missing in app/.env." />}
          <Button label={busy ? "Signing in…" : "Sign in"} onPress={() => void signIn()} disabled={busy || !email || !password} />
        </Card>

        <Card style={{ marginTop: space.md, backgroundColor: colors.accent, gap: space.sm }}>
          <Body style={{ fontWeight: "600", color: colors.primary }}>Demo account</Body>
          <Muted>
            {DEMO_EMAIL}
            {DEMO_PASSWORD ? ` · ${DEMO_PASSWORD}` : " · password on the presentation slide"}
          </Muted>
          <Button
            label="Use demo account"
            variant="outline"
            onPress={() => {
              setEmail(DEMO_EMAIL);
              if (DEMO_PASSWORD) setPassword(DEMO_PASSWORD);
            }}
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: "center", padding: space.xl },
  title: { marginTop: space.md, fontSize: 26, fontWeight: "600", color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 44, fontSize: 15, color: colors.text, backgroundColor: colors.card },
});
