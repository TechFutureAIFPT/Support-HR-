import type { Candidate, CandidateBrief } from '@/types';
import { isSystemDiagnosticText, normalizeVietnameseDisplay } from '@/utils/textDisplay';

function candidateScore(candidate: Candidate): number {
  return candidate.status === 'SUCCESS' ? candidate.analysis?.['Tổng điểm'] || 0 : 0;
}

function candidateHeadlineVerdict(candidate: Candidate): string {
  const overallVerdict = normalizeVietnameseDisplay(candidate.hrSummary?.nhan_xet_tong_quan || '');
  if (overallVerdict && !isSystemDiagnosticText(overallVerdict)) return overallVerdict;
  const stageReason = normalizeVietnameseDisplay(candidate.stageDecision?.reason || '');
  if (stageReason && !isSystemDiagnosticText(stageReason)) return stageReason;
  const score = candidateScore(candidate);
  if (score >= 75) return 'Hồ sơ phù hợp tốt với vị trí — đề xuất ưu tiên đưa vào shortlist.';
  if (score >= 60) return 'Ứng viên đáp ứng phần lớn yêu cầu — nên xem xét mời phỏng vấn.';
  if (score >= 40) return 'Ứng viên có tiềm năng, còn một số điểm cần xác nhận thêm.';
  return 'Hồ sơ chưa đáp ứng đủ tiêu chí cốt lõi — cân nhắc trước khi đưa vào shortlist.';
}

/** Map một Candidate đầy đủ sang CandidateBrief gọn để gửi cho chatbot_copilot_service (BE). */
export function buildCandidateBrief(candidate: Candidate): CandidateBrief {
  const matchedRequirements = candidate.jdCvMatchInsights?.matchedRequirements?.length
    ? candidate.jdCvMatchInsights.matchedRequirements
    : candidate.jdCvMatchInsights?.matchedSkills || [];
  const missingRequirements = candidate.jdCvMatchInsights?.missingRequirements?.length
    ? candidate.jdCvMatchInsights.missingRequirements
    : candidate.jdCvMatchInsights?.missingSkills || [];

  return {
    id: candidate.id,
    candidateName: normalizeVietnameseDisplay(candidate.candidateName),
    score: candidateScore(candidate),
    rank: candidate.analysis?.['Hạng'] || 'C',
    headlineVerdict: candidateHeadlineVerdict(candidate),
    topStrengths: (candidate.analysis?.['Điểm mạnh CV'] || []).slice(0, 4).map((item) => normalizeVietnameseDisplay(item)),
    topRisks: (candidate.analysis?.['Điểm yếu CV'] || []).slice(0, 4).map((item) => normalizeVietnameseDisplay(item)),
    matchedRequirements: matchedRequirements.slice(0, 6).map((item) => normalizeVietnameseDisplay(item)),
    missingRequirements: missingRequirements.slice(0, 6).map((item) => normalizeVietnameseDisplay(item)),
    redFlags: (candidate.hrSummary?.canh_bao_red_flag || []).slice(0, 4).map((item) => normalizeVietnameseDisplay(item)),
    stageDecision: {
      status: candidate.stageDecision?.status || '',
      label: normalizeVietnameseDisplay(candidate.stageDecision?.label || ''),
      reason: normalizeVietnameseDisplay(candidate.stageDecision?.reason || ''),
      blockingReasons: (candidate.stageDecision?.blockingReasons || []).map((item) => normalizeVietnameseDisplay(item)),
    },
    interviewQuestions: (candidate.analysis?.['Câu hỏi phỏng vấn'] || []).slice(0, 4).map((item) => normalizeVietnameseDisplay(item)),
  };
}

export function buildCandidateBriefs(candidates: Candidate[]): CandidateBrief[] {
  return candidates.filter((candidate) => candidate.status === 'SUCCESS').map(buildCandidateBrief);
}
