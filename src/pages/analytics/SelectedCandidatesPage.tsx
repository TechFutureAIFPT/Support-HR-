import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, X, Star, Mail, Phone, Briefcase, ChevronDown, ChevronUp, CheckCheck, Send } from 'lucide-react';
import type { Candidate } from '@/types';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

interface SelectedCandidatesPageProps {
  candidates: Candidate[];
  jobPosition: string;
}

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';
const SELECTED_VIEW_KEY = 'supporthr.view.selectedCandidates';

const GradeBadge = ({ grade }: { grade?: string }) => {
  if (!grade) return null;
  const colorMap: Record<string, string> = {
    A: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    B: 'bg-blue-50 text-blue-700 border-blue-200',
    C: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${colorMap[grade] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      Hạng {grade}
    </span>
  );
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    : name.charAt(0).toUpperCase();
};

const getGradeGradient = (grade?: string) => {
  if (grade === 'A') return 'from-white to-emerald-50 border-emerald-200';
  if (grade === 'B') return 'from-white to-blue-50 border-blue-200';
  return 'from-white to-amber-50 border-amber-200';
};

const getInitialsBg = (grade?: string) => {
  if (grade === 'A') return 'bg-emerald-100 text-emerald-700';
  if (grade === 'B') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};

const SelectedCandidatesPage: React.FC<SelectedCandidatesPageProps> = ({ candidates, jobPosition }) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'grade'>(() => {
    if (typeof window === 'undefined') return 'score';

    const saved = window.localStorage.getItem(SELECTED_VIEW_KEY);
    if (!saved) return 'score';

    try {
      const parsed = JSON.parse(saved) as { sortBy?: 'score' | 'name' | 'grade' };
      return parsed.sortBy && ['score', 'name', 'grade'].includes(parsed.sortBy) ? parsed.sortBy : 'score';
    } catch {
      return 'score';
    }
  });
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>(() => {
    if (typeof window === 'undefined') return 'desc';

    const saved = window.localStorage.getItem(SELECTED_VIEW_KEY);
    if (!saved) return 'desc';

    try {
      const parsed = JSON.parse(saved) as { sortDir?: 'desc' | 'asc' };
      return parsed.sortDir === 'asc' ? 'asc' : 'desc';
    } catch {
      return 'desc';
    }
  });
  const [exportMsg, setExportMsg] = useState(false);

  // Load selectedIds from localStorage (shared with chatbot)
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(SELECTED_IDS_KEY);
        if (raw) setSelectedIds(new Set(JSON.parse(raw)));
        else setSelectedIds(new Set());
      } catch {
        setSelectedIds(new Set());
      }
    };
    load();

    // Listen for changes from chatbot page
    const handler = (e: StorageEvent) => {
      if (e.key === SELECTED_IDS_KEY) load();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_VIEW_KEY, JSON.stringify({ sortBy, sortDir }));
  }, [sortBy, sortDir]);

  const removeCandidate = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      try {
        localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(next)));
      } catch { }
      return next;
    });
  };

  const clearAll = () => {
    setSelectedIds(new Set());
    try {
      localStorage.removeItem(SELECTED_IDS_KEY);
    } catch { }
  };

  const selectedCandidates = candidates
    .filter(c => selectedIds.has(c.id!) && c.status === 'SUCCESS')
    .sort((a, b) => {
      if (sortBy === 'score') {
        const diff = (b.analysis?.['Tổng điểm'] ?? 0) - (a.analysis?.['Tổng điểm'] ?? 0);
        return sortDir === 'desc' ? diff : -diff;
      }
      if (sortBy === 'grade') {
        const gradeOrder = { A: 0, B: 1, C: 2 };
        const ga = gradeOrder[(a.analysis?.['Hạng'] ?? 'C') as 'A' | 'B' | 'C'] ?? 2;
        const gb = gradeOrder[(b.analysis?.['Hạng'] ?? 'C') as 'A' | 'B' | 'C'] ?? 2;
        return sortDir === 'desc' ? ga - gb : gb - ga;
      }
      // name
      const diff = normalizeVietnameseDisplay(a.candidateName).localeCompare(normalizeVietnameseDisplay(b.candidateName), 'vi');
      return sortDir === 'desc' ? diff : -diff;
    });

  const exportToCSV = () => {
    if (selectedCandidates.length === 0) return;
    const headers = ['STT', 'Họ tên', 'Hạng', 'Điểm tổng', 'Chức danh', 'Cấp độ', 'Email', 'SĐT'];
    const csvData = [
      headers.join(','),
      ...selectedCandidates.map((c, i) => [
        i + 1,
        normalizeVietnameseDisplay(c.candidateName),
        c.analysis?.['Hạng'] || 'C',
        c.analysis?.['Tổng điểm'] ?? 0,
        normalizeVietnameseDisplay(c.jobTitle),
        normalizeVietnameseDisplay(c.experienceLevel),
        c.email || '',
        c.phone || '',
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ung_vien_duoc_chon_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setExportMsg(true);
    setTimeout(() => setExportMsg(false), 2500);
  };

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) =>
    sortBy === field
      ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />)
      : null;

  // Summary stats
  const gradeA = selectedCandidates.filter(c => c.analysis?.['Hạng'] === 'A').length;
  const gradeB = selectedCandidates.filter(c => c.analysis?.['Hạng'] === 'B').length;
  const gradeC = selectedCandidates.filter(c => c.analysis?.['Hạng'] === 'C').length;
  const avgScore = selectedCandidates.length > 0
    ? Math.round(selectedCandidates.reduce((s, c) => s + (c.analysis?.['Tổng điểm'] ?? 0), 0) / selectedCandidates.length * 10) / 10
    : 0;

  return (
    <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f6f9ff]">

      {/* ── Actions & Summary Stats ──────────────────────────────── */}
      {selectedCandidates.length > 0 && (
        <div className="shrink-0 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Điểm TB</span>
              <span className="text-sm font-black text-slate-900">{avgScore}</span>
            </div>
            <div className="h-3 w-px bg-blue-100" />
            <div className="flex items-center gap-3">
              {gradeA > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />Hạng A: {gradeA}
                </span>
              )}
              {gradeB > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700">
                  <span className="w-2 h-2 rounded-sm bg-blue-500" />Hạng B: {gradeB}
                </span>
              )}
              {gradeC > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
                  <span className="w-2 h-2 rounded-sm bg-amber-500" />Hạng C: {gradeC}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
              title="Xóa tất cả"
            >
              <X className="w-3 h-3" />
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-white text-blue-700 hover:bg-blue-50 transition-all border border-blue-200 rounded-md shadow-sm"
            >
              {exportMsg ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
              {exportMsg ? 'Đã xuất!' : `Xuất CSV (${selectedCandidates.length})`}
            </button>
            <button
              onClick={() => navigate('/contact-candidates')}
              className="flex items-center gap-1.5 rounded-md border border-sky-400/20 bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow shadow-sky-950/30 transition-all hover:from-sky-500 hover:to-cyan-500"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi email ứng viên
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────── */}
      {selectedCandidates.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10">
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Chưa có ứng viên nào được chọn</h2>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            Hãy vào trang <span className="text-blue-400 font-semibold">Gợi ý ứng viên AI</span>, trò chuyện với chatbot và nhấn{' '}
            <span className="text-slate-900 font-semibold">Chọn</span> để thêm ứng viên vào danh sách này.
          </p>
        </div>
      ) : (
        <>
          {/* ── Sort bar ─────────────────────────────── */}
          <div className="shrink-0 bg-white/95 border-b border-blue-100 px-6 py-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mr-1">Sắp xếp:</span>
            {(['score', 'grade', 'name'] as const).map(f => (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                className={`px-2.5 py-1 text-[10px] font-bold transition-all border ${sortBy === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-blue-100 text-slate-500 hover:text-blue-700 hover:border-blue-200'}`}
              >
                {f === 'score' ? 'Điểm' : f === 'grade' ? 'Hạng' : 'Tên'}
                <SortIcon field={f} />
              </button>
            ))}
            <span className="ml-auto text-[10px] text-slate-600">{selectedCandidates.length} kết quả</span>
          </div>

          {/* ── Candidate Cards ───────────────────────── */}
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {selectedCandidates.map((c, idx) => (
                <div
                  key={c.id}
                  className={`relative group bg-gradient-to-br ${getGradeGradient(c.analysis?.['Hạng'])} border rounded-2xl p-4 shadow-[0_18px_48px_rgba(37,99,235,0.10)] transition-all duration-200 hover:-translate-y-0.5`}
                >
                  {/* Rank badge */}
                  <div className="absolute top-3 left-3 w-6 h-6 bg-white border border-blue-100 flex items-center justify-center text-[9px] font-black text-slate-500">
                    #{idx + 1}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeCandidate(c.id!)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-all border border-blue-100 hover:border-red-200 opacity-0 group-hover:opacity-100"
                    title="Bỏ chọn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mt-2 mb-3">
                    <div className={`w-11 h-11 flex items-center justify-center text-sm font-black flex-shrink-0 ${getInitialsBg(c.analysis?.['Hạng'])}`}>
                      {getInitials(normalizeVietnameseDisplay(c.candidateName) || '?')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate pr-6">{normalizeVietnameseDisplay(c.candidateName)}</p>
                      <p className="text-[11px] text-slate-400 truncate">{normalizeVietnameseDisplay(c.jobTitle) || '—'}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <GradeBadge grade={c.analysis?.['Hạng']} />
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-slate-700 border border-blue-100">
                      <Star className="w-2.5 h-2.5 inline mr-0.5 text-amber-400" />
                      {c.analysis?.['Tổng điểm'] ?? '—'} điểm
                    </span>
                    {c.experienceLevel && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-600 border border-blue-100">
                        {normalizeVietnameseDisplay(c.experienceLevel)}
                      </span>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 border-t border-blue-100 pt-2.5">
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <a href={`mailto:${c.email}`} className="text-[11px] text-blue-400 hover:text-blue-300 truncate transition-colors">
                          {c.email}
                        </a>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <a href={`tel:${c.phone}`} className="text-[11px] text-slate-600 hover:text-blue-700 truncate transition-colors">
                          {c.phone}
                        </a>
                      </div>
                    )}
                    {c.detectedLocation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="text-[11px] text-slate-400 truncate">{normalizeVietnameseDisplay(c.detectedLocation)}</span>
                      </div>
                    )}
                  </div>

                  {/* Strengths preview */}
                  {c.analysis?.['Điểm mạnh CV'] && c.analysis['Điểm mạnh CV'].length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-blue-100">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Điểm mạnh</p>
                      <ul className="space-y-0.5">
                        {c.analysis['Điểm mạnh CV'].slice(0, 2).map((s, i) => (
                          <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="leading-snug">{normalizeVietnameseDisplay(s)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectedCandidatesPage;
