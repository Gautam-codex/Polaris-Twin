import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider, useT } from "@/context/language";
import { SessionProvider, useSession } from "@/context/session";
import { StationProvider } from "@/context/station";
import { SyncProvider } from "@/context/sync";
import { initNotifications } from "@/lib/notifications";
import { ThemeProvider, useColors, useTheme } from "@/context/theme";


void SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { dark } = useTheme();
  return <StatusBar style={dark ? "light" : "dark"} />;
}

function RootStack() {
  const colors = useColors();
  const { loading } = useSession();
  const t = useT();

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);

  useEffect(() => {
    // Ask for notification permission on first launch.
    void initNotifications();
  }, []);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ presentation: "modal", title: t("Scan item") }} />
      <Stack.Screen name="checkin" options={{ title: t("Wellbeing check-in") }} />
      <Stack.Screen name="copilot" options={{ title: t("Ask Polaris") }} />
      <Stack.Screen name="settings" options={{ title: t("Settings") }} />
      <Stack.Screen name="sos" options={{ presentation: "modal", title: t("Emergency SOS"), headerStyle: { backgroundColor: colors.danger }, headerTintColor: "#FFFFFF" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
    <LanguageProvider>
      <SessionProvider>
        <SyncProvider>
          <StationProvider>
            <ThemedStatusBar />
            <RootStack />
          </StationProvider>
        </SyncProvider>
      </SessionProvider>
    </LanguageProvider>
    </ThemeProvider>
  );
}
