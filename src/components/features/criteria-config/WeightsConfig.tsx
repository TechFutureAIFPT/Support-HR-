import React, { useMemo, useState, useCallback, memo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { HardFilters, WeightCriteria, MainCriterion } from '@/assets/types';
import HardFilterPanel from '@/components/ui/config/HardFilterPanel';
import WeightTile from '@/components/ui/config/WeightTile';
import TotalWeightDisplay from '@/components/ui/config/TotalWeightDisplay';
import { useThemeColors } from '@/components/ui/theme/useThemeColors';

interface WeightsConfigProps {
  weights: WeightCriteria;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
}

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
        tone: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: CheckCircle2,
        color: '#10b981',
        glow: 'shadow-emerald-500/20',
      };
    }
    if (totalWeight > 100) {
      return {
        label: 'Vượt ngưỡng',
        desc: `Thừa ${Math.abs(remainingWeight)}%`,
        tone: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/30',
        icon: AlertTriangle,
        color: '#ef4444',
        glow: 'shadow-red-500/20',
      };
    }
    return {
      label: 'Chưa đủ',
      desc: `Thiếu ${Math.abs(remainingWeight)}%`,
      tone: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: AlertTriangle,
      color: '#f59e0b',
      glow: 'shadow-amber-500/20',
    };
  }, [remainingWeight, totalWeight]);

  const primaryCriteria = useMemo(() => {
    return Object.values(weights).filter((c: MainCriterion) => c.children) as MainCriterion[];
  }, [weights]);

  const validateFilters = useCallback((): boolean => {
    setValidationErrorFilters(null);
    const mandatoryFieldsForValidation = [
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
    ];
    const invalidField = mandatoryFieldsForValidation.find(field => {
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
  }, [totalWeight, onComplete]);

  const mandatoryProgress = useMemo(() => {
    const keys = Object.keys(hardFilters).filter(k => k.endsWith('Mandatory')) as Array<keyof HardFilters>;
    const active = keys.filter(k => hardFilters[k]).length;
    const fulfilled = keys.filter(k => {
      if (!hardFilters[k]) return false;
      const valKey = k.replace('Mandatory', '') as keyof HardFilters;
      const val = hardFilters[valKey];
      return typeof val === 'string' ? val.trim().length > 0 : Boolean(val);
    }).length;
    return { active, fulfilled, percent: active ? Math.round((fulfilled / active) * 100) : 0 };
  }, [hardFilters]);

  const STEPS = [
    { num: 1, label: 'Bộ lọc cứng', color: '#6366f1', bg: 'from-indigo-500/15 to-indigo-600/10' },
    { num: 2, label: 'Phân bổ trọng số', color: '#8b5cf6', bg: 'from-violet-500/15 to-violet-600/10' },
  ];

  const tc = useThemeColors();

  return (
    <section id="module-weights" className={`module-pane active relative w-full h-[calc(100vh)] min-h-[400px] flex flex-col`} style={{ background: tc.pageBg }}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 -full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 -full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 -full bg-violet-500/3 blur-3xl pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="shrink-0 border-b flex flex-col md:flex-row md:items-center justify-between px-4 py-3 gap-3"
        style={{
          background: tc.headerBg,
          borderColor: 'rgba(99,102,241,0.18)',
        }}
      >
        {/* Dòng 1: Logo + Tiêu đề */}
        <div className="flex items-center gap-3">
          {/* Accent bar */}
          <div
            className="h-8 w-[3px] rounded-full shrink-0"
            style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
          />

          <div className="min-w-0 flex-1">
            <h1
              className="text-base font-bold leading-tight tracking-tight"
              style={{ color: tc.textPrimary }}
            >
              Phân bổ trọng số & Bộ lọc
            </h1>
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5"
              style={{ color: tc.textAccent }}
            >
              Weight Configuration & Hard Filters
            </p>
          </div>
        </div>

        {/* Dòng 2: Step indicator (Moved up) */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => { if (validateFilters() || s.num === 2) setStep(s.num as 1 | 2); }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap"
                  style={
                    isActive
                      ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', color: tc.textSecondary, boxShadow: '0 4px 20px -5px rgba(99,102,241,0.25)' }
                      : isDone
                        ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }
                        : { background: tc.cardBg2, border: tc.borderCard, color: tc.textDim }
                  }
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                    style={
                      isActive
                        ? { background: 'rgba(99,102,241,0.25)', color: '#818cf8' }
                        : isDone
                          ? { background: 'rgba(16,185,129,0.2)', color: '#34d399' }
                          : { background: tc.cardBg2, color: tc.textDim }
                    }
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-px w-4 md:w-8 shrink-0"
                    style={{ background: step > s.num ? 'rgba(16,185,129,0.4)' : (tc.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.1)') }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10 w-full">
        {/* Left Column: Scrolling Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full p-5 lg:p-8">
            {step === 1 ? (
              <HardFilterPanel hardFilters={hardFilters} setHardFilters={setHardFilters} />
            ) : (
              <div className="space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-8 w-[3px] -full shrink-0"
                    style={{ background: 'linear-gradient(180deg, #8b5cf6, #6366f1)' }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">Phân bổ trọng số cho từng tiêu chí</h3>
                    <p className="text-[11px] text-slate-500">Kéo thanh trượt hoặc nhập số để điều chỉnh mức độ quan trọng</p>
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

        {/* Right Column: Fixed Controls & Info */}
        <div className={`w-[340px] lg:w-[400px] shrink-0 border-l flex flex-col h-full relative z-10 backdrop-blur-xl`} style={{ borderColor: tc.borderColor, background: tc.isDark ? 'linear-gradient(180deg, rgba(17,33,58,0.95), rgba(11,25,44,0.95))' : 'linear-gradient(180deg, rgba(248,250,255,0.98), rgba(240,244,255,0.95))', boxShadow: tc.isDark ? '-10px 0 40px -20px rgba(0,0,0,0.3)' : '-10px 0 40px -20px rgba(99,102,241,0.06)' }}>
          <div className="flex flex-col flex-1 h-full overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <>
                <div className="p-4 lg:p-5">
                  {/* Progress card */}
                  <div className=" border mb-3 p-4 relative overflow-hidden" style={{ background: tc.headerBg, borderColor: 'rgba(99,102,241,0.15)' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/8 -full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />

                    <h4 className="flex items-center gap-2 text-[10px] font-bold mb-3 uppercase tracking-[0.2em] text-white relative z-10">
                      <div
                        className="h-6 w-[2px] -full shrink-0"
                        style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                      />
                      Tiến trình bộ lọc
                    </h4>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className=" p-3 flex flex-col justify-center items-center relative overflow-hidden" style={{ background: tc.cardBg2, border: tc.border }}>
                        <span className="text-2xl font-black text-white mb-0.5 tracking-tighter">{mandatoryProgress.active}</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">Đã bật</span>
                      </div>
                      <div className=" p-3 flex flex-col justify-center items-center relative overflow-hidden" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <span className="text-2xl font-black mb-0.5 tracking-tighter" style={{ color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.4)' }}>{mandatoryProgress.fulfilled}</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: '#34d399' }}>Hợp lệ</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 p-2.5 relative" style={{ background: tc.cardBg, border: tc.borderSoft }}>
                      <div className="flex justify-between text-[10px] font-bold tracking-[0.15em]">
                        <span className="uppercase" style={{ color: tc.textMuted }}>Hoàn tất</span>
                        <span style={{ color: '#818cf8', textShadow: '0 0 10px rgba(99,102,241,0.4)' }}>{mandatoryProgress.percent}%</span>
                      </div>
                      <div className="h-2 -full overflow-hidden relative" style={{ background: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)', border: tc.borderSoft }}>
                        <div className="h-full transition-all duration-700 ease-out flex justify-end relative" style={{ width: `${mandatoryProgress.percent}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)', boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}>
                          <div className="absolute top-0 right-0 w-6 h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))', filter: 'blur(2px)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info card */}
                  <div className="flex items-start gap-2.5 p-3 relative overflow-hidden" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div className="h-full w-[2px] -full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                    <div>
                      <p className="text-[11px] leading-relaxed font-medium text-slate-300">
                        Tiêu chí được bật <strong className="text-white font-bold">"Bắt buộc"</strong> nhưng chưa điền giá trị sẽ bị <strong className="text-white font-bold">bỏ qua</strong> khi AI phân tích.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="mt-auto p-3 lg:p-4 space-y-2" style={{ borderTop: tc.borderSoft }}>
                  <button
                    onClick={handleFiltersComplete}
                    className="w-full py-2.5 rounded-lg text-white font-bold text-[11px] transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      boxShadow: '0 4px 15px -4px rgba(99,102,241,0.3)',
                    }}
                  >
                    Tiếp tục phân bổ trọng số
                    <span className="text-[10px] opacity-80">→</span>
                  </button>

                  {validationErrorFilters && (
                    <div className="p-2 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="h-full w-[2px] -full shrink-0" style={{ background: '#ef4444' }} />
                      <p className="text-[10px] font-medium leading-relaxed text-red-300">{validationErrorFilters}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-4 lg:p-5">
                  {/* Weight display */}
                  <div className=" border mb-3 p-4 relative overflow-hidden" style={{ background: tc.headerBg, borderColor: 'rgba(99,102,241,0.15)' }}>
                    <div className={`absolute top-0 right-0 w-40 h-40 -full blur-3xl -translate-y-1/2 translate-x-1/4 transition-colors duration-700 pointer-events-none ${totalWeight === 100 ? 'bg-emerald-500/10' : totalWeight > 100 ? 'bg-red-500/10' : 'bg-amber-500/10'}`} />

                    <h4 className="flex items-center gap-2 text-[10px] font-bold mb-3 uppercase tracking-[0.2em] text-white relative z-10">
                      <div
                        className="h-6 w-[2px] -full shrink-0"
                        style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                      />
                      Tổng trọng số
                    </h4>

                    {/* Big number display */}
                    <div className=" p-3 flex flex-col justify-center items-center relative overflow-hidden mb-3" style={{ background: tc.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(99,102,241,0.03)', border: tc.border }}>
                      <div className="flex items-baseline gap-1 relative z-10 transition-transform duration-500">
                        <span className="text-4xl font-black tracking-tighter transition-all duration-500" style={{
                          color: tc.textPrimary,
                          textShadow: totalWeight === 100 ? '0 0 20px rgba(16,185,129,0.3)' : totalWeight > 100 ? '0 0 20px rgba(244,63,94,0.3)' : '0 0 20px rgba(245,158,11,0.3)'
                        }}>
                          {totalWeight}
                        </span>
                        <span className="text-lg font-bold transition-colors duration-500" style={{
                          color: totalWeight === 100 ? '#6ee7b7' : totalWeight > 100 ? '#fda4af' : '#fcd34d'
                        }}>%</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] relative z-10 px-3 py-1 -full transition-all duration-500" style={
                        totalWeight === 100
                          ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }
                          : totalWeight > 100
                            ? { background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af' }
                            : { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }
                      }>
                        {weightStatus.label} · {weightStatus.desc}
                      </div>
                    </div>

                    <TotalWeightDisplay totalWeight={totalWeight} />
                  </div>

                  {/* Mini criteria summary */}
                  <div className="space-y-1.5">
                    {primaryCriteria.slice(0, 4).map(c => {
                      const subTotal = c.children?.reduce((s, ch) => s + ch.weight, 0) || 0;
                      const pct = Math.round(subTotal);
                      return (
                        <div key={c.key} className="flex items-center gap-2 p-1.5 px-2" style={{ background: tc.cardBg, border: tc.border }}>
                          <div className="h-5 w-[2px] -full overflow-hidden flex-shrink-0" style={{ background: pct >= 30 ? '#10b981' : pct >= 15 ? '#3b82f6' : '#f59e0b' }} />
                          <span className="text-[10px] font-medium flex-1 truncate" style={{ color: tc.textSecondary }}>{c.name}</span>
                          <span className="text-[10px] font-bold" style={{ color: tc.textMuted }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="mt-auto p-3 lg:p-4 space-y-2" style={{ borderTop: tc.borderSoft }}>
                  <button
                    onClick={handleWeightsComplete}
                    disabled={totalWeight !== 100}
                    className="w-full py-2.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-2"
                    style={
                      totalWeight === 100
                        ? { background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid rgba(16,185,129,0.35)', color: '#fff', boxShadow: '0 4px 15px -4px rgba(16,185,129,0.3)' }
                        : { background: tc.cardBg2, border: tc.borderCard, color: tc.textDim, cursor: 'not-allowed' }
                    }
                  >
                    Hoàn tất & Phân tích ngay
                    <span className="text-[10px] opacity-80">→</span>
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] transition-all "
                    style={{ color: tc.textDim, border: '1px solid transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = tc.textMuted; (e.currentTarget as HTMLElement).style.background = tc.cardBg2; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = tc.textDim; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="text-[10px]">←</span>
                    Quay lại
                  </button>

                  {validationErrorWeights && (
                    <div className="p-2 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="h-full w-[2px] -full shrink-0" style={{ background: '#ef4444' }} />
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





