import React, { useCallback, useEffect, useState } from 'react';
import { analysisCacheService } from '@/lib/services/history-cache/analysisCache';
import { cvFilterHistoryService } from '@/lib/services/history-cache/analysisHistory';
import {
  buildActivityHistoryStats,
  getActivityHistory,
  type ActivityHistoryEntry,
  type ActivityHistoryStats,
} from '@/lib/services/history-cache/activityHistoryService';

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
    loadHistory();
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
        <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-800 bg-[#0B1120] shadow-2xl shadow-blue-900/20">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                <i className="fa-solid fa-clock-rotate-left text-blue-400" />
              </span>
              Lịch sử & Thống kê
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <i className="fa-solid fa-database text-blue-400" />
                Cache hệ thống
              </h3>

              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-center">
                    <div className="text-xs text-slate-400">Entries</div>
                    <div className="mt-1 text-2xl font-bold text-white">{cacheStats.size}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-center">
                    <div className="text-xs text-slate-400">Hit Rate</div>
                    <div className="mt-1 text-2xl font-bold text-cyan-300">{cacheStats.hitRate.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCacheStats(analysisCacheService.getCacheStats())}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    Làm mới
                  </button>
                  <button
                    onClick={handleClearCache}
                    disabled={cacheStats.size === 0}
                    className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
                  >
                    Xóa cache
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <i className="fa-solid fa-chart-line text-emerald-400" />
                Lịch sử hoạt động
              </h3>

              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-center">
                    <div className="text-xs text-slate-400">Tổng phiên</div>
                    <div className="mt-1 text-2xl font-bold text-blue-300">{historyStats.totalSessions}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-center">
                    <div className="text-xs text-slate-400">Tuần này</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-300">{historyStats.thisWeekCount}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                  Nguồn dữ liệu: {historySource === 'render' ? 'Render API' : historySource === 'local' ? 'Cục bộ' : 'Chưa có dữ liệu'}
                </div>

                {historyStats.lastSession && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gần nhất:</span>
                    <span className="font-mono text-xs text-slate-300">{historyStats.lastSession}</span>
                  </div>
                )}

                {loading ? (
                  <div className="py-6 text-center text-sm text-slate-500">Đang tải lịch sử...</div>
                ) : recentHistory.length > 0 ? (
                  <div className="border-t border-slate-800 pt-3">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Gần đây</div>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {recentHistory.slice(0, 8).map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-slate-800/60 bg-slate-800/30 p-2.5 text-xs transition-colors hover:bg-slate-800/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-200">{entry.jobPosition || 'Không rõ vị trí'}</div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                              {entry.industry || 'Khác'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-800 pt-4 text-center text-sm text-slate-500">Chưa có lịch sử hoạt động nào.</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={loadHistory}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    Cập nhật
                  </button>
                  <button
                    onClick={handleClearLocalHistory}
                    disabled={historySource !== 'local' || historyStats.totalSessions === 0}
                    className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
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
