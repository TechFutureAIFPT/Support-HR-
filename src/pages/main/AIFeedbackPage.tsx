import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Brain, CheckCircle2, FileText } from 'lucide-react';
import type {
  ActiveAnalysisContext,
  AnalysisFeedbackAction,
  AnalysisFeedbackDraft,
  AnalysisFeedbackRecord,
  AnalysisRunData,
  Candidate,
  HardFilters,
  WeightCriteria,
} from '@/types';
import AIFeedbackForm from '@/features/feedback/AIFeedbackForm';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  getAnalysisFeedbackStats,
  listAnalysisFeedback,
  saveAnalysisFeedback,
  type AnalysisFeedbackStats,
} from '@/services/data-sync/analysisFeedbackService';
import {
  buildAnalysisSessionId,
  getActiveAnalysisContext,
} from '@/services/history-cache/activeAnalysisContext';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';

interface AIFeedbackPageProps {
  candidates: Candidate[];
  jobPosition?: string;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
  analysisContext?: ActiveAnalysisContext | null;
}

const ACTION_META: Record<AnalysisFeedbackAction, { label: string; className: string }> = {
  like: {
    label: 'Đánh giá tốt',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  },
  dislike: {
    label: 'Cần xem lại',
    className: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  },
  shortlist: {
    label: 'Shortlist',
    className: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  },
  reject: {
    label: 'Từ chối',
    className: 'border-rose-400/30 bg-rose-400/10 text-rose-100',
  },
  interview: {
    label: 'Mời phỏng vấn',
    className: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
  },
  hire: {
    label: 'Đề xuất tuyển',
    className: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
  },
  neutral: {
    label: 'Trung lập',
    className: 'border-slate-600/70 bg-slate-700/30 text-slate-200',
  },
};

function getStoredAnalysisRun(): AnalysisRunData | null {
  return readLatestAnalysisRun();
}

function buildEffectiveContext(
  directContext?: ActiveAnalysisContext | null,
  storedRun?: AnalysisRunData | null,
  fallbackJobPosition?: string
): ActiveAnalysisContext | null {
  if (directContext) return directContext;

  const cachedContext = getActiveAnalysisContext();
  if (cachedContext) return cachedContext;
  if (!storedRun) return null;

  return {
    sessionId: buildAnalysisSessionId(storedRun.timestamp),
    timestamp: storedRun.timestamp,
    jobPosition: fallbackJobPosition || storedRun.job.position,
  };
}

function readAnalysisValue<T>(candidate: Candidate, keys: string[]): T | undefined {
  const analysis = candidate.analysis as Record<string, unknown> | undefined;
  if (!analysis) return undefined;

  for (const key of keys) {
    if (key in analysis) return analysis[key] as T;
  }

  return undefined;
}

function getCandidateScore(candidate: Candidate): number {
  const score = readAnalysisValue<number>(candidate, ['Tổng điểm', 'Tong diem']);
  return typeof score === 'number' ? score : 0;
}

function getDisplayedScore(candidate: Candidate): number {
  return typeof candidate.analysis?.feedbackAdjusted === 'number'
    ? candidate.analysis.feedbackAdjusted
    : getCandidateScore(candidate);
}

function getCandidateRank(candidate: Candidate): string | undefined {
  return readAnalysisValue<string>(candidate, ['Hạng', 'Hang']);
}

function getFeedbackMap(entries: AnalysisFeedbackRecord[]): Record<string, AnalysisFeedbackRecord> {
  return entries.reduce<Record<string, AnalysisFeedbackRecord>>((accumulator, entry) => {
    const key = entry.candidateId || entry.fileName || entry.candidateName;
    if (key) accumulator[key] = entry;
    return accumulator;
  }, {});
}

function getUniqueFeedbackEntries(feedbackMap: Record<string, AnalysisFeedbackRecord>): AnalysisFeedbackRecord[] {
  const unique = new Map<string, AnalysisFeedbackRecord>();

  Object.values(feedbackMap).forEach((entry) => {
    if (entry.id) unique.set(entry.id, entry);
  });

  return Array.from(unique.values());
}

function hydrateFeedbackAdjusted(
  candidates: Candidate[],
  feedbackMap: Record<string, AnalysisFeedbackRecord>
): Candidate[] {
  return candidates.map((candidate) => {
    const entry = feedbackMap[candidate.id] || feedbackMap[candidate.fileName] || feedbackMap[candidate.candidateName];
    if (!entry || typeof entry.finalScore !== 'number') return candidate;

    return {
      ...candidate,
      analysis: candidate.analysis
        ? {
            ...candidate.analysis,
            feedbackAdjusted: entry.finalScore,
          }
        : candidate.analysis,
    };
  });
}

function persistLatestRunFeedback(candidateId: string, finalScore: number): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = getStoredAnalysisRun();
    if (!stored) return;

    const nextRun: AnalysisRunData = {
      ...stored,
      candidates: stored.candidates.map((candidate) => (
        candidate.id === candidateId
          ? {
              ...candidate,
              analysis: candidate.analysis
                ? {
                    ...candidate.analysis,
                    feedbackAdjusted: finalScore,
                  }
                : candidate.analysis,
            }
          : candidate
      )),
    };

    window.localStorage.setItem('cvAnalysis.latest', JSON.stringify(nextRun));
  } catch {
    // LocalStorage is only a convenience cache; backend save remains the source of truth.
  }
}

function getActionPresentation(action?: AnalysisFeedbackAction | null): { label: string; className: string } | null {
  if (!action) return null;
  return ACTION_META[action] || ACTION_META.neutral;
}

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({
  candidates,
  jobPosition,
  analysisContext,
}) => {
  const navigate = useNavigate();
  const tc = useThemeColors();
  const storedRun = useMemo(() => getStoredAnalysisRun(), []);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [feedbackByCandidate, setFeedbackByCandidate] = useState<Record<string, AnalysisFeedbackRecord>>({});
  const [feedbackStats, setFeedbackStats] = useState<AnalysisFeedbackStats | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);

  const effectiveContext = useMemo(
    () => buildEffectiveContext(analysisContext, storedRun, jobPosition),
    [analysisContext, storedRun, jobPosition]
  );

  const sourceCandidates = useMemo(() => {
    if (Array.isArray(candidates) && candidates.length > 0) return candidates;
    return storedRun?.candidates || [];
  }, [candidates, storedRun]);

  const validCandidates = useMemo(() => {
    const base = sourceCandidates.filter((candidate) => candidate.status === 'SUCCESS' && candidate.analysis);
    return hydrateFeedbackAdjusted(base, feedbackByCandidate);
  }, [sourceCandidates, feedbackByCandidate]);

  const selectedCandidate = useMemo(() => (
    validCandidates.find((candidate) => candidate.id === selectedCandidateId) || null
  ), [selectedCandidateId, validCandidates]);

  const currentFeedbackEntry = useMemo(() => (
    selectedCandidate
      ? feedbackByCandidate[selectedCandidate.id]
        || feedbackByCandidate[selectedCandidate.fileName]
        || feedbackByCandidate[selectedCandidate.candidateName]
        || null
      : null
  ), [feedbackByCandidate, selectedCandidate]);

  const feedbackEntries = useMemo(
    () => getUniqueFeedbackEntries(feedbackByCandidate),
    [feedbackByCandidate]
  );

  const effectiveJobPosition = jobPosition || effectiveContext?.jobPosition || storedRun?.job.position || '';
  const submittedCount = feedbackEntries.length;
  const selectedActionPresentation = getActionPresentation(currentFeedbackEntry?.action);
  const latestFeedbackLabel = feedbackStats?.latestFeedbackAt
    ? new Date(feedbackStats.latestFeedbackAt).toLocaleString('vi-VN')
    : 'Chưa có phản hồi';

  const headerSurfaceStyle = {
    background: tc.headerBg,
    borderColor: tc.borderColor,
  } as const;
  const workspaceSurfaceStyle = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.018) 100%)',
  } as const;
  const selectSurfaceStyle = {
    background: 'rgba(15, 23, 42, 0.82)',
    borderColor: tc.borderColor,
  } as const;

  const reloadFeedback = useCallback(async () => {
    if (!effectiveContext?.sessionId && !effectiveContext?.historyId && !effectiveContext?.syncHistoryId) {
      setFeedbackByCandidate({});
      setFeedbackStats(null);
      return;
    }

    setIsLoadingFeedback(true);
    try {
      const filters = {
        sessionId: effectiveContext?.sessionId,
        historyId: effectiveContext?.historyId,
        syncHistoryId: effectiveContext?.syncHistoryId,
        limitCount: 200,
      };

      const [entries, stats] = await Promise.all([
        listAnalysisFeedback(filters),
        getAnalysisFeedbackStats(filters),
      ]);

      setFeedbackByCandidate(getFeedbackMap(entries));
      setFeedbackStats(stats);
    } catch (error) {
      console.error('Failed to load feedback entries:', error);
    } finally {
      setIsLoadingFeedback(false);
    }
  }, [effectiveContext]);

  useEffect(() => {
    if (
      validCandidates.length > 0
      && (!selectedCandidateId || !validCandidates.some((candidate) => candidate.id === selectedCandidateId))
    ) {
      setSelectedCandidateId(validCandidates[0].id);
    }
  }, [validCandidates, selectedCandidateId]);

  useEffect(() => {
    setSubmitError(null);
    setSubmitSuccessMessage(null);
    void reloadFeedback();
  }, [reloadFeedback]);

  const handleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setSubmitError(null);
    setSubmitSuccessMessage(null);
  }, []);

  const handleSubmit = useCallback(async (draft: AnalysisFeedbackDraft) => {
    if (!selectedCandidate) return;

    const scope = effectiveContext || buildEffectiveContext(null, storedRun, effectiveJobPosition);
    if (!scope?.sessionId && !scope?.historyId && !scope?.syncHistoryId && !scope?.jdHash) {
      setSubmitError('Frontend chưa có context của phiên phân tích. Bạn hãy chạy lại một lần để gắn phản hồi đúng scope.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMessage(null);

    try {
      const saved = await saveAnalysisFeedback({
        sessionId: scope?.sessionId,
        historyId: scope?.historyId,
        syncHistoryId: scope?.syncHistoryId,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.candidateName,
        fileName: selectedCandidate.fileName,
        jobPosition: effectiveJobPosition || selectedCandidate.jobTitle,
        jdHash: scope?.jdHash,
        action: draft.action,
        aiScore: getCandidateScore(selectedCandidate),
        finalScore: draft.finalScore,
        isReusableGuidance: draft.isReusableGuidance,
        rank: getCandidateRank(selectedCandidate),
        reason: draft.reason,
        notes: draft.notes,
        metadata: {
          selectedCriteria: draft.selectedCriteria,
          scoreDifference: draft.scoreDifference,
          isReusableGuidance: draft.isReusableGuidance,
          feedbackScope: draft.isReusableGuidance ? 'reusable-guidance' : 'candidate-specific',
          source: 'ui-feedback-page',
        },
      });

      setFeedbackByCandidate((previous) => ({
        ...previous,
        [selectedCandidate.id]: saved,
        [selectedCandidate.fileName]: saved,
        [selectedCandidate.candidateName]: saved,
      }));
      persistLatestRunFeedback(selectedCandidate.id, draft.finalScore);
      setSubmitSuccessMessage('Phản hồi đã được lưu và gắn với ứng viên này.');
      await reloadFeedback();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu phản hồi. Vui lòng thử lại.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [effectiveContext, effectiveJobPosition, reloadFeedback, selectedCandidate, storedRun]);

  if (validCandidates.length === 0) {
    return (
      <div className="feature-page-shell flex h-full flex-col items-center justify-center bg-black p-8 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] border border-slate-800/70 bg-[#091427] shadow-[0_20px_60px_-24px_rgba(15,23,42,0.82)]">
          <Brain className="h-10 w-10 text-slate-600" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-md text-sm leading-7 text-slate-400">
          Không tìm thấy ứng viên nào đã được phân tích. Hãy chạy lại bước phân tích CV trước khi mở màn phản hồi AI.
        </p>
        <button
          onClick={() => navigate('/analysis')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về kết quả phân tích
        </button>
      </div>
    );
  }

  return (
    <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-black">
      <header className="shrink-0 border-b px-4 py-3 md:px-5" style={headerSurfaceStyle}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-9 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-sky-300 to-indigo-400" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
                Phản hồi đánh giá AI
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-white md:text-2xl">
                {effectiveJobPosition || 'Phiên phân tích hiện tại'}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="feedback-candidate-select">
              Chọn ứng viên phản hồi
            </label>
            <select
              id="feedback-candidate-select"
              value={selectedCandidateId || validCandidates[0]?.id || ''}
              onChange={(event) => handleSelectCandidate(event.target.value)}
              className="h-10 min-w-[260px] rounded-xl border px-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/35"
              style={selectSurfaceStyle}
            >
              {validCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.candidateName} - {getDisplayedScore(candidate).toFixed(1)} điểm - Hạng {getCandidateRank(candidate) || 'C'}
                </option>
              ))}
            </select>

            <button
              onClick={() => navigate('/analysis')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-800/80 px-4 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Kết quả phân tích
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
          <span className="rounded-full border border-slate-800/80 bg-slate-950/35 px-3 py-1">
            {submittedCount}/{validCandidates.length} ứng viên đã phản hồi
          </span>
          <span className="rounded-full border border-slate-800/80 bg-slate-950/35 px-3 py-1">
            Tổng bản ghi: {feedbackStats?.totalFeedback ?? submittedCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800/80 bg-slate-950/35 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            {isLoadingFeedback ? 'Đang đồng bộ...' : 'Sẵn sàng'}
          </span>
          <span className="rounded-full border border-slate-800/80 bg-slate-950/35 px-3 py-1">
            Mới nhất: {latestFeedbackLabel}
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden" style={workspaceSurfaceStyle}>
        {selectedCandidate ? (
          <div className="flex h-full flex-col">
            <section className="border-b px-4 py-4 md:px-5" style={headerSurfaceStyle}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                    Ứng viên đang phản hồi
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-bold text-white md:text-[28px]">
                    {selectedCandidate.candidateName}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    Hiệu chỉnh đánh giá, lưu ghi chú tuyển dụng và đồng bộ phản hồi cho phiên phân tích hiện tại.
                  </p>
                </div>

                {selectedActionPresentation ? (
                  <span className={`w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${selectedActionPresentation.className}`}>
                    {selectedActionPresentation.label}
                  </span>
                ) : (
                  <span className="w-fit rounded-full border border-slate-700/70 bg-slate-950/35 px-3 py-1.5 text-sm font-semibold text-slate-500">
                    Chưa gửi phản hồi
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-950/35 px-3 py-1.5 text-sm text-slate-300">
                  <FileText className="h-4 w-4 text-slate-500" />
                  {selectedCandidate.fileName}
                </span>
                <span className="rounded-full border border-slate-700/70 bg-slate-950/35 px-3 py-1.5 text-sm text-slate-300">
                  Điểm AI gốc: <strong className="ml-1 font-semibold text-white">{getCandidateScore(selectedCandidate).toFixed(1)}</strong>
                </span>
                <span className="rounded-full border border-slate-700/70 bg-slate-950/35 px-3 py-1.5 text-sm text-slate-300">
                  Điểm đang hiển thị: <strong className="ml-1 font-semibold text-white">{getDisplayedScore(selectedCandidate).toFixed(1)}</strong>
                </span>
                <span className="rounded-full border border-slate-700/70 bg-slate-950/35 px-3 py-1.5 text-sm text-slate-300">
                  Hạng: <strong className="ml-1 font-semibold text-white">{getCandidateRank(selectedCandidate) || 'C'}</strong>
                </span>
              </div>

              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300/80" />
                Phản hồi này sẽ được lưu vào backend và gắn với session phân tích để phục vụ review và đánh giá chất lượng sau này.
              </p>
            </section>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="w-full px-0 pb-10">
                <AIFeedbackForm
                  candidateId={selectedCandidate.id}
                  candidateName={selectedCandidate.candidateName}
                  aiScore={getCandidateScore(selectedCandidate)}
                  initialFeedback={currentFeedbackEntry}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  submitSuccessMessage={submitSuccessMessage}
                  onSubmit={handleSubmit}
                  onCancel={() => navigate('/analysis')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-500">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-800/70 bg-slate-950/40">
              <Brain className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-base font-semibold text-slate-300">Không tìm thấy ứng viên đang chọn</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Hãy chọn lại một ứng viên trong dropdown ở header để tiếp tục gửi phản hồi.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIFeedbackPage;
