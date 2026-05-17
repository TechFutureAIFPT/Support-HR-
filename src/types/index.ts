export interface PointDeduction {
  reason: string;
  points_lost: number;
}

export interface KeywordAnalysis {
  keyword: string;
  status: 'matched' | 'missing';
  context_sentence: string;
}

export interface SkillKeywordMetrics {
  total_required_keywords: number;
  matched_keywords_count: number;
  match_percentage: number;
  keywords_list: KeywordAnalysis[];
}

export interface AdvancedScoreBreakdown {
  max_possible_score: number;
  raw_score_earned: number;
  mathematical_formula: string;
  deductions: PointDeduction[];
  bonuses_earned: string[];
  keyword_metrics: SkillKeywordMetrics;
}

export type AppStep = 'home' | 'jd' | 'weights' | 'upload' | 'analysis' | 'dashboard' | 'chatbot' | 'process' | 'history' | 'feedback';

export interface DetailedScore {
  'Tiêu chí': string;
  'Điểm': string;
  'Công thức': string;
  'Dẫn chứng': string;
  'Giải thích': string;
  advancedBreakdown?: AdvancedScoreBreakdown;
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
  detectedLocationSource?: string;
  locationMatch?: boolean | null;
  embeddingInsights?: CandidateEmbeddingInsight;
  jdCvMatchInsights?: CandidateJdCvMatchInsight;

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
  _cvText?: string;
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

export interface ActiveAnalysisContext {
  sessionId: string;
  timestamp: number;
  jobPosition?: string;
  jdHash?: string;
  historyId?: string;
  syncHistoryId?: string;
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
  provider?: string;
  collectionKey?: string;
  queryModel?: string;
  recordCount?: number;
  averageSimilarity: number;
  topMatches: CandidateEmbeddingMatch[];
  bonusPoints: number;
}

export interface CandidateJdCvMatchInsight {
  similarity: number;
  weightedScore: number;
  maxScore: number;
  queryModel?: string;
  matchedSkills: string[];
  missingSkills: string[];
  transferMatches: string[];
}

export type AnalysisFeedbackAction = 'like' | 'dislike' | 'shortlist' | 'reject' | 'interview' | 'hire' | 'neutral';
export type AnalysisFeedbackSeverity = 'low' | 'medium' | 'high';

export interface AnalysisFeedbackDraft {
  candidateId: string;
  finalScore: number;
  scoreDifference: number;
  selectedCriteria: string[];
  notes: string;
  action: AnalysisFeedbackAction;
  reason: string;
  isReusableGuidance: boolean;
}

export interface AnalysisFeedbackRecord {
  id: string;
  uid: string;
  userEmail: string;
  displayName: string;
  photoUrl: string;
  sessionId?: string | null;
  historyId?: string | null;
  syncHistoryId?: string | null;
  candidateId?: string | null;
  candidateName?: string | null;
  fileName?: string | null;
  jobPosition?: string | null;
  jdHash?: string | null;
  promptKey?: string | null;
  promptVersion?: string | null;
  modelVersion?: string | null;
  action: AnalysisFeedbackAction;
  aiScore?: number | null;
  finalScore?: number | null;
  isReusableGuidance?: boolean;
  severity?: AnalysisFeedbackSeverity;
  rank?: string | null;
  reason?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: number | null;
  updatedAt?: number | null;
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
