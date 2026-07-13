import React, { useMemo } from 'react';

interface TotalWeightDisplayProps {
  totalWeight: number;
}

const TotalWeightDisplay: React.FC<TotalWeightDisplayProps> = ({ totalWeight }) => {
  const clamped = Math.max(0, Math.min(100, totalWeight));

  const status = useMemo(() => {
    if (totalWeight === 100) {
      return { label: 'Chuẩn', color: 'text-emerald-600', stroke: '#17915f' };
    }
    if (totalWeight > 100) {
      return { label: 'Dư', color: 'text-red-600', stroke: '#ef4444' };
    }
    return { label: 'Thiếu', color: 'text-orange-500', stroke: '#ff9f43' };
  }, [totalWeight]);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_12px_30px_rgba(30,64,175,0.06)]">
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-blue-100"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={status.stroke}
            strokeWidth="3"
            strokeDasharray={`${clamped}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-900">{totalWeight}%</span>
        </div>
      </div>

      <div className="flex-1">
        <p className={`mb-1 text-sm font-semibold ${status.color}`}>{status.label}</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(totalWeight, 100)}%`,
              backgroundColor: status.stroke,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TotalWeightDisplay;
