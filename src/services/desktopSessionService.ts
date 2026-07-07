import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

const SESSION_COLLECTION = 'desktopSessions';
const COMMANDS_COLLECTION = 'sessionCommands';
const HEARTBEAT_INTERVAL_MS = 5_000;

export type SessionStatus = 'idle' | 'analyzing' | 'done';
export type SessionCommand = 'approve_all_a' | 'view_results' | 'ping';

type BroadcastState = {
  status: SessionStatus;
  jobPosition: string;
  totalCvs: number;
  analyzedCount: number;
};

type StatusListener = (state: BroadcastState) => void;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
const statusListeners = new Set<StatusListener>();
let currentState: BroadcastState = { status: 'idle', jobPosition: '', totalCvs: 0, analyzedCount: 0 };

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function notify(state: BroadcastState): void {
  currentState = state;
  statusListeners.forEach((fn) => fn(state));
}

async function writeSession(data: Partial<BroadcastState> & Record<string, unknown>): Promise<void> {
  const userId = uid();
  if (!userId) return;
  await setDoc(doc(db, SESSION_COLLECTION, userId), {
    ...data,
    lastHeartbeat: Date.now(),
  }, { merge: true });
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat(): void {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    void writeSession({ lastHeartbeat: Date.now() });
  }, HEARTBEAT_INTERVAL_MS);
}

export async function broadcastSessionStart(jobPosition: string, totalCvs: number): Promise<void> {
  const next: BroadcastState = { status: 'analyzing', jobPosition, totalCvs, analyzedCount: 0 };
  notify(next);
  await writeSession({ ...next, startedAt: Date.now() });
  startHeartbeat();
}

export async function broadcastProgress(analyzedCount: number, totalCvs: number): Promise<void> {
  const next: BroadcastState = { ...currentState, status: 'analyzing', analyzedCount, totalCvs };
  notify(next);
  await writeSession({ status: 'analyzing', analyzedCount, totalCvs });
}

export async function broadcastSessionDone(analyzedCount: number, totalCvs: number): Promise<void> {
  stopHeartbeat();
  const next: BroadcastState = { ...currentState, status: 'done', analyzedCount, totalCvs };
  notify(next);
  await writeSession({ status: 'done', analyzedCount, totalCvs, lastHeartbeat: Date.now() });
}

export async function clearSession(): Promise<void> {
  stopHeartbeat();
  const next: BroadcastState = { status: 'idle', jobPosition: '', totalCvs: 0, analyzedCount: 0 };
  notify(next);
  const userId = uid();
  if (!userId) return;
  await setDoc(doc(db, SESSION_COLLECTION, userId), { status: 'idle', lastHeartbeat: Date.now() }, { merge: true });
}

export function onSessionStatusChange(fn: StatusListener): () => void {
  statusListeners.add(fn);
  fn(currentState);
  return () => statusListeners.delete(fn);
}

export function subscribeSessionCommands(
  onCommand: (command: SessionCommand, payload: Record<string, unknown>) => void
): () => void {
  const userId = uid();
  if (!userId) return () => {};

  let lastSeenAt = Date.now();
  return onSnapshot(doc(db, COMMANDS_COLLECTION, userId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const sentAt = Number(data.sentAt ?? 0);
    if (sentAt <= lastSeenAt) return;
    lastSeenAt = sentAt;
    onCommand(data.command as SessionCommand, (data.payload ?? {}) as Record<string, unknown>);
  });
}
