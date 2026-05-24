import type { Candidate, DetailedScore, HardFilters, WeightCriteria, AnalysisRunData } from '@/types';
import { apiGet, apiPost, pickArray } from '@/services/api/renderClient';
import { analysisCacheService } from '@/services/history-cache/analysisCache';
import { UploadedFilesService } from '@/services/data-sync/uploadedFilesService';
import { extractTextFromFile } from '@/services/file-processing/ocrService';
import { auth } from '@/services/firebase';
import { getSafeErrorMessage, sanitizeApiErrorMessage, SAFE_ERROR_MESSAGES } from '@/utils/errorMessages';

const RENDER_CHAT_MODEL = 'gemini-2.0-flash';

export interface ScreeningProgress {
  status: 'progress';
  message: string;
}

export interface ChatbotAdviceResult {
  responseText: string;
  candidateIds: string[];
}

interface CandidateAnalysis {
  'Tổng điểm': number;
  'Hạng': 'A' | 'B' | 'C';
  'Chi tiết': DetailedScore[];
  'Điểm mạnh CV'?: string[];
  'Điểm yếu CV'?: string[];
  educationValidation?: {
    standardizedEducation: string;
    validationNote: string;
    warnings?: string[];
  };
  softSkillsReport?: Record<string, unknown>;
  feedbackAdjusted?: number;
}

interface CoreAnalysisResponse {
  candidates?: unknown[];
  pipeline?: Record<string, unknown>;
}

interface AnalysisJobAcceptedResponse {
  job_id?: string;
  status?: 'processing';
  status_url?: string;
}

interface AnalysisJobStatusResponse {
  job_id?: string;
  status?: 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  result?: CoreAnalysisResponse;
  error?: string | null;
}

interface JdStructureResponse {
  structured_text?: string;
}

interface JdPositionResponse {
  job_position?: string;
}

interface JdHardFiltersResponse {
  filters?: Record<string, string>;
}

interface BackendChatResponse {
  text?: unknown;
  responseText?: unknown;
  candidateIds?: unknown;
}

const ANALYSIS_JOB_POLL_INTERVAL_MS = 2500;
const ANALYSIS_JOB_TIMEOUT_MS = 20 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function pollAnalysisJob(jobId: string): Promise<CoreAnalysisResponse> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < ANALYSIS_JOB_TIMEOUT_MS) {
    const statusResponse = await apiGet<AnalysisJobStatusResponse>(
      `/api/analysis/status/${encodeURIComponent(jobId)}`,
      {
        timeoutMs: 30000,
        authRequired: Boolean(auth.currentUser),
      }
    );

    if (statusResponse.status === 'completed') {
      return statusResponse.result || { candidates: [] };
    }

    if (statusResponse.status === 'failed') {
      throw new Error(statusResponse.error || 'Phân tích CV thất bại.');
    }

    await sleep(ANALYSIS_JOB_POLL_INTERVAL_MS);
  }

  throw new Error('Quá thời gian chờ phân tích CV. Vui lòng thử lại.');
}

async function runCoreAnalysis(payload: {
  jd_text: string;
  weights: WeightCriteria;
  hard_filters: Record<string, unknown>;
  cv_entries: Array<{ file_name: string; text: string }>;
}): Promise<CoreAnalysisResponse> {
  const requestOptions = {
    timeoutMs: 30000,
    authRequired: Boolean(auth.currentUser),
  };
  let accepted: AnalysisJobAcceptedResponse | null = null;
  try {
    accepted = await apiPost<AnalysisJobAcceptedResponse>('/api/cv/analyze-core-async', payload, requestOptions);
  } catch (error) {
    console.warn('Async CV analysis route unavailable, falling back to sync route:', error);
    return apiPost<CoreAnalysisResponse>('/api/cv/analyze-core', payload, {
      timeoutMs: 120000,
      authRequired: Boolean(auth.currentUser),
    });
  }

  const jobId = String(accepted?.job_id || '').trim();
  if (jobId) {
    return pollAnalysisJob(jobId);
  }

  return apiPost<CoreAnalysisResponse>('/api/cv/analyze-core', payload, {
    timeoutMs: 120000,
    authRequired: Boolean(auth.currentUser),
  });
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === 'string' ? [item.trim()] : []))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|•|- /g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeBreakdownQuality(value: unknown): 'strong' | 'partial' | 'weak' | 'missing' {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'strong' || normalized === 'partial' || normalized === 'weak'
    ? normalized
    : 'missing';
}

function normalizeAdvancedBreakdown(value: unknown): DetailedScore['advancedBreakdown'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const keywordMetrics = (record.keyword_metrics || record.keywordMetrics) as Record<string, unknown> | undefined;
  const keywordRows = Array.isArray(keywordMetrics?.keywords_list || keywordMetrics?.keywordsList)
    ? (keywordMetrics?.keywords_list || keywordMetrics?.keywordsList) as unknown[]
    : [];

  return {
    max_possible_score: Number(record.max_possible_score || record.maxPossibleScore || 0),
    raw_score_earned: Number(record.raw_score_earned || record.rawScoreEarned || 0),
    mathematical_formula: String(record.mathematical_formula || record.mathematicalFormula || ''),
    deductions: Array.isArray(record.deductions)
      ? record.deductions
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          reason: String(item.reason || ''),
          points_lost: Number(item.points_lost || item.pointsLost || 0),
        }))
      : [],
    bonuses_earned: toArray(record.bonuses_earned || record.bonusesEarned),
    keyword_metrics: {
      total_required_keywords: Number(keywordMetrics?.total_required_keywords || keywordMetrics?.totalRequiredKeywords || 0),
      matched_keywords_count: Number(keywordMetrics?.matched_keywords_count || keywordMetrics?.matchedKeywordsCount || 0),
      match_percentage: Number(keywordMetrics?.match_percentage || keywordMetrics?.matchPercentage || 0),
      keywords_list: keywordRows
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          keyword: String(item.keyword || ''),
          status: item.status === 'matched' ? 'matched' as const : 'missing' as const,
          context_sentence: String(item.context_sentence || item.contextSentence || ''),
        }))
        .filter((item) => item.keyword),
    },
    verdict: normalizeBreakdownQuality(record.verdict),
    evidence_quality: normalizeBreakdownQuality(record.evidence_quality || record.evidenceQuality),
    matched_signals: toArray(record.matched_signals || record.matchedSignals),
    missing_requirements: toArray(record.missing_requirements || record.missingRequirements),
    evidence_highlights: toArray(record.evidence_highlights || record.evidenceHighlights),
    improvement_suggestion: String(record.improvement_suggestion || record.improvementSuggestion || ''),
    quality_flags: toArray(record.quality_flags || record.qualityFlags),
  };
}

function normalizeDetail(detail: unknown): DetailedScore {
  const record = (detail && typeof detail === 'object') ? detail as Record<string, unknown> : {};

  return {
    'Tiêu chí': String(record['Tiêu chí'] || record['Tieu chi'] || record['TiÃªu chÃ­'] || 'Tiêu chí'),
    'Điểm': String(record['Điểm'] || record['Diem'] || record['Äiá»ƒm'] || ''),
    'Công thức': String(record['Công thức'] || record['Cong thuc'] || record['CÃ´ng thá»©c'] || ''),
    'Dẫn chứng': String(record['Dẫn chứng'] || record['Dan chung'] || record['Dáº«n chá»©ng'] || ''),
    'Giải thích': String(record['Giải thích'] || record['Giai thich'] || record['Giáº£i thÃ­ch'] || ''),
    advancedBreakdown: normalizeAdvancedBreakdown(record.advancedBreakdown || record.advanced_breakdown),
  };
}

function normalizeEducationValidation(value: unknown): CandidateAnalysis['educationValidation'] | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return {
      standardizedEducation: value,
      validationNote: value,
    };
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    return {
      standardizedEducation: String(
        record.standardizedEducation ||
        record.standardized_education ||
        'Chưa có dữ liệu'
      ),
      validationNote: String(
        record.validationNote ||
        record.validation_note ||
        'Chưa có dữ liệu'
      ),
      warnings: toArray(record.warnings),
    };
  }

  return undefined;
}

function normalizeEmbeddingInsight(value: unknown): Candidate['embeddingInsights'] | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  const topMatches = Array.isArray(record.topMatches)
    ? record.topMatches
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        id: String(item.id || ''),
        name: item.name ? String(item.name) : undefined,
        role: item.role ? String(item.role) : undefined,
        similarity: Number(item.similarity || 0),
        relativePath: item.relativePath ? String(item.relativePath) : undefined,
      }))
    : [];

  return {
    industry: String(record.industry || ''),
    provider: record.provider ? String(record.provider) : undefined,
    collectionKey: record.collectionKey ? String(record.collectionKey) : undefined,
    queryModel: record.queryModel ? String(record.queryModel) : undefined,
    recordCount: typeof record.recordCount === 'number' ? record.recordCount : Number(record.recordCount || 0),
    averageSimilarity: Number(record.averageSimilarity || 0),
    topMatches,
    bonusPoints: Number(record.bonusPoints || 0),
  };
}

function normalizeJdCvEvidenceMatches(value: unknown): NonNullable<Candidate['jdCvMatchInsights']>['evidenceMatches'] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      section: item.section ? String(item.section) : undefined,
      requirement: String(item.requirement || item.jdRequirement || item.keyword || item.skill || ''),
      jdEvidence: String(item.jdEvidence || item.jd_evidence || item.jdText || item.jdSnippet || item.requirementEvidence || ''),
      cvEvidence: String(item.cvEvidence || item.cv_evidence || item.cvText || item.cvSnippet || item.candidateEvidence || ''),
      matchType: item.matchType || item.match_type ? String(item.matchType || item.match_type) : undefined,
      score: item.score !== undefined || item.similarity !== undefined || item.confidence !== undefined
        ? Number(item.score ?? item.similarity ?? item.confidence)
        : undefined,
      reason: item.reason || item.explanation ? String(item.reason || item.explanation) : undefined,
    }))
    .filter((item) => item.requirement || item.jdEvidence || item.cvEvidence);
}

function normalizeJdCvMatchInsights(value: unknown): Candidate['jdCvMatchInsights'] | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  const evidenceMatches = normalizeJdCvEvidenceMatches(
    record.evidenceMatches || record.evidence_matches || record.matchEvidence || record.match_evidence || record.evidencePairs || record.evidence_pairs
  );

  return {
    similarity: Number(record.similarity || 0),
    weightedScore: Number(record.weightedScore || 0),
    semanticWeightedScore: record.semanticWeightedScore !== undefined ? Number(record.semanticWeightedScore) : undefined,
    maxScore: Number(record.maxScore || 0),
    queryModel: record.queryModel ? String(record.queryModel) : undefined,
    roleKey: record.roleKey ? String(record.roleKey) : undefined,
    roleLabel: record.roleLabel ? String(record.roleLabel) : undefined,
    matchedSkills: toArray(record.matchedSkills),
    missingSkills: toArray(record.missingSkills),
    transferMatches: toArray(record.transferMatches),
    matchedRequirements: toArray(record.matchedRequirements),
    missingRequirements: toArray(record.missingRequirements),
    uiSections: toArray(record.uiSections),
    evidenceMatches,
  };
}

function normalizeAscii(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function inferLocationFromText(text?: string): string {
  const normalized = normalizeAscii(text || '');
  if (!normalized) return '';

  const locationPatterns: Array<[string, string[]]> = [
    ['Remote', ['remote', 'work from home', 'wfh', 'lam viec tu xa', 'tu xa']],
    ['Hà Nội', ['ha noi', 'hanoi']],
    ['TP. Hồ Chí Minh', ['ho chi minh', 'hcm', 'tp hcm', 'tphcm', 'sai gon', 'saigon']],
    ['Đà Nẵng', ['da nang', 'danang']],
    ['Hải Phòng', ['hai phong', 'haiphong']],
  ];

  for (const [label, patterns] of locationPatterns) {
    if (patterns.some((pattern) => normalized.includes(pattern))) {
      return label;
    }
  }

  return '';
}

function parseDetailScore(scoreText: string): number {
  const match = String(scoreText || '').match(/([+-]?\d+(?:\.\d+)?)\s*(?:\/|$)/);
  return match ? Number(match[1]) || 0 : 0;
}

function scoreFromDetails(details: DetailedScore[]): number {
  return details.reduce((sum, detail) => sum + parseDetailScore(detail['Điểm']), 0);
}

function normalizeAnalysis(rawAnalysis: unknown): CandidateAnalysis | undefined {
  if (!rawAnalysis || typeof rawAnalysis !== 'object') return undefined;

  const analysis = rawAnalysis as Record<string, unknown>;
  const totalScoreRaw = analysis['Tổng điểm'] ?? analysis['Tong diem'] ?? analysis['Tá»•ng Ä‘iá»ƒm'] ?? 0;
  const gradeRaw = analysis['Hạng'] ?? analysis['Hang'] ?? analysis['Háº¡ng'] ?? 'C';
  const detailsRaw = analysis['Chi tiết'] ?? analysis['Chi tiet'] ?? analysis['Chi tiáº¿t'] ?? [];
  const details = Array.isArray(detailsRaw) ? detailsRaw.map(normalizeDetail) : [];
  const detailFallbackScore = scoreFromDetails(details);
  const totalScore = Number(totalScoreRaw) || (detailFallbackScore > 0 ? Math.min(100, Math.round(detailFallbackScore * 10) / 10) : 0);
  const computedGrade = totalScore >= 75 ? 'A' : totalScore >= 50 ? 'B' : 'C';
  const normalizedGrade = String(gradeRaw).toUpperCase();

  return {
    'Tổng điểm': totalScore,
    'Hạng': (normalizedGrade === 'A' || normalizedGrade === 'B' || normalizedGrade === 'C' ? normalizedGrade : computedGrade) as 'A' | 'B' | 'C',
    'Chi tiết': details,
    'Điểm mạnh CV': toArray(analysis['Điểm mạnh CV'] ?? analysis['Diem manh CV'] ?? analysis['Äiá»ƒm máº¡nh CV']),
    'Điểm yếu CV': toArray(analysis['Điểm yếu CV'] ?? analysis['Diem yeu CV'] ?? analysis['Äiá»ƒm yáº¿u CV']),
    educationValidation: normalizeEducationValidation(
      analysis.educationValidation ?? analysis['educationValidation']
    ),
    softSkillsReport: (analysis.softSkillsReport && typeof analysis.softSkillsReport === 'object')
      ? analysis.softSkillsReport as Record<string, unknown>
      : undefined,
    feedbackAdjusted: typeof analysis.feedbackAdjusted === 'number' ? analysis.feedbackAdjusted : undefined,
  };
}

function normalizeCandidate(rawCandidate: unknown, fallbackFile?: File, cvText?: string): Candidate {
  const candidate = (rawCandidate && typeof rawCandidate === 'object') ? rawCandidate as Record<string, unknown> : {};
  const fileName = String(candidate.fileName || fallbackFile?.name || 'unknown');
  const candidateName = String(candidate.candidateName || fileName.replace(/\.[^.]+$/, ''));
  const embeddedCvText = typeof candidate._cvText === 'string' && candidate._cvText.trim()
    ? candidate._cvText.trim()
    : undefined;
  const effectiveCvText = cvText?.trim() || embeddedCvText;
  const rawPayload = effectiveCvText
    ? { ...candidate, cvText: effectiveCvText, _cvText: effectiveCvText }
    : rawCandidate;
  const detectedLocation = String(candidate.detectedLocation || '').trim() || inferLocationFromText(effectiveCvText);
  const normalizedAnalysis = normalizeAnalysis(candidate.analysis) as Candidate['analysis'];
  const hasRecoverableAnalysis = Boolean(
    normalizedAnalysis &&
    normalizedAnalysis['Tổng điểm'] > 0 &&
    (normalizedAnalysis['Chi tiết']?.length || 0) > 0
  );
  const normalizedStatus = candidate.status === 'FAILED' && !hasRecoverableAnalysis ? 'FAILED' : 'SUCCESS';

  return {
    id: String(candidate.id || `${fileName}-${candidateName}`),
    candidateName,
    fileName,
    phone: candidate.phone ? String(candidate.phone) : undefined,
    email: candidate.email ? String(candidate.email) : undefined,
    jobTitle: String(candidate.jobTitle || ''),
    industry: String(candidate.industry || ''),
    department: String(candidate.department || ''),
    experienceLevel: String(candidate.experienceLevel || ''),
    hardFilterFailureReason: candidate.hardFilterFailureReason ? String(candidate.hardFilterFailureReason) : undefined,
    softFilterWarnings: Array.isArray(candidate.softFilterWarnings)
      ? candidate.softFilterWarnings.map((warning) => String(warning))
      : [],
    detectedLocation,
    detectedLocationSource: candidate.detectedLocationSource ? String(candidate.detectedLocationSource) : undefined,
    locationMatch: typeof candidate.locationMatch === 'boolean' ? candidate.locationMatch : null,
    embeddingInsights: normalizeEmbeddingInsight(candidate.embeddingInsights),
    jdCvMatchInsights: normalizeJdCvMatchInsights(candidate.jdCvMatchInsights),
    analysis: normalizedAnalysis,
    debiasingWarnings: Array.isArray(candidate.debiasingWarnings)
      ? candidate.debiasingWarnings.map((warning) => String(warning))
      : undefined,
    status: normalizedStatus,
    error: normalizedStatus === 'FAILED' && candidate.error ? sanitizeApiErrorMessage(String(candidate.error), SAFE_ERROR_MESSAGES.ai) : undefined,
    _rawBatchJson: JSON.stringify(rawPayload),
    _cvText: effectiveCvText,
  };
}

function serializeHardFilters(hardFilters: HardFilters): Record<string, unknown> {
  return { ...hardFilters };
}

function extractJsonBlock(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const objectMatch = text.match(/\{[\s\S]*\}/);
  return objectMatch?.[0]?.trim() || null;
}

function stripMarkdownCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json|md|markdown|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseChatbotPayload(text: string): Record<string, unknown> | null {
  const jsonBlock = extractJsonBlock(text);
  if (!jsonBlock) return null;

  try {
    const parsed = JSON.parse(jsonBlock);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function normalizeChatbotResponseText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((part) => normalizeChatbotResponseText(part))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const parsedPayload = parseChatbotPayload(trimmed);
    if (parsedPayload) {
      const nestedText = parsedPayload.responseText
        ?? parsedPayload.text
        ?? parsedPayload.message
        ?? parsedPayload.content;
      const normalizedNestedText = normalizeChatbotResponseText(nestedText);
      if (normalizedNestedText) return normalizedNestedText;
    }

    return stripMarkdownCodeFence(trimmed);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return normalizeChatbotResponseText(
      record.responseText ?? record.text ?? record.message ?? record.content
    );
  }

  return '';
}

function normalizeCandidateIds(value: unknown, allowedIds: Set<string>): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((id) => String(id || '').trim())
        .filter((id) => id && allowedIds.has(id))
    )
  );
}

function buildFallbackChatbotAdvice(analysisData: AnalysisRunData): ChatbotAdviceResult {
  const top = [...analysisData.candidates]
    .filter((candidate) => candidate.status === 'SUCCESS')
    .sort((a, b) => (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0))
    .slice(0, 3);

  return {
    responseText: top.length
      ? `Ưu tiên phỏng vấn: ${top.map((candidate) => `${candidate.candidateName} (${candidate.analysis?.['Tổng điểm'] || 0} điểm)`).join(', ')}.`
      : 'Hiện chưa có đủ dữ liệu để gợi ý thêm.',
    candidateIds: top.map((candidate) => candidate.id),
  };
}

function compactPromptText(value: unknown, maxLength: number = 160): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export async function filterAndStructureJD(rawJdText: string): Promise<string> {
  const response = await apiPost<JdStructureResponse>('/api/jd/structure', {
    raw_text: rawJdText,
  });

  return response.structured_text?.trim() || rawJdText.trim();
}

export async function extractJobPositionFromJD(jdText: string): Promise<string> {
  const response = await apiPost<JdPositionResponse>('/api/jd/position', {
    jd_text: jdText,
  });

  return response.job_position?.trim() || '';
}

export async function extractHardFiltersFromJD(jdText: string): Promise<Partial<HardFilters>> {
  const response = await apiPost<JdHardFiltersResponse>('/api/jd/hard-filters', {
    jd_text: jdText,
  });

  return response.filters || {};
}

export async function* analyzeCVs(
  jdText: string,
  weights: WeightCriteria,
  hardFilters: HardFilters,
  cvFiles: File[]
): AsyncGenerator<ScreeningProgress | Candidate> {
  const hashes = analysisCacheService.generateAnalysisHashes(jdText, weights, hardFilters);
  let cached: Array<{ file: File; result: unknown }> = [];
  let uncached: File[] = cvFiles;

  try {
    const cacheResult = await analysisCacheService.batchCheckCache(
      cvFiles,
      hashes.jdHash,
      hashes.weightsHash,
      hashes.filtersHash
    );
    cached = cacheResult.cached;
    uncached = cacheResult.uncached;
  } catch (error) {
    console.warn('Analysis cache lookup failed, continuing without cached results:', error);
  }

  for (const [index, item] of cached.entries()) {
    yield {
      status: 'progress',
      message: `Đang dùng kết quả đã lưu cho CV ${index + 1}/${cached.length}: ${item.file.name}`,
    };

    yield normalizeCandidate(
      item.result,
      item.file,
      typeof (item.result as Record<string, unknown>)?._cvText === 'string'
        ? String((item.result as Record<string, unknown>)._cvText)
        : undefined
    );
  }

  const cvEntries: Array<{ file_name: string; text: string }> = [];
  const cvTextMap: Record<string, string> = {};
  const pendingFiles: File[] = [];
  let persistUploadedFilesPromise: Promise<string[]> | null = null;

  for (let index = 0; index < uncached.length; index += 1) {
    const file = uncached[index];

    yield {
      status: 'progress',
      message: `Đang đọc CV ${index + 1}/${uncached.length}: ${file.name}`,
    };

    try {
      const text = await extractTextFromFile(file, () => {}, { documentType: 'cv' });
      cvEntries.push({ file_name: file.name, text });
      cvTextMap[file.name] = text;
      pendingFiles.push(file);
    } catch (error) {
      yield {
        id: `${file.name}-failed-${Date.now()}`,
        candidateName: file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        jobTitle: '',
        industry: '',
        department: '',
        experienceLevel: '',
        detectedLocation: '',
        status: 'FAILED',
        error: getSafeErrorMessage(error, 'ai'),
      };
    }
  }

  if (!cvEntries.length) return;

  persistUploadedFilesPromise = UploadedFilesService.saveUploadedFiles(
    cvEntries.map((entry, index) => {
      const file = pendingFiles[index];
      return {
        fileName: file?.name || entry.file_name,
        fileType: 'cv' as const,
        fileSize: file?.size || 0,
        mimeType: file?.type || 'application/octet-stream',
        ocrMethod: 'browser-local',
        extractedText: entry.text,
        processingTimeMs: 0,
        candidateName: (file?.name || entry.file_name).replace(/\.[^.]+$/, ''),
      };
    })
  ).catch((error) => {
    console.warn('Persist uploaded files failed, continuing analysis without vector sync:', error);
    return [];
  });

  yield {
    status: 'progress',
    message: `Đang phân tích ${cvEntries.length} CV qua Render API...`,
  };

  let coreResponse: CoreAnalysisResponse;
  try {
    coreResponse = await runCoreAnalysis({
      jd_text: jdText,
      weights,
      hard_filters: serializeHardFilters(hardFilters),
      cv_entries: cvEntries,
    });
  } catch (error) {
    const message = getSafeErrorMessage(error, 'ai');
    console.error('Core CV analysis failed:', error);

    for (const file of pendingFiles) {
      yield {
        id: `${file.name}-analysis-failed-${Date.now()}`,
        candidateName: file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        jobTitle: '',
        industry: '',
        department: '',
        experienceLevel: '',
        detectedLocation: '',
        status: 'FAILED',
        error: message,
      };
    }

    return;
  }

  let candidates = pickArray<unknown>(coreResponse, ['candidates']);

  // `/api/cv/analyze-core` already runs the full backend pipeline, including
  // enrichment and advanced score breakdown attachment. Calling `/api/cv/enrich`
  // again here can desynchronize the result payload and double-apply scoring logic.
  if (persistUploadedFilesPromise) {
    void persistUploadedFilesPromise;
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const rawCandidate = candidates[index];
    const matchedFile =
      pendingFiles.find((file) => file.name === String((rawCandidate as Record<string, unknown>)?.fileName || ''))
      || pendingFiles[index];
    const normalizedCandidate = normalizeCandidate(
      rawCandidate,
      matchedFile,
      matchedFile ? cvTextMap[matchedFile.name] : undefined
    );

    if (matchedFile) {
      try {
        await analysisCacheService.cacheAnalysis(
          matchedFile,
          normalizedCandidate,
          hashes.jdHash,
          hashes.weightsHash,
          hashes.filtersHash
        );
      } catch (error) {
        console.warn('Analysis cache write failed, keeping current results:', error);
      }
    }

    yield normalizedCandidate;
  }
}

export async function getChatbotAdvice(
  analysisData: AnalysisRunData,
  prompt: string
): Promise<ChatbotAdviceResult> {
  const candidateContext = analysisData.candidates
    .filter((candidate) => candidate.status === 'SUCCESS')
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.candidateName,
      score: candidate.analysis?.['Tổng điểm'] || 0,
      grade: candidate.analysis?.['Hạng'] || 'C',
      jobTitle: candidate.jobTitle,
      strengths: candidate.analysis?.['Điểm mạnh CV'] || [],
      weaknesses: candidate.analysis?.['Điểm yếu CV'] || [],
      details: (candidate.analysis?.['Chi tiết'] || []).slice(0, 8).map((detail) => ({
        criterion: compactPromptText(detail['Tiêu chí'], 60),
        score: compactPromptText(detail['Điểm'], 24),
        evidence: compactPromptText(detail['Dẫn chứng'], 140),
        note: compactPromptText(detail['Giải thích'], 120),
      })),
    }))
    .slice(0, 12);
  const allowedCandidateIds = new Set(
    candidateContext
      .map((candidate) => String(candidate.id || '').trim())
      .filter(Boolean)
  );

  const backendPrompt = [
    'Bạn là trợ lý tuyển dụng cho SupportHR.',
    'Hãy trả lời ngắn gọn bằng tiếng Việt và xuất ra JSON hợp lệ.',
    'JSON phải có dạng: {"responseText":"...","candidateIds":["id-1","id-2"]}.',
    'Chỉ chọn candidateIds từ danh sách ứng viên đã cho nếu thực sự liên quan.',
    'Phong cách responseText: tối đa 5 gạch đầu dòng, mỗi dòng dưới 22 từ, không mở bài dài.',
    'Dùng khớp ngữ nghĩa/vector: hiểu ý nghĩa kỹ năng và kết quả, không chỉ so trùng từ khóa.',
    'Ví dụ: "giảm 20% thời gian truy vấn" là KPI hiệu suất/thành tựu; nếu nói doanh thu/tăng trưởng thì ghi là tác động gián tiếp.',
    'Nếu thiếu dữ liệu, nói đúng phần thiếu; không phóng đại năng lực ứng viên.',
    '',
    `Vị trí tuyển dụng: ${analysisData.job.position || 'Chưa rõ'}`,
    `Số ứng viên: ${candidateContext.length}`,
    `Câu hỏi người dùng: ${prompt}`,
    '',
    `Danh sách ứng viên: ${JSON.stringify(candidateContext)}`,
  ].join('\n');

  try {
    const response = await apiPost<BackendChatResponse>('/api/gemini-chat', {
      model: RENDER_CHAT_MODEL,
      contents: backendPrompt,
      config: {
        temperature: 0.2,
      },
    });

    const fallback = buildFallbackChatbotAdvice(analysisData);
    const rawText = typeof response.text === 'string' ? response.text : '';
    const parsedPayload = rawText ? parseChatbotPayload(rawText) : null;
    const responsePayload = response as Record<string, unknown>;
    const rawResponseText = parsedPayload?.responseText
      ?? responsePayload.responseText
      ?? responsePayload.text;
    const rawCandidateIds = parsedPayload?.candidateIds ?? responsePayload.candidateIds;
    const responseText = normalizeChatbotResponseText(rawResponseText);
    const candidateIds = rawCandidateIds !== undefined
      ? normalizeCandidateIds(rawCandidateIds, allowedCandidateIds)
      : fallback.candidateIds;

    return {
      responseText: responseText || fallback.responseText,
      candidateIds,
    };
  } catch (error) {
    console.warn('Backend chatbot request failed, using fallback advice:', error);
    return buildFallbackChatbotAdvice(analysisData);
  }
}
