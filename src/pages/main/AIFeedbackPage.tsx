import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ActiveAnalysisContext,
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
import { AlertCircle, ArrowRight, Brain, CheckCircle2, Clock3, FileText, User } from 'lucide-react';

interface AIFeedbackPageProps {
  candidates: Candidate[];
  jobPosition?: string;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
  analysisContext?: ActiveAnalysisContext | null;
}

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

function getCandidateScore(candidate: Candidate): number {
  return candidate.analysis?.['Tá»•ng Ä‘iá»ƒm'] || 0;
}

function getCandidateRank(candidate: Candidate): string | undefined {
  return candidate.analysis?.['Háº¡ng'];
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

function hydrateFeedbackAdjusted(candidates: Candidate[], feedbackMap: Record<string, AnalysisFeedbackRecord>): Candidate[] {
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

  const effectiveJobPosition = jobPosition || effectiveContext?.jobPosition || storedRun?.job.position || '';
  const submittedCount = Object.keys(feedbackByCandidate).length;
  const avgScore = validCandidates.length > 0
    ? validCandidates.reduce((acc, candidate) => acc + getCandidateScore(candidate), 0) / validCandidates.length
    : 0;
  const topCandidatesCount = validCandidates.filter((candidate) => getCandidateScore(candidate) >= 75).length;

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
      setSubmitError('Frontend chua co context cua phien phan tich. Ban hay chay lai mot lan de gan feedback dung scope.');
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
      setSubmitSuccessMessage('Feedback da duoc luu vao Firebase va gan voi ung vien nay.');
      await reloadFeedback();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the luu feedback. Vui long thu lai.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [effectiveContext, effectiveJobPosition, reloadFeedback, selectedCandidate, storedRun]);

  if (validCandidates.length === 0) {
    return (
      <div className="feature-page-shell flex h-full flex-col items-center justify-center bg-black p-8 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-800/60 bg-[#11213A] shadow-2xl shadow-black/30">
          <Brain className="h-10 w-10 text-slate-600" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Chua co du lieu ung vien</h2>
        <p className="max-w-md text-sm leading-relaxed text-slate-400">
          Khong tim thay ung vien nao da duoc phan tich. Hay chay lai buoc phan tich CV truoc khi vao man hinh feedback.
        </p>
      </div>
    );
  }

  if (currentView === 'summary') {
    return (
      <div className="feature-page-shell fixed inset-0 z-[9999] flex items-center justify-center bg-black/82 p-4 backdrop-blur-md">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0b0b0f] to-[#020202] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">Hoan tat quy trinh!</h1>
            <p className="mb-8 text-sm text-slate-400">
              He thong da luu danh sach ung vien cua phien nay. Ban co the gui feedback de tao data flywheel cho AI.
            </p>

            <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 md:grid-cols-4">
              <div className="text-center">
                <p className="mb-1 text-xs font-medium text-slate-500">CV phan tich</p>
                <p className="text-xl font-bold text-white">{validCandidates.length}</p>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs font-medium text-slate-500">Diem TB</p>
                <p className="text-xl font-bold text-amber-400">{avgScore.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs font-medium text-slate-500">Hang A</p>
                <p className="text-xl font-bold text-emerald-400">{topCandidatesCount}</p>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs font-medium text-slate-500">Da feedback</p>
                <p className="text-xl font-bold text-sky-400">{submittedCount}</p>
              </div>
            </div>

            <div className="mb-8 space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-slate-800/60 py-2">
                <span className="text-sm text-slate-400">Vi tri ung tuyen</span>
                <span className="text-sm font-semibold text-slate-200">{effectiveJobPosition || 'Khong co du lieu'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/60 py-2">
                <span className="text-sm text-slate-400">Nganh nghe</span>
                <span className="text-sm font-semibold text-slate-200">{hardFilters?.industry || 'Khong xac dinh'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/60 py-2">
                <span className="text-sm text-slate-400">Trong so chinh</span>
                <span className="text-right text-sm text-slate-300">
                  KN {weights?.workExperience?.children?.reduce((acc, item) => acc + item.weight, 0) || 0}% •
                  Skill {weights?.technicalSkills?.children?.reduce((acc, item) => acc + item.weight, 0) || 0}% •
                  HV {weights?.education?.children?.reduce((acc, item) => acc + item.weight, 0) || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/60 py-2">
                <span className="text-sm text-slate-400">Context feedback</span>
                <span className="truncate text-sm text-slate-300">
                  {effectiveContext?.historyId || effectiveContext?.sessionId || 'Dang dung session local'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-400">Trang thai</span>
                <span className="text-sm text-slate-300">
                  {isLoadingFeedback ? 'Dang dong bo feedback...' : `${feedbackStats?.positiveCount || 0} positive / ${feedbackStats?.negativeCount || 0} negative`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setCurrentView('feedback')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                Danh gia AI
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/analysis')}
                className="w-full rounded-xl bg-transparent px-6 py-3.5 font-semibold text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
              >
                Dong va xem danh sach
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page-shell flex h-full flex-col gap-4 bg-black p-4 md:p-6 lg:flex-row lg:gap-6 animate-in fade-in duration-300">
      <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-800/50 bg-[#11213A] shadow-xl shadow-black/20 lg:w-[340px]">
        <div className="border-b border-slate-800/60 bg-slate-900/40 p-4">
          <button
            onClick={() => setCurrentView('summary')}
            className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Quay lai tong ket
          </button>
          <h2 className="flex items-center gap-2 text-lg font-bold text-rose-300">
            <Brain className="h-5 w-5" />
            Danh sach UCV
          </h2>
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            <p>{submittedCount}/{validCandidates.length} ung vien da co feedback</p>
            <p>{effectiveJobPosition || 'Khong ro vi tri'}</p>
            {effectiveContext?.sessionId ? (
              <p className="truncate">Session: {effectiveContext.sessionId}</p>
            ) : null}
          </div>
        </div>

        <div className="border-b border-slate-800/40 bg-slate-950/20 px-4 py-3 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {feedbackStats?.latestFeedbackAt
                ? new Date(feedbackStats.latestFeedbackAt).toLocaleString('vi-VN')
                : 'Chua co feedback nao'}
            </span>
            <span>{isLoadingFeedback ? 'Dang tai...' : `${feedbackStats?.totalFeedback || 0} records`}</span>
          </div>
        </div>

        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto">
          {validCandidates.map((candidate) => {
            const isSelected = candidate.id === selectedCandidateId;
            const feedbackEntry = feedbackByCandidate[candidate.id] || feedbackByCandidate[candidate.fileName] || feedbackByCandidate[candidate.candidateName];
            const score = typeof candidate.analysis?.feedbackAdjusted === 'number'
              ? candidate.analysis.feedbackAdjusted
              : getCandidateScore(candidate);

            return (
              <button
                key={candidate.id}
                onClick={() => {
                  setSelectedCandidateId(candidate.id);
                  setSubmitError(null);
                  setSubmitSuccessMessage(null);
                }}
                className={`w-full border-b border-slate-800/40 border-l-2 px-4 py-3.5 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-l-rose-500 bg-rose-500/5'
                    : 'border-l-transparent bg-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className={`truncate pr-2 font-semibold ${isSelected ? 'text-rose-300' : 'text-slate-200'}`}>
                    {candidate.candidateName}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-xs font-bold ${
                    score >= 75 ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400' :
                    score >= 50 ? 'border-amber-500/30 bg-amber-500/15 text-amber-400' :
                    'border-red-500/30 bg-red-500/15 text-red-500'
                  }`}>
                    {score.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                  <User className="h-3 w-3" />
                  <span className="truncate">{candidate.jobTitle || 'Chua ro vi tri'}</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="truncate text-slate-500">{candidate.fileName}</span>
                  {feedbackEntry ? (
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-semibold text-sky-300">
                      {feedbackEntry.action}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-700/70 px-2 py-0.5 text-slate-500">
                      chua gui
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto rounded-xl border border-slate-800/50 bg-[#11213A] shadow-xl shadow-black/20">
        {selectedCandidate ? (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-slate-800/50 bg-gradient-to-r from-[#0b0b0f] to-slate-950/60 px-6 py-5">
              <h1 className="flex items-center gap-3 text-xl font-bold text-slate-100">
                Hieu chinh AI cho ung vien:
                <span className="text-rose-400">{selectedCandidate.candidateName}</span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-500" />
                  {selectedCandidate.fileName}
                </span>
                <span>Diem AI: {getCandidateScore(selectedCandidate).toFixed(1)}</span>
                <span>Hang: {getCandidateRank(selectedCandidate) || 'C'}</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
                <AlertCircle className="h-4 w-4 text-rose-500/70" />
                Feedback nay se duoc luu vao backend va gan voi session phan tich de phuc vu evaluation ve sau.
              </p>
            </div>

            <div className="mx-auto w-full max-w-4xl flex-1 p-4 pb-20 md:p-6">
              <AIFeedbackForm
                candidateId={selectedCandidate.id}
                candidateName={selectedCandidate.candidateName}
                aiScore={getCandidateScore(selectedCandidate)}
                initialFeedback={
                  feedbackByCandidate[selectedCandidate.id]
                  || feedbackByCandidate[selectedCandidate.fileName]
                  || feedbackByCandidate[selectedCandidate.candidateName]
                  || null
                }
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitSuccessMessage={submitSuccessMessage}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/analysis')}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <User className="mb-3 h-12 w-12 text-slate-700" />
            <p>Hay chon mot ung vien tu danh sach ben trai.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFeedbackPage;
