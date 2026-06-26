import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, FileText, Mail, MoreHorizontal, PanelRightClose, PanelRightOpen, PlayCircle, Search, Sparkles, TriangleAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { AnalysisFeedbackRecord, AppStep, Candidate, HardFilters, WeightCriteria } from '@/types';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import CvDocumentViewer from '@/features/cv-management/CvDocumentViewer';
import { ScoreLabel, WorkspaceDivider, WorkspaceEmpty, WorkspaceSearch, WorkspaceSection, workspaceScoreTone } from '@/components/workspace/WorkspacePrimitives';
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

function candidateSummary(candidate: Candidate): string {
  return normalizeVietnameseDisplay(
    candidate.hrSummary?.nhan_xet_tong_quan
    || candidate.stageDecision?.reason
    || candidate.analysis?.['Chi tiết']?.[0]?.['Giải thích']
    || 'AI đã tổng hợp hồ sơ theo tiêu chí của phiên tuyển dụng.',
  );
}

const CandidateAnalysisPane: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const strengths = candidate.analysis?.['Điểm mạnh CV'] || [];
  const weaknesses = candidate.analysis?.['Điểm yếu CV'] || [];
  const details = candidate.analysis?.['Chi tiết'] || [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-5 py-5 sm:px-6">
      <WorkspaceSection title="Nhận định AI" icon={<Sparkles size={17} className="text-[#007aff]" />}>
        <p className="text-[13px] leading-6 text-[#3a3a3c]">{candidateSummary(candidate)}</p>
      </WorkspaceSection>
      <WorkspaceDivider />

      <WorkspaceSection title="Điểm mạnh" icon={<CheckCircle2 size={17} className="text-[#34c759]" />} tone="success">
        {strengths.length ? <ul className="space-y-2.5">{strengths.slice(0, 5).map((item) => <li key={item} className="flex gap-2.5 text-[13px] leading-5 text-[#3a3a3c]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34c759]" />{normalizeVietnameseDisplay(item)}</li>)}</ul> : <p className="text-[13px] text-[#86868b]">Chưa có nhận định nổi bật.</p>}
      </WorkspaceSection>
      <WorkspaceDivider />

      <WorkspaceSection title="Cần xác minh" icon={<TriangleAlert size={17} className="text-[#ff9f0a]" />} tone="warning">
        {weaknesses.length || candidate.softFilterWarnings?.length ? (
          <ul className="space-y-2.5">
            {[...weaknesses, ...(candidate.softFilterWarnings || [])].slice(0, 4).map((item) => <li key={item} className="flex gap-2.5 text-[13px] leading-5 text-[#3a3a3c]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff9f0a]" />{normalizeVietnameseDisplay(item)}</li>)}
          </ul>
        ) : <p className="text-[13px] text-[#86868b]">Không có cảnh báo cần xử lý ngay.</p>}
      </WorkspaceSection>
      <WorkspaceDivider />

      <WorkspaceSection title="Bằng chứng đối chiếu" icon={<FileText size={17} className="text-[#007aff]" />}>
        <div className="divide-y divide-[#e5e5ea]">
          {details.slice(0, 5).map((detail, index) => (
            <div key={`${detail['Tiêu chí']}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3 first:pt-0">
              <div className="min-w-0"><p className="text-[13px] font-medium text-[#1d1d1f]">{normalizeVietnameseDisplay(detail['Tiêu chí'])}</p><p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#6e6e73]">{normalizeVietnameseDisplay(detail['Dẫn chứng'] || detail['Giải thích'])}</p></div>
              <span className="text-[12px] font-medium text-[#86868b]">{detail['Điểm']}</span>
            </div>
          ))}
          {!details.length ? <p className="text-[13px] text-[#86868b]">Chưa có bằng chứng chi tiết.</p> : null}
        </div>
      </WorkspaceSection>
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
                    />
                  </div>
                  {showCvPanel && <div className="hidden min-h-0 xl:block"><CvDocumentViewer ownerKey={documentOwner} candidate={selected} /></div>}
                </div>
              ) : (
                <div className={`grid h-full min-h-0 ${showCvPanel ? 'xl:grid-cols-[minmax(300px,44%)_minmax(0,56%)]' : ''}`}>
                  <div className="min-h-0 border-r border-[#d2d2d7]"><CandidateAnalysisPane candidate={selected} /></div>
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
