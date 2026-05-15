import type { ActiveAnalysisContext } from '@/types';

const ACTIVE_ANALYSIS_CONTEXT_KEY = 'cvAnalysis.context';

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function buildAnalysisSessionId(timestamp: number): string {
  return `analysis-${timestamp}`;
}

export function buildJdHash(jdText: string): string {
  return hashString(jdText || '');
}

export function saveActiveAnalysisContext(context: ActiveAnalysisContext): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_ANALYSIS_CONTEXT_KEY, JSON.stringify(context));
}

export function getActiveAnalysisContext(): ActiveAnalysisContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_ANALYSIS_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveAnalysisContext>;
    if (!parsed.sessionId || typeof parsed.timestamp !== 'number') {
      return null;
    }
    return {
      sessionId: String(parsed.sessionId),
      timestamp: Number(parsed.timestamp),
      jobPosition: typeof parsed.jobPosition === 'string' ? parsed.jobPosition : undefined,
      jdHash: typeof parsed.jdHash === 'string' ? parsed.jdHash : undefined,
      historyId: typeof parsed.historyId === 'string' ? parsed.historyId : undefined,
      syncHistoryId: typeof parsed.syncHistoryId === 'string' ? parsed.syncHistoryId : undefined,
    };
  } catch {
    return null;
  }
}

export function clearActiveAnalysisContext(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVE_ANALYSIS_CONTEXT_KEY);
}
