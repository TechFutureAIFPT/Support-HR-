import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

const COLLECTION = 'desktopSessions';
const HEARTBEAT_INTERVAL_MS = 10_000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

async function writeSession(data: Record<string, unknown>): Promise<void> {
  const userId = uid();
  if (!userId) return;
  await setDoc(doc(db, COLLECTION, userId), {
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
  await writeSession({
    status: 'analyzing',
    jobPosition,
    totalCvs,
    analyzedCount: 0,
    startedAt: Date.now(),
  });
  startHeartbeat();
}

export async function broadcastProgress(analyzedCount: number, totalCvs: number): Promise<void> {
  await writeSession({
    status: 'analyzing',
    analyzedCount,
    totalCvs,
  });
}

export async function broadcastSessionDone(analyzedCount: number, totalCvs: number): Promise<void> {
  stopHeartbeat();
  await writeSession({
    status: 'done',
    analyzedCount,
    totalCvs,
    lastHeartbeat: Date.now(),
  });
}

export async function clearSession(): Promise<void> {
  stopHeartbeat();
  const userId = uid();
  if (!userId) return;
  await setDoc(doc(db, COLLECTION, userId), {
    status: 'idle',
    lastHeartbeat: Date.now(),
  }, { merge: true });
}
