import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { StationSwitcher } from "@/components/chrome";
import { useSession } from "@/context/session";
import { useStation } from "@/context/station";
import { useAlerts } from "@/hooks/useRecords";
import { colors } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Home", icon: "home-outline" },
  { name: "alerts", title: "Alerts", icon: "notifications-outline" },
  { name: "safety", title: "Safety", icon: "shield-checkmark-outline" },
  { name: "inventory", title: "Inventory", icon: "cube-outline" },
  { name: "more", title: "More", icon: "ellipsis-horizontal-circle-outline" },
];

/** Keeps a realtime alert subscription open on every tab, so new alerts vibrate and notify. */
function AlertWatcher() {
  const { stationId } = useStation();
  useAlerts(stationId, { notifyOnInsert: true });
  return null;
}

export default function TabLayout() {
  const { session } = useSession();
  if (!session) return <Redirect href="/login" />;

  return (
    <>
      <AlertWatcher />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { borderTopColor: colors.border },
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text, fontWeight: "600" },
          headerShadowVisible: false,
          headerRight: () => <StationSwitcher />,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
