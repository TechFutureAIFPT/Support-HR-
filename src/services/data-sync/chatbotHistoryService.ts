import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import type { ChatbotSession, ChatMessageRecord } from '@/assets/types';

const CHATBOT_SESSIONS_COLLECTION = 'chatbotSessions';
const MAX_SESSIONS_PER_USER = 100;
const MAX_MESSAGES_PER_SESSION = 200;
const SESSION_EXPIRY_DAYS = 90;

export class ChatbotHistoryService {

  /**
   * Tạo session chatbot mới
   */
  static async createSession(params: {
    jobPosition: string;
    totalCandidates: number;
  }): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const sessionTitle = `${params.jobPosition} - ${params.totalCandidates} ứng viên`;
      const now = Date.now();

      const session: Omit<ChatbotSession, 'id'> = {
        uid: user.uid,
        email: user.email!,
        jobPosition: params.jobPosition,
        totalCandidates: params.totalCandidates,
        sessionTitle,
        messages: [],
        messageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: now,
      };

      const docRef = await addDoc(collection(db, CHATBOT_SESSIONS_COLLECTION), session);

      // Cleanup old sessions
      await this.cleanupOldSessions(user.uid);

      return docRef.id;
    } catch (error) {
      console.error('ChatbotHistoryService.createSession error:', error);
      return null;
    }
  }

  /**
   * Thêm tin nhắn vào session
   */
  static async addMessage(
    sessionId: string,
    message: ChatMessageRecord
  ): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, CHATBOT_SESSIONS_COLLECTION, sessionId);
      const snap = await getDoc(docRef);

      if (!snap.exists() || snap.data()?.uid !== user.uid) return false;

      const currentMessages: ChatMessageRecord[] = snap.data().messages || [];

      // Giới hạn số tin nhắn
      if (currentMessages.length >= MAX_MESSAGES_PER_SESSION) {
        // Xóa tin nhắn cũ nhất, giữ lại tin nhắn mới
        currentMessages.splice(0, currentMessages.length - MAX_MESSAGES_PER_SESSION + 1);
      }

      currentMessages.push(message);

      await updateDoc(docRef, {
        messages: currentMessages,
        messageCount: currentMessages.length,
        updatedAt: serverTimestamp(),
        lastMessageAt: message.timestamp,
      });

      return true;
    } catch (error) {
      console.error('ChatbotHistoryService.addMessage error:', error);
      return false;
    }
  }

  /**
   * Thêm nhiều tin nhắn cùng lúc (user + bot response)
   */
  static async addMessages(
    sessionId: string,
    messages: ChatMessageRecord[]
  ): Promise<boolean> {
    const user = auth.currentUser;
    if (!user || messages.length === 0) return false;

    try {
      const docRef = doc(db, CHATBOT_SESSIONS_COLLECTION, sessionId);
      const snap = await getDoc(docRef);

      if (!snap.exists() || snap.data()?.uid !== user.uid) return false;

      const currentMessages: ChatMessageRecord[] = snap.data().messages || [];
      currentMessages.push(...messages);

      // Trim nếu quá nhiều
      while (currentMessages.length > MAX_MESSAGES_PER_SESSION) {
        currentMessages.shift();
      }

      const lastMsg = messages[messages.length - 1];

      await updateDoc(docRef, {
        messages: currentMessages,
        messageCount: currentMessages.length,
        updatedAt: serverTimestamp(),
        lastMessageAt: lastMsg.timestamp,
      });

      return true;
    } catch (error) {
      console.error('ChatbotHistoryService.addMessages error:', error);
      return false;
    }
  }

  /**
   * Lấy danh sách sessions của user (mới nhất trước)
   */
  static async getUserSessions(limitCount: number = 20): Promise<ChatbotSession[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, CHATBOT_SESSIONS_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as ChatbotSession));
    } catch (error) {
      console.error('ChatbotHistoryService.getUserSessions error:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết 1 session (bao gồm messages)
   */
  static async getSession(sessionId: string): Promise<ChatbotSession | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const docRef = doc(db, CHATBOT_SESSIONS_COLLECTION, sessionId);
      const snap = await getDoc(docRef);

      if (!snap.exists() || snap.data()?.uid !== user.uid) return null;

      return { id: snap.id, ...snap.data() } as ChatbotSession;
    } catch (error) {
      console.error('ChatbotHistoryService.getSession error:', error);
      return null;
    }
  }

  /**
   * Tìm session gần nhất cho cùng vị trí tuyển dụng (để resume)
   */
  static async findRecentSession(jobPosition: string): Promise<ChatbotSession | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const q = query(
        collection(db, CHATBOT_SESSIONS_COLLECTION),
        where('uid', '==', user.uid),
        where('jobPosition', '==', jobPosition),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );

      const snap = await getDocs(q);
      if (snap.empty) return null;

      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as ChatbotSession;
    } catch (error) {
      console.error('ChatbotHistoryService.findRecentSession error:', error);
      return null;
    }
  }

  /**
   * Xóa session
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, CHATBOT_SESSIONS_COLLECTION, sessionId);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data()?.uid !== user.uid) return false;

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('ChatbotHistoryService.deleteSession error:', error);
      return false;
    }
  }

  /**
   * Cleanup sessions cũ (> SESSION_EXPIRY_DAYS ngày)
   */
  private static async cleanupOldSessions(uid: string): Promise<void> {
    try {
      const q = query(
        collection(db, CHATBOT_SESSIONS_COLLECTION),
        where('uid', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(500)
      );

      const snap = await getDocs(q);

      if (snap.docs.length > MAX_SESSIONS_PER_USER) {
        const docsToDelete = snap.docs.slice(MAX_SESSIONS_PER_USER);
        const batch = writeBatch(db);
        docsToDelete.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) {
      console.error('ChatbotHistoryService.cleanupOldSessions error:', error);
    }
  }

  /**
   * Lấy thống kê chatbot sessions
   */
  static async getSessionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    lastSessionTitle: string | null;
    lastSessionDate: Date | null;
  }> {
    const user = auth.currentUser;
    if (!user) return { totalSessions: 0, totalMessages: 0, lastSessionTitle: null, lastSessionDate: null };

    try {
      const q = query(
        collection(db, CHATBOT_SESSIONS_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      const snap = await getDocs(q);
      let totalMessages = 0;
      let lastSessionTitle: string | null = null;
      let lastSessionDate: Date | null = null;

      snap.docs.forEach((d, index) => {
        const data = d.data();
        totalMessages += data.messageCount || 0;
        if (index === 0) {
          lastSessionTitle = data.sessionTitle || null;
          lastSessionDate = data.updatedAt?.toDate?.() || null;
        }
      });

      return {
        totalSessions: snap.size,
        totalMessages,
        lastSessionTitle,
        lastSessionDate,
      };
    } catch (error) {
      console.error('ChatbotHistoryService.getSessionStats error:', error);
      return { totalSessions: 0, totalMessages: 0, lastSessionTitle: null, lastSessionDate: null };
    }
  }
}
