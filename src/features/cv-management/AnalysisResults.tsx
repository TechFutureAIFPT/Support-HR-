import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, CalendarDays, CheckCircle2, ChevronRight, Clipboard, Mail, MessageSquareText, PanelRightClose, PanelRightOpen, PlayCircle, Send, Star, TriangleAlert, Zap } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { AnalysisFeedbackDraft, AnalysisFeedbackRecord, AppStep, Candidate, HardFilters, RecruiterInfo, WeightCriteria } from '@/types';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import CvDocumentViewer from '@/features/cv-management/CvDocumentViewer';
import { ScoreLabel, WorkspaceEmpty, WorkspaceSearch } from '@/components/workspace/WorkspacePrimitives';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import ExpandedContent from '@/features/cv-management/ExpandedContent';
import CandidateEmailNotifier from '@/features/email/CandidateEmailNotifier';
import AIFeedbackForm from '@/features/feedback/AIFeedbackForm';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';
import { auth, db } from '@/services/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface AnalysisResultsProps {
  isLoading: boolean;
  loadingMessage: string;
  results: Candidate[];
  jobPosition: string;
  locationRequirement: string;
  jdText: string;
  setActiveStep?: (step: AppStep) => void;
  markStepAsCompleted?: (step: AppStep) => void;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
  documentOwner?: string;
  feedbackByCandidate?: Record<string, AnalysisFeedbackRecord>;
}

type DetailTab = 'overview' | 'stats' | 'schedule' | 'chat' | 'feedback';

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'stats', label: 'Thống kê' },
  { key: 'schedule', label: 'Lên lịch' },
  { key: 'chat', label: 'Tư vấn AI' },
  { key: 'feedback', label: 'Phản hồi điểm' },
];

function candidateScore(candidate: Candidate): number {
  return candidate.status === 'SUCCESS' ? candidate.analysis?.['Tổng điểm'] || 0 : 0;
}

function candidateRole(candidate: Candidate, fallback: string): string {
  return normalizeVietnameseDisplay(candidate.jobTitle) || normalizeVietnameseDisplay(fallback) || 'Vị trí chưa xác định';
}

function buildHeadlineVerdict(candidate: Candidate): string {
  if (candidate.hrSummary?.nhan_xet_tong_quan) return normalizeVietnameseDisplay(candidate.hrSummary.nhan_xet_tong_quan);
  if (candidate.stageDecision?.reason) return normalizeVietnameseDisplay(candidate.stageDecision.reason);
  const score = candidateScore(candidate);
  if (score >= 75) return 'Hồ sơ phù hợp tốt với vị trí — đề xuất ưu tiên đưa vào shortlist.';
  if (score >= 60) return 'Ứng viên đáp ứng phần lớn yêu cầu — nên xem xét mời phỏng vấn.';
  if (score >= 40) return 'Ứng viên có tiềm năng, còn một số điểm cần xác nhận thêm.';
  return 'Hồ sơ chưa đáp ứng đủ tiêu chí cốt lõi — cân nhắc trước khi đưa vào shortlist.';
}

function buildTopReasons(candidate: Candidate): string[] {
  const strengths = (candidate.analysis?.['Điểm mạnh CV'] || []).slice(0, 3);
  const matched = (candidate.jdCvMatchInsights?.matchedSkills || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...strengths, ...matched]) {
    const key = normalizeVietnameseDisplay(item).toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push(normalizeVietnameseDisplay(item)); }
    if (out.length >= 3) break;
  }
  return out;
}

function buildVerificationRisks(candidate: Candidate): string[] {
  const weaknesses = (candidate.analysis?.['Điểm yếu CV'] || []).slice(0, 2);
  const warnings = (candidate.softFilterWarnings || []).slice(0, 2);
  const missing = (candidate.jdCvMatchInsights?.missingRequirements || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...weaknesses, ...warnings, ...missing]) {
    const key = normalizeVietnameseDisplay(item).toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push(normalizeVietnameseDisplay(item)); }
    if (out.length >= 3) break;
  }
  return out;
}

type ActionResult = { label: string; colorClass: string; bgClass: string };
function buildSuggestedNextAction(score: number, riskCount: number): ActionResult {
  if (score >= 75 && riskCount === 0) return { label: 'Mời phỏng vấn', colorClass: 'text-[#34c759]', bgClass: 'bg-[#f0fff4] border-[#34c759]/30' };
  if (score >= 60 || riskCount <= 1) return { label: 'Phỏng vấn xác minh', colorClass: 'text-[#ff9f0a]', bgClass: 'bg-[#fff8ec] border-[#ff9f0a]/30' };
  return { label: 'Chưa ưu tiên shortlist', colorClass: 'text-[#86868b]', bgClass: 'bg-[#f5f5f7] border-[#d2d2d7]' };
}

// ── StatsPane ────────────────────────────────────────────────────────────────
const CRITERIA_COLOR: Record<string, string> = {
  'Phù hợp JD (Job Fit)': '#007aff',
  'Kinh nghiệm': '#34c759',
  'Kỹ năng': '#af52de',
  'Thành tựu/KPI': '#ff9f0a',
  'Học vấn': '#5ac8fa',
  'Ngôn ngữ': '#ff6b35',
  'Chuyên nghiệp': '#30b0c7',
  'Gắn bó & Lịch sử CV': '#a2845e',
  'Phù hợp văn hoá': '#ff2d55',
};

const StatsPane: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const score = candidateScore(candidate);
  const grade = candidate.analysis?.['Hạng'] || 'C';
  const criteria = useMemo(() => {
    const raw = candidate.analysis?.['Chi tiết'] || [];
    return raw.map((item) => ({
      name: item['Tiêu chí'],
      score: parseInt(item['Điểm'].split('/')[0], 10) || 0,
      color: CRITERIA_COLOR[item['Tiêu chí']] || '#6e6e73',
    }));
  }, [candidate.analysis]);

  const jdMatchPct = candidate.jdCvMatchInsights
    ? Math.round(candidate.jdCvMatchInsights.similarity * 1000) / 10
    : null;
  const gradeColor = grade === 'A' ? '#34c759' : grade === 'B' ? '#007aff' : '#ff3b30';
  const scoreColor = score >= 75 ? '#34c759' : score >= 60 ? '#007aff' : score >= 40 ? '#ff9f0a' : '#ff3b30';

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Top widgets */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73] mb-1">Tổng điểm</p>
          <p className="text-[28px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{score.toFixed(0)}</p>
          <p className="text-[10px] text-[#86868b] mt-0.5">/100</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73] mb-1">Hạng</p>
          <p className="text-[28px] font-black leading-none" style={{ color: gradeColor }}>{grade}</p>
          <p className="text-[10px] text-[#86868b] mt-0.5">{grade === 'A' ? 'Xuất sắc' : grade === 'B' ? 'Khá' : 'Cần xem xét'}</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73] mb-1">JD Match</p>
          <p className="text-[28px] font-black tabular-nums leading-none text-[#007aff]">
            {jdMatchPct !== null ? `${jdMatchPct.toFixed(0)}%` : '--'}
          </p>
          <p className="text-[10px] text-[#86868b] mt-0.5">Semantic</p>
        </div>
      </div>

      {/* Criteria progress bars */}
      {criteria.length > 0 && (
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-5 py-4">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">Phân tích từng tiêu chí</p>
          <div className="space-y-3.5">
            {criteria.map((criterion) => (
              <div key={criterion.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-[#1d1d1f]">{criterion.name}</span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: criterion.color }}>{criterion.score}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f2f2f7]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${criterion.score}%`, backgroundColor: criterion.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths chips */}
      {(candidate.analysis?.['Điểm mạnh CV'] || []).length > 0 && (
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-5 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#34c759]">
            <Star size={12} /> Điểm nổi bật
          </p>
          <div className="flex flex-wrap gap-2">
            {(candidate.analysis?.['Điểm mạnh CV'] || []).map((item, i) => (
              <span key={i} className="rounded-full border border-[#d1f5d3] bg-[#f0fff1] px-3 py-1 text-[12px] font-medium text-[#1a7f37]">{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── SchedulePane ─────────────────────────────────────────────────────────────
interface ScheduledInterview {
  id: string;
  date: string;
  time: string;
  type: string;
  note: string;
  createdAt: number;
}

const INTERVIEW_TYPES = [
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'onsite', label: 'Trực tiếp' },
];

const SchedulePane: React.FC<{ candidate: Candidate; recruiterInfo?: RecruiterInfo; jobPosition: string }> = ({ candidate, recruiterInfo, jobPosition }) => {
  const storageKey = `schedule:${candidate.id}`;
  const firestoreDocId = `${auth.currentUser?.uid ?? 'anon'}_${candidate.id}`;
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('video');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<ScheduledInterview[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [draftForScheduleId, setDraftForScheduleId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      // Load from Firestore if logged in, else localStorage
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const snap = await getDoc(doc(db, 'candidateSchedules', firestoreDocId));
          if (snap.exists()) {
            setSaved((snap.data().schedules as ScheduledInterview[]) || []);
            return;
          }
        } catch { /* fall through to localStorage */ }
      }
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setSaved(JSON.parse(raw) as ScheduledInterview[]);
      } catch { /* ignore */ }
    };
    void load();
  }, [storageKey, firestoreDocId]);

  const persist = (list: ScheduledInterview[]) => {
    setSaved(list);
    localStorage.setItem(storageKey, JSON.stringify(list));
    const uid = auth.currentUser?.uid;
    if (uid) {
      void setDoc(
        doc(db, 'candidateSchedules', firestoreDocId),
        { uid, candidateId: candidate.id, candidateName: candidate.candidateName, schedules: list, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
  };

  const handleDraftEmail = async (item: ScheduledInterview) => {
    setEmailLoading(true);
    setEmailDraft('');
    setDraftForScheduleId(item.id);
    const dateFormatted = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.date));
    const typeLabel = INTERVIEW_TYPES.find((t) => t.value === item.type)?.label || item.type;
    const senderName = recruiterInfo?.title && recruiterInfo?.company
      ? `${recruiterInfo.title} tại ${recruiterInfo.company}`
      : 'bộ phận tuyển dụng';
    const sig = recruiterInfo?.emailSignature || [
      recruiterInfo?.title, recruiterInfo?.company, recruiterInfo?.phone,
    ].filter(Boolean).join(' | ');
    const prompt = [
      `Soạn email mời phỏng vấn bằng tiếng Việt, lịch sự và chuyên nghiệp.`,
      `Người gửi: ${senderName}${recruiterInfo?.phone ? ', SĐT: ' + recruiterInfo.phone : ''}.`,
      `Ứng viên: ${candidate.candidateName}, ứng tuyển vị trí ${jobPosition}.`,
      `Lịch phỏng vấn: ${dateFormatted}, lúc ${item.time}, hình thức ${typeLabel}.`,
      item.note ? `Ghi chú thêm: ${item.note}.` : '',
      sig ? `Chữ ký người gửi:\n${sig}` : '',
      `Chỉ trả về nội dung email hoàn chỉnh (subject + body), không giải thích thêm.`,
    ].filter(Boolean).join('\n');
    try {
      const { apiPost } = await import('@/services/api/renderClient');
      const response = await (apiPost as (path: string, body: unknown) => Promise<{ text?: string; responseText?: string }>)(
        '/api/gemini-chat',
        { model: 'gemini-2.0-flash', contents: prompt, config: { temperature: 0.4, maxOutputTokens: 800 } }
      );
      setEmailDraft(response.text || response.responseText || '');
    } catch {
      setEmailDraft('Không thể kết nối AI. Vui lòng thử lại.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSave = () => {
    if (!date) return;
    const entry: ScheduledInterview = { id: `${Date.now()}`, date, time, type, note, createdAt: Date.now() };
    const newList = [entry, ...saved];
    persist(newList);
    setDate('');
    setNote('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    // Đồng thời soạn email mời phỏng vấn
    void handleDraftEmail(entry);
  };

  const handleDelete = (id: string) => {
    persist(saved.filter((item) => item.id !== id));
    if (draftForScheduleId === id) { setEmailDraft(''); setDraftForScheduleId(null); }
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(emailDraft);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleMailto = () => {
    const lines = emailDraft.split('\n');
    const subjectLine = lines.find((l) => l.toLowerCase().startsWith('subject:') || l.toLowerCase().startsWith('tiêu đề:'));
    const subject = subjectLine ? subjectLine.replace(/^(subject|tiêu đề):\s*/i, '') : `Mời phỏng vấn — ${jobPosition}`;
    const body = emailDraft;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const inputCls = 'w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15';

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      <div className="rounded-2xl border border-[#d2d2d7] bg-white px-5 py-4">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">
          <CalendarDays size={13} /> Đặt lịch phỏng vấn
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#6e6e73]">Ngày</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#6e6e73]">Giờ</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#6e6e73]">Hình thức</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {INTERVIEW_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#6e6e73]">Ghi chú</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Phòng họp, link Zoom..." className={inputCls} />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!date}
          className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-40"
          style={{ backgroundColor: date ? '#007aff' : '#86868b' }}
        >
          {justSaved ? '✓ Đã lưu — đang soạn email…' : 'Lưu lịch & Soạn email mời'}
        </button>
      </div>

      {saved.length > 0 && (
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-5 py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">Lịch đã đặt</p>
          <div className="space-y-3">
            {saved.map((item) => (
              <div key={item.id}>
                <div className="flex items-start justify-between gap-3 rounded-xl border border-[#f2f2f7] bg-[#f8f8fa] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1d1d1f]">
                      {new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.date))}
                      {' · '}{item.time}
                      {' · '}<span className="text-[#007aff]">{INTERVIEW_TYPES.find((t) => t.value === item.type)?.label}</span>
                    </p>
                    {item.note && <p className="mt-0.5 text-[12px] text-[#6e6e73]">{item.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => void handleDraftEmail(item)}
                      disabled={emailLoading && draftForScheduleId === item.id}
                      className="flex items-center gap-1 rounded-lg border border-[#007aff]/30 bg-[#eef5ff] px-2.5 py-1 text-[11px] font-semibold text-[#007aff] transition hover:bg-[#dceaff] disabled:opacity-50"
                    >
                      <Bot size={11} />
                      {emailLoading && draftForScheduleId === item.id ? 'Đang soạn…' : 'Soạn email'}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-[11px] text-[#ff3b30] hover:underline">Xoá</button>
                  </div>
                </div>

                {draftForScheduleId === item.id && (emailDraft || emailLoading) && (
                  <div className="mt-2 rounded-xl border border-[#d2d2d7] bg-white px-4 py-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6e6e73]">
                      <Bot size={11} className="text-[#007aff]" /> Email do AI soạn
                    </p>
                    {emailLoading ? (
                      <div className="flex items-center gap-2 py-3 text-[13px] text-[#6e6e73]">
                        <span className="flex gap-1">
                          {[0,1,2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#007aff]" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </span>
                        Đang soạn email…
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={emailDraft}
                          onChange={(e) => setEmailDraft(e.target.value)}
                          rows={10}
                          className="w-full resize-none rounded-xl border border-[#e5e5ea] bg-[#f8f8fa] px-3 py-2.5 text-[12.5px] leading-[1.6] text-[#1d1d1f] outline-none focus:border-[#007aff] focus:bg-white"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={handleCopy}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d2d2d7] bg-white py-2 text-[12px] font-semibold text-[#1d1d1f] transition hover:bg-[#f8f8fa]"
                          >
                            <Clipboard size={12} />
                            {emailCopied ? '✓ Đã sao chép' : 'Sao chép'}
                          </button>
                          <button
                            onClick={handleMailto}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#007aff]/30 bg-[#eef5ff] py-2 text-[12px] font-semibold text-[#007aff] transition hover:bg-[#dceaff]"
                          >
                            <Mail size={12} />
                            Mở trong Mail
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── ChatPane ─────────────────────────────────────────────────────────────────
interface ChatMessage { role: 'user' | 'ai'; text: string; }

const CHAT_SUGGESTIONS = [
  'Tạo 5 câu hỏi phỏng vấn phù hợp ứng viên này',
  'Điểm mạnh nào cần khai thác sâu hơn?',
  'Những rủi ro cần xác minh trực tiếp là gì?',
  'So sánh ứng viên này với tiêu chuẩn vị trí',
];

const ChatPane: React.FC<{ candidate: Candidate; jobPosition: string; jdText?: string; recruiterInfo?: RecruiterInfo }> = ({ candidate, jobPosition, jdText, recruiterInfo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const details = (candidate.analysis?.['Chi tiết'] || []).slice(0, 6).map(
      (item) => `  - ${item['Tiêu chí']}: ${item['Điểm']} — ${item['Dẫn chứng'].slice(0, 100)}`
    ).join('\n');
    return [
      `Ứng viên: ${candidate.candidateName}`,
      `Vị trí ứng tuyển: ${jobPosition}`,
      `Chức danh hiện tại: ${candidate.jobTitle || 'Chưa rõ'}`,
      `Tổng điểm: ${candidate.analysis?.['Tổng điểm'] || 0}/100 — Hạng ${candidate.analysis?.['Hạng'] || 'C'}`,
      `Điểm mạnh: ${(candidate.analysis?.['Điểm mạnh CV'] || []).slice(0, 3).join('; ')}`,
      `Điểm cần lưu ý: ${(candidate.analysis?.['Điểm yếu CV'] || []).slice(0, 2).join('; ')}`,
      details ? `Chi tiết tiêu chí:\n${details}` : '',
      jdText ? `Mô tả công việc (trích): ${jdText.slice(0, 300)}` : '',
    ].filter(Boolean).join('\n');
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = buildContext();
      const recruiterCtx = recruiterInfo?.title && recruiterInfo?.company
        ? `Bạn đang hỗ trợ ${recruiterInfo.title} tại ${recruiterInfo.company}${recruiterInfo.department ? `, phòng ${recruiterInfo.department}` : ''}. `
        : '';
      const { apiPost } = await import('@/services/api/renderClient');
      const response = await (apiPost as (path: string, body: unknown) => Promise<{ text?: string; responseText?: string }>)(
        '/api/gemini-chat',
        {
          model: 'gemini-2.0-flash',
          contents: `Bạn là trợ lý tuyển dụng AI chuyên sâu. ${recruiterCtx}Trả lời ngắn gọn bằng tiếng Việt.\n\nThông tin ứng viên:\n${context}\n\nCâu hỏi: ${text}`,
          config: { temperature: 0.4, maxOutputTokens: 600 },
        }
      );
      const aiText = response.text || response.responseText || 'Không có phản hồi từ AI.';
      setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Không thể kết nối AI. Vui lòng thử lại.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {messages.length === 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#d2d2d7] bg-[#f8f8fa] px-4 py-3">
              <Bot size={16} className="text-[#007aff]" />
              <div>
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Tư vấn AI về {normalizeVietnameseDisplay(candidate.candidateName)}</p>
                <p className="text-[11.5px] text-[#6e6e73]">Hỏi bất kỳ điều gì liên quan đến hồ sơ ứng viên này</p>
              </div>
            </div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#86868b]">Gợi ý câu hỏi</p>
            <div className="space-y-2">
              {CHAT_SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} onClick={() => send(suggestion)} className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-2.5 text-left text-[13px] text-[#1d1d1f] transition hover:border-[#007aff] hover:bg-[#eef5ff]">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-[1.55] ${msg.role === 'user' ? 'bg-[#007aff] text-white' : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#86868b]" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#86868b]" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#86868b]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-[#d2d2d7] bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }}
            placeholder="Hỏi về ứng viên này..."
            className="flex-1 rounded-xl border border-[#d2d2d7] bg-[#f8f8fa] px-3.5 py-2 text-[13px] outline-none focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
            disabled={loading}
          />
          <button
            onClick={() => void send(input)}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007aff] text-white transition disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── FeedbackPane ──────────────────────────────────────────────────────────────
const FeedbackPane: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (draft: AnalysisFeedbackDraft) => {
    setIsSubmitting(true);
    try {
      const key = `feedback:${candidate.id}`;
      localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0fff4]">
            <CheckCircle2 size={28} className="text-[#34c759]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">Đã lưu phản hồi</p>
          <p className="mt-1 text-[13px] text-[#6e6e73]">Phản hồi của bạn giúp cải thiện độ chính xác chấm điểm AI.</p>
          <button onClick={() => setSubmitted(false)} className="mt-4 text-[13px] text-[#007aff] hover:underline">Gửi phản hồi khác</button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <MessageSquareText size={15} className="text-[#007aff]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">Phản hồi về chấm điểm AI</p>
      </div>
      <AIFeedbackForm
        candidateId={candidate.id}
        candidateName={normalizeVietnameseDisplay(candidate.candidateName)}
        fileName={candidate.fileName}
        aiScore={candidateScore(candidate)}
        candidateRank={candidate.analysis?.['Hạng']}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => { /* noop */ }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const CandidateAnalysisPane: React.FC<{ candidate: Candidate; scrollable?: boolean }> = ({ candidate, scrollable = true }) => {
  const score = candidateScore(candidate);
  const verdict = buildHeadlineVerdict(candidate);
  const reasons = buildTopReasons(candidate);
  const risks = buildVerificationRisks(candidate);
  const action = buildSuggestedNextAction(score, risks.length);

  const jdMatchPct = candidate.jdCvMatchInsights
    ? Math.round(candidate.jdCvMatchInsights.similarity * 1000) / 10
    : null;
  const hasLocationRisk = candidate.locationMatch === false;
  const detectedLocation = candidate.detectedLocation?.trim() || null;
  const scoreColor = score >= 75 ? '#34c759' : score >= 60 ? '#007aff' : score >= 40 ? '#ff9f0a' : '#ff3b30';

  return (
    <div className={scrollable ? 'custom-scrollbar h-full overflow-y-auto p-4 sm:p-5' : 'p-4 sm:p-5'}>
      {/* ── Verdict card ─────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-sm">
        <div className="px-5 pt-5 pb-3">
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#007aff]">Kết luận nhanh</p>
          <p className="text-[14.5px] font-semibold leading-[1.55] text-[#1d1d1f]">{verdict}</p>
        </div>

        {/* Stats strip + action badge */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#f2f2f7] px-5 py-3">
          <span className="inline-flex items-baseline gap-0.5 rounded-lg bg-[#f2f2f7] px-3 py-1.5">
            <span className="text-[17px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{score.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-[#86868b]">/100</span>
          </span>

          {jdMatchPct !== null && (
            <span className="inline-flex items-baseline gap-1 rounded-lg bg-[#f2f2f7] px-3 py-1.5">
              <span className="text-[10.5px] font-semibold text-[#86868b]">JD</span>
              <span className="text-[15px] font-black tabular-nums leading-none text-[#007aff]">{jdMatchPct.toFixed(0)}%</span>
            </span>
          )}

          {hasLocationRisk && detectedLocation && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff3b30]/20 bg-[#fff5f5] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3b30]" />
              <span className="text-[11px] font-semibold text-[#ff3b30]">{detectedLocation}</span>
            </span>
          )}

          <div className="flex-1" />

          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[12px] font-bold ${action.bgClass} ${action.colorClass}`}>
            <Zap size={12} />
            {action.label}
          </span>
        </div>
      </div>

      {/* ── Evidence 2-column grid ────────────────────────── */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#34c759]">
            <CheckCircle2 size={13} />
            Vì sao nên cân nhắc
          </p>
          {reasons.length > 0 ? (
            <ul className="space-y-2.5">
              {reasons.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3a3a3c]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34c759]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Chưa có điểm nổi bật từ hồ sơ.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#ff9f0a]">
            <TriangleAlert size={13} />
            Điểm cần xác minh
          </p>
          {risks.length > 0 ? (
            <ul className="space-y-2.5">
              {risks.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3a3a3c]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff9f0a]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Không có cảnh báo cần xử lý.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  isLoading,
  loadingMessage,
  results,
  jobPosition,
  jdText,
  weights,
  documentOwner = 'local',
  feedbackByCandidate: externalFeedback,
}) => {
  const { settings } = useUserSettings();
  const recruiterInfo = settings.account.recruiterInfo;
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const sort = params.get('sort') === 'name' ? 'name' : 'score';
  const selectedId = params.get('candidate');
  const tab = (DETAIL_TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview') as DetailTab;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const [showCvPanel, setShowCvPanel] = useState(true);
  const [showEmailNotifier, setShowEmailNotifier] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, Record<string, boolean>>>({});
  const handleToggleCriterion = (candidateId: string, criterion: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [candidateId]: { ...(prev[candidateId] || {}), [criterion]: !(prev[candidateId]?.[criterion] ?? false) },
    }));
  };

  const successful = useMemo(() => results.filter((candidate) => candidate.status === 'SUCCESS'), [results]);
  const feedbackByCandidate = useMemo<Record<string, AnalysisFeedbackRecord>>(() => {
    if (externalFeedback && Object.keys(externalFeedback).length > 0) return externalFeedback;
    return Object.fromEntries(
      successful.map((c) => [c.id, { id: c.id, uid: '', userEmail: '', displayName: '', photoUrl: '', action: 'shortlist' as const }])
    );
  }, [externalFeedback, successful]);
  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filtered = normalized ? successful.filter((candidate) => [candidate.candidateName, candidate.jobTitle, candidate.fileName].some((value) => normalizeVietnameseDisplay(value).toLowerCase().includes(normalized))) : successful;
    return [...filtered].sort((a, b) => sort === 'name'
      ? normalizeVietnameseDisplay(a.candidateName).localeCompare(normalizeVietnameseDisplay(b.candidateName), 'vi')
      : candidateScore(b) - candidateScore(a));
  }, [search, sort, successful]);
  const selected = successful.find((candidate) => candidate.id === selectedId) || visible[0] || null;

  useEffect(() => {
    if (!selectedId && visible[0]?.id && window.innerWidth >= 1280) setParam('candidate', visible[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, visible]);

  if (isLoading) {
    return <SupportHRLoading mode="panel" minHeightClass="min-h-full" label="Support HR" title="Đang phân tích hồ sơ" description={loadingMessage || 'Đang tổng hợp dữ liệu ứng viên.'} stages={[{ label: 'Đọc CV', hint: 'Trích xuất thông tin', tone: 'cyan' }, { label: 'Đối chiếu', hint: 'So khớp tiêu chí', tone: 'violet' }, { label: 'Xếp hạng', hint: 'Chuẩn bị shortlist', tone: 'emerald' }]} />;
  }

  if (!successful.length) {
    return <WorkspaceEmpty title="Chưa có kết quả sàng lọc" description="Nạp CV và hoàn tất phân tích để xem danh sách ứng viên tại đây." />;
  }

  return (
    <section className="flex h-full min-h-0 bg-white text-[#1d1d1f]">
      <aside className={`${selectedId ? 'hidden xl:flex' : 'flex'} min-h-0 w-full shrink-0 flex-col border-r border-[#d2d2d7] bg-white xl:w-[352px]`}>
        <div className="shrink-0 border-b border-[#d2d2d7] p-3">
          <WorkspaceSearch value={search} onChange={(value) => setParam('q', value || null)} placeholder="Tìm ứng viên" />
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#6e6e73]">
            <span>{visible.length} ứng viên</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowEmailNotifier(true)} className="flex items-center gap-1 rounded px-2 py-0.5 text-[#007aff] hover:bg-[#eef5ff]">
                <Mail size={11} />Gửi email
              </button>
              <button type="button" onClick={() => setParam('sort', sort === 'score' ? 'name' : 'score')} className="rounded px-1 py-0.5 hover:bg-[#f2f2f5]">Sắp xếp: {sort === 'score' ? 'Điểm phù hợp' : 'Tên'}</button>
            </div>
          </div>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {visible.map((candidate) => {
            const score = candidateScore(candidate);
            const active = candidate.id === selected?.id;
            return (
              <button key={candidate.id} type="button" onClick={() => setParam('candidate', candidate.id)} className={`flex w-full items-center gap-3 border-b border-[#e5e5ea] px-5 py-4 text-left transition ${active ? 'bg-[#eef5ff] shadow-[inset_2px_0_0_#007aff]' : 'hover:bg-[#f8f8fa]'}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold">
                    {normalizeVietnameseDisplay(candidate.candidateName) || 'Ứng viên chưa xác định'}
                    {(candidate.videoLinks?.length ?? 0) > 0 && (
                      <span title="Có video giới thiệu"><PlayCircle size={13} className="shrink-0 text-rose-400" /></span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-[#6e6e73]">{candidateRole(candidate, jobPosition)}</p>
                </div>
                <ScoreLabel score={score} compact />
                <ChevronRight size={15} className="text-[#86868b]" />
              </button>
            );
          })}
        </div>
        <div className="h-11 shrink-0 border-t border-[#d2d2d7] px-4 py-3 text-[11px] text-[#6e6e73]">Hiển thị {visible.length} / {successful.length} ứng viên</div>
      </aside>

      <div className={`${selectedId ? 'flex' : 'hidden xl:flex'} min-w-0 flex-1 flex-col bg-white`}>
        {selected ? (
          <>
            <header className="shrink-0 border-b border-[#d2d2d7] bg-white">
              <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <button type="button" onClick={() => setParam('candidate', null)} className="apple-toolbar-icon apple-detail-back" aria-label="Quay lại danh sách"><ArrowLeft size={17} /></button>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[16px] font-medium text-[#007aff]">{normalizeVietnameseDisplay(selected.candidateName).split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</div>
                  <div className="min-w-0"><h2 className="truncate text-[24px] font-semibold tracking-[-0.02em]">{normalizeVietnameseDisplay(selected.candidateName)}</h2><p className="mt-1 truncate text-[13px] text-[#6e6e73]">{candidateRole(selected, jobPosition)}</p><div className="mt-1"><ScoreLabel score={candidateScore(selected)} /></div></div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  {(selected.videoLinks?.length ?? 0) > 0 && (
                    <a href={selected.videoLinks![0]} target="_blank" rel="noopener noreferrer" className="apple-toolbar-button !px-2.5 !text-rose-500" title="Xem video giới thiệu"><PlayCircle size={16} /></a>
                  )}
                  {tab === 'overview' && (
                    <button type="button" onClick={() => setShowCvPanel(v => !v)} className="apple-toolbar-button !px-2.5" title={showCvPanel ? 'Ẩn CV' : 'Hiện CV'}>
                      {showCvPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    </button>
                  )}
                </div>
              </div>
              <nav className="flex gap-5 overflow-x-auto px-4 text-[13px] sm:px-6" aria-label="Chi tiết ứng viên">
                {DETAIL_TABS.map((item) => (
                  <button key={item.key} type="button" onClick={() => setParam('tab', item.key)} className={`h-11 shrink-0 border-b-2 px-1 ${tab === item.key ? 'border-[#007aff] font-medium text-[#007aff]' : 'border-transparent text-[#515154] hover:text-[#1d1d1f]'}`}>
                    {item.label}
                  </button>
                ))}
              </nav>
            </header>

            <div className="min-h-0 flex-1">
              {tab === 'stats' ? (
                <StatsPane candidate={selected} />
              ) : tab === 'schedule' ? (
                <SchedulePane candidate={selected} recruiterInfo={recruiterInfo} jobPosition={jobPosition} />
              ) : tab === 'chat' ? (
                <ChatPane candidate={selected} jobPosition={jobPosition} jdText={jdText} recruiterInfo={recruiterInfo} />
              ) : tab === 'feedback' ? (
                <FeedbackPane candidate={selected} />
              ) : (
                /* overview */
                <div className={`grid h-full min-h-0 ${showCvPanel ? 'xl:grid-cols-[minmax(340px,48%)_minmax(0,52%)]' : ''}`}>
                  <div className={`custom-scrollbar min-h-0 overflow-y-auto ${showCvPanel ? 'border-r border-[#d2d2d7]' : ''}`}>
                    <CandidateAnalysisPane candidate={selected} scrollable={false} />
                    <ExpandedContent
                      candidate={selected}
                      expandedCriteria={expandedCriteria}
                      onToggleCriterion={handleToggleCriterion}
                      jdText={jdText}
                      weights={weights}
                      mode="full"
                    />
                  </div>
                  {showCvPanel && <div className="hidden min-h-0 xl:block"><CvDocumentViewer ownerKey={documentOwner} candidate={selected} /></div>}
                </div>
              )}
            </div>
          </>
        ) : <WorkspaceEmpty title="Chọn một ứng viên" description="Chọn hồ sơ trong shortlist để xem phân tích và CV." />}
      </div>

      {showEmailNotifier && (
        <CandidateEmailNotifier
          candidates={successful}
          feedbackByCandidate={feedbackByCandidate}
          jobPosition={jobPosition}
          onClose={() => setShowEmailNotifier(false)}
        />
      )}
    </section>
  );
};

export default AnalysisResults;
