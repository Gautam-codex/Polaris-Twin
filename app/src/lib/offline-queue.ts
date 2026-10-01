// Writes that must reach Supabase, stored in AsyncStorage and sent in order when the phone is online.
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  acknowledgeAlert,
  createAlert,
  createCheckin,
  createIncident,
  updateInventoryQuantity,
  type NewAlert,
  type NewCheckin,
  type NewIncident,
} from "./data";

export type QueuedAction =
  | { kind: "ackAlert"; id: string }
  | { kind: "setQuantity"; id: string; quantity: number; name: string }
  | { kind: "createAlert"; alert: NewAlert }
  | { kind: "createIncident"; incident: NewIncident }
  | { kind: "createCheckin"; checkin: NewCheckin };

export interface QueueEntry {
  id: string;
  queuedAt: number;
  action: QueuedAction;
}

const KEY = "polaris-twin:offline-queue";
type Listener = (entries: QueueEntry[]) => void;
const listeners = new Set<Listener>();
let entries: QueueEntry[] = [];
let loaded = false;
let flushing = false;

async function load(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    entries = raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    entries = [];
  }
  loaded = true;
}

async function save(next: QueueEntry[]): Promise<void> {
  entries = next;
  listeners.forEach((l) => l(entries));
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable: the queue still lives in memory for this session.
  }
}

export function describe(action: QueuedAction): string {
  switch (action.kind) {
    case "ackAlert":
      return "Acknowledge alert";
    case "setQuantity":
      return `${action.name}: quantity ${action.quantity}`;
    case "createAlert":
      return `Alert: ${action.alert.title}`;
    case "createIncident":
      return `Incident: ${action.incident.title}`;
    case "createCheckin":
      return "Wellbeing check-in";
  }
}

async function run(action: QueuedAction): Promise<void> {
  switch (action.kind) {
    case "ackAlert":
      return acknowledgeAlert(action.id);
    case "setQuantity":
      return updateInventoryQuantity(action.id, action.quantity);
    case "createAlert":
      return createAlert(action.alert);
    case "createIncident":
      return createIncident(action.incident);
    case "createCheckin":
      return createCheckin(action.checkin);
  }
}

export async function enqueue(action: QueuedAction): Promise<void> {
  await load();
  await save([...entries, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, queuedAt: Date.now(), action }]);
}

/** Sends queued actions in order; stops at the first failure so order is kept. Returns how many were sent. */
export async function flush(): Promise<number> {
  await load();
  if (flushing || entries.length === 0) return 0;
  flushing = true;
  let sent = 0;
  try {
    while (entries.length > 0) {
      await run(entries[0].action);
      sent++;
      await save(entries.slice(1));
    }
  } catch {
    // Still offline or rejected; try again on the next flush.
  } finally {
    flushing = false;
  }
  return sent;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  void load().then(() => listener(entries));
  return () => {
    listeners.delete(listener);
  };
}
