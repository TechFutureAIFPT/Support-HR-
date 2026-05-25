import React, { useMemo } from 'react';

interface TotalWeightDisplayProps {
  totalWeight: number;
}

const TotalWeightDisplay: React.FC<TotalWeightDisplayProps> = ({ totalWeight }) => {
  const clamped = Math.max(0, Math.min(100, totalWeight));

  const status = useMemo(() => {
    if (totalWeight === 100) {
      return { label: 'Chuẩn', color: 'text-[#f5d6bb]', stroke: '#f5d6bb' };
    }
    if (totalWeight > 100) {
      return { label: 'Dư', color: 'text-[#f0c892]', stroke: '#d9a56d' };
    }
    return { label: 'Thiếu', color: 'text-[#ecd0aa]', stroke: '#e4bf8f' };
  }, [totalWeight]);

  return (
    <div className="flex items-center gap-4 border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/10"
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
          <span className="text-sm font-bold text-white">{totalWeight}%</span>
        </div>
      </div>

      <div className="flex-1">
        <p className={`mb-1 text-sm font-medium ${status.color}`}>{status.label}</p>
        <div className="h-1.5 w-full overflow-hidden bg-white/[0.08]">
          <div
            className="h-full transition-all duration-500"
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
