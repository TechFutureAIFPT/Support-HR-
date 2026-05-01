/**
 * Script tạo sample documents cho uploadedFiles và chatbotSessions
 * Chạy bằng: node firebase/seed-collections.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key using process.cwd() for Unicode path support
const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), 'New folder', 'gen-lang-client-0595612537-firebase-adminsdk-fbsvc-7a15b8a09f.json'), 'utf8')
);

// Init Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'gen-lang-client-0595612537',
});

const db = getFirestore();

async function seedCollections() {
  console.log('🔥 Đang tạo sample documents...\n');

  // 1. uploadedFiles - Sample CV
  const cvDoc = await db.collection('uploadedFiles').add({
    uid: 'sample-user-001',
    email: 'hoanphuc135@gmail.com',
    fileName: 'NguyenVanA_CV_2026.pdf',
    fileType: 'cv',
    fileSize: 245000,
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    ocrMethod: 'google-vision',
    extractedText: 'Nguyễn Văn A - Senior Frontend Developer - 5 năm kinh nghiệm React, TypeScript...',
    extractedTextLength: 3200,
    processingTimeMs: 1520,
    candidateName: 'Nguyễn Văn A',
    jobPosition: 'Frontend Developer',
    uploadedAt: new Date(),
  });
  console.log('✅ uploadedFiles (CV):', cvDoc.id);

  // 2. uploadedFiles - Sample JD
  const jdDoc = await db.collection('uploadedFiles').add({
    uid: 'sample-user-001',
    email: 'hoanphuc135@gmail.com',
    fileName: 'JD_Frontend_Developer_2026.docx',
    fileType: 'jd',
    fileSize: 52000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileExtension: 'docx',
    ocrMethod: 'pdf-parse',
    extractedText: 'Vị trí: Frontend Developer - Yêu cầu: React, TypeScript, 3+ năm kinh nghiệm...',
    extractedTextLength: 1800,
    processingTimeMs: 890,
    jobPosition: 'Frontend Developer',
    uploadedAt: new Date(),
  });
  console.log('✅ uploadedFiles (JD):', jdDoc.id);

  // 3. chatbotSessions - Sample session
  const chatDoc = await db.collection('chatbotSessions').add({
    uid: 'sample-user-001',
    email: 'hoanphuc135@gmail.com',
    jobPosition: 'Frontend Developer',
    totalCandidates: 5,
    sessionTitle: 'Frontend Developer - 5 ứng viên',
    messages: [
      {
        id: 'msg-1',
        author: 'bot',
        content: 'Chào bạn, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?',
        timestamp: Date.now() - 60000,
      },
      {
        id: 'msg-2',
        author: 'user',
        content: 'Ứng viên nào phù hợp nhất với vị trí Frontend Developer?',
        timestamp: Date.now() - 50000,
      },
      {
        id: 'msg-3',
        author: 'bot',
        content: 'Dựa trên phân tích, Nguyễn Văn A là ứng viên phù hợp nhất với điểm 85/100...',
        timestamp: Date.now() - 40000,
      },
    ],
    messageCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: Date.now(),
  });
  console.log('✅ chatbotSessions:', chatDoc.id);

  console.log('\n🎉 Hoàn thành! Kiểm tra Firebase Console:');
  console.log('   https://console.firebase.google.com/project/gen-lang-client-0595612537/firestore/data');
}

seedCollections().catch(console.error);
