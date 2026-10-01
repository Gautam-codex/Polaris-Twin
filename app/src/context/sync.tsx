import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import { enqueue, flush, subscribe, type QueueEntry, type QueuedAction } from "@/lib/offline-queue";

const RETRY_MS = 10_000;

interface SyncContextValue {
  /** Connected and not in simulated-offline mode. */
  online: boolean;
  queue: QueueEntry[];
  lastSyncAt: number | null;
  /** Demo switch that holds the queue as if the satellite link were down. */
  simulateOffline: boolean;
  setSimulateOffline: (on: boolean) => void;
  /** Queue a write and send it straight away when online. */
  submit: (action: QueuedAction) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(true);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const online = connected && !simulateOffline;

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setConnected(Boolean(state.isConnected) && state.isInternetReachable !== false);
      }),
    [],
  );

  useEffect(() => subscribe(setQueue), []);

  const trySync = useCallback(async () => {
    const sent = await flush();
    if (sent > 0) setLastSyncAt(Date.now());
  }, []);

  // Flush when we come online, then keep retrying every 10 s while anything is queued.
  useEffect(() => {
    if (!online) return;
    const first = setTimeout(() => void trySync(), 0);
    const id = setInterval(() => void trySync(), RETRY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [online, trySync]);

  const submit = useCallback(
    async (action: QueuedAction) => {
      await enqueue(action);
      if (online) await trySync();
    },
    [online, trySync],
  );

  const value = useMemo(
    () => ({ online, queue, lastSyncAt, simulateOffline, setSimulateOffline, submit }),
    [online, queue, lastSyncAt, simulateOffline, submit],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const value = useContext(SyncContext);
  if (!value) throw new Error("useSync must be used inside <SyncProvider>");
  return value;
}
