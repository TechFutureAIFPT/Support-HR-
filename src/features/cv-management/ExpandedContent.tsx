import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  FileCheck2,
  GraduationCap,
  Hourglass,
  Languages,
  MapPin,
  Target,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { Candidate, DetailedScore, UploadedFileRecord, WeightCriteria } from '@/types';
import { analyzeExperience, extractJDRequirements, compareEvidence } from '@/services/screening/frontendInsights';
import { UploadedFilesService } from '@/services/data-sync/uploadedFilesService';
import { useThemeColors } from '@/hooks/useThemeColors';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import '@/features/cv-management/styles/expanded-content-accessible.css';


// ── Phân loại tiêu chí ──────────────────────────────────────────────────────

const BASIC_CRITERIA = [
  'Phù hợp JD (Job Fit)', 'Kinh nghiệm', 'Kỹ năng', 'Thành tựu/KPI',
  'Học vấn', 'Ngôn ngữ', 'Chuyên nghiệp', 'Gắn bó & Lịch sử CV', 'Phù hợp văn hoá',
  'Hệ số uy tín công ty', // chuyển về cơ bản
];

const REMOVED_CRITERIA = [
  'Mức độ trung thành',
  'Kỹ năng hành động & chủ động',
  'Trình bày STAR & Kết quả',
  'Kỹ năng chuyển đổi (Skill Graph)',
  'Tiềm năng phát triển (Career Velocity)',
];

// Thang điểm chuẩn
const DEFAULT_CORE_CRITERIA = BASIC_CRITERIA.slice(0, 9);
const FALLBACK_CORE_TOTAL_MAX = 100;
const BASIC_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = {
  'Phù hợp JD (Job Fit)': {
    what: 'So sánh từ khóa JD với nội dung CV: kỹ năng, công nghệ, ngành nghề, yêu cầu vai trò.',
    why: 'Tiêu chí này trực tiếp phản ánh ứng viên có đáp ứng đúng vị trí tuyển dụng hay không — trọng số cao nhất.',
    signals: ['Trùng đồng kỹ năng bắt buộc trong JD', 'Tên ngành/lĩnh vực giống nhau', 'Trình độ yêu cầu khớp (mà không quá cao/thấp)'],
  },
  'Kinh nghiệm': {
    what: 'Tổng số năm kinh nghiệm thực tế có liên quan đến vị trí hiện tại.',
    why: 'Kinh nghiệm là chỉ báo nằng nề nhất cho khả năng thực chiến — giảm thời gian onboard.',
    signals: ['Số năm kinh nghiệm khớp yêu cầu JD', 'Vai trò tương đương ở công ty trước', 'Đã làm việc với công nghệ/stack tương tự'],
  },
  'Kỹ năng': {
    what: 'Kỹ năng cứng (technical) và mềm (soft) được liệt kê có khớp với yêu cầu không.',
    why: 'Kỹ năng đúng giúp ứng viên làm việc hiệu quả ngay từ ngày đầu, giảm chi phí đào tạo.',
    signals: ['Công cụ/framework được dùng tích cực trong JD', 'Không chỉ liệt kê mà có dẫn chứng sử dụng', 'Kỹ năng được xác nhận qua dự án cụ thể'],
  },
  'Thành tựu/KPI': {
    what: 'Kết quả định lượng đạt được: tăng trưởng, tiết kiệm, tối ưu, tạo ra giá trị đo được.',
    why: 'Thành tựu số liệu cụ thể là bằng chứng mạnh nhất cho năng lực thực của ứng viên.',
    signals: ['Tăng doanh thu/hiệu quả bằng con số cụ thể', 'Tiết kiệm chi phí hoặc thời gian (%)', 'Đạt hoặc vượt KPI được giao'],
  },
  'Học vấn': {
    what: 'Bằng cấp, trường học, chuyên ngành và chứng chỉ chuyên môn có đáp ứng yêu cầu không.',
    why: 'Học vấn phù hợp đảm bảo nền tảng lý thuyết cho công việc — đặc biệt quan trọng với ngành kỹ thuật.',
    signals: ['Chuyên ngành đúng ngành nghề', 'Trường đào tạo uy tín (cộng điểm)', 'Chứng chỉ chuyên nghiệp: AWS, CFA, PMP...'],
  },
  'Ngôn ngữ': {
    what: 'Trình độ ngoại ngữ được kê khai so với yêu cầu ngôn ngữ của JD.',
    why: 'Vị trí quốc tế hoặc có đối tác nước ngoài cần ngôn ngữ đủ mạnh để giao tiếp hiệu quả.',
    signals: ['Tiếng Anh B2+ / IELTS 6.5+ nếu JD yêu cầu', 'Ngoại ngữ hiếm (Nhật, Hàn) là lợi thế', 'Có chứng chỉ ngôn ngữ uy tín'],
  },
  'Chuyên nghiệp': {
    what: 'Đánh giá chất lượng trình bày CV: cấu trúc rõ ràng, không lỗi chính tả, format nhất quán.',
    why: 'CV chuyên nghiệp phản ánh tác phong làm việc — ứng viên đầu tư vào chi tiết sẽ chăm chỉ hơn trong công việc.',
    signals: ['Không có lỗi chính tả, ngữ pháp', 'Layout gọn gàng, có phân mục rõ ràng', 'Không insert thông tin không liên quan'],
  },
  'Gắn bó & Lịch sử CV': {
    what: 'Phân tích xu hướng thay đổi công việc: số lần chuyển, tần suất và lý do có hợp lý.',
    why: 'Lịch sử CV cho thấy ứng viên có cam kết dài hạn hay không — tránh tuyển dụng rồi nghỉ sớm.',
    signals: ['Không chuyển việc liên tục (< 1 năm/công ty)', 'Khoảng trống giữa các công việc có giải thích hợp lý', 'Xu hướng tăng trưởng rõ ràng qua các công ty'],
  },
  'Phù hợp văn hoá': {
    what: 'Dấu hiệu văn hóa phù hợp với công ty: teamwork, innovation, agile, leadership...',
    why: 'Phù hợp văn hóa ảnh hưởng gần 50% quyết định gữ chân — thiếu sự fit này đồng nghĩa turnover cao.',
    signals: ['Hoạt động ngoại khóa, tình nguyện, community', 'Phong cách viết CV reflect văn hóa', 'Vị trí cũ có văn hóa tương đồng'],
  },
  'Hệ số uy tín công ty': {
    what: 'AI phân loại từng công ty đã làm thành Tier 1/2/3 và áp hệ số nhân tương ứng vào điểm kinh nghiệm.',
    why: 'Cùng bạn năm kinh nghiệm: người làm Google và công ty vô danh chất lượng đào tạo khác rất lớn.',
    signals: ['Tier 1 (x1.5): FAANG, Top Consulting (McKinsey, BCG), Goldman Sachs', 'Tier 2 (x1.2): Các công ty Fortune 500, Big 4, công ty tech hàng đầu Việt Nam', 'Tier 3 (x1.0): Công ty thông thường | Startup chưa nổi tiếng (không trừ điểm)'],
  },
};


const CRITERION_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = BASIC_DESCRIPTIONS;

const CARD_CRITERIA_META: { [key: string]: { Icon: LucideIcon; color: string; accent: string } } = {
  [BASIC_CRITERIA[0]]: { Icon: Target, color: 'text-sky-400', accent: 'border-sky-500/30 bg-sky-500/5' },
  [BASIC_CRITERIA[1]]: { Icon: BriefcaseBusiness, color: 'text-green-400', accent: 'border-green-500/30 bg-green-500/5' },
  [BASIC_CRITERIA[2]]: { Icon: Wrench, color: 'text-purple-400', accent: 'border-purple-500/30 bg-purple-500/5' },
  [BASIC_CRITERIA[3]]: { Icon: Award, color: 'text-yellow-400', accent: 'border-yellow-500/30 bg-yellow-500/5' },
  [BASIC_CRITERIA[4]]: { Icon: GraduationCap, color: 'text-indigo-400', accent: 'border-indigo-500/30 bg-indigo-500/5' },
  [BASIC_CRITERIA[5]]: { Icon: Languages, color: 'text-orange-400', accent: 'border-orange-500/30 bg-orange-500/5' },
  [BASIC_CRITERIA[6]]: { Icon: FileCheck2, color: 'text-cyan-400', accent: 'border-cyan-500/30 bg-cyan-500/5' },
  [BASIC_CRITERIA[7]]: { Icon: Hourglass, color: 'text-lime-400', accent: 'border-lime-500/30 bg-lime-500/5' },
  [BASIC_CRITERIA[8]]: { Icon: UsersRound, color: 'text-pink-400', accent: 'border-pink-500/30 bg-pink-500/5' },
  [BASIC_CRITERIA[9]]: { Icon: Building2, color: 'text-emerald-400', accent: 'border-emerald-500/30 bg-emerald-500/5' },
};

// Helper đọc dữ liệu phân tích trả về từ nhiều schema backend khác nhau.

function normalizeAscii(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getRecordValueByAliases(record: Record<string, unknown>, aliases: string[]): string {
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined || !String(value).trim()) {
      continue;
    }

    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (aliases.includes(normalizedKey)) {
      return normalizeVietnameseDisplay(String(value).trim());
    }
  }

  return '';
}

function getRawRecordValueByAliases(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (aliases.includes(normalizedKey)) {
      return value;
    }
  }

  return undefined;
}

function getDetailCriterion(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['tieu chi', 'tieuchi', 'criterion']);
}

function getDetailScore(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['diem', 'score']);
}

function getDetailFormula(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['cong thuc', 'formula']);
}

function getDetailEvidence(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['dan chung', 'evidence']);
}

function getDetailExplanation(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['giai thich', 'explanation']);
}

function includesTechnicalModelSignals(value: string): boolean {
  const normalized = normalizeAscii(value);
  return (
    normalized.includes('classifier') ||
    normalized.includes('vector') ||
    normalized.includes('embedding') ||
    normalized.includes('similarity') ||
    normalized.includes('match')
  );
}

function buildHrFriendlyDetailComment(
  criterionName: string,
  explanation: string,
  parsedData: ReturnType<typeof parseDetailScore>,
  keywordMetrics?: NonNullable<DetailedScore['advancedBreakdown']>['keyword_metrics'],
): string {
  const scoreText = parsedData.hasScore
    ? `Tiêu chí này đạt ${parsedData.scoreLabel}, tương đương khoảng ${parsedData.achievedPct}%.`
    : 'Tiêu chí này chưa có điểm chi tiết rõ ràng từ hệ thống.';

  const normalizedCriterion = normalizeAscii(criterionName);
  const guidance: string[] = [scoreText];

  if (includesTechnicalModelSignals(explanation)) {
    guidance.push(
      'Các tín hiệu tự động đang cho thấy hồ sơ có liên quan đến nhóm ngành/vai trò phù hợp, nên hệ thống cộng điểm hỗ trợ. HR nên xem đây là tín hiệu tham khảo và đối chiếu lại với dự án, kinh nghiệm và chứng chỉ trong CV.'
    );
  } else if (explanation.trim()) {
    guidance.push(explanation.trim().replace(/^["']|["']$/g, ''));
  }

  if (keywordMetrics && keywordMetrics.total_required_keywords > 0) {
    if (keywordMetrics.matched_keywords_count === 0) {
      guidance.push(
        'Chưa thấy từ khóa bắt buộc nào khớp trực tiếp trong dẫn chứng, vì vậy HR nên phỏng vấn thêm để xác minh năng lực liên quan.'
      );
    } else if (keywordMetrics.match_percentage >= 70) {
      guidance.push('CV có nhiều từ khóa trùng với JD, đây là dấu hiệu phù hợp khá tốt với yêu cầu tuyển dụng.');
    } else {
      guidance.push('CV có một phần tín hiệu phù hợp, nhưng vẫn cần kiểm tra thêm các yêu cầu còn thiếu trước khi đưa vào danh sách đề cử.');
    }
  }

  if (normalizedCriterion.includes('hoc van')) {
    guidance.push('Khi đánh giá học vấn, HR nên kiểm tra tên trường, chuyên ngành, thời gian học và chứng chỉ có đúng với yêu cầu JD hay không.');
  } else if (normalizedCriterion.includes('ky nang')) {
    guidance.push('Nên ưu tiên bằng chứng ứng viên đã dùng kỹ năng trong dự án thực tế, không chỉ liệt kê tên công nghệ.');
  } else if (normalizedCriterion.includes('phu hop jd')) {
    guidance.push('Nếu điểm chưa cao, HR nên xem ứng viên có thiếu kỹ năng bắt buộc nào của JD hay chỉ khác cách diễn đạt trong CV.');
  }

  return guidance.join(' ');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightedEvidenceHtml(text: string, keywords: string[]): string {
  let html = escapeHtml(text);
  const sortedKeywords = [...new Set(keywords.filter(Boolean))].sort((a, b) => b.length - a.length);

  sortedKeywords.forEach((keyword) => {
    const pattern = new RegExp(`(${escapeRegex(escapeHtml(keyword))})`, 'gi');
    html = html.replace(
      pattern,
      '<mark class="rounded bg-emerald-400/20 px-1 py-0.5 font-semibold text-emerald-200 underline decoration-emerald-300/70 underline-offset-4">$1</mark>'
    );
  });

  return html;
}

const MISSING_DETAIL_EVIDENCE = 'AI chưa trả về dẫn chứng cụ thể cho tiêu chí này.';
const CV_TEXT_FIELD_ALIASES = new Set([
  'cv text',
  'cvtext',
  'resume text',
  'resumetext',
  'extracted text',
  'extractedtext',
  'raw text',
  'rawtext',
  'full text',
  'fulltext',
  'content',
  'text',
]);
const EXPERIENCE_TEXT_FIELD_ALIASES = new Set([
  'experience',
  'work experience',
  'employment history',
  'kinh nghiem',
  'qua trinh cong tac',
  'lich su lam viec',
]);
const MONTH_NAME_TOKEN = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|thg\\.?\\s*\\d{1,2}|tháng\\s*\\d{1,2})';
const TIMELINE_DATE_TOKEN = `(?:(?:0?[1-9]|1[0-2])\\/\\d{4}|\\d{4}|${MONTH_NAME_TOKEN}\\s*\\/?\\s*\\d{4})`;
const TIMELINE_RANGE_REGEX = new RegExp(
  `(${TIMELINE_DATE_TOKEN})\\s*(?:-|–|—|to|đến|tới)\\s*(${TIMELINE_DATE_TOKEN}|hiện tại|hien tai|nay|present|current)`,
  'i'
);

interface CareerTimelineItem {
  id: string;
  periodLabel: string;
  summary: string;
  companyName: string;
  isCurrent: boolean;
  durationMonths: number | null;
}

interface EducationSummary {
  institution: string;
  major: string;
  degree: string;
  rawLine: string;
}

type JdCvMatchKind = 'exact' | 'semantic' | 'transfer' | 'incorrect';

interface JdCvEvidenceRow {
  id: string;
  section?: string;
  requirement: string;
  jdEvidence: string;
  cvEvidence: string;
  matchKind: JdCvMatchKind;
  confidence: number;
  reason: string;
}

const uploadedCvTextCache = new Map<string, string>();

function uniqueTextItems(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function compactEvidenceText(value: string, maxLength: number = 280): string {
  const cleaned = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[`*_#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function looksLikeSkillEvidenceLine(value: string): boolean {
  const normalized = normalizeAscii(value);
  if (!normalized) return false;

  const skillTokens = [
    'aws', 'azure', 'gcp', 'sql', 'mysql', 'postgresql', 'mongodb', 'node',
    'nodejs', 'express', 'graphql', 'rest', 'api', 'react', 'vue', 'angular',
    'typescript', 'javascript', 'python', 'java', 'spring', 'docker', 'kubernetes',
    'redis', 'kafka', 'git', 'ci', 'cd', 'devops', 'linux',
  ];
  const hasKnownSkill = skillTokens.some((token) =>
    normalized === token ||
    normalized.includes(` ${token} `) ||
    normalized.startsWith(`${token} `) ||
    normalized.endsWith(` ${token}`)
  );
  const hasSkillSeparator = /[,/|+]/.test(value) && normalized.split(/\s+/).some((token) => token.length >= 2);

  return hasKnownSkill || hasSkillSeparator;
}

function splitEvidenceSentences(text: string): string[] {
  return uniqueTextItems(
    String(text || '')
      .split(/(?<=[.!?。])\s+|\n|;|•|\u2022/g)
      .map((line) => compactEvidenceText(line, 320))
      .filter((line) => (line.length >= 16 || looksLikeSkillEvidenceLine(line)) && !looksLikeAnalysisPayload(line))
  ).slice(0, 80);
}

function buildEvidenceSearchTerms(requirement: string, extraTerms: string[] = []): string[] {
  const rawTerms = [requirement, ...extraTerms]
    .flatMap((term) => String(term || '').split(/[,/|;(){}\[\]<>→=>~]+/g))
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);

  const tokenTerms = rawTerms.flatMap((term) =>
    normalizeAscii(term)
      .split(/\s+/)
      .filter((token) => token.length >= 3)
  );

  return uniqueTextItems([...rawTerms, ...tokenTerms]);
}

function scoreEvidenceSentence(sentence: string, terms: string[]): number {
  const normalizedSentence = ` ${normalizeAscii(sentence)} `;
  return terms.reduce((score, term) => {
    const normalizedTerm = normalizeAscii(term);
    if (!normalizedTerm) return score;
    if (normalizedSentence.includes(` ${normalizedTerm} `) || normalizedSentence.includes(normalizedTerm)) {
      return score + Math.max(1, normalizedTerm.length / 10);
    }
    return score;
  }, 0);
}

function findBestEvidenceSentence(sourceText: string, requirement: string, extraTerms: string[] = []): string {
  const sentences = splitEvidenceSentences(sourceText);
  if (!sentences.length) return '';

  const terms = buildEvidenceSearchTerms(requirement, extraTerms);
  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreEvidenceSentence(sentence, terms),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.index - right.index;
    });

  if (terms.length && (ranked[0]?.score || 0) <= 0) {
    return '';
  }

  return compactEvidenceText(ranked[0]?.sentence || sentences[0] || '');
}

function normalizeMatchKind(value: string | undefined, fallback: JdCvMatchKind = 'semantic'): JdCvMatchKind {
  const normalized = normalizeAscii(value || '');
  if (normalized.includes('missing') || normalized.includes('thieu') || normalized.includes('incorrect') || normalized.includes('sai')) return 'incorrect';
  if (normalized.includes('transfer') || normalized.includes('chuyen')) return 'transfer';
  if (normalized.includes('exact') || normalized.includes('direct') || normalized.includes('keyword')) return 'exact';
  if (normalized.includes('semantic') || normalized.includes('vector') || normalized.includes('embedding')) return 'semantic';
  return fallback;
}

function getMatchKindLabel(kind: JdCvMatchKind): string {
  return kind === 'incorrect' ? 'Sai' : 'Đúng';
}

function getMatchKindClasses(kind: JdCvMatchKind): string {
  if (kind === 'exact') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (kind === 'transfer') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  if (kind === 'incorrect') return 'border-rose-500/35 bg-rose-500/10 text-rose-300';
  return 'border-teal-500/30 bg-teal-500/10 text-teal-300';
}

function getMatchKindDetail(kind: JdCvMatchKind): string {
  if (kind === 'exact') return 'Khớp trực tiếp';
  if (kind === 'transfer') return 'Khớp chuyển đổi';
  if (kind === 'incorrect') return 'Không khớp với CV';
  return 'Khớp ngữ nghĩa';
}

function buildCandidateEvidenceCorpus(
  candidate: Candidate,
  jdFitDetail: DetailedScore | undefined,
  resolvedCvText: string
): string {
  const details = candidate.analysis?.['Chi tiết'] || [];
  const detailSignals = details.flatMap((detail) => [
    getDetailEvidence(detail),
    getDetailExplanation(detail),
    ...(detail.advancedBreakdown?.matched_signals || []),
    ...(detail.advancedBreakdown?.evidence_highlights || []),
    ...(detail.advancedBreakdown?.bonuses_earned || []),
  ]);

  return uniqueTextItems([
    resolvedCvText,
    candidate._cvText || '',
    ...(candidate.analysis?.['Điểm mạnh CV'] || []),
    ...detailSignals,
    jdFitDetail ? getDetailEvidence(jdFitDetail) : '',
    jdFitDetail ? getDetailExplanation(jdFitDetail) : '',
  ]).join('\n');
}

function buildSkillSignalEvidence(skill: string, insight: NonNullable<Candidate['jdCvMatchInsights']>): string {
  const normalizedSkill = normalizeAscii(skill);
  const directSkill = insight.matchedSkills.find((item) => {
    const normalizedItem = normalizeAscii(item);
    return normalizedItem === normalizedSkill || normalizedItem.includes(normalizedSkill) || normalizedSkill.includes(normalizedItem);
  });

  if (directSkill) {
    return `Dữ liệu CV đã trích xuất ghi nhận kỹ năng liên quan: ${directSkill}.`;
  }

  const transferSkill = insight.transferMatches.find((item) => normalizeAscii(item).includes(normalizedSkill));
  if (transferSkill) {
    return `Dữ liệu CV đã trích xuất có tín hiệu kỹ năng tương đương: ${transferSkill}.`;
  }

  return '';
}

function buildIncorrectCvStatement(requirement: string): string {
  return `CV hiện không thể hiện kỹ năng hoặc kinh nghiệm "${requirement}" trong phần nội dung đã trích xuất.`;
}

function buildJdCvEvidenceRows(
  candidate: Candidate,
  jdText: string,
  jdFitDetail: DetailedScore | undefined,
  resolvedCvText: string
): JdCvEvidenceRow[] {
  const insight = candidate.jdCvMatchInsights;
  if (!insight) return [];

  const combinedCvEvidence = buildCandidateEvidenceCorpus(candidate, jdFitDetail, resolvedCvText);
  const hasRoleProfile = Boolean(insight.roleKey && insight.roleKey !== 'generic');
  const rows: JdCvEvidenceRow[] = [];
  const seen = new Set<string>();

  const pushRow = (input: Omit<JdCvEvidenceRow, 'id'>) => {
    const requirement = compactEvidenceText(input.requirement, 120);
    if (!requirement) return;
    const key = `${normalizeAscii(requirement)}::${input.matchKind}`;
    if (seen.has(key)) return;
    seen.add(key);

    rows.push({
      ...input,
      id: key || `${rows.length}`,
      requirement,
      jdEvidence: compactEvidenceText(input.jdEvidence || `JD có yêu cầu liên quan đến "${requirement}".`),
      cvEvidence: compactEvidenceText(
        input.cvEvidence ||
        (input.matchKind === 'incorrect'
          ? buildIncorrectCvStatement(requirement)
          : buildSkillSignalEvidence(requirement, insight) || `CV có tín hiệu phù hợp với yêu cầu "${requirement}" theo kết quả so khớp ngữ nghĩa.`)
      ),
      confidence: Math.max(0, Math.min(100, Math.round(input.confidence))),
    });
  };

  insight.evidenceMatches?.forEach((item) => {
    const requirement = item.requirement || item.jdEvidence || item.cvEvidence;
    const matchKind = normalizeMatchKind(item.matchType, 'semantic');
    pushRow({
      section: item.section,
      requirement,
      jdEvidence: item.jdEvidence || findBestEvidenceSentence(jdText, requirement),
      cvEvidence: item.cvEvidence || findBestEvidenceSentence(combinedCvEvidence, requirement) || buildSkillSignalEvidence(requirement, insight),
      matchKind,
      confidence: item.score !== undefined ? Number(item.score) * (Number(item.score) <= 1 ? 100 : 1) : semanticMatchPercentFromInsight(insight),
      reason: item.reason || 'Backend đã trả về cặp dẫn chứng JD/CV cho yêu cầu này.',
    });
  });

  const keywordRows = jdFitDetail?.advancedBreakdown?.keyword_metrics?.keywords_list || [];
  keywordRows
    .filter((keyword) => keyword.status === 'matched')
    .forEach((keyword) => {
      pushRow({
        requirement: keyword.keyword,
        jdEvidence: findBestEvidenceSentence(jdText, keyword.keyword),
        cvEvidence: keyword.context_sentence || findBestEvidenceSentence(combinedCvEvidence, keyword.keyword) || buildSkillSignalEvidence(keyword.keyword, insight),
        matchKind: 'exact',
        confidence: 92,
        reason: 'Từ khóa yêu cầu xuất hiện trong JD và có câu dẫn chứng tương ứng trong CV.',
      });
    });

  insight.matchedSkills.forEach((skill) => {
    const jdEvidence = findBestEvidenceSentence(jdText, skill);
    const cvEvidence = findBestEvidenceSentence(combinedCvEvidence, skill);

    pushRow({
      requirement: skill,
      jdEvidence,
      cvEvidence: cvEvidence || buildSkillSignalEvidence(skill, insight),
      matchKind: jdEvidence && cvEvidence ? 'exact' : 'semantic',
      confidence: jdEvidence && cvEvidence ? 88 : semanticMatchPercentFromInsight(insight),
      reason: jdEvidence && cvEvidence
        ? 'Kỹ năng/công nghệ này được nhận diện là khớp trực tiếp giữa yêu cầu tuyển dụng và hồ sơ.'
        : 'Embedding và danh sách kỹ năng CV cho thấy nội dung hồ sơ cùng ngữ cảnh với yêu cầu này.',
    });
  });

  if (!hasRoleProfile) {
    const jobFitRequirement = extractJDRequirements(jdText).find((item) => item.display === BASIC_CRITERIA[0]);
    const semanticComparison = compareEvidence(
      BASIC_CRITERIA[0],
      uniqueTextItems([...(jobFitRequirement?.keywords || []), ...insight.matchedSkills]).slice(0, 14),
      combinedCvEvidence
    );
    semanticComparison.semanticMatched.forEach((item) => {
      pushRow({
        requirement: item.keyword,
        jdEvidence: findBestEvidenceSentence(jdText, item.keyword),
        cvEvidence: item.evidence,
        matchKind: 'semantic',
        confidence: item.score * 100,
        reason: item.reason,
      });
    });
  }

  insight.transferMatches.forEach((match) => {
    const terms = buildEvidenceSearchTerms(match);
    pushRow({
      requirement: match,
      jdEvidence: findBestEvidenceSentence(jdText, match, terms),
      cvEvidence: findBestEvidenceSentence(combinedCvEvidence, match, terms) || buildSkillSignalEvidence(match, insight),
      matchKind: 'transfer',
      confidence: 78,
      reason: 'Hai cách diễn đạt không trùng chữ hoàn toàn nhưng có quan hệ kỹ năng/ngữ cảnh tương đương.',
    });
  });

  if (rows.length > 0 && rows.length < 6) {
    const missingItems = hasRoleProfile
      ? (insight.missingRequirements || insight.missingSkills)
      : insight.missingSkills;
    missingItems.slice(0, 6 - rows.length).forEach((skill) => {
      pushRow({
        requirement: skill,
        jdEvidence: findBestEvidenceSentence(jdText, skill),
        cvEvidence: buildIncorrectCvStatement(skill),
        matchKind: 'incorrect',
        confidence: 0,
        reason: 'Sai vì yêu cầu này có trong JD nhưng nội dung CV đã trích xuất không thể hiện kỹ năng tương ứng.',
      });
    });
  }

  if (!rows.length && !hasRoleProfile) {
    const overallConfidence = semanticMatchPercentFromInsight(insight);
    const isOverallMatch = overallConfidence >= 60;
    pushRow({
      requirement: 'Mức phù hợp tổng thể JD/CV',
      jdEvidence: findBestEvidenceSentence(jdText, 'job requirement jd'),
      cvEvidence: findBestEvidenceSentence(combinedCvEvidence, 'candidate cv experience skills') || (isOverallMatch ? buildSkillSignalEvidence('job fit', insight) : buildIncorrectCvStatement('mức phù hợp tổng thể JD/CV')),
      matchKind: isOverallMatch ? 'semantic' : 'incorrect',
      confidence: overallConfidence,
      reason: isOverallMatch
        ? 'Đúng ở mức tổng thể vì embedding đo được độ tương đồng ngữ nghĩa cao giữa mô tả công việc và nội dung hồ sơ.'
        : 'Sai ở mức tổng thể vì độ tương đồng ngữ nghĩa giữa JD và CV còn thấp.',
    });
  }

  return rows
    .sort((left, right) => {
      const leftIncorrect = left.matchKind === 'incorrect' ? 1 : 0;
      const rightIncorrect = right.matchKind === 'incorrect' ? 1 : 0;
      if (leftIncorrect !== rightIncorrect) return leftIncorrect - rightIncorrect;
      return right.confidence - left.confidence;
    })
    .slice(0, 6);
}

function semanticMatchPercentFromInsight(insight: NonNullable<Candidate['jdCvMatchInsights']>): number {
  return Math.round(Math.min(100, Math.max(0, Number(insight.similarity || 0) * 100)));
}

function extractNestedCvText(value: unknown, depth: number = 0): string {
  if (depth > 5 || value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim().length > 120 ? value.trim() : '';
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractNestedCvText(item, depth + 1);
      if (nested) return nested;
    }
    return '';
  }

  if (typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;

  for (const [key, nestedValue] of Object.entries(record)) {
    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (CV_TEXT_FIELD_ALIASES.has(normalizedKey) && typeof nestedValue === 'string' && nestedValue.trim().length > 120) {
      return nestedValue.trim();
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nested = extractNestedCvText(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return '';
}

function extractStructuredExperienceText(value: unknown, depth: number = 0): string {
  if (depth > 6 || value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim().length > 24 ? value.trim() : '';
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractStructuredExperienceText(item, depth + 1);
      if (nested) return nested;
    }
    return '';
  }

  if (typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;

  for (const [key, nestedValue] of Object.entries(record)) {
    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (EXPERIENCE_TEXT_FIELD_ALIASES.has(normalizedKey)) {
      const matchedText = extractStructuredExperienceText(nestedValue, depth + 1);
      if (matchedText) {
        return matchedText;
      }
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nested = extractStructuredExperienceText(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return '';
}

function scoreUploadedFileMatch(file: UploadedFileRecord, candidate: Candidate): number {
  let score = 0;

  if (normalizeAscii(file.fileName) === normalizeAscii(candidate.fileName)) score += 6;
  if (file.candidateName && normalizeAscii(file.candidateName) === normalizeAscii(candidate.candidateName)) score += 4;
  if (file.jobPosition && candidate.jobTitle && normalizeAscii(file.jobPosition) === normalizeAscii(candidate.jobTitle)) score += 1;

  return score;
}

async function resolveCandidateCvText(candidate: Candidate): Promise<string> {
  if (candidate._cvText?.trim()) {
    return candidate._cvText.trim();
  }

  const cacheKey = `${candidate.fileName}::${candidate.candidateName}`;
  const cachedText = uploadedCvTextCache.get(cacheKey);
  if (cachedText) {
    return cachedText;
  }

  if (candidate._rawBatchJson) {
    try {
      const rawCandidate = JSON.parse(candidate._rawBatchJson) as unknown;
      const structuredExperience = extractStructuredExperienceText(rawCandidate);
      if (structuredExperience) {
        uploadedCvTextCache.set(cacheKey, structuredExperience);
        return structuredExperience;
      }
      const embeddedText = extractNestedCvText(rawCandidate);
      if (embeddedText && !looksLikeAnalysisPayload(embeddedText)) {
        uploadedCvTextCache.set(cacheKey, embeddedText);
        return embeddedText;
      }
    } catch {
      // Ignore malformed raw candidate payloads and continue with uploaded file lookup.
    }
  }

  const uploadedCvFiles = await UploadedFilesService.getUserFilesByType('cv', 200).catch(() => [] as UploadedFileRecord[]);
  const matchedFile = [...uploadedCvFiles]
    .map((file) => ({ file, score: scoreUploadedFileMatch(file, candidate) }))
    .filter((entry) => entry.score > 0 && entry.file.extractedText.trim())
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return Number(right.file.lastAccessedAt || right.file.uploadedAt || 0) - Number(left.file.lastAccessedAt || left.file.uploadedAt || 0);
    })[0]?.file;

  if (!matchedFile?.extractedText.trim()) {
    return '';
  }

  uploadedCvTextCache.set(cacheKey, matchedFile.extractedText.trim());
  return matchedFile.extractedText.trim();
}

function cleanTimelineText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[|]+/g, ' • ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*•\s*/g, ' • ')
    .replace(/^[•\-–—,:;\s]+/, '')
    .replace(/[•\-–—,:;\s]+$/, '')
    .trim();
}

function isLikelyTimelineHeading(line: string): boolean {
  const normalized = normalizeAscii(line);
  return [
    'kinh nghiem',
    'work experience',
    'experience',
    'employment history',
    'lich su lam viec',
    'qua trinh cong tac',
    'projects',
    'du an',
    'hoc van',
    'education',
    'skills',
    'ky nang',
  ].some((keyword) => normalized === keyword || normalized.startsWith(`${keyword} `));
}

function formatPeriodLabel(start: string, end: string): string {
  const normalizedEnd = /^(hiện tại|hien tai|nay|present|current)$/i.test(end.trim()) ? 'Hiện tại' : end.trim();
  return `Từ ${start.trim()} đến ${normalizedEnd}`;
}

function parseTimelineDateToken(token: string, isEnd: boolean): { year: number; month: number } | null {
  const trimmed = token.trim();
  const normalized = normalizeAscii(trimmed);

  if (/^(hien tai|present|current|nay)$/.test(normalized)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  const monthYearMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYearMatch) {
    const month = Number.parseInt(monthYearMatch[1], 10);
    const year = Number.parseInt(monthYearMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return {
      year: Number.parseInt(yearMatch[1], 10),
      month: isEnd ? 12 : 1,
    };
  }

  const monthNameMatch = normalized.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|thg\.?\s*(\d{1,2})|thang\s*(\d{1,2}))\s*\/?\s*(\d{4})$/
  );
  if (monthNameMatch) {
    const monthMap: Record<string, number> = {
      jan: 1,
      january: 1,
      feb: 2,
      february: 2,
      mar: 3,
      march: 3,
      apr: 4,
      april: 4,
      may: 5,
      jun: 6,
      june: 6,
      jul: 7,
      july: 7,
      aug: 8,
      august: 8,
      sep: 9,
      sept: 9,
      september: 9,
      oct: 10,
      october: 10,
      nov: 11,
      november: 11,
      dec: 12,
      december: 12,
    };

    const monthWord = monthNameMatch[1];
    const monthFromWord = monthMap[monthWord];
    const monthFromNumericWord = Number.parseInt(monthNameMatch[2] || monthNameMatch[3] || '', 10);
    const month = monthFromWord || monthFromNumericWord;
    const year = Number.parseInt(monthNameMatch[4], 10);

    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  return null;
}

function getTimelineDurationMonths(start: string, end: string): number | null {
  const startDate = parseTimelineDateToken(start, false);
  const endDate = parseTimelineDateToken(end, true);

  if (!startDate || !endDate) {
    return null;
  }

  const monthSpan = (endDate.year - startDate.year) * 12 + (endDate.month - startDate.month) + 1;
  return monthSpan > 0 ? monthSpan : null;
}

function formatTimelineDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} năm ${remainingMonths} tháng`;
  }

  if (years > 0) {
    return `${years} năm`;
  }

  return `${remainingMonths} tháng`;
}

function matchTimelineRange(value: string): RegExpMatchArray | null {
  return cleanTimelineText(value).match(TIMELINE_RANGE_REGEX);
}

function dedupeCareerTimelineItems(items: CareerTimelineItem[]): CareerTimelineItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const signature = `${normalizeAscii(item.periodLabel)}::${normalizeAscii(item.companyName || item.summary)}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  }).slice(0, 8);
}

function formatTimelineEvidenceLine(entry: CareerTimelineItem): string {
  const company = entry.companyName || entry.summary || 'Không rõ công ty';
  const duration = entry.durationMonths ? `, tổng thời gian khoảng ${formatTimelineDuration(entry.durationMonths)}` : '';
  return `${company}: ${entry.periodLabel}${duration}`;
}

function isGenericTimelineEvidence(value: string): boolean {
  const normalized = normalizeAscii(value);
  return (
    !matchTimelineRange(value) &&
    (
      normalized.includes('lam viec tai') ||
      normalized.includes('moi noi') ||
      normalized.includes('cong ty') ||
      normalized.includes('on dinh')
    )
  );
}

function looksLikeAnalysisPayload(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.includes('"analysis"') ||
    trimmed.includes('"softFilterWarnings"') ||
    trimmed.includes('"detectedLocation"') ||
    trimmed.includes('"Tong diem"') ||
    trimmed.includes('"Tổng điểm"')
  );
}

function guessTimelineCompany(primary: string, secondary: string): { companyName: string; detail: string } {
  const first = cleanTimelineText(primary);
  const second = cleanTimelineText(secondary);

  const inlineAtMatch = first.match(/^(.+?)\s+(?:at|tại)\s+(.+)$/i);
  if (inlineAtMatch) {
    return {
      companyName: cleanTimelineText(inlineAtMatch[2]),
      detail: cleanTimelineText(inlineAtMatch[1]),
    };
  }

  const candidates = [first, second].filter(Boolean);
  if (candidates.length === 0) {
    return { companyName: '', detail: '' };
  }

  if (candidates.length === 1) {
    return { companyName: '', detail: candidates[0] };
  }

  const companyHintRegex = /\b(company|co\.|corp|corporation|group|studio|solutions|software|bank|university|college|school|hospital|lab|labs|jsc|inc|llc|ltd|tnhh|tập đoàn|công ty|ngân hàng|trường|viện|bệnh viện)\b/i;
  const roleHintRegex = /\b(intern|developer|engineer|manager|director|lead|leader|consultant|analyst|designer|specialist|executive|architect|thực tập|nhân viên|chuyên viên|quản lý|trưởng|giám đốc|kỹ sư|lập trình viên)\b/i;

  const scoreCandidate = (value: string) => {
    const normalized = normalizeAscii(value);
    let score = 0;
    if (companyHintRegex.test(value) || companyHintRegex.test(normalized)) score += 4;
    if (!roleHintRegex.test(value) && !roleHintRegex.test(normalized)) score += 2;
    if (value.length <= 52) score += 1;
    if (!/[,:;]/.test(value)) score += 1;
    return score;
  };

  const [left, right] = candidates;
  const leftScore = scoreCandidate(left);
  const rightScore = scoreCandidate(right);

  if (leftScore === rightScore) {
    if (left.length <= right.length) {
      return { companyName: left, detail: right };
    }
    return { companyName: right, detail: left };
  }

  return leftScore > rightScore
    ? { companyName: left, detail: right }
    : { companyName: right, detail: left };
}

function extractCareerTimeline(text: string): CareerTimelineItem[] {
  const lines = text
    .split('\n')
    .map((line) => cleanTimelineText(line))
    .filter(Boolean);

  const rangeRegex = new RegExp(
    `(${TIMELINE_DATE_TOKEN})\\s*(?:-|–|—|to|đến|tới)\\s*(${TIMELINE_DATE_TOKEN}|hiện tại|hien tai|nay|present|current)`,
    'i'
  );
  const items: CareerTimelineItem[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    if (currentLine.length > 260 || looksLikeAnalysisPayload(currentLine)) {
      continue;
    }

    const dateMatch = currentLine.match(rangeRegex);
    if (!dateMatch) {
      continue;
    }

    const previousLine = lines[index - 1] || '';
    const nextLine = lines[index + 1] || '';
    const nextNextLine = lines[index + 2] || '';
    const strippedCurrent = cleanTimelineText(currentLine.replace(dateMatch[0], ''));

    let summary = strippedCurrent;
    let secondary = '';

    if (!summary || summary.length < 4) {
      if (nextLine && !rangeRegex.test(nextLine) && !isLikelyTimelineHeading(nextLine)) {
        summary = nextLine;
        if (nextNextLine && !rangeRegex.test(nextNextLine) && !isLikelyTimelineHeading(nextNextLine)) {
          secondary = nextNextLine;
        }
      } else if (previousLine && !rangeRegex.test(previousLine) && !isLikelyTimelineHeading(previousLine)) {
        summary = previousLine;
      }
    } else if (nextLine && !rangeRegex.test(nextLine) && !isLikelyTimelineHeading(nextLine)) {
      secondary = nextLine;
    }

    if (summary.length > 180 || looksLikeAnalysisPayload(summary)) {
      summary = '';
    }
    if (secondary.length > 180 || looksLikeAnalysisPayload(secondary)) {
      secondary = '';
    }

    const { companyName, detail } = guessTimelineCompany(summary, secondary);
    const combinedSummary = [detail]
      .map((item) => cleanTimelineText(item))
      .filter(Boolean)
      .join(' • ');

    if (!combinedSummary && !companyName) {
      continue;
    }

    items.push({
      id: `${dateMatch[1]}-${dateMatch[2]}-${index}`,
      periodLabel: formatPeriodLabel(dateMatch[1], dateMatch[2]),
      summary: combinedSummary || companyName,
      companyName,
      isCurrent: /^(hiện tại|hien tai|nay|present|current)$/i.test(dateMatch[2].trim()),
      durationMonths: getTimelineDurationMonths(dateMatch[1], dateMatch[2]),
    });
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const signature = `${normalizeAscii(item.periodLabel)}::${normalizeAscii(item.summary)}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  }).slice(0, 8);
}

function collectStringLeaves(value: unknown, depth: number = 0, output: string[] = []): string[] {
  if (depth > 6 || value === null || value === undefined) {
    return output;
  }

  if (typeof value === 'string') {
    const cleaned = cleanTimelineText(value);
    if (cleaned.length >= 4) {
      output.push(cleaned);
    }
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStringLeaves(item, depth + 1, output));
    return output;
  }

  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStringLeaves(item, depth + 1, output));
  }

  return output;
}

function buildTimelineItemFromParts(
  companyName: string,
  summary: string,
  start: string,
  end: string,
  index: number
): CareerTimelineItem | null {
  const cleanedStart = cleanTimelineText(start);
  const cleanedEnd = cleanTimelineText(end);
  const company = cleanTimelineText(companyName);
  const detail = cleanTimelineText(summary);

  if (!company && !detail) {
    return null;
  }

  if (!parseTimelineDateToken(cleanedStart, false) || !parseTimelineDateToken(cleanedEnd, true)) {
    return null;
  }

  return {
    id: `${cleanedStart}-${cleanedEnd}-structured-${index}`,
    periodLabel: formatPeriodLabel(cleanedStart, cleanedEnd),
    summary: detail || company,
    companyName: company,
    isCurrent: /^(hiện tại|hien tai|nay|present|current)$/i.test(cleanedEnd),
    durationMonths: getTimelineDurationMonths(cleanedStart, cleanedEnd),
  };
}

function extractCareerTimelineFromStructuredValue(value: unknown, depth: number = 0): CareerTimelineItem[] {
  if (depth > 7 || value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    return extractCareerTimeline(value);
  }

  if (Array.isArray(value)) {
    return dedupeCareerTimelineItems(value.flatMap((item) => extractCareerTimelineFromStructuredValue(item, depth + 1)));
  }

  if (typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const company = getRecordValueByAliases(record, [
    'company',
    'company name',
    'employer',
    'organization',
    'organisation',
    'cong ty',
    'ten cong ty',
    'don vi',
    'noi lam viec',
  ]);
  const role = getRecordValueByAliases(record, [
    'title',
    'role',
    'position',
    'job title',
    'chuc danh',
    'vi tri',
    'vi tri cong viec',
  ]);
  const start = getRecordValueByAliases(record, ['start', 'start date', 'from', 'tu', 'bat dau']);
  const end = getRecordValueByAliases(record, ['end', 'end date', 'to', 'den', 'ket thuc']) || 'Hiện tại';
  const period = getRecordValueByAliases(record, ['period', 'duration', 'time', 'timeline', 'thoi gian', 'khoang thoi gian']);
  const ownItems: CareerTimelineItem[] = [];

  if ((company || role) && start) {
    const item = buildTimelineItemFromParts(company, role, start, end, ownItems.length);
    if (item) ownItems.push(item);
  }

  if ((company || role) && period) {
    const range = matchTimelineRange(period);
    if (range) {
      const item = buildTimelineItemFromParts(company, role, range[1], range[2], ownItems.length);
      if (item) ownItems.push(item);
    }
  }

  const nestedItems = Object.values(record).flatMap((item) => extractCareerTimelineFromStructuredValue(item, depth + 1));
  return dedupeCareerTimelineItems([...ownItems, ...nestedItems]);
}

function extractCareerTimelineFromCandidatePayload(candidate: Candidate): CareerTimelineItem[] {
  const items: CareerTimelineItem[] = [];

  if (candidate._rawBatchJson) {
    try {
      const rawCandidate = JSON.parse(candidate._rawBatchJson) as unknown;
      items.push(...extractCareerTimelineFromStructuredValue(rawCandidate));
      collectStringLeaves(rawCandidate)
        .filter((line) => !looksLikeAnalysisPayload(line))
        .forEach((line) => items.push(...extractCareerTimeline(line)));
    } catch {
      // Ignore malformed raw payloads.
    }
  }

  return dedupeCareerTimelineItems(items);
}

function isGenericEducationValidation(value: string): boolean {
  const normalized = normalizeAscii(value).replace(/\s+/g, ' ').trim();
  return ['hop le', 'valid', 'khong hop le', 'invalid', 'phu hop'].includes(normalized.replace(/[.。]+$/, ''));
}

function getEducationInstitutionFromLine(line: string): string {
  const cleaned = cleanTimelineText(line)
    .replace(/^(education|hoc van|học vấn|truong|trường|co so dao tao|cơ sở đào tạo)\s*[::-]\s*/i, '')
    .trim();
  const [beforeDash] = cleaned.split(/\s[-–—|]\s/);
  return cleanTimelineText(beforeDash || cleaned);
}

function extractEducationSummaryFromText(text: string): EducationSummary | null {
  const lines = text
    .split(/\n|•|;|,/)
    .map((line) => cleanTimelineText(line))
    .filter((line) => line && line.length <= 180 && !isGenericEducationValidation(line));

  const institutionLine = lines.find((line) => {
    const normalized = normalizeAscii(line);
    return (
      normalized.includes('dai hoc') ||
      normalized.includes('truong') ||
      normalized.includes('hoc vien') ||
      normalized.includes('cao dang') ||
      normalized.includes('university') ||
      normalized.includes('college') ||
      normalized.includes('academy') ||
      normalized.includes('institute') ||
      normalized.includes('hutech') ||
      normalized.includes('fpt') ||
      normalized.includes('bach khoa')
    );
  }) || '';

  const source = institutionLine || lines[0] || '';
  if (!source) {
    return null;
  }

  const majorMatch = text.match(/(?:chuyên ngành|chuyen nganh|ngành|nganh|major|faculty)\s*[::-]\s*([^.;\n]+)/i);
  const degreeMatch = text.match(/\b(cử nhân|cu nhan|kỹ sư|ky su|thạc sĩ|thac si|tiến sĩ|tien si|bachelor|master|engineer|bsc|msc)\b/i);
  const dashParts = source.split(/\s[-–—|]\s/).map((part) => cleanTimelineText(part)).filter(Boolean);

  return {
    institution: getEducationInstitutionFromLine(source),
    major: cleanTimelineText(majorMatch?.[1] || (dashParts.length > 1 ? dashParts.slice(1).join(' - ') : '')),
    degree: cleanTimelineText(degreeMatch?.[1] || ''),
    rawLine: source,
  };
}

function buildEducationSummary(
  candidate: Candidate,
  educationDetail?: DetailedScore,
  cvText?: string
): EducationSummary | null {
  const validation = candidate.analysis?.educationValidation;
  const sources: string[] = [
    validation?.standardizedEducation || '',
    ...(validation?.warnings || []),
    educationDetail ? getDetailEvidence(educationDetail) : '',
    educationDetail ? getDetailExplanation(educationDetail) : '',
    candidate._cvText || '',
    cvText || '',
  ].filter(Boolean);

  if (candidate._rawBatchJson) {
    try {
      sources.push(...collectStringLeaves(JSON.parse(candidate._rawBatchJson)));
    } catch {
      // Ignore malformed raw payloads.
    }
  }

  for (const source of sources) {
    if (!source || looksLikeAnalysisPayload(source)) continue;
    const summary = extractEducationSummaryFromText(source);
    if (summary?.institution && !isGenericEducationValidation(summary.institution)) {
      return summary;
    }
  }

  return null;
}

function formatScoreValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function parseNumericValue(value: string): number | null {
  const match = value.match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDetailScore(
  scoreText: string,
  detailFormula: string,
): {
  score: number | null;
  maxScore: number | null;
  rawScore: number | null;
  rawMax: number | null;
  weight: number;
  achievedPct: number;
  contributionPct: number;
  hasScore: boolean;
  scoreLabel: string;
} {
  const trimmedScore = scoreText.trim();
  const ratioMatch = trimmedScore.match(/([+-]?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);

  let rawScore: number | null = null;
  let rawMax: number | null = null;

  if (ratioMatch) {
    rawScore = Number.parseFloat(ratioMatch[1]);
    rawMax = Number.parseFloat(ratioMatch[2]);
  } else {
    rawScore = parseNumericValue(trimmedScore);
  }

  const hasScore = rawScore !== null;
  const displayScore = rawScore;
  const displayMax = rawMax;

  const achievedPct = rawScore !== null && rawMax && rawMax > 0
    ? Math.round((rawScore / rawMax) * 100)
    : displayScore !== null && displayMax && displayMax > 0
      ? Math.round((displayScore / displayMax) * 100)
      : 0;

  const weightMatch = detailFormula.match(/trong so\s*([\d.]+)%/i);
  const weight = Number.parseFloat(weightMatch?.[1] || '0');

  let scoreLabel = 'Chưa có';
  if (displayScore !== null && displayMax !== null) {
    scoreLabel = `${formatScoreValue(displayScore)}/${formatScoreValue(displayMax)}`;
  } else if (displayScore !== null && trimmedScore) {
    scoreLabel = trimmedScore;
  }

  return {
    score: displayScore,
    maxScore: displayMax,
    rawScore,
    rawMax,
    weight: Number.isFinite(weight) ? weight : 0,
    achievedPct,
    contributionPct: achievedPct,
    hasScore,
    scoreLabel,
  };
}

type ParsedDetailScore = ReturnType<typeof parseDetailScore>;

function normalizeParsedScoreToMax(parsed: ParsedDetailScore, targetMax: number): ParsedDetailScore {
  if (!parsed.hasScore || parsed.score === null) {
    return parsed;
  }

  const sourceMax = parsed.maxScore && parsed.maxScore > 0 ? parsed.maxScore : targetMax;
  const normalizedScore = Math.min(targetMax, Math.max(0, (parsed.score / sourceMax) * targetMax));
  const achievedPct = Math.round((normalizedScore / targetMax) * 100);

  return {
    ...parsed,
    score: normalizedScore,
    maxScore: targetMax,
    achievedPct,
    contributionPct: achievedPct,
    scoreLabel: `${formatScoreValue(normalizedScore)}/${formatScoreValue(targetMax)}`,
  };
}

function canonicalizeCriterionName(rawName: string): string {
  const value = rawName.trim();
  const normalized = normalizeAscii(value);

  if (normalized === 'phu hop jd' || normalized === 'phu hop jd job fit' || normalized === 'job fit') return BASIC_CRITERIA[0];
  if (normalized === 'kinh nghiem') return BASIC_CRITERIA[1];
  if (normalized === 'ky nang') return BASIC_CRITERIA[2];
  if (normalized === 'thanh tuu kpi' || normalized === 'thanh tuu') return BASIC_CRITERIA[3];
  if (normalized === 'hoc van') return BASIC_CRITERIA[4];
  if (normalized === 'ngon ngu') return BASIC_CRITERIA[5];
  if (normalized === 'chuyen nghiep') return BASIC_CRITERIA[6];
  if (normalized.includes('gan bo') || normalized.includes('lich su cv')) return BASIC_CRITERIA[7];
  if (normalized === 'phu hop van hoa' || normalized === 'culture fit') return BASIC_CRITERIA[8];
  if (normalized.includes('uy tin cong ty') || normalized.includes('company tier')) return BASIC_CRITERIA[9];
  if (normalized.includes('muc do trung thanh') || normalized.includes('su on dinh') || normalized.includes('trung thanh')) return REMOVED_CRITERIA[0];
  if (normalized.includes('ky nang hanh dong') || normalized.includes('chu dong')) return REMOVED_CRITERIA[1];
  if (normalized.includes('trinh bay star') || normalized.includes('star ket qua')) return REMOVED_CRITERIA[2];
  if (normalized.includes('skill graph') || normalized.includes('ky nang chuyen doi')) return REMOVED_CRITERIA[3];
  if (normalized.includes('career velocity') || normalized.includes('tiem nang phat trien')) return REMOVED_CRITERIA[4];

  return value;
}

function getConfiguredCriterionMaxScore(criterion: WeightCriteria[string]): number {
  if (!criterion) return 0;

  if (criterion.children && criterion.children.length > 0) {
    return criterion.children.reduce((sum, child) => sum + (child.weight || 0), 0);
  }

  return criterion.weight || 0;
}

function buildConfiguredCoreCriteria(weights?: WeightCriteria): { criteria: string[]; totalMax: number } {
  if (!weights || Object.keys(weights).length === 0) {
    return {
      criteria: DEFAULT_CORE_CRITERIA,
      totalMax: FALLBACK_CORE_TOTAL_MAX,
    };
  }

  const criteria: string[] = [];
  let totalMax = 0;

  Object.values(weights).forEach((criterion) => {
    if (!criterion?.name) return;

    const canonical = canonicalizeCriterionName(String(criterion.name).trim()) || String(criterion.name).trim();
    if (!canonical || REMOVED_CRITERIA.includes(canonical)) return;

    if (!criteria.includes(canonical)) {
      criteria.push(canonical);
    }

    totalMax += getConfiguredCriterionMaxScore(criterion);
  });

  return {
    criteria: criteria.length > 0 ? criteria : DEFAULT_CORE_CRITERIA,
    totalMax: totalMax > 0 ? totalMax : FALLBACK_CORE_TOTAL_MAX,
  };
}

function highlightKeywordsInText(text: string, keywords: string[]): React.ReactNode {
  if (!text || !keywords.length) return text;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    keywords.some(k => k.toLowerCase() === part.toLowerCase())
      ? <mark key={i} className="rounded bg-emerald-900/50 px-0.5 text-emerald-200 not-italic font-medium">{part}</mark>
      : part
  );
}

interface CriterionAccordionProps {
  item: DetailedScore;
  isExpanded: boolean;
  onToggle: () => void;
  jdText: string;
  detailed?: boolean;
}

const CriterionAccordion: React.FC<CriterionAccordionProps> = ({ item, isExpanded, onToggle, jdText, detailed = false }) => {
  const tc = useThemeColors();
  const [copied, setCopied] = React.useState(false);
  const criterionName = canonicalizeCriterionName(getDetailCriterion(item));
  const detailScore = getDetailScore(item);
  const detailFormula = getDetailFormula(item);
  const detailEvidence = getDetailEvidence(item);
  const detailExplanation = getDetailExplanation(item);
  const shouldShowRawEvidence = Boolean(
    detailEvidence &&
    detailEvidence !== MISSING_DETAIL_EVIDENCE &&
    normalizeAscii(detailEvidence) !== 'khong tim thay thong tin trong cv' &&
    !looksLikeAnalysisPayload(detailEvidence)
  );
  const copyEvidenceText = detailEvidence;
  const canShowRawEvidence = shouldShowRawEvidence;

  const parsedData = useMemo(() => {
    return parseDetailScore(detailScore, detailFormula);
  }, [detailFormula, detailScore]);
  const advancedBreakdown = item.advancedBreakdown;
  const keywordMetrics = advancedBreakdown?.keyword_metrics;
  const hrFriendlyExplanation = useMemo(
    () => buildHrFriendlyDetailComment(criterionName, detailExplanation, parsedData, keywordMetrics),
    [criterionName, detailExplanation, keywordMetrics, parsedData]
  );
  const matchedKeywordRows = keywordMetrics?.keywords_list?.filter((keyword) => keyword.status === 'matched') || [];
  const missingKeywordRows = keywordMetrics?.keywords_list?.filter((keyword) => keyword.status === 'missing') || [];
  const matchedKeywordNames = matchedKeywordRows.map((keyword) => keyword.keyword);
  const highlightedEvidenceHtml = useMemo(
    () => buildHighlightedEvidenceHtml(detailEvidence, matchedKeywordNames),
    [detailEvidence, matchedKeywordNames.join('|')]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(copyEvidenceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = CARD_CRITERIA_META[criterionName] || { Icon: CircleHelp, color: 'text-slate-400', accent: 'border-slate-700 bg-slate-900/20' };
  const MetaIcon = meta.Icon;
  const hasRealEvidence = canShowRawEvidence;

  const scorePercentage = parsedData.achievedPct;
  const scoreBadgeClass = !parsedData.hasScore
    ? 'bg-slate-800/60 text-slate-400 border-slate-700/80'
    : scorePercentage >= 85
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
      : scorePercentage >= 65
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
        : 'bg-red-500/15 text-red-300 border-red-500/35';

  const proficiency = !parsedData.hasScore ? 'Chưa có'
    : scorePercentage >= 90 ? 'Xuất sắc'
      : scorePercentage >= 75 ? 'Nâng cao'
        : scorePercentage >= 55 ? 'Trung bình'
          : 'Cơ bản';

  const isExperience = criterionName === BASIC_CRITERIA[1];
  const jdRequirements = useMemo(() => extractJDRequirements(jdText), [jdText]);
  const thisRequirement = useMemo(() => jdRequirements.find(r => r.display === criterionName), [criterionName, jdRequirements]);
  const backendRequirementComparison = useMemo(() => {
    if (!keywordMetrics || keywordMetrics.total_required_keywords <= 0) return null;
    return {
      jdKeywords: keywordMetrics.keywords_list.map((row) => row.keyword),
      matched: matchedKeywordRows.map((row) => row.keyword),
      semanticMatched: [],
      missing: missingKeywordRows.map((row) => row.keyword),
    };
  }, [keywordMetrics, matchedKeywordRows, missingKeywordRows]);
  const requirementComparison = useMemo(() => {
    if (isExperience || !hasRealEvidence) return null;
    if (backendRequirementComparison) return backendRequirementComparison;
    if (!thisRequirement || thisRequirement.keywords.length === 0) return null;
    return compareEvidence(criterionName, thisRequirement.keywords, detailEvidence);
  }, [backendRequirementComparison, criterionName, detailEvidence, hasRealEvidence, isExperience, thisRequirement]);

  let matchMeta: ReturnType<typeof analyzeExperience> | null = null;
  if (isExperience && hasRealEvidence) {
    matchMeta = analyzeExperience(jdText, detailEvidence || '');
  }

  const progressColor = parsedData.achievedPct >= 80 ? 'bg-emerald-500' : parsedData.achievedPct >= 60 ? 'bg-amber-400' : 'bg-red-500';
  const progressTextColor = parsedData.achievedPct >= 80 ? 'text-emerald-400' : parsedData.achievedPct >= 60 ? 'text-amber-400' : 'text-red-400';

  const formulaText = advancedBreakdown?.mathematical_formula || detailFormula || null;
  const allMatchedKw = matchedKeywordRows.map(k => k.keyword);
  const allMissingKw = missingKeywordRows.map(k => k.keyword);
  const isSoftCriterion = /văn hoá|văn hóa|chuyên nghiệp|gắn bó|thái độ|tinh thần|ngoại giao/i.test(criterionName);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/35 bg-zinc-950/55 transition-colors duration-150 hover:border-zinc-700/45">
      {/* ── Header row ─────────────────────────────────────── */}
      <button
        className="flex min-h-[50px] w-full items-center gap-3 px-4 py-3 text-left"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800/55 ${meta.color}`}>
          <MetaIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold text-zinc-200">{criterionName}</span>
        {detailed && keywordMetrics && keywordMetrics.total_required_keywords > 0 && (
          <span className="shrink-0 rounded-full border border-zinc-700/35 bg-zinc-900/65 px-2.5 py-0.5 text-[10px] font-mono text-zinc-400">
            {keywordMetrics.matched_keywords_count}/{keywordMetrics.total_required_keywords} KW
          </span>
        )}
        <span className="hidden sm:inline text-[10px] font-medium text-zinc-600">{proficiency}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold font-mono ${scoreBadgeClass}`}>
          {parsedData.scoreLabel}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="divide-y divide-zinc-800/40 border-t border-zinc-800/50">

          {/* ── Formula box (detailed mode) ───────────────────── */}
          {detailed && formulaText && (
            <div className="px-4 py-3">
              <span className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.13em] text-cyan-500/80">Công thức tính điểm</span>
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2.5 font-mono text-[11.5px] leading-[1.6] text-cyan-200/90">
                {formulaText}
              </div>
            </div>
          )}

          {/* ── Evidence ─────────────────────────────────────── */}
          <div className="px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-zinc-500">Dẫn chứng CV</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="flex items-center gap-1 text-[9.5px] font-medium text-zinc-600 transition-colors hover:text-cyan-400"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Đã chép' : 'Chép'}
              </button>
            </div>
            {canShowRawEvidence ? (
              detailed ? (
                <blockquote className="border-l-2 border-cyan-500/50 pl-3 text-[11.5px] italic leading-[1.7] text-zinc-300">
                  {highlightKeywordsInText(detailEvidence, allMatchedKw)}
                </blockquote>
              ) : (
                <blockquote
                  className="border-l-2 border-cyan-500/50 pl-3 text-[11.5px] italic leading-[1.7] text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: highlightedEvidenceHtml }}
                />
              )
            ) : (
              <span className="inline-flex rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                Chưa tìm thấy trong CV
              </span>
            )}
          </div>

          {/* ── Score strip ──────────────────────────────────── */}
          {parsedData.hasScore && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[16px] font-black font-mono leading-none text-cyan-300">
                  {parsedData.score !== null ? formatScoreValue(parsedData.score) : '—'}
                </span>
                {parsedData.maxScore !== null && (
                  <span className="text-[11px] font-mono text-zinc-500">/{formatScoreValue(parsedData.maxScore)}</span>
                )}
              </div>
              <div className="flex flex-1 items-center gap-2 min-w-[60px]">
                <div className="h-1 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(100, parsedData.achievedPct)}%` }} />
                </div>
                <span className={`text-[11px] font-bold font-mono ${progressTextColor}`}>{parsedData.achievedPct}%</span>
              </div>
              {parsedData.weight > 0 && (
                <span className="text-[10px] text-zinc-600">trọng số {parsedData.weight}%</span>
              )}
              {keywordMetrics && (
                <span className="text-[10px] font-mono text-zinc-600">KW {keywordMetrics.match_percentage.toFixed(0)}%</span>
              )}
            </div>
          )}

          {/* ── HR Commentary ────────────────────────────────── */}
          {detailExplanation && detailExplanation !== '...' && (
            <div className="px-4 py-3">
              <span className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.13em] text-zinc-500">Nhận xét HR</span>
              <p className="text-[11.5px] leading-[1.65] text-zinc-300">
                {normalizeVietnameseDisplay(hrFriendlyExplanation)}
              </p>
            </div>
          )}

          {/* ── Experience JD match ──────────────────────────── */}
          {isExperience && matchMeta && matchMeta.matchPercent !== 'N/A' && (
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-zinc-500">Phù hợp JD</span>
                <span className="font-mono text-[11px] font-bold text-cyan-400">{matchMeta.matchPercent}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  style={{ width: `${typeof matchMeta.matchPercent === 'number' ? Math.min(100, matchMeta.matchPercent) : 0}%` }}
                />
              </div>
              {(matchMeta.matched.length > 0 || matchMeta.missing.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {matchMeta.matched.slice(0, 5).map(k => (
                    <span key={k} className="rounded-full border border-emerald-500/25 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300">{k}</span>
                  ))}
                  {matchMeta.missing.slice(0, 5).map(k => (
                    <span key={k} className="rounded-full border border-zinc-700/40 bg-zinc-800/40 px-2 py-0.5 text-[10px] text-zinc-500 line-through">{k}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Đối chiếu JD ↔ CV ────────────────────────────── */}
          {(allMatchedKw.length > 0 || allMissingKw.length > 0 || (!isExperience && requirementComparison)) && (
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-zinc-500">Đối chiếu JD ↔ CV</span>
                {detailed && (
                  <span className={`text-[9px] rounded-full px-2 py-0.5 ${
                    isSoftCriterion
                      ? 'bg-violet-950/40 text-violet-400 border border-violet-800/30'
                      : 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30'
                  }`}>
                    {isSoftCriterion
                      ? 'Tiêu chí mềm — 2–3 tín hiệu là đủ'
                      : `${allMatchedKw.length}/${allMatchedKw.length + allMissingKw.length} từ khóa`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allMatchedKw.slice(0, 10).map(kw => (
                  <span key={`mk-${kw}`} className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300">✓ {normalizeVietnameseDisplay(kw)}</span>
                ))}
                {allMissingKw.slice(0, 10).map(kw => (
                  <span key={`xk-${kw}`} className="rounded-full border border-red-900/40 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-400 line-through">{normalizeVietnameseDisplay(kw)}</span>
                ))}
                {!allMatchedKw.length && !allMissingKw.length && requirementComparison && (
                  <>
                    {requirementComparison.matched.slice(0, 6).map(k => (
                      <span key={k} className="rounded-full border border-emerald-500/25 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300">✓ {k}</span>
                    ))}
                    {requirementComparison.semanticMatched.slice(0, 3).map(item => (
                      <span key={item.keyword} className="rounded-full border border-cyan-500/25 bg-cyan-950/40 px-2 py-0.5 text-[10px] text-cyan-300">
                        {normalizeVietnameseDisplay(item.keyword)} ~{Math.round(item.score * 100)}%
                      </span>
                    ))}
                    {requirementComparison.missing.slice(0, 5).map(k => (
                      <span key={k} className="rounded-full border border-red-900/40 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-400 line-through">{k}</span>
                    ))}
                  </>
                )}
              </div>
              {(allMatchedKw.length + allMissingKw.length) > 0 && (
                <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${
                      allMatchedKw.length / (allMatchedKw.length + allMissingKw.length) >= 0.75
                        ? 'bg-emerald-500'
                        : allMatchedKw.length / (allMatchedKw.length + allMissingKw.length) >= 0.5
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.round(allMatchedKw.length / (allMatchedKw.length + allMissingKw.length) * 100)}%` }}
                  />
                </div>
              )}
              {detailed && advancedBreakdown?.evidence_highlights
                ?.filter(h => h && !h.startsWith('Không tìm thấy'))
                .slice(0, 2)
                .map((h, i) => (
                  <p key={i} className="border-l-2 border-zinc-700/50 pl-3 text-[11px] italic leading-[1.65] text-zinc-300">
                    {highlightKeywordsInText(h, allMatchedKw)}
                  </p>
                ))
              }
            </div>
          )}

          {/* ── Điểm trừ/cộng ───────────────────────────────── */}
          {detailed && advancedBreakdown && (advancedBreakdown.deductions.length > 0 || advancedBreakdown.bonuses_earned.length > 0) ? (
            <div className="px-4 py-3 space-y-3">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.13em] text-zinc-500">Lí giải tính điểm</span>
              {advancedBreakdown.deductions.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-400/70">Trừ điểm</span>
                    <span className="font-mono text-[10px] font-bold text-rose-300">
                      -{advancedBreakdown.deductions.reduce((s, d) => s + Number(d.points_lost || 0), 0)}đ
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {advancedBreakdown.deductions.map((d, i) => (
                      <li key={`ded-${i}`} className="flex items-start justify-between gap-3 rounded bg-rose-950/20 px-2.5 py-1.5 text-[11px] text-rose-200/75">
                        <span className="leading-5">{normalizeVietnameseDisplay(d.reason)}</span>
                        <span className="shrink-0 font-mono font-bold text-rose-300">-{d.points_lost}đ</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {advancedBreakdown.bonuses_earned.length > 0 && (
                <div>
                  <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">Điểm cộng</span>
                  <ul className="space-y-1">
                    {advancedBreakdown.bonuses_earned.map((b, i) => (
                      <li key={`bon-${i}`} className="flex items-start gap-2 rounded bg-emerald-950/20 px-2.5 py-1.5 text-[11px] text-emerald-200/75">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Deductions (non-detailed) ─────────────────── */}
              {advancedBreakdown && advancedBreakdown.deductions.length > 0 && (
                <div className="px-4 py-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-rose-400/80">Lý do trừ điểm</span>
                    <span className="font-mono text-[10px] font-semibold text-rose-300">
                      -{advancedBreakdown.deductions.reduce((s, d) => s + Number(d.points_lost || 0), 0)}đ
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {advancedBreakdown.deductions.slice(0, 5).map((d, i) => (
                      <li key={`ded-${i}`} className="flex items-start justify-between gap-3 text-[11px] text-rose-200/75">
                        <span className="leading-5">{normalizeVietnameseDisplay(d.reason)}</span>
                        <span className="shrink-0 font-mono font-bold text-rose-300">-{d.points_lost}đ</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* ── Bonuses (non-detailed) ───────────────────── */}
              {advancedBreakdown && advancedBreakdown.bonuses_earned.length > 0 && (
                <div className="px-4 py-3">
                  <span className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.13em] text-emerald-400/80">Điểm cộng</span>
                  <ul className="space-y-1">
                    {advancedBreakdown.bonuses_earned.slice(0, 4).map((b, i) => (
                      <li key={`bon-${i}`} className="flex items-start gap-2 text-[11px] text-emerald-200/75">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
};

interface ExpandedContentProps {
  candidate: Candidate;
  expandedCriteria: Record<string, Record<string, boolean>>;
  onToggleCriterion: (candidateId: string, criterion: string) => void;
  jdText: string;
  weights?: WeightCriteria;
  mode?: 'full' | 'technical';
  view?: 'jdmatch' | 'criteria';
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ candidate, expandedCriteria, onToggleCriterion, jdText, weights, mode = 'full', view }) => {
  const tc = useThemeColors();
  const analysisRecord = candidate.analysis as Record<string, unknown> | undefined;
  const coreCriteriaConfig = useMemo(() => buildConfiguredCoreCriteria(weights), [weights]);
  const configuredCoreCriteria = coreCriteriaConfig.criteria;
  const configuredCoreTotalMax = coreCriteriaConfig.totalMax;
  const allDetails = useMemo(() => {
    const rawDetails = analysisRecord ? getRawRecordValueByAliases(analysisRecord, ['chi tiet']) : undefined;

    return Array.isArray(rawDetails) ? rawDetails as DetailedScore[] : [];
  }, [analysisRecord]);

  const { basicDetails, supplementalDetails } = useMemo(() => {
    const basicMap = new Map<string, DetailedScore>();
    const supplementalMap = new Map<string, DetailedScore>();

    allDetails.forEach((item) => {
      const canonical = canonicalizeCriterionName(getDetailCriterion(item));
      if (!canonical) {
        return;
      }

      if (REMOVED_CRITERIA.includes(canonical)) {
        return;
      }

      if (configuredCoreCriteria.includes(canonical)) {
        if (!basicMap.has(canonical)) {
          basicMap.set(canonical, item);
        }
        return;
      }

      if (!supplementalMap.has(canonical)) {
        supplementalMap.set(canonical, item);
      }
    });

    return {
      basicDetails: configuredCoreCriteria
        .map((criterionName) => basicMap.get(criterionName))
        .filter((item): item is DetailedScore => Boolean(item)),
      supplementalDetails: Array.from(supplementalMap.values()),
    };
  }, [allDetails, configuredCoreCriteria]);

  const basicScore = useMemo(() =>
    basicDetails.reduce((sum, item) => {
      const parsed = parseDetailScore(getDetailScore(item), getDetailFormula(item));
      return sum + (parsed.score || 0);
    }, 0),
    [basicDetails]
  );
  const missingCoreCriteria = useMemo(
    () => configuredCoreCriteria.filter((criterionName) =>
      !basicDetails.some((item) => canonicalizeCriterionName(getDetailCriterion(item)) === criterionName)
    ),
    [basicDetails, configuredCoreCriteria]
  );
  const basicScoreRatio = configuredCoreTotalMax > 0 ? basicScore / configuredCoreTotalMax : 0;
  const basicCompletionPercent = configuredCoreTotalMax > 0
    ? Math.round((basicScore / configuredCoreTotalMax) * 100)
    : 0;

  const totalScore = useMemo(() => {
    const rawTotal = analysisRecord ? getRawRecordValueByAliases(analysisRecord, ['tong diem']) : undefined;

    if (typeof rawTotal === 'number' && Number.isFinite(rawTotal)) {
      return Math.min(100, Math.max(0, rawTotal));
    }

    if (typeof rawTotal === 'string') {
      const parsed = parseNumericValue(rawTotal);
      if (parsed !== null) {
        return Math.min(100, Math.max(0, parsed));
      }
    }

    return Math.min(100, parseFloat(basicScore.toFixed(1)));
  }, [analysisRecord, basicScore]);

  const jdFitDetail = useMemo(
    () => basicDetails.find((item) => canonicalizeCriterionName(getDetailCriterion(item)) === BASIC_CRITERIA[0]),
    [basicDetails]
  );
  const jdFitMaxScore = candidate.jdCvMatchInsights?.maxScore || 20;
  const jdFitScoreData = useMemo(() => {
    if (!jdFitDetail) return null;
    return normalizeParsedScoreToMax(
      parseDetailScore(getDetailScore(jdFitDetail), getDetailFormula(jdFitDetail)),
      jdFitMaxScore
    );
  }, [jdFitDetail, jdFitMaxScore]);
  const jdFitScore = jdFitScoreData?.score ?? candidate.jdCvMatchInsights?.weightedScore ?? 0;
  const matchPercent = jdFitScoreData?.achievedPct
    ?? Math.round(Math.min(100, Math.max(0, (jdFitScore / jdFitMaxScore) * 100)));
  const semanticMatchPercent = candidate.jdCvMatchInsights
    ? Math.round(candidate.jdCvMatchInsights.similarity * 1000) / 10
    : null;
  const [resolvedCvText, setResolvedCvText] = useState(candidate._cvText || '');
  const jdCvEvidenceRows = useMemo(
    () => buildJdCvEvidenceRows(candidate, jdText, jdFitDetail, resolvedCvText),
    [candidate, jdText, jdFitDetail, resolvedCvText]
  );
  const jdCvRoleSections = useMemo(() => {
    const preferredOrder = candidate.jdCvMatchInsights?.uiSections || [];
    const grouped = new Map<string, JdCvEvidenceRow[]>();

    jdCvEvidenceRows.forEach((row) => {
      const section = row.section || 'Tổng quan';
      const current = grouped.get(section) || [];
      current.push(row);
      grouped.set(section, current);
    });

    return Array.from(grouped.entries())
      .sort((left, right) => {
        const leftIndex = preferredOrder.indexOf(left[0]);
        const rightIndex = preferredOrder.indexOf(right[0]);
        if (leftIndex !== -1 || rightIndex !== -1) {
          return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
        }
        return left[0].localeCompare(right[0]);
      });
  }, [candidate.jdCvMatchInsights?.uiSections, jdCvEvidenceRows]);

  useEffect(() => {
    let isDisposed = false;

    const hydrateCvText = async () => {
      const cvText = await resolveCandidateCvText(candidate).catch(() => '');
      if (!isDisposed) {
        setResolvedCvText(cvText || candidate._cvText || '');
      }
    };

    void hydrateCvText();

    return () => {
      isDisposed = true;
    };
  }, [candidate]);

  const educationDetail = useMemo(
    () => basicDetails.find((item) => canonicalizeCriterionName(getDetailCriterion(item)) === BASIC_CRITERIA[4]),
    [basicDetails]
  );
  const [educationSummary, setEducationSummary] = useState<EducationSummary | null>(() => buildEducationSummary(candidate, educationDetail));

  useEffect(() => {
    let isDisposed = false;

    const hydrateEducation = async () => {
      try {
        const cvText = await resolveCandidateCvText(candidate);
        const nextSummary = buildEducationSummary(candidate, educationDetail, cvText);
        if (!isDisposed) {
          setEducationSummary(nextSummary);
        }
      } catch {
        if (!isDisposed) {
          setEducationSummary(buildEducationSummary(candidate, educationDetail));
        }
      }
    };

    void hydrateEducation();

    return () => {
      isDisposed = true;
    };
  }, [candidate, educationDetail]);

  const recommendation = totalScore >= 75
    ? 'Ứng viên xuất sắc, nên ưu tiên mời phỏng vấn sớm.'
    : totalScore >= 60
      ? 'Ứng viên có nền tảng tốt, nên xem xét mời phỏng vấn.'
      : totalScore >= 40
        ? 'Ứng viên có tiềm năng, cân nhắc nếu thiếu nguồn.'
        : 'Nên ưu tiên ứng viên khác có mức phù hợp cao hơn.';
  const educationValidation = candidate.analysis?.educationValidation;
  const educationValidationNote = educationValidation?.validationNote || 'Chưa xác định';
  const educationIsValid = normalizeAscii(educationValidationNote).includes('hop le') || normalizeAscii(educationValidationNote).includes('valid');
  const standardizedEducation = educationValidation?.standardizedEducation || '';
  const shouldShowStandardizedEducation = Boolean(standardizedEducation && !isGenericEducationValidation(standardizedEducation));
  const detectedLocation = candidate.detectedLocation?.trim() || 'Chưa xác định từ CV';
  const locationMatch = candidate.locationMatch;
  const locationTone = locationMatch === false
    ? 'border-rose-500/25 bg-rose-500/[0.04] text-rose-200'
    : locationMatch === true
      ? 'border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-200'
      : 'border-white/[0.08] bg-white/[0.025] text-slate-300';
  const locationWarning = candidate.softFilterWarnings?.find((warning) =>
    normalizeAscii(warning).includes('dia diem')
  );
  const showAggregateSections = mode !== 'full';
  const showTechnicalSummary = mode !== 'full';
  const showJdMatch = !view || view === 'jdmatch';
  const showCriteria = !view || view === 'criteria';

  return (
    <div className="supporthr-detail-content space-y-4 p-2 md:p-4">

      {/* ── Tổng hợp đánh giá ─────────────────────────────── */}
      {showAggregateSections && (
      <div className="rounded-none border border-zinc-800/80 bg-zinc-950/60 p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="w-1 absolute left-0 top-0 bottom-0 bg-cyan-500" />
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row pl-2">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-zinc-200">
            <i className="fa-solid fa-chart-pie text-cyan-400 text-base" />
            Tổng hợp đánh giá
          </h4>
          <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:grid-cols-3">
            <div className="rounded-none border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-700 transition-colors flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Tổng điểm</div>
              <div className="mt-2 text-xl font-bold font-mono text-white">{totalScore.toFixed(1)}<span className="text-xs text-zinc-500">/100</span></div>
            </div>
            <div className="rounded-none border border-cyan-500/30 bg-cyan-950/20 p-4 hover:border-cyan-400/40 transition-colors flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-400/80">Cốt lõi</div>
              <div className="mt-2 text-xl font-bold font-mono text-cyan-300">{basicScore.toFixed(1)}<span className="text-xs text-zinc-500/60">/{configuredCoreTotalMax}</span></div>
            </div>
            <div className="rounded-none border border-emerald-500/30 bg-emerald-950/20 p-4 hover:border-emerald-400/40 transition-colors flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400/80">Phù hợp JD</div>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-300">{matchPercent}%</div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 pl-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            <span className="w-20 text-cyan-400">Cốt lõi</span>
            <div className="flex-1 h-1.5 rounded-none bg-zinc-900 overflow-hidden border border-zinc-800/40">
              <div className="h-full rounded-none bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                style={{ width: `${Math.min(100, basicCompletionPercent)}%` }} />
            </div>
            <span className="w-12 text-right font-mono text-xs font-bold text-cyan-300">{basicCompletionPercent}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            <span className="w-20 text-emerald-400">JD ↔ CV</span>
            <div className="flex-1 h-1.5 rounded-none bg-zinc-900 overflow-hidden border border-zinc-800/40">
              <div
                className="h-full rounded-none bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: `${matchPercent}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs font-bold text-emerald-300">{matchPercent}%</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 pl-2">
          {locationMatch === false ? (
            <div className="rounded-none border border-red-500/20 bg-red-950/10 px-4 py-3.5 text-xs relative hover:border-red-500/30 transition-colors">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">
                <MapPin className="h-3.5 w-3.5" />
                Địa điểm CV
              </div>
              <div className="font-bold text-red-200">{detectedLocation}</div>
              <div className="mt-2 rounded-none border border-red-500/20 bg-red-950/30 px-2.5 py-1.5 text-[10px] font-medium leading-relaxed text-red-300">
                {locationWarning || 'Cảnh báo: địa điểm trong CV khác địa điểm làm việc yêu cầu.'}
              </div>
            </div>
          ) : (
            <div className="rounded-none border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-xs hover:border-zinc-700 transition-colors">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                <MapPin className="h-3.5 w-3.5" />
                Địa điểm CV
              </div>
              <div className="font-bold text-slate-100">{detectedLocation}</div>
            </div>
          )}
          {candidate.jobTitle && (
            <div className="rounded-none border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-xs hover:border-zinc-700 transition-colors">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Vị trí ứng viên</div>
              <div className="font-bold text-slate-100">{normalizeVietnameseDisplay(candidate.jobTitle)}</div>
            </div>
          )}
          {candidate.experienceLevel && (
            <div className="rounded-none border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-xs hover:border-zinc-700 transition-colors">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Cấp bậc</div>
              <div className="font-bold text-slate-100">{normalizeVietnameseDisplay(candidate.experienceLevel)}</div>
            </div>
          )}
        </div>
      </div>
      )}

      {showJdMatch && candidate.jdCvMatchInsights && (
          <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-950/10 px-4 py-4 text-xs sm:px-5">
            {candidate.jdCvMatchInsights.roleKey && candidate.jdCvMatchInsights.roleKey !== 'generic' ? (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold uppercase tracking-[0.1em] text-emerald-400">
                      {`So khớp chuyên môn cho ${normalizeVietnameseDisplay(candidate.jdCvMatchInsights.roleLabel)}`}
                    </div>
                    <div className="text-[11px] text-emerald-300/80 mt-1">
                      {semanticMatchPercent?.toFixed(1)}% tương đồng ngữ nghĩa
                      {candidate.jdCvMatchInsights.queryModel ? ` • ${normalizeVietnameseDisplay(candidate.jdCvMatchInsights.queryModel)}` : ''}
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-950/35 px-3.5 py-2 font-mono text-xs font-bold text-emerald-300">
                    {jdFitScore.toFixed(1)}/{jdFitMaxScore} điểm Job Fit
                  </div>
                </div>
                {(candidate.jdCvMatchInsights.matchedSkills.length > 0 || candidate.jdCvMatchInsights.transferMatches.length > 0 || (candidate.jdCvMatchInsights.missingRequirements?.length || 0) > 0) && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-emerald-500/10 pt-2 text-[11px] leading-5 text-emerald-300/70">
                    {candidate.jdCvMatchInsights.matchedSkills.length > 0 && (
                      <span>Yêu cầu đã đáp ứng: {candidate.jdCvMatchInsights.matchedSkills.slice(0, 5).map(normalizeVietnameseDisplay).join(', ')}.</span>
                    )}
                    {candidate.jdCvMatchInsights.transferMatches.length > 0 && (
                      <span>Năng lực tương đương: {candidate.jdCvMatchInsights.transferMatches.slice(0, 2).map(normalizeVietnameseDisplay).join(' | ')}.</span>
                    )}
                    {(candidate.jdCvMatchInsights.missingRequirements?.length || 0) > 0 && (
                      <span>Khoảng trống chính: {candidate.jdCvMatchInsights.missingRequirements!.slice(0, 3).map(normalizeVietnameseDisplay).join(', ')}.</span>
                    )}
                  </div>
                )}
                {jdCvEvidenceRows.length > 0 && (
                  <div className="mt-4 border-t border-emerald-500/10 pt-4">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">So khớp năng lực</div>
                        <p className="mt-1 text-[11px] leading-5 text-emerald-100/60">
                          JD bên trái, dẫn chứng CV bên phải.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300/80">
                        {jdCvEvidenceRows.length} cặp so khớp
                      </div>
                    </div>

                    <div className="space-y-3">
                      {jdCvRoleSections.map(([section, sectionRows]) => (
                        <div key={section} className="space-y-2">
                          <div className="inline-flex rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                            {section}
                          </div>
                          {sectionRows.map((row, index) => (
                            <div key={row.id || index} className="grid min-w-0 grid-cols-1 gap-4 rounded-2xl border border-emerald-500/10 bg-black/15 p-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${getMatchKindClasses(row.matchKind)}`}>
                                    {getMatchKindLabel(row.matchKind)}
                                  </span>
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                                    {getMatchKindDetail(row.matchKind)}
                                  </span>
                                  {row.confidence > 0 && (
                                    <span className="font-mono text-[10px] font-bold text-emerald-300">{row.confidence}%</span>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Yêu cầu JD</div>
                                <div className="mt-1 break-words text-xs font-bold leading-5 text-emerald-100">{row.requirement}</div>
                                <blockquote className="mt-2 border-l border-emerald-500/30 pl-3 text-[11px] leading-5 text-zinc-300">
                                  "{row.jdEvidence}"
                                </blockquote>
                              </div>

                              <div className="min-w-0 pt-1 md:pl-1">
                                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">CV chứng minh / suy luận</div>
                                <blockquote className={`mt-2 border-l pl-3 text-[11px] leading-5 ${row.matchKind === 'incorrect' ? 'border-rose-500/40 text-rose-200' : 'border-cyan-500/30 text-zinc-200'}`}>
                                  "{row.cvEvidence}"
                                </blockquote>
                                {row.reason && (
                                  <p className="mt-2 text-[10px] leading-5 text-zinc-500">{normalizeVietnameseDisplay(row.reason)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
            <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-bold uppercase tracking-[0.1em] text-emerald-400">Semantic match JD/CV bằng vector embedding</div>
                <div className="text-[11px] text-emerald-300/80 mt-1">
                  {semanticMatchPercent?.toFixed(1)}% tương đồng ngữ nghĩa
                  {candidate.jdCvMatchInsights.queryModel ? ` • ${normalizeVietnameseDisplay(candidate.jdCvMatchInsights.queryModel)}` : ''}
                </div>
              </div>
              <div className="rounded-full border border-emerald-500/20 bg-emerald-950/35 px-3.5 py-2 font-mono text-xs font-bold text-emerald-300">
                {jdFitScore.toFixed(1)}/{jdFitMaxScore} điểm Job Fit
              </div>
            </div>
            {(candidate.jdCvMatchInsights.matchedSkills.length > 0 || candidate.jdCvMatchInsights.transferMatches.length > 0) && (
              <div className="mt-3 text-[11px] leading-5 text-emerald-300/70 border-t border-emerald-500/10 pt-2 flex flex-wrap gap-x-4 gap-y-1">
                {candidate.jdCvMatchInsights.matchedSkills.length > 0 && (
                  <span>Kỹ năng khớp: {candidate.jdCvMatchInsights.matchedSkills.slice(0, 5).map(normalizeVietnameseDisplay).join(', ')}.</span>
                )}
                {candidate.jdCvMatchInsights.transferMatches.length > 0 && (
                  <span>Khớp chuyển đổi: {candidate.jdCvMatchInsights.transferMatches.slice(0, 2).map(normalizeVietnameseDisplay).join(' | ')}.</span>
                )}
              </div>
            )}
            {jdCvEvidenceRows.length > 0 && (
              <div className="mt-4 border-t border-emerald-500/10 pt-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">So khớp JD / CV</div>
                    <p className="mt-1 text-[11px] leading-5 text-emerald-100/60">
                      JD bên trái, dẫn chứng CV bên phải.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300/80">
                    {jdCvEvidenceRows.length} cặp so khớp
                  </div>
                </div>

                <div className="space-y-2">
                  {jdCvEvidenceRows.map((row, index) => (
                    <div key={row.id || index} className="grid min-w-0 grid-cols-1 gap-4 rounded-2xl border border-emerald-500/10 bg-black/15 p-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${getMatchKindClasses(row.matchKind)}`}>
                            {getMatchKindLabel(row.matchKind)}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                            {getMatchKindDetail(row.matchKind)}
                          </span>
                          {row.confidence > 0 && (
                            <span className="font-mono text-[10px] font-bold text-emerald-300">{row.confidence}%</span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Yêu cầu JD</div>
                        <div className="mt-1 break-words text-xs font-bold leading-5 text-emerald-100">{row.requirement}</div>
                        <blockquote className="mt-2 border-l border-emerald-500/30 pl-3 text-[11px] leading-5 text-zinc-300">
                          "{row.jdEvidence}"
                        </blockquote>
                      </div>

                      <div className="min-w-0 pt-1 md:pl-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">CV chứng minh / suy luận</div>
                        <blockquote className={`mt-2 border-l pl-3 text-[11px] leading-5 ${row.matchKind === 'incorrect' ? 'border-rose-500/40 text-rose-200' : 'border-cyan-500/30 text-zinc-200'}`}>
                          "{row.cvEvidence}"
                        </blockquote>
                        {row.reason && (
                          <p className="mt-2 text-[10px] leading-5 text-zinc-500">{normalizeVietnameseDisplay(row.reason)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        )}

        {showJdMatch && showTechnicalSummary && (
        <div className="mt-4 rounded-none border border-zinc-800 bg-zinc-950/80 px-5 py-4 text-xs relative overflow-hidden pl-2">
          <div className="w-1 absolute left-0 top-0 bottom-0 bg-gradient-to-b from-indigo-500 to-cyan-500" />
          <div className="pl-2">
            <span className="font-bold text-zinc-400 uppercase tracking-[0.14em] text-[10px] mr-2">Nhận định AI:</span>
            <span className="text-zinc-200 italic leading-relaxed">"{normalizeVietnameseDisplay(recommendation)}"</span>
          </div>
        </div>
        )}
      {showJdMatch && showTechnicalSummary && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidate.analysis?.['Điểm mạnh CV'] && (
          <div className="p-5 bg-zinc-950/50 border border-emerald-500/20 rounded-none relative overflow-hidden">
            <div className="w-1 absolute left-0 top-0 bottom-0 bg-emerald-500" />
            <p className="font-bold text-emerald-400 mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
              <i className="fa-solid fa-wand-magic-sparkles"></i>Điểm mạnh CV
            </p>
            <ul className="text-xs text-emerald-300/90 space-y-2 pl-2 leading-relaxed">
              {candidate.analysis['Điểm mạnh CV'].map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 select-none">✓</span>
                  <span>{normalizeVietnameseDisplay(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {candidate.analysis?.['Điểm yếu CV'] && (
          <div className="p-5 bg-zinc-950/50 border border-rose-500/20 rounded-none relative overflow-hidden">
            <div className="w-1 absolute left-0 top-0 bottom-0 bg-rose-500" />
            <p className="font-bold text-rose-400 mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
              <i className="fa-solid fa-flag"></i>Điểm yếu CV
            </p>
            <ul className="text-xs text-rose-300/90 space-y-2 pl-2 leading-relaxed">
              {candidate.analysis['Điểm yếu CV'].map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5 select-none">⚠</span>
                  <span>{normalizeVietnameseDisplay(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}

      {/* ── Cảnh báo AI Debiasing ────────────────────────────── */}
      {showJdMatch && showTechnicalSummary && candidate.debiasingWarnings && candidate.debiasingWarnings.length > 0 && (
        <div className="rounded-none border border-amber-500/20 bg-zinc-950/50 p-5 relative overflow-hidden">
          <div className="w-1 absolute left-0 top-0 bottom-0 bg-amber-500" />
          <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
            <i className="fa-solid fa-scale-balanced"></i> Cảnh báo Đạo đức AI
          </h4>
          <ul className="space-y-2.5">
            {candidate.debiasingWarnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2.5 rounded-none border border-amber-500/10 bg-amber-950/10 p-3">
                <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
                <span className="text-xs text-amber-200/80 leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Education Validation ─────────────────────────────── */}
      {showJdMatch && showTechnicalSummary && educationValidation && (
        <div className="rounded-none border border-zinc-800 bg-zinc-950/50 p-5 relative overflow-hidden">
          <div className="w-1 absolute left-0 top-0 bottom-0 bg-indigo-500" />
          <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-400">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i> Xác thực học vấn
          </h4>
          <div className="overflow-hidden rounded-none border border-zinc-800 bg-zinc-950 p-4">
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_max-content] xl:items-start">
              <div className="min-w-0 space-y-3">
                <div>
                  <span className="block whitespace-normal break-words text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">Học vấn phát hiện từ CV</span>
                  <span className="mt-1 block min-w-0 whitespace-normal break-words text-xs font-bold leading-5 text-slate-200">
                    {educationSummary
                      ? [
                          educationSummary.degree,
                          educationSummary.major,
                          educationSummary.institution,
                        ]
                          .filter(Boolean)
                          .join(' — ')
                      : 'Chưa có thông tin'}
                  </span>
                  {educationSummary?.rawLine && (
                    <span className="mt-1 block min-w-0 whitespace-normal break-words text-[11px] italic leading-normal text-zinc-500">
                      Trích dẫn CV: "{educationSummary.rawLine}"
                    </span>
                  )}
                </div>
                {shouldShowStandardizedEducation && (
                  <div className="max-w-full overflow-hidden rounded-none border border-zinc-800/80 bg-zinc-950/80 px-3 py-2">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">Thông tin Chuẩn hóa</span>
                    <span className="mt-1 block min-w-0 whitespace-normal break-words text-xs leading-5 text-slate-200">{standardizedEducation}</span>
                  </div>
                )}
              </div>

              <span className={`inline-flex max-w-full items-center justify-center whitespace-normal break-words rounded-none border px-2.5 py-1 text-left text-[10px] font-bold uppercase leading-4 tracking-[0.12em] xl:max-w-[18rem] xl:text-right ${educationIsValid ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : 'border-red-500/35 bg-red-500/10 text-red-300'}`}>
                {educationValidationNote}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab chuyển đổi Cơ bản / Nâng cao ───────────────── */}
      {showCriteria && <div className="overflow-hidden rounded-2xl border border-zinc-800/35 bg-[#09090b]/95">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-cyan-400">
              <i className="fa-solid fa-layer-group text-base"></i>
              <span>Tiêu chí cốt lõi</span>
              <span className="rounded-full border border-cyan-500/15 bg-cyan-950/25 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">{configuredCoreTotalMax} điểm</span>
            </div>
            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${basicScoreRatio >= 0.8 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : basicScoreRatio >= 0.6 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>{basicScore.toFixed(1)}/{configuredCoreTotalMax}</span>
          </div>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {basicDetails.length} tiêu chí • {configuredCoreCriteria.length} cốt lõi
          </div>

          {missingCoreCriteria.length > 0 && (
            <div className="rounded-2xl border border-amber-500/15 bg-amber-950/15 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-300">
              Backend hiện đang trả về thiếu {missingCoreCriteria.length}/{configuredCoreCriteria.length} tiêu chí cốt lõi.
              {' '}
              {missingCoreCriteria.slice(0, 4).join(', ')}
              {missingCoreCriteria.length > 4 ? '...' : ''}
            </div>
          )}

          {basicDetails.length > 0 ? (
            basicDetails.map((item) => {
              const criterionName = canonicalizeCriterionName(getDetailCriterion(item));
              return (
                <CriterionAccordion
                  key={criterionName}
                  item={item}
                  isExpanded={!!expandedCriteria[candidate.id]?.[criterionName]}
                  onToggle={() => onToggleCriterion(candidate.id, criterionName)}
                  jdText={jdText}
                  detailed={view === 'criteria'}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
              <i className="fa-solid fa-layer-group text-3xl mb-3 opacity-30"></i>
              <p className="text-xs uppercase tracking-[0.12em] font-semibold">Chưa có dữ liệu tiêu chí cốt lõi</p>
            </div>
          )}

          {supplementalDetails.length > 0 && (
            <div className="space-y-3 border-t border-zinc-900/70 pt-5">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-emerald-400/70 text-xs"></i>
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Phân tích bổ sung</p>
              </div>
              {supplementalDetails.map((item, index) => {
                const criterionName = canonicalizeCriterionName(getDetailCriterion(item)) || `supplemental-${index}`;
                return (
                  <CriterionAccordion
                    key={`${criterionName}-${index}`}
                    item={item}
                    isExpanded={!!expandedCriteria[candidate.id]?.[criterionName]}
                    onToggle={() => onToggleCriterion(candidate.id, criterionName)}
                    jdText={jdText}
                    detailed={view === 'criteria'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>}
    </div>
  );
};

export default ExpandedContent;
