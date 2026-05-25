import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CircleOff,
  ClipboardList,
  Lightbulb,
  MessageSquareText,
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

const HIGH_SEVERITY_SCORE_DELTA = 15;
const MEDIUM_SEVERITY_SCORE_DELTA = 8;

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
    tone: 'border-[#f5d6bb]/30 bg-[#f5d6bb]/10 text-[#f8e5d3]',
    icon: ClipboardList,
  },
  {
    value: 'interview',
    label: 'Mời phỏng vấn',
    description: 'Nên bước sang vòng trao đổi để kiểm chứng thêm năng lực và độ phù hợp.',
    tone: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
    icon: MessageSquareText,
  },
  {
    value: 'hire',
    label: 'Đề xuất tuyển',
    description: 'Ứng viên rất mạnh, có thể ưu tiên sang bước chốt offer hoặc đàm phán.',
    tone: 'border-violet-400/25 bg-violet-400/10 text-violet-100',
    icon: Trophy,
  },
  {
    value: 'reject',
    label: 'Từ chối',
    description: 'Chưa phù hợp ở thời điểm hiện tại hoặc chưa đạt ngưỡng tối thiểu của vị trí.',
    tone: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
    icon: CircleOff,
  },
];

const REUSE_OPTIONS = [
  {
    value: false,
    title: 'Chỉ áp dụng cho CV này',
    description: 'Dùng khi phản hồi chủ yếu là tình huống riêng của ứng viên hiện tại.',
  },
  {
    value: true,
    title: 'Dùng làm lưu ý chung',
    description: 'Dùng khi đây là kiểu lỗi AI nên lưu ý lại cho các CV tương tự về sau.',
  },
];

const outerPanelClass = 'border border-white/[0.08] bg-[rgba(10,10,11,0.96)]';
const sectionPanelClass = 'border border-white/[0.08] bg-[rgba(16,16,18,0.9)]';
const insetPanelClass = 'border border-white/[0.08] bg-black/30';
const iconBoxClass = 'flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.03]';

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
  description: string;
  className: string;
} {
  if (severity === 'high') {
    return {
      label: 'Mức độ cao',
      description: 'Độ lệch từ 15 điểm trở lên. Đây là nhóm phản hồi nên ưu tiên xem lại và cân nhắc tái sử dụng.',
      className: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
    };
  }

  if (severity === 'medium') {
    return {
      label: 'Mức độ trung bình',
      description: 'Độ lệch đủ đáng chú ý. Nên ghi chú rõ nguyên nhân để hỗ trợ review về sau.',
      className: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
    };
  }

  return {
    label: 'Mức độ nhẹ',
    description: 'Độ lệch nhỏ. Thường phù hợp với các tinh chỉnh cục bộ cho ứng viên hiện tại.',
    className: 'border-[#f5d6bb]/25 bg-[#f5d6bb]/10 text-[#f8e5d3]',
  };
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
  const [isReusableGuidance, setIsReusableGuidance] = useState<boolean>(false);

  useEffect(() => {
    setFinalScore(Math.round(initialFeedback?.finalScore ?? aiScore));
    setSelectedCriteria(readSelectedCriteria(initialFeedback));
    setNotes(initialFeedback?.notes || '');
    setAction(initialFeedback?.action || null);
    setIsReusableGuidance(readIsReusableGuidance(initialFeedback));
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

  const severity = useMemo<AnalysisFeedbackSeverity>(
    () => deriveSeverity(scoreDifference),
    [scoreDifference]
  );

  const severityMeta = useMemo(
    () => getSeverityMeta(severity),
    [severity]
  );

  const scoreDeltaClassName = scoreDifference > 0
    ? 'text-emerald-300'
    : scoreDifference < 0
      ? 'text-rose-300'
      : 'text-zinc-200';

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
      isReusableGuidance,
    };

    await onSubmit(feedback);
  };

  return (
    <div className={`${outerPanelClass} p-4 md:p-5`}>
      <div className="mb-4 flex items-start gap-3 border-b border-white/[0.08] pb-4">
        <div className={`${iconBoxClass} text-[#f5d6bb]`}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">Phản hồi đánh giá AI</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Bạn đang hiệu chỉnh kết quả cho <span className="font-semibold text-zinc-200">{candidateName}</span>.
            Các thay đổi dưới đây sẽ được lưu cùng phiên phân tích hiện tại.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid items-start gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <section className={`${sectionPanelClass} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/80">
                  Điểm hiệu chỉnh cuối cùng
                </p>
                <h3 className="mt-2 text-[2rem] font-bold leading-none text-white">{finalScore} điểm</h3>
              </div>
              <div className={`${insetPanelClass} px-4 py-3 text-right`}>
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Điểm AI gốc</p>
                <p className="mt-1 text-2xl font-bold text-white">{aiScore.toFixed(1)}</p>
              </div>
            </div>

            <div className={`${insetPanelClass} mt-4 px-4 py-4`}>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={finalScore}
                onChange={(event) => setFinalScore(Number(event.target.value))}
                className="w-full accent-[#f5d6bb]"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className={`${insetPanelClass} px-3 py-1.5 text-zinc-300`}>
                  AI gốc: <strong className="font-semibold text-white">{aiScore.toFixed(1)}</strong>
                </span>
                <span className={`${insetPanelClass} px-3 py-1.5 text-zinc-300`}>
                  Recruiter chốt: <strong className="font-semibold text-white">{finalScore}</strong>
                </span>
                <span className={`${insetPanelClass} px-3 py-1.5 font-semibold ${scoreDeltaClassName}`}>
                  Độ lệch: {scoreDifference > 0 ? '+' : ''}{scoreDifference.toFixed(1)}
                </span>
              </div>
            </div>

            <div className={`mt-4 border px-4 py-3 ${severityMeta.className}`}>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{severityMeta.label}</p>
                  <p className="mt-1 text-xs leading-5 opacity-90">{severityMeta.description}</p>
                </div>
              </div>
            </div>
          </section>

          <section className={`${sectionPanelClass} p-4`}>
            <div className="flex items-center gap-3">
              <div className={`${iconBoxClass} text-zinc-300`}>
                <ClipboardList className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/80">
                  Quyết định của recruiter
                </p>
                <p className="mt-1 text-sm text-zinc-500">Chọn một trạng thái chính cho ứng viên này.</p>
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
                    className={`border px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? option.tone
                        : 'border-white/[0.08] bg-black/25 text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border ${
                        isActive
                          ? 'border-current/25 bg-black/12'
                          : 'border-white/[0.08] bg-white/[0.03] text-zinc-400'
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

        <section className={`${sectionPanelClass} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`${iconBoxClass} text-zinc-300`}>
              <Lightbulb className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/80">
                Phạm vi áp dụng phản hồi
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Giúp hệ thống phân biệt giữa lỗi riêng của CV này và lưu ý nên dùng lại cho các CV sau.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {REUSE_OPTIONS.map((option) => {
              const isActive = isReusableGuidance === option.value;
              return (
                <button
                  key={option.title}
                  type="button"
                  onClick={() => setIsReusableGuidance(option.value)}
                  className={`border px-4 py-3.5 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-[#f5d6bb]/30 bg-[#f5d6bb]/10 text-[#f8e5d3]'
                      : 'border-white/[0.08] bg-black/25 text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className="text-sm font-semibold">{option.title}</div>
                  <div className="mt-1 text-xs leading-5 opacity-85">{option.description}</div>
                </button>
              );
            })}
          </div>

          {severity === 'high' && !isReusableGuidance ? (
            <div className="mt-4 flex items-start gap-3 border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span>
                Độ lệch hiện đang ở mức cao. Nếu đây là lỗi AI có thể lặp lại với các CV tương tự,
                bạn nên bật tùy chọn “Dùng làm lưu ý chung”.
              </span>
            </div>
          ) : null}
        </section>

        <section className={`${sectionPanelClass} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`${iconBoxClass} text-zinc-300`}>
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/80">
                Tiêu chí cần AI học lại
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Chọn các điểm mà bạn muốn lưu lại để phục vụ việc review hoặc evaluation sau này.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {FEEDBACK_CRITERIA.map((criterion) => (
              <label
                key={criterion}
                className={`flex cursor-pointer items-start gap-3 border p-3 transition-all ${
                  selectedCriteria.includes(criterion)
                    ? 'border-[#f5d6bb]/30 bg-[#f5d6bb]/10'
                    : 'border-white/[0.08] bg-black/25 hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded-none border-white/[0.12] bg-transparent accent-[#f5d6bb]"
                  checked={selectedCriteria.includes(criterion)}
                  onChange={() => handleCriteriaChange(criterion)}
                />
                <span className="text-sm leading-6 text-zinc-200">{criterion}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={`${sectionPanelClass} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`${iconBoxClass} text-zinc-300`}>
              <MessageSquareText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/80">
                Ghi chú chi tiết
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Mô tả ngắn gọn vì sao bạn thay đổi điểm hoặc quyết định hiện tại của recruiter.
              </p>
            </div>
          </div>

          <textarea
            className="mt-4 min-h-[120px] w-full border border-white/[0.08] bg-black/30 p-4 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#f5d6bb]/35 focus:ring-1 focus:ring-[#f5d6bb]/20"
            placeholder="Ví dụ: Ứng viên có từ khóa khá tốt nhưng kinh nghiệm triển khai thực tế ở môi trường production còn mỏng, cần kiểm chứng thêm ở vòng phỏng vấn."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Hệ thống sẽ lưu lại quyết định, điểm số cuối cùng, lý do tổng hợp, ghi chú này
            và phạm vi áp dụng của phản hồi để phục vụ bước học sau.
          </p>
        </section>

        {submitError ? (
          <div className="flex items-start gap-3 border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        ) : null}

        {submitSuccessMessage ? (
          <div className="flex items-start gap-3 border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{submitSuccessMessage}</span>
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-5 md:flex-row md:items-center">
          <div className="text-sm leading-6 text-zinc-500">
            {initialFeedback?.updatedAt
              ? 'Phản hồi này đã được lưu trước đó. Bạn có thể chỉnh sửa và gửi lại để cập nhật bản ghi hiện tại.'
              : 'Phản hồi mới sẽ được gắn trực tiếp với ứng viên và phiên phân tích mà bạn đang mở.'}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="border border-[#f5d6bb]/35 bg-[#f5d6bb] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#f1cfb1] disabled:cursor-not-allowed disabled:opacity-60"
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
