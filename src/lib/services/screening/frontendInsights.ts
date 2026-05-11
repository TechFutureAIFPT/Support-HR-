export interface CriterionRequirement {
  display: string;
  keywords: string[];
}

export interface RequirementComparison {
  jdKeywords: string[];
  matched: string[];
  missing: string[];
}

export interface ExperienceAnalysis {
  matchPercent: number | 'N/A';
  matched: string[];
  missing: string[];
}

const EXPERIENCE_TERMS = [
  'kinh nghiệm',
  'experience',
  'senior',
  'lead',
  'manager',
  'triển khai',
  'thực chiến',
];

const CRITERION_KEYWORDS: Record<string, string[]> = {
  'Phù hợp JD (Job Fit)': ['phù hợp', 'stack', 'framework', 'domain', 'jd', 'requirement'],
  'Kinh nghiệm': EXPERIENCE_TERMS,
  'Kỹ năng': ['skills', 'kỹ năng', 'technology', 'tool', 'framework'],
  'Thành tựu/KPI': ['kpi', '%', 'doanh thu', 'tăng trưởng', 'giảm', 'achievement'],
  'Học vấn': ['bachelor', 'master', 'degree', 'đại học', 'chứng chỉ'],
  'Ngôn ngữ': ['english', 'ielts', 'toeic', 'japanese', 'korean', 'giao tiếp'],
  'Chuyên nghiệp': ['cv', 'trình bày', 'format', 'liên hệ', 'portfolio'],
  'Gắn bó & Lịch sử CV': ['tenure', 'ổn định', 'gắn bó', 'career', 'promotion'],
  'Phù hợp văn hóa': ['teamwork', 'leadership', 'ownership', 'collaboration', 'agile'],
  'Hệ số uy tín công ty': ['google', 'microsoft', 'fpt', 'viettel', 'vin', 'bigtech'],
};

const STOPWORDS = new Set([
  'và',
  'là',
  'có',
  'cho',
  'với',
  'các',
  'được',
  'trong',
  'the',
  'and',
  'for',
  'that',
  'this',
  'your',
  'from',
  'years',
  'năm',
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9à-ỹđ#+./-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function extractJDRequirements(jdText: string): CriterionRequirement[] {
  const jdKeywords = unique(tokenize(jdText)).slice(0, 24);

  return Object.entries(CRITERION_KEYWORDS).map(([display, baseKeywords]) => ({
    display,
    keywords: unique([...baseKeywords, ...jdKeywords.filter((token) => baseKeywords.some((base) => token.includes(base) || base.includes(token)))]).slice(0, 12),
  }));
}

export function compareEvidence(_display: string, jdKeywords: string[], evidence: string): RequirementComparison {
  const lowerEvidence = normalize(evidence);
  const matched = jdKeywords.filter((keyword) => lowerEvidence.includes(keyword.toLowerCase()));
  const missing = jdKeywords.filter((keyword) => !matched.includes(keyword));

  return {
    jdKeywords,
    matched,
    missing,
  };
}

function extractYears(text: string): number[] {
  return Array.from(text.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:năm|years?)/gi))
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((value) => Number.isFinite(value));
}

export function analyzeExperience(jdText: string, evidence: string): ExperienceAnalysis {
  const jdYears = extractYears(jdText);
  const cvYears = extractYears(evidence);

  if (!jdYears.length) {
    return {
      matchPercent: 'N/A',
      matched: [],
      missing: [],
    };
  }

  const required = Math.max(...jdYears);
  const current = cvYears.length ? Math.max(...cvYears) : 0;
  const ratio = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;

  const matched: string[] = [];
  const missing: string[] = [];

  if (current >= required) {
    matched.push(`${current}+ năm so với yêu cầu ${required}+ năm`);
  } else {
    matched.push(`${current}+ năm kinh nghiệm thể hiện trong CV`);
    missing.push(`Thiếu khoảng ${Math.max(0, required - current)} năm so với JD`);
  }

  EXPERIENCE_TERMS.forEach((term) => {
    if (normalize(evidence).includes(term)) matched.push(term);
    else if (normalize(jdText).includes(term)) missing.push(term);
  });

  return {
    matchPercent: ratio,
    matched: unique(matched),
    missing: unique(missing),
  };
}
