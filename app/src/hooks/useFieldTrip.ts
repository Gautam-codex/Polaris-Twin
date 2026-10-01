import { useCallback, useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSync } from "@/context/sync";
import { notify } from "@/lib/notifications";
import type { StationId } from "@shared/types";

const KEY = "polaris-twin:field-trip";

export interface FieldTrip {
  stationId: StationId;
  destination: string;
  team: string;
  startedAt: number;
  returnBy: number;
  overdueReported: boolean;
}

/** The active "going outside" check-out, persisted so it survives an app restart. */
export function useFieldTrip() {
  const { submit } = useSync();
  const [trip, setTrip] = useState<FieldTrip | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const tripRef = useRef<FieldTrip | null>(null);
  const submitRef = useRef(submit);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  const persist = useCallback((next: FieldTrip | null) => {
    tripRef.current = next;
    setTrip(next);
    void (next ? AsyncStorage.setItem(KEY, JSON.stringify(next)) : AsyncStorage.removeItem(KEY)).catch(() => undefined);
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as FieldTrip) : null;
        tripRef.current = saved;
        setTrip(saved);
      })
      .catch(() => undefined);
  }, []);

  // One-second clock; also raises the overdue alert once per trip.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const current = tripRef.current;
      if (!current || t <= current.returnBy || current.overdueReported) return;
      Vibration.vibrate([0, 600, 300, 600, 300, 600]);
      void notify("Field team overdue", `${current.team} at ${current.destination} has not checked back in.`);
      void submitRef.current({
        kind: "createAlert",
        alert: {
          stationId: current.stationId,
          system: "weather",
          severity: "critical",
          title: "Field team overdue",
          message: `${current.team} went to ${current.destination} and was due back at ${new Date(current.returnBy).toISOString().slice(11, 16)} UTC. Start the overdue procedure (SOP 1).`,
        },
      });
      persist({ ...current, overdueReported: true });
    }, 1000);
    return () => clearInterval(id);
  }, [persist]);

  const start = useCallback(
    (stationId: StationId, destination: string, team: string, hours: number) => {
      const startedAt = Date.now();
      persist({ stationId, destination, team, startedAt, returnBy: startedAt + hours * 3_600_000, overdueReported: false });
    },
    [persist],
  );

  const overdue = trip !== null && now > trip.returnBy;
  return { trip, now, overdue, start, end: () => persist(null) };
}
