import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStation } from "@/context/station";
import { useSync } from "@/context/sync";
import { useDayHistory } from "@/hooks/useDerived";
import { useAlerts, useInventory } from "@/hooks/useRecords";
import { useStationSnapshot } from "@/hooks/useStationSnapshot";
import { API_BASE } from "@/lib/supabase";
import { fuelRunway, itemsAtRisk, nextResupplyDate, safetyIndex } from "@shared/predictions";
import type { CopilotLanguage, CopilotRequest, CopilotResponse } from "@shared/types";

const PENDING_KEY = "polaris-twin:copilot-pending";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  status?: "waiting" | "error";
}

/** Chat with /api/copilot using live station data; questions asked offline are sent when back online. */
export function useCopilot(language: CopilotLanguage) {
  const { stationId } = useStation();
  const { online } = useSync();
  const { snapshot } = useStationSnapshot(stationId);
  const history = useDayHistory(snapshot);
  const inventory = useInventory(stationId);
  const alerts = useAlerts(stationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  const buildRequest = useCallback(
    (question: string, prior: ChatMessage[]): CopilotRequest | null => {
      if (!snapshot || !history) return null;
      const runway = fuelRunway(snapshot.fuelLitres, history);
      return {
        stationId,
        question,
        snapshot,
        fuelRunway: runway,
        fuelScenarios: [
          { label: "Ship 20 days late", runway: fuelRunway(snapshot.fuelLitres, history, { shipDelayDays: 20 }) },
          { label: "5 °C colder than now", runway: fuelRunway(snapshot.fuelLitres, history, { tempOffsetC: -5 }) },
        ],
        safetyIndex: safetyIndex(snapshot.weather),
        atRiskItems: itemsAtRisk(inventory.items, nextResupplyDate(snapshot.timestamp), snapshot.timestamp),
        recentAlerts: [...snapshot.alerts, ...alerts.items].slice(0, 10),
        language,
        history: prior.filter((m) => !m.status).map((m) => ({ role: m.role, text: m.text })),
      };
    },
    [snapshot, history, stationId, inventory.items, alerts.items, language],
  );

  const send = useCallback(
    async (question: string, prior: ChatMessage[]) => {
      const body = buildRequest(question, prior);
      if (!body || !API_BASE || sending.current) return false;
      sending.current = true;
      setBusy(true);
      try {
        const res = await fetch(`${API_BASE}/api/copilot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as CopilotResponse;
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: "assistant", text: data.answer || data.error || "Polaris could not answer that.", status: data.answer ? undefined : "error" },
        ]);
        return true;
      } catch {
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: "Could not reach Polaris. Try again in a moment.", status: "error" }]);
        return true;
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    [buildRequest],
  );

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text) return;
      const prior = messages;
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text, status: online ? undefined : "waiting" }]);
      if (!online) {
        await AsyncStorage.setItem(PENDING_KEY, text).catch(() => undefined);
        return;
      }
      await send(text, prior);
    },
    [messages, online, send],
  );

  // Send a question saved while offline as soon as the link is back and data is ready.
  useEffect(() => {
    if (!online || !snapshot || !history) return;
    let cancelled = false;
    void AsyncStorage.getItem(PENDING_KEY).then(async (pending) => {
      if (!pending || cancelled) return;
      await AsyncStorage.removeItem(PENDING_KEY).catch(() => undefined);
      setMessages((m) => {
        const has = m.some((x) => x.role === "user" && x.text === pending);
        return has
          ? m.map((x) => (x.role === "user" && x.text === pending ? { ...x, status: undefined } : x))
          : [...m, { id: `u-${Date.now()}`, role: "user", text: pending }];
      });
      await send(pending, []);
    });
    return () => {
      cancelled = true;
    };
  }, [online, snapshot, history, send]);

  return { messages, ask, busy, ready: Boolean(snapshot && history), online };
}
