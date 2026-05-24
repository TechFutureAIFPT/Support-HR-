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
  return normalized;
}

export function clearWorkflowDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(WORKFLOW_DRAFT_KEY);
}
