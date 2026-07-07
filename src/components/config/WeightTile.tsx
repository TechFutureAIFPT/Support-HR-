import React, { useEffect, useRef, useState } from 'react';
import type { MainCriterion, WeightCriteria } from '@/types';

const CRITERION_TIERS: Record<string, { label: string; color: string }> = {
  jdFit:           { label: 'Quyết định chính', color: 'bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]' },
  workExperience:  { label: 'Quyết định chính', color: 'bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]' },
  technicalSkills: { label: 'Quyết định chính', color: 'bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]' },
  achievements:    { label: 'Nhóm hỗ trợ', color: 'bg-[color:var(--th-accent-muted)] text-[var(--th-accent)]' },
  education:       { label: 'Nhóm hỗ trợ', color: 'bg-[color:var(--th-accent-muted)] text-[var(--th-accent)]' },
  language:        { label: 'Nhóm hỗ trợ', color: 'bg-[color:var(--th-accent-muted)] text-[var(--th-accent)]' },
  professionalism: { label: 'Nhóm cộng thêm', color: 'bg-[var(--th-bg-elevated)] text-[var(--th-text-muted)]' },
  jobTenure:       { label: 'Nhóm cộng thêm', color: 'bg-[var(--th-bg-elevated)] text-[var(--th-text-muted)]' },
  cultureFit:      { label: 'Nhóm cộng thêm', color: 'bg-[var(--th-bg-elevated)] text-[var(--th-text-muted)]' },
};

const CHILD_HINTS: Record<string, string> = {
  overallFit: 'Mức độ phù hợp tổng thể với yêu cầu JD',
  totalYears: 'Tổng số năm kinh nghiệm làm việc',
  relevantExperience: 'Kinh nghiệm trực tiếp trong lĩnh vực',
  hardSkills: 'Kỹ năng kỹ thuật, công cụ, phần mềm',
  softSkills: 'Giao tiếp, nhóm, lãnh đạo, tư duy',
  quantifiableKPI: 'KPI và chỉ số định lượng được từ CV',
  awardsAndCertificates: 'Giải thưởng và chứng chỉ nghề nghiệp',
  degree: 'Bằng cấp và trình độ học vấn',
  grade: 'Loại bằng (Giỏi, Khá, Trung bình...)',
  certificates: 'Chứng chỉ chuyên môn và kỹ năng',
  proficiency: 'Mức độ thành thạo ngôn ngữ (IELTS, TOEIC...)',
  format: 'Bố cục và cấu trúc trình bày CV',
  clarity: 'Mức độ rõ ràng, dễ đọc của CV',
  grammar: 'Ngữ pháp, chính tả, văn phong',
  averageTenure: 'Thời gian trung bình tại mỗi công ty',
  jobHoppingRate: 'Tần suất nhảy việc trong lịch sử',
  valueAlignment: 'Giá trị cá nhân phù hợp văn hóa tổ chức',
};

function getWeightFeedback(weight: number): { label: string; color: string } {
  if (weight >= 15) return { label: 'Tác động cao', color: 'text-[var(--th-primary)]' };
  if (weight >= 6) return { label: 'Cân bằng', color: 'text-[var(--th-success)]' };
  if (weight > 0) return { label: 'Tác động thấp', color: 'text-[var(--th-text-muted)]' };
  return { label: 'Bỏ qua', color: 'text-[var(--th-text-disabled)]' };
}

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

  const total = criterion.children?.reduce((sum, child) => sum + child.weight, 0) || 0;

  useEffect(() => {
    if (contentRef.current) setMeasuredHeight(contentRef.current.scrollHeight);
  }, [criterion.children]);

  useEffect(() => {
    if (isExpanded && contentRef.current) setMeasuredHeight(contentRef.current.scrollHeight);
  }, [isExpanded]);

  const handleSubChange = (childKey: string, newValue: number) => {
    const safeValue = clampWeight(newValue);
    setWeights((prev) => {
      const updated = { ...prev[criterion.key] };
      if (updated.children) {
        updated.children = updated.children.map((child) =>
          child.key === childKey ? { ...child, weight: safeValue } : child,
        );
      }
      return { ...prev, [criterion.key]: updated };
    });
  };

  const totalColor =
    total === 0
      ? 'text-[var(--th-text-disabled)]'
      : total > 40
        ? 'text-[var(--th-primary)]'
        : total > 20
          ? 'text-[var(--th-info)]'
          : 'text-[var(--th-warning)]';

  const progressColor =
    total >= 35
      ? 'linear-gradient(90deg, var(--th-primary) 0%, var(--th-success) 100%)'
      : total >= 15
        ? 'linear-gradient(90deg, var(--th-primary) 0%, var(--th-info) 100%)'
        : 'linear-gradient(90deg, var(--th-warning) 0%, var(--th-accent) 100%)';

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        isExpanded
          ? 'border-[color:var(--th-border)] shadow-[var(--th-shadow-sm)]'
          : 'border-[color:var(--th-border-subtle)] shadow-none hover:border-[color:var(--th-border)]'
      } bg-[var(--th-surface-card)]`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex h-[56px] w-full items-center gap-3 px-4 text-left"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[13px] transition-colors duration-150 ${
            isExpanded
              ? 'border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]'
              : 'border-[color:var(--th-border-subtle)] bg-[var(--th-bg-elevated)] text-[var(--th-text-muted)]'
          }`}
        >
          <i className={criterion.icon} />
        </span>

        <span
          className={`w-[148px] shrink-0 truncate text-[12.5px] font-bold tracking-[0.01em] transition-colors ${
            isExpanded ? 'text-[var(--th-text)]' : 'text-[var(--th-text-secondary)]'
          }`}
        >
          {criterion.name}
        </span>

        {CRITERION_TIERS[criterion.key] && (
          <span className={`hidden shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.07em] sm:inline-flex ${CRITERION_TIERS[criterion.key].color}`}>
            {CRITERION_TIERS[criterion.key].label}
          </span>
        )}

        <div className="hidden flex-1 items-center gap-2.5 sm:flex">
          <div className="flex-1 overflow-hidden rounded-full bg-[var(--th-bg-tertiary)]" style={{ height: '5px' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(total, 100)}%`, background: progressColor }}
            />
          </div>
          <span className="w-[52px] shrink-0 text-right text-[10.5px] font-semibold text-[var(--th-text-muted)]">
            {total > 0 ? `${total}% / 100` : '0%'}
          </span>
        </div>

        <div className={`flex shrink-0 items-baseline gap-[2px] ${totalColor}`}>
          <span className="text-[18px] font-black leading-none tabular-nums">{total}</span>
          <span className="text-[10px] font-bold text-[var(--th-text-muted)]">%</span>
        </div>

        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center text-[10px] transition-all duration-200 ${
            isExpanded ? 'rotate-180 text-[var(--th-primary)]' : 'text-[var(--th-text-disabled)]'
          }`}
        >
          <i className="fa-solid fa-chevron-down" />
        </span>
      </button>

      <div className="px-4 pb-2.5 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-hidden rounded-full bg-[var(--th-bg-tertiary)]" style={{ height: '4px' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(total, 100)}%`, background: progressColor }}
            />
          </div>
          <span className="text-[10px] font-semibold text-[var(--th-text-muted)]">{total}%</span>
        </div>
      </div>

      <div
        className="overflow-hidden transition-[height,opacity] duration-200 ease-in-out"
        style={{ height: isExpanded ? measuredHeight : 0, opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="divide-y divide-[color:var(--th-border-subtle)] border-t border-[color:var(--th-border-subtle)]">
          {criterion.children?.map((child) => {
            const sliderMax = Math.max(60, child.weight);
            const sliderPct = Math.round((child.weight / sliderMax) * 100);

            return (
              <div
                key={child.key}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--th-surface-hover)]"
              >
                <div className="w-[148px] shrink-0">
                  <span className="block text-[11.5px] font-semibold text-[var(--th-text-secondary)]">{child.name}</span>
                  {CHILD_HINTS[child.key] && (
                    <span className="mt-0.5 block text-[10px] leading-[14px] text-[var(--th-text-muted)]">{CHILD_HINTS[child.key]}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    value={child.weight}
                    onChange={(event) => handleSubChange(child.key, parseInt(event.target.value, 10))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus:ring-2 focus:ring-[color:var(--th-primary-muted)]"
                    style={{
                      background: `linear-gradient(90deg, var(--th-primary) ${sliderPct}%, var(--th-bg-tertiary) ${sliderPct}%)`,
                    }}
                  />
                </div>

                <div className="relative w-16 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={child.weight}
                    onChange={(event) => handleSubChange(child.key, parseInt(event.target.value, 10))}
                    className="h-8 w-full rounded-xl border border-[color:var(--th-border-subtle)] bg-[var(--th-bg-elevated)] pl-2 pr-5 text-center text-[12px] font-bold text-[var(--th-primary)] transition focus:border-[color:var(--th-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--th-primary-muted)]"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--th-text-muted)]">
                    %
                  </span>
                </div>

                <span className={`hidden w-[72px] shrink-0 text-right text-[10px] font-medium sm:block ${getWeightFeedback(child.weight).color}`}>
                  {getWeightFeedback(child.weight).label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeightTile;
