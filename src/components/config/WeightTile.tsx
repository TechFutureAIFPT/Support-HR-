import React, { useEffect, useRef, useState } from 'react';
import type { MainCriterion, WeightCriteria } from '@/types';

const CRITERION_TIERS: Record<string, { label: string; color: string }> = {
  jdFit:          { label: 'Quyết định chính', color: 'bg-blue-100 text-blue-600' },
  workExperience: { label: 'Quyết định chính', color: 'bg-blue-100 text-blue-600' },
  technicalSkills:{ label: 'Quyết định chính', color: 'bg-blue-100 text-blue-600' },
  achievements:   { label: 'Nhóm hỗ trợ', color: 'bg-violet-100 text-violet-600' },
  education:      { label: 'Nhóm hỗ trợ', color: 'bg-violet-100 text-violet-600' },
  language:       { label: 'Nhóm hỗ trợ', color: 'bg-violet-100 text-violet-600' },
  professionalism:{ label: 'Nhóm cộng thêm', color: 'bg-slate-100 text-slate-500' },
  jobTenure:      { label: 'Nhóm cộng thêm', color: 'bg-slate-100 text-slate-500' },
  cultureFit:     { label: 'Nhóm cộng thêm', color: 'bg-slate-100 text-slate-500' },
};

const CHILD_HINTS: Record<string, string> = {
  overallFit:            'Mức độ phù hợp tổng thể với yêu cầu JD',
  totalYears:            'Tổng số năm kinh nghiệm làm việc',
  relevantExperience:    'Kinh nghiệm trực tiếp trong lĩnh vực',
  hardSkills:            'Kỹ năng kỹ thuật, công cụ, phần mềm',
  softSkills:            'Giao tiếp, nhóm, lãnh đạo, tư duy',
  quantifiableKPI:       'KPI và chỉ số định lượng được từ CV',
  awardsAndCertificates: 'Giải thưởng và chứng chỉ nghề nghiệp',
  degree:                'Bằng cấp và trình độ học vấn',
  grade:                 'Loại bằng (Giỏi, Khá, Trung bình...)',
  certificates:          'Chứng chỉ chuyên môn và kỹ năng',
  proficiency:           'Mức độ thành thạo ngôn ngữ (IELTS, TOEIC...)',
  format:                'Bố cục và cấu trúc trình bày CV',
  clarity:               'Mức độ rõ ràng, dễ đọc của CV',
  grammar:               'Ngữ pháp, chính tả, văn phong',
  averageTenure:         'Thời gian trung bình tại mỗi công ty',
  jobHoppingRate:        'Tần suất nhảy việc trong lịch sử',
  valueAlignment:        'Giá trị cá nhân phù hợp văn hoá tổ chức',
};

function getWeightFeedback(weight: number): { label: string; color: string } {
  if (weight >= 15) return { label: 'Tác động cao', color: 'text-blue-500' };
  if (weight >= 6)  return { label: 'Cân bằng', color: 'text-emerald-500' };
  if (weight > 0)   return { label: 'Tác động thấp', color: 'text-slate-400' };
  return { label: 'Bỏ qua', color: 'text-slate-300' };
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
          child.key === childKey ? { ...child, weight: safeValue } : child
        );
      }
      return { ...prev, [criterion.key]: updated };
    });
  };

  const totalColor =
    total === 0 ? 'text-slate-300' : total > 40 ? 'text-blue-600' : total > 20 ? 'text-sky-500' : 'text-amber-500';

  const progressColor =
    total >= 35 ? 'from-blue-500 to-emerald-400' : total >= 15 ? 'from-blue-400 to-sky-400' : 'from-amber-300 to-orange-300';

  return (
    <div className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
      isExpanded
        ? 'border-blue-200 shadow-sm shadow-blue-50'
        : 'border-slate-100 shadow-none hover:border-slate-200'
    } bg-white`}>

      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex h-[56px] w-full items-center gap-3 px-4 text-left"
      >
        {/* FontAwesome icon from config */}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[13px] transition-colors duration-150 ${
          isExpanded
            ? 'border-blue-200 bg-blue-50 text-blue-600'
            : 'border-slate-200 bg-slate-50 text-slate-400'
        }`}>
          <i className={criterion.icon} />
        </span>

        {/* Name */}
        <span className={`w-[148px] shrink-0 truncate text-[12.5px] font-bold tracking-[0.01em] transition-colors ${
          isExpanded ? 'text-slate-900' : 'text-slate-700'
        }`}>
          {criterion.name}
        </span>

        {/* Tier badge */}
        {CRITERION_TIERS[criterion.key] && (
          <span className={`hidden sm:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.07em] ${CRITERION_TIERS[criterion.key].color}`}>
            {CRITERION_TIERS[criterion.key].label}
          </span>
        )}

        {/* Progress bar */}
        <div className="hidden flex-1 items-center gap-2.5 sm:flex">
          <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: '5px' }}>
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${progressColor}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          <span className="w-[52px] shrink-0 text-right text-[10.5px] font-semibold text-slate-400">
            {total > 0 ? `${total}% / 100` : '0%'}
          </span>
        </div>

        {/* Total badge */}
        <div className={`flex shrink-0 items-baseline gap-[2px] ${totalColor}`}>
          <span className="text-[18px] font-black leading-none tabular-nums">{total}</span>
          <span className="text-[10px] font-bold text-slate-400">%</span>
        </div>

        {/* Chevron */}
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[10px] transition-all duration-200 ${
          isExpanded ? 'rotate-180 text-blue-400' : 'text-slate-300'
        }`}>
          <i className="fa-solid fa-chevron-down" />
        </span>
      </button>

      {/* Mobile progress bar */}
      <div className="px-4 pb-2.5 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: '4px' }}>
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColor}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">{total}%</span>
        </div>
      </div>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-[height,opacity] duration-200 ease-in-out"
        style={{ height: isExpanded ? measuredHeight : 0, opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="border-t border-slate-100 divide-y divide-slate-100/80">
          {criterion.children?.map((child) => {
            const sliderMax = Math.max(60, child.weight);
            const sliderPct = Math.round((child.weight / sliderMax) * 100);

            return (
              <div
                key={child.key}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60"
              >
                {/* Sub-criteria name + hint */}
                <div className="w-[148px] shrink-0">
                  <span className="block text-[11.5px] font-semibold text-slate-700">{child.name}</span>
                  {CHILD_HINTS[child.key] && (
                    <span className="mt-0.5 block text-[10px] leading-[14px] text-slate-400">{CHILD_HINTS[child.key]}</span>
                  )}
                </div>

                {/* Slider */}
                <div className="flex-1 min-w-0">
                  <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    value={child.weight}
                    onChange={(e) => handleSubChange(child.key, parseInt(e.target.value, 10))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{
                      background: `linear-gradient(90deg, #3b82f6 ${sliderPct}%, #e2e8f0 ${sliderPct}%)`,
                    }}
                  />
                </div>

                {/* Number input */}
                <div className="relative w-16 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={child.weight}
                    onChange={(e) => handleSubChange(child.key, parseInt(e.target.value, 10))}
                    className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-2 pr-5 text-center text-[12px] font-bold text-blue-600 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    %
                  </span>
                </div>

                {/* Micro-feedback */}
                <span className={`hidden sm:block w-[72px] shrink-0 text-right text-[10px] font-medium ${getWeightFeedback(child.weight).color}`}>
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
