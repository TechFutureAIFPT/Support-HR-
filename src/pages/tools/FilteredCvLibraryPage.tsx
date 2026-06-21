import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCheck,
  Download,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react';
import type { MobileInboxCandidate, MobileInboxHistory } from '@/types';
import { fetchFilteredCvLibrary } from '@/services/data-sync/recruitmentToolsService';
import { normalizeVietnameseDisplay, normalizeVietnameseList } from '@/utils/textDisplay';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';

interface FilteredCvLibraryPageProps {
  userEmail?: string;
}

type RankFilter = 'all' | 'A' | 'B' | 'C';
type SortMode = 'score' | 'latest' | 'name';

const rankTone: Record<string, string> = {
  A: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  B: 'border-blue-200 bg-blue-50 text-blue-700',
  C: 'border-slate-200 bg-slate-50 text-slate-600',
};

const getStageDecisionTone = (candidate: MobileInboxCandidate) => {
  const status = candidate.stageDecision?.status;
  if (status === 'ready_to_advance') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'hold' || candidate.hardFilterFailureReason) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'review') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};

const getStageDecisionLabel = (candidate: MobileInboxCandidate) =>
  normalizeVietnameseDisplay(candidate.stageDecision?.label || 'Chưa có đề xuất');

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'Chưa rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] || 'CV').toUpperCase();
};

const findHistory = (candidate: MobileInboxCandidate, history: MobileInboxHistory[]) =>
  history.find((item) => item.id === candidate.sourceHistoryId || item.id === candidate.syncHistoryId);

const FilteredCvLibraryPage: React.FC<FilteredCvLibraryPageProps> = ({ userEmail }) => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<MobileInboxCandidate[]>([]);
  const [history, setHistory] = useState<MobileInboxHistory[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<MobileInboxCandidate | null>(null);
  const [query, setQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchFilteredCvLibrary({ userEmail, historyLimit: 30, candidateLimit: 160 });
      setCandidates(response.candidates);
      setHistory(response.history);
    } catch (loadError) {
      console.warn('Không thể tải thư viện CV:', loadError);
      setCandidates([]);
      setHistory([]);
      const message = loadError instanceof Error ? loadError.message : '';
      setError(
        /abort|signal|timeout|thời gian|network/i.test(message)
          ? 'Không thể kết nối thư viện CV trong thời gian chờ. Vui lòng thử lại.'
          : message || 'Không thể tải thư viện CV đã lọc.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [userEmail]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_IDS_KEY);
      setSelectedIds(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setSelectedIds(new Set());
    }
  }, []);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => {
        if (rankFilter !== 'all' && candidate.rank !== rankFilter) return false;
        if (!normalizedQuery) return true;
        return [
          normalizeVietnameseDisplay(candidate.candidateName),
          normalizeVietnameseDisplay(candidate.fileName),
          normalizeVietnameseDisplay(candidate.jobTitle),
          normalizeVietnameseDisplay(candidate.jobPosition),
          normalizeVietnameseDisplay(candidate.industry),
          normalizeVietnameseDisplay(candidate.experienceLevel),
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => {
        if (sortMode === 'score') return right.score - left.score;
        if (sortMode === 'name') return normalizeVietnameseDisplay(left.candidateName).localeCompare(normalizeVietnameseDisplay(right.candidateName), 'vi');
        const leftHistory = findHistory(left, history)?.timestamp || 0;
        const rightHistory = findHistory(right, history)?.timestamp || 0;
        return rightHistory - leftHistory;
      });
  }, [candidates, history, query, rankFilter, sortMode]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const avg = total ? Math.round(candidates.reduce((sum, item) => sum + item.score, 0) / total) : 0;
    return {
      total,
      avg,
      rankA: candidates.filter((item) => item.rank === 'A').length,
      readyToAdvance: candidates.filter((item) => item.stageDecision?.status === 'ready_to_advance' || item.stageDecision?.autoAdvance).length,
      sessions: history.length,
    };
  }, [candidates, history]);

  const toggleSelected = (candidate: MobileInboxCandidate) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const exportCsv = () => {
    if (!filteredCandidates.length) return;
    const headers = ['STT', 'Họ tên', 'File CV', 'Vị trí', 'Điểm', 'Hạng', 'Ngành', 'Cấp độ', 'Phiên phân tích'];
    const rows = filteredCandidates.map((candidate, index) => {
      const source = findHistory(candidate, history);
      return [
        index + 1,
        normalizeVietnameseDisplay(candidate.candidateName),
        normalizeVietnameseDisplay(candidate.fileName),
        normalizeVietnameseDisplay(candidate.jobTitle || candidate.jobPosition),
        candidate.score,
        candidate.rank,
        normalizeVietnameseDisplay(candidate.industry),
        normalizeVietnameseDisplay(candidate.experienceLevel),
        normalizeVietnameseDisplay(source?.jobPosition || ''),
      ].map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',');
    });
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `thu_vien_cv_da_loc_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col bg-white">
      <div className="shrink-0 border-b border-blue-100 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">Thư viện CV đã lọc</h1>
            <p className="mt-1 text-sm text-slate-600">Tổng hợp hồ sơ đã phân tích từ các phiên tuyển dụng trước.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Làm mới
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!filteredCandidates.length}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(35,136,255,0.2)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-100 disabled:text-blue-300"
            >
              <Download className="h-4 w-4" />
              Xuất CSV
            </button>
          </div>
        </div>

        <div className="mt-5 grid border-y border-[#e5e5ea] sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tổng hồ sơ" value={stats.total} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Điểm trung bình" value={stats.avg} icon={<Star className="h-5 w-5" />} />
          <StatCard label="Hạng A" value={stats.rankA} icon={<CheckCheck className="h-5 w-5" />} />
          <StatCard label="Chuyển vòng" value={stats.readyToAdvance} icon={<ArrowRight className="h-5 w-5" />} />
        </div>
      </div>

      <div className="shrink-0 border-b border-blue-100 bg-[#f8fbff] px-5 py-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <label className="flex h-11 items-center rounded-xl border border-blue-100 bg-white px-3 shadow-sm">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, file CV, vị trí, ngành..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={rankFilter}
            onChange={(event) => setRankFilter(event.target.value as RankFilter)}
            className="h-11 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none"
          >
            <option value="all">Tất cả hạng</option>
            <option value="A">Hạng A</option>
            <option value="B">Hạng B</option>
            <option value="C">Hạng C</option>
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="h-11 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none"
          >
            <option value="score">Điểm cao nhất</option>
            <option value="latest">Mới nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5">
        {isLoading ? (
          <EmptyState icon={<Loader2 className="h-10 w-10 animate-spin text-blue-500" />} title="Đang tải thư viện CV" description="Support HR đang lấy dữ liệu hồ sơ đã lọc từ lịch sử backend." />
        ) : error ? (
          <EmptyState icon={<AlertCircle className="h-10 w-10 text-rose-500" />} title="Chưa tải được dữ liệu" description={error} />
        ) : filteredCandidates.length === 0 ? (
          <EmptyState icon={<FileText className="h-10 w-10 text-blue-500" />} title="Chưa có hồ sơ đã lọc" description="Sau khi phân tích CV, các hồ sơ phù hợp sẽ xuất hiện trong thư viện này." />
        ) : (
          <div className="grid gap-3">
            {filteredCandidates.map((candidate) => {
              const source = findHistory(candidate, history);
              const selected = selectedIds.has(candidate.id);
              const displayName = normalizeVietnameseDisplay(candidate.candidateName);
              const displayTitle = normalizeVietnameseDisplay(candidate.jobTitle || candidate.jobPosition);
              const displayFileName = normalizeVietnameseDisplay(candidate.fileName);
              const displayIndustry = normalizeVietnameseDisplay(candidate.industry);
              const displayExperience = normalizeVietnameseDisplay(candidate.experienceLevel);
              const stageLabel = getStageDecisionLabel(candidate);
              return (
                <article key={candidate.id} className="border-b border-[#e5e5ea] bg-white px-2 py-4 transition last:border-b-0 hover:bg-[#f8f8fa]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700">
                        {candidate.avatarUrl ? <img src={candidate.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : getInitials(displayName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black text-slate-950">{displayName}</h2>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black ${rankTone[candidate.rank] || rankTone.C}`}>Hạng {candidate.rank}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black ${getStageDecisionTone(candidate)}`}>
                            <ArrowRight className="h-3 w-3" />
                            {stageLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{displayTitle}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{displayFileName}</span>
                          <span>{displayIndustry}</span>
                          <span>{displayExperience}</span>
                          <span>{formatDate(source?.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">Điểm AI</p>
                        <p className="text-xl font-black text-slate-950">{candidate.score}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSelected(candidate)}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${selected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-100 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}
                      >
                        <CheckCheck className="h-4 w-4" />
                        {selected ? 'Đã chọn' : 'Chọn'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCandidate(candidate)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Chi tiết
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedCandidate && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)}>
          <aside className="custom-scrollbar h-full w-full max-w-xl overflow-y-auto border-l border-blue-100 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white px-5 py-4">
              <div>
                <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Candidate Detail</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{normalizeVietnameseDisplay(selectedCandidate.candidateName)}</h2>
              </div>
              <button type="button" onClick={() => setSelectedCandidate(null)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 hover:bg-blue-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailStat label="Điểm" value={selectedCandidate.score} />
                <DetailStat label="Hạng" value={selectedCandidate.rank} />
                <DetailStat label="Đề xuất" value={getStageDecisionLabel(selectedCandidate)} />
              </div>
              <div className={`rounded-2xl border p-4 ${getStageDecisionTone(selectedCandidate)}`}>
                <p className="text-sm font-black">{getStageDecisionLabel(selectedCandidate)}</p>
                <p className="mt-1 text-sm leading-6">{normalizeVietnameseDisplay(selectedCandidate.stageDecision?.reason || '')}</p>
                {(selectedCandidate.stageDecision?.blockingReasons || []).length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                    {selectedCandidate.stageDecision?.blockingReasons.map((reason) => (
                      <li key={reason}>{normalizeVietnameseDisplay(reason)}</li>
                    ))}
                  </ul>
                )}
              </div>
              <InfoBlock title="Điểm mạnh" items={normalizeVietnameseList(selectedCandidate.strengths)} empty="Chưa có điểm mạnh được ghi nhận." />
              <InfoBlock title="Điểm cần rà soát" items={normalizeVietnameseList(selectedCandidate.weaknesses)} empty="Chưa có điểm yếu được ghi nhận." tone="rose" />
              <InfoBlock title="Câu hỏi phỏng vấn gợi ý" items={normalizeVietnameseList(selectedCandidate.interviewQuestions)} empty="Chưa có câu hỏi gợi ý." />
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <h3 className="text-sm font-black text-slate-950">Bằng chứng rút gọn</h3>
                <div className="mt-3 grid gap-2">
                  {selectedCandidate.details.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có evidence chi tiết.</p>
                  ) : selectedCandidate.details.map((item, index) => (
                    <div key={index} className="rounded-xl bg-blue-50 px-3 py-2">
                      <p className="text-xs font-black text-blue-700">{normalizeVietnameseDisplay(item['Tiêu chí'] || item.criterion || `Tiêu chí ${index + 1}`)}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{normalizeVietnameseDisplay(item['Dẫn chứng'] || item.evidence || item['Giải thích'] || '')}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/feedback')}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Mở phản hồi ứng viên
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-b border-[#e5e5ea] px-4 py-3 last:border-b-0 sm:border-r lg:border-b-0">
    <span className="text-[#007aff]">{icon}</span>
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6e6e73]">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  </div>
);

const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex min-h-[42vh] flex-col items-center justify-center border-y border-[#e5e5ea] bg-white px-6 py-12 text-center">
    {icon}
    <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

const DetailStat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">{label}</p>
    <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
  </div>
);

const InfoBlock = ({ title, items, empty, tone = 'blue' }: { title: string; items: string[]; empty: string; tone?: 'blue' | 'rose' }) => (
  <div className="rounded-2xl border border-blue-100 bg-white p-4">
    <h3 className="text-sm font-black text-slate-950">{title}</h3>
    <div className="mt-3 grid gap-2">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : items.map((item) => (
        <div key={item} className={`flex items-start gap-2 rounded-xl px-3 py-2 ${tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-slate-700'}`}>
          <Filter className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'rose' ? 'text-rose-500' : 'text-blue-600'}`} />
          <span className="text-sm leading-6">{item}</span>
        </div>
      ))}
    </div>
  </div>
);

export default FilteredCvLibraryPage;
