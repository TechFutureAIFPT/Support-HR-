import { apiUpload } from '@/services/api/renderClient';
import { cvCache } from '@/services/history-cache/cacheService';

const FILE_SIZE_LIMIT_MB = 15;

const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_REGEX = /(\+84|84|0)[3|5|7|8|9][0-9]{8}\b/;

const SYNONYM_MAP: Record<string, string[]> = {
  'Hà Nội': ['Ha Noi', 'Hanoi', 'HN'],
  'Hồ Chí Minh': ['Ho Chi Minh', 'HCM', 'Sài Gòn', 'Saigon'],
  'Cử nhân': ['BSc', 'Bachelor', 'Cử nhân Đại học'],
  'Thạc sĩ': ['MSc', 'Master'],
  'Tiến sĩ': ['PhD', 'Doctor'],
};

export interface ParsedField {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  validationErrors?: string[];
}

export interface ParsedCV {
  name?: ParsedField;
  email?: ParsedField;
  phone?: ParsedField;
  location?: ParsedField;
  experience?: ParsedField;
  education?: ParsedField;
  skills?: ParsedField;
  rawText: string;
}

interface ExtractedTextResponse {
  text?: string;
  extractedText?: string;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSection(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return '';
}

function normalizeLocation(location: string): string {
  let normalized = location.trim();

  for (const [canonical, aliases] of Object.entries(SYNONYM_MAP)) {
    for (const alias of aliases) {
      normalized = normalized.replace(new RegExp(`\\b${alias}\\b`, 'gi'), canonical);
    }
  }

  return normalized;
}

function normalizeEducation(education: string): string {
  let normalized = education.trim();

  for (const [canonical, aliases] of Object.entries(SYNONYM_MAP)) {
    for (const alias of aliases) {
      normalized = normalized.replace(new RegExp(`\\b${alias}\\b`, 'gi'), canonical);
    }
  }

  return normalized;
}

function detectName(text: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    if (
      line.length >= 4 &&
      line.length <= 60 &&
      !EMAIL_REGEX.test(line) &&
      !PHONE_REGEX.test(line) &&
      /^[\p{L}\s'.-]+$/u.test(line)
    ) {
      return line.replace(/\s+/g, ' ');
    }
  }

  return '';
}

export const parseCVFields = async (text: string): Promise<ParsedCV> => {
  const normalizedText = normalizeText(text);
  const lower = normalizedText.toLowerCase();

  const email = normalizedText.match(EMAIL_REGEX)?.[0] || '';
  const phone = normalizedText.match(PHONE_REGEX)?.[0] || '';

  const location = extractSection(normalizedText, [
    /(?:địa chỉ|địa điểm|location)\s*[:\-]?\s*([^\n]+)/i,
  ]);

  const education = extractSection(normalizedText, [
    /(?:học vấn|education)\s*[:\-]?\s*([\s\S]{0,240})/i,
  ]);

  const skills = extractSection(normalizedText, [
    /(?:kỹ năng|skills)\s*[:\-]?\s*([\s\S]{0,240})/i,
  ]);

  const experience = extractSection(normalizedText, [
    /(?:kinh nghiệm|experience|work experience)\s*[:\-]?\s*([\s\S]{0,320})/i,
  ]);

  return {
    rawText: normalizedText,
    name: detectName(normalizedText)
      ? { value: detectName(normalizedText), confidence: 'medium' }
      : undefined,
    email: email
      ? { value: email, confidence: 'high' }
      : undefined,
    phone: phone
      ? { value: phone, confidence: 'high' }
      : undefined,
    location: location
      ? { value: normalizeLocation(location), confidence: 'medium' }
      : lower.includes('hà nội') || lower.includes('ha noi') || lower.includes('hanoi')
        ? { value: 'Hà Nội', confidence: 'low' }
        : lower.includes('hồ chí minh') || lower.includes('ho chi minh') || lower.includes('sài gòn') || lower.includes('saigon')
          ? { value: 'Hồ Chí Minh', confidence: 'low' }
          : undefined,
    experience: experience
      ? { value: experience, confidence: 'medium' }
      : undefined,
    education: education
      ? { value: normalizeEducation(education), confidence: 'medium' }
      : undefined,
    skills: skills
      ? { value: skills, confidence: 'medium' }
      : undefined,
  };
};

export const extractTextFromFile = async (
  file: File,
  onProgress: (message: string) => void,
  options: { forceOcr?: boolean; documentType?: 'cv' | 'jd' } = {}
): Promise<string> => {
  const preExtractedText = (file as File & { __preExtractedText?: string }).__preExtractedText;
  if (preExtractedText && preExtractedText.trim()) {
    onProgress('Đang dùng nội dung đã nhập từ Google Drive...');
    return normalizeText(preExtractedText);
  }

  if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
    throw new Error(`File is too large. Maximum size is ${FILE_SIZE_LIMIT_MB}MB.`);
  }

  if (!options.forceOcr) {
    const cachedText = cvCache.get<string>(file, 'text-extraction');
    if (cachedText) {
      onProgress('Đang tải từ cache...');
      return cachedText;
    }
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('force_ocr', String(Boolean(options.forceOcr)));
  formData.append('document_type', options.documentType || 'cv');

  onProgress('Đang gửi file lên máy chủ để trích xuất nội dung...');

  const response = await apiUpload<ExtractedTextResponse>('/api/files/extract-text', formData);
  const rawText = response.text || response.extractedText || '';
  const normalizedText = normalizeText(rawText);

  if (!normalizedText) {
    throw new Error(`Không đọc được nội dung từ file ${file.name}.`);
  }

  cvCache.set(file, normalizedText, 'text-extraction');
  onProgress('Đã trích xuất nội dung thành công.');

  return normalizedText;
};

export const extractTextFromJdFile = (
  file: File,
  onProgress: (message: string) => void,
  options: { forceOcr?: boolean } = {}
): Promise<string> => extractTextFromFile(file, onProgress, { ...options, documentType: 'jd' });

export const processFileToText = extractTextFromFile;
