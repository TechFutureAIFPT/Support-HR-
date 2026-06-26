import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/theme/ThemeProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
  MessageSquareText,
  TrendingUp,
  Users,
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
import CandidateEmailNotifier from '@/features/email/CandidateEmailNotifier';
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

const ACTION_META: Record<AnalysisFeedbackAction, { label: string; colorClass: string; dotClass: string }> = {
  like:      { label: 'Đánh giá tốt', colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500' },
  dislike:   { label: 'Cần xem lại',  colorClass: 'border-amber-200 bg-amber-50 text-amber-700',      dotClass: 'bg-amber-500' },
  shortlist: { label: 'Đề cử',        colorClass: 'border-blue-200 bg-blue-50 text-blue-700',         dotClass: 'bg-blue-500' },
  reject:    { label: 'Từ chối',      colorClass: 'border-rose-200 bg-rose-50 text-rose-700',         dotClass: 'bg-rose-500' },
  interview: { label: 'Phỏng vấn',   colorClass: 'border-sky-200 bg-sky-50 text-sky-700',            dotClass: 'bg-sky-500' },
  hire:      { label: 'Đề xuất',      colorClass: 'border-violet-200 bg-violet-50 text-violet-700',  dotClass: 'bg-violet-500' },
  neutral:   { label: 'Trung lập',    colorClass: 'border-slate-200 bg-white text-slate-600',         dotClass: 'bg-slate-400' },
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
        ? { ...candidate.analysis, feedbackAdjusted: entry.finalScore }
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
          ? { ...candidate, analysis: candidate.analysis ? { ...candidate.analysis, feedbackAdjusted: finalScore } : candidate.analysis }
          : candidate
      )),
    };
    window.localStorage.setItem('cvAnalysis.latest', JSON.stringify(nextRun));
  } catch {
    // Local cache only.
  }
}

function getActionPresentation(action?: AnalysisFeedbackAction | null) {
  if (!action) return null;
  return ACTION_META[action] || ACTION_META.neutral;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    : name.charAt(0).toUpperCase();
}

function getRankColors(rank?: string): string {
  if (rank === 'A') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (rank === 'B') return 'bg-blue-50 text-blue-700 border border-blue-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
}

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({
  candidates,
  jobPosition,
  analysisContext,
}) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const tc = useThemeColors();
  const storedRun = useMemo(() => getStoredAnalysisRun(), []);
  const [activeView, setActiveView] = useState<FeedbackView>('overview');
  const [showEmailNotifier, setShowEmailNotifier] = useState(false);
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
    ? new Date(feedbackStats.latestFeedbackAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

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

  useEffect(() => { void reloadFeedback(); }, [reloadFeedback]);

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

  /* ── Empty state ────────────────────────────────────────── */
  if (validCandidates.length === 0) {
    return (
      <div
        className="feature-page-shell flex h-full flex-col items-center justify-center p-8 text-center"
        style={{ background: tc.pageBg, color: tc.textPrimary }}
      >
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
        >
          <Brain className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-[18px] font-bold" style={{ color: tc.textPrimary }}>
          Chưa có dữ liệu ứng viên
        </h2>
        <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: tc.textMuted }}>
          Không tìm thấy ứng viên nào đã được phân tích. Hãy chạy lại bước phân tích CV trước khi mở màn phản hồi AI.
        </p>
        <button
          onClick={() => navigate('/analysis')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
          style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về kết quả phân tích
        </button>
      </div>
    );
  }

  return (
    <div
      className="feature-page-shell relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      style={{ background: tc.pageBg, color: tc.textPrimary }}
    >
      {/* Subtle grid texture */}
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-[0.12]" />

      {/* Hidden compat header */}
      <header style={{ display: 'none' }} />

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {activeView === 'overview' ? (
          <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">

            {/* ── Page header ─────────────────────────────── */}
            <div className="mb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-500/20">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Phản hồi kết quả AI</p>
                    <h1 className="text-[17px] font-bold leading-tight" style={{ color: tc.textPrimary }}>
                      {effectiveJobPosition || 'Phiên phân tích hiện tại'}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-start">
                  <button
                    onClick={() => setShowEmailNotifier(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                    style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Gửi thông báo
                  </button>
                  <button
                    onClick={() => navigate('/analysis')}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                    style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kết quả phân tích
                  </button>
                </div>
              </div>

              {/* Stats chips row */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium"
                  style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                >
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span><span className="font-bold" style={{ color: tc.textPrimary }}>{submittedCount}</span> / {validCandidates.length} đã phản hồi</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium"
                  style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  <span><span className="font-bold" style={{ color: tc.textPrimary }}>{feedbackStats?.totalFeedback ?? submittedCount}</span> bản ghi</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium"
                  style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                >
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isLoadingFeedback ? 'text-amber-500' : 'text-emerald-500'}`} />
                  <span>{isLoadingFeedback ? 'Đang đồng bộ…' : 'Đã đồng bộ'}</span>
                </div>
                {latestFeedbackLabel && (
                  <div
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium"
                    style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textMuted }}
                  >
                    <span>Mới nhất: {latestFeedbackLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Success notice */}
            {overviewNotice && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{overviewNotice}</span>
              </div>
            )}

            {/* ── Candidate grid ─────────────────────────── */}
            <div className="grid gap-3 xl:grid-cols-2">
              {validCandidates.map((candidate) => {
                const entry = feedbackByCandidate[candidate.id]
                  || feedbackByCandidate[candidate.fileName]
                  || feedbackByCandidate[candidate.candidateName]
                  || null;
                const actionPres = getActionPresentation(entry?.action);
                const rank = getCandidateRank(candidate);
                const score = getDisplayedScore(candidate);
                const initials = getInitials(normalizeVietnameseDisplay(candidate.candidateName));

                return (
                  <article
                    key={candidate.id}
                    className="rounded-2xl border p-4 transition-all hover:shadow-md"
                    style={{
                      background: tc.cardBg,
                      borderColor: tc.borderSoft,
                      boxShadow: '0 2px 12px rgba(30,64,175,0.05)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[13px] font-black text-blue-600">
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h3 className="text-[15px] font-bold leading-tight truncate" style={{ color: tc.textPrimary }}>
                            {normalizeVietnameseDisplay(candidate.candidateName)}
                          </h3>
                          {rank && (
                            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${getRankColors(rank)}`}>
                              Hạng {rank}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: tc.textMuted }}>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {normalizeVietnameseDisplay(candidate.fileName)}
                          </span>
                          <span>Điểm: <span className="font-bold" style={{ color: tc.textPrimary }}>{score.toFixed(1)}</span></span>
                        </div>
                      </div>

                      {/* Action badge */}
                      {actionPres ? (
                        <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionPres.colorClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${actionPres.dotClass}`} />
                          {actionPres.label}
                        </span>
                      ) : (
                        <span
                          className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                          style={{ borderColor: tc.borderSoft, color: tc.textMuted, background: tc.pageBg }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          Chưa phản hồi
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className="mt-4 flex items-center justify-between border-t pt-3"
                      style={{ borderColor: tc.borderSoft }}
                    >
                      <p className="text-[11px]" style={{ color: tc.textMuted }}>
                        {entry?.updatedAt
                          ? `Cập nhật: ${new Date(entry.updatedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                          : 'Chưa có bản ghi phản hồi'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenCandidate(candidate.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700"
                      >
                        {entry ? 'Chỉnh sửa' : 'Phản hồi'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

        ) : selectedCandidate ? (
          <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6">
            {/* Decision view header */}
            <div
              className="mb-4 flex items-start gap-3 rounded-2xl border p-4"
              style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[13px] font-black text-blue-600">
                {getInitials(normalizeVietnameseDisplay(selectedCandidate.candidateName))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600 mb-0.5">Ứng viên đang phản hồi</p>
                <h2 className="text-[16px] font-bold" style={{ color: tc.textPrimary }}>
                  {normalizeVietnameseDisplay(selectedCandidate.candidateName)}
                </h2>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: tc.pageBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                  >
                    Điểm AI: <strong style={{ color: tc.textPrimary }}>{getCandidateScore(selectedCandidate).toFixed(1)}</strong>
                  </span>
                  {getCandidateRank(selectedCandidate) && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRankColors(getCandidateRank(selectedCandidate))}`}>
                      Hạng {getCandidateRank(selectedCandidate)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleBackToOverview}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                style={{ background: tc.pageBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Quay lại
              </button>
            </div>

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
          <div
            className="flex h-full flex-col items-center justify-center px-6 py-12 text-center"
            style={{ color: tc.textMuted }}
          >
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
              style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
            >
              <Brain className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: tc.textSecondary }}>Không tìm thấy ứng viên đang chọn</p>
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
            >
              Về overview
            </button>
          </div>
        )}
      </main>

      {showEmailNotifier && (
        <CandidateEmailNotifier
          candidates={validCandidates}
          feedbackByCandidate={feedbackByCandidate}
          jobPosition={effectiveJobPosition}
          onClose={() => setShowEmailNotifier(false)}
        />
      )}
    </div>
  );
};

export default AIFeedbackPage;
