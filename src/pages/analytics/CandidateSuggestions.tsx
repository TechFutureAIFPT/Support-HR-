import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  Check,
  CheckCheck,
  Clock,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import type {
  Candidate,
  CandidateAdviceCard,
  CandidateBrief,
  ChatMessageRecord,
  ChatbotAnalysisContext,
  ChatbotSession,
} from '@/types';
import SelectedCandidatesPage from '@/pages/analytics/SelectedCandidatesPage';
import { ChatbotHistoryService } from '@/services/data-sync/chatbotHistoryService';
import { getActiveAnalysisContext } from '@/services/history-cache/activeAnalysisContext';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  buildCandidateBrief,
  getCandidateRank,
  getCandidateScore,
  getInitials,
} from '@/features/recruiter/candidateDecisionSupport';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import { chatMessageToPlainText, formatChatMessageContent, normalizeChatMessageContent } from '@/utils/chatMessageFormatter';
import '@/pages/analytics/styles/candidate-suggestions.css';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';
const CHATBOT_VIEW_KEY = 'supporthr.view.chatbot';
const WELCOME_MESSAGE = 'Tôi là Candidate Copilot của SupportHR. Hãy hỏi về một ứng viên cụ thể, hoặc yêu cầu tôi so sánh shortlist và gợi ý bước tiếp theo.';

const QUICK_ACTIONS = [
  'Ai nên được mời phỏng vấn trước?',
  'Đào sâu ứng viên top 1 giúp tôi.',
  'So sánh nhanh 2 ứng viên nổi bật nhất.',
  'Gợi ý 3 câu hỏi phỏng vấn xác minh cho ứng viên mạnh nhất.',
];

interface CandidateSuggestionsProps {
  candidates: Candidate[];
  jobPosition: string;
}

interface ChatUiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestedCandidateIds: string[];
  candidateCards: CandidateAdviceCard[];
  followUpQuestions: string[];
  suggestedActions: string[];
  focusCandidateId?: string | null;
}

function mapRecordToUi(record: ChatMessageRecord): ChatUiMessage {
  return {
    id: record.id,
    role: record.author === 'bot' ? 'assistant' : 'user',
    content: normalizeChatMessageContent(record.content),
    timestamp: record.timestamp,
    suggestedCandidateIds: record.suggestedCandidateIds || [],
    candidateCards: record.metadata?.candidateCards || [],
    followUpQuestions: record.metadata?.followUpQuestions || [],
    suggestedActions: record.metadata?.suggestedActions || [],
    focusCandidateId: record.metadata?.focusCandidateId || null,
  };
}

const FormattedMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const sections = formatChatMessageContent(content);
  if (!sections.length) return null;
  return (
    <div className="space-y-3 text-sm leading-6">
      {sections.map((section, sectionIndex) => (
        <section key={`${section.heading}-${sectionIndex}`}>
          {section.heading && (
            <h3 className="mb-1 text-[13px] font-semibold text-slate-900">{section.heading}</h3>
          )}
          {section.ordered ? (
            <ol className="list-decimal space-y-1 pl-5 text-slate-700">
              {section.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ol>
          ) : section.heading === 'Kết luận' && section.items.length === 1 ? (
            <p className="text-pretty text-slate-700">{section.items[0]}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-slate-700">
              {section.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
};

function buildAnalysisContext(jobPosition: string): ChatbotAnalysisContext | null {
  const active = getActiveAnalysisContext();
  if (active) {
    return {
      analysisSessionId: active.sessionId,
      historyId: active.historyId,
      syncHistoryId: active.syncHistoryId,
      jdHash: active.jdHash,
      jobPosition: active.jobPosition || jobPosition,
    };
  }

  const storedRun = readLatestAnalysisRun();
  if (!storedRun) return null;
  return {
    analysisSessionId: `analysis-${storedRun.timestamp}`,
    jobPosition: jobPosition || storedRun.job.position,
  };
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function CandidateSuggestions({ candidates, jobPosition }: CandidateSuggestionsProps) {
  const tc = useThemeColors();
  const storedRun = useMemo(() => readLatestAnalysisRun(), []);
  const effectiveCandidates = useMemo(
    () => (candidates.length > 0 ? candidates : storedRun?.candidates || []).filter((candidate) => candidate.status === 'SUCCESS'),
    [candidates, storedRun]
  );
  const effectiveJobPosition = jobPosition || storedRun?.job.position || '';
  const candidateBriefs = useMemo<CandidateBrief[]>(
    () => effectiveCandidates.map(buildCandidateBrief),
    [effectiveCandidates]
  );
  const analysisContext = useMemo(() => buildAnalysisContext(effectiveJobPosition), [effectiveJobPosition]);

  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatbotSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chatbot' | 'selected'>(() => {
    if (typeof window === 'undefined') return 'chatbot';
    return window.localStorage.getItem(CHATBOT_VIEW_KEY) === 'selected' ? 'selected' : 'chatbot';
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const raw = window.localStorage.getItem(SELECTED_IDS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const initRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const persistSelectedIds = useCallback((next: Set<string>) => {
    try {
      window.localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // Local UX only.
    }
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const createdId = await ChatbotHistoryService.createSession({
      jobPosition: effectiveJobPosition,
      totalCandidates: effectiveCandidates.length,
      analysisContext,
      candidateBriefs,
    });
    setSessionId(createdId);
    return createdId;
  }, [analysisContext, candidateBriefs, effectiveCandidates.length, effectiveJobPosition, sessionId]);

  const loadPastSessions = useCallback(async () => {
    const sessions = await ChatbotHistoryService.getUserSessions(20);
    setPastSessions(sessions);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHATBOT_VIEW_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (initRef.current || !effectiveJobPosition) return;
    initRef.current = true;

    const init = async () => {
      try {
        const existing = await ChatbotHistoryService.findRecentSession(effectiveJobPosition);
        if (existing?.id) {
          setSessionId(existing.id);
          if (existing.messages.length > 0) {
            setMessages(existing.messages.map(mapRecordToUi));
            return;
          }
        }
      } catch {
        // Continue with empty welcome state.
      }

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: Date.now(),
          suggestedCandidateIds: [],
          candidateCards: [],
          followUpQuestions: [],
          suggestedActions: [],
          focusCandidateId: null,
        },
      ]);
    };

    void init();
  }, [effectiveJobPosition]);

  useEffect(() => {
    const handleTopbarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === 'chatbot') {
        setActiveTab('chatbot');
      } else if (action === 'selected') {
        setActiveTab('selected');
        setShowHistory(false);
      } else if (action === 'history') {
        setActiveTab('chatbot');
        setShowHistory((current) => {
          if (!current) void loadPastSessions();
          return !current;
        });
      }
    };
    window.addEventListener('supporthr:chatbot-action', handleTopbarAction);
    return () => window.removeEventListener('supporthr:chatbot-action', handleTopbarAction);
  }, [loadPastSessions]);

  const handleToggleSelect = useCallback((candidateId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      persistSelectedIds(next);
      return next;
    });
  }, [persistSelectedIds]);

  const handleCopy = useCallback((text: string, id: string) => {
    void navigator.clipboard.writeText(chatMessageToPlainText(text));
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }, []);

  const handleRestoreSession = useCallback((session: ChatbotSession) => {
    if (!session.id) return;
    setSessionId(session.id);
    setMessages(session.messages.map(mapRecordToUi));
    setActiveTab('chatbot');
    setShowHistory(false);
  }, []);

  const handleStartFresh = useCallback(async () => {
    const createdId = await ChatbotHistoryService.createSession({
      jobPosition: effectiveJobPosition,
      totalCandidates: effectiveCandidates.length,
      analysisContext,
      candidateBriefs,
    });
    setSessionId(createdId);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: Date.now(),
        suggestedCandidateIds: [],
        candidateCards: [],
        followUpQuestions: [],
        suggestedActions: [],
        focusCandidateId: null,
      },
    ]);
    setInput('');
    setShowHistory(false);
  }, [analysisContext, candidateBriefs, effectiveCandidates.length, effectiveJobPosition]);

  const handleSend = useCallback(async (
    rawMessage: string,
    options?: { focusCandidateId?: string | null; selectedCandidateIds?: string[] }
  ) => {
    const message = rawMessage.trim();
    if (!message || isLoading) return;

    const optimisticUser: ChatUiMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
      suggestedCandidateIds: options?.selectedCandidateIds || [],
      candidateCards: [],
      followUpQuestions: [],
      suggestedActions: [],
      focusCandidateId: options?.focusCandidateId || null,
    };

    setMessages((previous) => [...previous, optimisticUser]);
    setInput('');
    setIsLoading(true);

    try {
      const activeSessionId = await ensureSession();
      if (!activeSessionId) throw new Error('Không thể tạo phiên chatbot.');

      const reply = await ChatbotHistoryService.replyToSession(activeSessionId, {
        message,
        selectedCandidateIds: options?.selectedCandidateIds || Array.from(selectedIds).slice(0, 3),
        focusCandidateId: options?.focusCandidateId || null,
        candidateBriefs,
      });

      setMessages((previous) => {
        const withoutOptimistic = previous.filter((item) => item.id !== optimisticUser.id);
        return [...withoutOptimistic, mapRecordToUi(reply.userMessage), mapRecordToUi(reply.assistantMessage)];
      });
      setSessionId(activeSessionId);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Không thể lấy tư vấn từ copilot.';
      setMessages((previous) => [
        ...previous,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `- Kết luận nhanh: ${messageText}`,
          timestamp: Date.now(),
          suggestedCandidateIds: [],
          candidateCards: [],
          followUpQuestions: [],
          suggestedActions: [],
          focusCandidateId: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [candidateBriefs, ensureSession, isLoading, selectedIds]);

  const isWelcomeState = messages.length <= 1 && messages[0]?.id === 'welcome';

  if (effectiveCandidates.length === 0) {
    return (
      <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-4 text-center" style={{ background: tc.pageBg }}>
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: tc.cardBg }}>
          <Bot className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-[18px] font-bold" style={{ color: tc.textPrimary }}>Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: tc.textMuted }}>
          Hãy chạy phân tích CV trước khi dùng Candidate Copilot.
        </p>
      </div>
    );
  }

  return (
    <div className="feature-page-shell chatbot-page-shell flex h-full flex-col overflow-hidden" style={{ background: tc.pageBg }}>
      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        {activeTab === 'chatbot' ? (
          <div className="flex h-full w-full relative">
            {showHistory && (
              <div
                className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l animate-slide-in-right sm:w-72 md:w-80"
                style={{ background: tc.pageBg, borderColor: tc.borderColor, boxShadow: '-8px 0 40px rgba(0,0,0,0.09)' }}
              >
                <div className="flex items-center justify-between border-b px-4 py-3.5" style={{ borderColor: tc.borderColor }}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <h4 className="text-[13px] font-bold" style={{ color: tc.textPrimary }}>Lịch sử copilot</h4>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100" style={{ color: tc.textMuted }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="border-b px-4 py-3" style={{ borderColor: tc.borderColor }}>
                  <button
                    onClick={() => void handleStartFresh()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> Phiên mới
                  </button>
                </div>

                <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
                  {pastSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-12 text-center">
                      <MessageSquare className="mb-3 h-8 w-8" style={{ color: tc.textMuted }} />
                      <p className="text-[12px]" style={{ color: tc.textMuted }}>Chưa có phiên nào.</p>
                    </div>
                  ) : (
                    pastSessions.map((session) => {
                      const isActive = session.id === sessionId;
                      const focusName = session.candidateBriefs?.find((item) => item.id === session.lastFocusCandidateId)?.candidateName;
                      const lastMessage = session.messages[session.messages.length - 1];
                      return (
                        <div
                          key={session.id}
                          onClick={() => handleRestoreSession(session)}
                          className={`group relative cursor-pointer rounded-xl border px-3 py-2.5 transition-all ${isActive ? 'border-blue-200 bg-blue-50/70' : 'hover:border-slate-200 hover:bg-slate-50'}`}
                          style={isActive ? {} : { borderColor: tc.borderSoft, background: tc.pageBg }}
                        >
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <p className={`truncate text-[12px] font-semibold ${isActive ? 'text-blue-700' : ''}`} style={isActive ? {} : { color: tc.textPrimary }}>
                              {session.sessionTitle}
                            </p>
                            <span className="pt-0.5 text-[10px]" style={{ color: tc.textMuted }}>{formatDate(session.lastMessageAt)}</span>
                          </div>
                          <p className="truncate text-[11px]" style={{ color: tc.textMuted }}>
                            {focusName ? `Focus: ${normalizeVietnameseDisplay(focusName)}` : `${session.messages.length} tin nhắn`}
                          </p>
                          {lastMessage && (
                            <p className="mt-1 truncate text-[11px]" style={{ color: tc.textMuted }}>
                              {lastMessage.author === 'user' ? 'Bạn: ' : 'Copilot: '}{lastMessage.content}
                            </p>
                          )}
                          {!isActive && (
                            <button
                              onClick={async (event) => {
                                event.stopPropagation();
                                if (!session.id) return;
                                await ChatbotHistoryService.deleteSession(session.id);
                                setPastSessions((previous) => previous.filter((item) => item.id !== session.id));
                              }}
                              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md text-red-400 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {!isWelcomeState && (
                <div className="shrink-0 border-b px-4 py-2.5" style={{ borderColor: tc.borderColor, background: tc.pageBg }}>
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {QUICK_ACTIONS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => void handleSend(prompt)}
                        disabled={isLoading}
                        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                      >
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {isWelcomeState ? (
                  <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                      <Bot className="h-8 w-8" />
                    </div>
                    <h2 className="text-[22px] font-bold" style={{ color: tc.textPrimary }}>Candidate Copilot</h2>
                    <p className="mt-2 max-w-xl text-[14px] leading-6" style={{ color: tc.textSecondary }}>
                      {WELCOME_MESSAGE}
                    </p>
                    <div className="mt-7 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {QUICK_ACTIONS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => void handleSend(prompt)}
                          disabled={isLoading}
                          className="rounded-2xl border p-4 text-left transition-all hover:border-blue-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
                        >
                          <p className="text-[13px] font-semibold" style={{ color: tc.textPrimary }}>{prompt}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                    {messages.map((message) => {
                      const isAssistant = message.role === 'assistant';
                      return (
                        <div
                          key={message.id}
                          className={`${isAssistant ? 'w-full' : 'ml-auto max-w-[70%]'} min-w-0`}
                        >
                          <div
                            className="rounded-lg border p-4"
                            style={{
                              background: isAssistant ? tc.cardBg : '#0f6fff',
                              borderColor: isAssistant ? tc.borderSoft : '#0f6fff',
                              color: isAssistant ? tc.textPrimary : '#fff',
                            }}
                          >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-2xl ${isAssistant ? 'bg-blue-50 text-blue-600' : 'bg-white/15 text-white'}`}>
                                {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-[12px] font-semibold">{isAssistant ? 'Candidate Copilot' : 'Bạn'}</p>
                                <p className="text-[11px] opacity-70">{new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopy(message.content, message.id)}
                              className={`flex size-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isAssistant ? 'hover:bg-slate-50' : 'hover:bg-white/10'}`}
                              style={{ borderColor: isAssistant ? tc.borderSoft : 'rgba(255,255,255,0.2)' }}
                              aria-label="Sao chép nội dung"
                            >
                              {copiedId === message.id ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>

                          {isAssistant ? (
                            <FormattedMessageContent content={message.content} />
                          ) : (
                            <p className="whitespace-pre-wrap text-pretty text-sm leading-6">{normalizeVietnameseDisplay(message.content)}</p>
                          )}
                          </div>

                          {isAssistant && message.candidateCards.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-2 text-xs font-semibold text-slate-500">
                                Ứng viên liên quan
                              </p>
                              <div className="grid gap-3 md:grid-cols-2">
                                {message.candidateCards.map((card) => (
                                  <div key={`${message.id}-${card.id}`} className="rounded-lg border p-3" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[13px] font-black text-blue-600">
                                        {getInitials(card.candidateName)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="truncate text-[14px] font-bold" style={{ color: tc.textPrimary }}>{normalizeVietnameseDisplay(card.candidateName)}</p>
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                            {card.rank} · {card.score.toFixed(1)}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-[12px] leading-5" style={{ color: tc.textSecondary }}>
                                          {normalizeVietnameseDisplay(card.headlineVerdict)}
                                        </p>
                                        {card.focusLabel && (
                                          <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                                            {card.focusLabel}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                      <div className="rounded-lg bg-emerald-50/70 p-2.5">
                                        <p className="mb-1 text-xs font-semibold text-emerald-700">Điểm mạnh</p>
                                        <ul className="space-y-1 text-[12px]" style={{ color: tc.textSecondary }}>
                                          {(card.topStrengths.length > 0 ? card.topStrengths : ['Chưa có evidence nổi bật trong snapshot.']).map((item) => (
                                            <li key={item}>• {normalizeVietnameseDisplay(item)}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="rounded-lg bg-amber-50/70 p-2.5">
                                        <p className="mb-1 text-xs font-semibold text-amber-700">Rủi ro</p>
                                        <ul className="space-y-1 text-[12px]" style={{ color: tc.textSecondary }}>
                                          {(card.topRisks.length > 0 ? card.topRisks : ['Chưa thấy rủi ro lớn từ snapshot hiện tại.']).map((item) => (
                                            <li key={item}>• {normalizeVietnameseDisplay(item)}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        {normalizeVietnameseDisplay(card.recommendedAction)}
                                      </span>
                                      {card.interviewQuestions[0] && (
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                          Có câu hỏi xác minh
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        onClick={() => void handleSend(`Đào sâu ứng viên ${card.candidateName}`, { focusCandidateId: card.id, selectedCandidateIds: [card.id] })}
                                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                      >
                                        Đào sâu
                                      </button>
                                      <button
                                        onClick={() => handleToggleSelect(card.id)}
                                        className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                        style={{ borderColor: tc.borderSoft, color: tc.textSecondary, background: tc.cardBg }}
                                      >
                                        {selectedIds.has(card.id) ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}
                                        {selectedIds.has(card.id) ? 'Đã chọn' : 'Chọn shortlist'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {isAssistant && (message.followUpQuestions.length > 0 || message.suggestedActions.length > 0) && (
                            <div className="mt-4 border-t pt-4" style={{ borderColor: tc.borderSoft }}>
                              {message.followUpQuestions.length > 0 && (
                                <div>
                                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tc.textMuted }}>Hỏi tiếp</p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.followUpQuestions.map((question) => (
                                      <button
                                        key={question}
                                        onClick={() => void handleSend(question, { focusCandidateId: message.focusCandidateId || null, selectedCandidateIds: message.suggestedCandidateIds })}
                                        className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                        style={{ borderColor: tc.borderSoft, color: tc.textSecondary, background: tc.pageBg }}
                                      >
                                        {normalizeVietnameseDisplay(question)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {message.suggestedActions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.suggestedActions.map((action) => (
                                    <span key={action} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                      {normalizeVietnameseDisplay(action)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isLoading && (
                      <div className="flex items-center gap-2 rounded-lg border px-4 py-3" style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        Candidate Copilot đang tổng hợp verdict và bằng chứng...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t px-4 py-3 sm:px-6" style={{ borderColor: tc.borderColor, background: tc.pageBg }}>
                <div className="overflow-hidden rounded-xl border" style={{ background: tc.cardBg, borderColor: tc.borderSoft }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend(input);
                      }
                    }}
                    placeholder="Hỏi về một ứng viên, hoặc yêu cầu copilot so sánh shortlist..."
                    className="min-h-12 max-h-28 w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none"
                    style={{ color: tc.textPrimary }}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                      {selectedIds.size > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {selectedIds.size} ứng viên đã chọn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleStartFresh()}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        style={{ borderColor: tc.borderSoft, color: tc.textSecondary, background: tc.cardBg }}
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                      <button
                        onClick={() => void handleSend(input)}
                        disabled={isLoading || !input.trim()}
                        className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Gửi câu hỏi"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full">
            <SelectedCandidatesPage candidates={effectiveCandidates} jobPosition={effectiveJobPosition} />
          </div>
        )}
      </div>
    </div>
  );
}
