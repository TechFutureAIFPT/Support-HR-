import React, { useEffect, useMemo, useState } from 'react';
import type { AnalysisFeedbackAction, AnalysisFeedbackDraft, AnalysisFeedbackRecord } from '@/shared/types';

interface AIFeedbackFormProps {
  candidateId: string;
  candidateName: string;
  aiScore: number;
  initialFeedback?: AnalysisFeedbackRecord | null;
  isSubmitting?: boolean;
  submitError?: string | null;
  submitSuccessMessage?: string | null;
  onSubmit: (feedback: AnalysisFeedbackDraft) => void | Promise<void>;
  onCancel: () => void;
}

const FEEDBACK_CRITERIA = [
  'Ky nang chuyen mon can xem lai',
  'Kinh nghiem thuc te chua sat',
  'Du an thuc te can danh gia sau hon',
  'Ky nang mem va giao tiep',
  'Hoc van, chung chi hoac ngoai ngu',
];

const ACTION_OPTIONS: Array<{
  value: AnalysisFeedbackAction;
  label: string;
  description: string;
  tone: string;
}> = [
  {
    value: 'shortlist',
    label: 'Shortlist',
    description: 'Ung vien dat muc de dua vao danh sach can nhac tiep.',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  {
    value: 'interview',
    label: 'Phong van',
    description: 'Nen moi phong van de xac nhan them nang luc va fit van hoa.',
    tone: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
  {
    value: 'hire',
    label: 'De xuat tuyen',
    description: 'Ung vien rat manh, co the day nhanh sang buoc offer.',
    tone: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  },
  {
    value: 'reject',
    label: 'Loai',
    description: 'Khong phu hop o thoi diem hien tai hoac chua dat muc toi thieu.',
    tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
];

function readSelectedCriteria(initialFeedback?: AnalysisFeedbackRecord | null): string[] {
  const raw = initialFeedback?.metadata?.selectedCriteria;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

const AIFeedbackForm: React.FC<AIFeedbackFormProps> = ({
  candidateId,
  candidateName,
  aiScore,
  initialFeedback,
  isSubmitting = false,
  submitError,
  submitSuccessMessage,
  onSubmit,
  onCancel,
}) => {
  const [finalScore, setFinalScore] = useState<number>(Math.round(aiScore));
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [action, setAction] = useState<AnalysisFeedbackAction | null>(null);

  useEffect(() => {
    setFinalScore(Math.round(initialFeedback?.finalScore ?? aiScore));
    setSelectedCriteria(readSelectedCriteria(initialFeedback));
    setNotes(initialFeedback?.notes || '');
    setAction(initialFeedback?.action || null);
  }, [candidateId, aiScore, initialFeedback]);

  const scoreDifference = useMemo(
    () => finalScore - aiScore,
    [finalScore, aiScore]
  );

  const derivedReason = useMemo(() => {
    if (selectedCriteria.length > 0) return selectedCriteria.join(' | ');
    if (notes.trim()) return notes.trim();
    if (action) {
      return ACTION_OPTIONS.find((option) => option.value === action)?.label || action;
    }
    return 'Feedback tu recruiter';
  }, [action, notes, selectedCriteria]);

  const handleCriteriaChange = (criterion: string) => {
    setSelectedCriteria((previous) => (
      previous.includes(criterion)
        ? previous.filter((item) => item !== criterion)
        : [...previous, criterion]
    ));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!action) {
      window.alert('Vui long chon ket qua danh gia cho ung vien.');
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
    };

    await onSubmit(feedback);
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/60 bg-[#11213A] p-6 shadow-xl shadow-black/20">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <i className="fa-solid fa-brain text-sm text-rose-400"></i>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100">Feedback recruiter cho AI</h4>
          <p className="text-xs text-slate-500">
            Dang danh gia: <span className="font-semibold text-slate-300">{candidateName}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Diem danh gia cuoi
              </label>
              <div className="text-[11px] text-slate-500">
                AI: <span className="font-semibold text-slate-300">{aiScore.toFixed(1)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={finalScore}
                onChange={(event) => setFinalScore(Number(event.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="w-16 shrink-0 rounded-xl border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-center">
                <span className="text-lg font-bold text-slate-100">{finalScore}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Do lech:
              <span className={`ml-2 font-semibold ${scoreDifference > 0 ? 'text-emerald-400' : scoreDifference < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {scoreDifference > 0 ? '+' : ''}{scoreDifference}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Ket qua recruiter
            </label>
            <div className="mt-3 grid gap-2">
              {ACTION_OPTIONS.map((option) => {
                const isActive = action === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAction(option.value)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      isActive
                        ? option.tone
                        : 'border-slate-800/60 bg-slate-900/20 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-sm font-bold">{option.label}</div>
                    <div className="mt-1 text-[11px] leading-relaxed opacity-80">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tieu chi can AI hoc lai
          </label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {FEEDBACK_CRITERIA.map((criterion) => (
              <label
                key={criterion}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 transition hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-700 bg-transparent accent-rose-500"
                  checked={selectedCriteria.includes(criterion)}
                  onChange={() => handleCriteriaChange(criterion)}
                />
                <span className="text-xs leading-snug text-slate-300">{criterion}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Ghi chu chi tiet
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-rose-500/40 focus:bg-[#11213A] focus:ring-1 focus:ring-rose-500/40"
            placeholder="Vi du: diem AI hoi cao vi ung vien co ghi nhieu keyword nhung kinh nghiem trien khai thuc te chua sau..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <p className="text-[11px] leading-relaxed text-slate-500">
            Backend se luu action, diem cuoi, ly do tong hop va ghi chu nay de dung cho evaluation ve sau.
          </p>
        </div>

        {submitError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </div>
        ) : null}

        {submitSuccessMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {submitSuccessMessage}
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-3 border-t border-slate-800/60 pt-4 md:flex-row md:items-center">
          <div className="text-xs text-slate-500">
            {initialFeedback?.updatedAt
              ? `Feedback nay da tung duoc cap nhat truoc do. Ban co the sua lai va gui de overwrite document hien tai.`
              : 'Feedback moi se duoc gan vao candidate va phien phan tich hien tai.'}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-800/60 px-5 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            >
              Huy
            </button>
            <button
              type="submit"
              className="rounded-xl border border-rose-500 bg-rose-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !action}
            >
              {isSubmitting ? 'Dang luu...' : initialFeedback ? 'Cap nhat feedback' : 'Gui feedback'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AIFeedbackForm;
