import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  Mail,
  MapPin,
  Send,
  Video,
  X,
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { AnalysisFeedbackAction, AnalysisFeedbackRecord, Candidate } from '@/types';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import { apiPost } from '@/services/api/renderClient';
import { getGoogleAccessToken } from '@/services/auth/authService';

type ThemeColors = ReturnType<typeof useThemeColors>;

const PASS_ACTIONS = new Set<AnalysisFeedbackAction>(['interview', 'shortlist', 'hire']);
const FAIL_ACTIONS = new Set<AnalysisFeedbackAction>(['reject']);

const ACTION_LABEL: Partial<Record<AnalysisFeedbackAction, string>> = {
  interview: 'Phỏng vấn',
  shortlist: 'Đề cử',
  hire: 'Đề xuất tuyển',
  reject: 'Từ chối',
};

const FAIL_TEMPLATE = `Kính gửi {{name}},

Cảm ơn bạn đã quan tâm và dành thời gian ứng tuyển vị trí {{position}} tại công ty chúng tôi.

Sau khi xem xét kỹ hồ sơ, chúng tôi rất tiếc phải thông báo hồ sơ của bạn chưa đáp ứng đủ yêu cầu của vị trí này ở thời điểm hiện tại.

Chúng tôi trân trọng sự quan tâm của bạn và hy vọng có cơ hội hợp tác trong tương lai.

Trân trọng,
Bộ phận Tuyển dụng`;

type TabType = 'pass' | 'fail';
type SendState = 'idle' | 'sending' | 'sent';
type InterviewFormat = 'offline' | 'online' | 'hybrid';

interface InterviewDetails {
  date: string;
  time: string;
  format: InterviewFormat;
  location: string;
  meetLink: string;
}

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
  inline?: boolean;
}

const FORMAT_OPTIONS: { value: InterviewFormat; label: string }[] = [
  { value: 'offline', label: 'Trực tiếp' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Kết hợp' },
];

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

function generatePassBody(details: InterviewDetails, name: string, position: string): string {
  const { date, time, format, location, meetLink } = details;

  const timeDisplay = date && time
    ? `${date} lúc ${time}`
    : date || (time ? `lúc ${time}` : '(sẽ được thông báo sau)');

  const lines: string[] = [
    `Kính gửi ${name},`,
    '',
    `Cảm ơn bạn đã ứng tuyển vị trí ${position} tại công ty chúng tôi.`,
    '',
    'Sau khi xem xét kỹ hồ sơ, chúng tôi vui mừng thông báo bạn đã VƯỢT QUA vòng sơ tuyển và được mời tham gia phỏng vấn vòng 2.',
    '',
    `📅 Thời gian: ${timeDisplay}`,
  ];

  if (format === 'offline' || format === 'hybrid') {
    lines.push(`📍 Địa điểm: ${location || '(sẽ được cập nhật)'}`);
  }
  if (format === 'online' || format === 'hybrid') {
    lines.push(`🔗 Google Meet: ${meetLink || '(sẽ được cập nhật)'}`);
  }

  lines.push(
    '',
    'Kính nhờ bạn xác nhận tham dự hoặc liên hệ lại nếu cần điều chỉnh lịch.',
    '',
    'Trân trọng,',
    'Bộ phận Tuyển dụng',
  );

  return lines.join('\n');
}

function splitEmailBodyBlocks(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

const EmailPreviewCard: React.FC<{
  tc: ThemeColors;
  to: string;
  subject: string;
  body: string;
  tone: 'pass' | 'fail';
  helperText: string;
}> = ({ tc, to, subject, body, tone, helperText }) => {
  const blocks = splitEmailBodyBlocks(body);
  const hasEmail = to.includes('@');
  const accent = tone === 'pass'
    ? {
      softBg: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(59,130,246,0.08))',
      badgeBg: 'rgba(16,185,129,0.14)',
      badgeText: '#047857',
      iconBg: 'rgba(16,185,129,0.12)',
      iconText: '#059669',
    }
    : {
      softBg: 'linear-gradient(135deg, rgba(244,63,94,0.10), rgba(249,115,22,0.08))',
      badgeBg: 'rgba(244,63,94,0.12)',
      badgeText: '#be123c',
      iconBg: 'rgba(244,63,94,0.10)',
      iconText: '#e11d48',
    };

  return (
    <div
      className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border shadow-sm"
      style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
    >
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: tc.borderSoft, background: accent.softBg }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: accent.iconBg, color: accent.iconText }}
            >
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tc.textMuted }}>
                Xem trước email
              </p>
              <h3 className="text-[14px] font-bold" style={{ color: tc.textPrimary }}>
                Nội dung gửi tới ứng viên
              </h3>
            </div>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: accent.badgeBg, color: accent.badgeText }}
          >
            {tone === 'pass' ? 'Mẫu vượt vòng' : 'Mẫu không phù hợp'}
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed" style={{ color: tc.textSecondary }}>
          {helperText}
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-2 border-b px-4 py-3 sm:grid-cols-3"
        style={{ borderColor: tc.borderSoft, background: 'rgba(148,163,184,0.05)' }}
      >
        <div className="rounded-xl border px-3 py-2" style={{ borderColor: tc.borderSoft, background: tc.cardBg }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: tc.textMuted }}>
            Người nhận
          </p>
          <p className="mt-1 truncate text-[12px] font-semibold" style={{ color: hasEmail ? '#1d4ed8' : '#d97706' }}>
            {to || '(chưa có email)'}
          </p>
        </div>
        <div className="rounded-xl border px-3 py-2 sm:col-span-2" style={{ borderColor: tc.borderSoft, background: tc.cardBg }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: tc.textMuted }}>
            Tiêu đề
          </p>
          <p className="mt-1 text-[12px] font-semibold" style={{ color: tc.textPrimary }}>
            {subject}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-4">
        <div
          className="flex h-full min-h-[320px] flex-col rounded-2xl border px-4 py-4 lg:min-h-[420px]"
          style={{ borderColor: tc.borderSoft, background: tone === 'pass' ? 'rgba(248,250,252,0.9)' : tc.pageBg }}
        >
          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
            {blocks.map((block, index) => {
              const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
              const isInfoBlock = lines.every((line) => /^(📅|📍|🔗)/.test(line));
              const isGreeting = index === 0;
              const isSignature = lines[0]?.startsWith('Trân trọng');

              if (isInfoBlock) {
                return (
                  <div
                    key={`${block}-${index}`}
                    className="space-y-2 rounded-xl border px-3 py-3"
                    style={{ borderColor: tc.borderSoft, background: tc.cardBg }}
                  >
                    {lines.map((line, lineIndex) => (
                      <p key={`${line}-${lineIndex}`} className="text-[12.5px] font-medium leading-relaxed" style={{ color: tc.textPrimary }}>
                        {line}
                      </p>
                    ))}
                  </div>
                );
              }

              return (
                <div key={`${block}-${index}`} className={isSignature ? 'pt-2' : undefined}>
                  {lines.map((line, lineIndex) => (
                    <p
                      key={`${line}-${lineIndex}`}
                      className={`text-[13px] leading-[1.72] ${
                        isGreeting ? 'font-semibold' : isSignature ? 'text-[12.5px]' : ''
                      }`}
                      style={{ color: isGreeting ? tc.textPrimary : tc.textSecondary }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateEmailNotifier: React.FC<CandidateEmailNotifierProps> = ({
  candidates,
  feedbackByCandidate,
  jobPosition,
  onClose,
  inline,
}) => {
  const tc = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('pass');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emailOverrides, setEmailOverrides] = useState<Record<string, string>>({});
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails>({
    date: '',
    time: '',
    format: 'offline',
    location: '',
    meetLink: '',
  });
  const [failTemplate, setFailTemplate] = useState(FAIL_TEMPLATE);
  const [showFailPreview, setShowFailPreview] = useState(false);
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
  const selectedItems = activeItems.filter((item) => selectedIds.has(item.candidate.id));
  const canSend = selectedItems.length > 0 && selectedItems.every((item) => item.email.includes('@'));

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

  const updateInterview = useCallback((patch: Partial<InterviewDetails>) => {
    setInterviewDetails((prev) => ({ ...prev, ...patch }));
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

    const emails = selectedItems.map((item) => {
      const name = normalizeVietnameseDisplay(item.candidate.candidateName);
      const body = activeTab === 'pass'
        ? generatePassBody(interviewDetails, name, jobPosition)
        : applyTemplate(failTemplate, name, jobPosition);
      return { to: item.email, subject, body };
    });

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
  }, [activeTab, canSend, failTemplate, interviewDetails, jobPosition, selectedItems]);

  const previewItem = selectedItems[0] ?? activeItems[0] ?? null;
  const previewName = previewItem
    ? normalizeVietnameseDisplay(previewItem.candidate.candidateName)
    : 'Ứng viên';
  const previewBody = activeTab === 'pass'
    ? generatePassBody(interviewDetails, previewName, jobPosition)
    : applyTemplate(failTemplate, previewName, jobPosition);

  const inputCls = 'w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-100';
  const inputStyle = { background: tc.pageBg, borderColor: tc.borderSoft, color: tc.textPrimary };

  return (
    <div
      className={inline ? undefined : "fixed inset-0 z-50 flex items-center justify-center p-4"}
      style={inline ? undefined : { background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={inline ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={inline
          ? "relative flex h-full flex-col overflow-hidden"
          : "relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl"}
        style={inline
          ? { background: tc.cardBg, border: `1px solid ${tc.borderSoft}` }
          : { background: tc.cardBg, border: `1px solid ${tc.borderSoft}`, height: 'min(92vh, 760px)' }}
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
              <h2 className="text-[15px] font-bold leading-tight" style={{ color: tc.textPrimary }}>
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">

          {/* Left — candidate list */}
          <div
            className="flex min-h-0 w-full flex-col border-b xl:w-[42%] xl:border-b-0 xl:border-r"
            style={{ borderColor: tc.borderSoft }}
          >
            {/* Tabs */}
            <div
              className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
              style={{ borderColor: tc.borderSoft }}
            >
              {([
                { tab: 'pass' as TabType, label: 'Vượt vòng', count: passItems.length, dot: 'bg-emerald-500', active: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                { tab: 'fail' as TabType, label: 'Không phù hợp', count: failItems.length, dot: 'bg-rose-500', active: 'border-rose-200 bg-rose-50 text-rose-700' },
              ]).map(({ tab, label, count, dot, active }) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all ${
                    activeTab === tab ? active : 'hover:bg-slate-50'
                  }`}
                  style={activeTab !== tab ? { borderColor: tc.borderSoft, color: tc.textSecondary } : {}}
                >
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label} ({count})
                </button>
              ))}
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
                      className={`rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'cursor-pointer hover:border-slate-300 hover:shadow-sm'
                      }`}
                      style={!isSelected ? { borderColor: tc.borderSoft, background: tc.pageBg } : {}}
                      onClick={() => toggleSelect(item.candidate.id)}
                    >
                      {/* Candidate info row */}
                      <div className="flex items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 shrink-0 rounded accent-blue-600"
                        />
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${
                            isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {getInitials(normalizeVietnameseDisplay(item.candidate.candidateName))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold" style={{ color: tc.textPrimary }}>
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
                        {hasEmail
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          : <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        }
                      </div>

                      {/* Email row — always visible, prominent */}
                      <div
                        className="flex items-center gap-2 rounded-b-xl border-t px-3 py-2"
                        style={{
                          borderColor: isSelected ? '#bfdbfe' : tc.borderSoft,
                          background: isSelected ? 'rgba(219,234,254,0.4)' : 'transparent',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail
                          className="h-3 w-3 shrink-0"
                          style={{ color: hasEmail ? '#3b82f6' : tc.textMuted }}
                        />
                        {item.hasOriginalEmail ? (
                          <span
                            className="truncate text-[12px] font-semibold"
                            style={{ color: hasEmail ? '#1d4ed8' : '#d97706' }}
                          >
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

          {/* Right — interview form (pass) or template editor (fail) */}
          <div className="flex min-h-0 w-full flex-col xl:w-[58%]">

            {/* Panel toolbar */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-4 py-3"
              style={{ borderColor: tc.borderSoft }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: tc.textMuted }}
              >
                {activeTab === 'pass' ? 'Thông tin phỏng vấn' : 'Mẫu email · Không phù hợp'}
              </p>
              {activeTab === 'fail' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowFailPreview(false)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      !showFailPreview ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                    }`}
                    style={showFailPreview ? { color: tc.textSecondary } : {}}
                  >
                    <Edit3 className="h-3 w-3" />
                    Soạn
                  </button>
                  <button
                    onClick={() => setShowFailPreview(true)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      showFailPreview ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                    }`}
                    style={showFailPreview ? {} : { color: tc.textSecondary }}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
              )}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── PASS TAB: Interview form + auto preview ── */}
              {activeTab === 'pass' && (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Form fields */}
                  <div className="space-y-4 p-4 lg:px-5 lg:py-4">

                    {/* Date + Time */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          <Calendar className="h-3 w-3" />
                          Ngày phỏng vấn
                        </label>
                        <input
                          type="date"
                          value={interviewDetails.date}
                          onChange={(e) => updateInterview({ date: e.target.value })}
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          Giờ bắt đầu
                        </label>
                        <input
                          type="time"
                          value={interviewDetails.time}
                          onChange={(e) => updateInterview({ time: e.target.value })}
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Format selector */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: tc.textMuted }}
                      >
                        Hình thức phỏng vấn
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {FORMAT_OPTIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => updateInterview({ format: value })}
                            className={`flex-1 rounded-lg border py-2 text-[12px] font-semibold transition-all ${
                              interviewDetails.format === value
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : 'hover:bg-slate-50'
                            }`}
                            style={interviewDetails.format !== value
                              ? { borderColor: tc.borderSoft, color: tc.textSecondary }
                              : {}
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location (offline / hybrid) */}
                    {(interviewDetails.format === 'offline' || interviewDetails.format === 'hybrid') && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          <MapPin className="h-3 w-3" />
                          Địa điểm phỏng vấn
                        </label>
                        <input
                          type="text"
                          value={interviewDetails.location}
                          onChange={(e) => updateInterview({ location: e.target.value })}
                          placeholder="VD: Tầng 5, Tòa nhà ABC, 123 Nguyễn Huệ, Q.1"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    )}

                    {/* Google Meet link (online / hybrid) */}
                    {(interviewDetails.format === 'online' || interviewDetails.format === 'hybrid') && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          <Video className="h-3 w-3" />
                          Link Google Meet
                        </label>
                        <input
                          type="url"
                          value={interviewDetails.meetLink}
                          onChange={(e) => updateInterview({ meetLink: e.target.value })}
                          placeholder="https://meet.google.com/xxx-xxxx-xxx"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    )}
                  </div>

                  {/* Auto-generated email preview */}
                  <div className="min-h-0 border-t" style={{ borderColor: tc.borderSoft }}>
                    <div className="min-h-0 px-4 py-3 lg:px-5">
                      <p
                        className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em]"
                        style={{ color: tc.textMuted }}
                      >
                        Nội dung email · tự động tạo
                      </p>
                      <div className="min-h-[340px] lg:min-h-[460px]">
                      <EmailPreviewCard
                        tc={tc}
                        to={previewItem ? (previewItem.email || '(chưa có email)') : '(chọn ứng viên để xem)'}
                        subject={`Thông báo kết quả sơ tuyển – ${jobPosition}`}
                        body={previewBody}
                        tone="pass"
                        helperText="Xem trước theo ứng viên đang chọn. Khi gửi hàng loạt, hệ thống vẫn tự cá nhân hóa tên và thông tin cho từng người."
                      />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── FAIL TAB: Template editor / preview ── */}
              {activeTab === 'fail' && (
                <div className="flex h-full min-h-0 flex-col p-4 lg:px-5">
                  {!showFailPreview ? (
                    <div className="flex h-full min-h-0 flex-col gap-2.5">
                      <p className="shrink-0 text-[11px]" style={{ color: tc.textMuted }}>
                        Biến:{' '}
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">{`{{name}}`}</code>
                        {' '}
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">{`{{position}}`}</code>
                      </p>
                      <textarea
                        value={failTemplate}
                        onChange={(e) => setFailTemplate(e.target.value)}
                        className="min-h-[360px] flex-1 w-full resize-none rounded-xl border p-3.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-50 lg:min-h-[460px]"
                        style={{
                          background: tc.pageBg,
                          borderColor: tc.borderSoft,
                          color: tc.textPrimary,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[340px] lg:min-h-[460px]">
                    <EmailPreviewCard
                      tc={tc}
                      to={previewItem ? (previewItem.email || '(chưa có email)') : '(chưa chọn ứng viên)'}
                      subject={`Kết quả ứng tuyển – ${jobPosition}`}
                      body={previewBody}
                      tone="fail"
                      helperText="Đây là bản xem trước của mẫu từ chối. Bạn có thể quay lại tab soạn để chỉnh câu chữ trước khi gửi."
                    />
                    </div>
                  )}
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
