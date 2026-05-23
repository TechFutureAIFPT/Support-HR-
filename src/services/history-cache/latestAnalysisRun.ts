import type { AnalysisRunData, Candidate } from '@/types';

export const LATEST_ANALYSIS_RUN_KEY = 'cvAnalysis.latest';

function normalizeCandidate(candidate: Candidate, index: number): Candidate {
  const fallbackId = `candidate-${index}-${candidate.fileName || 'file'}-${candidate.candidateName || 'name'}`
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-');

  return {
    ...candidate,
    id: candidate.id || fallbackId,
  };
}

export function normalizeAnalysisRun(value: unknown): AnalysisRunData | null {
  if (!value || typeof value !== 'object') return null;

  const run = value as Partial<AnalysisRunData>;
  if (!Array.isArray(run.candidates) || run.candidates.length === 0) return null;

  return {
    timestamp: typeof run.timestamp === 'number' ? run.timestamp : Date.now(),
    job: {
      position: String(run.job?.position || ''),
      locationRequirement: String(run.job?.locationRequirement || ''),
    },
    candidates: (run.candidates as Candidate[]).map(normalizeCandidate),
  };
}

export function readLatestAnalysisRun(): AnalysisRunData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LATEST_ANALYSIS_RUN_KEY);
    return raw ? normalizeAnalysisRun(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeLatestAnalysisRun(run: AnalysisRunData): AnalysisRunData | null {
  if (typeof window === 'undefined') return normalizeAnalysisRun(run);

  const normalized = normalizeAnalysisRun(run);
  if (!normalized) return null;

  window.localStorage.setItem(LATEST_ANALYSIS_RUN_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearLatestAnalysisRun(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LATEST_ANALYSIS_RUN_KEY);
}
