import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ActiveAnalysisContext,
  AnalysisFeedbackAction,
  AnalysisFeedbackDraft,
  AnalysisFeedbackRecord,
  AnalysisRunData,
  Candidate,
  HardFilters,
  WeightCriteria,
} from '@/shared/types';
import AIFeedbackForm from '@/features/feedback/AIFeedbackForm';
import {
  getAnalysisFeedbackStats,
  listAnalysisFeedback,
  saveAnalysisFeedback,
  type AnalysisFeedbackStats,
} from '@/lib/services/data-sync/analysisFeedbackService';
import {
  buildAnalysisSessionId,
  getActiveAnalysisContext,
} from '@/lib/services/history-cache/activeAnalysisContext';
import { AlertCircle, ArrowLeft, ArrowRight, Brain, CheckCircle2, Clock3, FileText, Sparkles, User, Users } from 'lucide-react';

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
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('cvAnalysis.latest');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AnalysisRunData>;

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.candidates)) {
      return null;
    }

    return {
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
      job: {
        position: String(parsed.job?.position || ''),
        locationRequirement: String(parsed.job?.locationRequirement || ''),
      },
      candidates: parsed.candidates as Candidate[],
    };
  } catch {
    return null;
  }
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
  const score = readAnalysisValue<number>(candidate, ['Tổng điểm', 'Tong diem', 'Tá»•ng Ä‘iá»ƒm']);
  return typeof score === 'number' ? score : 0;
}

function getDisplayedScore(candidate: Candidate): number {
  return typeof candidate.analysis?.feedbackAdjusted === 'number'
    ? candidate.analysis.feedbackAdjusted
    : getCandidateScore(candidate);
}

function getCandidateRank(candidate: Candidate): string | undefined {
  return readAnalysisValue<string>(candidate, ['Hạng', 'Hang', 'Háº¡ng']);
}

function getFeedbackMap(entries: AnalysisFeedbackRecord[]): Record<string, AnalysisFeedbackRecord> {
  return entries.reduce<Record<string, AnalysisFeedbackRecord>>((accumulator, entry) => {
    const key = entry.candidateId || entry.fileName || entry.candidateName;
    if (key) {
      accumulator[key] = entry;
    }
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
    // Ignore local persistence failures for feedback hints.
  }
}

function getWeightsSummary(weights?: WeightCriteria): string {
  if (!weights) return 'Chưa cấu hình trọng số cho phiên này.';

  const experienceWeight = weights.workExperience?.children?.reduce((acc, item) => acc + item.weight, 0) || 0;
  const skillWeight = weights.technicalSkills?.children?.reduce((acc, item) => acc + item.weight, 0) || 0;
  const educationWeight = weights.education?.children?.reduce((acc, item) => acc + item.weight, 0) || 0;

  return `Kinh nghiệm ${experienceWeight}% · Kỹ năng ${skillWeight}% · Học vấn ${educationWeight}%`;
}

function getActionPresentation(action?: AnalysisFeedbackAction | null): { label: string; className: string } | null {
  if (!action) return null;
  return ACTION_META[action] || ACTION_META.neutral;
}

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({
  candidates,
  jobPosition,
  weights,
  hardFilters,
  analysisContext,
}) => {
  const navigate = useNavigate();
  const storedRun = useMemo(() => getStoredAnalysisRun(), []);
  const [currentView, setCurrentView] = useState<'summary' | 'feedback'>('summary');
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
  const avgScore = validCandidates.length > 0
    ? validCandidates.reduce((acc, candidate) => acc + getDisplayedScore(candidate), 0) / validCandidates.length
    : 0;
  const topCandidatesCount = validCandidates.filter((candidate) => getDisplayedScore(candidate) >= 75).length;
  const weightsSummary = useMemo(() => getWeightsSummary(weights), [weights]);

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
    setSubmitError(null);
    setSubmitSuccessMessage(null);
    void reloadFeedback();
  }, [reloadFeedback]);

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
        rank: getCandidateRank(selectedCandidate),
        reason: draft.reason,
        notes: draft.notes,
        metadata: {
          selectedCriteria: draft.selectedCriteria,
          scoreDifference: draft.scoreDifference,
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
      </div>
    );
  }

  if (currentView === 'summary') {
    return (
      <div className="feature-page-shell flex h-full flex-col bg-black p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center">
          <div className="grid w-full gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[32px] border border-slate-800/80 bg-gradient-to-br from-[#081120] via-[#0d1a2e] to-[#050b14] p-6 shadow-[0_22px_70px_-28px_rgba(15,23,42,0.92)] md:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-sky-400/25 bg-sky-400/10">
                <CheckCircle2 className="h-7 w-7 text-sky-300" />
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-tight text-white md:text-4xl">
                Hoàn tất phiên đánh giá
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                Hệ thống đã lưu kết quả phân tích ứng viên cho phiên này. Bây giờ bạn có thể phản hồi để hiệu chỉnh điểm số,
                ghi chú lý do tuyển dụng và tạo dữ liệu review nhất quán cho các lần đánh giá sau.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">CV đã phân tích</p>
                  <p className="mt-2 text-2xl font-bold text-white">{validCandidates.length}</p>
                </div>
                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Điểm trung bình</p>
                  <p className="mt-2 text-2xl font-bold text-sky-300">{avgScore.toFixed(1)}</p>
                </div>
                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Từ 75 điểm trở lên</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">{topCandidatesCount}</p>
                </div>
                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Đã có phản hồi</p>
                  <p className="mt-2 text-2xl font-bold text-violet-300">{submittedCount}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setCurrentView('feedback')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(14,165,233,0.78)] transition-all hover:bg-sky-400"
                >
                  Bắt đầu phản hồi AI
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/analysis')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800/80 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900/60 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay về kết quả phân tích
                </button>
              </div>
            </section>

            <aside className="rounded-[32px] border border-slate-800/80 bg-[#091427] p-6 shadow-[0_22px_70px_-28px_rgba(15,23,42,0.88)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70">
                  <Sparkles className="h-5 w-5 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Thông tin phiên</h2>
                  <p className="mt-1 text-sm text-slate-500">Tóm tắt nhanh trước khi bạn gửi phản hồi.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Vị trí ứng tuyển</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                    {effectiveJobPosition || 'Chưa có dữ liệu'}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ngành nghề</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                    {hardFilters?.industry || 'Chưa xác định'}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Trọng số chính</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{weightsSummary}</p>
                </div>

                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Context phản hồi</p>
                  <p className="mt-2 break-all text-sm leading-6 text-slate-300">
                    {effectiveContext?.historyId || effectiveContext?.sessionId || 'Đang dùng context local'}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-800/70 bg-slate-950/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Trạng thái đồng bộ</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {isLoadingFeedback
                      ? 'Đang đồng bộ phản hồi từ hệ thống...'
                      : `${feedbackStats?.positiveCount || 0} phản hồi tích cực · ${feedbackStats?.negativeCount || 0} phản hồi loại hoặc cần xem lại`}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page-shell flex h-full flex-col gap-4 bg-black p-4 md:p-6 lg:flex-row lg:gap-6">
      <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-800/80 bg-[#091427] shadow-[0_18px_60px_-24px_rgba(15,23,42,0.82)] lg:w-[360px]">
        <div className="border-b border-slate-800/70 bg-gradient-to-br from-[#081120] via-[#0c1728] to-[#091427] px-5 py-5">
          <button
            onClick={() => setCurrentView('summary')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về tổng quan
          </button>

          <div className="mt-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/10">
              <Users className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Danh sách ứng viên</h2>
              <p className="mt-1 text-sm text-slate-400">
                {submittedCount}/{validCandidates.length} ứng viên đã có phản hồi
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-slate-800/70 bg-slate-950/25 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Vị trí</p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-100">
                {effectiveJobPosition || 'Chưa rõ vị trí'}
              </p>
            </div>
            <div className="rounded-[20px] border border-slate-800/70 bg-slate-950/25 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Phản hồi</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                {feedbackStats?.totalFeedback || submittedCount} bản ghi
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-800/70 bg-slate-950/20 px-5 py-3 text-[12px] text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              {feedbackStats?.latestFeedbackAt
                ? new Date(feedbackStats.latestFeedbackAt).toLocaleString('vi-VN')
                : 'Chưa có phản hồi nào'}
            </span>
            <span className="shrink-0">{isLoadingFeedback ? 'Đang tải...' : 'Sẵn sàng'}</span>
          </div>
        </div>

        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto">
          {validCandidates.map((candidate) => {
            const isSelected = candidate.id === selectedCandidateId;
            const feedbackEntry = feedbackByCandidate[candidate.id]
              || feedbackByCandidate[candidate.fileName]
              || feedbackByCandidate[candidate.candidateName];
            const score = getDisplayedScore(candidate);
            const actionPresentation = getActionPresentation(feedbackEntry?.action);

            return (
              <button
                key={candidate.id}
                onClick={() => {
                  setSelectedCandidateId(candidate.id);
                  setSubmitError(null);
                  setSubmitSuccessMessage(null);
                }}
                className={`w-full border-b border-slate-800/60 border-l-4 px-5 py-4 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-l-sky-400 bg-sky-400/8'
                    : 'border-l-transparent hover:bg-slate-900/55'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {candidate.candidateName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {candidate.jobTitle || 'Chưa rõ vị trí'}
                    </p>
                  </div>

                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    score >= 75
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                      : score >= 50
                        ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
                        : 'border-rose-400/30 bg-rose-400/10 text-rose-100'
                  }`}>
                    {score.toFixed(1)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{candidate.fileName}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[12px] text-slate-500">
                    Hạng {getCandidateRank(candidate) || 'C'}
                  </span>
                  {actionPresentation ? (
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionPresentation.className}`}>
                      {actionPresentation.label}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-700/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      Chưa gửi phản hồi
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="custom-scrollbar flex-1 overflow-y-auto rounded-[28px] border border-slate-800/80 bg-[#091427] shadow-[0_18px_60px_-24px_rgba(15,23,42,0.82)]">
        {selectedCandidate ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-800/70 bg-gradient-to-r from-[#081120] via-[#0d1a2e] to-[#091427] px-6 py-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                    Phản hồi kết quả AI
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-white md:text-[28px]">
                    {selectedCandidate.candidateName}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                    Hiệu chỉnh đánh giá, lưu ghi chú tuyển dụng và đồng bộ phản hồi cho phiên phân tích hiện tại.
                  </p>
                </div>

                {currentFeedbackEntry ? (
                  <div className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getActionPresentation(currentFeedbackEntry.action)?.className || ACTION_META.neutral.className}`}>
                    {getActionPresentation(currentFeedbackEntry.action)?.label || 'Đã có phản hồi'}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
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
            </div>

            <div className="mx-auto w-full max-w-5xl flex-1 p-4 pb-20 md:p-6">
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
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-500">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-800/70 bg-slate-950/40">
              <User className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-base font-semibold text-slate-300">Hãy chọn một ứng viên ở cột bên trái</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Sau khi chọn ứng viên, bạn có thể điều chỉnh điểm số, ghi chú lý do và lưu phản hồi ngay trong màn hình này.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AIFeedbackPage;
