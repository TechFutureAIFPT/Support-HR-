import type { Candidate, DetailedScore, HardFilters, WeightCriteria, AnalysisRunData } from '@/shared/types';
import { apiPost, pickArray } from '@/lib/services/api/renderClient';
import { analysisCacheService } from '@/lib/services/history-cache/analysisCache';
import { UploadedFilesService } from '@/lib/services/data-sync/uploadedFilesService';
import { extractTextFromFile } from '@/lib/services/file-processing/ocrService';
import { getSafeErrorMessage, sanitizeApiErrorMessage, SAFE_ERROR_MESSAGES } from '@/shared/utils/errorMessages';

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
}

interface EnrichmentResponse {
  candidates?: unknown[];
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
  text?: string;
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

function normalizeDetail(detail: unknown): DetailedScore {
  const record = (detail && typeof detail === 'object') ? detail as Record<string, unknown> : {};

  return {
    'Tiêu chí': String(record['Tiêu chí'] || record['Tieu chi'] || record['TiÃªu chÃ­'] || 'Tiêu chí'),
    'Điểm': String(record['Điểm'] || record['Diem'] || record['Äiá»ƒm'] || ''),
    'Công thức': String(record['Công thức'] || record['Cong thuc'] || record['CÃ´ng thá»©c'] || ''),
    'Dẫn chứng': String(record['Dẫn chứng'] || record['Dan chung'] || record['Dáº«n chá»©ng'] || ''),
    'Giải thích': String(record['Giải thích'] || record['Giai thich'] || record['Giáº£i thÃ­ch'] || ''),
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

function normalizeAnalysis(rawAnalysis: unknown): CandidateAnalysis | undefined {
  if (!rawAnalysis || typeof rawAnalysis !== 'object') return undefined;

  const analysis = rawAnalysis as Record<string, unknown>;
  const totalScoreRaw = analysis['Tổng điểm'] ?? analysis['Tong diem'] ?? analysis['Tá»•ng Ä‘iá»ƒm'] ?? 0;
  const gradeRaw = analysis['Hạng'] ?? analysis['Hang'] ?? analysis['Háº¡ng'] ?? 'C';
  const detailsRaw = analysis['Chi tiết'] ?? analysis['Chi tiet'] ?? analysis['Chi tiáº¿t'] ?? [];

  return {
    'Tổng điểm': Number(totalScoreRaw) || 0,
    'Hạng': String(gradeRaw).toUpperCase() as 'A' | 'B' | 'C',
    'Chi tiết': Array.isArray(detailsRaw) ? detailsRaw.map(normalizeDetail) : [],
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

function normalizeCandidate(rawCandidate: unknown, fallbackFile?: File): Candidate {
  const candidate = (rawCandidate && typeof rawCandidate === 'object') ? rawCandidate as Record<string, unknown> : {};
  const fileName = String(candidate.fileName || fallbackFile?.name || 'unknown');
  const candidateName = String(candidate.candidateName || fileName.replace(/\.[^.]+$/, ''));

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
    detectedLocation: String(candidate.detectedLocation || ''),
    analysis: normalizeAnalysis(candidate.analysis) as Candidate['analysis'],
    debiasingWarnings: Array.isArray(candidate.debiasingWarnings)
      ? candidate.debiasingWarnings.map((warning) => String(warning))
      : undefined,
    status: candidate.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    error: candidate.error ? sanitizeApiErrorMessage(String(candidate.error), SAFE_ERROR_MESSAGES.ai) : undefined,
    _rawBatchJson: JSON.stringify(rawCandidate),
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

function buildFallbackChatbotAdvice(analysisData: AnalysisRunData): ChatbotAdviceResult {
  const top = [...analysisData.candidates]
    .filter((candidate) => candidate.status === 'SUCCESS')
    .sort((a, b) => (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0))
    .slice(0, 3);

  return {
    responseText: top.length
      ? `Mình đang ưu tiên ${top.map((candidate) => `${candidate.candidateName} (${candidate.analysis?.['Tổng điểm'] || 0} điểm)`).join(', ')}.`
      : 'Hiện chưa có đủ dữ liệu để gợi ý thêm.',
    candidateIds: top.map((candidate) => candidate.id),
  };
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
  const { cached, uncached } = await analysisCacheService.batchCheckCache(
    cvFiles,
    hashes.jdHash,
    hashes.weightsHash,
    hashes.filtersHash
  );

  for (const [index, item] of cached.entries()) {
    yield {
      status: 'progress',
      message: `Đang dùng kết quả đã lưu cho CV ${index + 1}/${cached.length}: ${item.file.name}`,
    };

    yield normalizeCandidate(item.result, item.file);
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

  const coreResponse = await apiPost<CoreAnalysisResponse>('/api/cv/analyze-core', {
    jd_text: jdText,
    weights,
    hard_filters: serializeHardFilters(hardFilters),
    cv_entries: cvEntries,
  });

  let candidates = pickArray<unknown>(coreResponse, ['candidates']);

  if (candidates.length > 0) {
    if (persistUploadedFilesPromise) {
      await persistUploadedFilesPromise;
    }

    try {
      const enrichmentResponse = await apiPost<EnrichmentResponse>('/api/cv/enrich', {
        jd_text: jdText,
        hard_filters: serializeHardFilters(hardFilters),
        candidates,
        cv_text_map: cvTextMap,
      }, {
        authRequired: true,
      });

      const enrichedCandidates = pickArray<unknown>(enrichmentResponse, ['candidates']);
      if (enrichedCandidates.length > 0) {
        candidates = enrichedCandidates;
      }
    } catch (error) {
      console.warn('Candidate enrichment failed, using core analysis only:', error);
    }
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const rawCandidate = candidates[index];
    const matchedFile =
      pendingFiles.find((file) => file.name === String((rawCandidate as Record<string, unknown>)?.fileName || ''))
      || pendingFiles[index];
    const normalizedCandidate = normalizeCandidate(rawCandidate, matchedFile);

    if (matchedFile) {
      await analysisCacheService.cacheAnalysis(
        matchedFile,
        normalizedCandidate,
        hashes.jdHash,
        hashes.weightsHash,
        hashes.filtersHash
      );
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
    }))
    .slice(0, 12);

  const backendPrompt = [
    'Bạn là trợ lý tuyển dụng cho SupportHR.',
    'Hãy trả lời ngắn gọn bằng tiếng Việt và xuất ra JSON hợp lệ.',
    'JSON phải có dạng: {"responseText":"...","candidateIds":["id-1","id-2"]}.',
    'Chỉ chọn candidateIds từ danh sách ứng viên đã cho nếu thực sự liên quan.',
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

    const text = response.text || '';
    const jsonBlock = extractJsonBlock(text);

    if (jsonBlock) {
      const parsed = JSON.parse(jsonBlock) as Partial<ChatbotAdviceResult>;

      return {
        responseText: typeof parsed.responseText === 'string' && parsed.responseText.trim()
          ? parsed.responseText.trim()
          : text,
        candidateIds: Array.isArray(parsed.candidateIds)
          ? parsed.candidateIds.map((id) => String(id))
          : [],
      };
    }

    const fallback = buildFallbackChatbotAdvice(analysisData);
    return {
      responseText: text || fallback.responseText,
      candidateIds: fallback.candidateIds,
    };
  } catch (error) {
    console.warn('Backend chatbot request failed, using fallback advice:', error);
    return buildFallbackChatbotAdvice(analysisData);
  }
}
