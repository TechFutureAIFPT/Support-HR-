import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, Mail, MessageSquareText, PanelRightClose, PanelRightOpen, PlayCircle, Send, Star, TriangleAlert, Zap } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import type { AnalysisFeedbackDraft, AnalysisFeedbackRecord, AppStep, Candidate, HardFilters, RecruiterInfo, WeightCriteria } from '@/types';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import CvDocumentViewer from '@/features/cv-management/CvDocumentViewer';
import { ScoreLabel, WorkspaceEmpty, WorkspaceSearch } from '@/components/workspace/WorkspacePrimitives';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';
import ExpandedContent from '@/features/cv-management/ExpandedContent';
import CandidateEmailNotifier from '@/features/email/CandidateEmailNotifier';
import AIFeedbackForm from '@/features/feedback/AIFeedbackForm';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';
import { useBreakpoint } from '@/hooks/useDeviceDetection';

interface AnalysisResultsProps {
  isLoading: boolean;
  loadingMessage: string;
  results: Candidate[];
  jobPosition: string;
  locationRequirement: string;
  jdText: string;
  setActiveStep?: (step: AppStep) => void;
  markStepAsCompleted?: (step: AppStep) => void;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
  documentOwner?: string;
  feedbackByCandidate?: Record<string, AnalysisFeedbackRecord>;
}

type DetailTab = 'overview' | 'jdmatch' | 'criteria' | 'stats' | 'chat' | 'feedback';

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'jdmatch', label: 'So khớp JD' },
  { key: 'criteria', label: 'Tiêu chí' },
  { key: 'stats', label: 'Thống kê' },
  { key: 'chat', label: 'Tư vấn AI' },
  { key: 'feedback', label: 'Phản hồi điểm' },
];

function candidateScore(candidate: Candidate): number {
  return candidate.status === 'SUCCESS' ? candidate.analysis?.['Tổng điểm'] || 0 : 0;
}

function candidateRole(candidate: Candidate, fallback: string): string {
  return normalizeVietnameseDisplay(candidate.jobTitle) || normalizeVietnameseDisplay(fallback) || 'Vị trí chưa xác định';
}

function buildHeadlineVerdict(candidate: Candidate): string {
  if (candidate.hrSummary?.nhan_xet_tong_quan) return normalizeVietnameseDisplay(candidate.hrSummary.nhan_xet_tong_quan);
  if (candidate.stageDecision?.reason) return normalizeVietnameseDisplay(candidate.stageDecision.reason);
  const score = candidateScore(candidate);
  if (score >= 75) return 'Hồ sơ phù hợp tốt với vị trí — đề xuất ưu tiên đưa vào shortlist.';
  if (score >= 60) return 'Ứng viên đáp ứng phần lớn yêu cầu — nên xem xét mời phỏng vấn.';
  if (score >= 40) return 'Ứng viên có tiềm năng, còn một số điểm cần xác nhận thêm.';
  return 'Hồ sơ chưa đáp ứng đủ tiêu chí cốt lõi — cân nhắc trước khi đưa vào shortlist.';
}

function buildTopReasons(candidate: Candidate): string[] {
  const strengths = (candidate.analysis?.['Điểm mạnh CV'] || []).slice(0, 3);
  const matched = (candidate.jdCvMatchInsights?.matchedSkills || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...strengths, ...matched]) {
    const key = normalizeVietnameseDisplay(item).toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push(normalizeVietnameseDisplay(item)); }
    if (out.length >= 3) break;
  }
  return out;
}

function buildVerificationRisks(candidate: Candidate): string[] {
  const weaknesses = (candidate.analysis?.['Điểm yếu CV'] || []).slice(0, 2);
  const warnings = (candidate.softFilterWarnings || []).slice(0, 2);
  const missing = (candidate.jdCvMatchInsights?.missingRequirements || []).slice(0, 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...weaknesses, ...warnings, ...missing]) {
    const key = normalizeVietnameseDisplay(item).toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push(normalizeVietnameseDisplay(item)); }
    if (out.length >= 3) break;
  }
  return out;
}

type ActionResult = { label: string; colorClass: string; bgClass: string };
function buildSuggestedNextAction(score: number, riskCount: number): ActionResult {
  if (score >= 75 && riskCount === 0) return { label: 'Mời phỏng vấn', colorClass: 'text-[#34c759]', bgClass: 'bg-[#f0fff4] border-[#34c759]/30' };
  if (score >= 60 || riskCount <= 1) return { label: 'Phỏng vấn xác minh', colorClass: 'text-[#ff9f0a]', bgClass: 'bg-[#fff8ec] border-[#ff9f0a]/30' };
  return { label: 'Chưa ưu tiên shortlist', colorClass: 'text-[#86868b]', bgClass: 'bg-[#f5f5f7] border-[#d2d2d7]' };
}

// ── StatsPane ────────────────────────────────────────────────────────────────
const CRITERIA_COLOR: Record<string, string> = {
  'Phù hợp JD (Job Fit)': '#007aff',
  'Kinh nghiệm': '#34c759',
  'Kỹ năng': '#af52de',
  'Thành tựu/KPI': '#ff9f0a',
  'Học vấn': '#5ac8fa',
  'Ngôn ngữ': '#ff6b35',
  'Chuyên nghiệp': '#30b0c7',
  'Gắn bó & Lịch sử CV': '#a2845e',
  'Phù hợp văn hoá': '#ff2d55',
};

const CRITERIA_SHORT: Record<string, string> = {
  'Phù hợp JD (Job Fit)': 'Job Fit',
  'Kinh nghiệm': 'K.Nghiệm',
  'Kỹ năng': 'Kỹ năng',
  'Thành tựu/KPI': 'KPI',
  'Học vấn': 'Học vấn',
  'Ngôn ngữ': 'Ngôn ngữ',
  'Chuyên nghiệp': 'C.Nghiệp',
  'Gắn bó & Lịch sử CV': 'Gắn bó',
  'Phù hợp văn hoá': 'Văn hoá',
};

// Circular score ring using plain SVG
const ScoreRing: React.FC<{ score: number; grade: string }> = ({ score, grade }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const gradeColor = grade === 'A' ? '#34c759' : grade === 'B' ? '#007aff' : '#ff9f0a';
  const gradeLabel = grade === 'A' ? 'Xuất sắc' : grade === 'B' ? 'Khá' : 'Cần xem xét';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#f2f2f7" strokeWidth={12} />
        <circle
          cx={70} cy={70} r={r} fill="none"
          stroke={gradeColor} strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={70} y={64} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={800} fill={gradeColor} fontFamily="system-ui">{score.toFixed(0)}</text>
        <text x={70} y={84} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#86868b" fontFamily="system-ui">/100</text>
      </svg>
      <span className="rounded-full px-3 py-0.5 text-[11px] font-bold" style={{ backgroundColor: gradeColor + '20', color: gradeColor }}>
        Hạng {grade} · {gradeLabel}
      </span>
    </div>
  );
};

// Recharts custom tooltip for bar chart
const CriteriaTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number; payload: { name: string; color: string } }> }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 shadow-lg text-[12px]">
      <p className="font-semibold text-[#1d1d1f]">{d.payload.name}</p>
      <p className="font-bold tabular-nums mt-0.5" style={{ color: d.payload.color }}>{d.value}<span className="font-normal text-[#86868b]">/100</span></p>
    </div>
  );
};

const StatsPane: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const score = candidateScore(candidate);
  const grade = candidate.analysis?.['Hạng'] || 'C';

  const criteria = useMemo(() => {
    const raw = candidate.analysis?.['Chi tiết'] || [];
    return raw.map((item) => ({
      name: item['Tiêu chí'],
      short: CRITERIA_SHORT[item['Tiêu chí']] || item['Tiêu chí'],
      score: parseInt(item['Điểm'].split('/')[0], 10) || 0,
      color: CRITERIA_COLOR[item['Tiêu chí']] || '#6e6e73',
    }));
  }, [candidate.analysis]);

  const radarData = useMemo(() =>
    criteria.map((c) => ({ name: c.short, score: c.score, fullMark: 100 })),
  [criteria]);

  const jdMatchPct = candidate.jdCvMatchInsights
    ? Math.round(candidate.jdCvMatchInsights.similarity * 1000) / 10
    : null;

  const expMonths = candidate.candidateProfile?.totalExperienceMonths;
  const expYears = expMonths != null ? (expMonths / 12).toFixed(1) : null;
  const eduLevel = candidate.candidateProfile?.educationLevel;

  const strengths = candidate.analysis?.['Điểm mạnh CV'] || [];
  const weaknesses = candidate.analysis?.['Điểm yếu CV'] || [];
  const redFlags = candidate.hrSummary?.canh_bao_red_flag || [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-4 sm:p-5 space-y-4">

      {/* ── Row 1: Score ring + key metrics ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Score ring */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 flex flex-col items-center justify-center">
          <ScoreRing score={score} grade={grade} />
        </div>

        {/* Key metrics stacked */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-2xl border border-[#d2d2d7] bg-white px-4 py-3 text-center">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#6e6e73] mb-1">JD Match</p>
            <p className="text-[22px] font-black tabular-nums text-[#007aff]">
              {jdMatchPct !== null ? `${jdMatchPct.toFixed(0)}%` : '--'}
            </p>
            <p className="text-[9px] text-[#86868b]">Semantic similarity</p>
          </div>
          <div className="flex-1 rounded-2xl border border-[#d2d2d7] bg-white px-4 py-3 text-center">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#6e6e73] mb-1">Kinh nghiệm</p>
            <p className="text-[22px] font-black tabular-nums text-[#34c759]">{expYears ?? '--'}</p>
            <p className="text-[9px] text-[#86868b]">{expYears ? 'năm' : 'chưa xác định'}</p>
          </div>
          {eduLevel && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-2 text-center">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#6e6e73] mb-0.5">Học vấn</p>
              <p className="text-[11px] font-semibold text-[#1d1d1f] leading-tight">{eduLevel}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Radar chart ── */}
      {radarData.length > 0 && (
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 pt-4 pb-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">Biểu đồ radar tiêu chí</p>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#e5e5ea" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#6e6e73', fontWeight: 600 }}
              />
              <Radar
                name="Điểm"
                dataKey="score"
                fill="#007aff"
                fillOpacity={0.18}
                stroke="#007aff"
                strokeWidth={2}
                dot={{ r: 3, fill: '#007aff', strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Row 3: Horizontal bar chart ── */}
      {criteria.length > 0 && (
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 pt-4 pb-2">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">Điểm từng tiêu chí</p>
          <ResponsiveContainer width="100%" height={criteria.length * 34 + 16}>
            <BarChart
              layout="vertical"
              data={criteria}
              margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
              barSize={12}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#86868b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="short" width={72} tick={{ fontSize: 10.5, fill: '#1d1d1f', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CriteriaTooltip />} cursor={{ fill: '#f2f2f7', radius: 6 }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 10, fontWeight: 700, formatter: (v: number) => v }}>
                {criteria.map((c) => <Cell key={c.name} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Row 4: Strengths & Weaknesses ── */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <div className="rounded-2xl border border-[#d1f5d3] bg-[#f6fff7] px-4 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#1a7f37]">
                <Star size={11} /> Điểm mạnh
              </p>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((item, i) => (
                  <span key={i} className="rounded-full border border-[#bbf0c3] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#1a7f37]">{item}</span>
                ))}
              </div>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="rounded-2xl border border-[#ffd6d6] bg-[#fff8f8] px-4 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#c00]">
                <TriangleAlert size={11} /> Điểm yếu
              </p>
              <div className="flex flex-wrap gap-1.5">
                {weaknesses.map((item, i) => (
                  <span key={i} className="rounded-full border border-[#ffb3b3] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#cc0000]">{item}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Row 5: Red flags ── */}
      {redFlags.length > 0 && (
        <div className="rounded-2xl border border-[#ff9f0a]/40 bg-[#fffbf0] px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#c77700]">
            <TriangleAlert size={11} /> Cảnh báo
          </p>
          <ul className="space-y-1">
            {redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-[#8a5a00]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff9f0a]" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── ChatPane ─────────────────────────────────────────────────────────────────
interface ChatMessage { role: 'user' | 'ai'; text: string; }

const CHAT_SUGGESTIONS = [
  'D\u1ef1a tr\u00ean th\u1ed1ng k\u00ea hi\u1ec7n c\u00f3, h\u00e3y t\u00f3m t\u1eaft v\u00ec sao \u1ee9ng vi\u00ean n\u00e0y \u0111\u1ea1t \u0111i\u1ec3m nh\u01b0 v\u1eady.',
  'Nh\u1eefng r\u1ee7i ro c\u1ea7n x\u00e1c minh tr\u1ef1c ti\u1ebfp l\u00e0 g\u00ec? H\u00e3y n\u00eau r\u00f5 theo t\u1eebng s\u1ed1 li\u1ec7u.',
  'T\u1ea1o 5 c\u00e2u h\u1ecfi ph\u1ecfng v\u1ea5n b\u00e1m \u0111\u00fang ti\u00eau ch\u00ed y\u1ebfu v\u00e0 ph\u1ea7n thi\u1ebfu c\u1ee7a \u1ee9ng vi\u00ean n\u00e0y.',
  'N\u1ebfu ch\u1ec9 d\u1ef1a tr\u00ean s\u1ed1 li\u1ec7u hi\u1ec7n c\u00f3, \u1ee9ng vi\u00ean n\u00e0y c\u00f3 n\u00ean v\u00e0o v\u00f2ng ti\u1ebfp theo kh\u00f4ng?',
];

function buildCandidateChatSnapshot(candidate: Candidate, jobPosition: string, jdText?: string) {
  const detailScores = (candidate.analysis?.['Chi ti\u1ebft'] ?? []).map((item) => {
    const scoreText = String(item['\u0110i\u1ec3m'] ?? '');
    const normalizedScore = Number.parseInt(scoreText.split('/')[0] || '0', 10) || 0;

    return {
      criterion: normalizeVietnameseDisplay(item['Ti\u00eau ch\u00ed'] ?? ''),
      score: normalizedScore,
      scoreText,
      evidence: normalizeVietnameseDisplay(item['D\u1eabn ch\u1ee9ng'] ?? '').slice(0, 220),
      explanation: normalizeVietnameseDisplay(item['Gi\u1ea3i th\u00edch'] ?? '').slice(0, 220),
      matchedSignals: item.advancedBreakdown?.matched_signals?.slice(0, 4) || [],
      missingRequirements: item.advancedBreakdown?.missing_requirements?.slice(0, 4) || [],
      verdict: item.advancedBreakdown?.verdict || '',
      evidenceQuality: item.advancedBreakdown?.evidence_quality || '',
    };
  });

  const ranked = [...detailScores].sort((left, right) => right.score - left.score);
  const profile = candidate.candidateProfile;
  const expYears = profile?.totalExperienceMonths != null ? Number((profile.totalExperienceMonths / 12).toFixed(1)) : null;
  const relevantYears = profile?.relevantExperienceMonths != null ? Number((profile.relevantExperienceMonths / 12).toFixed(1)) : null;
  const jdMatchPercent = candidate.jdCvMatchInsights
    ? Number((candidate.jdCvMatchInsights.similarity * 100).toFixed(1))
    : null;

  const screeningSummary = Object.entries(candidate.screeningSummary || {})
    .map(([key, value]) => {
      if (!value) return null;
      return {
        factor: key,
        status: value.status,
        mandatory: value.mandatory,
        observed: typeof value.observed === 'string' ? normalizeVietnameseDisplay(value.observed) : value.observed,
        expected: typeof value.expected === 'string' ? normalizeVietnameseDisplay(value.expected) : value.expected,
        reason: normalizeVietnameseDisplay(value.reason || ''),
        evidence: normalizeVietnameseDisplay(value.evidence || ''),
      };
    })
    .filter(Boolean);

  return {
    candidate: {
      id: candidate.id,
      name: normalizeVietnameseDisplay(candidate.candidateName),
      appliedRole: normalizeVietnameseDisplay(jobPosition),
      currentTitle: normalizeVietnameseDisplay(candidate.jobTitle || ''),
      totalScore: candidate.analysis?.['T\u1ed5ng \u0111i\u1ec3m'] || 0,
      grade: candidate.analysis?.['H\u1ea1ng'] || 'C',
      stageDecision: {
        status: candidate.stageDecision?.status || '',
        label: normalizeVietnameseDisplay(candidate.stageDecision?.label || ''),
        reason: normalizeVietnameseDisplay(candidate.stageDecision?.reason || ''),
        blockingReasons: candidate.stageDecision?.blockingReasons || [],
      },
      jdMatchPercent,
      experienceYears: expYears,
      relevantExperienceYears: relevantYears,
      experienceLevel: normalizeVietnameseDisplay(candidate.experienceLevel || ''),
      location: normalizeVietnameseDisplay(candidate.detectedLocation || ''),
      locationMatch: candidate.locationMatch,
      educationLevel: normalizeVietnameseDisplay(profile?.educationLevel || ''),
      educationMajors: profile?.educationMajors || [],
      experienceDomains: profile?.experienceDomains || [],
    },
    strengths: (candidate.analysis?.['\u0110i\u1ec3m m\u1ea1nh CV'] || []).slice(0, 5).map((item) => normalizeVietnameseDisplay(item)),
    weaknesses: (candidate.analysis?.['\u0110i\u1ec3m y\u1ebfu CV'] || []).slice(0, 5).map((item) => normalizeVietnameseDisplay(item)),
    warnings: {
      softFilterWarnings: (candidate.softFilterWarnings || []).slice(0, 5).map((item) => normalizeVietnameseDisplay(item)),
      autoRejectReasons: (candidate.autoRejectReasons || []).slice(0, 5).map((item) => normalizeVietnameseDisplay(item)),
      hardFilterFailureReason: normalizeVietnameseDisplay(candidate.hardFilterFailureReason || ''),
      redFlags: (candidate.hrSummary?.canh_bao_red_flag || []).slice(0, 5).map((item) => normalizeVietnameseDisplay(item)),
      debiasingWarnings: (candidate.debiasingWarnings || []).slice(0, 5).map((item) => normalizeVietnameseDisplay(item)),
    },
    criteria: {
      top: ranked.slice(0, 4),
      weak: [...ranked].reverse().slice(0, 4),
      full: detailScores.slice(0, 8),
    },
    jdCvMatch: candidate.jdCvMatchInsights ? {
      matchedSkills: candidate.jdCvMatchInsights.matchedSkills.slice(0, 8),
      missingSkills: candidate.jdCvMatchInsights.missingSkills.slice(0, 8),
      transferMatches: candidate.jdCvMatchInsights.transferMatches.slice(0, 6),
      matchedRequirements: (candidate.jdCvMatchInsights.matchedRequirements || []).slice(0, 8),
      missingRequirements: (candidate.jdCvMatchInsights.missingRequirements || []).slice(0, 8),
    } : null,
    hrSummary: candidate.hrSummary ? {
      overall: normalizeVietnameseDisplay(candidate.hrSummary.nhan_xet_tong_quan || ''),
      requiredYears: normalizeVietnameseDisplay(candidate.hrSummary.kinh_nghiem?.so_nam_yeu_cau || ''),
      actualYears: normalizeVietnameseDisplay(candidate.hrSummary.kinh_nghiem?.so_nam_thuc_te || ''),
      conclusion: normalizeVietnameseDisplay(candidate.hrSummary.kinh_nghiem?.ket_luan || ''),
      skills: candidate.hrSummary.danh_gia_ky_nang.slice(0, 6).map((item) => ({
        name: normalizeVietnameseDisplay(item.ten_ky_nang),
        level: normalizeVietnameseDisplay(item.muc_do_dap_ung),
        evidence: normalizeVietnameseDisplay(item.bang_chung_tu_cv),
      })),
    } : null,
    screeningSummary,
    embedding: candidate.embeddingInsights ? {
      industry: normalizeVietnameseDisplay(candidate.embeddingInsights.industry || ''),
      averageSimilarity: candidate.embeddingInsights.averageSimilarity,
      bonusPoints: candidate.embeddingInsights.bonusPoints,
      topMatches: candidate.embeddingInsights.topMatches.slice(0, 4),
    } : null,
    jdExcerpt: normalizeVietnameseDisplay(jdText || '').slice(0, 600),
  };
}

const ChatPane: React.FC<{ candidate: Candidate; jobPosition: string; jdText?: string; recruiterInfo?: RecruiterInfo }> = ({ candidate, jobPosition, jdText, recruiterInfo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const candidateSnapshot = useMemo(
    () => buildCandidateChatSnapshot(candidate, jobPosition, jdText),
    [candidate, jdText, jobPosition],
  );
  const score = candidate.analysis?.['T\u1ed5ng \u0111i\u1ec3m'] || 0;
  const grade = candidate.analysis?.['H\u1ea1ng'] || 'C';
  const snapshotStats = [
    { label: 'T\u1ed5ng \u0111i\u1ec3m', value: `${score}/100` },
    { label: 'H\u1ea1ng', value: grade },
    { label: 'JD match', value: candidateSnapshot.candidate.jdMatchPercent != null ? `${candidateSnapshot.candidate.jdMatchPercent}%` : '--' },
    { label: 'Kinh nghi\u1ec7m', value: candidateSnapshot.candidate.experienceYears != null ? `${candidateSnapshot.candidate.experienceYears} n\u0103m` : '--' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => JSON.stringify(candidateSnapshot, null, 2);

  const formatAiChatResponse = (rawText: string) => rawText
    .replace(/\r\n/g, '\n')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^[\-\u2022]\s+/, ''))
    .map((line) => line.replace(/^>\s+/, ''))
    .filter(Boolean)
    .join('\n');

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let context = '';
    try {
      context = buildContext();
    } catch {
      // buildContext crash - continue with empty context
    }

    const recruiterCtx = recruiterInfo?.title && recruiterInfo?.company
      ? `B\u1ea1n \u0111ang h\u1ed7 tr\u1ee3 ${recruiterInfo.title} t\u1ea1i ${recruiterInfo.company}${recruiterInfo.department ? `, ph\u00f2ng ${recruiterInfo.department}` : ''}. `
      : '';

    const prompt = [
      `B\u1ea1n l\u00e0 tr\u1ee3 l\u00fd tuy\u1ec3n d\u1ee5ng AI chuy\u00ean s\u00e2u cho m\u1ed9t \u1ee9ng vi\u00ean duy nh\u1ea5t. ${recruiterCtx}Ch\u1ec9 \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n d\u1ef1a tr\u00ean s\u1ed1 li\u1ec7u v\u00e0 evidence c\u00f3 trong snapshot.`,
      'Y\u00eau c\u1ea7u b\u1eaft bu\u1ed9c:',
      '- M\u1ecdi nh\u1eadn \u0111\u1ecbnh ph\u1ea3i b\u00e1m v\u00e0o th\u1ed1ng k\u00ea c\u1ee5 th\u1ec3 nh\u01b0 t\u1ed5ng \u0111i\u1ec3m, JD match, ti\u00eau ch\u00ed m\u1ea1nh/y\u1ebfu, matched/missing skills, stage decision, red flags.',
      '- N\u1ebfu d\u1eef li\u1ec7u ch\u01b0a \u0111\u1ee7, ph\u1ea3i n\u00f3i r\u00f5 m\u1ee5c n\u00e0o \u0111ang thi\u1ebfu d\u1eef li\u1ec7u.',
      '- Kh\u00f4ng \u0111\u01b0\u1ee3c tr\u1ea3 l\u1eddi chung chung ki\u1ec3u c\u1ea3m t\u00ednh.',
      '- \u01afu ti\u00ean n\u00eau b\u1eb1ng ch\u1ee9ng \u0111\u1ecbnh l\u01b0\u1ee3ng tr\u01b0\u1edbc r\u1ed3i m\u1edbi khuy\u1ebfn ngh\u1ecb.',
      '- Khi n\u00f3i r\u1ee7i ro, c\u1ea7n g\u1eafn v\u1edbi ch\u1ec9 s\u1ed1 ho\u1eb7c criteria \u0111ang y\u1ebfu.',
      '- Kh\u00f4ng d\u00f9ng markdown, kh\u00f4ng d\u00f9ng d\u1ea5u *, kh\u00f4ng b\u00f4i \u0111\u1eadm, kh\u00f4ng d\u00f9ng bullet k\u00fd hi\u1ec7u.',
      '- M\u1ed7i \u00fd ph\u1ea3i n\u1eb1m tr\u00ean m\u1ed9t d\u00f2ng ri\u00eang, xu\u1ed1ng d\u00f2ng r\u00f5 r\u00e0ng, kh\u00f4ng g\u1ed9p \u00fd.',
      'C\u1ea5u tr\u00fac tr\u1ea3 l\u1eddi:',
      '1. K\u1ebft lu\u1eadn nhanh',
      '2. B\u1eb1ng ch\u1ee9ng th\u1ed1ng k\u00ea',
      '3. R\u1ee7i ro c\u1ea7n x\u00e1c minh',
      '4. C\u00e2u h\u1ecfi ph\u1ecfng v\u1ea5n n\u00ean h\u1ecfi',
      '5. \u0110\u1ec1 xu\u1ea5t b\u01b0\u1edbc ti\u1ebfp theo',
      'M\u1ed7i m\u1ee5c ch\u1ec9 1-3 \u00fd, m\u1ed7i \u00fd \u0111\u00fang m\u1ed9t d\u00f2ng, ng\u1eafn nh\u01b0ng c\u1ee5 th\u1ec3, vi\u1ebft ti\u1ebfng Vi\u1ec7t r\u00f5 r\u00e0ng.',
      context ? `\nSnapshot \u1ee9ng vi\u00ean:\n${context}` : '',
      `\nC\u00e2u h\u1ecfi c\u1ee7a recruiter: ${text}`,
    ].filter(Boolean).join('\n');

    try {
      const { apiPost } = await import('@/services/api/renderClient');
      const response = await (apiPost as (path: string, body: unknown, opts: unknown) => Promise<{ text?: string; responseText?: string }>)(
        '/api/gemini-chat',
        { model: 'gemini-2.0-flash', contents: prompt, config: { temperature: 0.3, maxOutputTokens: 1000 } },
        { authRequired: true }
      );
      const aiText = formatAiChatResponse(
        response.text?.trim() || response.responseText?.trim() || 'AI kh\u00f4ng tr\u1ea3 v\u1ec1 n\u1ed9i dung.'
      );
      setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i AI.';
      setMessages((prev) => [...prev, { role: 'ai', text: `L\u1ed7i: ${msg}. Vui l\u00f2ng th\u1eed l\u1ea1i.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {messages.length === 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#d2d2d7] bg-[#f8f8fa] px-4 py-3">
              <Bot size={16} className="text-[#007aff]" />
              <div>
                <p className="text-[13px] font-semibold text-[#1d1d1f]">T\u01b0 v\u1ea5n AI v\u1ec1 {normalizeVietnameseDisplay(candidate.candidateName)}</p>
                <p className="text-[11.5px] text-[#6e6e73]">Chatbot s\u1ebd d\u1ef1a v\u00e0o th\u1ed1ng k\u00ea v\u00e0 evidence c\u1ee7a ri\u00eang \u1ee9ng vi\u00ean n\u00e0y \u0111\u1ec3 t\u01b0 v\u1ea5n.</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {snapshotStats.map((item) => (
                <div key={item.label} className="rounded-xl border border-[#d2d2d7] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">{item.label}</p>
                  <p className="mt-1 text-[13px] font-bold text-[#1d1d1f]">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#86868b]">G\u1ee3i \u00fd c\u00e2u h\u1ecfi</p>
            <div className="space-y-2">
              {CHAT_SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} onClick={() => send(suggestion)} className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-2.5 text-left text-[13px] text-[#1d1d1f] transition hover:border-[#007aff] hover:bg-[#eef5ff]">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13px] leading-[1.55] ${msg.role === 'user' ? 'bg-[#007aff] text-white' : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#86868b]" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#86868b]" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#86868b]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-[#d2d2d7] bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }}
            placeholder="H\u1ecfi v\u1ec1 \u1ee9ng vi\u00ean n\u00e0y b\u1eb1ng th\u1ed1ng k\u00ea, \u0111i\u1ec3m s\u1ed1, r\u1ee7i ro..."
            className="flex-1 rounded-xl border border-[#d2d2d7] bg-[#f8f8fa] px-3.5 py-2 text-[13px] outline-none focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
            disabled={loading}
          />
          <button
            onClick={() => void send(input)}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007aff] text-white transition disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackPane: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (draft: AnalysisFeedbackDraft) => {
    setIsSubmitting(true);
    try {
      const key = `feedback:${candidate.id}`;
      localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0fff4]">
            <CheckCircle2 size={28} className="text-[#34c759]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">Đã lưu phản hồi</p>
          <p className="mt-1 text-[13px] text-[#6e6e73]">Phản hồi của bạn giúp cải thiện độ chính xác chấm điểm AI.</p>
          <button onClick={() => setSubmitted(false)} className="mt-4 text-[13px] text-[#007aff] hover:underline">Gửi phản hồi khác</button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#f7f9fc] p-4 sm:p-5">
      <div className="supporthr-page-shell">
      <div className="mb-4 flex items-center gap-2.5">
        <MessageSquareText size={15} className="text-[#007aff]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e6e73]">Phản hồi về chấm điểm AI</p>
      </div>
      <AIFeedbackForm
        candidateId={candidate.id}
        candidateName={normalizeVietnameseDisplay(candidate.candidateName)}
        fileName={candidate.fileName}
        aiScore={candidateScore(candidate)}
        candidateRank={candidate.analysis?.['Hạng']}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => { /* noop */ }}
      />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const CandidateAnalysisPane: React.FC<{ candidate: Candidate; scrollable?: boolean }> = ({ candidate, scrollable = true }) => {
  const score = candidateScore(candidate);
  const verdict = buildHeadlineVerdict(candidate);
  const reasons = buildTopReasons(candidate);
  const risks = buildVerificationRisks(candidate);
  const action = buildSuggestedNextAction(score, risks.length);

  const jdMatchPct = candidate.jdCvMatchInsights
    ? Math.round(candidate.jdCvMatchInsights.similarity * 1000) / 10
    : null;
  const hasLocationRisk = candidate.locationMatch === false;
  const detectedLocation = candidate.detectedLocation?.trim() || null;
  const scoreColor = score >= 75 ? '#34c759' : score >= 60 ? '#007aff' : score >= 40 ? '#ff9f0a' : '#ff3b30';

  return (
    <div className={scrollable ? 'custom-scrollbar h-full overflow-y-auto p-4 sm:p-5' : 'p-4 sm:p-5'}>
      {/* ── Verdict card ─────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-sm">
        <div className="px-5 pt-5 pb-3">
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#007aff]">Kết luận nhanh</p>
          <p className="text-[14.5px] font-semibold leading-[1.55] text-[#1d1d1f]">{verdict}</p>
        </div>

        {/* Stats strip + action badge */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#f2f2f7] px-5 py-3">
          <span className="inline-flex items-baseline gap-0.5 rounded-lg bg-[#f2f2f7] px-3 py-1.5">
            <span className="text-[17px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{score.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-[#86868b]">/100</span>
          </span>

          {jdMatchPct !== null && (
            <span className="inline-flex items-baseline gap-1 rounded-lg bg-[#f2f2f7] px-3 py-1.5">
              <span className="text-[10.5px] font-semibold text-[#86868b]">JD</span>
              <span className="text-[15px] font-black tabular-nums leading-none text-[#007aff]">{jdMatchPct.toFixed(0)}%</span>
            </span>
          )}

          {hasLocationRisk && detectedLocation && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff3b30]/20 bg-[#fff5f5] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3b30]" />
              <span className="text-[11px] font-semibold text-[#ff3b30]">{detectedLocation}</span>
            </span>
          )}

          <div className="flex-1" />

          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[12px] font-bold ${action.bgClass} ${action.colorClass}`}>
            <Zap size={12} />
            {action.label}
          </span>
        </div>
      </div>

      {/* ── Evidence 2-column grid ────────────────────────── */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#34c759]">
            <CheckCircle2 size={13} />
            Vì sao nên cân nhắc
          </p>
          {reasons.length > 0 ? (
            <ul className="space-y-2.5">
              {reasons.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3a3a3c]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34c759]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Chưa có điểm nổi bật từ hồ sơ.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#d2d2d7] bg-white px-4 py-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#ff9f0a]">
            <TriangleAlert size={13} />
            Điểm cần xác minh
          </p>
          {risks.length > 0 ? (
            <ul className="space-y-2.5">
              {risks.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3a3a3c]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff9f0a]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Không có cảnh báo cần xử lý.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  isLoading,
  loadingMessage,
  results,
  jobPosition,
  jdText,
  weights,
  documentOwner = 'local',
  feedbackByCandidate: externalFeedback,
}) => {
  const { settings } = useUserSettings();
  const { isDesktopWide } = useBreakpoint();
  const recruiterInfo = settings.account.recruiterInfo;
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const sort = params.get('sort') === 'name' ? 'name' : 'score';
  const selectedId = params.get('candidate');
  const tab = (DETAIL_TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview') as DetailTab;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const [showCvPanel, setShowCvPanel] = useState(false);
  const [showEmailNotifier, setShowEmailNotifier] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, Record<string, boolean>>>({});
  const handleToggleCriterion = (candidateId: string, criterion: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [candidateId]: { ...(prev[candidateId] || {}), [criterion]: !(prev[candidateId]?.[criterion] ?? false) },
    }));
  };

  const successful = useMemo(() => results.filter((candidate) => candidate.status === 'SUCCESS'), [results]);
  const feedbackByCandidate = useMemo<Record<string, AnalysisFeedbackRecord>>(() => {
    if (externalFeedback && Object.keys(externalFeedback).length > 0) return externalFeedback;
    return Object.fromEntries(
      successful.map((c) => [c.id, { id: c.id, uid: '', userEmail: '', displayName: '', photoUrl: '', action: 'shortlist' as const }])
    );
  }, [externalFeedback, successful]);
  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filtered = normalized ? successful.filter((candidate) => [candidate.candidateName, candidate.jobTitle, candidate.fileName].some((value) => normalizeVietnameseDisplay(value).toLowerCase().includes(normalized))) : successful;
    return [...filtered].sort((a, b) => sort === 'name'
      ? normalizeVietnameseDisplay(a.candidateName).localeCompare(normalizeVietnameseDisplay(b.candidateName), 'vi')
      : candidateScore(b) - candidateScore(a));
  }, [search, sort, successful]);
  const selected = successful.find((candidate) => candidate.id === selectedId) || visible[0] || null;

  useEffect(() => {
    if (!selectedId && visible[0]?.id && isDesktopWide) setParam('candidate', visible[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktopWide, selectedId, visible]);

  if (isLoading) {
    return <SupportHRLoading mode="panel" minHeightClass="min-h-full" label="Support HR" title="Đang phân tích hồ sơ" description={loadingMessage || 'Đang tổng hợp dữ liệu ứng viên.'} stages={[{ label: 'Đọc CV', hint: 'Trích xuất thông tin', tone: 'cyan' }, { label: 'Đối chiếu', hint: 'So khớp tiêu chí', tone: 'violet' }, { label: 'Xếp hạng', hint: 'Chuẩn bị shortlist', tone: 'emerald' }]} />;
  }

  if (!successful.length) {
    return <WorkspaceEmpty title="Chưa có kết quả sàng lọc" description="Nạp CV và hoàn tất phân tích để xem danh sách ứng viên tại đây." />;
  }

  return (
    <section className="flex h-full min-h-0 bg-white text-[#1d1d1f]">
      <aside className={`${selectedId ? 'hidden xl:flex' : 'flex'} supporthr-analysis-rail min-h-0 w-full shrink-0 flex-col border-r border-[#d2d2d7] bg-white`}>
        <div className="shrink-0 border-b border-[#d2d2d7] p-3">
          <WorkspaceSearch value={search} onChange={(value) => setParam('q', value || null)} placeholder="Tìm ứng viên" />
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#6e6e73]">
            <span>{visible.length} ứng viên</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowEmailNotifier(true)} className="flex items-center gap-1 rounded px-2 py-0.5 text-[#007aff] hover:bg-[#eef5ff]">
                <Mail size={11} />Gửi email
              </button>
              <button type="button" onClick={() => setParam('sort', sort === 'score' ? 'name' : 'score')} className="rounded px-1 py-0.5 hover:bg-[#f2f2f5]">Sắp xếp: {sort === 'score' ? 'Điểm phù hợp' : 'Tên'}</button>
            </div>
          </div>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {visible.map((candidate) => {
            const score = candidateScore(candidate);
            const active = candidate.id === selected?.id;
            return (
              <button key={candidate.id} type="button" onClick={() => setParam('candidate', candidate.id)} className={`flex w-full items-center gap-3 border-b border-[#e5e5ea] px-5 py-4 text-left transition ${active ? 'bg-[#eef5ff] shadow-[inset_2px_0_0_#007aff]' : 'hover:bg-[#f8f8fa]'}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold">
                    {normalizeVietnameseDisplay(candidate.candidateName) || 'Ứng viên chưa xác định'}
                    {(candidate.videoLinks?.length ?? 0) > 0 && (
                      <span title="Có video giới thiệu"><PlayCircle size={13} className="shrink-0 text-rose-400" /></span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-[#6e6e73]">{candidateRole(candidate, jobPosition)}</p>
                </div>
                <ScoreLabel score={score} compact />
                <ChevronRight size={15} className="text-[#86868b]" />
              </button>
            );
          })}
        </div>
        <div className="h-11 shrink-0 border-t border-[#d2d2d7] px-4 py-3 text-[11px] text-[#6e6e73]">Hiển thị {visible.length} / {successful.length} ứng viên</div>
      </aside>

      <div className={`${selectedId ? 'flex' : 'hidden xl:flex'} min-w-0 flex-1 flex-col bg-white`}>
        {selected ? (
          <>
            <header className="shrink-0 border-b border-[#d2d2d7] bg-white">
              <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <button type="button" onClick={() => setParam('candidate', null)} className="apple-toolbar-icon apple-detail-back" aria-label="Quay lại danh sách"><ArrowLeft size={17} /></button>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[16px] font-medium text-[#007aff]">{normalizeVietnameseDisplay(selected.candidateName).split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</div>
                  <div className="min-w-0"><h2 className="truncate text-[24px] font-semibold tracking-[-0.02em]">{normalizeVietnameseDisplay(selected.candidateName)}</h2><p className="mt-1 truncate text-[13px] text-[#6e6e73]">{candidateRole(selected, jobPosition)}</p><div className="mt-1"><ScoreLabel score={candidateScore(selected)} /></div></div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  {(selected.videoLinks?.length ?? 0) > 0 && (
                    <a href={selected.videoLinks![0]} target="_blank" rel="noopener noreferrer" className="apple-toolbar-button !px-2.5 !text-rose-500" title="Xem video giới thiệu"><PlayCircle size={16} /></a>
                  )}
                  {tab === 'overview' && (
                    <button type="button" onClick={() => setShowCvPanel(v => !v)} className="apple-toolbar-button !px-2.5" title={showCvPanel ? 'Ẩn CV' : 'Hiện CV'}>
                      {showCvPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    </button>
                  )}
                </div>
              </div>
              <nav className="flex gap-5 overflow-x-auto px-4 text-[13px] sm:px-6" aria-label="Chi tiết ứng viên">
                {DETAIL_TABS.map((item) => (
                  <button key={item.key} type="button" onClick={() => setParam('tab', item.key)} className={`h-11 shrink-0 border-b-2 px-1 ${tab === item.key ? 'border-[#007aff] font-medium text-[#007aff]' : 'border-transparent text-[#515154] hover:text-[#1d1d1f]'}`}>
                    {item.label}
                  </button>
                ))}
              </nav>
            </header>

            <div className="min-h-0 flex-1">
              {tab === 'jdmatch' ? (
                <div className="custom-scrollbar h-full overflow-y-auto">
                  <ExpandedContent
                    candidate={selected}
                    expandedCriteria={expandedCriteria}
                    onToggleCriterion={handleToggleCriterion}
                    jdText={jdText}
                    weights={weights}
                    mode="full"
                    view="jdmatch"
                  />
                </div>
              ) : tab === 'criteria' ? (
                <div className="custom-scrollbar h-full overflow-y-auto">
                  <ExpandedContent
                    candidate={selected}
                    expandedCriteria={expandedCriteria}
                    onToggleCriterion={handleToggleCriterion}
                    jdText={jdText}
                    weights={weights}
                    mode="full"
                    view="criteria"
                  />
                </div>
              ) : tab === 'stats' ? (
                <StatsPane candidate={selected} />
              ) : tab === 'chat' ? (
                <ChatPane candidate={selected} jobPosition={jobPosition} jdText={jdText} recruiterInfo={recruiterInfo} />
              ) : tab === 'feedback' ? (
                <FeedbackPane candidate={selected} />
              ) : (
                /* overview */
                <div className={`${showCvPanel ? 'supporthr-analysis-split' : ''} grid h-full min-h-0`}>
                  <div className={`custom-scrollbar min-h-0 overflow-y-auto ${showCvPanel ? 'border-r border-[#d2d2d7]' : ''}`}>
                    <CandidateAnalysisPane candidate={selected} scrollable={false} />
                  </div>
                  {showCvPanel && <div className="hidden min-h-0 xl:block"><CvDocumentViewer ownerKey={documentOwner} candidate={selected} /></div>}
                </div>
              )}
            </div>
          </>
        ) : <WorkspaceEmpty title="Chọn một ứng viên" description="Chọn hồ sơ trong shortlist để xem phân tích và CV." />}
      </div>

      {showEmailNotifier && (
        <CandidateEmailNotifier
          candidates={successful}
          feedbackByCandidate={feedbackByCandidate}
          jobPosition={jobPosition}
          onClose={() => setShowEmailNotifier(false)}
        />
      )}
    </section>
  );
};

export default AnalysisResults;
