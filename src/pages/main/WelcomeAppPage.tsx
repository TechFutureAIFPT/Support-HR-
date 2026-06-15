import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  Gauge,
  ListChecks,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeAppPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

const pipelineSteps = [
  {
    title: 'Nạp JD và CV',
    copy: 'Đưa bộ CV vào phiên lọc, hệ thống tự gom file và đọc thông tin chính.',
    icon: UploadCloud,
  },
  {
    title: 'AI so khớp tiêu chí',
    copy: 'Kỹ năng, kinh nghiệm, seniority và bằng chứng được chấm theo JD.',
    icon: BrainCircuit,
  },
  {
    title: 'Xuất shortlist rõ ràng',
    copy: 'Nhận danh sách ưu tiên kèm lý do để HR ra quyết định nhanh hơn.',
    icon: ListChecks,
  },
];

const metrics = [
  ['1.248', 'CV đã lọc', 'demo phiên tuyển dụng'],
  ['94%', 'độ khớp cao nhất', 'ứng viên đang ưu tiên'],
  ['4.2x', 'tăng tốc review', 'so với đọc thủ công'],
];

const cvCards = [
  ['Nguyễn Minh Anh', 'Frontend Lead', 'React, ATS, Team lead', '94%'],
  ['Trần Hải Nam', 'Backend Engineer', 'Node.js, PostgreSQL', '88%'],
  ['Lê Thu Hà', 'HR Analyst', 'Excel, BI, Screening', '81%'],
  ['Phạm Quốc Bảo', 'AI Engineer', 'Python, NLP, LLM', '90%'],
];

const shortlist = [
  { name: 'Nguyễn Minh Anh', score: 94, status: 'Ưu tiên phỏng vấn', tone: 'emerald' },
  { name: 'Phạm Quốc Bảo', score: 90, status: 'Hợp JD AI product', tone: 'blue' },
  { name: 'Trần Hải Nam', score: 88, status: 'Cần xác nhận notice', tone: 'amber' },
];

const signals = [
  'Đang đọc kinh nghiệm gần nhất',
  'Đang so khớp kỹ năng bắt buộc',
  'Đang loại CV thiếu bằng chứng',
  'Đang xếp hạng shortlist',
];

const WelcomeAppPage: React.FC<WelcomeAppPageProps> = ({ isLoggedIn, onLoginRequest }) => {
  const navigate = useNavigate();

  const handleStart = () => {
    if (!isLoggedIn) {
      onLoginRequest();
      return;
    }

    navigate('/jd');
  };

  return (
    <div className="welcome-rebuild-shell min-h-screen overflow-hidden text-[#102033]">
      <div className="welcome-orb welcome-orb-a" />
      <div className="welcome-orb welcome-orb-b" />
      <div className="welcome-grid-glow" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-7 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/welcome')}
          className="welcome-reveal flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 text-left shadow-[0_16px_40px_rgba(35,136,255,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102033] text-white shadow-[0_14px_28px_rgba(16,32,51,0.2)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-black tracking-tight">Support HR</span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5f718c]">AI CV Filter</span>
          </span>
        </button>

        <nav className="welcome-reveal hidden items-center gap-2 md:flex" style={{ '--delay': '80ms' } as React.CSSProperties}>
          {['JD Parser', 'CV Ranking', 'Shortlist'].map((item) => (
            <span key={item} className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-black text-[#41546f] shadow-sm backdrop-blur">
              {item}
            </span>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => navigate('/app-docs')}
          className="welcome-reveal hidden rounded-2xl border border-[#d9e8ff] bg-white/80 px-4 py-2.5 text-sm font-black text-[#0875ee] shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:inline-flex"
          style={{ '--delay': '120ms' } as React.CSSProperties}
        >
          Tài liệu
        </button>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-10 pt-4 sm:px-7 lg:min-h-[calc(100vh-96px)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:pb-12">
        <section className="min-w-0">
          <div className="welcome-reveal inline-flex items-center gap-2 rounded-full border border-[#bfe0ff] bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0875ee] shadow-sm backdrop-blur">
            <BadgeCheck className="h-4 w-4" />
            Chào mừng đến workspace tuyển dụng mới
          </div>

          <h1 className="welcome-reveal welcome-hero-title mt-6 max-w-4xl text-[clamp(3.1rem,8vw,7rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#102033]" style={{ '--delay': '80ms' } as React.CSSProperties}>
            Lọc CV nhanh hơn.
            <span className="welcome-gradient-text mt-1 block">Chọn đúng người hơn.</span>
          </h1>

          <p className="welcome-reveal mt-6 max-w-2xl text-base font-semibold leading-8 text-[#526783] sm:text-lg" style={{ '--delay': '150ms' } as React.CSSProperties}>
            Support HR biến một chồng CV rời rạc thành bảng ưu tiên có điểm số, bằng chứng và tín hiệu tuyển dụng rõ ràng. Đây là trang chào mừng mới, tập trung vào trải nghiệm app Windows/PWA hiện đại.
          </p>

          <div className="welcome-reveal mt-8 flex flex-col gap-3 sm:flex-row" style={{ '--delay': '220ms' } as React.CSSProperties}>
            <button
              type="button"
              onClick={handleStart}
              className="welcome-primary-cta group inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#102033] px-6 text-sm font-black text-white shadow-[0_24px_60px_rgba(16,32,51,0.24)] transition hover:-translate-y-1 hover:bg-[#0875ee]"
            >
              {isLoggedIn ? 'Bắt đầu lọc CV' : 'Đăng nhập để lọc CV'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/app-docs')}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-[#cfe3ff] bg-white/75 px-6 text-sm font-black text-[#102033] shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white"
            >
              Xem quy trình
              <FileText className="h-4 w-4 text-[#2388ff]" />
            </button>
          </div>

          <div className="welcome-reveal mt-8 grid gap-3 sm:grid-cols-3" style={{ '--delay': '300ms' } as React.CSSProperties}>
            {metrics.map(([value, label, detail]) => (
              <article key={label} className="welcome-stat-card rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[0_18px_50px_rgba(30,64,175,0.08)] backdrop-blur-xl">
                <p className="text-3xl font-black tracking-[-0.05em] text-[#102033]">{value}</p>
                <p className="mt-1 text-sm font-black text-[#0875ee]">{label}</p>
                <p className="mt-2 text-xs font-semibold text-[#6b7d95]">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="welcome-reveal min-w-0" style={{ '--delay': '140ms' } as React.CSSProperties}>
          <div className="welcome-lab-card relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_30px_90px_rgba(30,64,175,0.16)] backdrop-blur-2xl sm:p-5">
            <div className="welcome-scanline" />

            <div className="flex items-center justify-between rounded-3xl border border-[#d9e8ff] bg-[#f8fbff]/90 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#102033] text-white">
                  <FileSearch className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0875ee]">CV Filtering Engine</p>
                  <h2 className="text-base font-black text-[#102033] sm:text-lg">Phiên lọc Product Designer</h2>
                </div>
              </div>
              <span className="welcome-live-pill hidden items-center gap-2 rounded-full bg-[#e9fff5] px-3 py-1.5 text-xs font-black text-[#047857] sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                Live
              </span>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-[390px] overflow-hidden rounded-3xl border border-[#d9e8ff] bg-[#edf6ff] p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(35,136,255,0.16),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.14),transparent_32%)]" />
                <div className="relative z-10 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5f718c]">Incoming CV</p>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#0875ee]">24 files</span>
                </div>

                <div className="welcome-filter-core relative z-10 mx-auto mt-10 flex h-44 w-44 items-center justify-center rounded-full border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(35,136,255,0.2)] backdrop-blur">
                  <span className="welcome-pulse-ring" />
                  <span className="welcome-pulse-ring welcome-pulse-ring-b" />
                  <div className="relative z-10 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-[#2388ff]" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#0875ee]">AI Filter</p>
                    <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#102033]">94%</p>
                  </div>
                </div>

                <div className="welcome-cv-stream relative z-20 mt-6 h-36">
                  {cvCards.map(([name, role, skill, score], index) => (
                    <article
                      key={name}
                      className="welcome-cv-card absolute left-0 right-0 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/80 bg-white/92 p-3 shadow-[0_16px_40px_rgba(30,64,175,0.1)]"
                      style={{ '--delay': `${index * 1.8}s` } as React.CSSProperties}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6ff] text-[#2388ff]">
                        <FileText className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[#102033]">{name}</span>
                        <span className="block truncate text-xs font-semibold text-[#6b7d95]">{role} - {skill}</span>
                      </span>
                      <span className="rounded-xl bg-[#102033] px-2.5 py-1 text-xs font-black text-white">{score}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-[#d9e8ff] bg-white/82 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0875ee]">Shortlist</p>
                      <h3 className="mt-1 text-lg font-black text-[#102033]">Ứng viên nổi bật</h3>
                    </div>
                    <Gauge className="h-6 w-6 text-[#2388ff]" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {shortlist.map((candidate, index) => (
                      <article key={candidate.name} className="welcome-shortlist-row rounded-2xl border border-[#e2efff] bg-[#fbfdff] p-3" style={{ '--delay': `${index * 120}ms` } as React.CSSProperties}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#102033]">{candidate.name}</p>
                            <p className="text-xs font-semibold text-[#6b7d95]">{candidate.status}</p>
                          </div>
                          <span className="text-xl font-black tracking-[-0.06em] text-[#0875ee]">{candidate.score}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7f1ff]">
                          <span className="welcome-score-bar block h-full rounded-full bg-gradient-to-r from-[#2388ff] to-[#14b8a6]" style={{ '--score': `${candidate.score}%`, '--delay': `${index * 160}ms` } as React.CSSProperties} />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#d9e8ff] bg-[#102033] p-4 text-white shadow-[0_24px_70px_rgba(16,32,51,0.18)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WandSparkles className="h-5 w-5 text-[#7dd3fc]" />
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#bfdbfe]">AI đang xử lý</p>
                    </div>
                    <Clock3 className="h-5 w-5 text-[#7dd3fc]" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {signals.map((signal, index) => (
                      <div key={signal} className="welcome-signal-line flex items-center gap-2 text-sm font-semibold text-[#eaf4ff]" style={{ '--delay': `${index * 180}ms` } as React.CSSProperties}>
                        <CheckCircle2 className="h-4 w-4 text-[#86efac]" />
                        <span>{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 pb-12 sm:px-7 md:grid-cols-3 lg:px-8">
        {pipelineSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <article key={step.title} className="welcome-reveal welcome-process-card rounded-3xl border border-white/70 bg-white/70 p-5 shadow-[0_18px_50px_rgba(30,64,175,0.08)] backdrop-blur-xl" style={{ '--delay': `${280 + index * 90}ms` } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2388ff]">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-[#102033] px-3 py-1 text-[11px] font-black text-white">0{index + 1}</span>
              </div>
              <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-[#102033]">{step.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#5f718c]">{step.copy}</p>
            </article>
          );
        })}
      </section>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 pb-8 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#6b7d95]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-[#10b981]" />
            PWA ready
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
            <Zap className="h-4 w-4 text-[#2388ff]" />
            Desktop workflow
          </span>
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-5 py-3 text-sm font-black text-[#102033] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
        >
          Vào workspace
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeAppPage;
