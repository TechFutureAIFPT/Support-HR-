import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Database,
  FileText,
  FolderOpen,
  HardDriveUpload,
  ListChecks,
  Loader2,
  MapPin,
  Search,
  Settings2,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { extractTextFromJdFile } from '@/services/file-processing/ocrService';
import {
  extractHardFiltersFromJD,
  extractJobPositionFromJD,
  filterAndStructureJD,
} from '@/services/screening/frontendScreeningService';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import { fetchFilteredCvLibrary } from '@/services/data-sync/recruitmentToolsService';
import type { HardFilters, MobileInboxCandidate, MobileInboxHistory } from '@/types';
import { getSafeErrorMessage, isRedirectingToGoogle } from '@/utils/errorMessages';
import { normalizeVietnameseDisplay, normalizeVietnameseList } from '@/utils/textDisplay';

interface CVScreenerWelcomeProps {
  onGetStarted: () => void;
  onUseTemplate?: () => void;
  onCvReady?: () => void;
  onFileProcessed: (data: {
    jdText: string;
    rawJdText?: string;
    jobPosition: string;
    hardFilters: Partial<HardFilters>;
  }) => void;
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
  hasPreparedJd?: boolean;
  embedded?: boolean;
  initialStage?: IntakeStage;
  continueLabel?: string;
  jdText?: string;
  rawJdText?: string;
  jobPosition?: string;
  hardFilters?: HardFilters;
}

type IntakeStage = 'jd' | 'cv';

const PROCESSING_STEPS = [
  'Đọc tệp JD',
  'Chuẩn hóa nội dung',
  'Tách chức danh',
  'Trích xuất tiêu chí',
];

const MAX_CV_PER_BATCH = 20;
const FILE_ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg';
const LIBRARY_TEXT_FIELDS = [
  '_cvText',
  'cvText',
  'extractedText',
  'rawText',
  'resumeText',
  'candidateText',
  'fileText',
  'content',
  'text',
];

const accent = '#2388ff';
const modalPanelClass = 'rounded-2xl border border-blue-100 bg-white shadow-[0_24px_80px_rgba(30,64,175,0.14)]';
const secondaryButtonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:px-3';
const primaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_14px_34px_rgba(35,136,255,0.24)] transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:border disabled:border-blue-200 disabled:bg-blue-100 disabled:text-blue-700 disabled:shadow-none disabled:opacity-100 sm:h-11 sm:px-5';

const getRecordString = (record: Record<string, unknown> | undefined, keys: string[]) => {
  if (!record) return '';

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
};

const findLibraryHistory = (candidate: MobileInboxCandidate, history: MobileInboxHistory[]) =>
  history.find((item) => item.id === candidate.sourceHistoryId || item.id === candidate.syncHistoryId || item.id === candidate.sessionId);

const findCandidatePayload = (candidate: MobileInboxCandidate, history: MobileInboxHistory[]) => {
  const source = findLibraryHistory(candidate, history);
  const payloadCandidates = source?.fullPayload?.candidates || [];
  const candidateKeys = [
    candidate.id,
    candidate.fileName,
    candidate.candidateName,
  ].map((item) => String(item || '').trim().toLowerCase()).filter(Boolean);

  return payloadCandidates.find((item) => {
    const record = item as Record<string, unknown>;
    const recordKeys = [
      record.id,
      record.candidateId,
      record.fileName,
      record.candidateName,
      record.name,
    ].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean);

    return recordKeys.some((key) => candidateKeys.includes(key));
  }) as Record<string, unknown> | undefined;
};

const buildLibraryCandidateText = (candidate: MobileInboxCandidate, history: MobileInboxHistory[]) => {
  const directText = getRecordString(candidate.raw, LIBRARY_TEXT_FIELDS);
  if (directText) return directText;

  const historyPayload = findCandidatePayload(candidate, history);
  const historyText = getRecordString(historyPayload, LIBRARY_TEXT_FIELDS)
    || getRecordString(historyPayload?.raw as Record<string, unknown> | undefined, LIBRARY_TEXT_FIELDS);
  if (historyText) return historyText;

  const source = findLibraryHistory(candidate, history);
  const detailsText = candidate.details
    .map((detail, index) => {
      const criterion = normalizeVietnameseDisplay(detail['Tiêu chí'] || detail['Tieu chi'] || detail.criterion || `Tiêu chí ${index + 1}`);
      const evidence = normalizeVietnameseDisplay(detail['Dẫn chứng'] || detail['Dan chung'] || detail.evidence || detail['Giải thích'] || detail.explanation || '');
      return [criterion, evidence].filter(Boolean).join(': ');
    })
    .filter(Boolean);

  return [
    `Ứng viên: ${normalizeVietnameseDisplay(candidate.candidateName)}`,
    `File CV: ${normalizeVietnameseDisplay(candidate.fileName)}`,
    `Vị trí: ${normalizeVietnameseDisplay(candidate.jobTitle || candidate.jobPosition || source?.jobPosition || '')}`,
    `Ngành: ${normalizeVietnameseDisplay(candidate.industry)}`,
    `Cấp độ: ${normalizeVietnameseDisplay(candidate.experienceLevel)}`,
    `Địa điểm: ${normalizeVietnameseDisplay(candidate.detectedLocation || '')}`,
    `Điểm AI trước đó: ${candidate.score}`,
    `Hạng: ${candidate.rank}`,
    normalizeVietnameseList(candidate.strengths).length ? `Điểm mạnh: ${normalizeVietnameseList(candidate.strengths).join('; ')}` : '',
    normalizeVietnameseList(candidate.weaknesses).length ? `Điểm cần rà soát: ${normalizeVietnameseList(candidate.weaknesses).join('; ')}` : '',
    detailsText.length ? `Bằng chứng phân tích:\n${detailsText.join('\n')}` : '',
  ].filter(Boolean).join('\n');
};

const toSafeLibraryFileName = (candidate: MobileInboxCandidate) => {
  const baseName = normalizeVietnameseDisplay(candidate.fileName || candidate.candidateName || 'cv-thu-vien')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'cv-thu-vien';
  return /\.[a-z0-9]{2,5}$/i.test(baseName) ? baseName.replace(/\.[^.]+$/i, '.txt') : `${baseName}.txt`;
};

const createLibraryCvFile = (candidate: MobileInboxCandidate, history: MobileInboxHistory[]) => {
  const text = buildLibraryCandidateText(candidate, history);
  const file = new File([text], toSafeLibraryFileName(candidate), { type: 'text/plain' }) as File & {
    __preExtractedText?: string;
    __libraryCandidateId?: string;
  };
  file.__preExtractedText = text;
  file.__libraryCandidateId = candidate.id;
  return file;
};

const StepButton = ({
  active,
  disabled,
  index,
  label,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  index: string;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group relative flex min-w-0 items-center gap-2 py-2 text-left transition-colors ${
      active
        ? 'text-slate-900'
        : 'text-slate-500 hover:text-blue-700'
    } disabled:cursor-not-allowed disabled:opacity-45`}
  >
    <span
      className={`supporthr-mono text-[10px] font-black ${
        active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
      }`}
    >
      {index}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold leading-5">{label}</span>
      <span className="mt-0.5 hidden truncate text-[11px] text-slate-500 sm:block">{description}</span>
    </span>
    <span
      className={`absolute inset-x-0 -bottom-px h-px transition-colors ${
        active ? 'bg-blue-500' : 'bg-transparent'
      }`}
    />
  </button>
);

const ProcessingModal = ({
  step,
}: {
  step: number;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-sm">
    <div className={`${modalPanelClass} w-full max-w-sm p-5 sm:p-6`}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#2388ff]/35 bg-[#2388ff]/10 text-[#2388ff]">
          <div className="absolute inset-2 animate-ping rounded-xl border border-[#2388ff]/20" />
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2388ff] border-t-transparent" />
        </div>
        <div className="min-w-0">
          <p className="supporthr-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#2388ff]/80">
            Quy trình JD
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">Đang chuẩn bị tiêu chí</h3>
          <p className="mt-1 truncate text-sm text-slate-500">{PROCESSING_STEPS[step]}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {PROCESSING_STEPS.map((item, index) => {
          const isCurrent = step === index;
          const isDone = step > index;

          return (
            <div
              key={item}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                isCurrent
                  ? 'border-[#2388ff]/40 bg-[#2388ff]/10 text-[#2388ff]'
                  : isDone
                    ? 'border-blue-100 bg-blue-50 text-slate-900'
                    : 'border-blue-100 bg-white text-slate-500'
              }`}
            >
              <span className="supporthr-mono flex h-6 w-6 shrink-0 items-center justify-center border border-current/35 text-[10px]">
                {isDone ? <Check className="h-3.5 w-3.5" /> : String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 truncate">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const CvLibraryImportModal = ({
  candidates,
  history,
  selectedIds,
  query,
  isLoading,
  error,
  remainingSlots,
  onQueryChange,
  onReload,
  onToggle,
  onClose,
  onImport,
}: {
  candidates: MobileInboxCandidate[];
  history: MobileInboxHistory[];
  selectedIds: Set<string>;
  query: string;
  isLoading: boolean;
  error: string;
  remainingSlots: number;
  onQueryChange: (value: string) => void;
  onReload: () => void;
  onToggle: (candidate: MobileInboxCandidate) => void;
  onClose: () => void;
  onImport: () => void;
}) => {
  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => {
        if (!normalizedQuery) return true;
        return [
          candidate.candidateName,
          candidate.fileName,
          candidate.jobTitle,
          candidate.jobPosition,
          candidate.industry,
        ].some((value) => normalizeVietnameseDisplay(value || '').toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => right.score - left.score);
  }, [candidates, query]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 flex-col gap-4 border-b border-blue-100 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="supporthr-mono text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Thư viện CV</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Đưa hồ sơ đã lọc vào phiên này</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Chọn hồ sơ từ thư viện để phân tích lại với JD và bộ tiêu chí hiện tại.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
            aria-label="Đóng thư viện CV"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid shrink-0 gap-3 border-b border-blue-100 bg-[#f8fbff] p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex h-11 min-w-0 items-center rounded-xl border border-blue-100 bg-white px-3 shadow-sm">
            <Search className="mr-2 h-4 w-4 text-blue-500" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm theo tên, file CV, vị trí..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="button" onClick={onReload} className={secondaryButtonClass}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Tải lại
          </button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="mt-4 text-base font-bold text-slate-950">Đang tải thư viện CV</p>
              <p className="mt-2 text-sm text-slate-600">Support HR đang lấy hồ sơ đã lọc từ backend.</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/50 px-4 text-center">
              <FileText className="h-10 w-10 text-blue-500" />
              <p className="mt-4 text-base font-bold text-slate-950">Chưa có hồ sơ phù hợp</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                Sau khi có lịch sử phân tích, hồ sơ đã lọc sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredCandidates.map((candidate) => {
                const checked = selectedIds.has(candidate.id);
                const source = findLibraryHistory(candidate, history);
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => onToggle(candidate)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      checked ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black ${
                      checked ? 'border-blue-200 bg-white text-blue-700' : 'border-blue-100 bg-blue-50 text-blue-600'
                    }`}>
                      {checked ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{normalizeVietnameseDisplay(candidate.candidateName)}</span>
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-600">
                        {normalizeVietnameseDisplay(candidate.fileName)} · {normalizeVietnameseDisplay(candidate.jobTitle || candidate.jobPosition || source?.jobPosition || 'Chưa rõ vị trí')}
                      </span>
                    </span>
                    <span className="hidden shrink-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-center sm:block">
                      <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-blue-600">Điểm</span>
                      <span className="text-sm font-black text-slate-950">{candidate.score}</span>
                    </span>
                    <span className="supporthr-mono shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                      {candidate.rank}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-blue-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Đã chọn <span className="font-black text-blue-700">{selectedIds.size}</span> hồ sơ · còn <span className="font-black text-blue-700">{remainingSlots}</span> chỗ trong phiên này.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>Đóng</button>
            <button type="button" onClick={onImport} disabled={selectedIds.size === 0 || remainingSlots <= 0} className={primaryButtonClass}>
              Đưa vào danh sách CV
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({
  onGetStarted,
  onUseTemplate,
  onCvReady,
  onFileProcessed,
  cvFiles,
  setCvFiles,
  hasPreparedJd = false,
  embedded = false,
  initialStage,
  continueLabel = 'Phân tích',
  jdText = '',
  rawJdText = '',
  jobPosition = '',
  hardFilters,
}) => {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<IntakeStage>(embedded ? 'cv' : (initialStage ?? (hasPreparedJd ? 'cv' : 'jd')));
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(hasPreparedJd ? 'JD đã sẵn sàng.' : '');
  const [jdReady, setJdReady] = useState(hasPreparedJd);
  const [jdFileName, setJdFileName] = useState('');
  const [cvError, setCvError] = useState('');
  const [isLoadingCvDrive, setIsLoadingCvDrive] = useState(false);
  const [isCvLibraryOpen, setIsCvLibraryOpen] = useState(false);
  const [isLoadingCvLibrary, setIsLoadingCvLibrary] = useState(false);
  const [cvLibraryError, setCvLibraryError] = useState('');
  const [cvLibraryCandidates, setCvLibraryCandidates] = useState<MobileInboxCandidate[]>([]);
  const [cvLibraryHistory, setCvLibraryHistory] = useState<MobileInboxHistory[]>([]);
  const [cvLibraryQuery, setCvLibraryQuery] = useState('');
  const [selectedLibraryCvIds, setSelectedLibraryCvIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hasHandledPendingDriveRef = useRef(false);
  const lastAutoAdvancedCvCountRef = useRef(0);

  const cvProgressPercent = useMemo(
    () => Math.min(100, Math.round((cvFiles.length / MAX_CV_PER_BATCH) * 100)),
    [cvFiles.length],
  );

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${cvProgressPercent}%`;
    }
  }, [cvProgressPercent]);
  const canContinue = (embedded || jdReady) && cvFiles.length > 0;
  const remainingCvSlots = MAX_CV_PER_BATCH - cvFiles.length;
  const previewText = useMemo(() => (jdText || rawJdText || '').trim(), [jdText, rawJdText]);
  const previewCharacterCount = previewText.length;
  const extractedRules = useMemo(() => {
    if (!hardFilters) return [];

    const rules = [
      { label: 'Vị trí', value: jobPosition, icon: BriefcaseBusiness },
      { label: 'Địa điểm', value: hardFilters.location, icon: MapPin },
      { label: 'Kinh nghiệm', value: hardFilters.minExp ? `${hardFilters.minExp} năm` : '', icon: ListChecks },
      { label: 'Ngành nghề', value: hardFilters.industry || hardFilters.industryManual, icon: Sparkles },
      { label: 'Hình thức', value: hardFilters.workFormat, icon: BriefcaseBusiness },
      { label: 'Hợp đồng', value: hardFilters.contractType, icon: FileText },
    ];

    return rules.filter((rule) => String(rule.value || '').trim().length > 0).slice(0, 6);
  }, [hardFilters, jobPosition]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasPreparedJd) return;

    setJdReady(true);
    setStage('cv');
    setSuccessMsg((current) => current || 'JD đã sẵn sàng.');
  }, [hasPreparedJd]);

  useEffect(() => {
    if (!initialStage) return;
    setStage(initialStage);
  }, [initialStage]);

  useEffect(() => {
    if (!embedded || stage !== 'cv' || !jdReady || cvFiles.length === 0) return;
    if (lastAutoAdvancedCvCountRef.current === cvFiles.length) return;

    lastAutoAdvancedCvCountRef.current = cvFiles.length;
    onCvReady?.();
  }, [cvFiles.length, embedded, jdReady, onCvReady, stage]);

  useEffect(() => {
    if (!isProcessing) {
      setProcessingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProcessingStep((current) => (current + 1) % PROCESSING_STEPS.length);
    }, 1100);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const appendCvFiles = useCallback(
    (incomingFiles: File[]) => {
      if (incomingFiles.length === 0) return;

      setCvFiles((prev) => {
        const existingMap = new Map(prev.map((file) => [`${file.name}-${file.size}`, true]));
        const uniqueNewFiles = incomingFiles.filter((file) => !existingMap.has(`${file.name}-${file.size}`));

        if (uniqueNewFiles.length === 0) {
          setCvError('Các CV này đã có trong danh sách.');
          return prev;
        }

        if (prev.length + uniqueNewFiles.length > MAX_CV_PER_BATCH) {
          setCvError(`Chỉ được tải tối đa ${MAX_CV_PER_BATCH} CV.`);
          return prev;
        }

        setCvError('');
        return [...prev, ...uniqueNewFiles];
      });
    },
    [setCvFiles],
  );

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrorMsg('');
      setSuccessMsg('');
      setProcessingStep(0);

      try {
        const rawText = await extractTextFromJdFile(file, (message) => {
          if (message.includes('PDF') || message.toLowerCase().includes('docx')) {
            setProcessingStep(0);
          }
        });

        if (!rawText || rawText.trim().length < 50) {
          throw new Error('Không đọc được nội dung JD.');
        }

        setProcessingStep(1);
        const structuredJd = await filterAndStructureJD(rawText);

        setProcessingStep(2);
        const jobPosition = await extractJobPositionFromJD(structuredJd);

        setProcessingStep(3);
        const extractedFilters = await extractHardFiltersFromJD(structuredJd);
        const mandatoryUpdates: Partial<HardFilters> = {};

        if (extractedFilters?.location) (mandatoryUpdates as any).locationMandatory = true;
        if (extractedFilters?.minExp) (mandatoryUpdates as any).minExpMandatory = true;
        if (extractedFilters?.seniority) (mandatoryUpdates as any).seniorityMandatory = true;
        if (extractedFilters?.education) (mandatoryUpdates as any).educationMandatory = true;
        if (extractedFilters?.age) (mandatoryUpdates as any).ageMandatory = false;
        if (Array.isArray(extractedFilters?.majorGroups) && extractedFilters.majorGroups.length > 0) (mandatoryUpdates as any).majorMandatory = false;
        if (extractedFilters?.language) (mandatoryUpdates as any).languageMandatory = true;
        if (extractedFilters?.certificates) (mandatoryUpdates as any).certificatesMandatory = true;
        if (extractedFilters?.workFormat) (mandatoryUpdates as any).workFormatMandatory = true;
        if (extractedFilters?.contractType) (mandatoryUpdates as any).contractTypeMandatory = true;

        onFileProcessed({
          jdText: structuredJd,
          rawJdText: rawText,
          jobPosition: jobPosition || '',
          hardFilters: { ...(extractedFilters || {}), ...mandatoryUpdates },
        });

        setJdReady(true);
        setJdFileName(file.name);
        setSuccessMsg(`Đã nạp JD: ${file.name}`);
      } catch (err: any) {
        setErrorMsg(getSafeErrorMessage(err, 'ai'));
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    event.target.value = '';
  };

  const handleGoogleDrive = async () => {
    try {
      setErrorMsg('');
      const driveFiles = await googleDriveService.pickAndImportFiles({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: false,
        fileType: 'jd',
      });

      if (driveFiles.length > 0) {
        await processFile(driveFiles[0]);
      }
    } catch (err: any) {
      if (isRedirectingToGoogle(err)) {
        return;
      }
      setErrorMsg(getSafeErrorMessage(err, 'drive'));
    }
  };

  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      appendCvFiles(Array.from(event.target.files));
    }
    event.target.value = '';
  };

  const handleCvDriveSelect = async () => {
    try {
      setCvError('');
      setIsLoadingCvDrive(true);
      const driveFiles = await googleDriveService.pickAndImportFiles({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: true,
        fileType: 'cv',
      });

      if (driveFiles.length === 0) return;
      appendCvFiles(driveFiles);
    } catch (err: any) {
      if (isRedirectingToGoogle(err)) {
        return;
      }
      setCvError(getSafeErrorMessage(err, 'drive'));
    } finally {
      setIsLoadingCvDrive(false);
    }
  };

  const loadCvLibrary = useCallback(async () => {
    setIsLoadingCvLibrary(true);
    setCvLibraryError('');
    try {
      const response = await fetchFilteredCvLibrary({ historyLimit: 30, candidateLimit: 160 });
      setCvLibraryCandidates(response.candidates);
      setCvLibraryHistory(response.history);
    } catch (err: any) {
      setCvLibraryCandidates([]);
      setCvLibraryHistory([]);
      setCvLibraryError(getSafeErrorMessage(err, 'ai') || 'Không thể tải thư viện CV.');
    } finally {
      setIsLoadingCvLibrary(false);
    }
  }, []);

  const openCvLibrary = () => {
    setIsCvLibraryOpen(true);
    setSelectedLibraryCvIds(new Set());
    if (cvLibraryCandidates.length === 0 && !isLoadingCvLibrary) {
      void loadCvLibrary();
    }
  };

  const toggleLibraryCandidate = (candidate: MobileInboxCandidate) => {
    setSelectedLibraryCvIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidate.id)) {
        next.delete(candidate.id);
        return next;
      }

      if (next.size >= remainingCvSlots) {
        setCvError(`Chỉ còn ${remainingCvSlots} chỗ trong phiên phân tích này.`);
        return next;
      }

      next.add(candidate.id);
      setCvError('');
      return next;
    });
  };

  const importSelectedLibraryCvs = () => {
    const selectedCandidates = cvLibraryCandidates.filter((candidate) => selectedLibraryCvIds.has(candidate.id));
    if (selectedCandidates.length === 0) return;

    const files = selectedCandidates.map((candidate) => createLibraryCvFile(candidate, cvLibraryHistory));
    appendCvFiles(files);
    setSuccessMsg(`Đã đưa ${files.length} hồ sơ từ thư viện CV vào phiên lọc.`);
    setIsCvLibraryOpen(false);
    setSelectedLibraryCvIds(new Set());
  };

  useEffect(() => {
    if (hasHandledPendingDriveRef.current) return;
    hasHandledPendingDriveRef.current = true;

    let cancelled = false;

    const resumePendingDriveImport = async () => {
      const pendingType = googleDriveService.getPendingImportFileType();

      try {
        if (pendingType === 'jd') {
          setErrorMsg('');
          setSuccessMsg('Đang tiếp tục kết nối Google Drive cho tệp JD...');
          setIsProcessing(true);
          setStage('jd');
        } else if (pendingType === 'cv') {
          setCvError('');
          setIsLoadingCvDrive(true);
          setStage('cv');
        }

        const driveFiles = await googleDriveService.resumePendingPickAndImportIfNeeded();
        if (cancelled || !driveFiles || driveFiles.length === 0) return;

        if (pendingType === 'jd') {
          await processFile(driveFiles[0]);
          return;
        }

        appendCvFiles(driveFiles);
        setSuccessMsg(`Đã nhập ${driveFiles.length} CV từ Google Drive.`);
      } catch (err: any) {
        if (isRedirectingToGoogle(err)) return;

        if (pendingType === 'jd') {
          setErrorMsg(getSafeErrorMessage(err, 'drive'));
        } else if (pendingType === 'cv') {
          setCvError(getSafeErrorMessage(err, 'drive'));
        }
      } finally {
        if (cancelled) return;
        if (pendingType === 'jd') {
          setIsProcessing(false);
        }
        if (pendingType === 'cv') {
          setIsLoadingCvDrive(false);
        }
      }
    };

    void resumePendingDriveImport();

    return () => {
      cancelled = true;
    };
  }, [appendCvFiles, processFile]);

  const handleRemoveCv = (index: number) => {
    setCvFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleClearCvFiles = () => {
    setCvFiles([]);
    setCvError('');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDropJdFile = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const [file] = Array.from(event.dataTransfer.files || []);
    if (file) {
      void processFile(file);
    }
  };

  const handleDropCvFiles = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      appendCvFiles(droppedFiles);
    }
  };

  const goToCv = () => {
    if (!jdReady) return;
    setStage('cv');
  };

  return (
    <div
      className={`relative flex w-full overflow-hidden bg-white text-slate-900 transition-opacity duration-300 ${
        embedded ? 'h-full min-h-0' : 'h-[100svh]'
      } ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {isProcessing && <ProcessingModal step={processingStep} />}
      {isCvLibraryOpen && (
        <CvLibraryImportModal
          candidates={cvLibraryCandidates}
          history={cvLibraryHistory}
          selectedIds={selectedLibraryCvIds}
          query={cvLibraryQuery}
          isLoading={isLoadingCvLibrary}
          error={cvLibraryError}
          remainingSlots={Math.max(0, remainingCvSlots)}
          onQueryChange={setCvLibraryQuery}
          onReload={() => void loadCvLibrary()}
          onToggle={toggleLibraryCandidate}
          onClose={() => setIsCvLibraryOpen(false)}
          onImport={importSelectedLibraryCvs}
        />
      )}

      <aside className={`relative z-10 h-full w-[19rem] shrink-0 flex-col border-r border-blue-100 bg-white/95 shadow-[18px_0_44px_rgba(30,64,175,0.07)] ${embedded ? 'hidden' : 'hidden lg:flex'}`}>
        <div className="flex h-[6.6rem] items-center gap-3 border-b border-blue-100 px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a] text-sm font-black text-[white] shadow-sm">S</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">SupportHR <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">AI</span></p>
            <p className="truncate text-xs text-slate-500">Trí tuệ tuyển dụng</p>
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-blue-100" />
            <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Quy trình</span>
            <span className="h-px flex-1 bg-blue-100" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setStage('jd')}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                stage === 'jd' ? 'border-blue-200 bg-blue-50 text-slate-900' : 'border-transparent text-slate-500 hover:bg-blue-50/70 hover:text-slate-900'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-600">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Mô tả công việc</span>
                <span className="block truncate text-xs text-slate-500">{jdReady ? 'JD đã sẵn sàng' : 'Nhập JD - Bước 1'}</span>
              </span>
              {jdReady && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
            </button>

            <button
              type="button"
              onClick={goToCv}
              disabled={!jdReady}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                stage === 'cv' ? 'border-blue-200 bg-blue-50 text-slate-900' : 'border-transparent text-slate-500 hover:bg-blue-50/70 hover:text-slate-900'
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-600">
                <UploadCloud className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Danh sách CV</span>
                <span className="block truncate text-xs text-slate-500">{cvFiles.length}/{MAX_CV_PER_BATCH} hồ sơ</span>
              </span>
            </button>
          </div>
        </div>

        <div className="mt-auto border-t border-blue-100 p-5">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-500">AI intake</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Tổng hợp hồ sơ</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Chuẩn hóa JD và danh sách CV trước khi phân tích.</p>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-7 sm:py-5 lg:overflow-hidden lg:px-8 xl:px-10">
        {!embedded && (
        <header className="shrink-0">
          <div className="flex flex-col gap-5 border-b border-blue-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                Nạp JD & CV
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Cổng nộp tài liệu HR: đọc JD trước, sau đó nạp danh sách CV để phân tích.
              </p>
            </div>

            <div className="flex min-w-0 gap-8 border-b border-blue-100 lg:min-w-[25rem]">
              <StepButton
                active={stage === 'jd'}
                index="01"
                label="Nạp JD"
                description={jdReady ? 'Đã sẵn sàng' : 'Bước bắt buộc'}
                onClick={() => setStage('jd')}
              />
              <StepButton
                active={stage === 'cv'}
                disabled={!jdReady}
                index="02"
                label="Nạp CV"
                description={`${cvFiles.length}/${MAX_CV_PER_BATCH} hồ sơ`}
                onClick={goToCv}
              />
            </div>
          </div>
        </header>
        )}

        {stage === 'jd' ? (
          <main className="grid min-h-max flex-none gap-6 py-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:py-6">
            <section className="flex min-h-0 flex-col">
              <div className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="supporthr-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2388ff]/75">
                    Bước 01
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Nạp JD</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Tải JD để hệ thống đọc nội dung, chuẩn hóa tiêu chí.
                  </p>
                </div>
                <div className="supporthr-mono w-fit shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {isProcessing ? `${String(processingStep + 1).padStart(2, '0')}/04` : jdReady ? '04/04' : '00/04'}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={FILE_ACCEPT}
                onChange={handleFileChange}
                title="Tải lên tệp JD"
                aria-label="Tải lên tệp JD"
              />

              <div
                className="mt-5 flex min-h-[240px] flex-col justify-between rounded-2xl border border-dashed border-blue-100 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-white sm:p-6 lg:min-h-[360px]"
                onDragOver={handleDragOver}
                onDrop={handleDropJdFile}
              >
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#2388ff]/24 bg-[#2388ff]/8 text-[#2388ff] sm:h-20 sm:w-20">
                    {isProcessing ? (
                      <Loader2 className="h-8 w-8 animate-spin sm:h-9 sm:w-9" />
                    ) : jdReady ? (
                      <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9" />
                    ) : (
                      <UploadCloud className="h-8 w-8 sm:h-9 sm:w-9" />
                    )}
                  </div>
                  <p className="mt-5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {isProcessing ? 'Đang xử lý JD' : jdReady ? 'JD đã sẵn sàng' : 'Kéo thả JD'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {isProcessing
                      ? PROCESSING_STEPS[processingStep]
                      : jdReady
                        ? jdFileName || 'Nội dung JD đã được chuẩn hóa.'
                        : 'Hỗ trợ PDF, DOCX, PNG, JPG'}
                  </p>

                  <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={isProcessing}
                      className={secondaryButtonClass}
                    >
                      <HardDriveUpload className="h-4 w-4" />
                      {jdReady ? 'Đổi file' : 'Nạp file'}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleGoogleDrive();
                      }}
                      disabled={isProcessing}
                      className={secondaryButtonClass}
                    >
                      <FolderOpen className="h-4 w-4" />
                      Drive
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        (onUseTemplate ?? onGetStarted)();
                      }}
                      disabled={isProcessing}
                      className={secondaryButtonClass}
                    >
                      <FileText className="h-4 w-4" />
                      Mẫu
                    </button>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 border-l border-red-400/50 bg-red-500/5 px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="mt-auto flex flex-col gap-2 border-t border-blue-100 pt-4 sm:flex-row sm:gap-3 lg:mt-6">
                <button
                  type="button"
                  onClick={goToCv}
                  disabled={!jdReady}
                  className={`${primaryButtonClass} flex-1`}
                >
                  Tiếp tục nạp CV
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="flex min-h-[300px] flex-col overflow-hidden border-t border-blue-100 pt-5 lg:min-h-0 lg:border-l border-blue-100 lg:border-t-0 lg:pl-10 lg:pt-0">
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">Thông tin JD</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-500 sm:block">
                    Dùng để trích xuất điều kiện bắt buộc và tiêu chí đánh giá.
                  </p>
                </div>
                <span className="supporthr-mono shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  {previewCharacterCount > 0 ? `${previewCharacterCount.toLocaleString('vi-VN')} ký tự` : 'Chưa có dữ liệu'}
                </span>
              </div>

              <div className="grid min-h-0 flex-1 gap-4 mt-5 lg:grid-rows-[auto_minmax(0,1fr)]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {extractedRules.length > 0 ? (
                    extractedRules.map((rule) => {
                      const Icon = rule.icon;

                      return (
                        <div key={rule.label} className="rounded-xl border border-blue-100 bg-blue-50/55 p-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-600">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{rule.label}</span>
                          </div>
                          <p className="mt-2 truncate text-sm font-bold text-slate-950">{String(rule.value)}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/55 p-3 sm:col-span-2 xl:col-span-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <ListChecks className="h-4 w-4 text-blue-600" />
                        Chưa có điều kiện bắt buộc được trích xuất.
                      </div>
                    </div>
                  )}
                </div>

                <div className="custom-scrollbar min-h-[18rem] overflow-y-auto rounded-xl border border-blue-100 bg-slate-50 p-4">
                  {previewText ? (
                    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-7 text-slate-900">{previewText}</pre>
                  ) : (
                    <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
                      <FileText className="h-12 w-12 text-slate-400" />
                      <p className="mt-4 text-base font-bold text-slate-950">Nội dung JD sẽ hiển thị tại đây</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                        Tải file JD hoặc chọn mẫu để xem bản mô tả công việc đã đọc được.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>
        ) : (
          <main className="grid min-h-max flex-none gap-6 py-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:py-6">
            <section className="flex min-h-0 flex-col">
              {embedded && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5">
                  <Settings2 className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="flex-1 text-xs text-slate-600">
                    JD và tiêu chí lọc được cấu hình qua{' '}
                    <button
                      type="button"
                      onClick={onUseTemplate}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Cài đặt tiêu chí lọc
                    </button>
                    {' '}trên thanh công cụ.
                  </span>
                  {hasPreparedJd ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      JD đã cài đặt
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-500">Chưa có JD</span>
                  )}
                </div>
              )}

              <div className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="supporthr-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2388ff]/75">
                    {embedded ? 'Bước 01' : 'Bước 02'}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Nạp CV</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Tối đa {MAX_CV_PER_BATCH} hồ sơ trong một lần phân tích.
                  </p>
                </div>
                <div className="supporthr-mono w-fit shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {cvFiles.length}/{MAX_CV_PER_BATCH} CV
                </div>
              </div>

              <input
                ref={cvFileInputRef}
                type="file"
                multiple
                accept={FILE_ACCEPT}
                className="hidden"
                onChange={handleCvFileChange}
                title="Tải lên danh sách CV"
                aria-label="Tải lên danh sách CV"
              />

              <div
                className="mt-5 flex min-h-[240px] flex-col justify-between rounded-2xl border border-dashed border-blue-100 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-white sm:p-6 lg:min-h-[360px]"
                onDragOver={handleDragOver}
                onDrop={handleDropCvFiles}
              >
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#2388ff]/24 bg-[#2388ff]/8 text-[#2388ff] sm:h-20 sm:w-20">
                    <UploadCloud className="h-8 w-8 sm:h-9 sm:w-9" />
                  </div>
                  <p className="mt-5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Kéo thả CV</p>
                  <p className="mt-2 text-sm text-slate-500">PDF, DOCX, PNG, JPG</p>

                  <div className="relative z-10 mt-4 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        cvFileInputRef.current?.click();
                      }}
                      className={secondaryButtonClass}
                    >
                      <HardDriveUpload className="h-4 w-4" />
                      File
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCvDriveSelect();
                      }}
                      disabled={isLoadingCvDrive}
                      className={secondaryButtonClass}
                    >
                      {isLoadingCvDrive ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2388ff] border-t-transparent" />
                      ) : (
                        <FolderOpen className="h-4 w-4" />
                      )}
                      Drive
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openCvLibrary();
                      }}
                      disabled={remainingCvSlots <= 0}
                      className={secondaryButtonClass}
                    >
                      <Database className="h-4 w-4" />
                      Thư viện CV
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Tiến độ hồ sơ</span>
                    <span className="supporthr-mono">{cvFiles.length}/{MAX_CV_PER_BATCH}</span>
                  </div>
                  <div className="mt-2 h-px bg-blue-100">
                    <div
                      ref={progressBarRef}
                      className="h-px bg-[#2388ff] transition-[width] duration-500"
                    />
                  </div>
                </div>
              </div>

              {cvError && (
                <div className="mt-4 border-l border-red-400/50 bg-red-500/5 px-4 py-3 text-sm text-red-700">
                  {cvError}
                </div>
              )}

              <div className="mt-auto flex flex-col gap-2 border-t border-blue-100 pt-4 sm:flex-row sm:gap-3 lg:mt-6">
                {!embedded && (
                  <button type="button" onClick={() => setStage('jd')} className={`${secondaryButtonClass} sm:w-auto`}>
                    <ArrowLeft className="h-4 w-4" />
                    JD
                  </button>
                )}
                <button
                  type="button"
                  onClick={onGetStarted}
                  disabled={!canContinue}
                  className={`${primaryButtonClass} flex-1`}
                >
                  {continueLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="flex min-h-[300px] flex-col overflow-hidden border-t border-blue-100 pt-5 lg:min-h-0 lg:border-l border-blue-100 lg:border-t-0 lg:pl-10 lg:pt-0">
              <div className="flex shrink-0 items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">Danh sách CV</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-500 sm:block">Kiểm tra và loại bỏ tệp trước khi phân tích.</p>
                </div>

                {cvFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCvFiles}
                    className="px-1 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-red-600"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="custom-scrollbar mt-5 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-blue-100 bg-white p-2">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-4 text-center sm:min-h-[360px]">
                    <FileText className="h-10 w-10 text-slate-400 sm:h-12 sm:w-12" />
                    <p className="mt-4 text-base font-semibold text-slate-900">Chưa có CV</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      File đã nạp sẽ hiện tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-3 shadow-[0_10px_26px_rgba(30,64,175,0.05)] transition-colors hover:border-blue-200 hover:bg-blue-50/70"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#2388ff]">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-950">{file.name}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <span className="supporthr-mono hidden h-8 min-w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-2 text-[10px] font-bold text-blue-700 sm:inline-flex">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCv(index)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Xóa ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
};

export default CVScreenerWelcome;
