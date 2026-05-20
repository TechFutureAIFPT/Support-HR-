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
        className={`fixed bottom-4 left-16 z-40 flex h-11 w-11 items-center justify-center border border-[#f5d6bb]/22 bg-black/92 text-[#f5d6bb] shadow-[0_20px_60px_rgba(0,0,0,0.42)] transition-colors hover:border-[#f5d6bb]/55 hover:bg-[#f5d6bb] hover:text-black ${className}`}
        title="Hiện lịch sử phân tích"
      >
        <i className="fa-solid fa-clock-rotate-left text-sm" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-16 z-40 w-[min(22rem,calc(100vw-5rem))] border border-[#f5d6bb]/18 bg-black/95 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.58)] ${className}`}>
      <div className="mb-3 flex items-center justify-between border-b border-[#f5d6bb]/14 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-black text-white">
          <span className="flex h-8 w-8 items-center justify-center border border-[#f5d6bb]/22 bg-[#f5d6bb]/10 text-[#f5d6bb]">
            <i className="fa-solid fa-clock-rotate-left text-xs" />
          </span>
          Lịch sử phân tích
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="flex h-7 w-7 items-center justify-center border border-[#f5d6bb]/14 text-[#f5d6bb]/70 transition-colors hover:bg-[#f5d6bb] hover:text-black"
          aria-label="Thu gọn lịch sử"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="border border-[#f5d6bb]/12 bg-[#f5d6bb]/[0.045] p-3 text-center">
          <div className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-[#f5d6bb]/55">Tổng phiên</div>
          <div className="mt-1 text-xl font-black text-[#f5d6bb]">{historyStats.totalSessions}</div>
        </div>
        <div className="border border-[#f5d6bb]/12 bg-white/[0.025] p-3 text-center">
          <div className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-[#f5d6bb]/55">Tuần này</div>
          <div className="mt-1 text-xl font-black text-white">{historyStats.thisWeekCount}</div>
        </div>
      </div>

      {historyStats.lastSession && (
        <div className="mt-3 flex justify-between gap-3 text-xs">
          <span className="text-zinc-500">Gần nhất:</span>
          <span className="truncate font-mono text-[#f5d6bb]">{historyStats.lastSession}</span>
        </div>
      )}

      {recentHistory.length > 0 && (
        <div className="mt-3 border-t border-[#f5d6bb]/14 pt-3">
          <div className="mb-2 supporthr-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5d6bb]/55">
            Gần đây
          </div>
          <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1">
            {recentHistory.slice(0, 3).map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-2 border border-[#f5d6bb]/10 bg-black/55 p-2 text-xs transition-colors hover:border-[#f5d6bb]/28">
                <span className="supporthr-mono text-[9px] text-[#f5d6bb]/70">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="block flex-1 truncate text-zinc-200">{entry.jobPosition || 'Không rõ vị trí'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactCVFilterHistory;
