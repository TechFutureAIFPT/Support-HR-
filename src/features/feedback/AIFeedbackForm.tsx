import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CircleOff, ClipboardList, MessageSquareText, Sparkles, Trophy } from 'lucide-react';
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
  'Kỹ năng chuyên môn cần xem lại',
  'Kinh nghiệm thực tế chưa sát yêu cầu',
  'Dự án thực tế cần đánh giá sâu hơn',
  'Kỹ năng mềm và giao tiếp',
  'Học vấn, chứng chỉ hoặc ngoại ngữ',
];

const ACTION_OPTIONS: Array<{
  value: AnalysisFeedbackAction;
  label: string;
  description: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'shortlist',
    label: 'Đưa vào shortlist',
    description: 'Ứng viên phù hợp để tiếp tục theo dõi hoặc so sánh với nhóm top đầu.',
    tone: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.12)]',
    icon: ClipboardList,
  },
  {
    value: 'interview',
    label: 'Mời phỏng vấn',
    description: 'Nên bước sang vòng trao đổi để kiểm chứng thêm năng lực và độ phù hợp.',
    tone: 'border-sky-400/35 bg-sky-400/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]',
    icon: MessageSquareText,
  },
  {
    value: 'hire',
    label: 'Đề xuất tuyển',
    description: 'Ứng viên rất mạnh, có thể ưu tiên sang bước chốt offer hoặc đàm phán.',
    tone: 'border-violet-400/35 bg-violet-400/10 text-violet-100 shadow-[0_0_0_1px_rgba(167,139,250,0.14)]',
    icon: Trophy,
  },
  {
    value: 'reject',
    label: 'Từ chối',
    description: 'Chưa phù hợp ở thời điểm hiện tại hoặc chưa đạt ngưỡng tối thiểu của vị trí.',
    tone: 'border-rose-400/35 bg-rose-400/10 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.14)]',
    icon: CircleOff,
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
    return 'Phản hồi từ recruiter';
  }, [action, notes, selectedCriteria]);

  const scoreDeltaClassName = scoreDifference > 0
    ? 'text-emerald-300'
    : scoreDifference < 0
      ? 'text-rose-300'
      : 'text-slate-200';

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
      window.alert('Vui lòng chọn kết quả đánh giá cho ứng viên.');
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
    <div className="rounded-[28px] border border-slate-800/80 bg-[#091427] p-5 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.82)] md:p-6">
      <div className="mb-6 flex items-start gap-4 border-b border-slate-800/70 pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/10">
          <Sparkles className="h-5 w-5 text-sky-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">Phản hồi đánh giá AI</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Bạn đang hiệu chỉnh kết quả cho <span className="font-semibold text-slate-200">{candidateName}</span>.
            Các thay đổi dưới đây sẽ được lưu cùng phiên phân tích hiện tại.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[24px] border border-slate-800/70 bg-slate-950/30 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Điểm hiệu chỉnh cuối cùng
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">{finalScore} điểm</h3>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Điểm AI gốc</p>
                <p className="text-lg font-bold text-slate-100">{aiScore.toFixed(1)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-slate-800/70 bg-[#081120] px-4 py-4">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={finalScore}
                onChange={(event) => setFinalScore(Number(event.target.value))}
                className="w-full accent-sky-400"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-slate-300">
                  AI gốc: <strong className="font-semibold text-white">{aiScore.toFixed(1)}</strong>
                </span>
                <span className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-slate-300">
                  Recruiter chốt: <strong className="font-semibold text-white">{finalScore}</strong>
                </span>
                <span className={`rounded-full border border-transparent bg-slate-900/70 px-3 py-1.5 font-semibold ${scoreDeltaClassName}`}>
                  Độ lệch: {scoreDifference > 0 ? '+' : ''}{scoreDifference}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Điều chỉnh điểm số khi bạn thấy AI đang chấm quá cao, quá thấp hoặc chưa phản ánh đúng mức độ phù hợp.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-800/70 bg-slate-950/30 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70">
                <ClipboardList className="h-4.5 w-4.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Quyết định của recruiter
                </p>
                <p className="mt-1 text-sm text-slate-500">Chọn một trạng thái chính cho ứng viên này.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5">
              {ACTION_OPTIONS.map((option) => {
                const isActive = action === option.value;
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAction(option.value)}
                    className={`rounded-[20px] border px-4 py-3.5 text-left transition-all duration-200 ${
                      isActive
                        ? option.tone
                        : 'border-slate-800/70 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${
                        isActive
                          ? 'border-current/20 bg-black/10'
                          : 'border-slate-800/70 bg-slate-950/60 text-slate-400'
                      }`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{option.label}</div>
                        <div className="mt-1 text-xs leading-5 opacity-85">{option.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-[24px] border border-slate-800/70 bg-slate-950/30 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70">
              <CheckCircle2 className="h-4.5 w-4.5 text-slate-300" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tiêu chí cần AI học lại
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Chọn các điểm mà bạn muốn lưu lại để phục vụ việc review hoặc evaluation sau này.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {FEEDBACK_CRITERIA.map((criterion) => (
              <label
                key={criterion}
                className={`flex cursor-pointer items-start gap-3 rounded-[20px] border p-3.5 transition-all ${
                  selectedCriteria.includes(criterion)
                    ? 'border-sky-400/30 bg-sky-400/10'
                    : 'border-slate-800/70 bg-slate-900/25 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-700 bg-transparent accent-sky-400"
                  checked={selectedCriteria.includes(criterion)}
                  onChange={() => handleCriteriaChange(criterion)}
                />
                <span className="text-sm leading-6 text-slate-200">{criterion}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-800/70 bg-slate-950/30 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70">
              <MessageSquareText className="h-4.5 w-4.5 text-slate-300" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Ghi chú chi tiết
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Mô tả ngắn gọn vì sao bạn thay đổi điểm hoặc quyết định hiện tại của recruiter.
              </p>
            </div>
          </div>

          <textarea
            className="mt-4 min-h-[140px] w-full rounded-[22px] border border-slate-800/70 bg-[#081120] p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/30"
            placeholder="Ví dụ: Ứng viên có từ khóa khá tốt nhưng kinh nghiệm triển khai thực tế ở môi trường production còn mỏng, cần kiểm chứng thêm ở vòng phỏng vấn."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Hệ thống sẽ lưu lại quyết định, điểm số cuối cùng, lý do tổng hợp và ghi chú này cho mục đích đánh giá nội bộ.
          </p>
        </section>

        {submitError ? (
          <div className="flex items-start gap-3 rounded-[20px] border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        ) : null}

        {submitSuccessMessage ? (
          <div className="flex items-start gap-3 rounded-[20px] border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{submitSuccessMessage}</span>
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-4 border-t border-slate-800/70 pt-5 md:flex-row md:items-center">
          <div className="text-sm leading-6 text-slate-500">
            {initialFeedback?.updatedAt
              ? 'Phản hồi này đã được lưu trước đó. Bạn có thể chỉnh sửa và gửi lại để cập nhật bản ghi hiện tại.'
              : 'Phản hồi mới sẽ được gắn trực tiếp với ứng viên và phiên phân tích mà bạn đang mở.'}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-slate-800/80 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900/60 hover:text-white"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="rounded-2xl border border-sky-400/40 bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(14,165,233,0.75)] transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !action}
            >
              {isSubmitting ? 'Đang lưu phản hồi...' : initialFeedback ? 'Cập nhật phản hồi' : 'Lưu phản hồi'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AIFeedbackForm;
