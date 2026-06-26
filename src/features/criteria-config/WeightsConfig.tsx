import React, { memo, useCallback, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WeightCriteria, MainCriterion } from '@/types';
import WeightTile from '@/components/config/WeightTile';
import TotalWeightDisplay from '@/components/config/TotalWeightDisplay';
import { useThemeColors } from '@/hooks/useThemeColors';
import '@/features/criteria-config/styles/weights-config.css';

interface WeightsConfigProps {
  weights: WeightCriteria;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  onComplete: () => void;
}

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
};

const WeightsConfig: React.FC<WeightsConfigProps> = memo(({ weights, setWeights, onComplete }) => {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);
  const [validationErrorWeights, setValidationErrorWeights] = useState<string | null>(null);

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

  const handleWeightsComplete = useCallback(() => {
    setValidationErrorWeights(null);
    if (totalWeight !== 100) {
      setValidationErrorWeights('Tổng trọng số phải bằng 100% trước khi tiếp tục.');
      return;
    }
    onComplete();
  }, [onComplete, totalWeight]);

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

      {/* Navigation bar */}
      <div className="relative z-10 shrink-0 border-b border-blue-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-end gap-3">
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
        </div>

        {validationErrorWeights && (
          <p className="mt-2 text-center text-[10px] font-medium text-red-500">
            {validationErrorWeights}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="relative z-10 shrink-0 border-b border-blue-50 bg-slate-50/80 px-4 py-2">
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
      </div>

      {/* Main scrollable content */}
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        <div className="custom-scrollbar h-full overflow-y-auto">
          <div className="w-full p-3 pb-6 md:p-4 md:pb-8 lg:p-5">
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
          </div>
        </div>
      </div>
    </section>
  );
});

WeightsConfig.displayName = 'WeightsConfig';

export default WeightsConfig;
