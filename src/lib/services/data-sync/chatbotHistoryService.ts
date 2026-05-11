import { apiDelete, apiGet, apiPost, pickArray, pickObject } from '@/lib/services/api/renderClient';
import type { ChatbotSession, ChatMessageRecord } from '@/shared/types';

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

function normalizeSession(raw: unknown): ChatbotSession {
  const session = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    id: session.id ? String(session.id) : undefined,
    uid: String(session.uid || ''),
    email: String(session.email || ''),
    jobPosition: String(session.jobPosition || ''),
    totalCandidates: Number(session.totalCandidates || 0),
    sessionTitle: String(session.sessionTitle || session.jobPosition || ''),
    messages: Array.isArray(session.messages) ? session.messages.map(normalizeMessage) : [],
    messageCount: Number(session.messageCount || 0),
    createdAt: session.createdAt || Date.now(),
    updatedAt: session.updatedAt || Date.now(),
    lastMessageAt: Number(session.lastMessageAt || Date.now()),
  };
}

export class ChatbotHistoryService {
  static async createSession(params: {
    jobPosition: string;
    totalCandidates: number;
  }): Promise<string | null> {
    const response = await apiPost<unknown>(
      '/api/account/chatbot/sessions',
      params,
      { authRequired: true }
    );

    const session = pickObject<Record<string, unknown>>(response, ['session', 'data']);
    return String(session?.id || (response as Record<string, unknown>)?.id || '');
  }

  static async addMessage(sessionId: string, message: ChatMessageRecord): Promise<boolean> {
    await this.addMessages(sessionId, [message]);
    return true;
  }

  static async addMessages(
    sessionId: string,
    messages: ChatMessageRecord[]
  ): Promise<boolean> {
    await apiPost(
      `/api/account/chatbot/sessions/${encodeURIComponent(sessionId)}/messages`,
      { messages },
      { authRequired: true }
    );
    return true;
  }

  static async getUserSessions(limitCount: number = 20): Promise<ChatbotSession[]> {
    const response = await apiGet<unknown>(
      `/api/account/chatbot/sessions?limit_count=${limitCount}`,
      { authRequired: true }
    );

    return pickArray<unknown>(response, ['items', 'sessions', 'entries', 'data']).map(normalizeSession);
  }

  static async getSession(sessionId: string): Promise<ChatbotSession | null> {
    const response = await apiGet<unknown>(
      `/api/account/chatbot/sessions/${encodeURIComponent(sessionId)}`,
      { authRequired: true }
    );

    const session = pickObject<Record<string, unknown>>(response, ['session', 'data']);
    return session ? normalizeSession(session) : normalizeSession(response);
  }

  static async findRecentSession(jobPosition: string): Promise<ChatbotSession | null> {
    const response = await apiGet<unknown>(
      `/api/account/chatbot/recent?job_position=${encodeURIComponent(jobPosition)}`,
      { authRequired: true }
    );

    const session = pickObject<Record<string, unknown>>(response, ['session', 'data']);
    if (!session && !response) return null;
    return normalizeSession(session || response);
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
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
