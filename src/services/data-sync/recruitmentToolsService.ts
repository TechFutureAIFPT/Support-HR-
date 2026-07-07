import { apiGetWithMeta, apiPost, apiUpload, pickArray, pickObject } from '@/services/api/renderClient';
import type {
  JDQualityFinding,
  JDSupplementalFields,
  JDStandardizeResponse,
  JDStandardizeTargetPlatform,
  MobileInboxCandidate,
  MobileInboxHistory,
  MobileInboxResponse,
  StageDecision,
} from '@/types';

const asString = (value: unknown, fallback = '') => String(value ?? fallback);
const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const asArray = <T = unknown>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

type InboxCacheEntry = {
  etag: string | null;
  response: MobileInboxResponse;
};

const inboxResponseCache = new Map<string, InboxCacheEntry>();

function normalizeStageDecision(raw: unknown, record: Record<string, unknown>, score: number): StageDecision {
  const fallbackBlockingReasons = [
    record.hardFilterFailureReason ? asString(record.hardFilterFailureReason) : '',
    record.locationMatch === false ? 'Không đạt yêu cầu địa điểm bắt buộc.' : '',
  ].filter(Boolean);
  const fallbackStatus = fallbackBlockingReasons.length > 0
    ? 'hold'
    : score >= 75
      ? 'ready_to_advance'
      : score >= 50
        ? 'review'
        : 'not_ready';
  const fallbackByStatus: Record<string, StageDecision> = {
    ready_to_advance: {
      status: 'ready_to_advance',
      label: 'Sẵn sàng chuyển vòng',
      autoAdvance: true,
      currentStage: 'Ứng tuyển',
      recommendedStage: 'Vòng tiếp theo',
      scoreThreshold: 75,
      reason: 'Đạt ngưỡng điểm và không vi phạm tiêu chí bắt buộc.',
      blockingReasons: [],
    },
    hold: {
      status: 'hold',
      label: 'Giữ lại vòng ứng tuyển',
      autoAdvance: false,
      currentStage: 'Ứng tuyển',
      recommendedStage: 'Ứng tuyển',
      scoreThreshold: 75,
      reason: 'Ứng viên có điểm đánh giá nhưng chưa đạt tiêu chí bắt buộc.',
      blockingReasons: fallbackBlockingReasons,
    },
    review: {
      status: 'review',
      label: 'Cần HR rà soát',
      autoAdvance: false,
      currentStage: 'Ứng tuyển',
      recommendedStage: 'Rà soát thủ công',
      scoreThreshold: 75,
      reason: 'Điểm phù hợp ở mức trung bình, nên kiểm tra thêm bằng chứng trước khi chuyển vòng.',
      blockingReasons: [],
    },
    not_ready: {
      status: 'not_ready',
      label: 'Chưa nên chuyển vòng',
      autoAdvance: false,
      currentStage: 'Ứng tuyển',
      recommendedStage: 'Không đề xuất',
      scoreThreshold: 75,
      reason: 'Điểm phù hợp còn thấp so với ngưỡng chuyển vòng.',
      blockingReasons: [],
    },
  };
  const fallback = fallbackByStatus[fallbackStatus];
  const decision = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const blockingReasons = Array.isArray(decision.blockingReasons)
    ? decision.blockingReasons.map((item) => asString(item)).filter(Boolean)
    : fallback.blockingReasons;

  return {
    status: asString(decision.status || fallback.status),
    label: asString(decision.label || fallback.label),
    autoAdvance: typeof decision.autoAdvance === 'boolean' ? decision.autoAdvance : fallback.autoAdvance,
    currentStage: asString(decision.currentStage || fallback.currentStage),
    recommendedStage: asString(decision.recommendedStage || fallback.recommendedStage),
    scoreThreshold: asNumber(decision.scoreThreshold, fallback.scoreThreshold),
    reason: asString(decision.reason || fallback.reason),
    blockingReasons,
  };
}

function normalizeInboxCandidate(raw: unknown): MobileInboxCandidate {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const score = asNumber(record.score || record.totalScore, 0);
  return {
    id: asString(record.id || record.candidateId || `${record.sourceHistoryId || 'history'}-${record.fileName || record.candidateName || Date.now()}`),
    sourceHistoryId: asString(record.sourceHistoryId || ''),
    syncHistoryId: asString(record.syncHistoryId || ''),
    sessionId: asString(record.sessionId || ''),
    candidateName: asString(record.candidateName || record.name, 'Ứng viên chưa xác định'),
    avatarUrl: asString(record.avatarUrl || ''),
    fileName: asString(record.fileName, 'Không rõ file'),
    jobTitle: asString(record.jobTitle || record.jobPosition, 'Vị trí chưa rõ'),
    industry: asString(record.industry, 'Chưa rõ ngành'),
    experienceLevel: asString(record.experienceLevel, 'Chưa rõ cấp độ'),
    detectedLocation: asString(record.detectedLocation || ''),
    score,
    rank: asString(record.rank || record.grade, 'C').toUpperCase(),
    strengths: asArray<string>(record.strengths),
    weaknesses: asArray<string>(record.weaknesses),
    interviewQuestions: asArray<string>(record.interviewQuestions),
    details: asArray<Record<string, unknown>>(record.details),
    warnings: asArray<string>(record.warnings),
    hardFilterFailureReason: record.hardFilterFailureReason ? asString(record.hardFilterFailureReason) : null,
    stageDecision: normalizeStageDecision(record.stageDecision, record, score),
    hardFilters: record.hardFilters && typeof record.hardFilters === 'object' ? record.hardFilters as Record<string, unknown> : {},
    jdText: asString(record.jdText || ''),
    jobPosition: asString(record.jobPosition || record.jobTitle || ''),
    raw: record.raw && typeof record.raw === 'object' ? record.raw as Record<string, unknown> : record,
  };
}

function normalizeInboxHistory(raw: unknown): MobileInboxHistory {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const fullPayload = record.fullPayload && typeof record.fullPayload === 'object'
    ? record.fullPayload as Record<string, unknown>
    : {};
  return {
    id: asString(record.id || record.historyId || record.syncHistoryId || ''),
    timestamp: asNumber(record.timestamp || record.createdAt, Date.now()),
    jobPosition: asString(record.jobPosition || fullPayload.jobPosition || 'Phiên phân tích'),
    locationRequirement: asString(record.locationRequirement || ''),
    totalCandidates: asNumber(record.totalCandidates, 0),
    userEmail: asString(record.userEmail || ''),
    fullPayload: {
      jdText: asString(fullPayload.jdText || ''),
      jobPosition: asString(fullPayload.jobPosition || ''),
      hardFilters: fullPayload.hardFilters && typeof fullPayload.hardFilters === 'object'
        ? fullPayload.hardFilters as Record<string, unknown>
        : {},
      candidates: asArray<Record<string, unknown>>(fullPayload.candidates),
    },
    topCandidates: asArray<Record<string, unknown>>(record.topCandidates),
  };
}

function normalizeInboxResponse(payload: unknown): MobileInboxResponse {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const stats = record.stats && typeof record.stats === 'object' ? record.stats as Record<string, unknown> : {};
  return {
    candidates: pickArray<unknown>(payload, ['candidates']).map(normalizeInboxCandidate),
    history: pickArray<unknown>(payload, ['history', 'items', 'entries']).map(normalizeInboxHistory),
    stats: {
      candidateCount: asNumber(stats.candidateCount || stats.candidate_count, 0),
      historyCount: asNumber(stats.historyCount || stats.history_count, 0),
      latestTimestamp: stats.latestTimestamp ? asNumber(stats.latestTimestamp) : null,
    },
    revision: asString(record.revision || ''),
    generatedAt: record.generatedAt ? asNumber(record.generatedAt) : undefined,
  };
}

function normalizeJDResponse(payload: unknown): JDStandardizeResponse {
  const directRecord = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const record = pickObject<Record<string, unknown>>(payload, ['data', 'result']) || directRecord;
  const normalized = record.normalizedJD && typeof record.normalizedJD === 'object'
    ? record.normalizedJD as Record<string, unknown>
    : {};
  const platform = record.platform && typeof record.platform === 'object'
    ? record.platform as Record<string, unknown>
    : {};

  return {
    score: asNumber(record.score || record.qualityScore, 0),
    missingSections: asArray<JDQualityFinding>(record.missingSections),
    weakPoints: asArray<JDQualityFinding>(record.weakPoints),
    suggestions: asArray<JDQualityFinding>(record.suggestions),
    normalizedJD: {
      title: asString(normalized.title || record.title || ''),
      overview: asString(normalized.overview || ''),
      responsibilities: asArray<string>(normalized.responsibilities),
      requirements: asArray<string>(normalized.requirements),
      benefits: asArray<string>(normalized.benefits),
      workingTime: asString(normalized.workingTime || ''),
      location: asString(normalized.location || ''),
      salary: asString(normalized.salary || ''),
      applicationInfo: asString(normalized.applicationInfo || ''),
      keywords: asArray<string>(normalized.keywords),
    },
    platform: {
      name: asString(platform.name || 'Nền tảng tuyển dụng'),
      url: asString(platform.url || record.platformUrl || ''),
    },
    platformUrl: asString(record.platformUrl || platform.url || ''),
    generatedAt: asString(record.generatedAt || new Date().toISOString()),
    source: asString(record.source || 'fallback'),
    savedRecordId: record.savedRecordId ? asString(record.savedRecordId) : null,
  };
}

export async function fetchFilteredCvLibrary(params?: {
  historyLimit?: number;
  candidateLimit?: number;
  userEmail?: string;
}): Promise<MobileInboxResponse> {
  const query = new URLSearchParams({
    history_limit: String(params?.historyLimit ?? 20),
    candidate_limit: String(params?.candidateLimit ?? 120),
  });
  if (params?.userEmail) query.set('user_email', params.userEmail);

  const cacheKey = query.toString();
  const cached = inboxResponseCache.get(cacheKey);
  const payload = await apiGetWithMeta<unknown>(`/api/account/mobile-inbox?${query.toString()}`, {
    authRequired: true,
    timeoutMs: 25000,
    allowNotModified: true,
    headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
  });

  if (payload.notModified) {
    return cached?.response ?? {
      candidates: [],
      history: [],
      stats: { candidateCount: 0, historyCount: 0, latestTimestamp: null },
      dataRevision: payload.dataRevision ?? undefined,
      notModified: true,
    };
  }

  const response = normalizeInboxResponse(payload.data);
  response.dataRevision = payload.dataRevision ?? response.revision;
  response.notModified = false;
  inboxResponseCache.set(cacheKey, {
    etag: payload.etag,
    response,
  });
  return response;
}

export async function standardizeJDText(input: {
  jdText: string;
  targetPlatform: JDStandardizeTargetPlatform;
  supplementalFields?: JDSupplementalFields;
}): Promise<JDStandardizeResponse> {
  const payload = await apiPost<unknown>(
    '/api/mobile/jd/standardize',
    {
      jdText: input.jdText,
      targetPlatform: input.targetPlatform,
      supplementalFields: input.supplementalFields,
    },
    { authRequired: true, timeoutMs: 180000 }
  );
  return normalizeJDResponse(payload);
}

export async function standardizeJDFile(input: {
  file: File;
  targetPlatform: JDStandardizeTargetPlatform;
  supplementalFields?: JDSupplementalFields;
  forceOcr?: boolean;
}): Promise<JDStandardizeResponse> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('target_platform', input.targetPlatform);
  formData.append('force_ocr', input.forceOcr ? 'true' : 'false');
  if (input.supplementalFields) {
    formData.append('supplemental_fields_json', JSON.stringify(input.supplementalFields));
  }

  const payload = await apiUpload<unknown>('/api/mobile/jd/standardize-file', formData, {
    authRequired: true,
    timeoutMs: 240000,
  });
  return normalizeJDResponse(payload);
}
