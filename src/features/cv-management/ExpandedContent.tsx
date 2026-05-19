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

// ── Phân loại tiêu chí ──────────────────────────────────────────────────────

const BASIC_CRITERIA = [
  'Phù hợp JD (Job Fit)', 'Kinh nghiệm', 'Kỹ năng', 'Thành tựu/KPI',
  'Học vấn', 'Ngôn ngữ', 'Chuyên nghiệp', 'Gắn bó & Lịch sử CV', 'Phù hợp văn hoá',
  'Hệ số uy tín công ty', // chuyển về cơ bản
];

const REMOVED_CRITERIA = [
  'Mức độ trung thành',
  'Ky nang hanh dong & chu dong',
  'Trinh bay STAR & Ket qua',
  'Ky nang chuyen doi (Skill Graph)',
  'Tiem nang phat trien (Career Velocity)',
];

// Thang diem chu?n
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

// ?? Accordion d?ng chung ?????????????????????????????????????????????????????

// ?? Accordion d?ng chung ?????????????????????????????????????????????????????

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
      return String(value).trim();
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

const uploadedCvTextCache = new Map<string, string>();

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

interface CriterionAccordionProps {
  item: DetailedScore;
  isExpanded: boolean;
  onToggle: () => void;
  jdText: string;
}

const CriterionAccordion: React.FC<CriterionAccordionProps> = ({ item, isExpanded, onToggle, jdText }) => {
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

  let experienceBlock: React.ReactNode = null;
  let matchMeta: ReturnType<typeof analyzeExperience> | null = null;
  if (isExperience && hasRealEvidence) {
    matchMeta = analyzeExperience(jdText, detailEvidence || '');
    experienceBlock = (
      <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
        <h5 className="mb-1 text-base font-bold text-slate-100">Phân tích nhanh</h5>
        {matchMeta.matchPercent === 'N/A' ? (
          <p className="text-xs text-slate-500 italic">JD chưa có mức yêu cầu kinh nghiệm rõ ràng</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mức độ phù hợp JD</span>
                <span className="font-semibold text-cyan-400">{matchMeta.matchPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className={`h-full ${typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 80 ? 'bg-emerald-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 65 ? 'bg-yellow-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${typeof matchMeta.matchPercent === 'number' ? Math.min(100, Math.max(0, matchMeta.matchPercent)) : 0}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {matchMeta.matched.slice(0, 5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 text-[10px] border border-emerald-500/40">{k}</span>)}
              {matchMeta.missing.slice(0, 5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-300 text-[10px] border border-yellow-500/40">{k}</span>)}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#05070b] transition-all duration-200 hover:border-cyan-500/25 hover:shadow-md hover:shadow-cyan-500/5">
      <button className="flex min-h-[56px] w-full items-center justify-between p-3.5 text-left" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] ${meta.color}`}>
            <MetaIcon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="truncate font-semibold text-slate-100">{criterionName}</span>
          <span className="ml-1 rounded border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400">{proficiency}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${scoreBadgeClass}`}>
            {parsedData.scoreLabel}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/60 px-4 pb-4 pt-3">
          <div className={`grid grid-cols-1 ${isExperience || requirementComparison ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-4`}>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="text-base font-bold text-slate-200">Dẫn chứng (trích từ CV)</h5>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-cyan-400">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã chép' : 'Chép'}
                </button>
              </div>
              {canShowRawEvidence ? (
                <blockquote className="border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                  __html: highlightedEvidenceHtml
                }} />
              ) : (
                <blockquote className="border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                  __html: '<span class="not-italic rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">Chưa tìm thấy trong CV</span>'
                }} />
              )}
            </div>

            {isExperience && experienceBlock}
            {!isExperience && requirementComparison && (
              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="mb-1 text-base font-bold text-slate-100">Phân tích nhanh</h5>
                    <p className="text-[11px] text-slate-500">Khớp từ khóa bắt buộc từ JD, có chặn phủ định và alias Việt/Anh.</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200">
                    {requirementComparison.matched.length + requirementComparison.semanticMatched.length}/{requirementComparison.jdKeywords.length}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-400">Đã khớp</div>
                    <div className="flex flex-wrap gap-1">
                      {requirementComparison.matched.length > 0
                        ? requirementComparison.matched.slice(0, 6).map(k => <span key={k} className="pill pill--match">{k}</span>)
                        : requirementComparison.semanticMatched.length === 0
                          ? <span className="text-[11px] text-slate-500">(Không)</span>
                          : null}
                      {requirementComparison.semanticMatched.slice(0, 4).map((item) => (
                        <span key={item.keyword} className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                          {item.keyword} · {Math.round(item.score * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-400">Còn thiếu</div>
                    <div className="flex flex-wrap gap-1">
                      {requirementComparison.missing.length > 0
                        ? requirementComparison.missing.slice(0, 5).map(k => <span key={k} className="pill pill--missing">{k}</span>)
                        : <span className="text-[11px] text-slate-500">(Không)</span>}
                    </div>
                  </div>
                </div>

                {requirementComparison.semanticMatched.length > 0 && (
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                      <Target className="h-3 w-3" />
                      Semantic fallback
                    </div>
                    <div className="space-y-1.5">
                      {requirementComparison.semanticMatched.slice(0, 2).map((item) => (
                        <p key={`${item.keyword}-reason`} className="text-[11px] leading-5 text-slate-300">
                          <span className="font-semibold text-cyan-200">{item.keyword}:</span> {item.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h5 className="mb-4 text-base font-bold text-slate-100">Giải thích & Công thức</h5>

              <div className="mb-4 space-y-3">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.055] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">Phương trình điểm</p>
                  <p className="font-mono text-sm leading-relaxed text-slate-200">
                    {advancedBreakdown?.mathematical_formula || detailFormula || 'Chưa có phương trình chi tiết từ AI.'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.08] bg-slate-950/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Điểm tối đa</p>
                    <p className="mt-1 font-mono text-lg font-bold text-violet-300">
                      {advancedBreakdown?.max_possible_score ?? parsedData.maxScore ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-slate-950/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Điểm đạt</p>
                    <p className="mt-1 font-mono text-lg font-bold text-cyan-300">
                      {advancedBreakdown?.raw_score_earned ?? parsedData.score ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-slate-950/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Keyword match</p>
                    <p className="mt-1 font-mono text-lg font-bold text-emerald-300">
                      {keywordMetrics ? `${keywordMetrics.match_percentage.toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                </div>

                {detailExplanation && detailExplanation !== '...' && (
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">Nhận xét AI</p>
                    <p className="text-xs leading-relaxed text-slate-300 italic">"{detailExplanation}"</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">Công thức tính điểm</div>

                {parsedData.hasScore ? (
                  <>
                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Đánh giá thực tế</span>
                        <span className="font-mono font-semibold text-cyan-400">{parsedData.scoreLabel}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="mb-1 text-xs text-slate-500">Công thức subscore</div>
                      <div className="font-mono text-xs">
                        {parsedData.maxScore !== null ? (
                          <span>
                            <span className="text-sky-400">{formatScoreValue(parsedData.score || 0)}</span>
                            {' / '}
                            <span className="text-violet-400">{formatScoreValue(parsedData.maxScore)}</span>
                            {' = '}
                            <span className="font-bold text-amber-400">{parsedData.contributionPct}%</span>
                            {parsedData.weight > 0 && (
                              <span className="text-slate-500"> ({parsedData.weight}% trọng số)</span>
                            )}
                          </span>
                        ) : (
                          <span>
                            <span className="text-sky-400">{parsedData.scoreLabel}</span>
                            {parsedData.weight > 0 && (
                              <span className="text-slate-500"> ({parsedData.weight}% trọng số)</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="mb-1 text-xs text-slate-500">Đóng góp vào điểm tổng</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${parsedData.achievedPct >= 80 ? 'bg-emerald-500' : parsedData.achievedPct >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, parsedData.achievedPct)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold tabular-nums ${parsedData.achievedPct >= 80 ? 'text-emerald-400' : parsedData.achievedPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{parsedData.achievedPct}%</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          Tiêu chí này đóng góp{' '}
                          <span className="font-bold text-amber-400 font-mono">{parsedData.score !== null ? formatScoreValue(parsedData.score) : '0'}</span>
                          {parsedData.maxScore !== null && (
                            <>
                              {' / '}
                              <span className="text-slate-400 font-mono">{formatScoreValue(parsedData.maxScore)}</span> điểm
                            </>
                          )}
                          {parsedData.maxScore === null && ' điểm'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 text-xs text-slate-400">
                    Chưa có dữ liệu điểm chi tiết cho tiêu chí này trong kết quả AI hiện tại.
                  </div>
                )}
              </div>

              {advancedBreakdown && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300/80">Lý do trừ điểm</p>
                      <span className="rounded-full border border-rose-400/25 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                        {advancedBreakdown.deductions.reduce((sum, item) => sum + Number(item.points_lost || 0), 0)}đ
                      </span>
                    </div>
                    {advancedBreakdown.deductions.length > 0 ? (
                      <ul className="space-y-1.5">
                        {advancedBreakdown.deductions.slice(0, 6).map((item, index) => (
                          <li key={`${item.reason}-${index}`} className="flex items-start justify-between gap-3 text-xs text-rose-100/85">
                            <span className="leading-5">{item.reason}</span>
                            <span className="shrink-0 font-mono font-bold text-rose-300">-{item.points_lost}đ</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">Không có điểm trừ rõ ràng ở tiêu chí này.</p>
                    )}
                  </div>

                  {advancedBreakdown.bonuses_earned.length > 0 && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">Điểm cộng</p>
                      <ul className="space-y-1.5">
                        {advancedBreakdown.bonuses_earned.slice(0, 4).map((bonus, index) => (
                          <li key={`${bonus}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-emerald-100/85">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                            {bonus}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {keywordMetrics && keywordMetrics.total_required_keywords > 0 && (
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">Keywords Matching</p>
                        <span className="font-mono text-xs font-bold text-cyan-200">
                          {keywordMetrics.matched_keywords_count}/{keywordMetrics.total_required_keywords}
                        </span>
                      </div>
                      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${keywordMetrics.match_percentage >= 75 ? 'bg-emerald-500' : keywordMetrics.match_percentage >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, Math.max(0, keywordMetrics.match_percentage))}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedKeywordRows.slice(0, 8).map((item) => (
                          <span key={`matched-${item.keyword}`} className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 underline decoration-emerald-300/60 underline-offset-4">
                            {item.keyword}
                          </span>
                        ))}
                        {missingKeywordRows.slice(0, 8).map((item) => (
                          <span key={`missing-${item.keyword}`} className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                            {item.keyword}
                          </span>
                        ))}
                      </div>
                      {matchedKeywordRows.some((item) => item.context_sentence) && (
                        <div className="mt-3 space-y-1.5">
                          {matchedKeywordRows.filter((item) => item.context_sentence).slice(0, 2).map((item) => (
                            <p key={`ctx-${item.keyword}`} className="rounded-lg border border-white/[0.06] bg-black/20 p-2 text-[11px] leading-5 text-slate-300">
                              <span className="font-semibold text-emerald-200">{item.keyword}:</span> {item.context_sentence}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ candidate, expandedCriteria, onToggleCriterion, jdText, weights }) => {
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

  return (
    <div className="space-y-4 p-2 md:p-4">

      {/* ── Tổng hợp đánh giá ─────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#05070b] p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <i className="fa-solid fa-chart-pie text-cyan-400" />
            Tổng hợp đánh giá
          </h4>
          <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-3">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs">
              <div className="text-slate-500">Tổng điểm</div>
              <div className="font-semibold text-slate-100">{totalScore.toFixed(1)}<span className="text-slate-500">/100</span></div>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.045] px-3 py-2 text-xs">
              <div className="text-cyan-500/70">Cốt lõi</div>
              <div className="font-semibold text-cyan-300">{basicScore.toFixed(1)}<span className="text-slate-500">/{configuredCoreTotalMax}</span></div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs">
              <div className="text-slate-500">Phù hợp JD</div>
              <div className="font-semibold text-emerald-400">{matchPercent}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-20 text-cyan-500/80">Cốt lõi</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                style={{ width: `${Math.min(100, basicCompletionPercent)}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-cyan-400">{basicCompletionPercent}%</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-20 text-emerald-400/80">JD ↔ CV</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${matchPercent}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-emerald-400">{matchPercent}%</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className={`rounded-lg border px-4 py-3 text-sm ${locationTone}`}>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">
              <MapPin className="h-3.5 w-3.5" />
              Địa điểm CV
            </div>
            <div className="font-semibold text-slate-100">{detectedLocation}</div>
            {locationMatch === false && (
              <div className="mt-2 rounded-md border border-rose-400/25 bg-black/20 px-2 py-1 text-[11px] font-medium text-rose-200">
                {locationWarning || 'Cảnh báo: địa điểm trong CV khác địa điểm làm việc yêu cầu.'}
              </div>
            )}
          </div>
          {candidate.jobTitle && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Vị trí ứng viên</div>
              <div className="font-semibold text-slate-100">{candidate.jobTitle}</div>
            </div>
          )}
          {candidate.experienceLevel && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Cấp bậc</div>
              <div className="font-semibold text-slate-100">{candidate.experienceLevel}</div>
            </div>
          )}
        </div>

        {candidate.jdCvMatchInsights && (
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.045] px-4 py-3 text-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-emerald-300">Semantic match JD/CV bằng vector embedding</div>
                <div className="text-xs text-emerald-100/70">
                  {semanticMatchPercent?.toFixed(1)}% tương đồng ngữ nghĩa
                  {candidate.jdCvMatchInsights.queryModel ? ` • ${candidate.jdCvMatchInsights.queryModel}` : ''}
                </div>
              </div>
              <div className="rounded-md border border-emerald-400/25 bg-black/20 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                {jdFitScore.toFixed(1)}/{jdFitMaxScore} điểm Job Fit
              </div>
            </div>
            {(candidate.jdCvMatchInsights.matchedSkills.length > 0 || candidate.jdCvMatchInsights.transferMatches.length > 0) && (
              <div className="mt-2 text-xs leading-6 text-emerald-100/70">
                {candidate.jdCvMatchInsights.matchedSkills.length > 0 && (
                  <span>Kỹ năng khớp: {candidate.jdCvMatchInsights.matchedSkills.slice(0, 5).join(', ')}.</span>
                )}{' '}
                {candidate.jdCvMatchInsights.transferMatches.length > 0 && (
                  <span>Khớp chuyển đổi: {candidate.jdCvMatchInsights.transferMatches.slice(0, 2).join(' | ')}.</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm">
          <span className="font-semibold text-slate-200">Nhận định:</span>{' '}
          <span className="text-slate-400">{recommendation}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidate.analysis?.['Điểm mạnh CV'] && (
          <div className="p-4 bg-[#05070b] border border-emerald-500/20 rounded-xl">
            <p className="font-semibold text-green-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-wand-magic-sparkles"></i>Điểm mạnh CV
            </p>
            <ul className="list-disc list-inside text-sm text-green-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Điểm mạnh CV'].map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        )}
        {candidate.analysis?.['Điểm yếu CV'] && (
          <div className="p-4 bg-[#05070b] border border-rose-500/20 rounded-xl">
            <p className="font-semibold text-red-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-flag"></i>Điểm yếu CV
            </p>
            <ul className="list-disc list-inside text-sm text-red-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Điểm yếu CV'].map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* ── Cảnh báo AI Debiasing ────────────────────────────── */}
      {candidate.debiasingWarnings && candidate.debiasingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-[#05070b] p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-300">
            <i className="fa-solid fa-scale-balanced"></i> Cảnh báo Đạo đức AI
          </h4>
          <ul className="space-y-2">
            {candidate.debiasingWarnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-white/[0.025] p-2.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
                <span className="text-sm text-amber-200/80 leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Education Validation ─────────────────────────────── */}
      {educationValidation && (
        <div className="rounded-xl border border-white/[0.08] bg-[#05070b] p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-100">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i> Xác thực học vấn
          </h4>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300/80">Cơ sở đào tạo</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {educationSummary?.institution || 'Chưa tìm thấy tên cơ sở đào tạo trong CV'}
                  </p>
                </div>

                {(educationSummary?.major || educationSummary?.degree || shouldShowStandardizedEducation) && (
                  <div className="grid gap-2 text-xs text-slate-400 md:grid-cols-3">
                    {educationSummary?.major && (
                      <div className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Ngành học</span>
                        <span className="mt-1 block text-slate-200">{educationSummary.major}</span>
                      </div>
                    )}
                    {educationSummary?.degree && (
                      <div className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Bằng cấp</span>
                        <span className="mt-1 block text-slate-200">{educationSummary.degree}</span>
                      </div>
                    )}
                    {shouldShowStandardizedEducation && (
                      <div className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Chuẩn hóa</span>
                        <span className="mt-1 block text-slate-200">{standardizedEducation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${educationIsValid ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : 'border-red-500/35 bg-red-500/10 text-red-300'}`}>
                {educationValidationNote}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab chuyển đổi Cơ bản / Nâng cao ───────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#030405] overflow-hidden">
        <div className="border-b border-white/[0.08] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-cyan-300">
            <i className="fa-solid fa-layer-group text-base"></i>
            <span>Tiêu chí cốt lõi</span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{configuredCoreTotalMax} điểm</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${basicScoreRatio >= 0.8 ? 'text-emerald-400' : basicScoreRatio >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{basicScore.toFixed(1)}/{configuredCoreTotalMax}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <i className="fa-solid fa-circle-info text-cyan-500/60 text-xs"></i>
            <p className="text-[11px] text-slate-500">
              {basicDetails.length} tiêu chí hiển thị • {configuredCoreCriteria.length} tiêu chí cốt lõi • Tổng phổ điểm <span className="text-cyan-400 font-bold">{configuredCoreTotalMax}</span> điểm • Đánh giá nền tảng ứng viên
            </p>
          </div>

          {missingCoreCriteria.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[11px] text-amber-200">
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
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <i className="fa-solid fa-layer-group text-3xl mb-3 opacity-30"></i>
              <p className="text-sm">Chưa có dữ liệu tiêu chí cốt lõi</p>
            </div>
          )}

          {supplementalDetails.length > 0 && (
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-emerald-400/70 text-xs"></i>
                <p className="text-[11px] text-slate-500">Cac phan tich bo sung do backend tra ve</p>
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
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandedContent;
