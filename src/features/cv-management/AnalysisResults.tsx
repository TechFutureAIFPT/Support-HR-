import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Mail, MoreHorizontal, PanelRightClose, PanelRightOpen, PlayCircle, TriangleAlert, Zap } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { AnalysisFeedbackRecord, AppStep, Candidate, HardFilters, WeightCriteria } from '@/types';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import CvDocumentViewer from '@/features/cv-management/CvDocumentViewer';
import { ScoreLabel, WorkspaceEmpty, WorkspaceSearch } from '@/components/workspace/WorkspacePrimitives';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import ExpandedContent from '@/features/cv-management/ExpandedContent';
import CandidateEmailNotifier from '@/features/email/CandidateEmailNotifier';

interface AnalysisResultsProps {
  isLoading: boolean;
  loadingMessage: string;
  results: Candidate[];
  jobPosition: string;
  locationRequirement: string;
  jdText: string;
  setActiveStep?: (step: AppStep) => void;
  markStepAsCompleted?: (step: AppStep) => void;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
  documentOwner?: string;
  feedbackByCandidate?: Record<string, AnalysisFeedbackRecord>;
}

type DetailTab = 'overview' | 'ai' | 'cv';

function candidateScore(candidate: Candidate): number {
  return candidate.status === 'SUCCESS' ? candidate.analysis?.['Tổng điểm'] || 0 : 0;
}

function candidateRole(candidate: Candidate, fallback: string): string {
  return normalizeVietnameseDisplay(candidate.jobTitle) || normalizeVietnameseDisplay(fallback) || 'Vị trí chưa xác định';
}

function buildHeadlineVerdict(candidate: Candidate): string {
  if (candidate.hrSummary?.nhan_xet_tong_quan) return normalizeVietnameseDisplay(candidate.hrSummary.nhan_xet_tong_quan);
  if (candidate.stageDecision?.reason) return normalizeVietnameseDisplay(candidate.stageDecision.reason);
  const score = candidateScore(candidate);
  if (score >= 75) return 'Hồ sơ phù hợp tốt với vị trí — đề xuất ưu tiên đưa vào shortlist.';
  if (score >= 60) return 'Ứng viên đáp ứng phần lớn yêu cầu — nên xem xét mời phỏng vấn.';
  if (score >= 40) return 'Ứng viên có tiềm năng, còn một số điểm cần xác nhận thêm.';
  return 'Hồ sơ chưa đáp ứng đủ tiêu chí cốt lõi — cân nhắc trước khi đưa vào shortlist.';
}

function buildTopReasons(candidate: Candidate): string[] {
  const strengths = (candidate.analysis?.['Điểm mạnh CV'] || []).slice(0, 3);
  const matched = (candidate.jdCvMatchInsights?.matchedSkills || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...strengths, ...matched]) {
    const key = normalizeVietnameseDisplay(item).toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push(normalizeVietnameseDisplay(item)); }
    if (out.length >= 3) break;
  }
  return out;
}

function buildVerificationRisks(candidate: Candidate): string[] {
  const weaknesses = (candidate.analysis?.['Điểm yếu CV'] || []).slice(0, 2);
  const warnings = (candidate.softFilterWarnings || []).slice(0, 2);
  const missing = (candidate.jdCvMatchInsights?.missingRequirements || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...weaknesses, ...warnings, ...missing]) {
    const key = normalizeVietnameseDisplay(item).toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push(normalizeVietnameseDisplay(item)); }
    if (out.length >= 3) break;
  }
  return out;
}

type ActionResult = { label: string; colorClass: string; bgClass: string };
function buildSuggestedNextAction(score: number, riskCount: number): ActionResult {
  if (score >= 75 && riskCount === 0) return { label: 'Mời phỏng vấn', colorClass: 'text-[#34c759]', bgClass: 'bg-[#f0fff4] border-[#34c759]/30' };
  if (score >= 60 || riskCount <= 1) return { label: 'Phỏng vấn xác minh', colorClass: 'text-[#ff9f0a]', bgClass: 'bg-[#fff8ec] border-[#ff9f0a]/30' };
  return { label: 'Chưa ưu tiên shortlist', colorClass: 'text-[#86868b]', bgClass: 'bg-[#f5f5f7] border-[#d2d2d7]' };
}

const CandidateAnalysisPane: React.FC<{ candidate: Candidate; scrollable?: boolean }> = ({ candidate, scrollable = true }) => {
  const score = candidateScore(candidate);
  const verdict = buildHeadlineVerdict(candidate);
  const reasons = buildTopReasons(candidate);
  const risks = buildVerificationRisks(candidate);
  const action = buildSuggestedNextAction(score, risks.length);

  const jdMatchPct = candidate.jdCvMatchInsights
    ? Math.round(candidate.jdCvMatchInsights.similarity * 1000) / 10
    : null;
  const hasLocationRisk = candidate.locationMatch === false;
  const detectedLocation = candidate.detectedLocation?.trim() || null;
  const scoreColor = score >= 75 ? '#34c759' : score >= 60 ? '#007aff' : score >= 40 ? '#ff9f0a' : '#ff3b30';

  return (
    <div className={scrollable ? 'custom-scrollbar h-full overflow-y-auto p-4 sm:p-5' : 'p-4 sm:p-5'}>
      {/* ── Verdict card ─────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-sm">
        <div className="px-5 pt-5 pb-3">
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#007aff]">Kết luận nhanh</p>
          <p className="text-[14.5px] font-semibold leading-[1.55] text-[#1d1d1f]">{verdict}</p>
        </div>

        {/* Stats strip + action badge */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#f2f2f7] px-5 py-3">
          <span className="inline-flex items-baseline gap-0.5 rounded-lg bg-[#f2f2f7] px-3 py-1.5">
            <span className="text-[17px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{score.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-[#86868b]">/100</span>
          </span>

          {jdMatchPct !== null && (
            <span className="inline-flex items-baseline gap-1 rounded-lg bg-[#f2f2f7] px-3 py-1.5">
              <span className="text-[10.5px] font-semibold text-[#86868b]">JD</span>
              <span className="text-[15px] font-black tabular-nums leading-none text-[#007aff]">{jdMatchPct.toFixed(0)}%</span>
            </span>
          )}

          {hasLocationRisk && detectedLocation && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff3b30]/20 bg-[#fff5f5] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3b30]" />
              <span className="text-[11px] font-semibold text-[#ff3b30]">{detectedLocation}</span>
            </span>
          )}

          <div className="flex-1" />

          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[12px] font-bold ${action.bgClass} ${action.colorClass}`}>
            <Zap size={12} />
            {action.label}
          </span>
        </div>
      </div>

      {/* ── Evidence 2-column grid ────────────────────────── */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#34c759]">
            <CheckCircle2 size={13} />
            Vì sao nên cân nhắc
          </p>
          {reasons.length > 0 ? (
            <ul className="space-y-2.5">
              {reasons.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3a3a3c]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34c759]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Chưa có điểm nổi bật từ hồ sơ.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#ff9f0a]">
            <TriangleAlert size={13} />
            Điểm cần xác minh
          </p>
          {risks.length > 0 ? (
            <ul className="space-y-2.5">
              {risks.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3a3a3c]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff9f0a]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Không có cảnh báo cần xử lý.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  isLoading,
  loadingMessage,
  results,
  jobPosition,
  jdText,
  weights,
  documentOwner = 'local',
  feedbackByCandidate: externalFeedback,
}) => {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const sort = params.get('sort') === 'name' ? 'name' : 'score';
  const selectedId = params.get('candidate');
  const tab = (['overview', 'ai', 'cv'].includes(params.get('tab') || '') ? params.get('tab') : 'overview') as DetailTab;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const [showCvPanel, setShowCvPanel] = useState(true);
  const [showEmailNotifier, setShowEmailNotifier] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, Record<string, boolean>>>({});
  const handleToggleCriterion = (candidateId: string, criterion: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [candidateId]: { ...(prev[candidateId] || {}), [criterion]: !(prev[candidateId]?.[criterion] ?? false) },
    }));
  };

  const successful = useMemo(() => results.filter((candidate) => candidate.status === 'SUCCESS'), [results]);
  const feedbackByCandidate = useMemo<Record<string, AnalysisFeedbackRecord>>(() => {
    if (externalFeedback && Object.keys(externalFeedback).length > 0) return externalFeedback;
    return Object.fromEntries(
      successful.map((c) => [c.id, { id: c.id, uid: '', userEmail: '', displayName: '', photoUrl: '', action: 'shortlist' as const }])
    );
  }, [externalFeedback, successful]);
  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filtered = normalized ? successful.filter((candidate) => [candidate.candidateName, candidate.jobTitle, candidate.fileName].some((value) => normalizeVietnameseDisplay(value).toLowerCase().includes(normalized))) : successful;
    return [...filtered].sort((a, b) => sort === 'name'
      ? normalizeVietnameseDisplay(a.candidateName).localeCompare(normalizeVietnameseDisplay(b.candidateName), 'vi')
      : candidateScore(b) - candidateScore(a));
  }, [search, sort, successful]);
  const selected = successful.find((candidate) => candidate.id === selectedId) || visible[0] || null;

  useEffect(() => {
    if (!selectedId && visible[0]?.id && window.innerWidth >= 1280) setParam('candidate', visible[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, visible]);

  if (isLoading) {
    return <SupportHRLoading mode="panel" minHeightClass="min-h-full" label="Support HR" title="Đang phân tích hồ sơ" description={loadingMessage || 'Đang tổng hợp dữ liệu ứng viên.'} stages={[{ label: 'Đọc CV', hint: 'Trích xuất thông tin', tone: 'cyan' }, { label: 'Đối chiếu', hint: 'So khớp tiêu chí', tone: 'violet' }, { label: 'Xếp hạng', hint: 'Chuẩn bị shortlist', tone: 'emerald' }]} />;
  }

  if (!successful.length) {
    return <WorkspaceEmpty title="Chưa có kết quả sàng lọc" description="Nạp CV và hoàn tất phân tích để xem danh sách ứng viên tại đây." />;
  }

  return (
    <section className="flex h-full min-h-0 bg-white text-[#1d1d1f]">
      <aside className={`${selectedId ? 'hidden xl:flex' : 'flex'} min-h-0 w-full shrink-0 flex-col border-r border-[#d2d2d7] bg-white xl:w-[352px]`}>
        <div className="shrink-0 border-b border-[#d2d2d7] p-3">
          <WorkspaceSearch value={search} onChange={(value) => setParam('q', value || null)} placeholder="Tìm ứng viên" />
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#6e6e73]">
            <span>{visible.length} ứng viên</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowEmailNotifier(true)} className="flex items-center gap-1 rounded px-2 py-0.5 text-[#007aff] hover:bg-[#eef5ff]">
                <Mail size={11} />Gửi email
              </button>
              <button type="button" onClick={() => setParam('sort', sort === 'score' ? 'name' : 'score')} className="rounded px-1 py-0.5 hover:bg-[#f2f2f5]">Sắp xếp: {sort === 'score' ? 'Điểm phù hợp' : 'Tên'}</button>
            </div>
          </div>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {visible.map((candidate) => {
            const score = candidateScore(candidate);
            const active = candidate.id === selected?.id;
            return (
              <button key={candidate.id} type="button" onClick={() => setParam('candidate', candidate.id)} className={`flex w-full items-center gap-3 border-b border-[#e5e5ea] px-5 py-4 text-left transition ${active ? 'bg-[#eef5ff] shadow-[inset_2px_0_0_#007aff]' : 'hover:bg-[#f8f8fa]'}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold">
                    {normalizeVietnameseDisplay(candidate.candidateName) || 'Ứng viên chưa xác định'}
                    {(candidate.videoLinks?.length ?? 0) > 0 && (
                      <span title="Có video giới thiệu"><PlayCircle size={13} className="shrink-0 text-rose-400" /></span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-[#6e6e73]">{candidateRole(candidate, jobPosition)}</p>
                </div>
                <ScoreLabel score={score} compact />
                <ChevronRight size={15} className="text-[#86868b]" />
              </button>
            );
          })}
        </div>
        <div className="h-11 shrink-0 border-t border-[#d2d2d7] px-4 py-3 text-[11px] text-[#6e6e73]">Hiển thị {visible.length} / {successful.length} ứng viên</div>
      </aside>

      <div className={`${selectedId ? 'flex' : 'hidden xl:flex'} min-w-0 flex-1 flex-col bg-white`}>
        {selected ? (
          <>
            <header className="shrink-0 border-b border-[#d2d2d7] bg-white">
              <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <button type="button" onClick={() => setParam('candidate', null)} className="apple-toolbar-icon apple-detail-back" aria-label="Quay lại danh sách"><ArrowLeft size={17} /></button>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[16px] font-medium text-[#007aff]">{normalizeVietnameseDisplay(selected.candidateName).split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</div>
                  <div className="min-w-0"><h2 className="truncate text-[24px] font-semibold tracking-[-0.02em]">{normalizeVietnameseDisplay(selected.candidateName)}</h2><p className="mt-1 truncate text-[13px] text-[#6e6e73]">{candidateRole(selected, jobPosition)}</p><div className="mt-1"><ScoreLabel score={candidateScore(selected)} /></div></div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <a href={selected.email ? `mailto:${selected.email}` : undefined} className="apple-toolbar-button !px-2.5" aria-disabled={!selected.email}><Mail size={16} /></a>
                  {(selected.videoLinks?.length ?? 0) > 0 && (
                    <a href={selected.videoLinks![0]} target="_blank" rel="noopener noreferrer" className="apple-toolbar-button !px-2.5 !text-rose-500" title="Xem video giới thiệu"><PlayCircle size={16} /></a>
                  )}
                  <button type="button" className="apple-toolbar-button !px-2.5" aria-label="Lên lịch phỏng vấn"><CalendarDays size={16} /></button>
                  {tab !== 'cv' && (
                    <button type="button" onClick={() => setShowCvPanel(v => !v)} className="apple-toolbar-button !px-2.5" title={showCvPanel ? 'Ẩn CV' : 'Hiện CV'}>
                      {showCvPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    </button>
                  )}
                  <button type="button" className="apple-toolbar-button !px-2.5" aria-label="Thêm hành động"><MoreHorizontal size={16} /></button>
                </div>
              </div>
              <nav className="flex gap-6 overflow-x-auto px-4 text-[13px] sm:px-6" aria-label="Chi tiết ứng viên">
                {[{ key: 'overview', label: 'Tổng quan' }, { key: 'ai', label: 'Phân tích AI' }, { key: 'cv', label: 'CV' }].map((item) => <button key={item.key} type="button" onClick={() => setParam('tab', item.key)} className={`h-11 shrink-0 border-b-2 px-1 ${tab === item.key ? 'border-[#007aff] font-medium text-[#007aff]' : 'border-transparent text-[#515154] hover:text-[#1d1d1f]'}`}>{item.label}</button>)}
              </nav>
            </header>

            <div className="min-h-0 flex-1">
              {tab === 'cv' ? (
                <CvDocumentViewer ownerKey={documentOwner} candidate={selected} />
              ) : tab === 'ai' ? (
                <div className={`grid h-full min-h-0 ${showCvPanel ? 'xl:grid-cols-[minmax(340px,48%)_minmax(0,52%)]' : ''}`}>
                  <div className="custom-scrollbar min-h-0 overflow-y-auto border-r border-[#d2d2d7]">
                    <ExpandedContent
                      candidate={selected}
                      expandedCriteria={expandedCriteria}
                      onToggleCriterion={handleToggleCriterion}
                      jdText={jdText}
                      weights={weights}
                      mode="technical"
                    />
                  </div>
                  {showCvPanel && <div className="hidden min-h-0 xl:block"><CvDocumentViewer ownerKey={documentOwner} candidate={selected} /></div>}
                </div>
              ) : (
                <div className={`grid h-full min-h-0 ${showCvPanel ? 'xl:grid-cols-[minmax(340px,48%)_minmax(0,52%)]' : ''}`}>
                  <div className={`custom-scrollbar min-h-0 overflow-y-auto ${showCvPanel ? 'border-r border-[#d2d2d7]' : ''}`}>
                    <CandidateAnalysisPane candidate={selected} scrollable={false} />
                    <ExpandedContent
                      candidate={selected}
                      expandedCriteria={expandedCriteria}
                      onToggleCriterion={handleToggleCriterion}
                      jdText={jdText}
                      weights={weights}
                      mode="full"
                    />
                  </div>
                  {showCvPanel && <div className="hidden min-h-0 xl:block"><CvDocumentViewer ownerKey={documentOwner} candidate={selected} /></div>}
                </div>
              )}
            </div>
          </>
        ) : <WorkspaceEmpty title="Chọn một ứng viên" description="Chọn hồ sơ trong shortlist để xem phân tích và CV." />}
      </div>

      {showEmailNotifier && (
        <CandidateEmailNotifier
          candidates={successful}
          feedbackByCandidate={feedbackByCandidate}
          jobPosition={jobPosition}
          onClose={() => setShowEmailNotifier(false)}
        />
      )}
    </section>
  );
};

export default AnalysisResults;
