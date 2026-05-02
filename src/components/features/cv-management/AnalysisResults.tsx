
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import type { Candidate, AppStep, WeightCriteria, HardFilters } from '@/assets/types';
import { FileText, CheckCircle2, BarChart3, Target, ArrowRight, Layers, GraduationCap, Briefcase, Award, Languages, Clock, MapPin, Users, XCircle } from 'lucide-react';
import ExpandedContent from '@/components/features/cv-management/ExpandedContent';
import { useThemeColors } from '@/components/ui/theme/useThemeColors';

interface AnalysisResultsProps {
  isLoading: boolean;
  loadingMessage: string;
  results: Candidate[];
  jobPosition: string;
  locationRequirement: string;
  jdText: string;
  rawJdText?: string;
  setActiveStep?: (step: AppStep) => void;
  markStepAsCompleted?: (step: AppStep) => void;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
}

// --- Loader ---
const Loader: React.FC<{ message: string }> = ({ message }) => {
  const [dots, setDots] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: 'fa-file-lines', label: 'Đọc hồ sơ', color: 'text-cyan-400' },
    { icon: 'fa-brain', label: 'Phân tích AI', color: 'text-violet-400' },
    { icon: 'fa-chart-bar', label: 'Tính điểm', color: 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center min-h-[min(60vh,100%)]">
      <div className="relative">
        <div className="absolute inset-0 -full animate-ping opacity-20 bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ animationDuration: '1.8s' }} />
        <div className="absolute -inset-4 -full opacity-10 bg-gradient-to-r from-cyan-500 to-indigo-500 blur-lg" />
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 -full border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50 animate-spin" style={{ animationDuration: '0.9s' }} />
          <div className="absolute inset-2 -full border-4 border-transparent border-b-indigo-400 border-l-indigo-400/50 animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-robot text-xl text-indigo-400 animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      </div>
      <div className="max-w-sm">
        <h3 className="text-lg font-bold mb-1 text-slate-100">
          {message || 'Đang phân tích CV với AI...'}
          <span className="inline-block w-8 text-left">{'.'.repeat(dots)}</span>
        </h3>
        <p className="text-sm text-slate-400">Vui lòng chờ trong giây lát.</p>
      </div>
      <div className="flex items-center gap-6  border border-slate-700/60 bg-slate-900/60 px-6 py-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center  bg-slate-800">
              <i className={`fa-solid ${step.icon} text-sm ${step.color} ${dots % 3 === i ? 'animate-bounce' : ''}`} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

type RankedCandidate = Candidate & { rank: number; jdFitScore: number; gradeValue: number };

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ isLoading, loadingMessage, results, jobPosition, locationRequirement, jdText, rawJdText, setActiveStep, markStepAsCompleted, weights, hardFilters }) => {
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
      c.jobTitle?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    if (filter !== 'all') r = r.filter(c =>
      c.status === 'FAILED' ? filter === 'C' : c.analysis?.['Hạng'] === filter
    );
    return r.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  }, [rankedAndSortedResults, filter, debouncedSearchTerm]);

  if (isLoading) {
    return (
      <section id="module-analysis" className="module-pane active flex h-full min-h-0 w-full flex-1 flex-col">
        <Loader message={loadingMessage} />
      </section>
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
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between border-b px-4 py-3 gap-3 z-10" style={{ background: tc.headerBg, borderColor: tc.borderSoft }}>
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold leading-tight tracking-tight uppercase truncate" style={{ color: tc.textPrimary }}>
                {analysisData?.job.position || jobPosition}
              </h1>
              <div className="flex items-center gap-2 px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Đã hoàn tất</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: tc.textAccent }}>
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { if (setActiveStep) setActiveStep('dashboard'); if (markStepAsCompleted) markStepAsCompleted('analysis'); navigate('/detailed-analytics'); }}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all border shadow-sm"
            style={{ background: tc.cardBg, borderColor: tc.borderCard, color: tc.textSecondary }}
          >
            <BarChart3 size={14} /> Thống kê
          </button>
          <button
            onClick={() => { if (setActiveStep) setActiveStep('chatbot'); if (markStepAsCompleted) markStepAsCompleted('analysis'); navigate('/chatbot'); }}
            className="flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:-translate-y-0.5"
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
          <div className="shrink-0 p-4" style={{ background: tc.pageBg, borderBottom: `1px solid ${tc.borderColor}` }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

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
              <div className="flex items-center gap-4">
                <div className="flex p-1 rounded-lg" style={{ background: tc.inputBg, border: tc.borderSoft }}>
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
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${isActive ? 'shadow-sm' : 'hover:opacity-80'}`}
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

                <div className="w-px h-6" style={{ background: tc.borderSoft }} />

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
            <div className="custom-scrollbar hidden min-h-0 flex-1 overflow-y-auto md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10" style={{ borderBottom: tc.border, background: tc.tableBg }}>
                  <tr style={{ color: tc.textDim }}>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">STT</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Họ tên</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Hạng</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Điểm</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Phù hợp JD</th>
                    <th className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">File</th>
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
                          <td className="flex items-center justify-between gap-3 px-5 py-3" style={{ color: tc.textDim }}>
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
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-sm" style={{ color: tc.textDim }}>Không có ứng viên nào khớp với bộ lọc của bạn.</td></tr>
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
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" style={{ background: tc.overlayBg, zIndex: 99999 }}>
          <div className="flex h-full max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl" style={{ background: tc.modalBg, border: tc.borderAccent, boxShadow: tc.modalShadow }}>
            <div className="flex shrink-0 items-center justify-between p-5" style={{ borderBottom: tc.border }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                <h3 className="text-xl font-bold lg:text-2xl" style={{ color: tc.textPrimary }}>
                  Kết quả chi tiết: {results.find(c => c.id === expandedCandidate)?.candidateName}
                </h3>
              </div>
              <button onClick={() => setExpandedCandidate(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition" style={{ color: tc.textDim }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tc.hoverBg; (e.currentTarget as HTMLElement).style.color = tc.textMuted; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = tc.textDim; }}>
                ×
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5" style={{ background: tc.scrollBg }}>
              <ExpandedContent
                candidate={results.find(c => c.id === expandedCandidate)!}
                expandedCriteria={expandedCriteria}
                onToggleCriterion={handleToggleCriterion}
                jdText={jdText}
                rawJdText={rawJdText}
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



