import React, { useMemo, useState } from 'react';
import type { Candidate, DetailedScore } from '@/shared/types';
import { analyzeExperience, extractJDRequirements, compareEvidence } from '@/lib/services/screening/frontendInsights';

// ── Phân loại tiêu chí ──────────────────────────────────────────────────────

const BASIC_CRITERIA = [
  'Phù hợp JD (Job Fit)', 'Kinh nghiệm', 'Kỹ năng', 'Thành tựu/KPI',
  'Học vấn', 'Ngôn ngữ', 'Chuyên nghiệp', 'Gắn bó & Lịch sử CV', 'Phù hợp văn hoá',
  'Hệ số uy tín công ty', // chuyển về cơ bản
];

const LOYALTY_CRITERION = 'Muc do trung thanh';

const REMOVED_ADVANCED_CRITERIA = [
  'Ky nang hanh dong & chu dong',
  'Trinh bay STAR & Ket qua',
  'Ky nang chuyen doi (Skill Graph)',
  'Tiem nang phat trien (Career Velocity)',
];

// Thang diem chu?n
const BASIC_TOTAL_MAX = 80;    // 10 tieu chi c? b?n c?ng l?i t?i ?a 80
const LOYALTY_TOTAL_MAX = 10;

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


const CRITERION_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = {
  ...BASIC_DESCRIPTIONS,
  [LOYALTY_CRITERION]: {
    what: 'Phan tich lich su lam viec de uoc luong muc do on dinh, cam ket va xu huong gan bo cua ung vien.',
    why: 'Muc do trung thanh giup nha tuyen dung nhin ro rui ro nghi som, chi phi dao tao lai va do ben cua ung vien trong moi truong thuc te.',
    signals: ['Thoi gian o moi cong ty du dai', 'It nhay viec ngan han lien tiep', 'Cac lan chuyen viec co xu huong tang truong hop ly'],
  },
};

const CARD_CRITERIA_META: { [key: string]: { icon: string; color: string; accent: string } } = {
  [BASIC_CRITERIA[0]]: { icon: 'fa-solid fa-bullseye', color: 'text-sky-400', accent: 'border-sky-500/30 bg-sky-500/5' },
  [BASIC_CRITERIA[1]]: { icon: 'fa-solid fa-briefcase', color: 'text-green-400', accent: 'border-green-500/30 bg-green-500/5' },
  [BASIC_CRITERIA[2]]: { icon: 'fa-solid fa-gears', color: 'text-purple-400', accent: 'border-purple-500/30 bg-purple-500/5' },
  [BASIC_CRITERIA[3]]: { icon: 'fa-solid fa-trophy', color: 'text-yellow-400', accent: 'border-yellow-500/30 bg-yellow-500/5' },
  [BASIC_CRITERIA[4]]: { icon: 'fa-solid fa-graduation-cap', color: 'text-indigo-400', accent: 'border-indigo-500/30 bg-indigo-500/5' },
  [BASIC_CRITERIA[5]]: { icon: 'fa-solid fa-language', color: 'text-orange-400', accent: 'border-orange-500/30 bg-orange-500/5' },
  [BASIC_CRITERIA[6]]: { icon: 'fa-solid fa-file-invoice', color: 'text-cyan-400', accent: 'border-cyan-500/30 bg-cyan-500/5' },
  [BASIC_CRITERIA[7]]: { icon: 'fa-solid fa-hourglass-half', color: 'text-lime-400', accent: 'border-lime-500/30 bg-lime-500/5' },
  [BASIC_CRITERIA[8]]: { icon: 'fa-solid fa-users-gear', color: 'text-pink-400', accent: 'border-pink-500/30 bg-pink-500/5' },
  [LOYALTY_CRITERION]: { icon: 'fa-solid fa-shield-halved', color: 'text-amber-400', accent: 'border-amber-500/30 bg-amber-500/5' },
  [BASIC_CRITERIA[9]]: { icon: 'fa-solid fa-building-columns', color: 'text-emerald-400', accent: 'border-emerald-500/30 bg-emerald-500/5' },
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

const MISSING_DETAIL_EVIDENCE = 'AI chua tra ve dan chung cu the cho tieu chi nay.';

function buildSyntheticLoyaltyDetail(source: DetailedScore): DetailedScore {
  const inheritedEvidence = getDetailEvidence(source) || MISSING_DETAIL_EVIDENCE;
  const inheritedExplanation = getDetailExplanation(source);
  const inheritedFormula = getDetailFormula(source);
  const inheritedScore = getDetailScore(source) || `0/${LOYALTY_TOTAL_MAX}`;

  return {
    'Tiêu chí': LOYALTY_CRITERION,
    'Điểm': inheritedScore,
    'Công thức': inheritedFormula || 'Suy ra tu tieu chi Gan bo & Lich su CV',
    'Dẫn chứng': inheritedEvidence,
    'Giải thích': inheritedExplanation && inheritedExplanation !== '...'
      ? `${inheritedExplanation} (Duoc suy ra tu tieu chi Gan bo & Lich su CV.)`
      : 'Phien phan tich nay chua tach rieng Muc do trung thanh, nen he thong suy ra tu tieu chi Gan bo & Lich su CV.',
  };
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

  let scoreLabel = 'Chua co';
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
  if (normalized.includes('muc do trung thanh') || normalized.includes('su on dinh') || normalized.includes('trung thanh')) return LOYALTY_CRITERION;
  if (normalized.includes('ky nang hanh dong') || normalized.includes('chu dong')) return REMOVED_ADVANCED_CRITERIA[0];
  if (normalized.includes('trinh bay star') || normalized.includes('star ket qua')) return REMOVED_ADVANCED_CRITERIA[1];
  if (normalized.includes('skill graph') || normalized.includes('ky nang chuyen doi')) return REMOVED_ADVANCED_CRITERIA[2];
  if (normalized.includes('career velocity') || normalized.includes('tiem nang phat trien')) return REMOVED_ADVANCED_CRITERIA[3];

  return value;
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

  const parsedData = useMemo(
    () => parseDetailScore(detailScore, detailFormula),
    [detailFormula, detailScore]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(detailEvidence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = CARD_CRITERIA_META[criterionName] || { icon: 'fa-solid fa-question-circle', color: 'text-slate-400', accent: 'border-slate-700 bg-slate-900/20' };
  const description = CRITERION_DESCRIPTIONS[criterionName];
  const isLoyalty = criterionName === LOYALTY_CRITERION;
  const hasRealEvidence = Boolean(
    detailEvidence &&
    normalizeAscii(detailEvidence) !== 'khong tim thay thong tin trong cv' &&
    detailEvidence !== MISSING_DETAIL_EVIDENCE
  );

  const scorePercentage = parsedData.achievedPct;
  const scoreBadgeClass = !parsedData.hasScore
    ? 'bg-slate-800/60 text-slate-400 border-slate-700/80'
    : scorePercentage >= 85
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
      : scorePercentage >= 65
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
        : 'bg-red-500/15 text-red-300 border-red-500/35';

  const proficiency = !parsedData.hasScore ? 'Chua co'
    : scorePercentage >= 90 ? 'Expert'
      : scorePercentage >= 75 ? 'Advanced'
        : scorePercentage >= 55 ? 'Intermediate'
          : 'Beginner';

  const isExperience = criterionName === BASIC_CRITERIA[1];
  const jdRequirements = useMemo(() => extractJDRequirements(jdText), [jdText]);
  const thisRequirement = useMemo(() => jdRequirements.find(r => r.display === criterionName), [criterionName, jdRequirements]);
  const requirementComparison = useMemo(() => {
    if (isExperience || !thisRequirement || !hasRealEvidence) return null;
    return compareEvidence(criterionName, thisRequirement.keywords, detailEvidence);
  }, [criterionName, detailEvidence, hasRealEvidence, isExperience, thisRequirement]);

  let experienceBlock: React.ReactNode = null;
  let matchMeta: ReturnType<typeof analyzeExperience> | null = null;
  if (isExperience && hasRealEvidence) {
    matchMeta = analyzeExperience(jdText, detailEvidence || '');
    experienceBlock = (
      <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
        <h5 className="mb-1 text-base font-bold text-slate-100">Phan tich nhanh</h5>
        {matchMeta.matchPercent === 'N/A' ? (
          <p className="text-xs text-slate-500 italic">JD chua co muc yeu cau kinh nghiem ro rang</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Muc do phu hop JD</span>
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
    <div className={`rounded-xl border transition-all duration-200 hover:shadow-md ${isLoyalty ? `${meta.accent} hover:shadow-amber-500/5` : 'border-white/[0.08] bg-[#05070b] hover:border-cyan-500/25 hover:shadow-cyan-500/5'}`}>
      <button className="flex min-h-[56px] w-full items-center justify-between p-3.5 text-left" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="flex min-w-0 items-center gap-3">
          <i className={`${meta.icon} ${meta.color} w-5 text-center text-lg`}></i>
          <span className="truncate font-semibold text-slate-100">{criterionName}</span>
          <span className="ml-1 rounded border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400">{proficiency}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${scoreBadgeClass}`}>
            {parsedData.scoreLabel}
          </span>
          <i className={`fa-solid fa-chevron-down text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/60 px-4 pb-4 pt-3">
          <div className={`grid grid-cols-1 ${isExperience || requirementComparison ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-4`}>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="text-base font-bold text-slate-200">Dan chung (trich tu CV)</h5>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-cyan-400">
                  <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  {copied ? 'Da chep' : 'Chep'}
                </button>
              </div>
              <blockquote className="border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                __html: detailEvidence === 'Khong tim thay thong tin trong CV' || detailEvidence === MISSING_DETAIL_EVIDENCE
                  ? '<span class="not-italic rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">Chua tim thay trong CV</span>'
                  : detailEvidence
              }} />
            </div>

            {isExperience && experienceBlock}
            {!isExperience && requirementComparison && (
              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
                <h5 className="mb-1 text-base font-bold text-slate-100">Phan tich nhanh</h5>
                <div className="text-[11px] text-slate-400">Tu khoa JD ({requirementComparison.jdKeywords.length})</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {requirementComparison.jdKeywords.slice(0, 12).map(k => <span key={k} className="pill pill--uncertain">{k}</span>)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Khop</div>
                <div className="flex flex-wrap gap-1">
                  {requirementComparison.matched.length > 0 ? requirementComparison.matched.slice(0, 10).map(k => <span key={k} className="pill pill--match">{k}</span>) : <span className="text-[11px] text-slate-500">(Khong)</span>}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-2">Thieu</div>
                <div className="flex flex-wrap gap-1">
                  {requirementComparison.missing.length > 0 ? requirementComparison.missing.slice(0, 10).map(k => <span key={k} className="pill pill--missing">{k}</span>) : <span className="text-[11px] text-slate-500">(Khong)</span>}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h5 className="mb-4 text-base font-bold text-slate-100">Giai thich & Cong thuc</h5>

              {description ? (
                <div className={`mb-4 rounded-xl border p-4 space-y-3 ${isLoyalty ? 'border-amber-500/20 bg-amber-500/5' : 'border-cyan-500/20 bg-cyan-500/5'}`}>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLoyalty ? 'text-amber-400/70' : 'text-cyan-400/70'}`}>Day la gi?</p>
                    <p className="text-sm leading-relaxed text-slate-300">{description.what}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLoyalty ? 'text-amber-400/70' : 'text-cyan-400/70'}`}>Tai sao quan trong?</p>
                    <p className="text-sm leading-relaxed text-slate-400">{description.why}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isLoyalty ? 'text-amber-400/70' : 'text-cyan-400/70'}`}>Dau hieu nhan biet</p>
                    <ul className="space-y-1.5">
                      {description.signals.map((signal, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-slate-400">
                          <i className={`fa-solid fa-circle-check mt-0.5 shrink-0 text-[10px] ${isLoyalty ? 'text-amber-400' : 'text-cyan-400'}`} />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {detailExplanation && detailExplanation !== '...' && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLoyalty ? 'text-amber-400/70' : 'text-cyan-400/70'}`}>Nhan xet cua AI voi CV nay</p>
                      <p className="text-xs leading-relaxed text-slate-300 italic">"{detailExplanation}"</p>
                    </div>
                  )}
                </div>
              ) : (
                detailExplanation && (
                  <div className="mb-4">
                    <p className="text-sm leading-relaxed text-slate-300">{detailExplanation}</p>
                  </div>
                )
              )}

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">Cong thuc tinh diem</div>

                {parsedData.hasScore ? (
                  <>
                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Danh gia thuc te</span>
                        <span className="font-mono font-semibold text-cyan-400">{parsedData.scoreLabel}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="mb-1 text-xs text-slate-500">Cong thuc subscore</div>
                      <div className="font-mono text-xs">
                        {parsedData.maxScore !== null ? (
                          <span>
                            <span className="text-sky-400">{formatScoreValue(parsedData.score || 0)}</span>
                            {' / '}
                            <span className="text-violet-400">{formatScoreValue(parsedData.maxScore)}</span>
                            {' = '}
                            <span className="font-bold text-amber-400">{parsedData.contributionPct}%</span>
                            {parsedData.weight > 0 && (
                              <span className="text-slate-500"> ({parsedData.weight}% trong so)</span>
                            )}
                          </span>
                        ) : (
                          <span>
                            <span className="text-sky-400">{parsedData.scoreLabel}</span>
                            {parsedData.weight > 0 && (
                              <span className="text-slate-500"> ({parsedData.weight}% trong so)</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="mb-1 text-xs text-slate-500">Dong gop vao diem tong</div>
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
                          Tieu chi nay dong gop{' '}
                          <span className="font-bold text-amber-400 font-mono">{parsedData.score !== null ? formatScoreValue(parsedData.score) : '0'}</span>
                          {parsedData.maxScore !== null && (
                            <>
                              {' / '}
                              <span className="text-slate-400 font-mono">{formatScoreValue(parsedData.maxScore)}</span> diem
                            </>
                          )}
                          {parsedData.maxScore === null && ' diem'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 text-xs text-slate-400">
                    Chua co du lieu diem chi tiet cho tieu chi nay trong ket qua AI hien tai.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ?? JDOriginalPanel ??????????????????????????????????????????????????????????

interface JDOriginalPanelProps {
  jdText: string;
  rawJdText?: string;
}

const JDOriginalPanel: React.FC<JDOriginalPanelProps> = ({ jdText, rawJdText }) => {
  const hasRaw = !!rawJdText && rawJdText.trim().length > 0 && rawJdText.trim() !== jdText.trim();
  const [view, setView] = useState<'raw' | 'optimized'>('raw');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeText = hasRaw ? (view === 'raw' ? rawJdText! : jdText) : jdText;
  const wordCount = activeText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = activeText.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#05070b] shadow-sm overflow-hidden">
      {/* ── Header (luôn hiển thị) */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-800/30 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-file-lines text-indigo-400 text-sm" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Mô tả công việc (JD)
              {hasRaw && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                  Gốc + Tối ưu
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {charCount.toLocaleString('vi-VN')} ký tự · {wordCount.toLocaleString('vi-VN')} từ
              {!isOpen && ' · Nhấn để xem'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOpen && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); handleCopy(); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-700/60 hover:border-indigo-500/30 hover:bg-indigo-500/5"
            >
              <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`} />
              {copied ? 'Đã chép' : 'Sao chép'}
            </button>
          )}
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${isOpen ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-slate-700/60 bg-slate-800/40 group-hover:border-slate-600'
            }`}>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-500'
              }`} />
          </div>
        </div>
      </button>

      {/* ── Body */}
      {isOpen && (
        <div className="border-t border-slate-800/60">
          {/* Toggle tabs — chỉ hiện khi có 2 phiên bản */}
          {hasRaw && (
            <div className="flex border-b border-slate-800/60">
              <button
                onClick={() => setView('raw')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all relative ${view === 'raw'
                    ? 'text-amber-300 bg-amber-500/5'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                  }`}
              >
                {view === 'raw' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                )}
                <i className="fa-solid fa-file-pen text-[11px]" />
                JD Gốc
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${view === 'raw'
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-500'
                  }`}>
                  {rawJdText!.length.toLocaleString('vi-VN')} ký tự
                </span>
              </button>
              <div className="w-px bg-slate-800/60 my-1.5" />
              <button
                onClick={() => setView('optimized')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all relative ${view === 'optimized'
                    ? 'text-violet-300 bg-violet-500/5'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                  }`}
              >
                {view === 'optimized' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
                )}
                <i className="fa-solid fa-wand-magic-sparkles text-[11px]" />
                JD Tối ưu AI
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${view === 'optimized'
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                    : 'border-slate-700 bg-slate-800 text-slate-500'
                  }`}>
                  {jdText.length.toLocaleString('vi-VN')} ký tự
                </span>
              </button>
            </div>
          )}

          {/* Label khi chỉ có 1 phiên bản */}
          {!hasRaw && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/30 border-b border-slate-800/40">
              <i className="fa-solid fa-circle-info text-indigo-400/50 text-[10px]" />
              <span className="text-[10px] text-slate-600">Nội dung JD được dùng để phân tích</span>
            </div>
          )}

          {/* Content */}
          <div className="px-5 py-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans break-words">
              {activeText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ExpandedContent chính ───────────────────────────────────────────────────

interface ExpandedContentProps {
  candidate: Candidate;
  expandedCriteria: Record<string, Record<string, boolean>>;
  onToggleCriterion: (candidateId: string, criterion: string) => void;
  jdText: string;
  rawJdText?: string;
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ candidate, expandedCriteria, onToggleCriterion, jdText, rawJdText }) => {
  const analysisRecord = candidate.analysis as Record<string, unknown> | undefined;
  const allDetails = useMemo(() => {
    const rawDetails = analysisRecord ? getRawRecordValueByAliases(analysisRecord, ['chi tiet']) : undefined;

    return Array.isArray(rawDetails) ? rawDetails as DetailedScore[] : [];
  }, [analysisRecord]);

  const { loyaltyDetail, loyaltyDerivedFromBasic, basicDetails, supplementalDetails } = useMemo(() => {
    const basicMap = new Map<string, DetailedScore>();
    const supplementalMap = new Map<string, DetailedScore>();
    let loyaltyItem: DetailedScore | null = null;
    let loyaltyFallbackSource: DetailedScore | null = null;

    allDetails.forEach((item) => {
      const canonical = canonicalizeCriterionName(getDetailCriterion(item));
      if (!canonical) {
        return;
      }

      if (canonical === LOYALTY_CRITERION) {
        if (!loyaltyItem) {
          loyaltyItem = item;
        }
        return;
      }

      if (REMOVED_ADVANCED_CRITERIA.includes(canonical)) {
        return;
      }

      if (BASIC_CRITERIA.includes(canonical)) {
        if (canonical === BASIC_CRITERIA[7] && !loyaltyFallbackSource) {
          loyaltyFallbackSource = item;
        }
        if (!basicMap.has(canonical)) {
          basicMap.set(canonical, item);
        }
        return;
      }

      if (!supplementalMap.has(canonical)) {
        supplementalMap.set(canonical, item);
      }
    });

    const derivedFromBasic = !loyaltyItem && Boolean(loyaltyFallbackSource);
    if (!loyaltyItem && loyaltyFallbackSource) {
      loyaltyItem = buildSyntheticLoyaltyDetail(loyaltyFallbackSource);
    }

    return {
      loyaltyDetail: loyaltyItem,
      loyaltyDerivedFromBasic: derivedFromBasic,
      basicDetails: BASIC_CRITERIA
        .map((criterionName) => basicMap.get(criterionName))
        .filter((item): item is DetailedScore => Boolean(item)),
      supplementalDetails: Array.from(supplementalMap.values()),
    };
  }, [allDetails]);

  const basicScore = useMemo(() =>
    basicDetails.reduce((sum, item) => {
      const parsed = parseDetailScore(getDetailScore(item), getDetailFormula(item));
      return sum + (parsed.score || 0);
    }, 0),
    [basicDetails]
  );

  const loyaltyScore = useMemo(() => {
    if (!loyaltyDetail) {
      return 0;
    }

    const parsed = parseDetailScore(getDetailScore(loyaltyDetail), getDetailFormula(loyaltyDetail));
    return parsed.score || 0;
  }, [loyaltyDetail]);

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

    const loyaltyContribution = loyaltyDerivedFromBasic ? 0 : loyaltyScore;
    return Math.min(100, parseFloat((basicScore + loyaltyContribution).toFixed(1)));
  }, [analysisRecord, basicScore, loyaltyDerivedFromBasic, loyaltyScore]);

  const matchPercent = Math.min(100, Math.round(totalScore));
  const recommendation = totalScore >= 75
    ? 'Ung vien xuat sac, nen uu tien moi phong van som.'
    : totalScore >= 60
      ? 'Ung vien co nen tang tot, nen xem xet moi phong van.'
      : totalScore >= 40
        ? 'Ung vien co tiem nang, can nhac neu thieu nguon.'
        : 'Nen uu tien ung vien khac co muc phu hop cao hon.';

  return (
    <div className="space-y-4 p-2 md:p-4">

      {/* ── Tổng hợp đánh giá ─────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#05070b] p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <i className="fa-solid fa-chart-pie text-cyan-400" />
            Tong hop danh gia
          </h4>
          <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-4">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs">
              <div className="text-slate-500">Tong diem</div>
              <div className="font-semibold text-slate-100">{totalScore.toFixed(1)}<span className="text-slate-500">/100</span></div>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.045] px-3 py-2 text-xs">
              <div className="text-cyan-500/70">Cot loi</div>
              <div className="font-semibold text-cyan-300">{basicScore.toFixed(1)}<span className="text-slate-500">/{BASIC_TOTAL_MAX}</span></div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.045] px-3 py-2 text-xs">
              <div className="text-amber-400/70">Muc do trung thanh</div>
              <div className="font-semibold text-amber-300">{loyaltyScore.toFixed(1)}<span className="text-slate-500">/{LOYALTY_TOTAL_MAX}</span></div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs">
              <div className="text-slate-500">Phu hop JD</div>
              <div className="font-semibold text-emerald-400">{matchPercent}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-20 text-cyan-500/80">Cot loi</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (basicScore / BASIC_TOTAL_MAX) * 100)}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-cyan-400">{Math.round((basicScore / BASIC_TOTAL_MAX) * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-20 text-amber-400/80">Trung thanh</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (loyaltyScore / LOYALTY_TOTAL_MAX) * 100)}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-amber-400">{Math.round((loyaltyScore / LOYALTY_TOTAL_MAX) * 100)}%</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm">
          <span className="font-semibold text-slate-200">Nhan dinh:</span>{' '}
          <span className="text-slate-400">{recommendation}</span>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-[#030405] overflow-hidden">
        <div className="flex items-center justify-between border-b border-amber-500/15 px-4 py-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-amber-300">
            <i className="fa-solid fa-shield-halved text-base"></i>
            <span>Muc do trung thanh</span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">{LOYALTY_TOTAL_MAX} diem</span>
            {loyaltyDerivedFromBasic && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-300">
                Su dung tu Gan bo & Lich su CV
              </span>
            )}
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${loyaltyScore / LOYALTY_TOTAL_MAX >= 0.8 ? 'text-emerald-400' : loyaltyScore / LOYALTY_TOTAL_MAX >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{loyaltyScore.toFixed(1)}/{LOYALTY_TOTAL_MAX}</span>
        </div>
        <div className="p-4">
          {loyaltyDetail ? (
            <CriterionAccordion
              item={loyaltyDetail}
              isExpanded={!!expandedCriteria[candidate.id]?.[LOYALTY_CRITERION]}
              onToggle={() => onToggleCriterion(candidate.id, LOYALTY_CRITERION)}
              jdText={jdText}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <i className="fa-solid fa-shield-halved text-3xl mb-3 opacity-30"></i>
              <p className="text-sm">Chua co du lieu muc do trung thanh</p>
            </div>
          )}
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
      {candidate.analysis?.educationValidation && (
        <div className="rounded-xl border border-white/[0.08] bg-[#05070b] p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-100">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i> Xác thực học vấn
          </h4>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
            <p className="font-mono text-sm text-slate-300">{candidate.analysis.educationValidation.standardizedEducation || 'Không có thông tin'}</p>
            <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${candidate.analysis.educationValidation.validationNote === 'Hợp lệ' ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : 'border-red-500/35 bg-red-500/10 text-red-300'}`}>
              {candidate.analysis.educationValidation.validationNote}
            </span>
          </div>
        </div>
      )}

      {/* ── Mô tả công việc gốc / tối ưu ────────────────────── */}
      {jdText && jdText.trim().length > 0 && (
        <JDOriginalPanel jdText={jdText} rawJdText={rawJdText} />
      )}

      {/* ── Tab chuyển đổi Cơ bản / Nâng cao ───────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#030405] overflow-hidden">
        <div className="border-b border-white/[0.08] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-cyan-300">
            <i className="fa-solid fa-layer-group text-base"></i>
            <span>Tieu chi cot loi</span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{BASIC_TOTAL_MAX} diem</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${basicScore / BASIC_TOTAL_MAX >= 0.8 ? 'text-emerald-400' : basicScore / BASIC_TOTAL_MAX >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{basicScore.toFixed(1)}/{BASIC_TOTAL_MAX}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <i className="fa-solid fa-circle-info text-cyan-500/60 text-xs"></i>
            <p className="text-[11px] text-slate-500">
              {basicDetails.length} tieu chi hien thi ? {BASIC_CRITERIA.length} tieu chi cot loi ? Tong pho diem <span className="text-cyan-400 font-bold">{BASIC_TOTAL_MAX}</span> diem ? Danh gia nen tang ung vien
            </p>
          </div>

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
              <p className="text-sm">Chua co du lieu tieu chi cot loi</p>
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
