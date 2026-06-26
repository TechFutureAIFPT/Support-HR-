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
  verdict: 'strong' | 'partial' | 'weak' | 'missing';
  evidence_quality: 'strong' | 'partial' | 'weak' | 'missing';
  matched_signals: string[];
  missing_requirements: string[];
  evidence_highlights: string[];
  improvement_suggestion: string;
  quality_flags: string[];
}

export type AppStep =
  | 'home'
  | 'jd'
  | 'weights'
  | 'upload'
  | 'analysis'
  | 'dashboard'
  | 'chatbot'
  | 'records'
  | 'jd-standardizer'
  | 'process'
  | 'history'
  | 'feedback'
  | 'app-docs'
  | 'jd-templates';

export interface DetailedScore {
  'Tiêu chí': string;
  'Điểm': string;
  'Công thức': string;
  'Dẫn chứng': string;
  'Giải thích': string;
  advancedBreakdown?: AdvancedScoreBreakdown;
}

export interface StageDecision {
  status: 'ready_to_advance' | 'hold' | 'review' | 'not_ready' | string;
  label: string;
  autoAdvance: boolean;
  currentStage: string;
  recommendedStage: string;
  scoreThreshold: number;
  reason: string;
  blockingReasons: string[];
}

export interface CandidateWorkPeriod {
  start: string;
  end: string;
  isCurrent?: boolean;
  evidence?: string;
}

export interface CandidateProfile {
  birthYear?: number | null;
  age?: number | null;
  currentLocation?: string;
  educationLevel?: string;
  educationMajors?: string[];
  inferredKnowledgeAreas?: string[];
  workPeriods?: CandidateWorkPeriod[];
  totalExperienceMonths?: number;
  relevantExperienceMonths?: number;
  experienceDomains?: string[];
  extractionWarnings?: string[];
}

export interface ScreeningFactorSummary {
  status: 'pass' | 'fail' | 'review' | 'na' | string;
  mandatory: boolean;
  expected?: unknown;
  observed?: unknown;
  evidence?: string;
  reason?: string;
}

export interface ScreeningSummary {
  age?: ScreeningFactorSummary;
  education?: ScreeningFactorSummary;
  major?: ScreeningFactorSummary;
  knowledge?: ScreeningFactorSummary;
  experience?: ScreeningFactorSummary;
  location?: ScreeningFactorSummary;
  [key: string]: ScreeningFactorSummary | undefined;
}

export interface HrSummarySkillAssessment {
  ten_ky_nang: string;
  muc_do_dap_ung: string;
  bang_chung_tu_cv: string;
}

export interface HrSummary {
  tong_diem_phu_hop: number;
  nhan_xet_tong_quan: string;
  canh_bao_red_flag: string[];
  kinh_nghiem: {
    so_nam_yeu_cau: string;
    so_nam_thuc_te: string;
    ket_luan: string;
  };
  danh_gia_ky_nang: HrSummarySkillAssessment[];
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
  stageDecision?: StageDecision;
  candidateProfile?: CandidateProfile;
  screeningSummary?: ScreeningSummary;
  autoRejectReasons?: string[];
  hrSummary?: HrSummary;
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
  videoLinks?: string[];
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
  ageMandatory?: boolean;
  majorGroups?: string[];
  majorMandatory?: boolean;
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

export interface CandidateJdCvEvidenceMatch {
  section?: string;
  requirement: string;
  jdEvidence: string;
  cvEvidence: string;
  matchType?: 'exact' | 'semantic' | 'transfer' | 'incorrect' | string;
  score?: number;
  reason?: string;
}

export interface CandidateJdCvMatchInsight {
  similarity: number;
  weightedScore: number;
  semanticWeightedScore?: number;
  maxScore: number;
  queryModel?: string;
  roleKey?: string;
  roleLabel?: string;
  matchedSkills: string[];
  missingSkills: string[];
  transferMatches: string[];
  matchedRequirements?: string[];
  missingRequirements?: string[];
  uiSections?: string[];
  evidenceMatches?: CandidateJdCvEvidenceMatch[];
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

export interface MobileInboxCandidate {
  id: string;
  sourceHistoryId?: string;
  syncHistoryId?: string;
  sessionId?: string;
  candidateName: string;
  avatarUrl?: string;
  fileName: string;
  jobTitle: string;
  industry: string;
  experienceLevel: string;
  detectedLocation?: string;
  score: number;
  rank: 'A' | 'B' | 'C' | string;
  strengths: string[];
  weaknesses: string[];
  interviewQuestions: string[];
  details: Array<Record<string, unknown>>;
  warnings: string[];
  hardFilterFailureReason?: string | null;
  stageDecision?: StageDecision;
  screeningOutcome?: {
    status: string;
    label: string;
  };
  autoRejectReasons?: string[];
  screeningSummary?: ScreeningSummary;
  candidateProfile?: CandidateProfile;
  hrSummary?: HrSummary;
  hardFilters?: Record<string, unknown>;
  jdText?: string;
  jobPosition?: string;
  raw?: Record<string, unknown>;
}

export interface MobileInboxHistory {
  id: string;
  timestamp: number;
  jobPosition: string;
  locationRequirement?: string;
  totalCandidates: number;
  userEmail?: string;
  screeningStats?: {
    totalCandidates: number;
    byDecision: Record<string, number>;
    failFactors: Record<string, number>;
  };
  autoRejectCount?: number;
  reviewCount?: number;
  readyCount?: number;
  topHrSummaries?: Array<Record<string, unknown>>;
  fullPayload?: {
    jdText?: string;
    jobPosition?: string;
    hardFilters?: Record<string, unknown>;
    candidates?: Array<Record<string, unknown>>;
  };
  topCandidates?: Array<Record<string, unknown>>;
}

export interface MobileInboxResponse {
  candidates: MobileInboxCandidate[];
  history: MobileInboxHistory[];
  stats: {
    candidateCount: number;
    historyCount: number;
    latestTimestamp?: number | null;
  };
  revision?: string;
  generatedAt?: number;
}

export type JDStandardizeTargetPlatform = 'generic' | 'topcv' | 'vietnamworks' | 'linkedin' | 'parse_jd';

export interface JDSupplementalFields {
  companyName?: string;
  salary?: string;
  location?: string;
  workingTime?: string;
  benefits?: string;
  applicationInfo?: string;
  notes?: string;
}

export interface JDStandardizeRequest {
  jdText: string;
  targetPlatform: JDStandardizeTargetPlatform;
  supplementalFields?: JDSupplementalFields;
}

export interface JDQualityFinding {
  key?: string;
  label: string;
  reason?: string;
  priority?: 'high' | 'medium' | 'low' | string;
  detail?: string;
}

export interface NormalizedJD {
  title: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  workingTime: string;
  location: string;
  salary: string;
  applicationInfo: string;
  keywords: string[];
}

export interface JDStandardizeResponse {
  score: number;
  missingSections: JDQualityFinding[];
  weakPoints: JDQualityFinding[];
  suggestions: JDQualityFinding[];
  normalizedJD: NormalizedJD;
  platform: {
    name: string;
    url: string;
  };
  platformUrl: string;
  generatedAt: string;
  source: 'ai' | 'fallback' | string;
  savedRecordId?: string | null;
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

export type SidebarDensity = 'compact' | 'cozy';
export type UserSettingsTheme = 'light' | 'dark' | 'system';
export type UserSettingsLanguage = 'vi-VN' | 'en-US';
export type NewSessionMode = 'reset' | 'keep-config';
export type HistoryRetention = 50 | 100 | 200;

export interface UserSettingsUI {
  sidebarDensity: SidebarDensity;
  accessibleMode: boolean;
  reducedMotion: boolean;
  language: UserSettingsLanguage;
  theme: UserSettingsTheme;
}

export interface RecruiterInfo {
  title: string;
  company: string;
  department: string;
  phone: string;
  emailSignature: string;
}

export interface UserSettingsAccount {
  displayName: string;
  avatar: string | null;
  email: string;
  recruiterInfo?: RecruiterInfo;
}

export interface FixedJDConfig {
  enabled: boolean;
  name: string;
  jdText: string;
  savedAt: number;
  scoringEnabled?: boolean;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
}

export interface UserSettingsWorkflow {
  autoSaveDraft: boolean;
  restoreDraft: boolean;
  rememberScoringConfig: boolean;
  autoSaveHistory: boolean;
  autoFillHardFiltersOnContinue: boolean;
  newSessionMode: NewSessionMode;
  fixedJD?: FixedJDConfig;
}

export interface UserSettingsNotifications {
  analysisComplete: boolean;
  syncErrors: boolean;
  historySaved: boolean;
  sidebarBadge: boolean;
  inAppOnly: true;
}

export interface UserSettingsSync {
  autoSync: boolean;
  historyRetention: HistoryRetention;
  lastSyncedAt: number | null;
}

export interface UserSettings {
  version: 1;
  ui: UserSettingsUI;
  account: UserSettingsAccount;
  workflow: UserSettingsWorkflow;
  notifications: UserSettingsNotifications;
  sync: UserSettingsSync;
}

export interface UserSettingsPatch {
  ui?: Partial<UserSettingsUI>;
  account?: Partial<UserSettingsAccount>;
  workflow?: Partial<UserSettingsWorkflow>;
  notifications?: Partial<UserSettingsNotifications>;
  sync?: Partial<UserSettingsSync>;
}
