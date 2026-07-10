import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
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
import { buildAnalysisSessionId, getActiveAnalysisContext } from '@/services/history-cache/activeAnalysisContext';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';
import {
  buildCandidateBrief,
  buildFeedbackMetadata,
  buildHeadlineVerdict,
  buildRecommendedAction,
  buildTopReasons,
  buildVerificationRisks,
  getCandidateRank,
  getCandidateScore,
  getDisplayedCandidateScore,
  getInitials,
  getRankColors,
} from '@/features/recruiter/candidateDecisionSupport';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

type FeedbackView = 'overview' | 'decision';
type FeedbackFilter = 'all' | 'pending' | AnalysisFeedbackAction;

interface AIFeedbackPageProps {
  candidates: Candidate[];
  jobPosition?: string;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
  analysisContext?: ActiveAnalysisContext | null;
}

const ACTION_META: Record<AnalysisFeedbackAction, { label: string; colorClass: string; dotClass: string }> = {
  like: { label: 'Đánh giá tốt', colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500' },
  dislike: { label: 'Cần xem lại', colorClass: 'border-amber-200 bg-amber-50 text-amber-700', dotClass: 'bg-amber-500' },
  shortlist: { label: 'Đề cử', colorClass: 'border-blue-200 bg-blue-50 text-blue-700', dotClass: 'bg-blue-500' },
  reject: { label: 'Từ chối', colorClass: 'border-rose-200 bg-rose-50 text-rose-700', dotClass: 'bg-rose-500' },
  interview: { label: 'Phỏng vấn', colorClass: 'border-sky-200 bg-sky-50 text-sky-700', dotClass: 'bg-sky-500' },
  hire: { label: 'Đề xuất tuyển', colorClass: 'border-violet-200 bg-violet-50 text-violet-700', dotClass: 'bg-violet-500' },
  neutral: { label: 'Trung lập', colorClass: 'border-slate-200 bg-white text-slate-600', dotClass: 'bg-slate-400' },
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

function formatUpdatedAt(value?: number | null): string {
  if (!value) return 'Chưa có bản ghi phản hồi';
  return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const FEEDBACK_FILTERS: Array<{ key: FeedbackFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chưa phản hồi' },
  { key: 'shortlist', label: 'Đề cử' },
  { key: 'interview', label: 'Phỏng vấn' },
  { key: 'reject', label: 'Từ chối' },
  { key: 'hire', label: 'Đề xuất tuyển' },
];

export default function AIFeedbackPage({
  candidates,
  jobPosition,
  analysisContext,
}: AIFeedbackPageProps) {
  const navigate = useNavigate();
  useTheme();
  const tc = useThemeColors();
  const storedRun = useMemo(() => getStoredAnalysisRun(), []);

  const [activeView, setActiveView] = useState<FeedbackView>('overview');
  const [showEmailNotifier, setShowEmailNotifier] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [feedbackByCandidate, setFeedbackByCandidate] = useState<Record<string, AnalysisFeedbackRecord>>({});
  const [feedbackStats, setFeedbackStats] = useState<AnalysisFeedbackStats | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [overviewNotice, setOverviewNotice] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FeedbackFilter>('all');

  const effectiveContext = useMemo(
    () => buildEffectiveContext(analysisContext, storedRun, jobPosition),
    [analysisContext, jobPosition, storedRun]
  );

  const sourceCandidates = useMemo(() => {
    if (Array.isArray(candidates) && candidates.length > 0) return candidates;
    return storedRun?.candidates || [];
  }, [candidates, storedRun]);

  const validCandidates = useMemo(() => {
    const base = sourceCandidates.filter((candidate) => candidate.status === 'SUCCESS' && candidate.analysis);
    return hydrateFeedbackAdjusted(base, feedbackByCandidate);
  }, [feedbackByCandidate, sourceCandidates]);

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
  const latestFeedbackLabel = feedbackStats?.latestFeedbackAt
    ? new Date(feedbackStats.latestFeedbackAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  const filteredCandidates = useMemo(() => {
    return validCandidates.filter((candidate) => {
      const entry = feedbackByCandidate[candidate.id] || feedbackByCandidate[candidate.fileName] || feedbackByCandidate[candidate.candidateName];
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pending') return !entry;
      return entry?.action === activeFilter;
    });
  }, [activeFilter, feedbackByCandidate, validCandidates]);

  const statsChips = useMemo(() => {
    const pendingCount = validCandidates.length - feedbackEntries.length;
    return {
      reviewed: feedbackEntries.length,
      total: validCandidates.length,
      pending: Math.max(pendingCount, 0),
      strong: feedbackEntries.filter((entry) => entry.action === 'hire' || entry.action === 'shortlist' || entry.action === 'interview').length,
    };
  }, [feedbackEntries, validCandidates.length]);

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
    if (filteredCandidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(filteredCandidates[0].id);
    }
  }, [filteredCandidates, selectedCandidateId]);

  useEffect(() => {
    void reloadFeedback();
  }, [reloadFeedback]);

  const handleOpenCandidate = useCallback((candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setSubmitError(null);
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
      setSubmitError('Frontend chưa có context của phiên phân tích. Hãy chạy lại một lần để gắn phản hồi đúng scope.');
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
        metadata: buildFeedbackMetadata(selectedCandidate, draft.scoreDifference, draft.selectedCriteria, draft.isReusableGuidance),
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
      <div className="feature-page-shell flex h-full flex-col items-center justify-center p-8 text-center" style={{ background: tc.pageBg, color: tc.textPrimary }}>
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
          <Brain className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-[18px] font-bold">Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: tc.textMuted }}>
          Hãy chạy bước phân tích CV trước khi mở Decision Cockpit.
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

  const selectedBrief = selectedCandidate ? buildCandidateBrief(selectedCandidate) : null;
  const selectedEntry = currentFeedbackEntry;

  return (
    <div className="feature-page-shell relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden" style={{ background: tc.pageBg, color: tc.textPrimary }}>
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-[0.12]" />

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {activeView === 'overview' ? (
          <div className="supporthr-page-shell--wide px-4 py-5 md:px-6">
            <div className="mb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-500/20">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Recruiter Decision Cockpit</p>
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

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  { icon: Users, label: 'Đã phản hồi', value: `${statsChips.reviewed}/${statsChips.total}` },
                  { icon: ShieldAlert, label: 'Cần xử lý tiếp', value: statsChips.pending },
                  { icon: TrendingUp, label: 'Đề cử mạnh', value: statsChips.strong },
                  { icon: CheckCircle2, label: 'Đồng bộ', value: isLoadingFeedback ? 'Đang tải...' : 'Sẵn sàng' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border p-4" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
                    <div className="flex items-center gap-2 text-blue-600">
                      <item.icon className="h-4 w-4" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{item.label}</p>
                    </div>
                    <p className="mt-3 text-[24px] font-black" style={{ color: tc.textPrimary }}>{item.value}</p>
                    {item.label === 'Đồng bộ' && latestFeedbackLabel && (
                      <p className="mt-1 text-[11px]" style={{ color: tc.textMuted }}>Mới nhất {latestFeedbackLabel}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {FEEDBACK_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    activeFilter === filter.key ? 'border-blue-200 bg-blue-50 text-blue-700' : ''
                  }`}
                  style={activeFilter === filter.key ? {} : { background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {overviewNotice && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{overviewNotice}</span>
              </div>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
              {filteredCandidates.map((candidate) => {
                const entry = feedbackByCandidate[candidate.id] || feedbackByCandidate[candidate.fileName] || feedbackByCandidate[candidate.candidateName] || null;
                const actionPres = getActionPresentation(entry?.action);
                const brief = buildCandidateBrief(candidate);
                const risks = brief.topRisks.length > 0 ? brief.topRisks : ['Chưa có rủi ro nổi bật trong snapshot hiện tại.'];
                const reasons = brief.topStrengths.length > 0 ? brief.topStrengths : ['Chưa có evidence nổi bật được bóc tách.'];
                return (
                  <article
                    key={candidate.id}
                    className="rounded-3xl border p-4 transition-all hover:shadow-md"
                    style={{ background: tc.cardBg, borderColor: tc.borderSoft, boxShadow: '0 2px 12px rgba(30,64,175,0.05)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[13px] font-black text-blue-600">
                        {getInitials(candidate.candidateName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[15px] font-bold leading-tight" style={{ color: tc.textPrimary }}>
                            {normalizeVietnameseDisplay(candidate.candidateName)}
                          </h3>
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${getRankColors(getCandidateRank(candidate))}`}>
                            Hạng {getCandidateRank(candidate)}
                          </span>
                          {actionPres ? (
                            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionPres.colorClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${actionPres.dotClass}`} />
                              {actionPres.label}
                            </span>
                          ) : (
                            <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: tc.borderSoft, color: tc.textMuted, background: tc.pageBg }}>
                              Chưa phản hồi
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-5" style={{ color: tc.textPrimary }}>
                          {normalizeVietnameseDisplay(buildHeadlineVerdict(candidate))}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]" style={{ color: tc.textMuted }}>
                          <span className="rounded-full border px-2.5 py-1" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                            AI {getCandidateScore(candidate).toFixed(1)}
                          </span>
                          <span className="rounded-full border px-2.5 py-1" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                            Recruiter {getDisplayedCandidateScore(candidate).toFixed(1)}
                          </span>
                          <span className="rounded-full border px-2.5 py-1" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                            {normalizeVietnameseDisplay(buildRecommendedAction(candidate))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border p-3" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">Top evidence</p>
                        <ul className="space-y-1.5 text-[12px] leading-5" style={{ color: tc.textSecondary }}>
                          {reasons.map((item) => <li key={item}>• {normalizeVietnameseDisplay(item)}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-2xl border p-3" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">Top risks</p>
                        <ul className="space-y-1.5 text-[12px] leading-5" style={{ color: tc.textSecondary }}>
                          {risks.map((item) => <li key={item}>• {normalizeVietnameseDisplay(item)}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: tc.borderSoft }}>
                      <div className="text-[11px]" style={{ color: tc.textMuted }}>
                        <p>{formatUpdatedAt(entry?.updatedAt)}</p>
                        <p className="mt-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {normalizeVietnameseDisplay(candidate.fileName)}
                        </p>
                      </div>
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
        ) : selectedCandidate && selectedBrief ? (
          <div className="supporthr-page-shell px-4 py-5 md:px-6">
            <div className="mb-4 flex items-start gap-3 rounded-3xl border p-4" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[13px] font-black text-blue-600">
                {getInitials(selectedCandidate.candidateName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">Ứng viên đang phản hồi</p>
                <h2 className="text-[16px] font-bold" style={{ color: tc.textPrimary }}>{normalizeVietnameseDisplay(selectedCandidate.candidateName)}</h2>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium" style={{ background: tc.pageBg, borderColor: tc.borderSoft, color: tc.textSecondary }}>
                    Điểm AI: <strong style={{ color: tc.textPrimary }}>{getCandidateScore(selectedCandidate).toFixed(1)}</strong>
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRankColors(getCandidateRank(selectedCandidate))}`}>
                    Hạng {getCandidateRank(selectedCandidate)}
                  </span>
                  <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium" style={{ background: tc.pageBg, borderColor: tc.borderSoft, color: tc.textSecondary }}>
                    {normalizeVietnameseDisplay(buildRecommendedAction(selectedCandidate))}
                  </span>
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

            <div className="mb-4 grid gap-3 lg:grid-cols-4">
              <div className="rounded-3xl border p-4 lg:col-span-2" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">HR summary</p>
                <p className="mt-2 text-[14px] leading-6" style={{ color: tc.textPrimary }}>
                  {normalizeVietnameseDisplay(selectedBrief.headlineVerdict)}
                </p>
                {selectedCandidate.hrSummary && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border p-3" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: tc.textMuted }}>Yêu cầu</p>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: tc.textPrimary }}>
                        {normalizeVietnameseDisplay(selectedCandidate.hrSummary.kinh_nghiem?.so_nam_yeu_cau || 'Chưa rõ')}
                      </p>
                    </div>
                    <div className="rounded-2xl border p-3" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: tc.textMuted }}>Thực tế</p>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: tc.textPrimary }}>
                        {normalizeVietnameseDisplay(selectedCandidate.hrSummary.kinh_nghiem?.so_nam_thuc_te || 'Chưa rõ')}
                      </p>
                    </div>
                    <div className="rounded-2xl border p-3" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: tc.textMuted }}>Kết luận</p>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: tc.textPrimary }}>
                        {normalizeVietnameseDisplay(selectedCandidate.hrSummary.kinh_nghiem?.ket_luan || 'Chưa rõ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border p-4" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">JD fit</p>
                <div className="mt-3 space-y-2 text-[12px]" style={{ color: tc.textSecondary }}>
                  {(selectedBrief.matchedRequirements.length > 0 ? selectedBrief.matchedRequirements : ['Chưa có matched requirement nổi bật.']).map((item) => (
                    <div key={item} className="rounded-xl border px-3 py-2" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                      {normalizeVietnameseDisplay(item)}
                    </div>
                  ))}
                </div>
                {selectedBrief.missingRequirements.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">Thiếu gì</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBrief.missingRequirements.map((item) => (
                        <span key={item} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          {normalizeVietnameseDisplay(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border p-4" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-600">Red flags / blockers</p>
                <div className="mt-3 space-y-2 text-[12px]" style={{ color: tc.textSecondary }}>
                  {(selectedBrief.redFlags.length > 0
                    ? selectedBrief.redFlags
                    : selectedBrief.stageDecision.blockingReasons.length > 0
                      ? selectedBrief.stageDecision.blockingReasons
                      : ['Chưa có blocker lớn trong snapshot hiện tại.']).map((item) => (
                    <div key={item} className="rounded-xl border px-3 py-2" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                      {normalizeVietnameseDisplay(item)}
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: tc.borderSoft, background: tc.pageBg }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: tc.textMuted }}>Gợi ý bước tiếp theo</p>
                  <p className="mt-2 text-[13px] font-semibold" style={{ color: tc.textPrimary }}>
                    {normalizeVietnameseDisplay(buildRecommendedAction(selectedCandidate))}
                  </p>
                </div>
              </div>
            </div>

            <AIFeedbackForm
              candidateId={selectedCandidate.id}
              candidateName={selectedCandidate.candidateName}
              fileName={selectedCandidate.fileName}
              candidateRank={getCandidateRank(selectedCandidate)}
              aiScore={getCandidateScore(selectedCandidate)}
              initialFeedback={selectedEntry}
              isSubmitting={isSubmitting}
              submitError={submitError}
              evidenceChips={[
                ...buildTopReasons(selectedCandidate, 4),
                ...buildVerificationRisks(selectedCandidate, 3),
              ].slice(0, 6)}
              suggestedNotes={[
                `Kết luận nhanh: ${buildHeadlineVerdict(selectedCandidate)}`,
                `Điểm mạnh nổi bật: ${buildTopReasons(selectedCandidate, 2).join('; ') || 'cần xem thêm evidence.'}`,
                `Rủi ro cần xác minh: ${buildVerificationRisks(selectedCandidate, 2).join('; ') || 'chưa có blocker lớn.'}`,
              ]}
              onSubmit={handleSubmit}
              onCancel={handleBackToOverview}
            />
          </div>
        ) : null}
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
}
