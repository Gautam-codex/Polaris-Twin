import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useColors, useTheme } from "@/context/theme";
import { API_BASE } from "@/lib/supabase";
import { radius } from "@/lib/theme";
import type { StationId } from "@shared/types";

/** The same 3D station model as the website, loaded from /embed/twin. Building taps come back as messages. */
export function Twin3D({
  stationId,
  onSelect,
  onFail,
}: {
  stationId: StationId;
  onSelect: (id: string | null) => void;
  onFail: () => void;
}) {
  const colors = useColors();
  const { dark } = useTheme();
  const [loading, setLoading] = useState(true);
  const uri = `${API_BASE}/embed/twin?station=${stationId}&theme=${dark ? "dark" : "light"}`;

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type?: string; id?: string | null };
      if (msg.type === "select") onSelect(msg.id ?? null);
    } catch {
      // Ignore anything that is not our message.
    }
  };

  return (
    <View style={{ height: 280, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.background, marginTop: 8 }}>
      <WebView
        key={uri}
        source={{ uri }}
        onMessage={onMessage}
        onLoadEnd={() => setLoading(false)}
        onError={onFail}
        onHttpError={onFail}
        javaScriptEnabled
        nestedScrollEnabled
        setBuiltInZoomControls={false}
        overScrollMode="never"
        style={{ backgroundColor: colors.background }}
      />
      {loading && (
        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}
