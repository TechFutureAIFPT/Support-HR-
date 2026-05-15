export interface CriterionRequirement {
  display: string;
  keywords: string[];
}

export interface RequirementComparison {
  jdKeywords: string[];
  matched: string[];
  semanticMatched: SemanticMatch[];
  missing: string[];
}

export interface SemanticMatch {
  keyword: string;
  reason: string;
  evidence: string;
  score: number;
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

function normalizeSemantic(text: string): string {
  return normalize(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
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

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeSemantic(term)));
}

function cosineSimilarity(left: number[], right: number[]): number {
  const dot = left.reduce((sum, value, index) => sum + value * (right[index] || 0), 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  if (!leftNorm || !rightNorm) return 0;
  return dot / (leftNorm * rightNorm);
}

function buildSemanticVector(text: string): number[] {
  const normalized = normalizeSemantic(text);
  return [
    hasAny(normalized, ['%', 'phan tram', 'percent', '20%', '30%']) ? 1 : 0,
    hasAny(normalized, ['giam', 'tiet kiem', 'toi uu', 'rut ngan', 'cai thien', 'tang', 'nang']) ? 1 : 0,
    hasAny(normalized, ['truy van', 'query', 'latency', 'response time', 'database', 'sql', 'api', 'hieu suat', 'toc do']) ? 1 : 0,
    hasAny(normalized, ['kpi', 'chi so', 'metric', 'sla', 'okr', 'hieu qua']) ? 1 : 0,
    hasAny(normalized, ['doanh thu', 'revenue', 'sales', 'conversion', 'tang truong', 'growth', 'business']) ? 1 : 0,
    hasAny(normalized, ['quan ly nhom', 'team', 'leader', 'leadership', '5 nguoi', 'nhom']) ? 1 : 0,
  ];
}

function getBestEvidenceSentence(evidence: string): string {
  const sentences = evidence
    .split(/(?<=[.!?。])\s+|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: buildSemanticVector(sentence).reduce((sum, value) => sum + value, 0),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.sentence || evidence.trim();
}

function getSemanticReason(keyword: string, evidence: string): SemanticMatch | null {
  const normalizedKeyword = normalizeSemantic(keyword);
  const normalizedEvidence = normalizeSemantic(evidence);
  const bestEvidence = getBestEvidenceSentence(evidence);
  const evidenceVector = buildSemanticVector(evidence);

  const hasQuantifiedImprovement =
    /\d+(?:[.,]\d+)?\s*%/.test(evidence) &&
    hasAny(normalizedEvidence, ['giam', 'tang', 'toi uu', 'rut ngan', 'cai thien', 'tiet kiem', 'nang']) &&
    hasAny(normalizedEvidence, ['truy van', 'query', 'thoi gian', 'latency', 'toc do', 'hieu suat', 'sql', 'database', 'api']);

  const semanticKeywordVectors: Array<{
    keywords: string[];
    vector: number[];
    reason: string;
    minimumScore: number;
  }> = [
    {
      keywords: ['kpi', 'metric', 'chi so'],
      vector: [1, 1, 1, 1, 0, 0],
      reason: 'Vector embedding nhận diện đây là KPI vận hành/hiệu suất vì có cải thiện định lượng theo phần trăm.',
      minimumScore: 0.55,
    },
    {
      keywords: ['achievement', 'thanh tuu', 'thành tựu'],
      vector: [1, 1, 1, 0, 0, 0],
      reason: 'Có thành tựu định lượng rõ: cải thiện hiệu suất/thời gian xử lý bằng con số phần trăm.',
      minimumScore: 0.55,
    },
    {
      keywords: ['tang truong', 'tăng trưởng', 'growth'],
      vector: [1, 1, 1, 0, 1, 0],
      reason: 'Cải thiện tốc độ truy vấn là tín hiệu tăng trưởng năng lực hệ thống, hỗ trợ KPI sản phẩm/kinh doanh.',
      minimumScore: 0.5,
    },
    {
      keywords: ['doanh thu', 'revenue'],
      vector: [1, 1, 1, 0, 1, 0],
      reason: 'Suy luận tác động kinh doanh gián tiếp: truy vấn nhanh hơn giúp tăng hiệu quả vận hành, trải nghiệm và khả năng hỗ trợ doanh thu.',
      minimumScore: 0.5,
    },
  ];

  if (!hasQuantifiedImprovement) return null;

  for (const item of semanticKeywordVectors) {
    if (!item.keywords.some((candidate) => normalizedKeyword.includes(normalizeSemantic(candidate)))) {
      continue;
    }

    const score = cosineSimilarity(evidenceVector, item.vector);
    if (score >= item.minimumScore) {
      return {
        keyword,
        reason: item.reason,
        evidence: bestEvidence,
        score,
      };
    }
  }

  return null;
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
  const semanticMatched = jdKeywords
    .filter((keyword) => !matched.includes(keyword))
    .map((keyword) => getSemanticReason(keyword, evidence))
    .filter((item): item is SemanticMatch => Boolean(item));
  const semanticMatchedKeywords = new Set(semanticMatched.map((item) => item.keyword));
  const missing = jdKeywords.filter((keyword) => !matched.includes(keyword) && !semanticMatchedKeywords.has(keyword));

  return {
    jdKeywords,
    matched,
    semanticMatched,
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
