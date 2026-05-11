export type AppStep = 'home' | 'jd' | 'weights' | 'upload' | 'analysis' | 'dashboard' | 'chatbot' | 'process' | 'history' | 'feedback';

export interface DetailedScore {
  'Tiêu chí': string;
  'Điểm': string;
  'Công thức': string;
  'Dẫn chứng': string;
  'Giải thích': string;
}

export interface Candidate {
  id: string;
  candidateName: string;
  fileName: string;
  phone?: string;
  email?: string;
  jobTitle: string;
  industry: string;
  department: string;
  experienceLevel: 'Intern' | 'Junior' | 'Mid-level' | 'Senior' | 'Lead' | 'Expert' | string;
  hardFilterFailureReason?: string;
  softFilterWarnings?: string[];
  detectedLocation: string;
  embeddingInsights?: CandidateEmbeddingInsight;

  analysis?: {
    'Tổng điểm': number;
    'Hạng': 'A' | 'B' | 'C';
    'Chi tiết': DetailedScore[];
    'Điểm mạnh CV'?: string[];
    'Điểm yếu CV'?: string[];
    educationValidation?: {
      standardizedEducation: string;
      validationNote: string;
      warnings?: string[];
    };
    softSkillsReport?: Record<string, unknown>;
    feedbackAdjusted?: number;
  };
  debiasingWarnings?: string[];

  status: 'SUCCESS' | 'FAILED';
  error?: string;
  _rawBatchJson?: string;
}

export interface HardFilters {
  location: string;
  minExp: string;
  seniority: string;
  education: string;
  industry: string;
  language: string;
  languageLevel: string;
  certificates: string;
  workFormat: string;
  contractType: string;
  salaryMin: string;
  salaryMax: string;
  industryManual?: string;

  locationMandatory: boolean;
  minExpMandatory: boolean;
  seniorityMandatory: boolean;
  educationMandatory: boolean;
  contactMandatory: boolean;
  industryMandatory: boolean;
  languageMandatory: boolean;
  certificatesMandatory: boolean;
  workFormatMandatory: boolean;
  contractTypeMandatory: boolean;
  salaryMandatory: boolean;

  age?: { min?: number; max?: number };
  gender?: string[];
  ethnicity?: string[];
  religion?: string[];
  maritalStatus?: string[];
}

export interface SubCriterion {
  key: string;
  name: string;
  weight: number;
}

export interface MainCriterion {
  key: string;
  name: string;
  icon: string;
  color: string;
  weight?: number;
  children?: SubCriterion[];
}

export interface WeightCriteria {
  [key: string]: MainCriterion;
}

export interface AnalysisRunData {
  timestamp: number;
  job: {
    position: string;
    locationRequirement: string;
  };
  candidates: Candidate[];
}

export interface CandidateEmbeddingMatch {
  id: string;
  name?: string;
  role?: string;
  similarity: number;
  relativePath?: string;
}

export interface CandidateEmbeddingInsight {
  industry: string;
  averageSimilarity: number;
  topMatches: CandidateEmbeddingMatch[];
  bonusPoints: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  jobPosition: string;
  locationRequirement: string;
  jdTextSnippet: string;
  totalCandidates: number;
  grades: { A: number; B: number; C: number };
  topCandidates: Array<{ id: string; name: string; score: number; jdFit: number; grade: string }>;
  userEmail: string;
  fullPayload?: {
    jdText: string;
    jobPosition: string;
    weights: any;
    hardFilters: any;
    candidates: Candidate[];
  };
}

export interface ChatMessage {
  id: string;
  author: 'user' | 'bot';
  content: string;
  timestamp?: number;
  suggestedCandidates?: Pick<Candidate, 'id' | 'candidateName' | 'analysis'>[];
}

export interface UploadedFileRecord {
  id?: string;
  uid: string;
  email: string;
  fileName: string;
  fileType: 'cv' | 'jd';
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  ocrMethod: string;
  extractedText: string;
  extractedTextLength: number;
  processingTimeMs: number;
  analysisSessionId?: string;
  candidateName?: string;
  jobPosition?: string;
  uploadedAt: any;
  lastAccessedAt?: any;
}

export interface ChatMessageRecord {
  id: string;
  author: 'user' | 'bot';
  content: string;
  timestamp: number;
  suggestedCandidateIds?: string[];
}

export interface ChatbotSession {
  id?: string;
  uid: string;
  email: string;
  jobPosition: string;
  totalCandidates: number;
  sessionTitle: string;
  messages: ChatMessageRecord[];
  messageCount: number;
  createdAt: any;
  updatedAt: any;
  lastMessageAt: number;
}
