import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { AnalysisRunData, ChatMessage, ChatbotSession } from '@/types';
import { normalizeChatbotResponseText } from '@/services/screening/frontendScreeningService';
import { analyzeSalary } from '@/services/salary-analysis/salaryAnalysisService';
import { ChatbotHistoryService } from '@/services/data-sync/chatbotHistoryService';
import { buildCandidateBriefs } from '@/utils/candidateBrief';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getSafeErrorMessage } from '@/utils/errorMessages';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

interface ChatbotPanelProps {
  analysisData: AnalysisRunData;
  onClose?: () => void;
}

// --- Intent classification ---
// Returns true only when the query is clearly asking about specific candidates.
// Advisory questions (criteria, interview questions, salary, general advice)
// must never trigger the candidate-name card panel.
function shouldShowCandidates(query: string): boolean {
  const q = query.toLowerCase();

  // Hard advisory patterns → never show candidate cards
  const advisoryPatterns = [
    'tiêu chí', 'yêu cầu', 'kỹ năng cần', 'kinh nghiệm cần', 'bằng cấp',
    'câu hỏi phỏng vấn', 'câu hỏi kỹ thuật', 'câu hỏi nào', 'gợi ý câu hỏi',
    'mức lương', 'lương thị trường', 'thu nhập', 'ngân sách', 'chi phí tuyển',
    'lương', 'salary',
    'xu hướng', 'thị trường lao động', 'phân tích thị trường',
    'làm thế nào', 'như thế nào', 'chiến lược', 'phương pháp', 'quy trình',
    'tư vấn', 'lời khuyên', 'gợi ý chung', 'nên làm gì',
    'phân biệt ứng viên giỏi', 'kỹ năng mềm', 'kỹ năng cứng',
  ];
  if (advisoryPatterns.some(p => q.includes(p))) return false;

  // Explicit candidate-reference patterns → show candidate cards
  const candidatePatterns = [
    'ứng viên nào', 'ai nên', 'ai phù hợp', 'ai tốt hơn', 'ai có',
    'top ', 'xếp hạng', 'so sánh', 'phỏng vấn ai', 'chọn ai', 'tuyển ai',
    'ưu tiên ai', 'ứng viên tốt nhất', 'ứng viên nổi bật', 'ứng viên nổi',
    'ai nên được', 'ai đáp ứng', 'danh sách ứng viên',
  ];
  if (candidatePatterns.some(p => q.includes(p))) return true;

  // Ambiguous → don't show by default (avoids noisy candidate cards)
  return false;
}

const INITIAL_BOT_MSG = 'Chào bạn, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn với danh sách ứng viên này?';

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ analysisData, onClose }) => {
  const tc = useThemeColors();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', author: 'bot', content: INITIAL_BOT_MSG }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatbotSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const sessionInitRef = useRef(false);
  const displayJobPosition = normalizeVietnameseDisplay(analysisData.job.position);
  const displayLocationRequirement = normalizeVietnameseDisplay(analysisData.job.locationRequirement) || 'Việt Nam';

  // Auto-create or resume chatbot session
  useEffect(() => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;

    (async () => {
      try {
        const existing = await ChatbotHistoryService.findRecentSession(analysisData.job.position);
        if (existing && existing.id && existing.messages.length > 0) {
          setSessionId(existing.id);
          const restored: ChatMessage[] = existing.messages.map(m => ({
            id: m.id,
            author: m.author,
            content: m.author === 'bot' ? normalizeChatbotResponseText(m.content) || m.content : m.content,
            timestamp: m.timestamp,
          }));
          setMessages(restored);
          setShowSuggestions(false);
        } else {
          const newId = await ChatbotHistoryService.createSession({
            jobPosition: analysisData.job.position,
            totalCandidates: analysisData.candidates?.length || 0,
            candidateBriefs: buildCandidateBriefs(analysisData.candidates || []),
          });
          setSessionId(newId);
          if (newId) {
            await ChatbotHistoryService.addMessage(newId, {
              id: 'initial', author: 'bot', content: INITIAL_BOT_MSG, timestamp: Date.now(),
            });
          }
        }
      } catch (e) {
        console.warn('Could not init chatbot session:', e);
      }
    })();
  }, [analysisData]);

  const loadPastSessions = useCallback(async () => {
    try { setPastSessions(await ChatbotHistoryService.getUserSessions(20)); }
    catch (e) { console.warn('Failed to load past sessions:', e); }
  }, []);

  const restoreSession = useCallback(async (session: ChatbotSession) => {
    if (!session.id) return;
    setSessionId(session.id);
    setMessages(session.messages.map(m => ({
      id: m.id,
      author: m.author,
      content: m.author === 'bot' ? normalizeChatbotResponseText(m.content) || m.content : m.content,
      timestamp: m.timestamp,
    })));
    setShowSuggestions(false);
    setShowHistory(false);
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      const newId = await ChatbotHistoryService.createSession({
        jobPosition: analysisData.job.position,
        totalCandidates: analysisData.candidates?.length || 0,
        candidateBriefs: buildCandidateBriefs(analysisData.candidates || []),
      });
      setSessionId(newId);
      setMessages([{ id: 'initial', author: 'bot', content: INITIAL_BOT_MSG }]);
      setShowSuggestions(true);
      setShowHistory(false);
      if (newId) {
        await ChatbotHistoryService.addMessage(newId, {
          id: 'initial', author: 'bot', content: INITIAL_BOT_MSG, timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.warn('Failed to create new chat:', e);
    }
  }, [analysisData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Shared query processor — handles salary enrichment + AI response
  const processQuery = useCallback(async (input: string): Promise<{ responseText: string; candidateIds: string[] }> => {
    const salaryKeywords = ['lương', 'salary', 'mức lương', 'thu nhập', 'chi phí tuyển dụng', 'ngân sách'];
    const isSalaryQuery = salaryKeywords.some(kw => input.toLowerCase().includes(kw));

    let activeSessionId = sessionId;
    const candidateBriefs = buildCandidateBriefs(analysisData.candidates || []);
    if (!activeSessionId) {
      activeSessionId = await ChatbotHistoryService.createSession({
        jobPosition: analysisData.job.position,
        totalCandidates: analysisData.candidates?.length || 0,
        candidateBriefs,
      });
      setSessionId(activeSessionId);
    }
    if (!activeSessionId) {
      throw new Error('Không thể tạo phiên chatbot.');
    }

    const reply = await ChatbotHistoryService.replyToSession(activeSessionId, {
      message: input,
      candidateBriefs,
    });
    let responseText = reply.responseText;
    const candidateIds = reply.suggestedCandidateIds || [];

    if (isSalaryQuery) {
      try {
        const salaryResult = await analyzeSalary({
          jobTitle: analysisData.job.position,
          location: analysisData.job.locationRequirement,
        });
        if (salaryResult.marketSalary) {
          const fmt = (n: number) =>
            n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} tỷ`
            : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} triệu`
            : n.toLocaleString('vi-VN');
          responseText += `\n\n📊 **Dữ liệu thị trường (job-salary-data API):**\n`;
          responseText += `• P25: ${fmt(salaryResult.marketSalary.p25)} VNĐ/tháng\n`;
          responseText += `• Trung vị: ${fmt(salaryResult.marketSalary.median)} VNĐ/tháng\n`;
          responseText += `• P75: ${fmt(salaryResult.marketSalary.p75)} VNĐ/tháng\n`;
          responseText += `\n💡 *Dùng "Phân Tích Mức Lương" để xem chi tiết theo từng ứng viên.*`;
        }
      } catch {
        // continue with AI response
      }
    }

    return { responseText, candidateIds };
  }, [analysisData, sessionId]);

  // Shared send handler used by both suggestion clicks and form submit
  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), author: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const { responseText, candidateIds } = await processQuery(input);

      // Only attach candidate cards when the query explicitly asks about specific candidates
      const showCards = shouldShowCandidates(input) && candidateIds.length > 0;
      const suggestedCandidates = showCards
        ? analysisData.candidates
            .filter(c => candidateIds.includes(c.id))
            .map(c => ({ id: c.id, candidateName: c.candidateName, analysis: c.analysis }))
        : undefined;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: 'bot',
        content: responseText,
        suggestedCandidates: suggestedCandidates?.length ? suggestedCandidates : undefined,
      };
      setMessages(prev => [...prev, botMessage]);
      // Không cần persistMessages thủ công nữa — ChatbotHistoryService.replyToSession()
      // đã lưu cả userMessage lẫn assistantMessage phía backend trong 1 request.
    } catch (error) {
      const errMsg = getSafeErrorMessage(error, 'ai');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        author: 'bot',
        content: `Rất tiếc, ${errMsg}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData, isLoading, processQuery]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(userInput);
  }, [sendMessage, userInput]);

  // Build dynamic suggestion chips
  const suggestions = useMemo(() => {
    const cands = analysisData?.candidates || [];
    const jobTitle = displayJobPosition;
    if (!cands.length) {
      return [
        `Ứng viên nào phù hợp nhất với vị trí ${jobTitle}?`,
        `3 ứng viên nào nên ưu tiên phỏng vấn đầu cho ${jobTitle}?`,
        `Điểm yếu quan trọng nào cần lưu ý khi chọn ứng viên cho ${jobTitle}?`,
      ];
    }

    const industryCount: Record<string, number> = {};
    for (const c of cands) {
      const ind = normalizeVietnameseDisplay(c.industry).trim();
      if (ind) industryCount[ind] = (industryCount[ind] || 0) + 1;
    }
    let dominantIndustry = '';
    let max = 0;
    for (const [ind, cnt] of Object.entries(industryCount)) {
      if (cnt > max) { max = cnt; dominantIndustry = ind; }
    }

    return dominantIndustry
      ? [
          `Ứng viên nào nổi bật nhất trong ngành ${dominantIndustry} cho vị trí ${jobTitle}?`,
          `Top 3 ứng viên ngành ${dominantIndustry} nên phỏng vấn đầu và lý do?`,
          `Những rủi ro quan trọng cần chú ý khi chọn ứng viên cho ${jobTitle}?`,
        ]
      : [
          `Ứng viên nào phù hợp nhất với vị trí ${jobTitle}?`,
          `3 ứng viên nào nên ưu tiên phỏng vấn đầu cho ${jobTitle}?`,
          `Điểm yếu quan trọng nào cần lưu ý khi chọn ứng viên cho ${jobTitle}?`,
        ];
  }, [analysisData, displayJobPosition]);

  // ── Message bubble ────────────────────────────────────────────────
  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isBot = message.author === 'bot';
    const displayContent = normalizeVietnameseDisplay(
      isBot ? normalizeChatbotResponseText(message.content) || message.content : message.content
    );
    return (
      <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
        {isBot && (
          <div className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: tc.cardBg2, borderColor: tc.borderColor }}>
            <i className="fa-solid fa-robot text-sky-500" />
          </div>
        )}
        <div
          className="max-w-xs md:max-w-sm lg:max-w-xs px-4 py-2.5 border rounded-xl"
          style={{
            backgroundColor: isBot
              ? tc.cardBg
              : tc.isDark ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.1)',
            borderColor: isBot ? tc.borderColor : 'rgba(14,165,233,0.3)',
            color: tc.textPrimary,
          }}
        >
          <p className="whitespace-pre-line text-sm leading-relaxed">{displayContent}</p>
          {message.suggestedCandidates && message.suggestedCandidates.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-blue-100 pt-3">
              <p className="text-xs font-semibold text-slate-400">Ứng viên liên quan:</p>
              {message.suggestedCandidates.map(c => (
                <div key={c.id} className="rounded-xl border border-blue-100 bg-blue-50/70 p-2 text-xs">
                  <p className="font-bold text-slate-900">{normalizeVietnameseDisplay(c.candidateName)}</p>
                  <p className="text-slate-600">
                    Hạng: {c.analysis?.['Hạng']} · Điểm: {c.analysis?.['Tổng điểm']}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePanelClose = () => {
    if (isMobileSheetOpen) { setIsMobileSheetOpen(false); return; }
    onClose?.();
  };

  // ── History panel ─────────────────────────────────────────────────
  const historyPanel = showHistory && (
    <div
      className="absolute inset-0 z-10 flex flex-col overflow-hidden"
      style={{ background: tc.overlayBg, backdropFilter: 'blur(10px)' }}
    >
      {/* History header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: tc.borderColor }}
      >
        <h4 className="flex items-center gap-2 text-sm font-bold" style={{ color: tc.textPrimary }}>
          <i className="fa-solid fa-clock-rotate-left text-sky-500" />
          Lịch sử hội thoại
        </h4>
        <button
          onClick={() => setShowHistory(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-blue-500"
        >
          <i className="fa-solid fa-times text-sm" />
        </button>
      </div>

      {/* New chat button */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <button
          onClick={() => void handleNewChat()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-600/15 px-3 py-2.5 text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-600/30"
        >
          <i className="fa-solid fa-plus" />
          Hội thoại mới
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 custom-scrollbar">
        {pastSessions.length === 0 ? (
          <div className="flex flex-col items-center pt-10 text-center">
            <i className="fa-solid fa-comments mb-3 block text-3xl text-slate-600" />
            <p className="text-xs text-slate-500">Chưa có lịch sử hội thoại nào</p>
          </div>
        ) : (
          pastSessions.map(s => {
            const isActive = s.id === sessionId;
            const lastMsg = s.messages?.length > 0 ? s.messages[s.messages.length - 1] : null;
            const timeStr = s.lastMessageAt
              ? new Date(s.lastMessageAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={s.id}
                className="group relative rounded-xl border transition-colors"
                style={{
                  background: isActive ? tc.cardBg : tc.inputBg,
                  borderColor: isActive ? 'rgba(14,165,233,0.5)' : tc.borderSoft,
                }}
              >
                <button className="w-full pr-8 text-left" onClick={() => void restoreSession(s)}>
                  <div className="p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p
                        className="max-w-[72%] truncate text-xs font-semibold"
                        style={{ color: isActive ? 'rgb(14,165,233)' : tc.textPrimary }}
                      >
                        {isActive && (
                          <i className="fa-solid fa-circle mr-1.5 align-middle text-[6px] text-sky-500" />
                        )}
                        {normalizeVietnameseDisplay(s.sessionTitle)}
                      </p>
                      <span className="flex-shrink-0 text-[10px]" style={{ color: tc.textMuted }}>
                        {timeStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                        <i className="fa-solid fa-message mr-1 text-[8px]" />
                        {s.messageCount}
                      </span>
                      {lastMsg && (
                        <p className="flex-1 truncate text-[10px] text-slate-400">
                          {lastMsg.author === 'user' ? 'Bạn: ' : 'AI: '}
                          {normalizeVietnameseDisplay(lastMsg.content).slice(0, 48)}…
                        </p>
                      )}
                    </div>
                  </div>
                </button>
                {!isActive && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (s.id) {
                        await ChatbotHistoryService.deleteSession(s.id);
                        setPastSessions(prev => prev.filter(p => p.id !== s.id));
                      }
                    }}
                    className="absolute right-2 top-2 rounded-lg p-1 text-xs text-slate-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                    title="Xóa hội thoại"
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Chat panel ────────────────────────────────────────────────────
  const chatPanel = (
    <div
      className="z-50 flex h-full max-h-[calc(100svh-5rem)] flex-col rounded-t-3xl border shadow-lg md:h-[420px] md:max-h-[72vh] md:rounded-2xl"
      style={{ background: tc.pageBg, borderColor: tc.borderColor }}
    >
      {/* Header */}
      <header
        className="flex shrink-0 items-center justify-between rounded-t-2xl border-b px-4 py-3"
        style={{ background: tc.headerBg, borderColor: tc.borderColor }}
      >
        <h3 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: tc.textPrimary }}>
          <i className="fa-solid fa-robot text-sky-500" />
          Trợ lý Tuyển dụng AI
        </h3>

        <div className="flex items-center gap-1">
          {/* New Chat button */}
          <button
            onClick={() => void handleNewChat()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-sky-500/10 hover:text-sky-400"
            title="Tạo hội thoại mới"
            aria-label="Tạo hội thoại mới"
          >
            <i className="fa-solid fa-pen-to-square text-sm" />
          </button>

          {/* History button */}
          <button
            onClick={() => {
              setShowHistory(v => !v);
              if (!showHistory) void loadPastSessions();
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${showHistory ? 'bg-sky-500/15 text-sky-400' : 'text-slate-400 hover:bg-sky-500/10 hover:text-sky-400'}`}
            title="Lịch sử hội thoại"
            aria-label="Lịch sử hội thoại"
          >
            <i className="fa-solid fa-clock-rotate-left text-sm" />
          </button>

          {(onClose || isMobileSheetOpen) && (
            <button
              onClick={handlePanelClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-blue-600"
              aria-label="Đóng chatbot"
            >
              <i className="fa-solid fa-times text-sm" />
            </button>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="relative flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {historyPanel}

        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

        {isLoading && (
          <div className="flex justify-start gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border"
              style={{ background: tc.cardBg2, borderColor: tc.borderColor }}
            >
              <i className="fa-solid fa-robot text-sky-500" />
            </div>
            <div
              className="flex max-w-xs items-center gap-2 rounded-xl border px-4 py-3"
              style={{ background: tc.cardBg, borderColor: tc.borderColor }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full delay-0" style={{ background: tc.textMuted }} />
              <span className="h-2 w-2 animate-pulse rounded-full delay-150" style={{ background: tc.textMuted }} />
              <span className="h-2 w-2 animate-pulse rounded-full delay-300" style={{ background: tc.textMuted }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer with suggestions + input */}
      <div
        className="shrink-0 rounded-b-2xl border-t p-3"
        style={{ background: tc.headerBg, borderColor: tc.borderColor }}
      >
        {showSuggestions && messages.length === 1 && (
          <div className="mb-3 space-y-3">
            {/* Candidate queries */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: tc.textMuted }}>
                Về ứng viên
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => void sendMessage(s)}
                    className="rounded-full border px-3 py-1.5 text-xs transition-colors"
                    style={{ background: tc.cardBg2, color: tc.textPrimary, borderColor: tc.borderColor }}
                    disabled={isLoading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview criteria queries */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: tc.textMuted }}>
                Tiêu chí &amp; câu hỏi phỏng vấn
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => void sendMessage(`Tiêu chí quan trọng nhất cần có cho vị trí ${displayJobPosition}?`)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 transition-colors hover:bg-violet-100"
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-list-check mr-1" />Tiêu chí cần
                </button>
                <button
                  onClick={() => void sendMessage(`Gợi ý 5 câu hỏi phỏng vấn chính cho vị trí ${displayJobPosition}?`)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 transition-colors hover:bg-violet-100"
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-question-circle mr-1" />Câu hỏi chung
                </button>
                <button
                  onClick={() => void sendMessage(`Câu hỏi kỹ thuật nào phù hợp để đánh giá ứng viên ${displayJobPosition}?`)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 transition-colors hover:bg-emerald-100"
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-cogs mr-1" />Kỹ thuật
                </button>
              </div>
            </div>

            {/* Salary queries */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: tc.textMuted }}>
                Mức lương
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => void sendMessage(`Mức lương thị trường cho vị trí ${displayJobPosition} tại ${displayLocationRequirement} là bao nhiêu?`)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 transition-colors hover:bg-emerald-100"
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-dollar-sign mr-1" />Lương thị trường
                </button>
                <button
                  onClick={() => void sendMessage(`Gợi ý mức lương hợp lý cho các ứng viên top theo kinh nghiệm?`)}
                  className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs text-teal-700 transition-colors hover:bg-teal-100"
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-chart-line mr-1" />Theo cấp độ
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Hỏi AI về ứng viên hoặc tiêu chí tuyển dụng…"
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-600 disabled:opacity-50"
            style={{ background: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? <i className="fa-solid fa-spinner fa-spin" />
              : <i className="fa-solid fa-paper-plane" />
            }
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setIsMobileSheetOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-sky-300/30 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_18px_44px_rgba(14,165,233,0.35)] transition hover:scale-105 md:hidden"
        aria-label="Mở trợ lý tuyển dụng AI"
      >
        <i className="fa-solid fa-robot text-lg" />
      </button>

      {isMobileSheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSheetOpen(false)}
        />
      )}

      <div className={`${isMobileSheetOpen ? 'fixed inset-x-0 bottom-0 top-16 z-50 px-3 pb-3' : 'hidden'} md:static md:block md:p-0`}>
        {chatPanel}
      </div>
    </>
  );
};

export default ChatbotPanel;
