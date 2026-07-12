import type {
  AnalysisFeedbackMetadata,
  Candidate,
  CandidateBrief,
  StageDecision,
} from '@/types';
import { isSystemDiagnosticText, normalizeVietnameseDisplay } from '@/utils/textDisplay';

export function getCandidateScore(candidate: Candidate): number {
  return candidate.status === 'SUCCESS' ? candidate.analysis?.['Tổng điểm'] || 0 : 0;
}

export function getDisplayedCandidateScore(candidate: Candidate): number {
  return typeof candidate.analysis?.feedbackAdjusted === 'number'
    ? candidate.analysis.feedbackAdjusted
    : getCandidateScore(candidate);
}

export function getCandidateRank(candidate: Candidate): string {
  return candidate.analysis?.['Hạng'] || 'C';
}

export function buildHeadlineVerdict(candidate: Candidate): string {
  const overallVerdict = normalizeVietnameseDisplay(candidate.hrSummary?.nhan_xet_tong_quan || '');
  if (overallVerdict && !isSystemDiagnosticText(overallVerdict)) return overallVerdict;
  const stageReason = normalizeVietnameseDisplay(candidate.stageDecision?.reason || '');
  if (stageReason && !isSystemDiagnosticText(stageReason)) return stageReason;
  const score = getCandidateScore(candidate);
  if (score >= 75) return 'Hồ sơ phù hợp tốt với vị trí, nên ưu tiên shortlist.';
  if (score >= 60) return 'Ứng viên đáp ứng phần lớn yêu cầu, nên xem xét mời phỏng vấn.';
  if (score >= 40) return 'Ứng viên có tiềm năng nhưng còn điểm cần xác minh thêm.';
  return 'Hồ sơ chưa đáp ứng đủ tiêu chí cốt lõi, chưa nên ưu tiên shortlist.';
}

export function buildTopReasons(candidate: Candidate, limit = 3): string[] {
  const strengths = (candidate.analysis?.['Điểm mạnh CV'] || []).slice(0, 3);
  const matched = (candidate.jdCvMatchInsights?.matchedRequirements || candidate.jdCvMatchInsights?.matchedSkills || []).slice(0, 3);
  const skillEvidence = (candidate.hrSummary?.danh_gia_ky_nang || []).slice(0, 2).map((item) => item.bang_chung_tu_cv);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...strengths, ...matched, ...skillEvidence]) {
    const text = normalizeVietnameseDisplay(item);
    const key = text.toLowerCase().substring(0, 60);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

export function buildVerificationRisks(candidate: Candidate, limit = 3): string[] {
  const weaknesses = (candidate.analysis?.['Điểm yếu CV'] || []).slice(0, 2);
  const warnings = (candidate.softFilterWarnings || []).slice(0, 2);
  const missing = (candidate.jdCvMatchInsights?.missingRequirements || []).slice(0, 2);
  const blockers = (candidate.stageDecision?.blockingReasons || []).slice(0, 2);
  const redFlags = (candidate.hrSummary?.canh_bao_red_flag || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...weaknesses, ...warnings, ...missing, ...blockers, ...redFlags]) {
    const text = normalizeVietnameseDisplay(item);
    const key = text.toLowerCase().substring(0, 60);
    if (!text || seen.has(key) || isSystemDiagnosticText(text)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

export function buildRecommendedAction(candidate: Candidate): string {
  const label = normalizeVietnameseDisplay(candidate.stageDecision?.label || '');
  if (label) return label;
  const score = getCandidateScore(candidate);
  if (score >= 75) return 'Ưu tiên mời phỏng vấn';
  if (score >= 60) return 'Phỏng vấn xác minh thêm';
  return 'Chưa ưu tiên shortlist';
}

export function buildCandidateBrief(candidate: Candidate): CandidateBrief {
  const stageDecision: StageDecision | undefined = candidate.stageDecision;
  return {
    id: candidate.id,
    candidateName: normalizeVietnameseDisplay(candidate.candidateName),
    score: getCandidateScore(candidate),
    rank: getCandidateRank(candidate),
    headlineVerdict: buildHeadlineVerdict(candidate),
    topStrengths: buildTopReasons(candidate, 4),
    topRisks: buildVerificationRisks(candidate, 4),
    matchedRequirements: (candidate.jdCvMatchInsights?.matchedRequirements || candidate.jdCvMatchInsights?.matchedSkills || [])
      .map((item) => normalizeVietnameseDisplay(item))
      .filter(Boolean)
      .slice(0, 6),
    missingRequirements: (candidate.jdCvMatchInsights?.missingRequirements || [])
      .map((item) => normalizeVietnameseDisplay(item))
      .filter(Boolean)
      .slice(0, 6),
    redFlags: (candidate.hrSummary?.canh_bao_red_flag || [])
      .map((item) => normalizeVietnameseDisplay(item))
      .filter(Boolean)
      .slice(0, 4),
    stageDecision: {
      status: stageDecision?.status || '',
      label: normalizeVietnameseDisplay(stageDecision?.label || ''),
      reason: normalizeVietnameseDisplay(stageDecision?.reason || ''),
      blockingReasons: (stageDecision?.blockingReasons || []).map((item) => normalizeVietnameseDisplay(item)).filter(Boolean).slice(0, 4),
    },
    interviewQuestions: (candidate.analysis?.['Câu hỏi phỏng vấn'] || [])
      .map((item) => normalizeVietnameseDisplay(item))
      .filter(Boolean)
      .slice(0, 4),
  };
}

export function buildFeedbackMetadata(candidate: Candidate, scoreDifference: number, selectedCriteria: string[], isReusableGuidance: boolean): AnalysisFeedbackMetadata {
  const brief = buildCandidateBrief(candidate);
  return {
    source: 'ui-feedback-page',
    feedbackScope: isReusableGuidance ? 'reusable-guidance' : 'candidate-specific',
    isReusableGuidance,
    selectedCriteria,
    scoreDifference,
    verdictHeadline: brief.headlineVerdict,
    topStrengths: brief.topStrengths,
    topRisks: brief.topRisks,
    matchedRequirements: brief.matchedRequirements,
    missingRequirements: brief.missingRequirements,
    redFlags: brief.redFlags,
    stageDecision: brief.stageDecision,
  };
}

export function getRankColors(rank?: string): string {
  if (rank === 'A') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (rank === 'B') return 'bg-blue-50 text-blue-700 border border-blue-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
}

export function getInitials(name: string): string {
  const parts = normalizeVietnameseDisplay(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || 'U').toUpperCase();
}
