import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Check, Plus, FileText, Users, Lightbulb, MessageSquare, ArrowUp, X, Copy, CheckCheck, Loader2, Clock } from 'lucide-react';
import type { Candidate, AnalysisRunData, ChatbotSession, ChatMessageRecord } from '@/assets/types';
import { getChatbotAdvice } from '@/services/ai-ml/models/gemini/geminiService';
import SelectedCandidatesPage from '@/components/pages/analytics/SelectedCandidatesPage';
import { ChatbotHistoryService } from '@/services/data-sync/chatbotHistoryService';
import { useThemeColors } from '@/components/ui/theme/useThemeColors';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';

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
    prompt: 'Hãy gợi ý cho tôi danh sách các ứng viên phù hợp nhất dựa trên kết quả lọc CV. Ghi rõ điểm mạnh cốt lõi và đề xuất ít nhất 3 câu hỏi phỏng vấn cho mỗi người để khai thác điểm yếu của họ.',
    icon: Lightbulb,
    color: '#60a5fa',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  {
    label: 'Phân nhóm theo cấp độ',
    prompt: 'Hãy phân nhóm các ứng viên theo cấp độ kinh nghiệm (Junior, Mid, Senior) và so sánh ưu khuyết điểm của từng nhóm.',
    icon: Users,
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  {
    label: 'So sánh top ứng viên',
    prompt: 'So sánh chi tiết top 3 ứng viên hàng đầu về kỹ năng, kinh nghiệm, và mức lương kỳ vọng.',
    icon: MessageSquare,
    color: '#2563eb',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  {
    label: 'Tạo câu hỏi phỏng vấn',
    prompt: 'Dựa trên top ứng viên, hãy tạo danh sách câu hỏi phỏng vấn chuyên sâu cho từng người, bao gồm cả câu hỏi kỹ thuật và hành vi.',
    icon: Sparkles,
    color: '#1d4ed8',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
];

const CandidateSuggestions: React.FC<CandidateSuggestionsProps> = ({ candidates, jobPosition }) => {
  const tc = useThemeColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_IDS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [activeTab, setActiveTab] = useState<'chatbot' | 'selected'>('chatbot');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // History states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatbotSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const sessionInitRef = useRef(false);

  const analysisData: AnalysisRunData = {
    timestamp: Date.now(),
    job: { position: jobPosition, locationRequirement: localStorage.getItem('currentLocation') || '' },
    candidates,
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-create or resume session
  useEffect(() => {
    if (sessionInitRef.current || !jobPosition) return;
    sessionInitRef.current = true;

    const initSession = async () => {
      try {
        const existing = await ChatbotHistoryService.findRecentSession(jobPosition);
        if (existing && existing.id && existing.messages.length > 0) {
          setSessionId(existing.id);
          const restored: Message[] = existing.messages.map(m => ({
            role: m.author === 'bot' ? 'assistant' : 'user',
            content: m.content,
            candidateIds: m.suggestedCandidateIds,
            timestamp: m.timestamp,
          }));
          setMessages(restored);
        } else {
          const newId = await ChatbotHistoryService.createSession({
            jobPosition,
            totalCandidates: candidates?.length || 0,
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
  }, [jobPosition, candidates.length]);

  const loadPastSessions = async () => {
    try {
      const sessions = await ChatbotHistoryService.getUserSessions(20);
      setPastSessions(sessions);
    } catch (e) {
      console.warn('Failed to load past sessions:', e);
    }
  };

  const restoreSession = (session: ChatbotSession) => {
    if (!session.id) return;
    setSessionId(session.id);
    const restored: Message[] = session.messages.map(m => ({
      role: m.author === 'bot' ? 'assistant' : 'user',
      content: m.content,
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

  const exportSelectedToCSV = () => {
    if (selectedIds.size === 0) return;
    const selectedData = candidates.filter(c => selectedIds.has(c.id!));
    const headers = ['STT', 'Họ tên', 'Hạng', 'Điểm tổng', 'Phù hợp JD', 'Chức danh', 'Email', 'SĐT'];
    const csvData = [
      headers.join(','),
      ...selectedData.map((c, index) => [
        index + 1, c.candidateName || '', c.status === 'FAILED' ? 'FAILED' : (c.analysis?.['Hạng'] || 'C'),
        c.status === 'FAILED' ? '0' : String(c.analysis?.['Tổng điểm'] || 0),
        `${c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || 0}%`,
        c.jobTitle || '', c.email || '', c.phone || ''
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ung_vien_duoc_chon_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const formatBold = (str: string) => {
        const parts = str.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="text-blue-300 font-bold">{part.slice(2, -2)}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
        );
      };
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={index} className="ml-5 list-disc marker:text-blue-400 my-1 text-slate-200 leading-relaxed">{formatBold(line.trim().substring(2))}</li>;
      }
      if (/^(\d+\.|\*\*\d+\.)/.test(line.trim())) {
        return <div key={index} className="my-2.5 ml-1 text-blue-300 font-semibold text-sm">{formatBold(line)}</div>;
      }
      if (line.trim() === '') return <div key={index} className="h-2" />;
      return <p key={index} className="text-slate-200 leading-relaxed">{formatBold(line)}</p>;
    });
  };

  const GradeBadge = ({ grade }: { grade?: string }) => {
    if (!grade) return null;
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${grade === 'A' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
        grade === 'B' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
          'bg-blue-500/15 text-blue-400 border border-blue-500/20'
        }`}>Hạng {grade}</span>
    );
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : name.charAt(0).toUpperCase();
  };

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-4 text-center" style={{ background: tc.pageBg }}>
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-sm" style={{ background: tc.cardBg }}>
          <Bot className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold" style={{ color: tc.textPrimary }}>Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: tc.textMuted }}>Vui lòng chạy phân tích CV trước để sử dụng tính năng gợi ý ứng viên AI.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: tc.pageBg }}>
      {/* ── Unified Global Header ─────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4" style={{ background: tc.pageBg, borderColor: tc.borderColor }}>
        {/* Left: Dynamic Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <div className="h-8 w-[3px] rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
          {activeTab === 'chatbot' ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-base font-bold leading-tight tracking-tight" style={{ color: tc.textPrimary }}>Trợ lý tuyển dụng AI</h1>
                <div className="flex items-center gap-2 px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Đang hoạt động</span>
                </div>
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: tc.textAccent }}>
                AI Recruiting Assistant
                {jobPosition && <span className="normal-case tracking-normal ml-2 text-[9px] text-slate-500 font-medium">· {jobPosition}</span>}
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-base font-bold leading-tight tracking-tight" style={{ color: tc.textPrimary }}>Ứng viên đã chọn</h1>
                <div className="flex items-center gap-2 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">{selectedIds.size} ứng viên</span>
                </div>
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: tc.textAccent }}>
                Selected Candidates
                {jobPosition && <span className="normal-case tracking-normal ml-2 text-[9px] text-slate-500 font-medium">· {jobPosition}</span>}
              </p>
            </div>
          )}
        </div>

        {/* Right: View Switcher */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {activeTab === 'chatbot' && (
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadPastSessions(); }}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${showHistory ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'}`}
              title="Lịch sử hội thoại"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center p-1 rounded-lg border" style={{ background: tc.cardBg, borderColor: tc.borderColor }}>
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'chatbot' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Chatbot AI</span><span className="sm:hidden">AI</span>
            </button>
            <button
              onClick={() => setActiveTab('selected')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'selected' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
            >
              <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Đã chọn</span><span className="sm:hidden">Đã chọn</span>
              {selectedIds.size > 0 && (
                <span className={`ml-1 flex h-4 w-4 items-center justify-center rounded-sm text-[9px] ${activeTab === 'selected' ? 'bg-white/25 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                  {selectedIds.size}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        {activeTab === 'chatbot' ? (
          <div className="flex h-full w-full relative">
            {/* History Panel Overlay */}
            {showHistory && (
              <div className="absolute inset-y-0 right-0 w-80 md:w-96 border-l shadow-2xl z-20 flex flex-col animate-slide-in-right" style={{ background: tc.pageBg, borderColor: tc.borderColor }}>
                <div className="flex items-center justify-between p-4 border-b" style={{ background: tc.headerBg, borderColor: tc.borderColor }}>
                  <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: tc.textPrimary }}>
                    <Clock className="w-4 h-4 text-blue-400" />
                    Lịch sử hội thoại
                  </h4>
                  <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-blue-500 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 border-b" style={{ borderColor: tc.borderColor }}>
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
                    className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-4 h-4" /> Hội thoại mới
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {pastSessions.length === 0 ? (
                    <div className="text-center mt-10">
                      <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-xs text-slate-500">Chưa có hội thoại nào được lưu.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pastSessions.map(s => {
                        const isActive = s.id === sessionId;
                        const lastMsg = s.messages?.length > 0 ? s.messages[s.messages.length - 1] : null;
                        return (
                          <div key={s.id} className={`group relative rounded-xl border p-3 cursor-pointer transition-all`} style={{ background: isActive ? tc.cardBg : tc.inputBg, borderColor: isActive ? 'rgba(59,130,246,0.4)' : tc.borderSoft }} onClick={() => restoreSession(s)}>
                            <div className="flex justify-between items-start mb-1.5">
                              <p className={`text-xs font-bold truncate pr-6 ${isActive ? 'text-blue-400' : ''}`} style={{ color: isActive ? '#60a5fa' : tc.textPrimary }}>
                                {s.sessionTitle}
                              </p>
                              <span className="text-[9px] whitespace-nowrap pt-0.5" style={{ color: tc.textMuted }}>
                                {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: tc.cardBg, color: tc.textMuted }}>
                                <MessageSquare className="w-2.5 h-2.5" /> {s.messageCount}
                              </span>
                              {lastMsg && (
                                <p className="text-[10px] truncate" style={{ color: tc.textMuted }}>
                                  {lastMsg.author === 'user' ? 'Bạn: ' : 'AI: '} {lastMsg.content}
                                </p>
                              )}
                            </div>

                            {!isActive && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (s.id) {
                                    await ChatbotHistoryService.deleteSession(s.id);
                                    setPastSessions(prev => prev.filter(p => p.id !== s.id));
                                  }
                                }}
                                className="absolute top-2.5 right-2.5 text-red-500/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Always show the standard chat layout */}
            <div className="flex min-h-0 min-w-0 flex-col flex-1 transition-all duration-300">

              {/* Quick Actions */}
              <div className="shrink-0 px-4 py-3 md:px-6 md:py-3 pb-1 border-b" style={{ background: tc.pageBg, borderColor: tc.borderColor }}>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium border rounded-full transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                      style={{ background: tc.inputBg, borderColor: tc.borderSoft, color: tc.textPrimary }}
                    >
                      <action.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                {messages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  const isExpanded = expandedMsg === i;
                  return (
                    <div key={i} className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      {isUser ? (
                        <div className="max-w-[75%] rounded-[20px] px-5 py-3 shadow-sm" style={{ background: tc.cardBg, color: tc.textPrimary }}>
                          <div className="text-[15px] leading-relaxed">
                            {formatContent(msg.content)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4 max-w-[90%] md:max-w-[85%]">
                          <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center border mt-1 shadow-sm" style={{ background: tc.cardBg2, borderColor: tc.borderColor }}>
                            <Bot className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] leading-relaxed" style={{ color: tc.textPrimary }}>
                              {(msg.content.length > 800 && !isExpanded) ? (
                                <>
                                  {formatContent(msg.content.substring(0, 800) + '...')}
                                  <button
                                    onClick={() => setExpandedMsg(i)}
                                    className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    Đọc tiếp
                                  </button>
                                </>
                              ) : (
                                <>
                                  {formatContent(msg.content)}
                                  {msg.content.length > 800 && isExpanded && (
                                    <button
                                      onClick={() => setExpandedMsg(null)}
                                      className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                      Thu gọn
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Suggested candidates */}
                            {!isUser && msg.candidateIds && msg.candidateIds.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-700/40">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
                                  <p className="text-[11px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    Ứng viên được đề xuất ({msg.candidateIds.length})
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {msg.candidateIds.map(id => {
                                    const c = candidates.find(cand => cand.id === id);
                                    if (!c) return null;
                                    const isSelected = selectedIds.has(id);
                                    return (
                                      <div key={id} className={`flex items-center justify-between gap-3 p-3 border transition-all duration-200 ${isSelected
                                        ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                                        : 'border-slate-700/50 bg-slate-800/30 hover:border-blue-500/30 hover:bg-slate-800/50'
                                        }`}>
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black flex-shrink-0 ${c.analysis?.['Hạng'] === 'A' ? 'bg-blue-500/20 text-blue-400' :
                                            c.analysis?.['Hạng'] === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                              'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {getInitials(c.candidateName || '')}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                              <p className="text-sm font-bold text-white truncate">{c.candidateName}</p>
                                              <GradeBadge grade={c.analysis?.['Hạng']} />
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">{c.jobTitle || 'Chưa rõ chức danh'}</p>
                                            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-300">
                                              <span>Điểm: <span className="font-bold text-white">{c.analysis?.['Tổng điểm']}</span></span>
                                              <span>Cấp: <span className="font-semibold">{c.experienceLevel || '—'}</span></span>
                                              {c.email && <span className="text-blue-400 truncate">{c.email}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleToggleSelect(id!)}
                                          className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-600/20'
                                            : 'bg-slate-700/80 hover:bg-slate-600 text-slate-200 border border-slate-600/40'
                                            }`}
                                        >
                                          {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                          {isSelected ? 'Đã chọn' : 'Chọn'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Message actions */}
                            {!isUser && (
                              <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-slate-700/30">
                                <button
                                  onClick={() => handleCopy(msg.content, `msg-${i}`)}
                                  className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors px-2 py-1 hover:bg-slate-800/50"
                                >
                                  {copiedId === `msg-${i}` ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedId === `msg-${i}` ? 'Đã sao chép' : 'Sao chép'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex w-full justify-start animate-fade-in mb-6">
                    <div className="flex gap-4 max-w-[90%] md:max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex shrink-0 items-center justify-center border border-emerald-500/20 mt-1 shadow-sm">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area (For Chat View) */}
              <div className="shrink-0 px-4 py-4 md:px-6" style={{ background: tc.pageBg }}>
                <div className="relative max-w-4xl mx-auto">
                  <div className="flex flex-col rounded-[24px] border px-4 py-2.5 transition-all" style={{ background: tc.inputBg, borderColor: tc.borderColor }}>
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(input);
                        }
                      }}
                      placeholder="Nhập câu hỏi hoặc yêu cầu về ứng viên..."
                      className="w-full min-h-[44px] max-h-32 bg-transparent text-[15px] focus:outline-none resize-y py-2.5"
                      style={{ color: tc.textPrimary }}
                      disabled={isLoading}
                      rows={1}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                          <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {selectedIds.size} ứng viên đã chọn
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => { if (input.trim()) { handleSend(input); } }}
                        disabled={isLoading || !input.trim()}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                        style={{ background: tc.isDark ? '#e5e7eb' : '#1f2937', color: tc.isDark ? '#000' : '#fff' }}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" strokeWidth={3} />}
                      </button>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      AI có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex h-full w-full">
            <SelectedCandidatesPage candidates={candidates} jobPosition={jobPosition} />
          </div>
        )}
      </div>{/* end wrapper relative */}
    </div>
  );
};

export default CandidateSuggestions;

