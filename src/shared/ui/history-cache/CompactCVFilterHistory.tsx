import React, { useEffect, useState } from 'react';
import {
  buildActivityHistoryStats,
  getActivityHistory,
  type ActivityHistoryEntry,
  type ActivityHistoryStats,
} from '@/lib/services/history-cache/activityHistoryService';

interface CompactCVFilterHistoryProps {
  className?: string;
}

const EMPTY_STATS: ActivityHistoryStats = {
  totalSessions: 0,
  lastSession: null,
  thisWeekCount: 0,
  thisMonthCount: 0,
};

const CompactCVFilterHistory: React.FC<CompactCVFilterHistoryProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [historyStats, setHistoryStats] = useState<ActivityHistoryStats>(EMPTY_STATS);
  const [recentHistory, setRecentHistory] = useState<ActivityHistoryEntry[]>([]);
  const [shouldShow, setShouldShow] = useState(() => {
    const saved = localStorage.getItem('showCVFilterHistory');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('showCVFilterHistory');
      setShouldShow(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!isVisible || !shouldShow) return;

    let cancelled = false;
    getActivityHistory(6).then(({ entries }) => {
      if (cancelled) return;
      setRecentHistory(entries);
      setHistoryStats(buildActivityHistoryStats(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [isVisible, shouldShow]);

  if (!shouldShow) return null;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 left-16 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/80 text-slate-400 shadow-lg transition-all hover:bg-slate-700 hover:text-green-400 ${className}`}
        title="Hiện lịch sử phân tích"
      >
        <i className="fa-solid fa-clock-rotate-left text-sm" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-16 z-40 min-w-[320px] rounded-xl border border-slate-700/50 bg-slate-900/95 p-4 shadow-2xl ${className}`}>
      <div className="mb-3 flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <i className="fa-solid fa-clock-rotate-left text-green-400" />
          Lịch sử phân tích
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded border border-slate-700/30 bg-slate-800/50 p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Tổng phiên</div>
          <div className="mt-1 text-lg font-bold text-blue-300">{historyStats.totalSessions}</div>
        </div>
        <div className="rounded border border-slate-700/30 bg-slate-800/50 p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Tuần này</div>
          <div className="mt-1 text-lg font-bold text-emerald-300">{historyStats.thisWeekCount}</div>
        </div>
      </div>

      {historyStats.lastSession && (
        <div className="mt-3 flex justify-between text-xs">
          <span className="text-slate-500">Gần nhất:</span>
          <span className="font-mono text-slate-300">{historyStats.lastSession}</span>
        </div>
      )}

      {recentHistory.length > 0 && (
        <div className="mt-3 border-t border-slate-700/50 pt-2">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gần đây</div>
          <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
            {recentHistory.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded p-1.5 text-xs transition-colors hover:bg-slate-800/50">
                <div className="h-1 w-1 flex-shrink-0 rounded-full bg-blue-500" />
                <span className="block flex-1 truncate text-slate-300">{entry.jobPosition || 'Không rõ vị trí'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactCVFilterHistory;
