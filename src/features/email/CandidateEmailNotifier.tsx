import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  Mail,
  Send,
  X,
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { AnalysisFeedbackAction, AnalysisFeedbackRecord, Candidate } from '@/types';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import { apiPost } from '@/services/api/renderClient';
import { getGoogleAccessToken } from '@/services/auth/authService';

const PASS_ACTIONS = new Set<AnalysisFeedbackAction>(['interview', 'shortlist', 'hire']);
const FAIL_ACTIONS = new Set<AnalysisFeedbackAction>(['reject']);

const ACTION_LABEL: Partial<Record<AnalysisFeedbackAction, string>> = {
  interview: 'Phỏng vấn',
  shortlist: 'Đề cử',
  hire: 'Đề xuất tuyển',
  reject: 'Từ chối',
};

const PASS_TEMPLATE = `Kính gửi {{name}},

Cảm ơn bạn đã ứng tuyển vị trí {{position}} tại công ty chúng tôi.

Sau khi xem xét kỹ hồ sơ, chúng tôi vui mừng thông báo bạn đã VƯỢT QUA vòng sơ tuyển và được mời tham gia phỏng vấn vòng 2.

Chúng tôi sẽ liên hệ trong thời gian sớm nhất để sắp xếp lịch phỏng vấn.

Trân trọng,
Bộ phận Tuyển dụng`;

const FAIL_TEMPLATE = `Kính gửi {{name}},

Cảm ơn bạn đã quan tâm và dành thời gian ứng tuyển vị trí {{position}} tại công ty chúng tôi.

Sau khi xem xét kỹ hồ sơ, chúng tôi rất tiếc phải thông báo hồ sơ của bạn chưa đáp ứng đủ yêu cầu của vị trí này ở thời điểm hiện tại.

Chúng tôi trân trọng sự quan tâm của bạn và hy vọng có cơ hội hợp tác trong tương lai.

Trân trọng,
Bộ phận Tuyển dụng`;

type TabType = 'pass' | 'fail';
type SendState = 'idle' | 'sending' | 'sent';

interface EmailItem {
  candidate: Candidate;
  feedback: AnalysisFeedbackRecord;
  email: string;
  hasOriginalEmail: boolean;
}

export interface CandidateEmailNotifierProps {
  candidates: Candidate[];
  feedbackByCandidate: Record<string, AnalysisFeedbackRecord>;
  jobPosition: string;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    : name.charAt(0).toUpperCase();
}

function getCandidateScore(candidate: Candidate): number {
  const analysis = candidate.analysis as Record<string, unknown> | undefined;
  if (!analysis) return 0;
  const score = (analysis['Tổng điểm'] ?? analysis['Tong diem'] ?? 0) as number;
  return typeof score === 'number' ? score : 0;
}

function applyTemplate(template: string, name: string, position: string): string {
  return template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{position\}\}/g, position);
}

const CandidateEmailNotifier: React.FC<CandidateEmailNotifierProps> = ({
  candidates,
  feedbackByCandidate,
  jobPosition,
  onClose,
}) => {
  const tc = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('pass');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emailOverrides, setEmailOverrides] = useState<Record<string, string>>({});
  const [passTemplate, setPassTemplate] = useState(PASS_TEMPLATE);
  const [failTemplate, setFailTemplate] = useState(FAIL_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sentCount, setSentCount] = useState(0);

  const resolveFeedback = useCallback(
    (c: Candidate): AnalysisFeedbackRecord | null =>
      feedbackByCandidate[c.id] ||
      feedbackByCandidate[c.fileName] ||
      feedbackByCandidate[c.candidateName] ||
      null,
    [feedbackByCandidate]
  );

  const passItems = useMemo<EmailItem[]>(() =>
    candidates.flatMap((c) => {
      const fb = resolveFeedback(c);
      if (!fb || !PASS_ACTIONS.has(fb.action)) return [];
      const rawEmail = c.email?.trim() ?? '';
      return [{
        candidate: c,
        feedback: fb,
        email: emailOverrides[c.id] ?? rawEmail,
        hasOriginalEmail: !!rawEmail,
      }];
    }),
    [candidates, resolveFeedback, emailOverrides]
  );

  const failItems = useMemo<EmailItem[]>(() =>
    candidates.flatMap((c) => {
      const fb = resolveFeedback(c);
      if (!fb || !FAIL_ACTIONS.has(fb.action)) return [];
      const rawEmail = c.email?.trim() ?? '';
      return [{
        candidate: c,
        feedback: fb,
        email: emailOverrides[c.id] ?? rawEmail,
        hasOriginalEmail: !!rawEmail,
      }];
    }),
    [candidates, resolveFeedback, emailOverrides]
  );

  const activeItems = activeTab === 'pass' ? passItems : failItems;
  const activeTemplate = activeTab === 'pass' ? passTemplate : failTemplate;
  const setActiveTemplate = activeTab === 'pass' ? setPassTemplate : setFailTemplate;

  const selectedItems = activeItems.filter((item) => selectedIds.has(item.candidate.id));
  const canSend =
    selectedItems.length > 0 &&
    selectedItems.every((item) => item.email.includes('@'));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === activeItems.length && activeItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeItems.map((item) => item.candidate.id)));
    }
  }, [activeItems, selectedIds.size]);

  const handleEmailChange = useCallback((id: string, value: string) => {
    setEmailOverrides((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setSendState('sending');

    const googleToken = getGoogleAccessToken();
    if (!googleToken) {
      alert('Chưa có quyền gửi email. Vui lòng đăng xuất và đăng nhập lại bằng Google.');
      setSendState('idle');
      return;
    }

    const subject = activeTab === 'pass'
      ? `Thông báo kết quả sơ tuyển – ${jobPosition}`
      : `Kết quả ứng tuyển – ${jobPosition}`;

    const emails = selectedItems.map((item) => ({
      to: item.email,
      subject,
      body: applyTemplate(
        activeTemplate,
        normalizeVietnameseDisplay(item.candidate.candidateName),
        jobPosition,
      ),
    }));

    try {
      const res = await apiPost<{ sent: number; failed: number }>(
        '/api/account/email/send',
        { emails },
        { authRequired: true, headers: { 'X-Google-Access-Token': googleToken } },
      );
      setSentCount(res.sent);
    } catch {
      setSentCount(0);
    }
    setSendState('sent');
  }, [activeTab, activeTemplate, canSend, jobPosition, selectedItems]);

  const previewItem = selectedItems[0] ?? activeItems[0] ?? null;
  const previewBody = previewItem
    ? applyTemplate(
        activeTemplate,
        normalizeVietnameseDisplay(previewItem.candidate.candidateName),
        jobPosition
      )
    : applyTemplate(activeTemplate, 'Ứng viên', jobPosition);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: tc.cardBg,
          border: `1px solid ${tc.borderSoft}`,
          height: 'min(90vh, 720px)',
        }}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-6 py-4"
          style={{ borderColor: tc.borderSoft }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-600/30">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold leading-tight" style={{ color: tc.textPrimary }}>
                Gửi thông báo kết quả
              </h2>
              <p className="text-[12px]" style={{ color: tc.textMuted }}>
                {jobPosition || 'Phiên phân tích'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: tc.textMuted }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left — candidate list */}
          <div
            className="flex w-[55%] min-h-0 flex-col border-r"
            style={{ borderColor: tc.borderSoft }}
          >
            {/* Tabs */}
            <div
              className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
              style={{ borderColor: tc.borderSoft }}
            >
              <button
                onClick={() => { setActiveTab('pass'); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  activeTab === 'pass'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-50'
                }`}
                style={activeTab !== 'pass' ? { borderColor: tc.borderSoft, color: tc.textSecondary } : {}}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Vượt vòng ({passItems.length})
              </button>
              <button
                onClick={() => { setActiveTab('fail'); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  activeTab === 'fail'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'hover:bg-slate-50'
                }`}
                style={activeTab !== 'fail' ? { borderColor: tc.borderSoft, color: tc.textSecondary } : {}}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Không phù hợp ({failItems.length})
              </button>
            </div>

            {/* Select-all bar */}
            {activeItems.length > 0 && (
              <div
                className="flex shrink-0 items-center justify-between border-b px-4 py-2"
                style={{ borderColor: tc.borderSoft }}
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === activeItems.length && activeItems.length > 0}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded accent-blue-600"
                  />
                  <span className="select-none text-[12px] font-medium" style={{ color: tc.textSecondary }}>
                    Chọn tất cả
                  </span>
                </label>
                <span className="text-[11px]" style={{ color: tc.textMuted }}>
                  {selectedItems.length}/{activeItems.length} được chọn
                </span>
              </div>
            )}

            {/* Candidate rows */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeItems.length === 0 ? (
                <div
                  className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl text-center"
                  style={{ color: tc.textMuted }}
                >
                  <Mail className="h-7 w-7 opacity-30" />
                  <p className="text-[13px] font-medium">Không có ứng viên trong nhóm này</p>
                  <p className="text-[12px]">Hãy cho phản hồi trước khi gửi thông báo</p>
                </div>
              ) : (
                activeItems.map((item) => {
                  const isSelected = selectedIds.has(item.candidate.id);
                  const hasEmail = item.email.includes('@');
                  const score = getCandidateScore(item.candidate);
                  const actionLabel = ACTION_LABEL[item.feedback.action] ?? item.feedback.action;
                  const isPass = activeTab === 'pass';

                  return (
                    <div
                      key={item.candidate.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'hover:border-slate-300 hover:shadow-sm cursor-pointer'
                      }`}
                      style={!isSelected ? { borderColor: tc.borderSoft, background: tc.pageBg } : {}}
                      onClick={() => toggleSelect(item.candidate.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 shrink-0 rounded accent-blue-600"
                        />
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {getInitials(normalizeVietnameseDisplay(item.candidate.candidateName))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[13px] font-semibold"
                            style={{ color: tc.textPrimary }}
                          >
                            {normalizeVietnameseDisplay(item.candidate.candidateName)}
                          </p>
                          <p className="text-[11px]" style={{ color: tc.textMuted }}>
                            Điểm{' '}
                            <strong style={{ color: tc.textSecondary }}>
                              {score % 1 === 0 ? score : score.toFixed(1)}
                            </strong>
                            {' · '}
                            <span
                              className={isPass ? 'text-emerald-600' : 'text-rose-600'}
                              style={{ fontWeight: 600 }}
                            >
                              {actionLabel}
                            </span>
                          </p>
                        </div>
                        {hasEmail ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                      </div>

                      {/* Email row */}
                      <div
                        className="mt-2.5 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3 w-3 shrink-0" style={{ color: tc.textMuted }} />
                        {item.hasOriginalEmail ? (
                          <span className="truncate text-[12px]" style={{ color: tc.textSecondary }}>
                            {item.email}
                          </span>
                        ) : (
                          <input
                            type="email"
                            value={item.email}
                            onChange={(e) => handleEmailChange(item.candidate.id, e.target.value)}
                            placeholder="Nhập email ứng viên…"
                            className="flex-1 rounded-lg border bg-white px-2.5 py-1 text-[12px] outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                            style={{ borderColor: tc.borderSoft, color: tc.textPrimary }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — template editor / preview */}
          <div className="flex w-[45%] min-h-0 flex-col">
            {/* Template toolbar */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-4 py-3"
              style={{ borderColor: tc.borderSoft }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: tc.textMuted }}
              >
                Mẫu email &middot; {activeTab === 'pass' ? 'Vượt vòng' : 'Không phù hợp'}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    !showPreview ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                  }`}
                  style={showPreview ? { color: tc.textSecondary } : {}}
                >
                  <Edit3 className="h-3 w-3" />
                  Soạn
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    showPreview ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                  }`}
                  style={showPreview ? {} : { color: tc.textSecondary }}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>

            {/* Editor or preview pane */}
            <div className="flex-1 overflow-y-auto p-4">
              {!showPreview ? (
                <div className="flex h-full flex-col gap-2">
                  <p className="text-[11px]" style={{ color: tc.textMuted }}>
                    Biến:{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">{`{{name}}`}</code>
                    {' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">{`{{position}}`}</code>
                  </p>
                  <textarea
                    value={activeTemplate}
                    onChange={(e) => setActiveTemplate(e.target.value)}
                    rows={14}
                    className="flex-1 w-full resize-none rounded-xl border p-3.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    style={{
                      background: tc.pageBg,
                      borderColor: tc.borderSoft,
                      color: tc.textPrimary,
                    }}
                  />
                </div>
              ) : (
                <div
                  className="rounded-xl border"
                  style={{ background: tc.pageBg, borderColor: tc.borderSoft }}
                >
                  {/* Email meta header */}
                  <div
                    className="space-y-1.5 border-b px-4 py-3"
                    style={{ borderColor: tc.borderSoft }}
                  >
                    {[
                      {
                        label: 'To',
                        value: previewItem
                          ? (previewItem.email || '(chưa có email)')
                          : '(chưa chọn ứng viên)',
                        warn: previewItem ? !previewItem.email.includes('@') : true,
                      },
                      { label: 'Từ', value: 'hr@company.com', warn: false },
                      { label: 'V/v', value: `Kết quả ứng tuyển — ${jobPosition}`, warn: false },
                    ].map(({ label, value, warn }) => (
                      <div key={label} className="flex gap-3 text-[12px]">
                        <span
                          className="w-6 shrink-0 font-semibold"
                          style={{ color: tc.textMuted }}
                        >
                          {label}:
                        </span>
                        <span style={{ color: warn ? '#d97706' : tc.textSecondary }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Email body */}
                  <div className="px-4 py-4">
                    <p
                      className="whitespace-pre-wrap text-[13px] leading-relaxed"
                      style={{ color: tc.textPrimary }}
                    >
                      {previewBody}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between border-t px-6 py-4"
          style={{ borderColor: tc.borderSoft, background: tc.cardBg }}
        >
          {/* Status */}
          <div>
            {sendState === 'sent' ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[13px] font-semibold">
                  Đã gửi thông báo cho {sentCount} ứng viên
                </span>
              </div>
            ) : (
              <span className="text-[13px]" style={{ color: tc.textMuted }}>
                {selectedItems.length > 0 ? (
                  <>
                    <span className="font-bold" style={{ color: tc.textPrimary }}>
                      {selectedItems.length}
                    </span>{' '}
                    ứng viên được chọn
                    {!canSend && (
                      <span className="ml-2 text-amber-600">
                        · Một số ứng viên chưa có email
                      </span>
                    )}
                  </>
                ) : (
                  'Chọn ứng viên để gửi thông báo'
                )}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-xl border px-4 text-[13px] font-semibold transition-colors hover:bg-slate-50"
              style={{ borderColor: tc.borderSoft, color: tc.textSecondary }}
            >
              {sendState === 'sent' ? 'Đóng' : 'Hủy'}
            </button>

            {sendState !== 'sent' && (
              <button
                onClick={() => void handleSend()}
                disabled={!canSend || sendState === 'sending'}
                className="inline-flex h-9 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white shadow-sm transition-all"
                style={{
                  background: canSend ? '#2563eb' : '#94a3b8',
                  boxShadow: canSend ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                }}
              >
                {sendState === 'sending' ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang gửi…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Gửi thông báo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateEmailNotifier;
