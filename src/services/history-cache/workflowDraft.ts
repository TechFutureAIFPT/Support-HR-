import type {
  ActiveAnalysisContext,
  AppStep,
  Candidate,
  HardFilters,
  WeightCriteria,
} from '@/types';

export interface WorkflowDraftData {
  version: 1;
  savedAt: number;
  completedSteps: AppStep[];
  jdText: string;
  rawJdText: string;
  jobPosition: string;
  weights: WeightCriteria | null;
  hardFilters: HardFilters | null;
  analysisResults: Candidate[];
  activeAnalysisContext: ActiveAnalysisContext | null;
}

const WORKFLOW_DRAFT_KEY = 'supporthr.workflowDraft';
const WORKFLOW_LAST_ACTIVITY_KEY = 'supporthr.workflowLastActivityAt';
export const WORKFLOW_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
let lastActivityPersistedAt = 0;

function normalizeCandidate(candidate: Candidate, index: number): Candidate {
  const fallbackId = `candidate-${index}-${candidate.fileName || 'file'}-${candidate.candidateName || 'name'}`
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-');

  return {
    ...candidate,
    id: candidate.id || fallbackId,
  };
}

function normalizeCompletedSteps(value: unknown): AppStep[] {
  if (!Array.isArray(value)) return [];

  return value.filter((step): step is AppStep =>
    ['home', 'jd', 'weights', 'upload', 'analysis', 'dashboard', 'chatbot', 'process', 'history', 'feedback'].includes(
      String(step)
    )
  );
}

export function readWorkflowDraft(): WorkflowDraftData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(WORKFLOW_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<WorkflowDraftData>;

    return {
      version: 1,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      completedSteps: normalizeCompletedSteps(parsed.completedSteps),
      jdText: String(parsed.jdText || ''),
      rawJdText: String(parsed.rawJdText || ''),
      jobPosition: String(parsed.jobPosition || ''),
      weights: parsed.weights || null,
      hardFilters: parsed.hardFilters || null,
      analysisResults: Array.isArray(parsed.analysisResults)
        ? parsed.analysisResults.map(normalizeCandidate)
        : [],
      activeAnalysisContext: parsed.activeAnalysisContext || null,
    };
  } catch {
    return null;
  }
}

export function writeWorkflowDraft(draft: Omit<WorkflowDraftData, 'version' | 'savedAt'>): WorkflowDraftData | null {
  if (typeof window === 'undefined') return null;

  const normalized: WorkflowDraftData = {
    version: 1,
    savedAt: Date.now(),
    completedSteps: normalizeCompletedSteps(draft.completedSteps),
    jdText: String(draft.jdText || ''),
    rawJdText: String(draft.rawJdText || ''),
    jobPosition: String(draft.jobPosition || ''),
    weights: draft.weights || null,
    hardFilters: draft.hardFilters || null,
    analysisResults: Array.isArray(draft.analysisResults)
      ? draft.analysisResults.map(normalizeCandidate)
      : [],
    activeAnalysisContext: draft.activeAnalysisContext || null,
  };

  window.localStorage.setItem(WORKFLOW_DRAFT_KEY, JSON.stringify(normalized));
  touchWorkflowActivity(normalized.savedAt, 0);
  return normalized;
}

export function clearWorkflowDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(WORKFLOW_DRAFT_KEY);
}

export function readWorkflowLastActivityAt(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(WORKFLOW_LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function touchWorkflowActivity(timestamp: number = Date.now(), minIntervalMs: number = 30_000): number {
  if (typeof window === 'undefined') return timestamp;

  const normalizedTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
  if (minIntervalMs > 0 && lastActivityPersistedAt && normalizedTimestamp - lastActivityPersistedAt < minIntervalMs) {
    return lastActivityPersistedAt;
  }

  window.localStorage.setItem(WORKFLOW_LAST_ACTIVITY_KEY, String(normalizedTimestamp));
  lastActivityPersistedAt = normalizedTimestamp;
  return normalizedTimestamp;
}

export function isWorkflowSessionExpired(now: number = Date.now()): boolean {
  const lastActivityAt = readWorkflowLastActivityAt();
  if (!lastActivityAt) return false;
  return now - lastActivityAt > WORKFLOW_IDLE_TIMEOUT_MS;
}

export function clearWorkflowActivity(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(WORKFLOW_LAST_ACTIVITY_KEY);
  lastActivityPersistedAt = 0;
}
