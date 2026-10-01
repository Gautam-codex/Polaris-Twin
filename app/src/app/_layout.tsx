import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SessionProvider, useSession } from "@/context/session";
import { StationProvider } from "@/context/station";
import { SyncProvider } from "@/context/sync";
import { initNotifications } from "@/lib/notifications";
import { colors } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { loading } = useSession();

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);

  useEffect(() => {
    // Ask for notification permission on first launch.
    void initNotifications();
  }, []);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerTintColor: colors.primary, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ presentation: "modal", title: "Scan item" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <SyncProvider>
        <StationProvider>
          <StatusBar style="dark" />
          <RootStack />
        </StationProvider>
      </SyncProvider>
    </SessionProvider>
  );
}
