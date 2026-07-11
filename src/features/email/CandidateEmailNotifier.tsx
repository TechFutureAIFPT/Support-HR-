import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  Mail,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Users,
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
  onFinish?: () => void;
  onSendSuccess?: (sentCount: number) => void;
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
      metaBg: 'rgba(15,23,42,0.03)',
      bodyBg: 'rgba(255,255,255,0.86)',
      infoBg: 'rgba(59,130,246,0.07)',
    }
    : {
      softBg: 'linear-gradient(135deg, rgba(244,63,94,0.10), rgba(249,115,22,0.08))',
      badgeBg: 'rgba(244,63,94,0.12)',
      badgeText: '#be123c',
      iconBg: 'rgba(244,63,94,0.10)',
      iconText: '#e11d48',
      metaBg: 'rgba(15,23,42,0.03)',
      bodyBg: 'rgba(255,255,255,0.82)',
      infoBg: 'rgba(244,63,94,0.07)',
    };

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm"
      style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
    >
      <div
        className="shrink-0 border-b px-4 py-3"
        style={{ borderColor: tc.borderSoft, background: accent.softBg }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: accent.iconBg, color: accent.iconText }}
            >
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: tc.textMuted }}>
                Xem trước email
              </p>
              <h3 className="text-[12.5px] font-bold" style={{ color: tc.textPrimary }}>
                Nội dung gửi tới ứng viên
              </h3>
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: accent.badgeBg, color: accent.badgeText }}
          >
            {tone === 'pass' ? 'Mẫu vượt vòng' : 'Mẫu không phù hợp'}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: tc.textSecondary }}>
          {helperText}
        </p>
      </div>

      <div
        className="grid shrink-0 grid-cols-1 gap-3 border-b px-4 py-3 md:grid-cols-[minmax(180px,220px)_minmax(0,1fr)]"
        style={{ borderColor: tc.borderSoft, background: accent.metaBg }}
      >
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: tc.textMuted }}>
            Người nhận
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ color: hasEmail ? '#1d4ed8' : '#d97706' }}>
            {to || '(chưa có email)'}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: tc.textMuted }}>
            Tiêu đề
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ color: tc.textPrimary }}>
            {subject}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-3">
        <div
          className="custom-scrollbar h-full overflow-y-auto rounded-[20px] px-4 py-3"
          style={{ background: accent.bodyBg, boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.22)' }}
        >
          <div className="space-y-3 pr-1">
            {blocks.map((block, index) => {
              const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
              const isInfoBlock = lines.every((line) => /^(📅|📍|🔗)/.test(line));
              const isGreeting = index === 0;
              const isSignature = lines[0]?.startsWith('Trân trọng');

              if (isInfoBlock) {
                return (
                  <div
                    key={`${block}-${index}`}
                    className="space-y-1.5 rounded-xl px-3 py-2"
                    style={{ background: accent.infoBg }}
                  >
                    {lines.map((line, lineIndex) => (
                      <p key={`${line}-${lineIndex}`} className="text-[10.5px] font-medium leading-relaxed" style={{ color: tc.textPrimary }}>
                        {line}
                      </p>
                    ))}
                  </div>
                );
              }

              return (
                  <div key={`${block}-${index}`} className={isSignature ? 'pt-1.5' : undefined}>
                  {lines.map((line, lineIndex) => (
                    <p
                      key={`${line}-${lineIndex}`}
                      className={`text-[11px] leading-[1.55] ${
                        isGreeting ? 'font-semibold' : isSignature ? 'text-[10.5px]' : ''
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
  onFinish,
  onSendSuccess,
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
  const [candidatePanelOpen, setCandidatePanelOpen] = useState(true);
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
      alert('Chưa có quyền Gmail để gửi email. Luồng đăng nhập hiện chỉ dùng xác thực cơ bản; quyền Gmail cần được cấp riêng cho tính năng gửi thư.');
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
      if (res.sent > 0) onSendSuccess?.(res.sent);
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
  const candidatePanelWidthClass = candidatePanelOpen
    ? inline
      ? 'xl:w-[300px]'
      : 'xl:w-[30%]'
    : 'xl:w-[64px]';
  const passLayoutClass = inline
    ? 'flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4'
    : 'grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[300px_minmax(0,1fr)]';
  const previewSubject = activeTab === 'pass'
    ? `ThÃ´ng bÃ¡o káº¿t quáº£ sÆ¡ tuyá»ƒn â€“ ${jobPosition}`
    : `Káº¿t quáº£ á»©ng tuyá»ƒn â€“ ${jobPosition}`;
  const previewHelperText = activeTab === 'pass'
    ? 'Xem trÆ°á»›c theo á»©ng viÃªn Ä‘ang chá»n. Khi gá»­i hÃ ng loáº¡t, há»‡ thá»‘ng váº«n tá»± cÃ¡ nhÃ¢n hÃ³a tÃªn vÃ  thÃ´ng tin cho tá»«ng ngÆ°á»i.'
    : 'Xem trÆ°á»›c ná»™i dung email tá»« chá»‘i theo á»©ng viÃªn Ä‘ang chá»n. Khi chá»‰nh báº£n soáº¡n bÃªn trÃ¡i, khung nÃ y sáº½ cáº­p nháº­t ngay.';
  const leftPanelTitle = activeTab === 'pass' ? 'ThÃ´ng tin phá»ng váº¥n' : 'Soáº¡n email Â· KhÃ´ng phÃ¹ há»£p';

  const inputCls = 'h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
  const inputStyle = { background: tc.pageBg, borderColor: tc.borderSoft, color: tc.textPrimary };

  return (
    <div
      className={inline ? undefined : "fixed inset-0 z-50 flex items-center justify-center p-4"}
      style={inline ? undefined : { background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={inline ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={inline
          ? "recruitment-compact-shell relative flex h-full min-h-0 flex-col overflow-hidden bg-white"
          : "relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl"}
        style={inline
          ? { background: tc.cardBg }
          : { background: tc.cardBg, border: `1px solid ${tc.borderSoft}`, height: 'min(92vh, 760px)' }}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-4 py-2.5"
          style={{ borderColor: tc.borderSoft }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-600/30">
              <Mail className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold leading-tight" style={{ color: tc.textPrimary }}>
                Gửi thông báo kết quả
              </h2>
              <p className="text-[11px]" style={{ color: tc.textMuted }}>
                {jobPosition || 'Phiên phân tích'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: tc.textMuted }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">

          {/* Left — candidate list */}
          <div
            className={`flex min-h-0 w-full flex-col border-b transition-[width] duration-200 xl:border-b-0 xl:border-r ${candidatePanelWidthClass}`}
            style={{ borderColor: tc.borderSoft }}
          >
            {!candidatePanelOpen && (
              <div className="flex h-full min-h-0 flex-col items-center gap-2.5 px-2 py-2.5">
                <button
                  type="button"
                  onClick={() => setCandidatePanelOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-slate-50"
                  style={{ borderColor: tc.borderSoft, color: tc.textSecondary }}
                  title="Mở danh sách ứng viên"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
                <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: tc.pageBg, color: tc.textMuted }}
                  title={`${selectedItems.length}/${activeItems.length} ứng viên được chọn`}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: tc.textMuted }}>
                  Ứng viên
                </div>
              </div>
            )}
            {/* Tabs */}
            <div
              className={`${candidatePanelOpen ? 'flex' : 'hidden'} shrink-0 items-center gap-2 border-b px-3 py-2`}
              style={{ borderColor: tc.borderSoft }}
            >
              <button
                type="button"
                onClick={() => setCandidatePanelOpen(false)}
                className="mr-1 flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:bg-slate-50"
                style={{ borderColor: tc.borderSoft, color: tc.textSecondary }}
                title="Thu gọn danh sách ứng viên"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
              {([
                { tab: 'pass' as TabType, label: 'Vượt vòng', count: passItems.length, dot: 'bg-emerald-500', active: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                { tab: 'fail' as TabType, label: 'Không phù hợp', count: failItems.length, dot: 'bg-rose-500', active: 'border-rose-200 bg-rose-50 text-rose-700' },
              ]).map(({ tab, label, count, dot, active }) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all ${
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
            {candidatePanelOpen && activeItems.length > 0 && (
              <div
                className="flex shrink-0 items-center justify-between border-b px-3 py-1.5"
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
            <div className={`${candidatePanelOpen ? 'block' : 'hidden'} flex-1 overflow-y-auto p-2 space-y-1.5`}>
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
                      <div className="flex items-center gap-2.5 p-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 shrink-0 rounded accent-blue-600"
                        />
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
                            isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {getInitials(normalizeVietnameseDisplay(item.candidate.candidateName))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold" style={{ color: tc.textPrimary }}>
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
                        className="flex items-center gap-2 rounded-b-xl border-t px-2.5 py-1.5"
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

            <div className="hidden min-h-0 flex-col border-t" style={{ borderColor: tc.borderSoft }}>
              <div
                className="flex shrink-0 items-center justify-between border-b px-4 py-3"
                style={{ borderColor: tc.borderSoft }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: tc.textMuted }}
                >
                  {leftPanelTitle}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {activeTab === 'pass' && (
                  <div className="space-y-4 p-4 lg:px-5 lg:py-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          <Calendar className="h-3 w-3" />
                          NgÃ y phá»ng váº¥n
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
                          Giá» báº¯t Ä‘áº§u
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

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: tc.textMuted }}
                      >
                        HÃ¬nh thá»©c phá»ng váº¥n
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

                    {(interviewDetails.format === 'offline' || interviewDetails.format === 'hybrid') && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          <MapPin className="h-3 w-3" />
                          Äá»‹a Ä‘iá»ƒm phá»ng váº¥n
                        </label>
                        <input
                          type="text"
                          value={interviewDetails.location}
                          onChange={(e) => updateInterview({ location: e.target.value })}
                          placeholder="VD: Táº§ng 5, TÃ²a nhÃ  ABC, 123 Nguyá»…n Huá»‡, Q.1"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    )}

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
                )}

                {activeTab === 'fail' && (
                  <div className="flex h-full min-h-0 flex-col p-4 lg:px-5">
                    <div className="flex h-full min-h-0 flex-col gap-2.5">
                      <p className="shrink-0 text-[11px]" style={{ color: tc.textMuted }}>
                        Biáº¿n:{' '}
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">{`{{name}}`}</code>
                        {' '}
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">{`{{position}}`}</code>
                      </p>
                      <textarea
                        value={failTemplate}
                        onChange={(e) => setFailTemplate(e.target.value)}
                        className="min-h-[320px] flex-1 w-full resize-none rounded-xl border p-3.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-50 xl:min-h-0"
                        style={{
                          background: tc.pageBg,
                          borderColor: tc.borderSoft,
                          color: tc.textPrimary,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — interview form (pass) or template editor (fail) */}
          <div className="flex min-h-0 w-full flex-col xl:flex-1">

            {/* Panel toolbar */}
            {activeTab === 'fail' && (
              <div
                className="flex shrink-0 items-center justify-between border-b px-3 py-2"
                style={{ borderColor: tc.borderSoft }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: tc.textMuted }}
                >
                  Mẫu email · Không phù hợp
                </p>
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
              </div>
            )}

            {/* Panel content */}
            <div className="min-h-0 flex-1 overflow-hidden">

              {/* ── PASS TAB: Interview form + auto preview ── */}
              {activeTab === 'pass' && (
                <div className={passLayoutClass}>
                  {/* Form fields */}
                  <div
                    className="shrink-0 rounded-lg bg-slate-50 p-4"
                  >
                    <div className="mb-3">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                        style={{ color: tc.textMuted }}
                      >
                        Thông tin phỏng vấn
                      </p>
                      <p className="mt-1 text-[12px]" style={{ color: tc.textSecondary }}>
                        Điền lịch một lần, email bên phải sẽ cập nhật ngay.
                      </p>
                    </div>

                    <div className="space-y-3">

                      {/* Date + Time */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
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
                            className="text-[10px] font-semibold uppercase tracking-wide"
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
                          className="text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: tc.textMuted }}
                        >
                          Hình thức phỏng vấn
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {FORMAT_OPTIONS.map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => updateInterview({ format: value })}
                              className={`flex-1 rounded-lg border py-1.5 text-[10.5px] font-semibold transition-all ${
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
                            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
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
                            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
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
                  </div>

                  {/* Auto-generated email preview */}
                  <div className="min-h-[360px] min-w-0 flex-1">
                    <div className="flex h-full min-h-[360px]">
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
              )}

              {/* ── FAIL TAB: Template editor / preview ── */}
              {activeTab === 'fail' && (
                <div className="flex h-full min-h-0 flex-col overflow-hidden p-3">
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
                        className="min-h-0 flex-1 w-full resize-none rounded-xl border p-3 text-[12px] leading-relaxed outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        style={{
                          background: tc.pageBg,
                          borderColor: tc.borderSoft,
                          color: tc.textPrimary,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1">
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
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
          style={{ borderColor: tc.borderSoft, background: tc.cardBg }}
        >
          <div>
            {sendState === 'sent' ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[12px] font-semibold">
                  Đã gửi thông báo cho {sentCount} ứng viên
                </span>
              </div>
            ) : (
              <span className="text-[12px]" style={{ color: tc.textMuted }}>
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

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-8 items-center rounded-lg border px-3.5 text-[12px] font-semibold transition-colors hover:bg-slate-50"
              style={{ borderColor: tc.borderSoft, color: tc.textSecondary }}
            >
              {sendState === 'sent' ? 'Đóng' : 'Hủy'}
            </button>

            {sendState !== 'sent' && (
              <button
                onClick={() => void handleSend()}
                disabled={!canSend || sendState === 'sending'}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-4 text-[12px] font-semibold text-white shadow-sm transition-all"
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
            {onFinish && (
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <CheckCircle2 className="size-4" />
                Hoàn thành
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateEmailNotifier;
