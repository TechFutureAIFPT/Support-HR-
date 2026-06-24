import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquareText,
} from 'lucide-react';
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
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

type FeedbackView = 'overview' | 'decision';

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
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  dislike: {
    label: 'Cần xem lại',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  shortlist: {
    label: 'Đề cử',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  reject: {
    label: 'Từ chối',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  interview: {
    label: 'Phỏng vấn',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  hire: {
    label: 'Đề xuất',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  neutral: {
    label: 'Trung lập',
    className: 'border-blue-100 bg-white text-slate-700',
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
    // Local cache only.
  }
}

function getActionPresentation(action?: AnalysisFeedbackAction | null): { label: string; className: string } | null {
  if (!action) return null;
  return ACTION_META[action] || ACTION_META.neutral;
}

const badgeClass = 'rounded-2xl border border-blue-100 bg-white px-3 py-1.5 text-sm text-slate-600';

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({
  candidates,
  jobPosition,
  analysisContext,
}) => {
  const navigate = useNavigate();
  const storedRun = useMemo(() => getStoredAnalysisRun(), []);
  const [activeView, setActiveView] = useState<FeedbackView>('overview');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [feedbackByCandidate, setFeedbackByCandidate] = useState<Record<string, AnalysisFeedbackRecord>>({});
  const [feedbackStats, setFeedbackStats] = useState<AnalysisFeedbackStats | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [overviewNotice, setOverviewNotice] = useState<string | null>(null);

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

  const selectedCandidate = useMemo(
    () => validCandidates.find((candidate) => candidate.id === selectedCandidateId) || null,
    [selectedCandidateId, validCandidates]
  );

  const currentFeedbackEntry = useMemo(
    () => (
      selectedCandidate
        ? feedbackByCandidate[selectedCandidate.id]
          || feedbackByCandidate[selectedCandidate.fileName]
          || feedbackByCandidate[selectedCandidate.candidateName]
          || null
        : null
    ),
    [feedbackByCandidate, selectedCandidate]
  );

  const feedbackEntries = useMemo(() => {
    const unique = new Map<string, AnalysisFeedbackRecord>();
    Object.values(feedbackByCandidate).forEach((entry) => {
      if (entry.id) unique.set(entry.id, entry);
    });
    return Array.from(unique.values());
  }, [feedbackByCandidate]);

  const effectiveJobPosition = jobPosition || effectiveContext?.jobPosition || storedRun?.job.position || '';
  const submittedCount = feedbackEntries.length;
  const latestFeedbackLabel = feedbackStats?.latestFeedbackAt
    ? new Date(feedbackStats.latestFeedbackAt).toLocaleString('vi-VN')
    : 'Chưa có phản hồi';

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
    if (validCandidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(validCandidates[0].id);
    }
  }, [validCandidates, selectedCandidateId]);

  useEffect(() => {
    void reloadFeedback();
  }, [reloadFeedback]);

  const handleOpenCandidate = useCallback((candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setSubmitError(null);
    setOverviewNotice(null);
    setActiveView('decision');
  }, []);

  const handleBackToOverview = useCallback(() => {
    setSubmitError(null);
    setActiveView('overview');
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
      await reloadFeedback();
      setOverviewNotice(`Đã lưu phản hồi cho ${normalizeVietnameseDisplay(selectedCandidate.candidateName)}.`);
      setActiveView('overview');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu phản hồi. Vui lòng thử lại.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [effectiveContext, effectiveJobPosition, reloadFeedback, selectedCandidate, storedRun]);

  if (validCandidates.length === 0) {
    return (
      <div className="feature-page-shell flex h-full flex-col items-center justify-center bg-[#f6f9ff] p-8 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-blue-100 bg-white">
          <Brain className="h-10 w-10 text-slate-500" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-slate-900">Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-md text-sm leading-7 text-slate-500">
          Không tìm thấy ứng viên nào đã được phân tích. Hãy chạy lại bước phân tích CV trước khi mở màn phản hồi AI.
        </p>
        <button
          onClick={() => navigate('/analysis')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về kết quả phân tích
        </button>
      </div>
    );
  }

  return (
    <div className="feature-page-shell relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f6f9ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-[0.16]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_42%)]" />

      <header className="relative z-10 shrink-0 border-b border-blue-100 bg-white/95 px-4 py-3 md:px-5" style={{ display: 'none' }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-9 w-px shrink-0 bg-blue-500" />
            <div className="min-w-0">
              <p className="supporthr-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                Quy trình phản hồi
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                {effectiveJobPosition || 'Phiên phân tích hiện tại'}
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate('/analysis')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kết quả phân tích
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
          <span className={badgeClass}>
            {submittedCount}/{validCandidates.length} ứng viên đã phản hồi
          </span>
          <span className={badgeClass}>
            Tổng bản ghi: {feedbackStats?.totalFeedback ?? submittedCount}
          </span>
          <span className={`${badgeClass} inline-flex items-center gap-1.5`}>
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            {isLoadingFeedback ? 'Đang đồng bộ...' : 'Sẵn sàng'}
          </span>
          <span className={badgeClass}>
            Mới nhất: {latestFeedbackLabel}
          </span>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto bg-[#f6f9ff]">
        {activeView === 'overview' ? (
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-5">
            <section className="rounded-2xl border border-blue-100 bg-white shadow-[0_18px_48px_rgba(30,64,175,0.08)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-blue-600">
                    Overview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Chọn ứng viên để phản hồi</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MessageSquareText className="h-4 w-4 text-blue-600" />
                  <span>4 bước gọn cho mỗi ứng viên</span>
                </div>
              </div>

              {overviewNotice ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                  <span>{overviewNotice}</span>
                </div>
              ) : null}
            </section>

            <section className="grid gap-3 xl:grid-cols-2">
              {validCandidates.map((candidate) => {
                const entry = feedbackByCandidate[candidate.id]
                  || feedbackByCandidate[candidate.fileName]
                  || feedbackByCandidate[candidate.candidateName]
                  || null;
                const actionPresentation = getActionPresentation(entry?.action);

                return (
                  <article
                    key={candidate.id}
                    className="rounded-2xl border border-blue-100 bg-white shadow-[0_18px_48px_rgba(30,64,175,0.08)] p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          Ứng viên
                        </p>
                        <h3 className="mt-2 truncate text-xl font-bold text-slate-900">{normalizeVietnameseDisplay(candidate.candidateName)}</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`${badgeClass} inline-flex items-center gap-1.5`}>
                            <FileText className="h-4 w-4 text-slate-500" />
                            {normalizeVietnameseDisplay(candidate.fileName)}
                          </span>
                          <span className={badgeClass}>
                            Điểm: <strong className="ml-1 text-slate-900">{getDisplayedScore(candidate).toFixed(1)}</strong>
                          </span>
                          <span className={badgeClass}>
                            Hạng: <strong className="ml-1 text-slate-900">{getCandidateRank(candidate) || 'C'}</strong>
                          </span>
                        </div>
                      </div>

                      {actionPresentation ? (
                        <span className={`w-fit border px-3 py-1.5 text-sm font-semibold ${actionPresentation.className}`}>
                          {actionPresentation.label}
                        </span>
                      ) : (
                        <span className="w-fit rounded-2xl border border-blue-100 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500">
                          Chưa phản hồi
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-blue-100 pt-4">
                      <div className="text-sm text-slate-500">
                        {entry?.updatedAt
                          ? `Cập nhật: ${new Date(entry.updatedAt).toLocaleString('vi-VN')}`
                          : 'Chưa có bản ghi phản hồi'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenCandidate(candidate.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(35,136,255,0.16)] transition-all hover:brightness-105"
                      >
                        {entry ? 'Chỉnh sửa' : 'Phản hồi'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        ) : selectedCandidate ? (
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-5">
            <section className="rounded-2xl border border-blue-100 bg-white shadow-[0_18px_48px_rgba(30,64,175,0.08)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-blue-600">
                    Ứng viên đang phản hồi
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{normalizeVietnameseDisplay(selectedCandidate.candidateName)}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={badgeClass}>
                    Điểm AI: <strong className="ml-1 text-slate-900">{getCandidateScore(selectedCandidate).toFixed(1)}</strong>
                  </span>
                  <span className={badgeClass}>
                    Hạng: <strong className="ml-1 text-slate-900">{getCandidateRank(selectedCandidate) || 'C'}</strong>
                  </span>
                </div>
              </div>

              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-500">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                Phản hồi được lưu theo phiên phân tích hiện tại.
              </p>
            </section>

            <AIFeedbackForm
              candidateId={selectedCandidate.id}
              candidateName={selectedCandidate.candidateName}
              fileName={selectedCandidate.fileName}
              candidateRank={getCandidateRank(selectedCandidate)}
              aiScore={getCandidateScore(selectedCandidate)}
              initialFeedback={currentFeedbackEntry}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleSubmit}
              onCancel={handleBackToOverview}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-500">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white">
              <Brain className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-base font-semibold text-slate-600">Không tìm thấy ứng viên đang chọn</p>
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              Về overview
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIFeedbackPage;
