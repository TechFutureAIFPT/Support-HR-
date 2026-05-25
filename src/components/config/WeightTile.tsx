import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MainCriterion, WeightCriteria } from '@/types';

interface WeightTileProps {
  criterion: MainCriterion;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  isExpanded: boolean;
  onToggle: () => void;
}

const clampWeight = (value: number) => Math.max(0, Math.min(100, Number.isNaN(value) ? 0 : value));

const WeightTile: React.FC<WeightTileProps> = ({ criterion, setWeights, isExpanded, onToggle }) => {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const total = useMemo(() => {
    return criterion.children?.reduce((sum, child) => sum + child.weight, 0) || 0;
  }, [criterion.children]);

  useEffect(() => {
    if (contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  }, [criterion.children]);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  const handleSubChange = (childKey: string, newValue: number) => {
    const safeValue = clampWeight(newValue);
    setWeights((prev) => {
      const newCriterion = { ...prev[criterion.key] };
      if (newCriterion.children) {
        newCriterion.children = newCriterion.children.map((child) =>
          child.key === childKey ? { ...child, weight: safeValue } : child
        );
      }
      return { ...prev, [criterion.key]: newCriterion };
    });
  };

  const getProgressColor = () => {
    if (total >= 35) return 'from-[#b9895b] via-[#f5d6bb] to-[#fff2df]';
    if (total >= 15) return 'from-[#b9895b] via-[#e9c49a] to-[#f5d6bb]';
    return 'from-[#9f7449] via-[#d8ae7a] to-[#f0d3b2]';
  };

  return (
    <div
      className={`border transition-all duration-300 hover:border-[#f5d6bb]/28 ${
        isExpanded
          ? 'border-white/12 bg-white/[0.03] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.9)]'
          : 'border-white/[0.07] bg-transparent'
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center text-lg ${
              isExpanded
                ? 'border border-[#f5d6bb]/25 bg-[#f5d6bb]/10 text-[#f5d6bb]'
                : 'border border-white/8 bg-white/[0.03] text-zinc-400'
            }`}
          >
            <i className={criterion.icon} />
          </div>
          <div className="min-w-0">
            <p className={`text-[13px] font-bold tracking-wide ${isExpanded ? 'text-white' : 'text-zinc-300'}`}>
              {criterion.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden bg-white/[0.06] sm:w-24">
                <div
                  className={`h-full bg-gradient-to-r ${getProgressColor()}`}
                  style={{ width: `${Math.min(total, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Tổng {total}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <span className={`text-xl font-bold tracking-tighter ${total > 0 ? 'text-[#f5d6bb]' : 'text-zinc-500'}`}>
              {total}
            </span>
            <span className="ml-0.5 text-[10px] text-zinc-500">%</span>
          </div>
          <div
            className={`flex h-6 w-6 items-center justify-center transition-colors ${
              isExpanded ? 'bg-white/[0.04] text-[#f5d6bb]' : 'bg-transparent text-zinc-500'
            }`}
          >
            <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <div
        className="overflow-hidden transition-[height,opacity] duration-300 ease-in-out"
        style={{ height: isExpanded ? measuredHeight : 0, opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="relative space-y-4 border-t border-white/[0.07] bg-transparent p-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/20 to-transparent" />

          {criterion.children?.map((child) => {
            const sliderMax = Math.max(60, child.weight);
            const sliderPercent = (child.weight / sliderMax) * 100;
            return (
              <div
                key={child.key}
                className="flex flex-col gap-3 border border-transparent p-2.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.015] sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="truncate text-[11px] font-bold tracking-wide text-zinc-300">{child.name}</p>
                    <span className="text-[10px] font-medium text-[#f5d6bb]">{child.weight}%</span>
                  </div>
                  <div className="group relative">
                    <input
                      type="range"
                      min={0}
                      max={sliderMax}
                      value={child.weight}
                      onChange={(e) => handleSubChange(child.key, parseInt(e.target.value, 10))}
                      className="relative z-10 h-1.5 w-full appearance-none cursor-pointer bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-[#f5d6bb]/15"
                      style={{
                        background: `linear-gradient(90deg, rgba(245,214,187,0.95) ${sliderPercent}%, rgba(255,255,255,0.08) ${sliderPercent}%)`,
                      }}
                    />
                  </div>
                </div>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={child.weight}
                    onChange={(e) => handleSubChange(child.key, parseInt(e.target.value, 10))}
                    className="w-full appearance-none border border-white/[0.08] bg-[#040506] py-1.5 pl-2 pr-4 text-center text-xs font-bold text-white transition-all focus:border-[#f5d6bb]/35 focus:bg-[#07090d] focus:outline-none focus:ring-1 focus:ring-[#f5d6bb]/20 sm:w-14"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500">
                    %
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeightTile;
