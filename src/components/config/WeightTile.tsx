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

  const progressClass = total >= 35
    ? 'from-blue-500 to-emerald-400'
    : total >= 15
      ? 'from-blue-400 to-cyan-400'
      : 'from-orange-300 to-blue-300';

  return (
    <div
      className={`rounded-lg border !bg-white transition-all duration-300 ${
        isExpanded
          ? 'border-blue-300 shadow-[0_12px_30px_rgba(30,64,175,0.08)]'
          : 'border-blue-100 shadow-[0_6px_18px_rgba(30,64,175,0.035)] hover:border-blue-300'
      }`}
    >
      <button
        type="button"
        className="flex min-h-[58px] w-full items-center gap-3 px-3 py-2 text-left sm:px-4"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm ${
              isExpanded
                ? 'border-blue-200 !bg-white text-blue-600'
                : 'border-blue-100 !bg-white text-slate-600'
            }`}
          >
            <i className={criterion.icon} />
          </div>
          <div className="min-w-[9rem] max-w-[16rem] flex-1">
            <p className="truncate text-sm font-bold tracking-wide text-slate-950">
              {criterion.name}
            </p>
          </div>
          <div className="hidden min-w-0 flex-[1.4] items-center gap-3 sm:flex">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-blue-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${progressClass}`}
                style={{ width: `${Math.min(total, 100)}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tổng {total}%
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-baseline gap-0.5 whitespace-nowrap text-right">
            <span className={`text-xl font-black leading-none tracking-tighter ${total > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
              {total}
            </span>
            <span className="text-[10px] font-bold text-slate-500">%</span>
          </div>
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              isExpanded ? '!bg-white text-blue-600' : '!bg-white text-slate-600'
            }`}
          >
            <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <div className="px-3 pb-2 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-blue-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressClass}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Tổng {total}%
          </span>
        </div>
      </div>

      <div
        className="overflow-hidden transition-[height,opacity] duration-300 ease-in-out"
        style={{ height: isExpanded ? measuredHeight : 0, opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="space-y-2 border-t border-blue-100 !bg-white p-2.5">
          {criterion.children?.map((child) => {
            const sliderMax = Math.max(60, child.weight);
            const sliderPercent = (child.weight / sliderMax) * 100;
            return (
              <div
                key={child.key}
                className="flex flex-col gap-2 rounded-lg border border-transparent !bg-white p-2 transition-all hover:border-blue-100 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="truncate text-[11px] font-bold tracking-wide text-slate-800">{child.name}</p>
                    <span className="text-[10px] font-semibold text-blue-600">{child.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    value={child.weight}
                    onChange={(event) => handleSubChange(child.key, parseInt(event.target.value, 10))}
                    className="relative z-10 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{
                      background: `linear-gradient(90deg, #2388ff ${sliderPercent}%, rgba(55,125,255,0.14) ${sliderPercent}%)`,
                    }}
                  />
                </div>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={child.weight}
                    onChange={(event) => handleSubChange(child.key, parseInt(event.target.value, 10))}
                    className="w-full appearance-none rounded-lg border border-blue-100 bg-white py-1.5 pl-2 pr-4 text-center text-xs font-bold text-slate-900 transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-16"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
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
