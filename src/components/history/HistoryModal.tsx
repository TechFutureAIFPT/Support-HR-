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
  presentation?: 'modal' | 'page';
}

const EMPTY_STATS: ActivityHistoryStats = {
  totalSessions: 0,
  lastSession: null,
  thisWeekCount: 0,
  thisMonthCount: 0,
};

const gold = '#2388ff';
const panelClass =
  'rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_18px_48px_rgba(30,64,175,0.08)] sm:p-5';
const metaClass = 'supporthr-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-500';
const valueClass = 'supporthr-display mt-2 text-[1.7rem] font-black tracking-[-0.055em] text-slate-900';
const secondaryButtonClass =
  'supporthr-mono rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50';
const dangerButtonClass =
  'supporthr-mono rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50';

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, presentation = 'modal' }) => {
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

  const isPage = presentation === 'page';

  return (
    <>
      {!isPage ? <div className="fixed inset-0 z-50 bg-slate-900/22 backdrop-blur-sm" onClick={onClose} /> : null}

      <div className={isPage ? 'h-full min-h-0 overflow-y-auto bg-white p-3 sm:p-5' : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5'}>
        <div className={isPage ? 'relative mx-auto flex min-h-full w-full max-w-[72rem] flex-col overflow-hidden border border-blue-100 bg-white' : 'relative flex max-h-[92dvh] w-full max-w-[58rem] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_38px_120px_rgba(30,64,175,0.18)]'}>
          <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(35,136,255,0.14),transparent_55%)]" />

          <div className="relative flex flex-col gap-4 border-b border-blue-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                <i className="fa-solid fa-clock-rotate-left" />
              </span>
              <div>
                <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#2388ff]/65">
                  ACTIVITY ARCHIVE
                </p>
                <h2 className="supporthr-display mt-1 text-[1.7rem] font-black tracking-[-0.06em] text-slate-900 sm:text-[2.1rem]">
                  Lịch sử hoạt động
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Theo dõi cache hệ thống, nguồn dữ liệu và các phiên phân tích gần đây.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
              aria-label="Đóng lịch sử"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="relative min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <section className={panelClass}>
                <div className="flex items-center justify-between gap-3 border-b border-[#2388ff]/12 pb-4">
                  <div>
                    <p className={metaClass}>System Cache</p>
                    <h3 className="supporthr-display mt-2 text-2xl font-black tracking-[-0.055em] text-slate-900">
                      Bộ nhớ phân tích
                    </h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center border border-[#2388ff]/22 bg-[#2388ff]/10 text-[#2388ff]">
                    <i className="fa-solid fa-database" />
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="border border-[#2388ff]/12 bg-white/70 p-4">
                    <div className={metaClass}>Entries</div>
                    <div className={valueClass}>{cacheStats.size}</div>
                  </div>
                  <div className="border border-[#2388ff]/12 bg-white/70 p-4">
                    <div className={metaClass}>Hit Rate</div>
                    <div className={`${valueClass} text-[#2388ff]`}>{cacheStats.hitRate.toFixed(1)}%</div>
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
                <div className="flex flex-col gap-4 border-b border-[#2388ff]/12 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={metaClass}>Analysis Timeline</p>
                    <h3 className="supporthr-display mt-2 text-2xl font-black tracking-[-0.055em] text-slate-900">
                      Phiên tuyển dụng
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-[#2388ff]/12 bg-white/70 px-4 py-3 text-center">
                      <p className={metaClass}>Tổng</p>
                      <p className="supporthr-display mt-1 text-2xl font-black text-[#2388ff]">
                        {historyStats.totalSessions}
                      </p>
                    </div>
                    <div className="border border-[#2388ff]/12 bg-white/70 px-4 py-3 text-center">
                      <p className={metaClass}>Tuần này</p>
                      <p className="supporthr-display mt-1 text-2xl font-black text-slate-900">
                        {historyStats.thisWeekCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="border border-[#2388ff]/12 bg-white/65 px-3 py-3">
                    <p className={metaClass}>Nguồn dữ liệu</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {historySource === 'render' ? 'Máy chủ' : historySource === 'local' ? 'Cục bộ' : 'Chưa có dữ liệu'}
                    </p>
                  </div>
                  <div className="border border-[#2388ff]/12 bg-white/65 px-3 py-3">
                    <p className={metaClass}>Gần nhất</p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">{historyStats.lastSession || 'Chưa có'}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className={metaClass}>Gần đây</p>
                    <span className="h-px flex-1 bg-[#2388ff]/12" />
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center gap-2.5 py-8 text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2388ff]" />
                      <span className="text-[13px]">Đang tải...</span>
                    </div>
                  ) : recentHistory.length > 0 ? (
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {recentHistory.slice(0, 8).map((entry: ActivityHistoryEntry, index) => (
                        <div
                          key={entry.id}
                          className="group border border-[#2388ff]/12 bg-white/62 p-4 transition-colors hover:border-[#2388ff]/36 hover:bg-[#2388ff]/[0.045]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="supporthr-display truncate text-[1.1rem] font-black tracking-[-0.045em] text-slate-900">
                                {entry.jobPosition || 'Không rõ vị trí'}
                              </div>
                              <div className="supporthr-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[#2388ff]/68">
                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <span className="supporthr-mono border border-[#2388ff]/18 bg-[#2388ff]/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[#2388ff]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span>{entry.industry || 'Khác'}</span>
                            <span style={{ color: gold }}>NHẬT KÝ PHIÊN</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-[#2388ff]/12 bg-white px-4 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#2388ff]/18 bg-[#2388ff]/8 text-[#2388ff]">
                        <i className="fa-solid fa-folder-open" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-900">Chưa có lịch sử hoạt động nào.</p>
                      <p className="mt-1 text-xs text-slate-500">Các phiên phân tích sẽ xuất hiện tại đây sau khi có dữ liệu.</p>
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
