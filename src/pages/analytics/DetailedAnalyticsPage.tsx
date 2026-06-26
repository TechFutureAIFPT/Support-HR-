import React, { useMemo } from 'react';
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
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
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

const GRADE_META = {
  A: { label: 'Hạng A', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  B: { label: 'Hạng B', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  C: { label: 'Hạng C', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
} as const;

const TOOLTIP = {
  backgroundColor: '#fff',
  border: '1px solid #dbeafe',
  borderRadius: 8,
  color: '#0f172a',
  boxShadow: '0 8px 24px rgba(30,64,175,0.10)',
  fontSize: 12,
};

const parseScore = (text?: string): number => {
  if (!text) return 0;
  const s = String(text).replace(',', '.').trim();
  const frac = s.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
  if (frac) {
    const n = Number(frac[1]), d = Number(frac[2]);
    if (isFinite(n) && isFinite(d) && d > 0) return Math.round((n / d) * 100);
  }
  const n = Number(s.replace('%', '').match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0);
  return isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
};

const getScore  = (c: Candidate) => (c.analysis?.['Tổng điểm'] as number) ?? 0;
const getGrade  = (c: Candidate): 'A' | 'B' | 'C' => (c.analysis?.['Hạng'] as 'A' | 'B' | 'C') || 'C';
const getMedian = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[m - 1] + s[m]) / 2) : s[m];
};

const DetailedAnalyticsPage: React.FC<DetailedAnalyticsPageProps> = ({ candidates, jobPosition }) => {
  const navigate = useNavigate();
  const stored   = useMemo(() => readLatestAnalysisRun(), []);

  const allCandidates = useMemo(
    () => (candidates.length > 0 ? candidates : stored?.candidates ?? []),
    [candidates, stored]
  );
  const position = jobPosition || stored?.job.position || 'Phiên tuyển dụng';

  const data = useMemo(() => {
    const ok = allCandidates.filter((c) => c.status === 'SUCCESS' && c.analysis);
    if (!ok.length) return null;

    const scores = ok.map(getScore);
    const gradeCount = {
      A: ok.filter((c) => getGrade(c) === 'A').length,
      B: ok.filter((c) => getGrade(c) === 'B').length,
      C: ok.filter((c) => getGrade(c) === 'C').length,
    };

    // Criteria
    const cMap: Record<string, { total: number; n: number; vals: number[] }> = {};
    ok.forEach((c) =>
      c.analysis?.['Chi tiết']?.forEach((d) => {
        const key = d['Tiêu chí'] || 'Khác';
        const s   = parseScore(d['Điểm']);
        if (!cMap[key]) cMap[key] = { total: 0, n: 0, vals: [] };
        cMap[key].total += s;
        cMap[key].n += 1;
        cMap[key].vals.push(s);
      })
    );
    const criteriaRanked = Object.entries(cMap)
      .map(([name, s]) => {
        const avg = Math.round(s.total / Math.max(1, s.n));
        return {
          label  : name.length > 22 ? `${name.slice(0, 22)}…` : name,
          fullName: name,
          avg,
          n      : s.n,
          min    : Math.min(...s.vals),
          max    : Math.max(...s.vals),
          stdDev : Math.sqrt(s.vals.reduce((a, x) => a + (x - avg) ** 2, 0) / Math.max(1, s.n)),
        };
      })
      .sort((a, b) => b.avg - a.avg);

    const histogram = [
      { range: '0–49',   min: 0,  max: 49,  fill: '#ef4444' },
      { range: '50–59',  min: 50, max: 59,  fill: '#f97316' },
      { range: '60–69',  min: 60, max: 69,  fill: '#f59e0b' },
      { range: '70–79',  min: 70, max: 79,  fill: '#3b82f6' },
      { range: '80–89',  min: 80, max: 89,  fill: '#06b6d4' },
      { range: '90–100', min: 90, max: 100, fill: '#16a34a' },
    ].map((b) => ({ ...b, n: ok.filter((c) => { const s = getScore(c); return s >= b.min && s <= b.max; }).length }));

    const radarData = criteriaRanked.slice(0, 7).map((c) => ({
      subject : c.label,
      fullName: c.fullName,
      score   : c.avg,
      fullMark: 100,
    }));

    const trend = ok.map((c, i) => {
      const jdFit = c.analysis?.['Chi tiết']?.find((d) => d['Tiêu chí']?.toLowerCase().includes('jd'));
      return {
        name  : normalizeVietnameseDisplay(c.candidateName).split(' ').pop() ?? `CV${i + 1}`,
        score : getScore(c),
        jdFit : parseScore(jdFit?.['Điểm']),
      };
    });

    const top5          = [...ok].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);
    const avg           = Math.round(scores.reduce((a, x) => a + x, 0) / scores.length);
    const failed        = allCandidates.length - ok.length;
    const interviewOk   = ok.filter((c) => getGrade(c) === 'A' || getScore(c) >= 80);
    const reviewNeeded  = ok.filter((c) => !interviewOk.includes(c) && (getGrade(c) === 'B' || getScore(c) >= 60));
    const riskCount     = ok.filter((c) => getGrade(c) === 'C' || getScore(c) < 60).length;

    return {
      total: allCandidates.length, failed,
      successRate: Math.round((ok.length / Math.max(1, allCandidates.length)) * 100),
      gradeCount, gradePct: {
        A: (gradeCount.A / ok.length) * 100,
        B: (gradeCount.B / ok.length) * 100,
        C: (gradeCount.C / ok.length) * 100,
      },
      criteriaRanked, histogram, radarData, trend, top5,
      avg, median: getMedian(scores),
      spread: Math.max(...scores) - Math.min(...scores),
      interviewCount: interviewOk.length,
      reviewCount   : reviewNeeded.length,
      riskCount,
    };
  }, [allCandidates]);

  /* ── Empty state ─────────────────────────────── */
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f6f8fb] p-10">
        <section className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileSearch className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-950">Chưa có dữ liệu</h1>
          <p className="mt-2 text-[13px] text-slate-500">Chạy phân tích CV để xem dashboard tuyển dụng.</p>
          <button
            onClick={() => navigate('/jd')}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-blue-700"
          >
            Bắt đầu <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    );
  }

  const gradeRows = (['A', 'B', 'C'] as const).map((g) => ({
    name : GRADE_META[g].label,
    value: data.gradeCount[g],
    color: GRADE_META[g].color,
    pct  : data.gradePct[g],
  }));

  const kpis = [
    { label: 'Tổng CV',    value: data.total,          sub: `${data.successRate}% thành công`,   icon: Users,        accent: '#2563eb' },
    { label: 'Điểm TB',    value: data.avg,             sub: `Trung vị ${data.median}`,           icon: Gauge,        accent: '#7c3aed' },
    { label: 'Phỏng vấn',  value: data.interviewCount,  sub: 'Hạng A hoặc ≥ 80đ',               icon: CheckCircle2, accent: '#16a34a' },
    { label: 'Xem lại',    value: data.reviewCount,     sub: 'Tín hiệu tốt, cần xác nhận',       icon: Clock3,       accent: '#d97706' },
    { label: 'Rủi ro',     value: data.riskCount + data.failed, sub: `${data.failed} lỗi phân tích`, icon: AlertTriangle, accent: '#dc2626' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f0f4fa] text-slate-950">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <main className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-4 sm:px-6">

          {/* ── Header ──────────────────────────── */}
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">{new Date().toLocaleDateString('vi-VN')}</p>
              <h1 className="mt-0.5 truncate text-[22px] font-bold tracking-tight text-slate-950">
                Thống kê chi tiết
              </h1>
              <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">{position}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => navigate('/analysis')}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kết quả
              </button>
              <button
                onClick={() => navigate('/chatbot')}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Zap className="h-3.5 w-3.5" /> Gợi ý ứng viên
              </button>
            </div>
          </header>

          {/* ── KPI Strip ───────────────────────── */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {kpis.map(({ label, value, sub, icon: Icon, accent }) => (
              <article key={label} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${accent}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                  </div>
                  <span className="text-right text-[10px] font-medium leading-tight text-slate-400">{sub}</span>
                </div>
                <p className="mt-3 text-[34px] font-black leading-none tracking-tight" style={{ color: accent }}>
                  {value}
                </p>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
              </article>
            ))}
          </section>

          {/* ── Main charts row ──────────────────── */}
          <section className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_260px]">

            {/* Grade donut */}
            <article className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Phân hạng</p>
              <h2 className="mt-1 text-[15px] font-bold text-slate-950">Phân loại CV</h2>
              <ResponsiveContainer width="100%" height={168}>
                <PieChart>
                  <Pie
                    data={gradeRows.filter((g) => g.value > 0)}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={3}
                  >
                    {gradeRows.map((g) => (
                      <Cell key={g.name} fill={g.color} stroke="#fff" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} formatter={(v, n) => [`${v} CV`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1 space-y-2">
                {gradeRows.map((g) => (
                  <div key={g.name} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: g.color }} />
                    <span className="flex-1 text-[12px] font-semibold text-slate-600">{g.name}</span>
                    <span className="text-[12px] font-black" style={{ color: g.color }}>{g.value}</span>
                    <span className="w-8 text-right text-[11px] text-slate-400">{Math.round(g.pct)}%</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Score histogram + stat strip */}
            <article className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Phân bố điểm</p>
              <h2 className="mt-1 text-[15px] font-bold text-slate-950">Phân bố điểm số ứng viên</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.histogram} margin={{ top: 10, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={TOOLTIP}
                    formatter={(v) => [`${v} CV`, 'Số lượng']}
                  />
                  <Bar dataKey="n" radius={[5, 5, 0, 0]} maxBarSize={48}>
                    {data.histogram.map((b) => (
                      <Cell key={b.range} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3">
                {[
                  { label: 'Trung bình', value: data.avg },
                  { label: 'Trung vị',   value: data.median },
                  { label: 'Biên độ',    value: data.spread },
                ].map(({ label, value }) => (
                  <div key={label} className="px-3 text-center first:pl-0 last:pr-0">
                    <p className="text-[22px] font-black tracking-tight text-slate-950">{value}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </article>

            {/* Top 5 candidates */}
            <article className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Shortlist</p>
                  <h2 className="mt-1 text-[15px] font-bold text-slate-950">Top ứng viên</h2>
                </div>
                <button
                  onClick={() => navigate('/chatbot')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3.5">
                {data.top5.map((c, i) => {
                  const g    = getGrade(c);
                  const meta = GRADE_META[g];
                  const sc   = getScore(c);
                  return (
                    <div key={c.id} className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-black text-slate-500">
                        #{i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-bold text-slate-900">
                          {normalizeVietnameseDisplay(c.candidateName)}
                        </p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, sc)}%`, background: meta.color }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-[16px] font-black" style={{ color: meta.color }}>{sc}</span>
                        <span
                          className="rounded border px-1.5 py-px text-[9px] font-black"
                          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                        >
                          {g}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          {/* ── Analysis row: Radar | Criteria bars ── */}
          <section className="grid gap-4 xl:grid-cols-2">

            {/* Radar */}
            <article className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Radar tiêu chí</p>
              <h2 className="mt-1 text-[15px] font-bold text-slate-950">Điểm trung bình theo tiêu chí</h2>
              {data.radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={295}>
                  <RadarChart data={data.radarData} outerRadius={108}>
                    <PolarGrid stroke="#dbeafe" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                      axisLine={false}
                    />
                    <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.14} strokeWidth={2} />
                    <Tooltip
                      contentStyle={TOOLTIP}
                      labelFormatter={(l) =>
                        data.radarData.find((r) => r.subject === l)?.fullName ?? l
                      }
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[295px] items-center justify-center text-[13px] text-slate-400">
                  Chưa đủ dữ liệu tiêu chí
                </div>
              )}
            </article>

            {/* Criteria horizontal bars */}
            <article className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Xếp hạng tiêu chí</p>
              <h2 className="mt-1 text-[15px] font-bold text-slate-950">Điểm mạnh &amp; điểm yếu</h2>
              {data.criteriaRanked.length > 0 ? (
                <ResponsiveContainer width="100%" height={315}>
                  <BarChart
                    data={data.criteriaRanked.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 10, right: 32, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={116}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP}
                      formatter={(v) => [`${v}đ`, 'Điểm TB']}
                      labelFormatter={(l) =>
                        data.criteriaRanked.find((c) => c.label === l)?.fullName ?? l
                      }
                    />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={15}>
                      {data.criteriaRanked.slice(0, 8).map((entry) => (
                        <Cell
                          key={entry.label}
                          fill={entry.avg >= 80 ? '#16a34a' : entry.avg >= 60 ? '#2563eb' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[315px] items-center justify-center text-[13px] text-slate-400">
                  Chưa đủ dữ liệu tiêu chí
                </div>
              )}
              {/* Legend */}
              <div className="mt-1 flex items-center gap-4">
                {[
                  { color: '#16a34a', label: '≥ 80' },
                  { color: '#2563eb', label: '60–79' },
                  { color: '#ef4444', label: '< 60' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="text-[11px] font-medium text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* ── Trend: full width ────────────────── */}
          <section>
            <article className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Xu hướng</p>
              <h2 className="mt-1 text-[15px] font-bold text-slate-950">Điểm số theo thứ tự CV</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.trend} margin={{ top: 10, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Tổng điểm"
                    stroke="#2563eb"
                    fill="url(#gScore)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="jdFit"
                    name="Phù hợp JD"
                    stroke="#16a34a"
                    fill="url(#gFit)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-6">
                {[
                  { color: '#2563eb', label: 'Tổng điểm' },
                  { color: '#16a34a', label: 'Phù hợp JD' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-[12px] font-semibold text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

        </main>
      </div>
    </div>
  );
};

export default DetailedAnalyticsPage;
