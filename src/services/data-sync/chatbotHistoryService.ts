import { apiDelete, apiGet, apiPost, pickArray, pickObject } from '@/services/api/renderClient';
import type { ChatbotSession, ChatMessageRecord } from '@/types';

const LOCAL_CHATBOT_SESSIONS_KEY = 'supporthr.chatbotSessions.v1';
const MAX_LOCAL_SESSIONS = 50;
const MAX_LOCAL_MESSAGES = 200;

function normalizeMessage(raw: unknown): ChatMessageRecord {
  const message = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    id: String(message.id || ''),
    author: message.author === 'user' ? 'user' : 'bot',
    content: String(message.content || ''),
    timestamp: Number(message.timestamp || Date.now()),
    suggestedCandidateIds: Array.isArray(message.suggestedCandidateIds)
      ? message.suggestedCandidateIds.map((id) => String(id))
      : [],
  };
}

function createSessionTitle(jobPosition: string, totalCandidates: number): string {
  const safeJobPosition = String(jobPosition || 'Hoi thoai AI').trim() || 'Hoi thoai AI';
  return `${safeJobPosition} - ${Number(totalCandidates || 0)} ung vien`;
}

function normalizeSession(raw: unknown): ChatbotSession {
  const session = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const messages = Array.isArray(session.messages) ? session.messages.map(normalizeMessage) : [];
  const normalizedLastMessageAt = Number(session.lastMessageAt || session.last_message_at || 0);
  const fallbackLastMessageAt = messages.length > 0
    ? Number(messages[messages.length - 1]?.timestamp || 0)
    : Date.now();
  const totalCandidates = Number(session.totalCandidates || session.total_candidates || 0);
  const jobPosition = String(session.jobPosition || session.job_position || '');

  return {
    id: session.id ? String(session.id) : undefined,
    uid: String(session.uid || ''),
    email: String(session.email || ''),
    jobPosition,
    totalCandidates,
    sessionTitle: String(session.sessionTitle || session.session_title || jobPosition || createSessionTitle(jobPosition, totalCandidates)),
    messages,
    messageCount: Number(session.messageCount || session.message_count || messages.length || 0),
    createdAt: session.createdAt || Date.now(),
    updatedAt: session.updatedAt || Date.now(),
    lastMessageAt: Number.isFinite(normalizedLastMessageAt) && normalizedLastMessageAt > 0
      ? normalizedLastMessageAt
      : fallbackLastMessageAt,
  };
}

function readLocalSessions(): ChatbotSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_CHATBOT_SESSIONS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeSession).filter((session) => session.id);
  } catch {
    return [];
  }
}

function writeLocalSessions(sessions: ChatbotSession[]): void {
  if (typeof window === 'undefined') return;

  try {
    const normalized = sessions
      .map(normalizeSession)
      .filter((session) => session.id)
      .sort((left, right) => Number(right.lastMessageAt || 0) - Number(left.lastMessageAt || 0))
      .slice(0, MAX_LOCAL_SESSIONS);

    window.localStorage.setItem(LOCAL_CHATBOT_SESSIONS_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore local persistence failures.
  }
}

function mergeSessions(primary: ChatbotSession[], secondary: ChatbotSession[]): ChatbotSession[] {
  const merged = new Map<string, ChatbotSession>();

  [...secondary, ...primary].forEach((session) => {
    if (!session.id) return;
    const current = merged.get(session.id);
    if (!current) {
      merged.set(session.id, normalizeSession(session));
      return;
    }

    const currentMessages = current.messages || [];
    const nextMessages = session.messages || [];
    const chosenMessages = nextMessages.length >= currentMessages.length ? nextMessages : currentMessages;
    const mergedSession = normalizeSession({
      ...current,
      ...session,
      messages: chosenMessages,
      messageCount: Math.max(
        Number(current.messageCount || 0),
        Number(session.messageCount || 0),
        chosenMessages.length,
      ),
      lastMessageAt: Math.max(
        Number(current.lastMessageAt || 0),
        Number(session.lastMessageAt || 0),
        Number(chosenMessages[chosenMessages.length - 1]?.timestamp || 0),
      ),
    });
    merged.set(session.id, mergedSession);
  });

  return Array.from(merged.values()).sort((left, right) => Number(right.lastMessageAt || 0) - Number(left.lastMessageAt || 0));
}

function upsertLocalSession(session: ChatbotSession): ChatbotSession {
  const existing = readLocalSessions();
  const merged = mergeSessions([session], existing);
  writeLocalSessions(merged);
  return merged.find((item) => item.id === session.id) || normalizeSession(session);
}

function updateLocalMessages(sessionId: string, messages: ChatMessageRecord[]): void {
  const existing = readLocalSessions();
  const target = existing.find((session) => session.id === sessionId);
  const currentMessages = target?.messages || [];
  const mergedMessages = [...currentMessages, ...messages]
    .map(normalizeMessage)
    .slice(-MAX_LOCAL_MESSAGES);

  const updated = normalizeSession({
    ...(target || {
      id: sessionId,
      uid: '',
      email: '',
      jobPosition: '',
      totalCandidates: 0,
      sessionTitle: 'Hoi thoai AI',
    }),
    messages: mergedMessages,
    messageCount: mergedMessages.length,
    lastMessageAt: Number(mergedMessages[mergedMessages.length - 1]?.timestamp || Date.now()),
    updatedAt: Date.now(),
  });

  upsertLocalSession(updated);
}

function removeLocalSession(sessionId: string): void {
  const remaining = readLocalSessions().filter((session) => session.id !== sessionId);
  writeLocalSessions(remaining);
}

function normalizeComparableText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/gi, 'd')
    .toLowerCase()
    .trim();
}

export class ChatbotHistoryService {
  static async createSession(params: {
    jobPosition: string;
    totalCandidates: number;
  }): Promise<string | null> {
    try {
      const response = await apiPost<unknown>(
        '/api/account/chatbot/sessions',
        params,
        { authRequired: true }
      );

      const session = pickObject<Record<string, unknown>>(response, ['session', 'data']);
      const sessionId = String(session?.id || (response as Record<string, unknown>)?.id || '');

      if (sessionId) {
        upsertLocalSession(normalizeSession({
          id: sessionId,
          jobPosition: params.jobPosition,
          totalCandidates: params.totalCandidates,
          sessionTitle: createSessionTitle(params.jobPosition, params.totalCandidates),
          messages: [],
          messageCount: 0,
          lastMessageAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
      }

      return sessionId || null;
    } catch {
      const localId = `local-${Date.now()}`;
      upsertLocalSession(normalizeSession({
        id: localId,
        jobPosition: params.jobPosition,
        totalCandidates: params.totalCandidates,
        sessionTitle: createSessionTitle(params.jobPosition, params.totalCandidates),
        messages: [],
        messageCount: 0,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      return localId;
    }
  }

  static async addMessage(sessionId: string, message: ChatMessageRecord): Promise<boolean> {
    await this.addMessages(sessionId, [message]);
    return true;
  }

  static async addMessages(
    sessionId: string,
    messages: ChatMessageRecord[]
  ): Promise<boolean> {
    updateLocalMessages(sessionId, messages);

    if (sessionId.startsWith('local-')) {
      return true;
    }

    await apiPost(
      `/api/account/chatbot/sessions/${encodeURIComponent(sessionId)}/messages`,
      { messages },
      { authRequired: true }
    );
    return true;
  }

  static async getUserSessions(limitCount: number = 20): Promise<ChatbotSession[]> {
    const localSessions = readLocalSessions();

    try {
      const response = await apiGet<unknown>(
        `/api/account/chatbot/sessions?limit_count=${limitCount}`,
        { authRequired: true }
      );

      const remoteSessions = pickArray<unknown>(response, ['items', 'sessions', 'entries', 'data']).map(normalizeSession);
      const mergedSessions = mergeSessions(remoteSessions, localSessions).slice(0, limitCount);
      writeLocalSessions(mergedSessions);
      return mergedSessions;
    } catch {
      return localSessions.slice(0, limitCount);
    }
  }

  static async getSession(sessionId: string): Promise<ChatbotSession | null> {
    const localMatch = readLocalSessions().find((session) => session.id === sessionId) || null;
    if (sessionId.startsWith('local-')) {
      return localMatch;
    }

    try {
      const response = await apiGet<unknown>(
        `/api/account/chatbot/sessions/${encodeURIComponent(sessionId)}`,
        { authRequired: true }
      );

      const session = pickObject<Record<string, unknown>>(response, ['session', 'data']);
      const normalized = session ? normalizeSession(session) : normalizeSession(response);
      if (normalized?.id) {
        upsertLocalSession(normalized);
      }
      return normalized;
    } catch {
      return localMatch;
    }
  }

  static async findRecentSession(jobPosition: string): Promise<ChatbotSession | null> {
    const normalizedJobPosition = normalizeComparableText(jobPosition);

    try {
      const response = await apiGet<unknown>(
        `/api/account/chatbot/recent?job_position=${encodeURIComponent(jobPosition)}`,
        { authRequired: true }
      );

      const session = pickObject<Record<string, unknown>>(response, ['session', 'data']);
      if (!session && !response) {
        return readLocalSessions().find((item) => normalizeComparableText(item.jobPosition) === normalizedJobPosition) || null;
      }

      const normalized = normalizeSession(session || response);
      if (normalized?.id) {
        upsertLocalSession(normalized);
      }
      return normalized;
    } catch {
      return readLocalSessions().find((item) => normalizeComparableText(item.jobPosition) === normalizedJobPosition) || null;
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    removeLocalSession(sessionId);

    if (sessionId.startsWith('local-')) {
      return true;
    }

    await apiDelete(`/api/account/chatbot/sessions/${encodeURIComponent(sessionId)}`, {
      authRequired: true,
    });
    return true;
  }

  static async getSessionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    lastSessionTitle: string | null;
    lastSessionDate: Date | null;
  }> {
    const response = await apiGet<Record<string, unknown>>('/api/account/chatbot/stats', {
      authRequired: true,
    });

    const rawDate = response.lastSessionDate || response.last_session_date || null;

    return {
      totalSessions: Number(response.totalSessions || response.total_sessions || 0),
      totalMessages: Number(response.totalMessages || response.total_messages || 0),
      lastSessionTitle: response.lastSessionTitle
        ? String(response.lastSessionTitle)
        : response.last_session_title
          ? String(response.last_session_title)
          : null,
      lastSessionDate: rawDate ? new Date(String(rawDate)) : null,
    };
  }
}
