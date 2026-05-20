
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import type { Candidate, AppStep, WeightCriteria, HardFilters } from '@/types';
import { FileText, CheckCircle2, BarChart3, Target, ArrowRight, Layers, GraduationCap, Briefcase, Award, Languages, Clock, MapPin, Users, XCircle } from 'lucide-react';
import ExpandedContent from '@/features/cv-management/ExpandedContent';
import { useThemeColors } from '@/hooks/useThemeColors';
import SupportHRLoading from '@/components/common/SupportHRLoading';

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
}

const getFriendlyLoadingMessage = (message: string): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes('khởi tạo')) return 'Đang chuẩn bị phiên phân tích';
  if (normalized.includes('dùng kết quả đã lưu')) return 'Đang tổng hợp dữ liệu ứng viên';
  if (normalized.includes('đọc cv')) return 'Đang xử lý hồ sơ ứng viên';
  if (normalized.includes('phân tích')) return 'Đang đánh giá mức độ phù hợp';
  if (normalized.includes('hoàn tất')) return 'Đang hoàn thiện kết quả';

  return 'Đang xử lý hồ sơ ứng viên';
};

const getLoadingStageIndex = (message: string): number => {
  const normalized = message.toLowerCase();

  if (normalized.includes('khởi tạo')) return 0;
  if (normalized.includes('đọc cv') || normalized.includes('phân tích') || normalized.includes('xử lý')) return 1;
  if (normalized.includes('hoàn tất') || normalized.includes('kết quả') || normalized.includes('tổng hợp')) return 2;

  return 1;
};

const FullScreenAnalysisLoader: React.FC<{ message: string }> = ({ message }) => (
  <SupportHRLoading
    mode="screen"
    label="Support HR // Phân tích AI"
    title="Hệ thống đang đánh giá ứng viên"
    description={`${getFriendlyLoadingMessage(message)}. Bạn chỉ cần chờ một lát, hệ thống sẽ trả về danh sách ứng viên cùng phần giải thích rõ ràng và dễ đọc.`}
    activeIndex={getLoadingStageIndex(message)}
    rotatingTitles={[
      'Hệ thống đang đánh giá ứng viên',
      'Đang tổng hợp kết quả phù hợp nhất',
      'Đang hoàn thiện bảng xếp hạng',
      'Sắp hiển thị kết quả cho bạn',
    ]}
    stages={[
      { label: 'Tiếp nhận hồ sơ', hint: 'Chuẩn hóa đầu vào', tone: 'cyan' },
      { label: 'Đánh giá phù hợp', hint: 'Đối chiếu tiêu chí', tone: 'violet' },
      { label: 'Hoàn thiện kết quả', hint: 'Chuẩn bị hiển thị', tone: 'emerald' },
    ]}
  />
);

type RankedCandidate = Candidate & { rank: number; jdFitScore: number; gradeValue: number };

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ isLoading, loadingMessage, results, jobPosition, locationRequirement, jdText, setActiveStep, markStepAsCompleted, weights, hardFilters }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'jdFit'>('score');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, Record<string, boolean>>>({});

  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => setDebouncedSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSetSearchTerm(value);
  };

  const handleExpandCandidate = (candidateId: string) => {
    setExpandedCandidate(expandedCandidate === candidateId ? null : candidateId);
  };

  const handleToggleCriterion = (candidateId: string, criterion: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], [criterion]: !prev[candidateId]?.[criterion] }
    }));
  };

  const summaryData = useMemo(() => {
    if (!results || results.length === 0) return { total: 0, countA: 0, countB: 0, countC: 0 };
    const successful = results.filter(c => c.status === 'SUCCESS' && c.analysis);
    const countA = successful.filter(c => c.analysis?.['Hạng'] === 'A').length;
    const countB = successful.filter(c => c.analysis?.['Hạng'] === 'B').length;
    return { total: successful.length, countA, countB, countC: results.length - countA - countB };
  }, [results]);

  const analysisData = useMemo(() => {
    if (!results || results.length === 0) return null;
    return {
      timestamp: Date.now(),
      job: { position: jobPosition, locationRequirement: locationRequirement || 'Không có' },
      candidates: results.map((c, i) => ({
        ...c,
        id: c.id || `candidate-${i}-${c.fileName}-${c.candidateName}`.replace(/[^a-zA-Z0-9]/g, '-')
      })),
    };
  }, [results, jobPosition, locationRequirement]);

  const rankedAndSortedResults = useMemo((): RankedCandidate[] => {
    if (!results || results.length === 0) return [];
    const gradeValues: Record<string, number> = { 'A': 3, 'B': 2, 'C': 1, 'FAILED': 0 };
    const enriched = results.map(c => ({
      ...c,
      jdFitScore: parseInt(c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10),
      gradeValue: gradeValues[c.status === 'FAILED' ? 'FAILED' : (c.analysis?.['Hạng'] || 'C')]
    }));
    enriched.sort((a, b) => {
      const pd = sortBy === 'score'
        ? (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0)
        : b.jdFitScore - a.jdFitScore;
      if (pd !== 0) return pd;
      const sd = sortBy === 'score'
        ? b.jdFitScore - a.jdFitScore
        : (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0);
      if (sd !== 0) return sd;
      return b.gradeValue - a.gradeValue;
    });
    return enriched.map((c, i) => ({ ...c, rank: i + 1 }));
  }, [results, sortBy]);

  const filteredResults = useMemo(() => {
    let r = rankedAndSortedResults;
    if (debouncedSearchTerm) r = r.filter(c =>
      c.candidateName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.jobTitle?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.detectedLocation?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    if (filter !== 'all') r = r.filter(c =>
      c.status === 'FAILED' ? filter === 'FAILED' : c.analysis?.['Hạng'] === filter
    );
    return r.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  }, [rankedAndSortedResults, filter, debouncedSearchTerm]);

  if (isLoading) {
    return (
      <>
        {typeof document !== 'undefined' && createPortal(
          <FullScreenAnalysisLoader message={loadingMessage} />,
          document.body
        )}
        <section id="module-analysis" className="module-pane active flex h-full min-h-0 w-full flex-1 flex-col" />
      </>
    );
  }

  if (results.length === 0) {
    return (
      <section id="module-analysis" className="module-pane active flex h-full min-h-0 w-full flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-20">
          <div className="relative mb-6 inline-block">
            <i className="fa-solid fa-chart-line text-5xl text-slate-600 md:text-6xl"></i>
            <div className="absolute -top-2 -right-2 h-4 w-4 -full bg-blue-500"></div>
          </div>
          <h3 className="mb-3 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Sẵn Sàng Phân Tích</h3>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-slate-400">Kết quả AI sẽ xuất hiện ở đây sau khi bạn cung cấp mô tả công việc và các tệp CV.</p>
        </div>
      </section>
    );
  }

  const tc = useThemeColors();

  return (
    <section id="module-analysis" className="module-pane active relative flex h-full min-h-0 w-full flex-1 flex-col" style={{ background: tc.pageBg }}>
      {/* ── Premium Global Header ─────────────────────────────────── */}
      <div className="shrink-0 z-10 flex flex-col justify-between gap-3 border-b px-3 py-3 sm:px-4 md:flex-row md:items-center" style={{ background: tc.headerBg, borderColor: tc.borderSoft }}>
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-base font-bold leading-tight tracking-tight uppercase truncate" style={{ color: tc.textPrimary }}>
                {analysisData?.job.position || jobPosition}
              </h1>
              <div className="flex items-center gap-2 px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Đã hoàn tất</span>
              </div>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase leading-tight tracking-[0.16em] sm:gap-3" style={{ color: tc.textAccent }}>
              <span>Chiến dịch hiện tại</span>
              <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-normal normal-case" style={{ color: tc.textDim }}>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <Clock className="w-3 h-3 opacity-70" /> {analysisData ? new Date(analysisData.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Không rõ'}
                {locationRequirement && locationRequirement !== 'Không có' && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="truncate">{locationRequirement}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            onClick={() => { if (setActiveStep) setActiveStep('dashboard'); if (markStepAsCompleted) markStepAsCompleted('analysis'); navigate('/detailed-analytics'); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold shadow-sm transition-all sm:w-auto"
            style={{ background: tc.cardBg, borderColor: tc.borderCard, color: tc.textSecondary }}
          >
            <BarChart3 size={14} /> Thống kê
          </button>
          <button
            onClick={() => { if (setActiveStep) setActiveStep('chatbot'); if (markStepAsCompleted) markStepAsCompleted('analysis'); navigate('/chatbot'); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: '1px solid rgba(165,180,252,0.3)' }}
          >
            <Target size={14} /> Gợi ý AI
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">

          {/* ── Campaign Header & KPIs (Combined sleek section) ────────── */}
          <div className="flex flex-col border-b" style={{ background: tc.cardBg, borderColor: tc.borderColor }}>
            {/* Bottom row: Sleek KPI stats */}
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ background: 'rgba(0,0,0,0.1)' }}>
              {[
                { label: 'TỔNG CV', value: summaryData.total, color: tc.textPrimary, icon: Users, bgIcon: 'rgba(255,255,255,0.03)' },
                { label: 'HẠNG A', value: summaryData.countA, color: tc.gradeA.color, icon: Award, bgIcon: 'rgba(16,185,129,0.05)' },
                { label: 'HẠNG B', value: summaryData.countB, color: tc.gradeB.color, icon: CheckCircle2, bgIcon: 'rgba(59,130,246,0.05)' },
                { label: 'LOẠI / LỖI', value: summaryData.countC, color: tc.gradeC.color, icon: XCircle, bgIcon: 'rgba(239,68,68,0.05)' }
              ].map((stat, i) => (
                <div key={stat.label} className={`relative flex items-center justify-between p-4 ${i !== 0 ? 'border-l' : ''}`} style={{ borderColor: tc.borderSoft }}>
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.15em] mb-1 opacity-70" style={{ color: tc.textMuted }}>{stat.label}</p>
                    <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: stat.bgIcon }}>
                    <stat.icon className="w-5 h-5 opacity-50" style={{ color: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Modern Filter Bar ─────────────────────────────── */}
          <div className="shrink-0 p-3 sm:p-4" style={{ background: tc.pageBg, borderBottom: `1px solid ${tc.borderColor}` }}>
            <div className="flex min-w-0 flex-col justify-between gap-3 lg:flex-row lg:items-center lg:gap-4">

              {/* Search */}
              <div className="relative w-full lg:max-w-[320px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-xs opacity-50" style={{ color: tc.textDim }} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên, file CV..."
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-4 py-2 text-[13px] font-medium transition-all focus:outline-none focus:ring-1"
                  style={{ background: tc.inputBg, border: tc.borderCard, color: tc.textPrimary, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                />
              </div>

              {/* Segmented Controls for Filters */}
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="custom-scrollbar flex max-w-full overflow-x-auto rounded-lg p-1" style={{ background: tc.inputBg, border: tc.borderSoft }}>
                  {[
                    { label: 'Tất cả', value: 'all' },
                    { label: 'Hạng A', value: 'A' },
                    { label: 'Hạng B', value: 'B' },
                    { label: 'Hạng C', value: 'C' },
                    { label: 'Lỗi', value: 'FAILED' }
                  ].map(tab => {
                    const isActive = filter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-all sm:px-4 ${isActive ? 'shadow-sm' : 'hover:opacity-80'}`}
                        style={{
                          background: isActive ? tc.cardBg : 'transparent',
                          color: isActive ? tc.textPrimary : tc.textMuted,
                          border: isActive ? tc.borderCard : '1px solid transparent'
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="hidden h-6 w-px sm:block" style={{ background: tc.borderSoft }} />

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium" style={{ color: tc.textDim }}>Sắp xếp:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'score' | 'jdFit')}
                      className="appearance-none bg-transparent text-[13px] font-bold focus:outline-none pr-5 cursor-pointer"
                      style={{ color: tc.textPrimary }}
                    >
                      <option value="score" className="bg-[#0f172a]">Điểm Tổng</option>
                      <option value="jdFit" className="bg-[#0f172a]">Phù hợp JD</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                      <i className="fa-solid fa-chevron-down text-[10px]" style={{ color: tc.textDim }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Results table ───────────────────────────── */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">

            {/* Desktop */}
            <div className="custom-scrollbar hidden min-h-0 flex-1 overflow-auto md:block">
              <table className="min-w-[720px] w-full text-sm xl:min-w-[980px]">
                <thead className="sticky top-0 z-10" style={{ borderBottom: tc.border, background: tc.tableBg }}>
                  <tr style={{ color: tc.textDim }}>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">STT</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Họ tên</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Hạng</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Điểm</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Phù hợp JD</th>
                    <th className="hidden px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[0.2em] lg:table-cell">Địa điểm</th>
                    <th className="hidden px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[0.2em] xl:table-cell">File</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((candidate, index) => {
                    const isSelected = selectedCandidates.has(candidate.id);
                    const grade = candidate.status === 'FAILED' ? 'FAILED' : (candidate.analysis?.['Hạng'] || 'C');
                    const overallScore = candidate.status === 'FAILED' ? 0 : (candidate.analysis?.['Tổng điểm'] || 0);
                    const jdFitScore = candidate.status === 'FAILED' ? 0 : parseInt(candidate.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10);
                    return (
                      <React.Fragment key={candidate.id}>
                        <tr
                          className="cursor-pointer transition-colors duration-150"
                          style={{ borderTop: tc.borderSoft, background: isSelected ? 'rgba(99,102,241,0.06)' : undefined }}
                          onClick={e => { if ((e.target as HTMLElement).tagName !== 'INPUT') handleExpandCandidate(candidate.id); }}
                        >
                          <td className="px-5 py-3 font-medium" style={{ color: tc.textDim }}>#{index + 1}</td>
                          <td className="px-5 py-3 font-medium" style={{ color: tc.textSecondary }}>{candidate.candidateName || 'Chưa xác định'}</td>
                          <td className="px-5 py-3">
                            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={
                              candidate.status === 'FAILED'
                                ? tc.gradeFail
                                : grade === 'A'
                                  ? tc.gradeA
                                  : grade === 'B'
                                    ? tc.gradeB
                                    : tc.gradeC
                            }>{grade}</span>
                          </td>
                          <td className="px-5 py-3 font-medium" style={{ color: tc.textSecondary }}>{overallScore}</td>
                          <td className="px-5 py-3 font-medium" style={{ color: tc.textSecondary }}>{jdFitScore}%</td>
                          <td className="hidden px-5 py-3 font-medium lg:table-cell" style={{ color: candidate.locationMatch === false ? '#fca5a5' : tc.textSecondary }}>
                            <span className="inline-flex max-w-[150px] items-center gap-1.5 truncate">
                              <MapPin size={13} className="shrink-0 opacity-70" />
                              {candidate.detectedLocation || 'Chưa rõ'}
                            </span>
                          </td>
                          <td className="hidden items-center justify-between gap-3 px-5 py-3 xl:flex" style={{ color: tc.textDim }}>
                            <span className="truncate text-sm">{candidate.fileName || ''}</span>
                            <button style={{ color: 'rgba(99,102,241,0.5)' }} onClick={e => { e.stopPropagation(); handleExpandCandidate(candidate.id); }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#818cf8'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(99,102,241,0.5)'; }}>
                              ▾
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-sm" style={{ color: tc.textDim }}>Không có ứng viên nào khớp với bộ lọc của bạn.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4 md:hidden">
              {filteredResults.map((candidate, index) => {
                const isSelected = selectedCandidates.has(candidate.id);
                const grade = candidate.status === 'FAILED' ? 'FAILED' : (candidate.analysis?.['Hạng'] || 'C');
                const overallScore = candidate.status === 'FAILED' ? 0 : (candidate.analysis?.['Tổng điểm'] || 0);
                const jdFitScore = candidate.status === 'FAILED' ? 0 : parseInt(candidate.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10);
                return (
                  <div key={candidate.id} className=" rounded p-4 transition-all" style={{ background: isSelected ? 'rgba(99,102,241,0.06)' : tc.cardBg, border: `1px solid ${isSelected ? 'rgba(99,102,241,0.25)' : tc.borderColor}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: tc.textDim }}>#{index + 1}</span>
                        <div className="min-w-0">
                          <h4 className="max-w-[180px] truncate text-base font-semibold" style={{ color: tc.textSecondary }}>{candidate.candidateName || 'Chưa xác định'}</h4>
                          <p className="mt-0.5 max-w-[180px] truncate text-xs" style={{ color: tc.textDim }}>{candidate.jobTitle || 'Chưa có chức danh'}</p>
                          <p className="mt-1 flex max-w-[180px] items-center gap-1 truncate text-xs" style={{ color: candidate.locationMatch === false ? '#fca5a5' : tc.textDim }}>
                            <MapPin size={12} className="shrink-0 opacity-70" />
                            {candidate.detectedLocation || 'Chưa rõ địa điểm'}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={
                        candidate.status === 'FAILED'
                          ? tc.gradeFail
                          : grade === 'A'
                            ? tc.gradeA
                            : grade === 'B'
                              ? tc.gradeB
                              : tc.gradeC
                      }>{grade}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded p-2" style={{ background: tc.cardBg, border: tc.borderSoft }}>
                        <p className="mb-1 text-xs" style={{ color: tc.textDim }}>Điểm tổng</p><p className="text-lg font-semibold" style={{ color: tc.textSecondary }}>{overallScore}</p>
                      </div>
                      <div className="rounded p-2" style={{ background: tc.cardBg, border: tc.borderSoft }}>
                        <p className="mb-1 text-xs" style={{ color: tc.textDim }}>Phù hợp JD</p><p className="text-lg font-semibold" style={{ color: tc.textSecondary }}>{jdFitScore}%</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between" style={{ borderTop: tc.borderSoft, paddingTop: '12px' }}>
                      <span className="max-w-[150px] truncate text-xs" style={{ color: tc.textDim }}>{candidate.fileName}</span>
                      <button onClick={() => handleExpandCandidate(candidate.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition" style={{ color: 'rgba(99,102,241,0.6)' }}>
                        {expandedCandidate === candidate.id ? 'Thu gọn' : 'Chi tiết'} ▾
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredResults.length === 0 && (
                <div className="py-12 text-center text-sm" style={{ color: '#334155' }}>Không có ứng viên nào khớp với bộ lọc.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expand modal ──────────────────────────────── */}
      {expandedCandidate && results.find(c => c.id === expandedCandidate) && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-end justify-center p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4" style={{ background: tc.overlayBg, zIndex: 99999 }}>
          <div className="flex h-[92svh] w-full max-w-7xl flex-col overflow-hidden rounded-t-2xl sm:h-full sm:max-h-[95vh] sm:rounded-xl" style={{ background: tc.modalBg, border: tc.borderAccent, boxShadow: tc.modalShadow }}>
            <div className="flex shrink-0 items-center justify-between gap-3 p-4 sm:p-5" style={{ borderBottom: tc.border }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                <h3 className="line-clamp-2 text-base font-bold sm:text-xl lg:text-2xl" style={{ color: tc.textPrimary }}>
                  Kết quả chi tiết: {results.find(c => c.id === expandedCandidate)?.candidateName}
                </h3>
              </div>
              <button onClick={() => setExpandedCandidate(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition" style={{ color: tc.textDim }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tc.hoverBg; (e.currentTarget as HTMLElement).style.color = tc.textMuted; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = tc.textDim; }}>
                ×
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-5" style={{ background: tc.scrollBg }}>
              <ExpandedContent
                candidate={results.find(c => c.id === expandedCandidate)!}
                expandedCriteria={expandedCriteria}
                onToggleCriterion={handleToggleCriterion}
                jdText={jdText}
                weights={weights}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default AnalysisResults;



