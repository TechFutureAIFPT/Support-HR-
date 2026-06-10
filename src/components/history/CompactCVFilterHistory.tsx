import React, { useEffect, useState } from 'react';
import {
  buildActivityHistoryStats,
  getActivityHistory,
  type ActivityHistoryEntry,
  type ActivityHistoryStats,
} from '@/services/history-cache/activityHistoryService';

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
        className={`fixed bottom-4 left-16 z-40 flex h-11 w-11 items-center justify-center border border-[#2388ff]/22 bg-white text-[#2388ff] shadow-[0_20px_60px_rgba(30,64,175,0.12)] transition-colors hover:border-[#2388ff]/55 hover:bg-[#2388ff] hover:text-white ${className}`}
        title="Hiện lịch sử phân tích"
      >
        <i className="fa-solid fa-clock-rotate-left text-sm" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-16 z-40 w-[min(22rem,calc(100vw-5rem))] border border-[#2388ff]/18 bg-white p-4 shadow-[0_28px_90px_rgba(30,64,175,0.16)] ${className}`}>
      <div className="mb-3 flex items-center justify-between border-b border-[#2388ff]/14 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center border border-[#2388ff]/22 bg-[#2388ff]/10 text-[#2388ff]">
            <i className="fa-solid fa-clock-rotate-left text-xs" />
          </span>
          Lịch sử phân tích
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="flex h-7 w-7 items-center justify-center border border-[#2388ff]/14 text-[#2388ff]/70 transition-colors hover:bg-[#2388ff] hover:text-white"
          aria-label="Thu gọn lịch sử"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="border border-[#2388ff]/12 bg-[#2388ff]/[0.045] p-3 text-center">
          <div className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-[#2388ff]/55">Tổng phiên</div>
          <div className="mt-1 text-xl font-black text-[#2388ff]">{historyStats.totalSessions}</div>
        </div>
        <div className="border border-[#2388ff]/12 bg-blue-50 p-3 text-center">
          <div className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-[#2388ff]/55">Tuần này</div>
          <div className="mt-1 text-xl font-black text-slate-900">{historyStats.thisWeekCount}</div>
        </div>
      </div>

      {historyStats.lastSession && (
        <div className="mt-3 flex justify-between gap-3 text-xs">
          <span className="text-slate-500">Gần nhất:</span>
          <span className="truncate font-mono text-[#2388ff]">{historyStats.lastSession}</span>
        </div>
      )}

      {recentHistory.length > 0 && (
        <div className="mt-3 border-t border-[#2388ff]/14 pt-3">
          <div className="mb-2 supporthr-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2388ff]/55">
            Gần đây
          </div>
          <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1">
            {recentHistory.slice(0, 3).map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-2 border border-[#2388ff]/10 bg-white p-2 text-xs transition-colors hover:border-[#2388ff]/28">
                <span className="supporthr-mono text-[9px] text-[#2388ff]/70">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="block flex-1 truncate text-slate-700">{entry.jobPosition || 'Không rõ vị trí'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactCVFilterHistory;
