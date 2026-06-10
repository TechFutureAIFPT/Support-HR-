import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import { fetchManualHistory, fetchRecentHistory } from '@/services/history-cache/historyService';
import type { HistoryEntry } from '@/types';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

interface HistoryPageProps {
  userEmail?: string;
  onRestore?: (payload: HistoryEntry['fullPayload']) => void;
}

const TIME_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: '24h', label: '24 giờ' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
] as const;

type TimeFilter = (typeof TIME_FILTERS)[number]['key'];

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const gradeTone = {
  A: 'border-[#f5d6bb]/30 bg-[#f5d6bb]/10 text-[#f5d6bb]',
  B: 'border-[#f5d6bb]/20 bg-[#f5d6bb]/[0.07] text-[#ffd8a8]',
  C: 'border-red-500/20 bg-red-500/10 text-red-300',
};

const getCandidateGrade = (candidate: NonNullable<HistoryEntry['fullPayload']>['candidates'][number]) =>
  (candidate.analysis?.['Hạng'] || 'C') as 'A' | 'B' | 'C';

const HistoryPage: React.FC<HistoryPageProps> = ({ userEmail, onRestore }) => {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const [autoHistory, manualHistory] = await Promise.all([
        fetchRecentHistory(50, userEmail),
        fetchManualHistory(userEmail),
      ]);
      const merged = [...manualHistory.map((h) => ({ ...h, id: `manual-${h.id}` })), ...autoHistory].sort(
        (a, b) => b.timestamp - a.timestamp,
      );
      setItems(merged);
    } catch {
      setError('Không tải được lịch sử. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
  };

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (timeFilter === 'all') return true;
        const diff = Date.now() - item.timestamp;
        if (timeFilter === '24h') return diff <= 86_400_000;
        if (timeFilter === '7d') return diff <= 604_800_000;
        if (timeFilter === '30d') return diff <= 2_592_000_000;
        return true;
      }),
    [items, timeFilter],
  );

  const summary = useMemo(() => {
    const latest = filtered[0]?.timestamp;
    return {
      total: items.length,
      visible: filtered.length,
      manual: items.filter((item) => item.id.startsWith('manual-')).length,
      candidates: filtered.reduce((sum, item) => sum + (item.totalCandidates || 0), 0),
      latest: latest ? formatDateTime(latest) : 'Chưa có',
    };
  }, [filtered, items]);

  if (loading) {
    return (
      <SupportHRLoading
        mode="panel"
        minHeightClass="min-h-[50vh]"
        label="Support HR // History"
        title="Đang tải lịch sử phân tích"
        description="Hệ thống đang tổng hợp các phiên phân tích trước đó để bạn có thể rà soát và khôi phục nhanh."
        stages={[
          { label: 'Lấy dữ liệu', hint: 'Đọc lịch sử đã lưu', tone: 'cyan' },
          { label: 'Tổng hợp', hint: 'Sắp xếp phiên phân tích', tone: 'violet' },
          { label: 'Hiển thị', hint: 'Sẵn sàng rà soát', tone: 'emerald' },
        ]}
      />
    );
  }

  if (error) {
    return (
      <div className="feature-page-shell flex min-h-[50vh] flex-col items-center justify-center bg-black px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center border border-red-500/30 bg-red-500/10">
          <i className="fa-solid fa-circle-exclamation text-2xl text-red-300" />
        </div>
        <p className="mb-4 font-medium text-red-200">{error}</p>
        <button
          onClick={handleRefresh}
          className="border border-white bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-slate-100"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-black text-slate-100">
      <header className="shrink-0 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-3 border border-[#f5d6bb]/20 bg-white/[0.03] px-3 py-2 supporthr-mono text-[10px] uppercase tracking-[0.22em] text-[#f5d6bb]">
              <span className="h-2 w-2 rounded-full bg-[#f5d6bb]" />
              AI_ACTIVITY_HISTORY
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Lịch sử phân tích CV
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Rà soát các phiên sàng lọc, xem phân bố hạng ứng viên và khôi phục nhanh bộ dữ liệu đã phân tích.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex border border-white/10 bg-black/70 p-1">
              {TIME_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key)}
                  className={`px-3 py-2 supporthr-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                    timeFilter === filter.key
                      ? 'bg-white text-black'
                      : 'text-slate-500 hover:text-[#f5d6bb]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 border border-[#f5d6bb]/25 bg-[#f5d6bb]/8 px-4 supporthr-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f5d6bb] transition hover:bg-[#f5d6bb]/12 disabled:opacity-50"
            >
              <i className={`fa-solid fa-rotate ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Phiên lưu trữ', value: summary.total },
            { label: 'Đang hiển thị', value: summary.visible },
            { label: 'Tổng CV', value: summary.candidates },
            { label: 'Mới nhất', value: summary.latest },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 bg-white/[0.025] px-4 py-3">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-[#f5d6bb]/70">{item.label}</p>
              <p className="mt-2 truncate text-lg font-black text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="flex min-h-[48vh] flex-col items-center justify-center border border-dashed border-white/10 bg-black/55 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center border border-white/10 bg-white/[0.03]">
              <i className="fa-solid fa-box-open text-2xl text-slate-600" />
            </div>
            <p className="font-semibold text-slate-200">Không có phiên phân tích nào</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Bộ lọc hiện tại chưa có dữ liệu. Bạn có thể chuyển về "Tất cả" để xem toàn bộ lịch sử.
            </p>
            <button
              onClick={() => setTimeFilter('all')}
              className="mt-5 border border-[#f5d6bb]/25 bg-[#f5d6bb]/8 px-4 py-2 supporthr-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="group flex min-h-[25rem] cursor-pointer flex-col border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.74))] p-4 transition hover:border-[#f5d6bb]/35 hover:bg-white/[0.04]"
                onClick={() => setSelected(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="supporthr-mono border border-[#f5d6bb]/20 bg-[#f5d6bb]/8 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-[#f5d6bb]">
                        {item.id.startsWith('manual-') ? 'Manual' : 'Render sync'}
                      </span>
                      <span className="supporthr-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                    <h2 className="truncate text-lg font-black text-white transition group-hover:text-[#f5d6bb]">
                      {item.jobPosition || 'Chức danh chưa đặt'}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.locationRequirement || 'Chưa rõ địa điểm'}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-black/70 text-[#f5d6bb]">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                  </div>
                </div>

                <div className="mt-4 border border-white/10 bg-black/45 p-3">
                  <p className="line-clamp-3 font-mono text-[11px] leading-6 text-slate-400">
                    {normalizeVietnameseDisplay(item.jdTextSnippet) || 'Không có nội dung JD'}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Metric label="Tổng" value={item.totalCandidates} />
                  <Metric label="A" value={item.grades.A} className={gradeTone.A} />
                  <Metric label="B" value={item.grades.B} className={gradeTone.B} />
                  <Metric label="C" value={item.grades.C} className={gradeTone.C} />
                </div>

                <div className="mt-4 min-h-0 flex-1">
                  <p className="supporthr-mono mb-2 text-[10px] uppercase tracking-[0.18em] text-[#f5d6bb]/70">
                    Ứng viên nổi bật
                  </p>
                  {item.topCandidates?.length > 0 ? (
                    <div className="space-y-2">
                      {item.topCandidates.slice(0, 3).map((candidate, index) => (
                        <div key={candidate.id} className="flex items-center justify-between gap-3 border border-white/10 bg-black/40 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#f5d6bb]/20 bg-[#f5d6bb]/8 text-[10px] font-black text-[#f5d6bb]">
                              {index + 1}
                            </span>
                            <span className="truncate text-xs font-semibold text-slate-200">{candidate.name}</span>
                          </div>
                          <span className="supporthr-mono text-[11px] font-black text-[#f5d6bb]">{candidate.score}đ</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/10 bg-black/35 px-3 py-4 text-xs text-slate-500">
                      Chưa có danh sách đề cử trong phiên này.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
                  {!item.id.startsWith('manual-') && (
                    <button
                      onClick={() => item.fullPayload && onRestore?.(item.fullPayload)}
                      disabled={!item.fullPayload}
                      className="flex-1 border border-white/10 bg-black/60 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-[#f5d6bb]/30 hover:text-[#f5d6bb] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Khôi phục
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(item)}
                    className="flex-1 border border-[#f5d6bb]/25 bg-[#f5d6bb]/8 px-3 py-2 text-xs font-bold text-[#f5d6bb] transition hover:bg-[#f5d6bb]/12"
                  >
                    Chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <HistoryDetailModal
          selected={selected}
          onClose={() => setSelected(null)}
          onRestore={onRestore}
        />
      )}
    </div>
  );
};

interface MetricProps {
  label: string;
  value: number;
  className?: string;
}

function Metric({ label, value, className = 'border-white/10 bg-white/[0.025] text-white' }: MetricProps) {
  return (
    <div className={`border px-2 py-2 text-center ${className}`}>
      <p className="supporthr-mono text-[9px] uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}

interface HistoryDetailModalProps {
  selected: HistoryEntry;
  onClose: () => void;
  onRestore?: (payload: HistoryEntry['fullPayload']) => void;
}

function HistoryDetailModal({ selected, onClose, onRestore }: HistoryDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/78 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border border-[#f5d6bb]/20 bg-[linear-gradient(180deg,rgba(8,8,10,0.98),rgba(0,0,0,0.98))] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.025] p-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="supporthr-mono border border-[#f5d6bb]/20 bg-[#f5d6bb]/8 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-[#f5d6bb]">
                {selected.id.startsWith('manual-') ? 'Manual record' : 'Analysis record'}
              </span>
              <span className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {formatDateTime(selected.timestamp)}
              </span>
            </div>
            <h3 className="truncate text-xl font-black text-white">{selected.jobPosition || 'Chức danh chưa đặt'}</h3>
            <p className="mt-1 text-sm text-slate-500">{selected.totalCandidates} ứng viên trong phiên phân tích</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!selected.id.startsWith('manual-') && selected.fullPayload && (
              <button
                onClick={() => onRestore?.(selected.fullPayload)}
                className="border border-white bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-slate-100"
              >
                Khôi phục
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center border border-white/10 text-slate-500 transition hover:border-[#f5d6bb]/30 hover:text-[#f5d6bb]"
            >
              <i className="fa-solid fa-times text-sm" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="space-y-5">
              <section className="border border-white/10 bg-black/45 p-4">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-[#f5d6bb]/70">JD Snapshot</p>
                <p className="mt-3 font-mono text-xs leading-6 text-slate-400">
                  {normalizeVietnameseDisplay(selected.jdTextSnippet || selected.fullPayload?.jdText) || 'Không có nội dung JD'}
                </p>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                {selected.fullPayload?.hardFilters && (
                  <JsonPanel title="Hard filters" icon="fa-filter" data={selected.fullPayload.hardFilters} />
                )}
                {selected.fullPayload?.weights && (
                  <JsonPanel title="Trọng số" icon="fa-scale-balanced" data={selected.fullPayload.weights} />
                )}
              </div>

              {!selected.fullPayload && !selected.id.startsWith('manual-') && (
                <div className="border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Dữ liệu cũ không lưu đầy đủ chi tiết nên chỉ hiển thị thông tin tóm tắt.
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <section className="border border-white/10 bg-black/45 p-4">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-[#f5d6bb]/70">Phân bố hạng</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric label="A" value={selected.grades.A} className={gradeTone.A} />
                  <Metric label="B" value={selected.grades.B} className={gradeTone.B} />
                  <Metric label="C" value={selected.grades.C} className={gradeTone.C} />
                </div>
              </section>

              {selected.topCandidates?.length > 0 && (
                <section className="border border-white/10 bg-black/45 p-4">
                  <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-[#f5d6bb]/70">Top ứng viên</p>
                  <div className="mt-3 space-y-2">
                    {selected.topCandidates.map((candidate, index) => (
                      <div key={candidate.id} className="flex items-center justify-between gap-3 border border-white/10 bg-white/[0.025] px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#f5d6bb] text-[10px] font-black text-black">
                            {index + 1}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-200">{candidate.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="supporthr-mono text-xs font-black text-[#f5d6bb]">{candidate.score}đ</p>
                          <p className="text-[10px] text-slate-600">{candidate.jdFit}% JD</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selected.fullPayload?.candidates && (
                <section className="flex max-h-80 flex-col overflow-hidden border border-white/10 bg-black/45">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-[#f5d6bb]/70">Danh sách chi tiết</p>
                  </div>
                  <div className="custom-scrollbar overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-black text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Tên</th>
                          <th className="px-3 py-2 text-center font-medium">Hạng</th>
                          <th className="px-3 py-2 text-right font-medium">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-300">
                        {selected.fullPayload.candidates.map((candidate) => {
                          const grade = getCandidateGrade(candidate);
                          return (
                            <tr key={candidate.id || candidate.fileName} className="hover:bg-white/[0.03]">
                              <td className="max-w-[140px] truncate px-3 py-2" title={normalizeVietnameseDisplay(candidate.candidateName)}>
                                {normalizeVietnameseDisplay(candidate.candidateName)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`border px-2 py-0.5 text-[9px] font-bold ${gradeTone[grade] || gradeTone.C}`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-400">
                                {candidate.analysis?.['Tổng điểm'] ?? '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

interface JsonPanelProps {
  title: string;
  icon: string;
  data: unknown;
}

function JsonPanel({ title, icon, data }: JsonPanelProps) {
  return (
    <section className="overflow-hidden border border-white/10 bg-black/45">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <i className={`fa-solid ${icon} text-xs text-[#f5d6bb]`} />
        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">{title}</h4>
      </div>
      <pre className="custom-scrollbar max-h-48 overflow-auto p-4 font-mono text-[11px] leading-5 text-slate-500">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}

export default HistoryPage;
