import type { WorkspaceSessionStatus } from '@/types/workspace';

const STORAGE_KEY = 'supporthr.workspace.session-state.v1';

type LegacyWorkspaceSessionStatus = WorkspaceSessionStatus | 'screening' | 'closed';
type SessionStateMap = Record<string, { status: LegacyWorkspaceSessionStatus; updatedAt: number }>;

function normalizeWorkspaceSessionStatus(
  status: LegacyWorkspaceSessionStatus | undefined,
  fallback: WorkspaceSessionStatus,
): WorkspaceSessionStatus {
  if (status === 'completed' || status === 'closed') return 'completed';
  if (status === 'review' || status === 'screening') return 'review';
  if (status === 'open') return 'open';
  return fallback;
}

function readState(): SessionStateMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as SessionStateMap;
  } catch {
    return {};
  }
}

export function getWorkspaceSessionStatus(
  ownerKey: string,
  sessionId: string,
  fallback: WorkspaceSessionStatus,
): WorkspaceSessionStatus {
  return normalizeWorkspaceSessionStatus(
    readState()[`${ownerKey}::${sessionId}`]?.status,
    fallback,
  );
}

export function setWorkspaceSessionStatus(
  ownerKey: string,
  sessionId: string,
  status: WorkspaceSessionStatus,
): void {
  if (typeof window === 'undefined') return;
  const state = readState();
  state[`${ownerKey}::${sessionId}`] = { status, updatedAt: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('supporthr:workspace-session-state'));
}
