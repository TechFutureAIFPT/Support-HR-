import {
  collection,
  doc,
  getDoc,
  setDoc,
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
import { db, auth } from '../firebase';
import type { UploadedFileRecord } from '../../assets/types';

const UPLOADED_FILES_COLLECTION = 'uploadedFiles';
const MAX_FILES_PER_USER = 500;
const MAX_EXTRACTED_TEXT_LENGTH = 10000;

export class UploadedFilesService {

  /**
   * Lưu metadata file đã upload (CV hoặc JD)
   */
  static async saveUploadedFile(params: {
    fileName: string;
    fileType: 'cv' | 'jd';
    fileSize: number;
    mimeType: string;
    ocrMethod: string;
    extractedText: string;
    processingTimeMs: number;
    analysisSessionId?: string;
    candidateName?: string;
    jobPosition?: string;
  }): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const extension = params.fileName.split('.').pop()?.toLowerCase() || '';
      const truncatedText = params.extractedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH);

      const fileRecord: Omit<UploadedFileRecord, 'id'> = {
        uid: user.uid,
        email: user.email!,
        fileName: params.fileName,
        fileType: params.fileType,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        fileExtension: extension,
        ocrMethod: params.ocrMethod,
        extractedText: truncatedText,
        extractedTextLength: params.extractedText.length,
        processingTimeMs: params.processingTimeMs,
        analysisSessionId: params.analysisSessionId,
        candidateName: params.candidateName,
        jobPosition: params.jobPosition,
        uploadedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, UPLOADED_FILES_COLLECTION), fileRecord);

      // Cleanup nếu vượt quá limit
      await this.cleanupOldFiles(user.uid);

      return docRef.id;
    } catch (error) {
      console.error('UploadedFilesService.saveUploadedFile error:', error);
      return null;
    }
  }

  /**
   * Lưu hàng loạt files (batch save cho nhiều CV cùng lúc)
   */
  static async saveUploadedFiles(files: Array<{
    fileName: string;
    fileType: 'cv' | 'jd';
    fileSize: number;
    mimeType: string;
    ocrMethod: string;
    extractedText: string;
    processingTimeMs: number;
    analysisSessionId?: string;
    candidateName?: string;
    jobPosition?: string;
  }>): Promise<string[]> {
    const user = auth.currentUser;
    if (!user || files.length === 0) return [];

    try {
      const batch = writeBatch(db);
      const docIds: string[] = [];

      for (const params of files) {
        const extension = params.fileName.split('.').pop()?.toLowerCase() || '';
        const truncatedText = params.extractedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH);

        const docRef = doc(collection(db, UPLOADED_FILES_COLLECTION));
        docIds.push(docRef.id);

        batch.set(docRef, {
          uid: user.uid,
          email: user.email!,
          fileName: params.fileName,
          fileType: params.fileType,
          fileSize: params.fileSize,
          mimeType: params.mimeType,
          fileExtension: extension,
          ocrMethod: params.ocrMethod,
          extractedText: truncatedText,
          extractedTextLength: params.extractedText.length,
          processingTimeMs: params.processingTimeMs,
          analysisSessionId: params.analysisSessionId,
          candidateName: params.candidateName,
          jobPosition: params.jobPosition,
          uploadedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      return docIds;
    } catch (error) {
      console.error('UploadedFilesService.saveUploadedFiles error:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách file đã upload của user (phân trang)
   */
  static async getUserFiles(limitCount: number = 50): Promise<UploadedFileRecord[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, UPLOADED_FILES_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as UploadedFileRecord));
    } catch (error) {
      console.error('UploadedFilesService.getUserFiles error:', error);
      return [];
    }
  }

  /**
   * Lọc files theo loại (cv hoặc jd)
   */
  static async getUserFilesByType(
    fileType: 'cv' | 'jd',
    limitCount: number = 50
  ): Promise<UploadedFileRecord[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, UPLOADED_FILES_COLLECTION),
        where('uid', '==', user.uid),
        where('fileType', '==', fileType),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as UploadedFileRecord));
    } catch (error) {
      console.error('UploadedFilesService.getUserFilesByType error:', error);
      return [];
    }
  }

  /**
   * Lấy files theo phiên phân tích
   */
  static async getFilesBySession(sessionId: string): Promise<UploadedFileRecord[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, UPLOADED_FILES_COLLECTION),
        where('uid', '==', user.uid),
        where('analysisSessionId', '==', sessionId)
      );

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as UploadedFileRecord));
    } catch (error) {
      console.error('UploadedFilesService.getFilesBySession error:', error);
      return [];
    }
  }

  /**
   * Xóa record file
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, UPLOADED_FILES_COLLECTION, fileId);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data()?.uid !== user.uid) return false;

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('UploadedFilesService.deleteFile error:', error);
      return false;
    }
  }

  /**
   * Cập nhật lastAccessedAt khi file được truy cập lại
   */
  static async touchFile(fileId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, UPLOADED_FILES_COLLECTION, fileId);
      await updateDoc(docRef, { lastAccessedAt: serverTimestamp() });
    } catch (error) {
      console.error('UploadedFilesService.touchFile error:', error);
    }
  }

  /**
   * Thống kê files của user
   */
  static async getFileStats(): Promise<{
    totalFiles: number;
    totalCVs: number;
    totalJDs: number;
    totalSizeBytes: number;
    recentFiles: UploadedFileRecord[];
  }> {
    const user = auth.currentUser;
    if (!user) return { totalFiles: 0, totalCVs: 0, totalJDs: 0, totalSizeBytes: 0, recentFiles: [] };

    try {
      const q = query(
        collection(db, UPLOADED_FILES_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('uploadedAt', 'desc'),
        limit(500)
      );

      const snap = await getDocs(q);
      let totalCVs = 0;
      let totalJDs = 0;
      let totalSizeBytes = 0;
      const recentFiles: UploadedFileRecord[] = [];

      snap.docs.forEach((d, index) => {
        const data = d.data() as UploadedFileRecord;
        if (data.fileType === 'cv') totalCVs++;
        else totalJDs++;
        totalSizeBytes += data.fileSize || 0;
        if (index < 5) recentFiles.push({ id: d.id, ...data });
      });

      return {
        totalFiles: snap.size,
        totalCVs,
        totalJDs,
        totalSizeBytes,
        recentFiles,
      };
    } catch (error) {
      console.error('UploadedFilesService.getFileStats error:', error);
      return { totalFiles: 0, totalCVs: 0, totalJDs: 0, totalSizeBytes: 0, recentFiles: [] };
    }
  }

  /**
   * Cleanup old files (giữ lại MAX_FILES_PER_USER)
   */
  private static async cleanupOldFiles(uid: string): Promise<void> {
    try {
      const q = query(
        collection(db, UPLOADED_FILES_COLLECTION),
        where('uid', '==', uid),
        orderBy('uploadedAt', 'desc'),
        limit(1000)
      );

      const snap = await getDocs(q);
      if (snap.docs.length > MAX_FILES_PER_USER) {
        const docsToDelete = snap.docs.slice(MAX_FILES_PER_USER);
        const batch = writeBatch(db);
        docsToDelete.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) {
      console.error('UploadedFilesService.cleanupOldFiles error:', error);
    }
  }
}
