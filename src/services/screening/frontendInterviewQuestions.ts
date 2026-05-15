import type { AnalysisRunData, Candidate } from '@/types';
import { apiPost, pickArray } from '@/services/api/renderClient';

interface AnalysisStats {
  jobPosition: string;
  totalCandidates: number;
  industries: string[];
  levels: string[];
  topCandidates: Candidate[];
  commonWeaknesses: string[];
  skillGaps: string[];
}

export interface QuestionSet {
  category: string;
  icon: string;
  color: string;
  questions: string[];
}

interface InterviewQuestionsResponse {
  question_sets?: unknown[];
}

function normalizeQuestionSet(raw: unknown): QuestionSet {
  const record = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    category: String(record.category || 'Câu hỏi phỏng vấn'),
    icon: String(record.icon || 'fa-solid fa-question'),
    color: String(record.color || 'text-blue-400'),
    questions: Array.isArray(record.questions)
      ? record.questions.map((question) => String(question))
      : [],
  };
}

export async function generateInterviewQuestions(
  analysisData: AnalysisRunData,
  analysisStats: AnalysisStats,
  selectedType: 'general' | 'specific' | 'comparative',
  candidateData?: Candidate | Candidate[]
): Promise<QuestionSet[]> {
  const response = await apiPost<InterviewQuestionsResponse>('/api/interview/questions', {
    analysis_data: analysisData,
    analysis_stats: analysisStats,
    question_type: selectedType,
    candidate_data: candidateData,
  });

  return pickArray<unknown>(response, ['question_sets']).map(normalizeQuestionSet);
}
