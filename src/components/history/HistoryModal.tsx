import React, { useCallback, useEffect, useState } from 'react';
import { analysisCacheService } from '@/services/history-cache/analysisCache';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';
import {
  buildActivityHistoryStats,
  getActivityHistory,
  type ActivityHistoryEntry,
  type ActivityHistoryStats,
} from '@/services/history-cache/activityHistoryService';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_STATS: ActivityHistoryStats = {
  totalSessions: 0,
  lastSession: null,
  thisWeekCount: 0,
  thisMonthCount: 0,
};

const modalMetaClass = 'supporthr-mono text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500';
const modalValueClass = 'supporthr-display mt-2 text-[1.55rem] font-semibold tracking-[-0.05em] text-white';
const modalPanelClass =
  'rounded-none border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.012)_100%)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)]';
const modalSecondaryButtonClass =
  'supporthr-mono rounded-none border border-white/[0.08] bg-black/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-black/35 disabled:text-slate-600';
const modalCacheButtonClass =
  'supporthr-mono rounded-none border border-cyan-400/20 bg-cyan-400/8 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/14 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-black/35 disabled:text-slate-600';
const modalDangerButtonClass =
  'supporthr-mono rounded-none border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200 transition-colors hover:bg-red-500/14 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-black/35 disabled:text-slate-600';
const historyCardClass =
  'rounded-none border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.012)_100%)] p-4 transition-all hover:border-emerald-400/22 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.018)_100%)]';

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    hitRate: 0,
    oldestEntry: 0,
    newestEntry: 0,
  });
  const [historyStats, setHistoryStats] = useState<ActivityHistoryStats>(EMPTY_STATS);
  const [recentHistory, setRecentHistory] = useState<ActivityHistoryEntry[]>([]);
  const [historySource, setHistorySource] = useState<'render' | 'local' | 'none'>('none');
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { entries, source } = await getActivityHistory(12);
      setHistorySource(source);
      setRecentHistory(entries);
      setHistoryStats(buildActivityHistoryStats(entries));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCacheStats(analysisCacheService.getCacheStats());
    void loadHistory();
  }, [isOpen, loadHistory]);

  const handleClearCache = () => {
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ cache?')) return;
    analysisCacheService.clearCache();
    setCacheStats(analysisCacheService.getCacheStats());
  };

  const handleClearLocalHistory = async () => {
    if (historySource !== 'local') return;
    if (!window.confirm('Bạn có chắc muốn xóa lịch sử cục bộ?')) return;
    cvFilterHistoryService.clearHistory();
    await loadHistory();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[88vh] w-full max-w-[46rem] flex-col overflow-hidden rounded-none border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.08),transparent_28%),linear-gradient(180deg,rgba(8,12,23,0.98)_0%,rgba(4,7,15,0.98)_100%)] shadow-[0_38px_120px_rgba(0,0,0,0.56)]">
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-black/35 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-none border border-emerald-400/20 bg-emerald-400/10">
                <i className="fa-solid fa-clock-rotate-left text-emerald-200" />
              </span>
              <div>
                <h2 className="supporthr-display text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                  Lịch sử hoạt động
                </h2>
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Cache hệ thống và các phiên phân tích gần đây
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-none border border-white/[0.08] bg-black/55 text-slate-400 transition-colors hover:border-emerald-400/30 hover:text-white"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="min-h-0 space-y-6 overflow-y-auto p-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-database text-cyan-300" />
                <h3 className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Cache hệ thống
                </h3>
              </div>

              <div className={modalPanelClass}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-none border border-white/[0.08] bg-black/55 p-4 text-center">
                    <div className={modalMetaClass}>Entries</div>
                    <div className={modalValueClass}>{cacheStats.size}</div>
                  </div>
                  <div className="rounded-none border border-white/[0.08] bg-black/55 p-4 text-center">
                    <div className={modalMetaClass}>Hit Rate</div>
                    <div className="supporthr-display mt-2 text-[1.55rem] font-semibold tracking-[-0.05em] text-cyan-100">
                      {cacheStats.hitRate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setCacheStats(analysisCacheService.getCacheStats())}
                    className={`flex-1 ${modalCacheButtonClass}`}
                  >
                    Làm mới
                  </button>
                  <button
                    onClick={handleClearCache}
                    disabled={cacheStats.size === 0}
                    className={`flex-1 ${modalDangerButtonClass}`}
                  >
                    Xóa cache
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-emerald-300" />
                <h3 className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Lịch sử hoạt động
                </h3>
              </div>

              <div className={modalPanelClass}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-none border border-white/[0.08] bg-black/55 p-4 text-center">
                    <div className={modalMetaClass}>Tổng phiên</div>
                    <div className="supporthr-display mt-2 text-[1.55rem] font-semibold tracking-[-0.05em] text-cyan-100">
                      {historyStats.totalSessions}
                    </div>
                  </div>
                  <div className="rounded-none border border-white/[0.08] bg-black/55 p-4 text-center">
                    <div className={modalMetaClass}>Tuần này</div>
                    <div className="supporthr-display mt-2 text-[1.55rem] font-semibold tracking-[-0.05em] text-emerald-100">
                      {historyStats.thisWeekCount}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="supporthr-mono rounded-none border border-white/[0.08] bg-black/55 px-3 py-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Nguồn dữ liệu: {historySource === 'render' ? 'Render API' : historySource === 'local' ? 'Cục bộ' : 'Chưa có dữ liệu'}
                  </div>
                  <div className="supporthr-mono rounded-none border border-white/[0.08] bg-black/55 px-3 py-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Gần nhất: <span className="text-slate-200">{historyStats.lastSession || 'Chưa có'}</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="supporthr-mono mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Gần đây
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-10">
                      <div className="h-10 w-10 animate-spin rounded-none border-[3px] border-emerald-500/15 border-t-emerald-300" />
                      <p className="text-sm text-slate-500">Đang tải lịch sử...</p>
                    </div>
                  ) : recentHistory.length > 0 ? (
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {recentHistory.slice(0, 8).map((entry: ActivityHistoryEntry) => (
                        <div key={entry.id} className={historyCardClass}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="supporthr-display truncate text-[1.1rem] font-semibold tracking-[-0.04em] text-white">
                                {entry.jobPosition || 'Không rõ vị trí'}
                              </div>
                              <div className="supporthr-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200/75">
                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <span className="supporthr-mono border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-emerald-100">
                              {entry.industry || 'Khác'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-none border border-white/[0.08] bg-black/40 px-4 py-8 text-center text-sm text-slate-500">
                      Chưa có lịch sử hoạt động nào.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <button onClick={() => void loadHistory()} className={`flex-1 ${modalSecondaryButtonClass}`}>
                    Cập nhật
                  </button>
                  <button
                    onClick={handleClearLocalHistory}
                    disabled={historySource !== 'local' || historyStats.totalSessions === 0}
                    className={`flex-1 ${modalDangerButtonClass}`}
                  >
                    Xóa cục bộ
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryModal;
