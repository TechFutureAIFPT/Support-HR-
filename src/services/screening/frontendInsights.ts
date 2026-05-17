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
  'Ngôn ngữ': ['english', 'ielts', 'toeic', 'toefl', 'japanese', 'jlpt', 'korean', 'topik', 'giao tiếp'],
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
  'va',
  'la',
  'co',
  'voi',
  'cac',
  'duoc',
  'nam',
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeSemantic(text: string): string {
  return normalize(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

function tokenize(text: string): string[] {
  return normalizeSemantic(text)
    .split(/[^a-z0-9#+./-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeSemantic(term)));
}

const KEYWORD_ALIASES: Record<string, string[]> = {
  english: ['english', 'tieng anh', 'anh van'],
  ielts: ['ielts'],
  toeic: ['toeic'],
  toefl: ['toefl'],
  japanese: ['japanese', 'tieng nhat', 'nhat ngu', 'jlpt', 'n1', 'n2', 'n3', 'n4', 'n5'],
  jlpt: ['jlpt', 'n1', 'n2', 'n3', 'n4', 'n5'],
  korean: ['korean', 'tieng han', 'han ngu', 'topik'],
  topik: ['topik'],
  'giao tiep': ['giao tiep', 'communication'],
};

const NEGATION_TERMS = ['khong co', 'khong dat', 'chua co', 'chua dat', 'khong biet', 'no', 'not', 'without'];

function aliasesFor(keyword: string): string[] {
  const normalized = normalizeSemantic(keyword);
  return KEYWORD_ALIASES[normalized] || [normalized];
}

function containsAlias(normalizedText: string, keyword: string): boolean {
  return aliasesFor(keyword).some((alias) => alias && normalizedText.includes(alias));
}

function isNegatedKeyword(text: string, keyword: string): boolean {
  const normalizedText = ` ${normalizeSemantic(text)} `;
  return aliasesFor(keyword).some((alias) => {
    const index = normalizedText.indexOf(alias);
    if (index < 0) return false;
    const prefix = normalizedText.slice(Math.max(0, index - 36), index);
    return NEGATION_TERMS.some((term) => prefix.includes(term));
  });
}

function keywordAppearsInRequirement(text: string, keyword: string): boolean {
  return containsAlias(` ${normalizeSemantic(text)} `, keyword);
}

function keywordAppearsInEvidence(text: string, keyword: string): boolean {
  return containsAlias(` ${normalizeSemantic(text)} `, keyword) && !isNegatedKeyword(text, keyword);
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
    hasAny(normalized, ['%', 'phan tram', 'percent', 'nam', 'years', 'year']) ? 1 : 0,
    hasAny(normalized, ['giam', 'tiet kiem', 'toi uu', 'rut ngan', 'cai thien', 'tang', 'nang', 'trien khai', 'xay dung', 'dat', 'hoan thanh']) ? 1 : 0,
    hasAny(normalized, ['truy van', 'query', 'latency', 'response time', 'database', 'sql', 'api', 'hieu suat', 'toc do', 'performance', 'backend', 'frontend']) ? 1 : 0,
    hasAny(normalized, ['kpi', 'chi so', 'metric', 'sla', 'okr', 'hieu qua', 'doanh thu', 'revenue', 'sales', 'conversion', 'tang truong', 'growth', 'business']) ? 1 : 0,
    hasAny(normalized, ['java', 'spring', 'node', 'react', 'docker', 'mysql', 'postgres', 'mongodb', 'redis', 'aws', 'microservice', 'framework', 'tool', 'stack']) ? 1 : 0,
    hasAny(normalized, ['dai hoc', 'university', 'college', 'bachelor', 'master', 'degree', 'chung chi', 'certification', 'aws certified', 'pmp']) ? 1 : 0,
    hasAny(normalized, ['english', 'ielts', 'toeic', 'toefl', 'japanese', 'korean', 'giao tiep', 'ngoai ngu', 'language']) ? 1 : 0,
    hasAny(normalized, ['portfolio', 'github', 'linkedin', 'cv', 'format', 'trinh bay', 'lien he', 'email', 'phone']) ? 1 : 0,
    hasAny(normalized, ['gan bo', 'on dinh', 'tenure', 'career', 'promotion', 'hien tai', 'present', 'cong ty', 'company']) ? 1 : 0,
    hasAny(normalized, ['teamwork', 'leadership', 'ownership', 'collaboration', 'agile', 'scrum', 'mentor', 'nhom', 'phoi hop']) ? 1 : 0,
    hasAny(normalized, ['google', 'microsoft', 'amazon', 'meta', 'fpt', 'viettel', 'vin', 'vng', 'tiki', 'shopee', 'bigtech']) ? 1 : 0,
    hasAny(normalized, ['quan ly nhom', 'lead', 'leader', 'manager', 'mentor', '5 nguoi', 'nhom']) ? 1 : 0,
  ];
}

interface SemanticRule {
  keywords: string[];
  vector: number[];
  reason: string;
  minimumScore: number;
  evidenceTerms?: string[];
  requiresQuantifiedImpact?: boolean;
}

const SEMANTIC_RULES: SemanticRule[] = [
  {
    keywords: ['kpi', 'metric', 'chi so'],
    vector: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    reason: 'Có cải thiện định lượng, nên được tính là KPI vận hành/hiệu suất.',
    minimumScore: 0.5,
    requiresQuantifiedImpact: true,
  },
  {
    keywords: ['achievement', 'thanh tuu'],
    vector: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    reason: 'Có kết quả đo được bằng số, đủ xem là thành tựu thực tế.',
    minimumScore: 0.5,
    requiresQuantifiedImpact: true,
  },
  {
    keywords: ['tang truong', 'growth'],
    vector: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    reason: 'Cải thiện hiệu suất hỗ trợ tăng trưởng năng lực hệ thống và KPI sản phẩm.',
    minimumScore: 0.48,
    requiresQuantifiedImpact: true,
  },
  {
    keywords: ['doanh thu', 'revenue'],
    vector: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    reason: 'Tác động doanh thu là gián tiếp: hệ thống nhanh hơn giúp vận hành và trải nghiệm tốt hơn.',
    minimumScore: 0.48,
    requiresQuantifiedImpact: true,
  },
  {
    keywords: ['skills', 'ky nang', 'technology', 'tool', 'framework', 'stack'],
    vector: [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    reason: 'Dẫn chứng có công nghệ/công cụ và ngữ cảnh sử dụng thực tế.',
    minimumScore: 0.42,
    evidenceTerms: ['java', 'spring', 'node', 'react', 'docker', 'sql', 'api', 'framework', 'tool', 'stack', 'database'],
  },
  {
    keywords: ['phu hop', 'jd', 'requirement', 'domain'],
    vector: [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    reason: 'Có tín hiệu khớp vai trò qua stack, domain hoặc nhiệm vụ tương tự JD.',
    minimumScore: 0.42,
    evidenceTerms: ['java', 'spring', 'node', 'react', 'api', 'backend', 'frontend', 'domain', 'du an', 'trien khai'],
  },
  {
    keywords: ['experience', 'kinh nghiem', 'senior', 'lead', 'manager', 'trien khai', 'thuc chien'],
    vector: [1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    reason: 'Có dấu hiệu thời lượng, vai trò hoặc triển khai thực tế.',
    minimumScore: 0.38,
    evidenceTerms: ['nam', 'years', 'senior', 'lead', 'manager', 'trien khai', 'du an', 'thuc chien', 'cong ty'],
  },
  {
    keywords: ['bachelor', 'master', 'degree', 'dai hoc', 'chung chi'],
    vector: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    reason: 'Có cơ sở đào tạo, bằng cấp hoặc chứng chỉ liên quan.',
    minimumScore: 0.45,
    evidenceTerms: ['dai hoc', 'university', 'bachelor', 'master', 'degree', 'chung chi', 'certification'],
  },
  {
    keywords: ['english', 'ielts', 'toeic', 'toefl', 'japanese', 'jlpt', 'korean', 'topik', 'giao tiep'],
    vector: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    reason: 'Có tín hiệu ngoại ngữ hoặc khả năng giao tiếp liên quan.',
    minimumScore: 0.45,
    evidenceTerms: ['english', 'tieng anh', 'ielts', 'toeic', 'toefl', 'japanese', 'tieng nhat', 'jlpt', 'korean', 'tieng han', 'topik', 'giao tiep', 'ngoai ngu'],
  },
  {
    keywords: ['cv', 'trinh bay', 'format', 'lien he', 'portfolio'],
    vector: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    reason: 'Có tín hiệu trình bày, hồ sơ hoặc kênh xác thực chuyên nghiệp.',
    minimumScore: 0.45,
    evidenceTerms: ['cv', 'portfolio', 'github', 'linkedin', 'format', 'trinh bay', 'email', 'phone'],
  },
  {
    keywords: ['tenure', 'on dinh', 'gan bo', 'career', 'promotion'],
    vector: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    reason: 'Có mốc làm việc/công ty, đủ để đánh giá độ ổn định nghề nghiệp.',
    minimumScore: 0.45,
    evidenceTerms: ['nam', 'years', 'cong ty', 'company', 'hien tai', 'present', 'promotion', 'gan bo'],
  },
  {
    keywords: ['teamwork', 'leadership', 'ownership', 'collaboration', 'agile'],
    vector: [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    reason: 'Có tín hiệu làm việc nhóm, phối hợp hoặc vai trò dẫn dắt.',
    minimumScore: 0.42,
    evidenceTerms: ['team', 'nhom', 'lead', 'leader', 'mentor', 'ownership', 'collaboration', 'agile', 'scrum'],
  },
  {
    keywords: ['google', 'microsoft', 'fpt', 'viettel', 'vin', 'bigtech'],
    vector: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    reason: 'Có tên công ty/tổ chức thuộc nhóm uy tín hoặc dễ xác thực.',
    minimumScore: 0.45,
    evidenceTerms: ['google', 'microsoft', 'amazon', 'meta', 'fpt', 'viettel', 'vin', 'vng', 'tiki', 'shopee'],
  },
];

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

  for (const item of SEMANTIC_RULES) {
    if (!item.keywords.some((candidate) => normalizedKeyword.includes(normalizeSemantic(candidate)))) {
      continue;
    }

    if (item.requiresQuantifiedImpact && !hasQuantifiedImprovement) {
      continue;
    }

    if (item.evidenceTerms && !hasAny(normalizedEvidence, item.evidenceTerms)) {
      continue;
    }

    const score = cosineSimilarity(evidenceVector, item.vector);
    if (score >= item.minimumScore) {
      return {
        keyword,
        reason: item.reason,
        evidence: bestEvidence,
        score: Math.min(0.96, Math.max(score, item.minimumScore)),
      };
    }
  }

  return null;
}

export function extractJDRequirements(jdText: string): CriterionRequirement[] {
  const jdKeywords = unique(tokenize(jdText)).slice(0, 24);

  return Object.entries(CRITERION_KEYWORDS).map(([display, baseKeywords]) => {
    const explicitBaseKeywords = baseKeywords.filter((keyword) => keywordAppearsInRequirement(jdText, keyword));
    const relatedTokens = jdKeywords.filter((token) =>
      explicitBaseKeywords.some((base) =>
        aliasesFor(base).some((alias) => token.includes(alias) || alias.includes(token))
      )
    );

    return {
      display,
      keywords: unique([...explicitBaseKeywords, ...relatedTokens]).slice(0, 12),
    };
  });
}

export function compareEvidence(_display: string, jdKeywords: string[], evidence: string): RequirementComparison {
  const matched = jdKeywords.filter((keyword) => keywordAppearsInEvidence(evidence, keyword));
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
