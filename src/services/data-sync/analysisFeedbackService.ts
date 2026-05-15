import { apiDelete, apiGet, apiPost, pickArray } from '@/services/api/renderClient';
import type { AnalysisFeedbackAction, AnalysisFeedbackRecord, AnalysisFeedbackSeverity } from '@/types';

export interface SaveAnalysisFeedbackPayload {
  sessionId?: string;
  historyId?: string;
  syncHistoryId?: string;
  candidateId?: string;
  candidateName?: string;
  fileName?: string;
  jobPosition?: string;
  jdHash?: string;
  promptKey?: string;
  promptVersion?: string;
  modelVersion?: string;
  action: AnalysisFeedbackAction;
  aiScore?: number;
  finalScore?: number;
  isReusableGuidance?: boolean;
  rank?: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisFeedbackFilters {
  limitCount?: number;
  sessionId?: string;
  historyId?: string;
  syncHistoryId?: string;
  candidateId?: string;
  action?: AnalysisFeedbackAction;
}

export interface AnalysisFeedbackStats {
  totalFeedback: number;
  actionsCount: Record<string, number>;
  positiveCount: number;
  negativeCount: number;
  latestFeedbackAt: number | null;
  recentEntries: AnalysisFeedbackRecord[];
}

function normalizeTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
}

function normalizeFeedbackRecord(raw: unknown): AnalysisFeedbackRecord {
  const item = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const severityValue = item.severity ? String(item.severity).toLowerCase() : 'low';
  const normalizedSeverity: AnalysisFeedbackSeverity = severityValue === 'high'
    ? 'high'
    : severityValue === 'medium'
      ? 'medium'
      : 'low';

  return {
    id: String(item.id || ''),
    uid: String(item.uid || ''),
    userEmail: String(item.userEmail || ''),
    displayName: String(item.displayName || ''),
    photoUrl: String(item.photoUrl || ''),
    sessionId: item.sessionId ? String(item.sessionId) : null,
    historyId: item.historyId ? String(item.historyId) : null,
    syncHistoryId: item.syncHistoryId ? String(item.syncHistoryId) : null,
    candidateId: item.candidateId ? String(item.candidateId) : null,
    candidateName: item.candidateName ? String(item.candidateName) : null,
    fileName: item.fileName ? String(item.fileName) : null,
    jobPosition: item.jobPosition ? String(item.jobPosition) : null,
    jdHash: item.jdHash ? String(item.jdHash) : null,
    promptKey: item.promptKey ? String(item.promptKey) : null,
    promptVersion: item.promptVersion ? String(item.promptVersion) : null,
    modelVersion: item.modelVersion ? String(item.modelVersion) : null,
    action: String(item.action || 'neutral') as AnalysisFeedbackAction,
    aiScore: typeof item.aiScore === 'number' ? item.aiScore : null,
    finalScore: typeof item.finalScore === 'number' ? item.finalScore : null,
    isReusableGuidance: normalizeBoolean(item.isReusableGuidance),
    severity: normalizedSeverity,
    rank: item.rank ? String(item.rank) : null,
    reason: item.reason ? String(item.reason) : null,
    notes: item.notes ? String(item.notes) : null,
    metadata: item.metadata && typeof item.metadata === 'object'
      ? item.metadata as Record<string, unknown>
      : {},
    createdAt: normalizeTimestamp(item.createdAt),
    updatedAt: normalizeTimestamp(item.updatedAt),
  };
}

export async function saveAnalysisFeedback(
  payload: SaveAnalysisFeedbackPayload
): Promise<AnalysisFeedbackRecord> {
  const response = await apiPost<unknown>(
    '/api/account/history/feedback',
    payload,
    { authRequired: true }
  );
  return normalizeFeedbackRecord(response);
}

export async function listAnalysisFeedback(
  filters: AnalysisFeedbackFilters = {}
): Promise<AnalysisFeedbackRecord[]> {
  const query = new URLSearchParams();

  if (filters.limitCount) query.set('limit_count', String(filters.limitCount));
  if (filters.sessionId) query.set('session_id', filters.sessionId);
  if (filters.historyId) query.set('history_id', filters.historyId);
  if (filters.syncHistoryId) query.set('sync_history_id', filters.syncHistoryId);
  if (filters.candidateId) query.set('candidate_id', filters.candidateId);
  if (filters.action) query.set('action', filters.action);

  const response = await apiGet<unknown>(
    `/api/account/history/feedback${query.toString() ? `?${query.toString()}` : ''}`,
    { authRequired: true }
  );

  return pickArray<unknown>(response, ['items', 'entries', 'feedback', 'data'])
    .map(normalizeFeedbackRecord);
}

export async function getAnalysisFeedbackStats(filters: {
  sessionId?: string;
  historyId?: string;
  syncHistoryId?: string;
} = {}): Promise<AnalysisFeedbackStats> {
  const query = new URLSearchParams();

  if (filters.sessionId) query.set('session_id', filters.sessionId);
  if (filters.historyId) query.set('history_id', filters.historyId);
  if (filters.syncHistoryId) query.set('sync_history_id', filters.syncHistoryId);

  const response = await apiGet<unknown>(
    `/api/account/history/feedback/stats${query.toString() ? `?${query.toString()}` : ''}`,
    { authRequired: true }
  );

  const item = (response && typeof response === 'object') ? response as Record<string, unknown> : {};

  return {
    totalFeedback: Number(item.totalFeedback || 0),
    actionsCount: item.actionsCount && typeof item.actionsCount === 'object'
      ? item.actionsCount as Record<string, number>
      : {},
    positiveCount: Number(item.positiveCount || 0),
    negativeCount: Number(item.negativeCount || 0),
    latestFeedbackAt: normalizeTimestamp(item.latestFeedbackAt),
    recentEntries: Array.isArray(item.recentEntries)
      ? item.recentEntries.map(normalizeFeedbackRecord)
      : [],
  };
}

export async function deleteAnalysisFeedback(feedbackId: string): Promise<boolean> {
  const response = await apiDelete<Record<string, unknown>>(
    `/api/account/history/feedback/${encodeURIComponent(feedbackId)}`,
    { authRequired: true }
  );

  return Boolean(response.ok);
}
