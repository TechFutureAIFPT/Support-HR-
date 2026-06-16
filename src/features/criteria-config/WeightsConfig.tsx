import React, { memo, useCallback, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { HardFilters, WeightCriteria, MainCriterion } from '@/types';
import HardFilterPanel from '@/components/config/HardFilterPanel';
import WeightTile from '@/components/config/WeightTile';
import TotalWeightDisplay from '@/components/config/TotalWeightDisplay';
import { useThemeColors } from '@/hooks/useThemeColors';
import '@/features/criteria-config/styles/weights-config.css';

interface WeightsConfigProps {
  weights: WeightCriteria;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
  jdText?: string;
}

const MANDATORY_FIELDS_FOR_VALIDATION = [
  { key: 'location', label: 'Địa điểm làm việc' },
  { key: 'age', label: 'Độ tuổi' },
  { key: 'minExp', label: 'Kinh nghiệm tối thiểu' },
  { key: 'seniority', label: 'Cấp độ' },
  { key: 'education', label: 'Học vấn' },
  { key: 'majorGroups', label: 'Nhóm chuyên ngành' },
  { key: 'industry', label: 'Ngành nghề' },
  { key: 'language', label: 'Ngôn ngữ' },
  { key: 'certificates', label: 'Chứng chỉ' },
  { key: 'salary', label: 'Lương' },
  { key: 'workFormat', label: 'Hình thức làm việc' },
  { key: 'contractType', label: 'Hợp đồng' },
] as const;

function hasHardFilterValue(hardFilters: HardFilters, key: string): boolean {
  if (key === 'salary') return Boolean(hardFilters.salaryMin || hardFilters.salaryMax);
  if (key === 'age') return Boolean(hardFilters.age?.min !== undefined || hardFilters.age?.max !== undefined);
  if (key === 'majorGroups') return Boolean((hardFilters.majorGroups || []).length > 0);
  const value = hardFilters[key as keyof HardFilters];
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

const STEPS = [
  { num: 1 as const, label: 'Bộ lọc cứng' },
  { num: 2 as const, label: 'Phân bổ trọng số' },
];

type WeightStatusState = 'balanced' | 'over' | 'under';
type SummaryTone = 'high' | 'medium' | 'low';

type WeightsConfigThemeVars = CSSProperties & {
  '--weights-page-bg': string;
  '--weights-border-color': string;
  '--weights-border-soft': string;
  '--weights-panel-border': string;
  '--weights-card-bg-2': string;
  '--weights-card-border': string;
  '--weights-text-primary': string;
  '--weights-text-secondary': string;
  '--weights-text-muted': string;
  '--weights-text-dim': string;
  '--weights-progress-width': string;
};

const getSummaryTone = (pct: number): SummaryTone => {
  if (pct >= 30) return 'high';
  if (pct >= 15) return 'medium';
  return 'low';
};

const WeightsConfig: React.FC<WeightsConfigProps> = memo(({ weights, setWeights, hardFilters, setHardFilters, onComplete, jdText }) => {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);
  const [validationErrorFilters, setValidationErrorFilters] = useState<string | null>(null);
  const [validationErrorWeights, setValidationErrorWeights] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const totalWeight = useMemo(() => {
    return Object.values(weights).reduce((total: number, criterion: MainCriterion) => {
      if (criterion.children) {
        return total + criterion.children.reduce((subTotal, child) => subTotal + child.weight, 0);
      }
      return total + (criterion.weight || 0);
    }, 0);
  }, [weights]);

  const remainingWeight = 100 - totalWeight;

  const weightStatus = useMemo(() => {
    if (totalWeight === 100) {
      return {
        label: 'Đạt chuẩn',
        desc: 'Tổng trọng số đạt 100%',
        state: 'balanced' as WeightStatusState,
      };
    }

    if (totalWeight > 100) {
      return {
        label: 'Vượt ngưỡng',
        desc: `Thừa ${Math.abs(remainingWeight)}%`,
        state: 'over' as WeightStatusState,
      };
    }

    return {
      label: 'Chưa đủ',
      desc: `Thiếu ${Math.abs(remainingWeight)}%`,
      state: 'under' as WeightStatusState,
    };
  }, [remainingWeight, totalWeight]);

  const primaryCriteria = useMemo(() => {
    return Object.values(weights).filter((criterion: MainCriterion) => criterion.children) as MainCriterion[];
  }, [weights]);

  const validateFilters = useCallback((): boolean => {
    setValidationErrorFilters(null);

    const invalidField = MANDATORY_FIELDS_FOR_VALIDATION.find((field) => {
      const mandatoryKey = `${field.key}Mandatory` as keyof HardFilters;
      if (!hardFilters[mandatoryKey]) return false;
      return !hasHardFilterValue(hardFilters, field.key);
    });

    if (invalidField) {
      setValidationErrorFilters(`Vui lòng điền giá trị cho tiêu chí bắt buộc: ${invalidField.label}.`);
      return false;
    }

    return true;
  }, [hardFilters]);

  const handleStepChange = useCallback((nextStep: 1 | 2) => {
    if (nextStep === 2 && !validateFilters()) {
      return;
    }
    setStep(nextStep);
  }, [validateFilters]);

  const handleFiltersComplete = useCallback(() => {
    if (!validateFilters()) return;
    setStep(2);
  }, [validateFilters]);

  const handleWeightsComplete = useCallback(() => {
    setValidationErrorWeights(null);
    if (totalWeight !== 100) {
      setValidationErrorWeights('Tổng trọng số phải bằng 100% trước khi tiếp tục.');
      return;
    }
    onComplete();
  }, [onComplete, totalWeight]);

  const mandatoryProgress = useMemo(() => {
    const keys = Object.keys(hardFilters).filter((key) => key.endsWith('Mandatory')) as Array<keyof HardFilters>;
    const active = keys.filter((key) => hardFilters[key]).length;
    const fulfilled = keys.filter((key) => {
      if (!hardFilters[key]) return false;
      const rawValueKey = key.replace('Mandatory', '');
      const valueKey = rawValueKey === 'major' ? 'majorGroups' : rawValueKey;
      return hasHardFilterValue(hardFilters, valueKey);
    }).length;

    return {
      active,
      fulfilled,
      percent: active ? Math.round((fulfilled / active) * 100) : 0,
    };
  }, [hardFilters]);

  const tc = useThemeColors();
  const themeVars: WeightsConfigThemeVars = {
    '--weights-page-bg': tc.pageBg,
    '--weights-border-color': tc.borderColor,
    '--weights-border-soft': tc.borderSoft,
    '--weights-panel-border': tc.border,
    '--weights-card-bg-2': tc.cardBg2,
    '--weights-card-border': tc.borderCard,
    '--weights-text-primary': tc.textPrimary,
    '--weights-text-secondary': tc.textSecondary,
    '--weights-text-muted': tc.textMuted,
    '--weights-text-dim': tc.textDim,
    '--weights-progress-width': `${mandatoryProgress.percent}%`,
  };

  return (
    <section
      id="module-weights"
      className="weights-config module-pane active relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={themeVars}
    >
      <div className="weights-config__glow weights-config__glow--top" />
      <div className="weights-config__glow weights-config__glow--bottom" />
      <div className="weights-config__glow weights-config__glow--center" />

      <div className="weights-config__header flex shrink-0 flex-col justify-between gap-3 border-b px-4 py-3 md:flex-row md:items-center" style={{ display: 'none' }}>
        <div className="flex items-center gap-3">
          <div className="weights-config__accent shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="weights-config__heading text-base font-bold leading-tight tracking-tight">
              Phân bổ trọng số và bộ lọc
            </h1>
            <p className="weights-config__subheading mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight">
              Weight Configuration and Hard Filters
            </p>
          </div>
        </div>

        <div className="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {STEPS.map((stepConfig, index) => {
            const stepState = step === stepConfig.num ? 'active' : step > stepConfig.num ? 'done' : 'idle';

            return (
              <React.Fragment key={stepConfig.num}>
                <button
                  type="button"
                  onClick={() => handleStepChange(stepConfig.num)}
                  data-state={stepState}
                  className="weights-config__step-button whitespace-nowrap px-4 py-1.5 text-xs font-bold transition-all duration-300"
                >
                  <div className="weights-config__step-index flex h-5 w-5 shrink-0 items-center justify-center text-[9px] font-black">
                    {step > stepConfig.num ? '✓' : stepConfig.num}
                  </div>
                  {stepConfig.label}
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    data-state={step > stepConfig.num ? 'done' : 'idle'}
                    className="weights-config__step-connector h-px w-4 shrink-0 md:w-8"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Side panel content moved to top as compact bar */}
        <div className="shrink-0 border-b border-blue-100 bg-white">
          {step === 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              {/* Progress summary */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Đã bật</span>
                  <span className="text-2xl font-black text-slate-900">{mandatoryProgress.active}</span>
                </div>
                <div className="h-6 w-px bg-blue-100" />
                <div className="flex items-center gap-2">
                  <span className="weights-config__metric-label text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Hợp lệ</span>
                  <span className="weights-config__metric-value text-2xl font-black">{mandatoryProgress.fulfilled}</span>
                </div>
                <div className="h-6 w-px bg-blue-100" />
                <div className="flex min-w-[120px] items-center gap-2">
                  <div className="weights-config__progress-track relative h-2 flex-1 overflow-hidden rounded-full">
                    <div className="weights-config__progress-fill h-full transition-all duration-700 ease-out" />
                  </div>
                  <span className="weights-config__progress-value text-xs font-bold">{mandatoryProgress.percent}%</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFiltersComplete}
                className="weights-config__primary-cta flex items-center gap-2 px-5 py-2 text-[11px] font-bold text-white transition-all"
              >
                Tiếp tục phân bổ trọng số
                <span className="text-[10px] opacity-80">→</span>
              </button>
              {validationErrorFilters && (
                <p className="w-full text-[10px] font-medium text-red-500">{validationErrorFilters}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Tổng trọng số</span>
                  <span className="weights-config__total-value text-2xl font-black tracking-tighter" data-status={weightStatus.state}>
                    {totalWeight}
                    <span className="weights-config__total-suffix text-base font-bold">%</span>
                  </span>
                </div>
                <div
                  className="weights-config__status-pill flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
                  data-status={weightStatus.state}
                >
                  {weightStatus.label} · {weightStatus.desc}
                </div>
                <TotalWeightDisplay totalWeight={totalWeight} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="weights-config__back-button flex items-center gap-1.5 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.1em] transition-all"
                >
                  <span className="text-[10px]">←</span>
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleWeightsComplete}
                  disabled={totalWeight !== 100}
                  data-ready={totalWeight === 100}
                  className="weights-config__finish-cta flex items-center gap-2 px-5 py-2 text-[11px] font-bold transition-all"
                >
                  Hoàn tất và phân tích ngay
                  <span className="text-[10px] opacity-80">→</span>
                </button>
              </div>
              {validationErrorWeights && (
                <p className="w-full text-[10px] font-medium text-red-500">{validationErrorWeights}</p>
              )}
            </div>
          )}
        </div>

        {/* Main scrollable content — full width */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="w-full p-3 pb-6 md:p-4 md:pb-8 lg:p-5">
            {step === 1 ? (
              <HardFilterPanel hardFilters={hardFilters} setHardFilters={setHardFilters} jdText={jdText} />
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {primaryCriteria.map((criterion) => (
                  <WeightTile
                    key={criterion.key}
                    criterion={criterion}
                    setWeights={setWeights}
                    isExpanded={expandedCriterion === criterion.key}
                    onToggle={() =>
                      setExpandedCriterion((prev) => (prev === criterion.key ? null : criterion.key))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
});

WeightsConfig.displayName = 'WeightsConfig';

export default WeightsConfig;
