import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Award, Star, AlertTriangle, Search, Filter, Download, CircleHelp, TrendingUp, Calendar, ChevronDown, X, Crown, CheckSquare, Square, Briefcase } from 'lucide-react';
import type { AnalysisRunData, Candidate } from '@/assets/types';
import CandidateCard from '@/components/ui/candidate/CandidateCard';
import InterviewQuestionGenerator from '@/components/features/analysis/InterviewQuestionGenerator';
import { useThemeColors } from '@/components/ui/theme/useThemeColors';

const FILTER_TABS = [
  { key: 'all' as const, label: 'Tất cả', color: 'text-white', bg: 'bg-slate-700/60', border: 'border-slate-600/40' },
  { key: 'A' as const, label: 'Hạng A', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { key: 'B' as const, label: 'Hạng B', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { key: 'C' as const, label: 'Hạng C', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { key: 'FAILED' as const, label: 'Lỗi', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
] as const;

const DashboardPage: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisRunData | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C' | 'FAILED'>('all');
  const [showInterviewQuestions, setShowInterviewQuestions] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    const latestRun = localStorage.getItem('cvAnalysis.latest');
    if (latestRun) {
      try {
        const parsedData: AnalysisRunData = JSON.parse(latestRun);
        const sortedCandidates = parsedData.candidates.sort(
          (a, b) => (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0)
        );
        setAnalysisData({ ...parsedData, candidates: sortedCandidates });
      } catch {
        setAnalysisData(null);
      }
    }
  }, []);

  const handleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      newSet.has(candidateId) ? newSet.delete(candidateId) : newSet.add(candidateId);
      return newSet;
    });
  }, []);

  const summaryData = useMemo(() => {
    if (!analysisData) return { total: 0, countA: 0, countB: 0, countC: 0, failed: 0 };
    const candidates = analysisData.candidates;
    return {
      total: candidates.length,
      countA: candidates.filter(c => c.analysis?.['Hạng'] === 'A').length,
      countB: candidates.filter(c => c.analysis?.['Hạng'] === 'B').length,
      countC: candidates.filter(c => c.analysis?.['Hạng'] === 'C').length,
      failed: candidates.filter(c => c.status === 'FAILED').length,
      avgScore: Math.round(candidates.filter(c => c.status === 'SUCCESS').reduce((s, c) => s + (c.analysis?.['Tổng điểm'] || 0), 0) / Math.max(1, candidates.filter(c => c.status === 'SUCCESS').length)),
    };
  }, [analysisData]);

  const filteredCandidates = useMemo(() => {
    if (!analysisData) return [];
    let candidates = analysisData.candidates;
    if (filter !== 'all') {
      candidates = filter === 'FAILED'
        ? candidates.filter(c => c.status === 'FAILED')
        : candidates.filter(c => c.analysis?.['Hạng'] === filter && c.status === 'SUCCESS');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      candidates = candidates.filter(c =>
        c.candidateName?.toLowerCase().includes(term) ||
        c.jobTitle?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    return candidates;
  }, [analysisData, searchTerm, filter]);

  const handleSelectAll = useCallback(() => {
    if (!analysisData) return;
    let list = analysisData.candidates;
    if (filter !== 'all') {
      list = filter === 'FAILED'
        ? list.filter(c => c.status === 'FAILED')
        : list.filter(c => c.analysis?.['Hạng'] === filter && c.status === 'SUCCESS');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.candidateName?.toLowerCase().includes(term) ||
        c.jobTitle?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    if (selectedCandidates.size === list.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(list.map(c => c.id)));
    }
  }, [analysisData, filter, searchTerm, selectedCandidates]);

  const exportToCSV = useCallback(() => {
    if (!analysisData) return;
    const candidatesToExport = selectedCandidates.size > 0
      ? analysisData.candidates.filter(c => selectedCandidates.has(c.id))
      : analysisData.candidates;
    if (candidatesToExport.length === 0) return;
    const headers = ['STT', 'Họ tên', 'Hạng', 'Điểm tổng', 'Phù hợp JD (%)', 'Điện thoại', 'Email', 'Điểm mạnh', 'Điểm yếu'];
    const rows = candidatesToExport.map((c, index) => [
      index + 1,
      c.candidateName || '',
      c.analysis?.['Hạng'] || 'N/A',
      c.analysis?.['Tổng điểm'] || 'N/A',
      c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm']?.split('/')[0] || 'N/A',
      c.phone || 'N/A',
      c.email || 'N/A',
      `"${c.analysis?.['Điểm mạnh CV']?.join(', ') || 'N/A'}"`,
      `"${c.analysis?.['Điểm yếu CV']?.join(', ') || 'N/A'}"`,
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cv_export_${analysisData.job.position.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [analysisData, selectedCandidates]);

  const tc = useThemeColors();

  if (!analysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" style={{ background: tc.pageBg }}>
        <div className="mb-4 w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg" style={{ background: tc.cardBg, borderColor: tc.borderColor }}>
          <Briefcase className="w-8 h-8 opacity-50" style={{ color: tc.textMuted }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: tc.textPrimary }}>Chưa có dữ liệu phân tích</h2>
        <p className="max-w-sm text-xs leading-relaxed mb-6" style={{ color: tc.textDim }}>Vui lòng chạy một lượt phân tích CV để xem thống kê tổng quan tại đây.</p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400">Bắt đầu từ bước nhập JD</span>
        </div>
      </div>
    );
  }

  const avgScoreData = useMemo(() => {
    const successful = analysisData.candidates.filter(c => c.status === 'SUCCESS');
    if (successful.length === 0) return null;
    const avg = Math.round(successful.reduce((s, c) => s + (c.analysis?.['Tổng điểm'] || 0), 0) / successful.length);
    return { avg };
  }, [analysisData]);

  return (
    <div className="flex flex-col h-full min-h-0 relative" style={{ background: tc.pageBg }}>

      {/* ── Premium Global Header ─────────────────────────────────── */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between border-b px-5 py-3 gap-3" style={{ background: tc.headerBg, borderColor: tc.borderSoft }}>
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold leading-tight tracking-tight uppercase truncate" style={{ color: tc.textPrimary }}>
                {analysisData.job.position}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                {analysisData.candidates.length} CV
              </span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: tc.textAccent }}>
              <span>Chi tiết chiến dịch</span>
              <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-normal normal-case" style={{ color: tc.textDim }}>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <Calendar className="w-3 h-3 opacity-70" /> {new Date(analysisData.timestamp).toLocaleString('vi-VN')}
                {analysisData.job.locationRequirement && analysisData.job.locationRequirement !== 'Không có' && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="truncate">{analysisData.job.locationRequirement}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSelectMode(!selectMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border"
            style={selectMode ? { background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: tc.textPrimary } : { background: tc.cardBg, borderColor: tc.borderCard, color: tc.textSecondary }}
          >
            {selectMode ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> : <Square className="w-3.5 h-3.5 opacity-70" />}
            Chọn nhiều
          </button>
          <button
            onClick={() => setShowInterviewQuestions(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#d8b4fe' }}
          >
            <CircleHelp className="w-3.5 h-3.5" /> Gợi ý câu hỏi
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:shadow-md"
            style={{ background: '#10b981', color: '#fff', border: '1px solid rgba(16,185,129,0.8)' }}
          >
            <Download className="w-3.5 h-3.5" /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
        {/* ── KPI Stats (Dense Row) ───────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 shrink-0" style={{ background: tc.cardBg2, borderBottom: `1px solid ${tc.borderSoft}` }}>
          {[
            { label: 'TỔNG CV', value: summaryData.total, color: tc.textPrimary, icon: Users, extra: avgScoreData ? `TB: ${avgScoreData.avg}đ` : null },
            { label: 'HẠNG A', value: summaryData.countA, color: tc.gradeA.color, icon: Crown, extra: 'Xuất sắc' },
            { label: 'HẠNG B', value: summaryData.countB, color: tc.gradeB.color, icon: Star, extra: 'Khá' },
            { label: 'HẠNG C', value: summaryData.countC, color: tc.gradeC.color, icon: Award, extra: 'Đánh giá thêm' },
            { label: 'LỖI / LOẠI', value: summaryData.failed, color: tc.gradeC.color, icon: AlertTriangle, extra: 'Không đạt' }
          ].map((stat, i) => (
            <div key={stat.label} className={`flex items-center justify-between p-3 ${i !== 0 ? 'border-l' : ''} border-b md:border-b-0`} style={{ borderColor: tc.borderSoft }}>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <stat.icon className="w-3 h-3 opacity-60" style={{ color: stat.color }} />
                  <p className="text-[9px] font-bold tracking-[0.15em]" style={{ color: tc.textMuted }}>{stat.label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  {stat.extra && <span className="text-[9px] font-medium opacity-70" style={{ color: stat.color }}>{stat.extra}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Modern Filter Bar ─────────────────────────────── */}
        <div className="shrink-0 p-3" style={{ background: tc.pageBg, borderBottom: `1px solid ${tc.borderColor}` }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

            {/* Search */}
            <div className="relative w-full lg:max-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 opacity-50" style={{ color: tc.textDim }} />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên, chức danh..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-md pl-8 pr-8 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-1"
                style={{ background: tc.inputBg, border: tc.borderCard, color: tc.textPrimary, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center opacity-50 hover:opacity-100 transition-opacity">
                  <X className="w-3.5 h-3.5" style={{ color: tc.textDim }} />
                </button>
              )}
            </div>

            {/* Segmented Controls for Filters */}
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
              <div className="flex p-0.5 rounded-md shrink-0" style={{ background: tc.inputBg, border: tc.borderSoft }}>
                {FILTER_TABS.map(tab => {
                  const isActive = filter === tab.key;
                  const count = tab.key === 'all' ? summaryData.total
                    : tab.key === 'A' ? summaryData.countA
                      : tab.key === 'B' ? summaryData.countB
                        : tab.key === 'C' ? summaryData.countC
                          : summaryData.failed;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all ${isActive ? 'shadow-sm' : 'hover:opacity-80'}`}
                      style={{
                        background: isActive ? tc.cardBg : 'transparent',
                        color: isActive ? tc.textPrimary : tc.textMuted,
                        border: isActive ? tc.borderCard : '1px solid transparent'
                      }}
                    >
                      {tab.label}
                      <span className="text-[9px] px-1 py-0.5 rounded-sm opacity-70" style={{ background: tc.cardBg2 }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {selectMode && filteredCandidates.length > 0 && (
                <>
                  <div className="w-px h-4 shrink-0" style={{ background: tc.borderSoft }} />
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-colors"
                    style={{ color: tc.textSecondary }}
                  >
                    {selectedCandidates.size === filteredCandidates.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 opacity-50" />}
                    {selectedCandidates.size === filteredCandidates.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Candidate List ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-4" style={{ background: tc.pageBg }}>
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12 rounded-xl border flex flex-col items-center" style={{ background: tc.cardBg2, borderColor: tc.borderSoft }}>
              <Users className="w-8 h-8 mb-3 opacity-30" style={{ color: tc.textMuted }} />
              <p className="text-xs font-bold" style={{ color: tc.textSecondary }}>Không có ứng viên nào khớp bộ lọc</p>
              <p className="text-[10px] mt-1" style={{ color: tc.textDim }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((candidate, index) => (
                <div key={candidate.id} className="relative group">
                  {selectMode && (
                    <div className="absolute top-4 left-3 z-10 bg-black/40 rounded p-1 backdrop-blur-sm">
                      <button
                        onClick={() => handleSelectCandidate(candidate.id)}
                        className="flex items-center justify-center"
                      >
                        {selectedCandidates.has(candidate.id) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-white hover:text-indigo-300" />
                        )}
                      </button>
                    </div>
                  )}
                  <CandidateCard candidate={candidate} rank={index + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Interview Questions Modal ────────────────────────────── */}
      {showInterviewQuestions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-xl border" style={{ background: tc.cardBg, borderColor: tc.borderColor }}>
            <InterviewQuestionGenerator
              analysisData={analysisData}
              selectedCandidates={selectedCandidates.size > 0
                ? Array.from(selectedCandidates).map(id => analysisData.candidates.find(c => c.id === id)).filter(Boolean) as Candidate[]
                : analysisData.candidates.slice(0, 5)
              }
              onClose={() => setShowInterviewQuestions(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
