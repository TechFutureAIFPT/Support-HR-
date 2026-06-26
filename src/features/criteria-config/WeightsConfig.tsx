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

interface ScoringTier {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  criteriaKeys: string[];
  accentClass: string;
  labelClass: string;
  valueClass: string;
}

const SCORING_TIERS: ScoringTier[] = [
  {
    key: 'core',
    label: 'Quyết định chính',
    emoji: '🏆',
    desc: 'Tác động trực tiếp đến quyết định shortlist',
    criteriaKeys: ['jdFit', 'workExperience', 'technicalSkills'],
    accentClass: 'border-blue-100 bg-blue-50/70',
    labelClass: 'text-blue-700',
    valueClass: 'text-blue-600',
  },
  {
    key: 'support',
    label: 'Nhóm hỗ trợ',
    emoji: '📌',
    desc: 'Tăng độ tự tin, không đủ đứng độc lập',
    criteriaKeys: ['achievements', 'education', 'language'],
    accentClass: 'border-violet-100 bg-violet-50/70',
    labelClass: 'text-violet-700',
    valueClass: 'text-violet-600',
  },
  {
    key: 'bonus',
    label: 'Nhóm cộng thêm',
    emoji: '➕',
    desc: 'Điểm cộng khi các ứng viên ngang nhau',
    criteriaKeys: ['professionalism', 'jobTenure', 'cultureFit'],
    accentClass: 'border-slate-200 bg-slate-50',
    labelClass: 'text-slate-600',
    valueClass: 'text-slate-500',
  },
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

  const tierWeights = useMemo(
    () => SCORING_TIERS.map((tier) => ({
      ...tier,
      total: tier.criteriaKeys.reduce((sum, key) => {
        const criterion = weights[key];
        if (!criterion) return sum;
        if (criterion.children) return sum + criterion.children.reduce((s, c) => s + c.weight, 0);
        return sum + (criterion.weight || 0);
      }, 0),
    })),
    [weights]
  );

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

      {/* Navigation bar — back | step chips | next */}
      <div className="relative z-10 shrink-0 border-b border-blue-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex w-32 shrink-0 items-center">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="weights-config__back-button flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold transition-all"
              >
                <span className="text-sm leading-none">←</span>
                Bộ lọc cứng
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                      className="weights-config__step-connector h-px w-8 shrink-0"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex w-32 shrink-0 justify-end">
            {step === 1 && (
              <button
                type="button"
                onClick={handleFiltersComplete}
                className="weights-config__primary-cta flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-white transition-all"
              >
                Trọng số
                <span className="text-sm leading-none">→</span>
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={handleWeightsComplete}
                disabled={totalWeight !== 100}
                data-ready={totalWeight === 100}
                className="weights-config__finish-cta flex items-center gap-2 px-4 py-2 text-[11px] font-bold transition-all"
              >
                Hoàn tất
                <span className="text-sm leading-none">→</span>
              </button>
            )}
          </div>
        </div>

        {(validationErrorFilters || validationErrorWeights) && (
          <p className="mt-2 text-center text-[10px] font-medium text-red-500">
            {validationErrorFilters || validationErrorWeights}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="relative z-10 shrink-0 border-b border-blue-50 bg-slate-50/80 px-4 py-2">
        {step === 1 ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Đã bật</span>
              <span className="text-xl font-black text-slate-900">{mandatoryProgress.active}</span>
            </div>
            <div className="h-5 w-px bg-blue-100" />
            <div className="flex items-center gap-2">
              <span className="weights-config__metric-label text-[10px] font-bold uppercase tracking-[0.14em]">Hợp lệ</span>
              <span className="weights-config__metric-value text-xl font-black">{mandatoryProgress.fulfilled}</span>
            </div>
            <div className="h-5 w-px bg-blue-100" />
            <div className="flex min-w-[100px] items-center gap-2">
              <div className="weights-config__progress-track relative h-1.5 flex-1 overflow-hidden rounded-full">
                <div className="weights-config__progress-fill h-full transition-all duration-700 ease-out" />
              </div>
              <span className="weights-config__progress-value text-[10px] font-bold">{mandatoryProgress.percent}%</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng trọng số</span>
              <span className="weights-config__total-value text-xl font-black tracking-tighter" data-status={weightStatus.state}>
                {totalWeight}
                <span className="weights-config__total-suffix text-sm font-bold">%</span>
              </span>
            </div>
            <div
              className="weights-config__status-pill flex items-center gap-1.5 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
              data-status={weightStatus.state}
            >
              {weightStatus.label} · {weightStatus.desc}
            </div>
            <TotalWeightDisplay totalWeight={totalWeight} />
          </div>
        )}
      </div>

      {/* Main scrollable content */}
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        <div className="custom-scrollbar h-full overflow-y-auto">
          <div className="w-full p-3 pb-6 md:p-4 md:pb-8 lg:p-5">
            {step === 1 ? (
              <HardFilterPanel hardFilters={hardFilters} setHardFilters={setHardFilters} jdText={jdText} />
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {/* Chiến lược chấm điểm */}
                <div className="mb-1 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[12px] font-black text-slate-800">Chiến lược chấm điểm</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-500">3 nhóm ưu tiên</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {tierWeights.map((tier) => (
                      <div key={tier.key} className={`rounded-xl border p-3 ${tier.accentClass}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-[0.06em] ${tier.labelClass}`}>
                          {tier.emoji} {tier.label}
                        </div>
                        <div className={`mt-1 text-[22px] font-black tabular-nums leading-none ${tier.valueClass}`}>
                          {tier.total}<span className="text-[11px] font-bold text-slate-400">%</span>
                        </div>
                        <p className="mt-1.5 text-[9.5px] leading-4 text-slate-500">{tier.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

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
