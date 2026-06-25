import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MainCriterion, WeightCriteria } from '@/types';
import { useTheme } from '@/context/theme/ThemeProvider';

interface WeightTileProps {
  criterion: MainCriterion;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  isExpanded: boolean;
  onToggle: () => void;
}

const clampWeight = (value: number) => Math.max(0, Math.min(100, Number.isNaN(value) ? 0 : value));

const WeightTile: React.FC<WeightTileProps> = ({ criterion, setWeights, isExpanded, onToggle }) => {
  const { isDarkMode } = useTheme();
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

  const d = {
    tileBg: isDarkMode ? 'var(--th-bg-elevated)' : '#ffffff',
    tileBorderExpanded: isDarkMode ? 'rgba(99,153,255,0.35)' : 'rgb(147,197,253)',
    tileBorderCollapsed: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgb(219,234,254)',
    iconBg: isDarkMode ? 'var(--th-bg-secondary)' : '#ffffff',
    iconBorderExpanded: isDarkMode ? 'rgba(99,153,255,0.3)' : 'rgb(191,219,254)',
    iconBorderCollapsed: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgb(219,234,254)',
    iconColorExpanded: isDarkMode ? '#60a5fa' : '#2563eb',
    iconColorCollapsed: isDarkMode ? '#94a3b8' : '#475569',
    nameColor: isDarkMode ? 'var(--th-text)' : '#020617',
    trackBg: isDarkMode ? 'rgba(99,153,255,0.18)' : 'rgb(219,234,254)',
    metaColor: isDarkMode ? 'var(--th-text-muted)' : '#64748b',
    totalColor: (v: number) => v > 0 ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#475569' : '#94a3b8'),
    chevronBg: isDarkMode ? 'transparent' : '#ffffff',
    chevronColorExpanded: isDarkMode ? '#60a5fa' : '#2563eb',
    chevronColorCollapsed: isDarkMode ? '#94a3b8' : '#475569',
    contentBorder: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgb(219,234,254)',
    contentBg: isDarkMode ? 'var(--th-bg-elevated)' : '#ffffff',
    subItemBg: isDarkMode ? 'var(--th-bg-elevated)' : '#ffffff',
    subItemHoverBorder: isDarkMode ? 'rgba(99,153,255,0.25)' : 'rgb(219,234,254)',
    childNameColor: isDarkMode ? 'var(--th-text-secondary)' : '#1e293b',
    childPctColor: isDarkMode ? '#60a5fa' : '#2563eb',
    inputBg: isDarkMode ? 'var(--th-bg-secondary)' : '#ffffff',
    inputBorder: isDarkMode ? 'rgba(99,153,255,0.25)' : 'rgb(219,234,254)',
    inputText: isDarkMode ? 'var(--th-text)' : '#0f172a',
    pctSuffix: isDarkMode ? 'var(--th-text-muted)' : '#64748b',
    sliderTrack: isDarkMode ? 'rgba(99,153,255,0.18)' : 'rgba(55,125,255,0.14)',
  };

  return (
    <div
      className="rounded-lg border transition-all duration-300"
      style={{
        background: d.tileBg,
        borderColor: isExpanded ? d.tileBorderExpanded : d.tileBorderCollapsed,
        boxShadow: isExpanded
          ? isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 12px 30px rgba(30,64,175,0.08)'
          : isDarkMode ? 'none' : '0 6px 18px rgba(30,64,175,0.035)',
      }}
    >
      <button
        type="button"
        className="flex min-h-[58px] w-full items-center gap-3 px-3 py-2 text-left sm:px-4"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm"
            style={{
              background: d.iconBg,
              borderColor: isExpanded ? d.iconBorderExpanded : d.iconBorderCollapsed,
              color: isExpanded ? d.iconColorExpanded : d.iconColorCollapsed,
            }}
          >
            <i className={criterion.icon} />
          </div>
          <div className="min-w-[9rem] max-w-[16rem] flex-1">
            <p className="truncate text-sm font-bold tracking-wide" style={{ color: d.nameColor }}>
              {criterion.name}
            </p>
          </div>
          <div className="hidden min-w-0 flex-[1.4] items-center gap-3 sm:flex">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: d.trackBg }}>
              <div
                className={`h-full rounded-full bg-gradient-to-r ${progressClass}`}
                style={{ width: `${Math.min(total, 100)}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider" style={{ color: d.metaColor }}>
              Tổng {total}%
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-baseline gap-0.5 whitespace-nowrap text-right">
            <span className="text-xl font-black leading-none tracking-tighter" style={{ color: d.totalColor(total) }}>
              {total}
            </span>
            <span className="text-[10px] font-bold" style={{ color: d.metaColor }}>%</span>
          </div>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            style={{ background: d.chevronBg, color: isExpanded ? d.chevronColorExpanded : d.chevronColorCollapsed }}
          >
            <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <div className="px-3 pb-2 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: d.trackBg }}>
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressClass}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-wider" style={{ color: d.metaColor }}>
            Tổng {total}%
          </span>
        </div>
      </div>

      <div
        className="overflow-hidden transition-[height,opacity] duration-300 ease-in-out"
        style={{ height: isExpanded ? measuredHeight : 0, opacity: isExpanded ? 1 : 0 }}
      >
        <div
          ref={contentRef}
          className="space-y-2 border-t p-2.5"
          style={{ borderColor: d.contentBorder, background: d.contentBg }}
        >
          {criterion.children?.map((child) => {
            const sliderMax = Math.max(60, child.weight);
            const sliderPercent = (child.weight / sliderMax) * 100;
            return (
              <div
                key={child.key}
                className="flex flex-col gap-2 rounded-lg border border-transparent p-2 transition-all sm:flex-row sm:items-center sm:gap-3"
                style={{ background: d.subItemBg }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = d.subItemHoverBorder; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="truncate text-[11px] font-bold tracking-wide" style={{ color: d.childNameColor }}>{child.name}</p>
                    <span className="text-[10px] font-semibold" style={{ color: d.childPctColor }}>{child.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    value={child.weight}
                    onChange={(event) => handleSubChange(child.key, parseInt(event.target.value, 10))}
                    className="relative z-10 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{
                      background: `linear-gradient(90deg, #2388ff ${sliderPercent}%, ${d.sliderTrack} ${sliderPercent}%)`,
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
                    className="w-full appearance-none rounded-lg border py-1.5 pl-2 pr-4 text-center text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-16"
                    style={{ background: d.inputBg, borderColor: d.inputBorder, color: d.inputText }}
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: d.pctSuffix }}>
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
