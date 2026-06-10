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
}

const MANDATORY_FIELDS_FOR_VALIDATION = [
  { key: 'location', label: 'Địa điểm làm việc' },
  { key: 'minExp', label: 'Kinh nghiệm tối thiểu' },
  { key: 'seniority', label: 'Cấp độ' },
  { key: 'education', label: 'Học vấn' },
  { key: 'industry', label: 'Ngành nghề' },
  { key: 'language', label: 'Ngôn ngữ' },
  { key: 'certificates', label: 'Chứng chỉ' },
  { key: 'salary', label: 'Lương' },
  { key: 'workFormat', label: 'Hình thức làm việc' },
  { key: 'contractType', label: 'Hợp đồng' },
] as const;

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

const WeightsConfig: React.FC<WeightsConfigProps> = memo(({ weights, setWeights, hardFilters, setHardFilters, onComplete }) => {
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
      if (field.key === 'salary') return !hardFilters.salaryMin && !hardFilters.salaryMax;
      const valueKey = field.key as keyof HardFilters;
      return !hardFilters[valueKey];
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
      const valueKey = key.replace('Mandatory', '') as keyof HardFilters;
      const value = hardFilters[valueKey];
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="w-full p-4 pb-24 md:p-5 md:pb-24 lg:p-5 lg:pb-28">
            {step === 1 ? (
              <HardFilterPanel hardFilters={hardFilters} setHardFilters={setHardFilters} />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
                <div className="hidden">
                  <div className="weights-config__accent shrink-0" />
                  <div>
                    <h3 className="weights-config__section-title text-sm font-bold">
                      Phân bổ trọng số cho từng tiêu chí
                    </h3>
                    <p className="weights-config__section-copy text-[11px]">
                      Kéo thanh trượt hoặc nhập số để điều chỉnh mức độ quan trọng.
                    </p>
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

        <div className="weights-config__side-panel relative z-10 flex min-h-0 w-full shrink-0 flex-col backdrop-blur-xl lg:w-[340px] xl:w-[400px]">
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {step === 1 ? (
              <>
                <div className="p-4 lg:p-5">
                  <div className="weights-config__card weights-config__card--progress relative mb-3 overflow-hidden p-4">
                    <div className="weights-config__card-glow weights-config__card-glow--info" />

                    <h4 className="weights-config__card-title relative z-10 mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <div className="weights-config__card-accent h-6 w-[2px] shrink-0" />
                      Tiến trình bộ lọc
                    </h4>

                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="weights-config__metric-card flex flex-col items-center justify-center p-3">
                        <span className="mb-0.5 text-2xl font-black tracking-tighter text-slate-900">{mandatoryProgress.active}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Đã bật</span>
                      </div>
                      <div className="weights-config__metric-card weights-config__metric-card--success flex flex-col items-center justify-center p-3">
                        <span className="weights-config__metric-value mb-0.5 text-2xl font-black tracking-tighter">
                          {mandatoryProgress.fulfilled}
                        </span>
                        <span className="weights-config__metric-label text-[9px] font-bold uppercase tracking-[0.2em]">
                          Hợp lệ
                        </span>
                      </div>
                    </div>

                    <div className="weights-config__progress-shell relative space-y-1.5 p-2.5">
                      <div className="flex justify-between text-[10px] font-bold tracking-[0.15em]">
                        <span className="weights-config__progress-label uppercase">Hoàn tất</span>
                        <span className="weights-config__progress-value">{mandatoryProgress.percent}%</span>
                      </div>
                      <div className="weights-config__progress-track relative h-2 overflow-hidden">
                        <div className="weights-config__progress-fill relative flex h-full justify-end transition-all duration-700 ease-out">
                          <div className="weights-config__progress-shine absolute top-0 right-0 h-full w-6" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="weights-config__note flex items-start gap-2.5 overflow-hidden p-3">
                    <div className="weights-config__note-accent h-full w-[2px] shrink-0" />
                    <p className="weights-config__note-copy text-[11px] font-medium leading-relaxed text-slate-600">
                      Tiêu chí bật <strong className="font-bold text-slate-900">Bắt buộc</strong> nhưng chưa có giá trị sẽ bị
                      <strong className="font-bold text-slate-900"> bỏ qua</strong> khi AI phân tích.
                    </p>
                  </div>
                </div>

                <div className="weights-config__footer-actions mt-auto space-y-2 p-3 lg:p-4">
                  <button
                    type="button"
                    onClick={handleFiltersComplete}
                    className="weights-config__primary-cta flex w-full items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-white transition-all"
                  >
                    Tiếp tục phân bổ trọng số
                    <span className="text-[10px] opacity-80">→</span>
                  </button>

                  {validationErrorFilters && (
                    <div className="weights-config__error flex items-start gap-2 p-2">
                      <div className="weights-config__error-bar h-full w-[2px] shrink-0" />
                      <p className="text-[10px] font-medium leading-relaxed text-red-300">{validationErrorFilters}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-4 lg:p-5">
                  <div className="weights-config__card relative mb-3 overflow-hidden p-4">
                    <div className="weights-config__card-glow" data-status={weightStatus.state} />

                    <h4 className="weights-config__card-title relative z-10 mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <div className="weights-config__card-accent h-6 w-[2px] shrink-0" />
                      Tổng trọng số
                    </h4>

                    <div className="weights-config__total-card mb-3 flex flex-col items-center justify-center p-3">
                      <div className="relative z-10 flex items-baseline gap-1 transition-transform duration-500">
                        <span className="weights-config__total-value text-4xl font-black tracking-tighter" data-status={weightStatus.state}>
                          {totalWeight}
                        </span>
                        <span className="weights-config__total-suffix text-lg font-bold" data-status={weightStatus.state}>
                          %
                        </span>
                      </div>
                      <div
                        className="weights-config__status-pill mt-1.5 flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
                        data-status={weightStatus.state}
                      >
                        {weightStatus.label} · {weightStatus.desc}
                      </div>
                    </div>

                    <TotalWeightDisplay totalWeight={totalWeight} />
                  </div>

                  <div className="space-y-1.5">
                    {primaryCriteria.slice(0, 4).map((criterion) => {
                      const subTotal = criterion.children?.reduce((sum, child) => sum + child.weight, 0) || 0;
                      const pct = Math.round(subTotal);

                      return (
                        <div key={criterion.key} className="weights-config__summary-row flex items-center gap-2 px-2 py-1.5">
                          <div className="weights-config__summary-accent h-5 w-[2px] shrink-0" data-tone={getSummaryTone(pct)} />
                          <span className="weights-config__summary-label flex-1 truncate text-[10px] font-medium">
                            {criterion.name}
                          </span>
                          <span className="weights-config__summary-value text-[10px] font-bold">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="weights-config__footer-actions mt-auto space-y-2 p-3 lg:p-4">
                  <button
                    type="button"
                    onClick={handleWeightsComplete}
                    disabled={totalWeight !== 100}
                    data-ready={totalWeight === 100}
                    className="weights-config__finish-cta flex w-full items-center justify-center gap-2 py-2.5 text-[11px] font-bold transition-all"
                  >
                    Hoàn tất và phân tích ngay
                    <span className="text-[10px] opacity-80">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="weights-config__back-button flex w-full items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] transition-all"
                  >
                    <span className="text-[10px]">←</span>
                    Quay lại
                  </button>

                  {validationErrorWeights && (
                    <div className="weights-config__error flex items-start gap-2 p-2">
                      <div className="weights-config__error-bar h-full w-[2px] shrink-0" />
                      <p className="text-[10px] font-medium leading-relaxed text-red-300">{validationErrorWeights}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

WeightsConfig.displayName = 'WeightsConfig';

export default WeightsConfig;
