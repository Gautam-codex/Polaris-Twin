"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/components/theme";
import { useStationSnapshot } from "@/hooks/useStationSnapshot";
import type { StationId } from "@/shared/types";

const TwinScene = dynamic(() => import("@/components/twin/twin-scene"), { ssr: false });

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

/**
 * Reads ?station=maitri|bharati and ?theme=light|dark. Building taps are sent to the
 * app as {"type":"select","id":...} through the React Native WebView bridge.
 */
export function EmbedTwin() {
  const params = useSearchParams();
  const stationId: StationId = params.get("station") === "bharati" ? "bharati" : "maitri";
  const themeParam = params.get("theme");
  const { setTheme } = useTheme();
  const { snapshot } = useStationSnapshot(stationId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (themeParam === "dark" || themeParam === "light") setTheme(themeParam);
  }, [themeParam, setTheme]);

  const select = (id: string | null) => {
    setSelectedId(id);
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "select", id }));
  };

  return (
    <div className="fixed inset-0 bg-background">
      {snapshot && <TwinScene snapshot={snapshot} selectedId={selectedId} onSelect={select} mode="full" />}
    </div>
  );
}
