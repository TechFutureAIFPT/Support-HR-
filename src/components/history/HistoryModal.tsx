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

const gold = '#f5d6bb';
const panelClass =
  'border border-[#f5d6bb]/16 bg-[linear-gradient(180deg,rgba(245,214,187,0.075)_0%,rgba(255,255,255,0.018)_100%)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-5';
const metaClass = 'supporthr-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f5d6bb]/55';
const valueClass = 'supporthr-display mt-2 text-[1.7rem] font-black tracking-[-0.055em] text-white';
const secondaryButtonClass =
  'supporthr-mono border border-[#f5d6bb]/18 bg-black px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f5d6bb] transition-colors hover:border-[#f5d6bb]/45 hover:bg-[#f5d6bb] hover:text-black disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-black/35 disabled:text-zinc-700';
const dangerButtonClass =
  'supporthr-mono border border-red-400/20 bg-red-950/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-200 transition-colors hover:border-red-300/45 hover:bg-red-400 hover:text-black disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-black/35 disabled:text-zinc-700';

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
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        <div className="relative flex max-h-[92dvh] w-full max-w-[58rem] flex-col overflow-hidden border border-[#f5d6bb]/18 bg-black shadow-[0_40px_140px_rgba(0,0,0,0.68)]">
          <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(245,214,187,0.14),transparent_55%)]" />

          <div className="relative flex flex-col gap-4 border-b border-[#f5d6bb]/14 bg-black/78 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center border border-[#f5d6bb]/28 bg-[#f5d6bb]/10 text-[#f5d6bb]">
                <i className="fa-solid fa-clock-rotate-left" />
              </span>
              <div>
                <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#f5d6bb]/65">
                  ACTIVITY ARCHIVE
                </p>
                <h2 className="supporthr-display mt-1 text-[1.7rem] font-black tracking-[-0.06em] text-white sm:text-[2.1rem]">
                  Lịch sử hoạt động
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Theo dõi cache hệ thống, nguồn dữ liệu và các phiên phân tích gần đây.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center border border-[#f5d6bb]/16 bg-black text-[#f5d6bb]/75 transition-colors hover:border-[#f5d6bb]/45 hover:bg-[#f5d6bb] hover:text-black"
              aria-label="Đóng lịch sử"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="relative min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <section className={panelClass}>
                <div className="flex items-center justify-between gap-3 border-b border-[#f5d6bb]/12 pb-4">
                  <div>
                    <p className={metaClass}>System Cache</p>
                    <h3 className="supporthr-display mt-2 text-2xl font-black tracking-[-0.055em] text-white">
                      Bộ nhớ phân tích
                    </h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center border border-[#f5d6bb]/22 bg-[#f5d6bb]/10 text-[#f5d6bb]">
                    <i className="fa-solid fa-database" />
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="border border-[#f5d6bb]/12 bg-black/70 p-4">
                    <div className={metaClass}>Entries</div>
                    <div className={valueClass}>{cacheStats.size}</div>
                  </div>
                  <div className="border border-[#f5d6bb]/12 bg-black/70 p-4">
                    <div className={metaClass}>Hit Rate</div>
                    <div className={`${valueClass} text-[#f5d6bb]`}>{cacheStats.hitRate.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <button
                    onClick={() => setCacheStats(analysisCacheService.getCacheStats())}
                    className={secondaryButtonClass}
                  >
                    Làm mới
                  </button>
                  <button onClick={handleClearCache} disabled={cacheStats.size === 0} className={dangerButtonClass}>
                    Xóa cache
                  </button>
                </div>
              </section>

              <section className={panelClass}>
                <div className="flex flex-col gap-4 border-b border-[#f5d6bb]/12 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={metaClass}>Analysis Timeline</p>
                    <h3 className="supporthr-display mt-2 text-2xl font-black tracking-[-0.055em] text-white">
                      Phiên tuyển dụng
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-[#f5d6bb]/12 bg-black/70 px-4 py-3 text-center">
                      <p className={metaClass}>Tổng</p>
                      <p className="supporthr-display mt-1 text-2xl font-black text-[#f5d6bb]">
                        {historyStats.totalSessions}
                      </p>
                    </div>
                    <div className="border border-[#f5d6bb]/12 bg-black/70 px-4 py-3 text-center">
                      <p className={metaClass}>Tuần này</p>
                      <p className="supporthr-display mt-1 text-2xl font-black text-white">
                        {historyStats.thisWeekCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="border border-[#f5d6bb]/12 bg-black/65 px-3 py-3">
                    <p className={metaClass}>Nguồn dữ liệu</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {historySource === 'render' ? 'Render API' : historySource === 'local' ? 'Cục bộ' : 'Chưa có dữ liệu'}
                    </p>
                  </div>
                  <div className="border border-[#f5d6bb]/12 bg-black/65 px-3 py-3">
                    <p className={metaClass}>Gần nhất</p>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{historyStats.lastSession || 'Chưa có'}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className={metaClass}>Gần đây</p>
                    <span className="h-px flex-1 bg-[#f5d6bb]/12" />
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4 border border-[#f5d6bb]/12 bg-black/45 py-10">
                      <div className="h-10 w-10 animate-spin border-[3px] border-[#f5d6bb]/15 border-t-[#f5d6bb]" />
                      <p className="text-sm text-zinc-500">Đang tải lịch sử...</p>
                    </div>
                  ) : recentHistory.length > 0 ? (
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {recentHistory.slice(0, 8).map((entry: ActivityHistoryEntry, index) => (
                        <div
                          key={entry.id}
                          className="group border border-[#f5d6bb]/12 bg-black/62 p-4 transition-colors hover:border-[#f5d6bb]/36 hover:bg-[#f5d6bb]/[0.045]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="supporthr-display truncate text-[1.1rem] font-black tracking-[-0.045em] text-white">
                                {entry.jobPosition || 'Không rõ vị trí'}
                              </div>
                              <div className="supporthr-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[#f5d6bb]/68">
                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <span className="supporthr-mono border border-[#f5d6bb]/18 bg-[#f5d6bb]/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                            <span>{entry.industry || 'Khác'}</span>
                            <span style={{ color: gold }}>SESSION_LOG</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-[#f5d6bb]/12 bg-black/45 px-4 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#f5d6bb]/18 bg-[#f5d6bb]/8 text-[#f5d6bb]">
                        <i className="fa-solid fa-folder-open" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-white">Chưa có lịch sử hoạt động nào.</p>
                      <p className="mt-1 text-xs text-zinc-500">Các phiên phân tích sẽ xuất hiện tại đây sau khi có dữ liệu.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button onClick={() => void loadHistory()} className={secondaryButtonClass}>
                    Cập nhật
                  </button>
                  <button
                    onClick={handleClearLocalHistory}
                    disabled={historySource !== 'local' || historyStats.totalSessions === 0}
                    className={dangerButtonClass}
                  >
                    Xóa cục bộ
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryModal;
