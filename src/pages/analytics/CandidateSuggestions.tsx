import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Check, Plus, FileText, Users, Lightbulb, MessageSquare, ArrowUp, X, Copy, CheckCheck, Loader2, Clock } from 'lucide-react';
import type { Candidate, AnalysisRunData, ChatbotSession, ChatMessageRecord } from '@/types';
import { getChatbotAdvice, normalizeChatbotResponseText } from '@/services/screening/frontendScreeningService';
import SelectedCandidatesPage from '@/pages/analytics/SelectedCandidatesPage';
import { ChatbotHistoryService } from '@/services/data-sync/chatbotHistoryService';
import { useThemeColors } from '@/hooks/useThemeColors';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import '@/pages/analytics/styles/candidate-suggestions.css';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';
const CHATBOT_VIEW_KEY = 'supporthr.view.chatbot';

interface CandidateSuggestionsProps {
  candidates: Candidate[];
  jobPosition: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  candidateIds?: string[];
  timestamp?: number;
}

const QUICK_ACTIONS = [
  {
    label: 'Gợi ý ứng viên tiêu biểu',
    description: 'Danh sách ứng viên phù hợp nhất và câu hỏi phỏng vấn',
    prompt: 'Hãy gợi ý cho tôi danh sách các ứng viên phù hợp nhất dựa trên kết quả lọc CV. Ghi rõ điểm mạnh cốt lõi và đề xuất ít nhất 3 câu hỏi phỏng vấn cho mỗi người để khai thác điểm yếu của họ.',
    icon: Lightbulb,
  },
  {
    label: 'Phân nhóm theo cấp độ',
    description: 'Junior / Mid / Senior — ưu khuyết điểm từng nhóm',
    prompt: 'Hãy phân nhóm các ứng viên theo cấp độ kinh nghiệm (Junior, Mid, Senior) và so sánh ưu khuyết điểm của từng nhóm.',
    icon: Users,
  },
  {
    label: 'So sánh top ứng viên',
    description: 'So sánh chi tiết kỹ năng, kinh nghiệm, mức lương',
    prompt: 'So sánh chi tiết top 3 ứng viên hàng đầu về kỹ năng, kinh nghiệm, và mức lương kỳ vọng.',
    icon: MessageSquare,
  },
  {
    label: 'Tạo câu hỏi phỏng vấn',
    description: 'Bộ câu hỏi kỹ thuật và hành vi chuyên sâu',
    prompt: 'Dựa trên top ứng viên, hãy tạo danh sách câu hỏi phỏng vấn chuyên sâu cho từng người, bao gồm cả câu hỏi kỹ thuật và hành vi.',
    icon: Sparkles,
  },
];

const CandidateSuggestions: React.FC<CandidateSuggestionsProps> = ({ candidates, jobPosition }) => {
  const tc = useThemeColors();
  const storedRun = useMemo(() => readLatestAnalysisRun(), []);
  const effectiveCandidates = useMemo(
    () => candidates.length > 0 ? candidates : storedRun?.candidates || [],
    [candidates, storedRun]
  );
  const effectiveJobPosition = jobPosition || storedRun?.job.position || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_IDS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [activeTab, setActiveTab] = useState<'chatbot' | 'selected'>(() => {
    if (typeof window === 'undefined') return 'chatbot';
    const saved = window.localStorage.getItem(CHATBOT_VIEW_KEY);
    return saved === 'selected' ? 'selected' : 'chatbot';
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatbotSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const sessionInitRef = useRef(false);

  const analysisData: AnalysisRunData = {
    timestamp: Date.now(),
    job: {
      position: effectiveJobPosition,
      locationRequirement: storedRun?.job.locationRequirement || localStorage.getItem('currentLocation') || '',
    },
    candidates: effectiveCandidates,
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    window.localStorage.setItem(CHATBOT_VIEW_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (sessionInitRef.current || !effectiveJobPosition) return;
    sessionInitRef.current = true;

    const initSession = async () => {
      try {
        const existing = await ChatbotHistoryService.findRecentSession(effectiveJobPosition);
        if (existing && existing.id && existing.messages.length > 0) {
          setSessionId(existing.id);
          const restored: Message[] = existing.messages.map(m => ({
            role: m.author === 'bot' ? 'assistant' : 'user',
            content: m.author === 'bot' ? normalizeChatbotResponseText(m.content) || m.content : m.content,
            candidateIds: m.suggestedCandidateIds,
            timestamp: m.timestamp,
          }));
          setMessages(restored);
        } else {
          const newId = await ChatbotHistoryService.createSession({
            jobPosition: effectiveJobPosition,
            totalCandidates: effectiveCandidates.length,
          });
          setSessionId(newId);
          const initialMsg: Message = {
            role: 'assistant',
            content: 'Xin chào! Tôi là **Trợ lý tuyển dụng AI** của Support HR.\n\nTôi có thể giúp bạn:\n• Gợi ý ứng viên phù hợp nhất với JD\n• So sánh chi tiết hồ sơ ứng viên\n• Tạo câu hỏi phỏng vấn chuyên sâu\n• Phân nhóm ứng viên theo cấp độ\n\n**Bắt đầu bằng cách chọn một gợi ý bên dưới hoặc đặt câu hỏi trực tiếp!**',
            timestamp: Date.now(),
          };
          setMessages([initialMsg]);
          if (newId) {
            await ChatbotHistoryService.addMessage(newId, {
              id: 'initial',
              author: 'bot',
              content: initialMsg.content,
              timestamp: initialMsg.timestamp!,
            });
          }
        }
      } catch (e) {
        console.warn('Could not init session:', e);
      }
    };
    initSession();
  }, [effectiveJobPosition, effectiveCandidates.length]);

  const loadPastSessions = async () => {
    try {
      const sessions = await ChatbotHistoryService.getUserSessions(20);
      setPastSessions(sessions);
    } catch (e) {
      console.warn('Failed to load past sessions:', e);
    }
  };

  useEffect(() => {
    const handleTopbarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === 'chatbot') { setActiveTab('chatbot'); return; }
      if (action === 'selected') { setActiveTab('selected'); setShowHistory(false); return; }
      if (action === 'history') {
        setActiveTab('chatbot');
        setShowHistory((current) => {
          if (!current) void loadPastSessions();
          return !current;
        });
      }
    };
    window.addEventListener('supporthr:chatbot-action', handleTopbarAction);
    return () => window.removeEventListener('supporthr:chatbot-action', handleTopbarAction);
  }, []);

  const restoreSession = (session: ChatbotSession) => {
    if (!session.id) return;
    setSessionId(session.id);
    const restored: Message[] = session.messages.map(m => ({
      role: m.author === 'bot' ? 'assistant' : 'user',
      content: m.author === 'bot' ? normalizeChatbotResponseText(m.content) || m.content : m.content,
      candidateIds: m.suggestedCandidateIds,
      timestamp: m.timestamp,
    }));
    setMessages(restored);
    setShowHistory(false);
  };

  const handleSend = async (userMsg: string) => {
    if (!userMsg.trim()) return;
    const userMessage: Message = { role: 'user', content: userMsg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await getChatbotAdvice(analysisData, userMsg);
      const assistantMessage: Message = { role: 'assistant', content: result.responseText, candidateIds: result.candidateIds, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMessage]);

      if (sessionId) {
        await ChatbotHistoryService.addMessages(sessionId, [
          { id: Date.now().toString() + '-u', author: 'user', content: userMsg, timestamp: userMessage.timestamp! },
          { id: Date.now().toString() + '-b', author: 'bot', content: result.responseText, timestamp: assistantMessage.timestamp!, suggestedCandidateIds: result.candidateIds },
        ]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => { setInput(''); handleSend(prompt); };

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      try { localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(n))); } catch { }
      return n;
    });
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatAIContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const formatBold = (str: string) => {
        const parts = str.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold" style={{ color: tc.textPrimary }}>{part.slice(2, -2)}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
        );
      };
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 list-disc my-1 leading-relaxed" style={{ color: tc.textSecondary }}>{formatBold(line.trim().substring(2))}</li>;
      }
      if (/^(\d+\.|\*\*\d+\.)/.test(line.trim())) {
        return <div key={index} className="my-2 font-semibold text-[13px]" style={{ color: tc.textPrimary }}>{formatBold(line)}</div>;
      }
      if (line.trim() === '') return <div key={index} className="h-2" />;
      return <p key={index} className="leading-relaxed" style={{ color: tc.textSecondary }}>{formatBold(line)}</p>;
    });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
      : name.charAt(0).toUpperCase();
  };

  const isWelcomeState = messages.length <= 1 && messages[0]?.role === 'assistant';

  if (!effectiveCandidates || effectiveCandidates.length === 0) {
    return (
      <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-4 text-center" style={{ background: tc.pageBg }}>
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: tc.cardBg }}>
          <Bot className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-[18px] font-bold" style={{ color: tc.textPrimary }}>Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: tc.textMuted }}>
          Vui lòng chạy phân tích CV trước để sử dụng tính năng gợi ý ứng viên AI.
        </p>
      </div>
    );
  }

  return (
    <div className="feature-page-shell chatbot-page-shell flex h-full flex-col overflow-hidden" style={{ background: tc.pageBg }}>
      {/* Hidden header — kept for topbar event compatibility */}
      <div className="chatbot-global-header" style={{ display: 'none' }} />

      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        {activeTab === 'chatbot' ? (
          <div className="flex h-full w-full relative">

            {/* ── History Sidebar Panel ──────────────────────────────── */}
            {showHistory && (
              <div
                className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l animate-slide-in-right sm:w-72 md:w-80"
                style={{
                  background: tc.pageBg,
                  borderColor: tc.borderColor,
                  boxShadow: '-8px 0 40px rgba(0,0,0,0.09)',
                }}
              >
                <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: tc.borderColor }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <h4 className="text-[13px] font-bold" style={{ color: tc.textPrimary }}>Lịch sử hội thoại</h4>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100"
                    style={{ color: tc.textMuted }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-4 py-3 border-b" style={{ borderColor: tc.borderColor }}>
                  <button
                    onClick={async () => {
                      const newId = await ChatbotHistoryService.createSession({
                        jobPosition: analysisData.job.position,
                        totalCandidates: analysisData.candidates?.length || 0,
                      });
                      setSessionId(newId);
                      const initialMsg: Message = {
                        role: 'assistant',
                        content: 'Xin chào! Tôi là **Trợ lý tuyển dụng AI** của Support HR.\n\nTôi có thể giúp bạn:\n• Gợi ý ứng viên phù hợp nhất với JD\n• So sánh chi tiết hồ sơ ứng viên\n• Tạo câu hỏi phỏng vấn chuyên sâu\n• Phân nhóm ứng viên theo cấp độ\n\n**Bắt đầu bằng cách chọn một gợi ý bên dưới hoặc đặt câu hỏi trực tiếp!**',
                        timestamp: Date.now(),
                      };
                      setMessages([initialMsg]);
                      setShowHistory(false);
                      if (newId) {
                        await ChatbotHistoryService.addMessage(newId, {
                          id: 'initial', author: 'bot',
                          content: initialMsg.content, timestamp: initialMsg.timestamp!,
                        });
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Plus className="w-3.5 h-3.5" /> Hội thoại mới
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar space-y-1.5">
                  {pastSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-12 text-center">
                      <MessageSquare className="w-8 h-8 mb-3" style={{ color: tc.textMuted }} />
                      <p className="text-[12px]" style={{ color: tc.textMuted }}>Chưa có hội thoại nào.</p>
                    </div>
                  ) : (
                    pastSessions.map(s => {
                      const isActive = s.id === sessionId;
                      const lastMsg = s.messages?.length > 0 ? s.messages[s.messages.length - 1] : null;
                      return (
                        <div
                          key={s.id}
                          onClick={() => restoreSession(s)}
                          className={`group relative cursor-pointer rounded-xl border px-3 py-2.5 transition-all ${
                            isActive ? 'border-blue-200 bg-blue-50/70' : 'hover:border-slate-200 hover:bg-slate-50'
                          }`}
                          style={isActive ? {} : { borderColor: tc.borderSoft, background: tc.pageBg }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className={`text-[12px] font-semibold truncate ${isActive ? 'text-blue-700' : ''}`}
                              style={isActive ? {} : { color: tc.textPrimary }}
                            >
                              {s.sessionTitle}
                            </p>
                            <span className="text-[10px] shrink-0 pt-0.5" style={{ color: tc.textMuted }}>
                              {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''}
                            </span>
                          </div>
                          {lastMsg && (
                            <p className="text-[11px] truncate" style={{ color: tc.textMuted }}>
                              {lastMsg.author === 'user' ? 'Bạn: ' : 'AI: '}{lastMsg.content}
                            </p>
                          )}
                          {!isActive && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (s.id) {
                                  await ChatbotHistoryService.deleteSession(s.id);
                                  setPastSessions(prev => prev.filter(p => p.id !== s.id));
                                }
                              }}
                              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-md text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── Main Chat Column ─────────────────────────────────── */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">

              {/* Quick action chips — compact, shown only when actively chatting */}
              {!isWelcomeState && (
                <div className="shrink-0 border-b px-4 py-2.5" style={{ borderColor: tc.borderColor, background: tc.pageBg }}>
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {QUICK_ACTIONS.map(action => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: tc.cardBg, borderColor: tc.borderSoft, color: tc.textSecondary }}
                      >
                        <action.icon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Message Area ─────────────────────────────────────── */}
              <div className="chatbot-message-area custom-scrollbar min-h-0 flex-1 overflow-y-auto">

                {/* ── Welcome / empty state ── */}
                {isWelcomeState && (
                  <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
                    {/* Brand mark */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 mb-4">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-[18px] font-bold mb-1.5" style={{ color: tc.textPrimary }}>
                      Trợ lý tuyển dụng AI
                    </h2>
                    <p className="text-[13px] text-center max-w-sm leading-relaxed" style={{ color: tc.textMuted }}>
                      {effectiveJobPosition
                        ? `Đang phân tích ${effectiveCandidates.length} ứng viên cho vị trí "${effectiveJobPosition}"`
                        : `Sẵn sàng phân tích ${effectiveCandidates.length} ứng viên của bạn`}
                    </p>

                    {/* Quick action card grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mt-7">
                      {QUICK_ACTIONS.map(action => (
                        <button
                          key={action.label}
                          onClick={() => handleQuickAction(action.prompt)}
                          disabled={isLoading}
                          className="group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150 hover:border-blue-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                            <action.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold leading-tight" style={{ color: tc.textPrimary }}>
                              {action.label}
                            </p>
                            <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: tc.textMuted }}>
                              {action.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* ── Active message thread ── */}
                {!isWelcomeState && (
                  <div className="px-4 py-5 md:px-6 space-y-5">
                    {messages.map((msg, i) => {
                      const isUser = msg.role === 'user';
                      const isExpanded = expandedMsg === i;
                      const displayContent = normalizeVietnameseDisplay(
                        isUser ? msg.content : normalizeChatbotResponseText(msg.content) || msg.content
                      );
                      const timestamp = msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div key={i} className={`flex w-full animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>

                          {/* ── User bubble ── */}
                          {isUser ? (
                            <div className="flex flex-col items-end max-w-[80%] sm:max-w-[70%]">
                              <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 shadow-sm shadow-blue-600/10">
                                <p className="text-[14px] leading-relaxed text-white whitespace-pre-wrap">{displayContent}</p>
                              </div>
                              {timestamp && (
                                <span className="mt-1 px-1 text-[10px]" style={{ color: tc.textMuted }}>{timestamp}</span>
                              )}
                            </div>
                          ) : (
                            /* ── AI bubble ── */
                            <div className="flex gap-3 max-w-[96%] md:max-w-[88%]">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-500/20 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Content card */}
                                <div
                                  className="rounded-2xl rounded-tl-sm border px-4 py-3.5 shadow-sm"
                                  style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
                                >
                                  <div className="text-[14px] leading-relaxed space-y-0.5">
                                    {(displayContent.length > 800 && !isExpanded) ? (
                                      <>
                                        {formatAIContent(displayContent.substring(0, 800) + '...')}
                                        <button
                                          onClick={() => setExpandedMsg(i)}
                                          className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                          <ChevronDown className="w-3.5 h-3.5" /> Đọc tiếp
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        {formatAIContent(displayContent)}
                                        {displayContent.length > 800 && isExpanded && (
                                          <button
                                            onClick={() => setExpandedMsg(null)}
                                            className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                          >
                                            <ChevronUp className="w-3.5 h-3.5" /> Thu gọn
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Suggested candidates */}
                                  {msg.candidateIds && msg.candidateIds.length > 0 && (
                                    <div className="mt-4 pt-4 border-t" style={{ borderColor: tc.borderSoft }}>
                                      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: tc.textMuted }}>
                                        <User className="w-3 h-3" />
                                        Ứng viên được đề xuất ({msg.candidateIds.length})
                                      </p>
                                      <div className="flex flex-col gap-2">
                                        {msg.candidateIds.map(id => {
                                          const c = effectiveCandidates.find(cand => cand.id === id);
                                          if (!c) return null;
                                          const isSelected = selectedIds.has(id);
                                          const grade = c.analysis?.['Hạng'];
                                          const gradeColor =
                                            grade === 'A' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                            grade === 'B' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                            'text-slate-500 bg-slate-50 border-slate-200';
                                          return (
                                            <div
                                              key={id}
                                              className={`flex flex-col gap-2 rounded-xl border p-3 transition-all sm:flex-row sm:items-center sm:justify-between ${
                                                isSelected ? 'border-blue-200 bg-blue-50/60' : ''
                                              }`}
                                              style={isSelected ? {} : { borderColor: tc.borderSoft, background: tc.pageBg }}
                                            >
                                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-600">
                                                  {getInitials(normalizeVietnameseDisplay(c.candidateName))}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                    <p className="text-[13px] font-bold truncate" style={{ color: tc.textPrimary }}>
                                                      {normalizeVietnameseDisplay(c.candidateName)}
                                                    </p>
                                                    {grade && (
                                                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${gradeColor}`}>
                                                        Hạng {grade}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-[11px] truncate" style={{ color: tc.textMuted }}>
                                                    {normalizeVietnameseDisplay(c.jobTitle) || 'Chưa rõ chức danh'}
                                                  </p>
                                                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px]" style={{ color: tc.textMuted }}>
                                                    <span>Điểm: <span className="font-bold" style={{ color: tc.textPrimary }}>{c.analysis?.['Tổng điểm']}</span></span>
                                                    {c.experienceLevel && <span>{normalizeVietnameseDisplay(c.experienceLevel)}</span>}
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => handleToggleSelect(id!)}
                                                className={`flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all sm:w-auto ${
                                                  isSelected
                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700'
                                                    : 'border hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                                                }`}
                                                style={isSelected ? {} : { borderColor: tc.borderSoft, color: tc.textSecondary, background: tc.cardBg }}
                                              >
                                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                {isSelected ? 'Đã chọn' : 'Chọn'}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Message footer actions */}
                                <div className="flex items-center gap-1 mt-1.5 pl-1">
                                  <button
                                    onClick={() => handleCopy(displayContent, `msg-${i}`)}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors hover:bg-slate-100"
                                    style={{ color: tc.textMuted }}
                                  >
                                    {copiedId === `msg-${i}`
                                      ? <CheckCheck className="w-3 h-3 text-blue-500" />
                                      : <Copy className="w-3 h-3" />
                                    }
                                    {copiedId === `msg-${i}` ? 'Đã sao chép' : 'Sao chép'}
                                  </button>
                                  {timestamp && (
                                    <span className="ml-auto text-[10px]" style={{ color: tc.textMuted }}>{timestamp}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    {isLoading && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-500/20 mt-0.5">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div
                          className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border px-4 py-3.5 shadow-sm"
                          style={{ background: tc.cardBg, borderColor: tc.borderSoft }}
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ── Input Composer ───────────────────────────────────── */}
              <div className="shrink-0 px-4 pb-4 pt-3 md:px-6" style={{ background: tc.pageBg }}>
                <div className="mx-auto max-w-3xl">
                  <div
                    className="overflow-hidden rounded-2xl border shadow-sm transition-shadow focus-within:shadow-md focus-within:border-blue-200"
                    style={{ background: tc.cardBg, borderColor: tc.borderColor }}
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(input);
                        }
                      }}
                      placeholder="Nhập câu hỏi hoặc yêu cầu về ứng viên…"
                      className="w-full min-h-[52px] max-h-36 bg-transparent px-4 pt-3.5 pb-2 text-[14px] focus:outline-none resize-none"
                      style={{ color: tc.textPrimary }}
                      disabled={isLoading}
                      rows={1}
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
                      <button
                        onClick={() => { if (input.trim()) handleSend(input); }}
                        disabled={isLoading || !input.trim()}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isLoading
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                        }
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[11px]" style={{ color: tc.textMuted }}>
                    AI có thể mắc lỗi · Enter để gửi · Shift+Enter xuống dòng
                  </p>
                </div>
              </div>

            </div>{/* end main chat column */}
          </div>
        ) : (
          <div className="flex h-full w-full">
            <SelectedCandidatesPage candidates={effectiveCandidates} jobPosition={effectiveJobPosition} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateSuggestions;
