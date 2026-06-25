import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  ClipboardList,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type {
  AnalysisFeedbackAction,
  AnalysisFeedbackDraft,
  AnalysisFeedbackRecord,
  AnalysisFeedbackSeverity,
} from '@/types';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

type FeedbackStep = 'decision' | 'score' | 'scope' | 'note';

interface AIFeedbackFormProps {
  candidateId: string;
  candidateName: string;
  fileName: string;
  aiScore: number;
  candidateRank?: string;
  initialFeedback?: AnalysisFeedbackRecord | null;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (feedback: AnalysisFeedbackDraft) => void | Promise<void>;
  onCancel: () => void;
}

const HIGH_SEVERITY_SCORE_DELTA = 15;
const MEDIUM_SEVERITY_SCORE_DELTA = 8;
const FEEDBACK_STEPS: Array<{ key: FeedbackStep; label: string }> = [
  { key: 'decision', label: 'Quyết định' },
  { key: 'score', label: 'Điểm' },
  { key: 'scope', label: 'Phạm vi' },
  { key: 'note', label: 'Lưu' },
];

const FEEDBACK_CRITERIA = [
  'Kỹ năng chuyên môn',
  'Kinh nghiệm thực tế',
  'Dự án/KPI',
  'Giao tiếp & phối hợp',
  'Học vấn/chứng chỉ',
];

const ACTION_OPTIONS: Array<{
  value: AnalysisFeedbackAction;
  label: string;
  shortLabel: string;
  activeClass: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'shortlist',
    label: 'Đưa vào danh sách đề cử',
    shortLabel: 'Đề cử',
    activeClass: 'border-blue-300 bg-blue-50',
    iconBg: 'bg-blue-100 text-blue-700',
    icon: ClipboardList,
  },
  {
    value: 'interview',
    label: 'Mời phỏng vấn',
    shortLabel: 'Phỏng vấn',
    activeClass: 'border-sky-300 bg-sky-50',
    iconBg: 'bg-sky-100 text-sky-700',
    icon: MessageSquareText,
  },
  {
    value: 'hire',
    label: 'Đề xuất tuyển',
    shortLabel: 'Đề xuất',
    activeClass: 'border-violet-300 bg-violet-50',
    iconBg: 'bg-violet-100 text-violet-700',
    icon: Trophy,
  },
  {
    value: 'reject',
    label: 'Từ chối',
    shortLabel: 'Từ chối',
    activeClass: 'border-rose-300 bg-rose-50',
    iconBg: 'bg-rose-100 text-rose-700',
    icon: CircleOff,
  },
];

const REUSE_OPTIONS = [
  {
    value: false,
    title: 'Chỉ CV này',
    description: 'Phản hồi chỉ áp dụng cho ứng viên này',
    icon: Sparkles,
  },
  {
    value: true,
    title: 'Dùng lại cho CV tương tự',
    description: 'AI học từ phản hồi này cho các phiên sau',
    icon: RotateCcw,
  },
];

function readSelectedCriteria(initialFeedback?: AnalysisFeedbackRecord | null): string[] {
  const raw = initialFeedback?.metadata?.selectedCriteria;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item || '').trim()).filter(Boolean);
}

function readIsReusableGuidance(initialFeedback?: AnalysisFeedbackRecord | null): boolean {
  if (typeof initialFeedback?.isReusableGuidance === 'boolean') return initialFeedback.isReusableGuidance;
  const raw = initialFeedback?.metadata?.isReusableGuidance;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return initialFeedback?.metadata?.feedbackScope === 'reusable-guidance';
}

function deriveSeverity(scoreDifference: number): AnalysisFeedbackSeverity {
  const delta = Math.abs(scoreDifference);
  if (delta >= HIGH_SEVERITY_SCORE_DELTA) return 'high';
  if (delta >= MEDIUM_SEVERITY_SCORE_DELTA) return 'medium';
  return 'low';
}

function getSeverityMeta(severity: AnalysisFeedbackSeverity) {
  if (severity === 'high') return { label: 'Lệch cao', className: 'border-rose-200 bg-rose-50 text-rose-700' };
  if (severity === 'medium') return { label: 'Lệch trung bình', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'Lệch nhẹ', className: 'border-blue-200 bg-blue-50 text-blue-700' };
}

export default function AIFeedbackForm({
  candidateId,
  candidateName,
  fileName,
  aiScore,
  candidateRank,
  initialFeedback,
  isSubmitting = false,
  submitError,
  onSubmit,
  onCancel,
}: AIFeedbackFormProps) {
  const displayCandidateName = normalizeVietnameseDisplay(candidateName);
  const displayFileName = normalizeVietnameseDisplay(fileName);
  const [currentStep, setCurrentStep] = useState<FeedbackStep>('decision');
  const [finalScore, setFinalScore] = useState<number>(Math.round(aiScore));
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [action, setAction] = useState<AnalysisFeedbackAction | null>(null);
  const [isReusableGuidance, setIsReusableGuidance] = useState<boolean>(false);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep('decision');
    setFinalScore(Math.round(initialFeedback?.finalScore ?? aiScore));
    setSelectedCriteria(readSelectedCriteria(initialFeedback));
    setNotes(initialFeedback?.notes || '');
    setAction(initialFeedback?.action || null);
    setIsReusableGuidance(readIsReusableGuidance(initialFeedback));
    setFormNotice(null);
  }, [candidateId, aiScore, initialFeedback]);

  const scoreDifference = useMemo(() => finalScore - aiScore, [finalScore, aiScore]);
  const severity = useMemo<AnalysisFeedbackSeverity>(() => deriveSeverity(scoreDifference), [scoreDifference]);
  const severityMeta = useMemo(() => getSeverityMeta(severity), [severity]);
  const stepIndex = FEEDBACK_STEPS.findIndex((step) => step.key === currentStep);
  const selectedActionOption = ACTION_OPTIONS.find((option) => option.value === action) || null;

  const derivedReason = useMemo(() => {
    if (selectedCriteria.length > 0) return selectedCriteria.join(' | ');
    if (notes.trim()) return notes.trim();
    if (action) return ACTION_OPTIONS.find((option) => option.value === action)?.label || action;
    return 'Phản hồi từ nhà tuyển dụng';
  }, [action, notes, selectedCriteria]);

  const handleCriteriaChange = (criterion: string) => {
    setSelectedCriteria((previous) => (
      previous.includes(criterion)
        ? previous.filter((item) => item !== criterion)
        : [...previous, criterion]
    ));
  };

  const handleNext = () => {
    if (currentStep === 'decision' && !action) return;
    if (stepIndex >= FEEDBACK_STEPS.length - 1) return;
    setCurrentStep(FEEDBACK_STEPS[stepIndex + 1].key);
  };

  const handleBack = () => {
    if (currentStep === 'decision') { onCancel(); return; }
    setCurrentStep(FEEDBACK_STEPS[stepIndex - 1].key);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!action) {
      setFormNotice('Vui lòng chọn quyết định cho ứng viên trước khi lưu phản hồi.');
      setCurrentStep('decision');
      return;
    }
    const feedback: AnalysisFeedbackDraft = {
      candidateId,
      finalScore,
      scoreDifference,
      selectedCriteria,
      notes: notes.trim(),
      action,
      reason: derivedReason,
      isReusableGuidance,
    };
    await onSubmit(feedback);
  };

  /* ── Step content ────────────────────────────────────────── */
  const renderStepContent = () => {
    /* Step 1 — Decision */
    if (currentStep === 'decision') {
      return (
        <div className="grid gap-2.5 md:grid-cols-2">
          {ACTION_OPTIONS.map((option) => {
            const isActive = action === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { setAction(option.value); setFormNotice(null); }}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 hover:shadow-sm ${
                  isActive
                    ? option.activeClass
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive ? option.iconBg : 'bg-slate-100 text-slate-500'
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold leading-tight ${isActive ? '' : 'text-slate-800'}`}>
                    {option.label}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${isActive ? 'opacity-60' : 'text-slate-400'}`}>
                    {option.shortLabel}
                  </p>
                </div>
                {isActive && (
                  <CheckCircle2 className="ml-auto h-4.5 w-4.5 shrink-0 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      );
    }

    /* Step 2 — Score */
    if (currentStep === 'score') {
      const sliderPct = Math.round(finalScore);
      return (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
            {/* Score card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600 mb-3">Điểm chốt của bạn</p>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-[3rem] font-black leading-none tabular-nums text-slate-900">{finalScore}</span>
                <span className="text-[16px] font-bold text-slate-400">/ 100</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={finalScore}
                onChange={(event) => setFinalScore(Number(event.target.value))}
                className="w-full h-2 cursor-pointer appearance-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{
                  background: `linear-gradient(90deg, #2563eb ${sliderPct}%, #e2e8f0 ${sliderPct}%)`,
                }}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                  Điểm AI: <strong className="text-slate-900">{aiScore.toFixed(1)}</strong>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                  Recruiter: <strong className="text-slate-900">{finalScore}</strong>
                </div>
                <div className={`rounded-xl border px-3 py-2 text-[12px] font-semibold ${
                  scoreDifference > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : scoreDifference < 0 ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}>
                  Lệch: {scoreDifference > 0 ? '+' : ''}{scoreDifference.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Rank card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">Hạng</p>
              <p className="text-[2.8rem] font-black leading-none text-slate-900">{candidateRank || 'C'}</p>
            </div>
          </div>

          {/* Severity badge */}
          <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-[13px] font-semibold ${severityMeta.className}`}>
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {severityMeta.label}
          </div>
        </div>
      );
    }

    /* Step 3 — Scope */
    if (currentStep === 'scope') {
      return (
        <div className="space-y-4">
          {/* Reuse options */}
          <div className="grid gap-2.5 md:grid-cols-2">
            {REUSE_OPTIONS.map((option) => {
              const isActive = isReusableGuidance === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.title}
                  type="button"
                  onClick={() => setIsReusableGuidance(option.value)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150 ${
                    isActive
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-bold leading-tight ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>
                      {option.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{option.description}</p>
                  </div>
                  {isActive && <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Criteria checkboxes */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Tiêu chí liên quan (tuỳ chọn)
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {FEEDBACK_CRITERIA.map((criterion) => {
                const isChecked = selectedCriteria.includes(criterion);
                return (
                  <label
                    key={criterion}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      isChecked
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isChecked ? 'border-blue-500 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => handleCriteriaChange(criterion)}
                    />
                    <span className={`text-[13px] leading-none ${isChecked ? 'font-semibold text-blue-800' : 'text-slate-700'}`}>
                      {criterion}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    /* Step 4 — Note */
    return (
      <div className="space-y-3">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          {selectedActionOption && (
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
              selectedActionOption.activeClass
            }`}>
              <selectedActionOption.icon className="h-3 w-3" />
              {selectedActionOption.label}
            </span>
          )}
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600">
            Điểm chốt: <strong className="text-slate-900">{finalScore}</strong>
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600">
            {isReusableGuidance ? 'Dùng lại' : 'Riêng CV này'}
          </span>
          {selectedCriteria.length > 0 && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] text-blue-700">
              {selectedCriteria.length} tiêu chí
            </span>
          )}
        </div>

        {/* Notes textarea */}
        <textarea
          className="min-h-[130px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-[14px] leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none"
          placeholder="Ghi chú ngắn về lý do chốt kết quả này (tuỳ chọn)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {/* Notices */}
        {formNotice && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formNotice}</span>
          </div>
        )}
        {submitError && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Form header + step navigation */}
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Phản hồi quy trình</p>
            <h2 className="text-[15px] font-bold text-slate-900 truncate">{displayCandidateName}</h2>
          </div>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FEEDBACK_STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isDone = index < stepIndex;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => {
                  if (index <= stepIndex || (step.key === 'score' && action) || step.key === 'scope' || step.key === 'note') {
                    setCurrentStep(step.key);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'border-blue-300 bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center rounded-full text-[9px] font-black bg-white/20">
                    {index + 1}
                  </span>
                )}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="px-5 py-5">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 md:flex-row md:items-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 'decision' ? 'Về overview' : 'Quay lại'}
        </button>

        {currentStep !== 'note' ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStep === 'decision' && !action}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tiếp tục
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !action}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Đang lưu…' : initialFeedback ? 'Cập nhật phản hồi' : 'Lưu phản hồi'}
          </button>
        )}
      </div>
    </form>
  );
}
