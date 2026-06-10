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
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'shortlist',
    label: 'Đưa vào danh sách đề cử',
    shortLabel: 'Đề cử',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: ClipboardList,
  },
  {
    value: 'interview',
    label: 'Mời phỏng vấn',
    shortLabel: 'Phỏng vấn',
    tone: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: MessageSquareText,
  },
  {
    value: 'hire',
    label: 'Đề xuất tuyển',
    shortLabel: 'Đề xuất',
    tone: 'border-violet-200 bg-violet-50 text-violet-700',
    icon: Trophy,
  },
  {
    value: 'reject',
    label: 'Từ chối',
    shortLabel: 'Từ chối',
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: CircleOff,
  },
];

const REUSE_OPTIONS = [
  { value: false, title: 'Chỉ CV này' },
  { value: true, title: 'Dùng lại cho CV tương tự' },
];

const panelClass = 'rounded-2xl border border-blue-100 bg-white shadow-[0_18px_48px_rgba(30,64,175,0.08)]';
const insetClass = 'rounded-xl border border-blue-100 bg-[#f6f9ff]';

function readSelectedCriteria(initialFeedback?: AnalysisFeedbackRecord | null): string[] {
  const raw = initialFeedback?.metadata?.selectedCriteria;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function readIsReusableGuidance(initialFeedback?: AnalysisFeedbackRecord | null): boolean {
  if (typeof initialFeedback?.isReusableGuidance === 'boolean') {
    return initialFeedback.isReusableGuidance;
  }

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

function getSeverityMeta(severity: AnalysisFeedbackSeverity): {
  label: string;
  className: string;
} {
  if (severity === 'high') {
    return {
      label: 'Mức cao',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (severity === 'medium') {
    return {
      label: 'Mức trung bình',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Mức nhẹ',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  };
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
    if (currentStep === 'decision') {
      onCancel();
      return;
    }
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

  const renderStepContent = () => {
    if (currentStep === 'decision') {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {ACTION_OPTIONS.map((option) => {
            const isActive = action === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setAction(option.value);
                  setFormNotice(null);
                }}
                className={`border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? option.tone
                    : 'border-blue-100 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center border ${
                    isActive
                      ? 'border-current/25 bg-white/65'
                      : 'border-blue-100 bg-[#f6f9ff] text-slate-500'
                  }`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{option.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-65">{option.shortLabel}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentStep === 'score') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className={`${panelClass} p-4`}>
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-blue-600">Điểm chốt</p>
              <h3 className="mt-3 text-[2.5rem] font-bold leading-none text-slate-900">{finalScore}</h3>

              <div className={`${insetClass} mt-5 px-4 py-4`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={finalScore}
                  onChange={(event) => setFinalScore(Number(event.target.value))}
                  className="w-full accent-blue-600"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>
                    AI: <strong className="text-slate-900">{aiScore.toFixed(1)}</strong>
                  </span>
                  <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>
                    Recruiter: <strong className="text-slate-900">{finalScore}</strong>
                  </span>
                  <span className={`${insetClass} px-3 py-1.5 text-sm font-semibold ${scoreDifference > 0 ? 'text-emerald-700' : scoreDifference < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                    Độ lệch: {scoreDifference > 0 ? '+' : ''}{scoreDifference.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`${panelClass} flex min-w-[160px] flex-col justify-center px-5 py-4 text-right`}>
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Hạng hiện tại</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{candidateRank || 'C'}</p>
            </div>
          </div>

          <div className={`border px-4 py-3 ${severityMeta.className}`}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span className="text-sm font-semibold">{severityMeta.label}</span>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 'scope') {
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {REUSE_OPTIONS.map((option) => {
              const isActive = isReusableGuidance === option.value;

              return (
                <button
                  key={option.title}
                  type="button"
                  onClick={() => setIsReusableGuidance(option.value)}
                  className={`border px-4 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-blue-100 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-[#f6f9ff] text-blue-600">
                      <Lightbulb className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-sm font-semibold">{option.title}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {FEEDBACK_CRITERIA.map((criterion) => (
              <label
                key={criterion}
                className={`flex cursor-pointer items-start gap-3 border p-3 transition-all ${
                  selectedCriteria.includes(criterion)
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-blue-200 bg-white accent-blue-600"
                  checked={selectedCriteria.includes(criterion)}
                  onChange={() => handleCriteriaChange(criterion)}
                />
                <span className="text-sm leading-6 text-slate-700">{criterion}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className={`${panelClass} p-4`}>
          <div className="flex flex-wrap gap-2">
            {selectedActionOption ? (
              <span className={`border px-3 py-1.5 text-sm font-semibold ${selectedActionOption.tone}`}>
                {selectedActionOption.label}
              </span>
            ) : null}
            <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>
              Điểm: <strong className="text-slate-900">{finalScore}</strong>
            </span>
            <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>
              Phạm vi: <strong className="text-slate-900">{isReusableGuidance ? 'Dùng lại' : 'Riêng CV này'}</strong>
            </span>
          </div>

          <textarea
            className="mt-4 min-h-[140px] w-full rounded-xl border border-blue-100 bg-[#f6f9ff] p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="Ghi chú ngắn về lý do chốt kết quả này"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {formNotice ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{formNotice}</span>
          </div>
        ) : null}

        {submitError ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`${panelClass} p-4 md:p-5`}>
      <div className="flex flex-col gap-4 border-b border-blue-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-blue-600">
                Phản hồi quy trình
              </p>
              <h2 className="text-lg font-bold text-slate-900">{displayCandidateName}</h2>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>{displayFileName}</span>
            <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>
              AI: <strong className="text-slate-900">{aiScore.toFixed(1)}</strong>
            </span>
            <span className={`${insetClass} px-3 py-1.5 text-sm text-slate-600`}>
              Hạng: <strong className="text-slate-900">{candidateRank || 'C'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
                className={`supporthr-mono inline-flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-100 bg-white text-slate-500'
                }`}
              >
                <span className="text-slate-500">{index + 1}</span>
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-4">{renderStepContent()}</div>

      <div className="flex flex-col justify-between gap-3 border-t border-blue-100 pt-4 md:flex-row md:items-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 'decision' ? 'Về overview' : 'Quay lại'}
        </button>

        {currentStep !== 'note' ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStep === 'decision' && !action}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(35,136,255,0.18)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tiếp tục
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !action}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(35,136,255,0.18)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Đang lưu...' : initialFeedback ? 'Cập nhật phản hồi' : 'Lưu phản hồi'}
          </button>
        )}
      </div>
    </form>
  );
}
