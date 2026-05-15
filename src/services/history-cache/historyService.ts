import { apiGet, apiPost, pickArray } from '@/services/api/renderClient';
import type { Candidate, HistoryEntry } from '@/types';

interface SaveHistoryParams {
  jdText: string;
  jobPosition: string;
  locationRequirement: string;
  candidates: Candidate[];
  userEmail: string;
  weights?: any;
  hardFilters?: any;
}

function normalizeTopCandidate(raw: unknown) {
  const candidate = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    id: String(candidate.id || ''),
    name: String(candidate.name || candidate.candidateName || ''),
    score: Number(candidate.score || candidate.totalScore || 0),
    jdFit: Number(candidate.jdFit || 0),
    grade: String(candidate.grade || 'C'),
  };
}

function normalizeHistoryEntry(raw: unknown): HistoryEntry {
  const entry = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const grades = (entry.grades && typeof entry.grades === 'object')
    ? entry.grades as Record<string, unknown>
    : { A: 0, B: 0, C: 0 };

  const payload = entry.fullPayload && typeof entry.fullPayload === 'object'
    ? entry.fullPayload as Record<string, unknown>
    : undefined;

  return {
    id: String(entry.id || ''),
    timestamp: Number(entry.timestamp || Date.now()),
    jobPosition: String(entry.jobPosition || ''),
    locationRequirement: String(entry.locationRequirement || ''),
    jdTextSnippet: String(entry.jdTextSnippet || ''),
    totalCandidates: Number(entry.totalCandidates || 0),
    grades: {
      A: Number(grades.A || 0),
      B: Number(grades.B || 0),
      C: Number(grades.C || 0),
    },
    topCandidates: Array.isArray(entry.topCandidates) ? entry.topCandidates.map(normalizeTopCandidate) : [],
    userEmail: String(entry.userEmail || entry.email || ''),
    fullPayload: payload ? {
      jdText: String(payload.jdText || ''),
      jobPosition: String(payload.jobPosition || ''),
      weights: payload.weights || {},
      hardFilters: payload.hardFilters || {},
      candidates: Array.isArray(payload.candidates) ? payload.candidates as Candidate[] : [],
    } : undefined,
  };
}

export async function saveHistorySession({
  jdText,
  jobPosition,
  locationRequirement,
  candidates,
  userEmail,
  weights,
  hardFilters,
}: SaveHistoryParams) {
  const response = await apiPost<Record<string, unknown>>(
    '/api/account/history',
    {
      jdText,
      jobPosition,
      locationRequirement,
      candidates,
      userEmail,
      weights: weights || {},
      hardFilters: hardFilters || {},
    },
    { authRequired: true }
  );

  return String(response.id || response.docId || response.historyId || '');
}

export async function fetchRecentHistory(limitCount = 20, userEmail?: string): Promise<HistoryEntry[]> {
  const query = new URLSearchParams({ limit_count: String(limitCount) });
  if (userEmail) query.set('user_email', userEmail);

  const response = await apiGet<unknown>(`/api/account/history?${query.toString()}`, {
    authRequired: true,
  });

  return pickArray<unknown>(response, ['items', 'history', 'entries', 'data']).map(normalizeHistoryEntry);
}

export async function saveManualHistorySnapshot(params: SaveHistoryParams) {
  const response = await apiPost<Record<string, unknown>>(
    '/api/account/history/manual-snapshot',
    {
      jdText: params.jdText,
      jobPosition: params.jobPosition,
      locationRequirement: params.locationRequirement,
      candidates: params.candidates,
      userEmail: params.userEmail,
      weights: params.weights || {},
      hardFilters: params.hardFilters || {},
    },
    { authRequired: true }
  );

  return String(response.id || response.docId || response.historyId || '');
}

export async function fetchManualHistory(userEmail?: string): Promise<HistoryEntry[]> {
  const query = new URLSearchParams();
  if (userEmail) query.set('user_email', userEmail);

  const response = await apiGet<unknown>(
    `/api/account/history/manual${query.toString() ? `?${query.toString()}` : ''}`,
    { authRequired: true }
  );

  return pickArray<unknown>(response, ['items', 'history', 'entries', 'data']).map(normalizeHistoryEntry);
}
