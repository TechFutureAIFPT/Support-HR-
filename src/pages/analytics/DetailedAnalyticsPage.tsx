import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  ListChecks,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { Candidate } from '@/types';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

interface DetailedAnalyticsPageProps {
  candidates: Candidate[];
  jobPosition: string;
  onReset: () => void;
}

type ChartKey = 'grade' | 'score' | 'radar' | 'trend';

const DETAILED_ANALYTICS_VIEW_KEY = 'supporthr.view.detailedAnalytics';

const gradeMeta = {
  A: { label: 'Hạng A', color: '#16a34a', bg: '#ecfdf3', border: '#bbf7d0' },
  B: { label: 'Hạng B', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  C: { label: 'Hạng C', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
} as const;

const chartTabs = [
  { key: 'grade' as const, label: 'Phân hạng', icon: PieChartIcon },
  { key: 'score' as const, label: 'Phân bố điểm', icon: BarChart3 },
  { key: 'radar' as const, label: 'Tiêu chí', icon: RadarIcon },
  { key: 'trend' as const, label: 'Xu hướng', icon: Activity },
];

const formatPercent = (value: number) => `${Math.round(value)}%`;

const parseScore = (scoreText?: string) => {
  if (!scoreText) return 0;

  const normalized = String(scoreText).replace(',', '.').trim();
  const fraction = normalized.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);

  if (fraction) {
    const earned = Number(fraction[1]);
    const max = Number(fraction[2]);
    if (Number.isFinite(earned) && Number.isFinite(max) && max > 0) {
      return Math.round((earned / max) * 100);
    }
  }

  const number = Number(normalized.replace('%', '').match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
};

const getCandidateScore = (candidate: Candidate) => candidate.analysis?.['Tổng điểm'] ?? 0;

const getCandidateGrade = (candidate: Candidate) => candidate.analysis?.['Hạng'] || 'C';

const getCandidateStatus = (candidate: Candidate) => {
  const score = getCandidateScore(candidate);
  const grade = getCandidateGrade(candidate);

  if (grade === 'A' || score >= 80) return 'Nên phỏng vấn';
  if (grade === 'B' || score >= 60) return 'Cần xem kỹ';
  return 'Rủi ro cao';
};

const getCandidateReason = (candidate: Candidate) => {
  const strengths = candidate.analysis?.['Điểm mạnh CV'] || [];
  const warnings = candidate.softFilterWarnings || [];

  if (strengths.length > 0) return strengths[0];
  if (warnings.length > 0) return warnings[0];
  if (candidate.stageDecision?.reason) return candidate.stageDecision.reason;
  return candidate.analysis?.['Chi tiết']?.[0]?.['Giải thích'] || 'Chưa có ghi chú nổi bật.';
};

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
};

const DetailedAnalyticsPage: React.FC<DetailedAnalyticsPageProps> = ({ candidates, jobPosition }) => {
  const [activeChart, setActiveChart] = useState<ChartKey>(() => {
    if (typeof window === 'undefined') return 'grade';

    const saved = window.localStorage.getItem(DETAILED_ANALYTICS_VIEW_KEY);
    return chartTabs.some((tab) => tab.key === saved) ? (saved as ChartKey) : 'grade';
  });
  const navigate = useNavigate();
  const storedRun = useMemo(() => readLatestAnalysisRun(), []);
  const effectiveCandidates = useMemo(
    () => candidates.length > 0 ? candidates : storedRun?.candidates || [],
    [candidates, storedRun],
  );
  const effectiveJobPosition = jobPosition || storedRun?.job.position || 'Phiên tuyển dụng hiện tại';

  useEffect(() => {
    window.localStorage.setItem(DETAILED_ANALYTICS_VIEW_KEY, activeChart);
  }, [activeChart]);

  const analyticsData = useMemo(() => {
    const successfulCandidates = effectiveCandidates.filter((candidate) => candidate.status === 'SUCCESS' && candidate.analysis);
    if (successfulCandidates.length === 0) return null;

    const scores = successfulCandidates.map(getCandidateScore);
    const gradeStats = {
      A: successfulCandidates.filter((candidate) => getCandidateGrade(candidate) === 'A').length,
      B: successfulCandidates.filter((candidate) => getCandidateGrade(candidate) === 'B').length,
      C: successfulCandidates.filter((candidate) => getCandidateGrade(candidate) === 'C').length,
    };

    const criteriaStats: Record<string, { total: number; count: number; scores: number[] }> = {};
    successfulCandidates.forEach((candidate) => {
      candidate.analysis?.['Chi tiết']?.forEach((detail) => {
        const criterion = detail['Tiêu chí'] || 'Tiêu chí chưa đặt tên';
        const score = parseScore(detail['Điểm']);

        if (!criteriaStats[criterion]) {
          criteriaStats[criterion] = { total: 0, count: 0, scores: [] };
        }

        criteriaStats[criterion].total += score;
        criteriaStats[criterion].count += 1;
        criteriaStats[criterion].scores.push(score);
      });
    });

    const criteriaAverages = Object.entries(criteriaStats)
      .map(([criterion, stats]) => {
        const average = Math.round(stats.total / Math.max(1, stats.count));
        return {
          criterion: criterion.length > 24 ? `${criterion.slice(0, 24)}...` : criterion,
          fullCriterion: criterion,
          average,
          count: stats.count,
          min: Math.min(...stats.scores),
          max: Math.max(...stats.scores),
          stdDev: Math.sqrt(stats.scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / Math.max(1, stats.count)),
        };
      })
      .sort((a, b) => b.average - a.average);

    const scoreDistribution = [
      { range: '0-49', min: 0, max: 49, fill: '#dc2626' },
      { range: '50-59', min: 50, max: 59, fill: '#f97316' },
      { range: '60-69', min: 60, max: 69, fill: '#f59e0b' },
      { range: '70-79', min: 70, max: 79, fill: '#2563eb' },
      { range: '80-89', min: 80, max: 89, fill: '#0891b2' },
      { range: '90-100', min: 90, max: 100, fill: '#16a34a' },
    ].map((bucket) => ({
      ...bucket,
      count: successfulCandidates.filter((candidate) => {
        const score = getCandidateScore(candidate);
        return score >= bucket.min && score <= bucket.max;
      }).length,
    }));

    const topPerformers = [...successfulCandidates]
      .sort((a, b) => getCandidateScore(b) - getCandidateScore(a))
      .slice(0, 6);

    const topCriteria = criteriaAverages.slice(0, 7).map((criterion) => ({
      subject: criterion.criterion,
      fullName: criterion.fullCriterion,
      score: criterion.average,
      fullMark: 100,
    }));

    const timeStats = successfulCandidates.map((candidate, index) => {
      const jdFit = candidate.analysis?.['Chi tiết']?.find((detail) => detail['Tiêu chí']?.toLowerCase().includes('jd'));
      return {
        order: index + 1,
        name: normalizeVietnameseDisplay(candidate.candidateName).split(' ').slice(-1)[0] || `CV${index + 1}`,
        score: getCandidateScore(candidate),
        jdFit: parseScore(jdFit?.['Điểm']),
      };
    });

    const totalCandidates = effectiveCandidates.length;
    const failedCount = totalCandidates - successfulCandidates.length;
    const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const topScore = Math.max(...scores);
    const lowScore = Math.min(...scores);
    const interviewReady = successfulCandidates.filter((candidate) => getCandidateGrade(candidate) === 'A' || getCandidateScore(candidate) >= 80);
    const reviewNeeded = successfulCandidates.filter((candidate) => !interviewReady.includes(candidate) && (getCandidateGrade(candidate) === 'B' || getCandidateScore(candidate) >= 60));
    const riskCandidates = successfulCandidates.filter((candidate) => getCandidateGrade(candidate) === 'C' || getCandidateScore(candidate) < 60);

    return {
      totalCandidates,
      failedCount,
      gradeStats,
      gradePercentages: {
        A: (gradeStats.A / successfulCandidates.length) * 100,
        B: (gradeStats.B / successfulCandidates.length) * 100,
        C: (gradeStats.C / successfulCandidates.length) * 100,
      },
      criteriaAverages,
      scoreDistribution,
      topCriteria,
      timeStats,
      topPerformers,
      avgScore,
      topScore,
      medianScore: median(scores),
      scoreSpread: topScore - lowScore,
      successRate: Math.round((successfulCandidates.length / Math.max(1, totalCandidates)) * 100),
      interviewReadyCount: interviewReady.length,
      reviewNeededCount: reviewNeeded.length,
      riskCount: riskCandidates.length,
      strongestCriterion: criteriaAverages[0],
      weakestCriterion: criteriaAverages[criteriaAverages.length - 1],
    };
  }, [effectiveCandidates]);

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #dbeafe',
    borderRadius: 8,
    color: '#102033',
    boxShadow: '0 18px 45px rgba(30,64,175,0.14)',
    fontSize: 12,
  };

  if (!analyticsData) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center bg-[#f6f8fb] px-4 py-10">
        <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            <FileSearch className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950">Chưa có dữ liệu dashboard</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
            Hãy chạy phân tích CV trước để hệ thống tạo shortlist, biểu đồ điểm và insight tuyển dụng cho phiên này.
          </p>
          <button
            type="button"
            onClick={() => navigate('/jd')}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Bắt đầu phân tích
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    );
  }

  const gradeData = (['A', 'B', 'C'] as const).map((grade) => ({
    name: gradeMeta[grade].label,
    value: analyticsData.gradeStats[grade],
    color: gradeMeta[grade].color,
    pct: analyticsData.gradePercentages[grade],
  }));

  const kpiCards = [
    {
      label: 'Tổng CV',
      value: analyticsData.totalCandidates,
      detail: `${analyticsData.successRate}% phân tích thành công`,
      icon: Users,
      tone: 'bg-slate-950 text-white',
    },
    {
      label: 'Điểm trung bình',
      value: analyticsData.avgScore,
      detail: `Median ${analyticsData.medianScore} | Biên độ ${analyticsData.scoreSpread}`,
      icon: Gauge,
      tone: 'bg-white text-slate-950',
    },
    {
      label: 'Nên phỏng vấn',
      value: analyticsData.interviewReadyCount,
      detail: 'Hạng A hoặc điểm từ 80',
      icon: CheckCircle2,
      tone: 'bg-white text-slate-950',
    },
    {
      label: 'Cần xem lại',
      value: analyticsData.reviewNeededCount,
      detail: 'Có tín hiệu tốt nhưng cần xác nhận',
      icon: Clock3,
      tone: 'bg-white text-slate-950',
    },
    {
      label: 'CV lỗi/chưa đạt',
      value: analyticsData.failedCount + analyticsData.riskCount,
      detail: `${analyticsData.failedCount} lỗi phân tích`,
      icon: AlertTriangle,
      tone: 'bg-white text-slate-950',
    },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <main className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                  Dashboard vận hành
                </span>
                <span className="text-xs font-semibold text-slate-500">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <h1 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Thống kê chi tiết</h1>
              <p className="mt-1 truncate text-sm font-semibold text-slate-500">{effectiveJobPosition}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Kết quả
              </button>
              <button
                type="button"
                onClick={() => navigate('/chatbot')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Zap className="h-4 w-4" />
                Gợi ý ứng viên
              </button>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              const isDark = card.tone.includes('slate-950');
              return (
                <article key={card.label} className={`rounded-lg border border-slate-200 p-4 shadow-sm ${card.tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{card.label}</p>
                      <p className="mt-3 text-3xl font-black tracking-tight">{card.value}</p>
                    </div>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className={`mt-3 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{card.detail}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
            <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">Shortlist ưu tiên</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Ứng viên nổi bật nhất</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/chatbot')}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                >
                  Phân tích sâu
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {analyticsData.topPerformers.map((candidate, index) => {
                  const grade = getCandidateGrade(candidate);
                  const meta = gradeMeta[grade];
                  const score = getCandidateScore(candidate);

                  return (
                    <div key={candidate.id} className="grid gap-3 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">#{index + 1}</span>
                        <div className="min-w-0 md:hidden">
                          <p className="truncate text-sm font-black text-slate-950">{normalizeVietnameseDisplay(candidate.candidateName)}</p>
                          <p className="truncate text-xs font-semibold text-slate-500">{normalizeVietnameseDisplay(candidate.jobTitle) || 'Chưa rõ vị trí'}</p>
                        </div>
                      </div>
                      <div className="hidden min-w-0 md:block">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-slate-950">{normalizeVietnameseDisplay(candidate.candidateName)}</p>
                          <span className="rounded-md border px-2 py-0.5 text-[10px] font-black" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{normalizeVietnameseDisplay(candidate.jobTitle) || 'Chưa rõ vị trí'}</p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{getCandidateReason(candidate)}</p>
                      </div>
                      <div className="min-w-[150px]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-500">{getCandidateStatus(candidate)}</span>
                          <span className="text-2xl font-black tracking-tight text-slate-950">{score}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, score))}%`, background: meta.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <aside className="grid gap-5">
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">Insight nhanh</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Việc cần xử lý</h2>
                  </div>
                  <ListChecks className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-4 grid gap-3">
                  <InsightRow
                    icon={TrendingUp}
                    label="Tiêu chí mạnh nhất"
                    value={analyticsData.strongestCriterion ? `${analyticsData.strongestCriterion.fullCriterion} (${analyticsData.strongestCriterion.average})` : 'Chưa có dữ liệu'}
                  />
                  <InsightRow
                    icon={Target}
                    label="Tiêu chí yếu nhất"
                    value={analyticsData.weakestCriterion ? `${analyticsData.weakestCriterion.fullCriterion} (${analyticsData.weakestCriterion.average})` : 'Chưa có dữ liệu'}
                  />
                  <InsightRow
                    icon={AlertTriangle}
                    label="Nhóm rủi ro"
                    value={`${analyticsData.riskCount} ứng viên hạng C hoặc điểm thấp`}
                  />
                  <InsightRow
                    icon={BriefcaseBusiness}
                    label="Bước tiếp theo"
                    value={analyticsData.interviewReadyCount > 0 ? 'Mở Gợi ý ứng viên để tạo câu hỏi phỏng vấn.' : 'Rà lại tiêu chí và shortlist nhóm hạng B.'}
                  />
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">Phân hạng</p>
                <div className="mt-4 grid gap-3">
                  {gradeData.map((grade) => (
                    <div key={grade.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-black text-slate-800">{grade.name}</span>
                        <span className="font-black" style={{ color: grade.color }}>{formatPercent(grade.pct)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${grade.pct}%`, background: grade.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">Biểu đồ phân tích</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Trực quan hóa phiên tuyển dụng</h2>
              </div>
              <div className="custom-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
                {chartTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeChart === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveChart(tab.key)}
                      className={`flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-black transition ${
                        active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4">
              {activeChart === 'grade' && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <ResponsiveContainer width="100%" height={310}>
                    <PieChart>
                      <Pie data={gradeData.filter((grade) => grade.value > 0)} dataKey="value" innerRadius={66} outerRadius={112} paddingAngle={4}>
                        {gradeData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="#ffffff" strokeWidth={4} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid content-center gap-3">
                    {gradeData.map((grade) => (
                      <div key={grade.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-black text-slate-950">{grade.name}</span>
                          <span className="text-lg font-black" style={{ color: grade.color }}>{grade.value}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{formatPercent(grade.pct)} tổng ứng viên đã phân tích</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeChart === 'score' && (
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={analyticsData.scoreDistribution}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={58}>
                      {analyticsData.scoreDistribution.map((entry) => (
                        <Cell key={entry.range} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeChart === 'radar' && (
                analyticsData.topCriteria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={analyticsData.topCriteria} outerRadius={115}>
                      <PolarGrid stroke="#dbeafe" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                      <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.18} strokeWidth={2.5} />
                      <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => analyticsData.topCriteria.find((item) => item.subject === label)?.fullName || label} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyPanel message="Chưa có tiêu chí đủ dữ liệu để vẽ radar." />
                )
              )}

              {activeChart === 'trend' && (
                <ResponsiveContainer width="100%" height={330}>
                  <AreaChart data={analyticsData.timeStats}>
                    <defs>
                      <linearGradient id="dashboardScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dashboardFit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="score" name="Tổng điểm" stroke="#2563eb" fill="url(#dashboardScore)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="jdFit" name="Phù hợp JD" stroke="#16a34a" fill="url(#dashboardFit)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">Chi tiết tiêu chí</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Điểm mạnh, điểm yếu và độ lệch</h2>
            </div>
            <div className="custom-scrollbar max-h-[520px] overflow-auto">
              {analyticsData.criteriaAverages.length > 0 ? (
                <table className="w-full min-w-[920px] text-left">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                    <tr>
                      {['Tiêu chí', 'Điểm TB', 'Độ lệch', 'Thấp nhất', 'Cao nhất', 'Số CV', 'Đánh giá'].map((header) => (
                        <th key={header} className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyticsData.criteriaAverages.map((criterion, index) => {
                      const tone = criterion.average >= 80 ? 'good' : criterion.average >= 60 ? 'ok' : 'risk';
                      const toneClass = tone === 'good'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : tone === 'ok'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700';
                      const label = tone === 'good' ? 'Tốt' : tone === 'ok' ? 'Khá' : 'Cần cải thiện';

                      return (
                        <tr key={criterion.fullCriterion} className="hover:bg-slate-50">
                          <td className="max-w-[360px] px-4 py-3">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">{index + 1}</span>
                              <span className="break-words text-sm font-bold leading-6 text-slate-800">{criterion.fullCriterion}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-[130px] items-center gap-2">
                              <span className="w-8 text-sm font-black text-slate-950">{criterion.average}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${criterion.average}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-600">{criterion.stdDev.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-600">{criterion.min}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-600">{criterion.max}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-600">{criterion.count}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-black ${toneClass}`}>{label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <EmptyPanel message="Chưa có dữ liệu chi tiết theo tiêu chí." />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const InsightRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const EmptyPanel = ({ message }: { message: string }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
    {message}
  </div>
);

export default DetailedAnalyticsPage;
