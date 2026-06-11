import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  FileCheck2,
  FileText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeAppPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

const onboardingSteps = [
  {
    title: 'Nạp JD và hồ sơ',
    detail: 'Đưa JD, CV hoặc thư viện hồ sơ vào cùng một phiên làm việc.',
    icon: UploadCloud,
  },
  {
    title: 'Chuẩn hóa tiêu chí',
    detail: 'Thiết lập bộ lọc, trọng số và yêu cầu bắt buộc trước khi AI phân tích.',
    icon: FileCheck2,
  },
  {
    title: 'Xem shortlist có bằng chứng',
    detail: 'Nhận điểm phù hợp, lý do đề xuất và vùng cần kiểm chứng.',
    icon: Sparkles,
  },
];

const candidateRows = [
  ['Nguyễn Minh Anh', '94%', 'Ưu tiên', 'text-emerald-700 bg-emerald-50 border-emerald-100'],
  ['Trần Hải Nam', '88%', 'Phù hợp', 'text-blue-700 bg-blue-50 border-blue-100'],
  ['Lê Thu Hà', '81%', 'Cần xem', 'text-amber-700 bg-amber-50 border-amber-100'],
];

const workflowPreviewRows = [
  { title: 'JD đã chuẩn hóa', detail: '4 tiêu chí bắt buộc', icon: FileText },
  { title: 'CV đang chờ', detail: '12 hồ sơ hợp lệ', icon: UploadCloud },
  { title: 'Phân tích AI', detail: 'Đang xếp hạng', icon: Sparkles },
];

const statCards = [
  { label: 'CV phù hợp', value: '8', icon: Users },
  { label: 'Điểm TB', value: '86', icon: BarChart3 },
  { label: 'Cần rà soát', value: '3', icon: ShieldCheck },
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
    <div className="min-h-screen overflow-y-auto bg-white text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(35,136,255,0.08),transparent_32%),radial-gradient(circle_at_78%_14%,rgba(20,184,166,0.07),transparent_30%)]" />

      <header className="border-b border-blue-100 bg-white/95 px-4 py-3 shadow-[0_10px_28px_rgba(30,64,175,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="Support HR" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <div>
              <p className="text-sm font-black text-slate-950">Support HR</p>
              <p className="text-xs font-semibold text-slate-500">Không gian lọc CV bằng AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="hidden h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
          >
            Vào ứng dụng
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-7">
        <section>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
            <Brain className="h-4 w-4" />
            Support HR Desktop
          </div>

          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[56px]">
            Chào mừng đến với phần mềm lọc CV bằng AI
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] font-medium leading-7 text-slate-600">
            Một cửa sổ làm việc riêng cho đội tuyển dụng: nạp JD, chuẩn hóa tiêu chí, phân tích CV và xem shortlist có bằng chứng trong cùng một luồng rõ ràng.
          </p>

          <div className="mt-5 grid gap-2.5">
            {onboardingSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_12px_28px_rgba(30,64,175,0.05)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Bước {String(index + 1).padStart(2, '0')}</p>
                    <h2 className="mt-0.5 text-base font-black text-slate-950">{item.title}</h2>
                    <p className="mt-0.5 text-sm leading-5 text-slate-600">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(35,136,255,0.22)] transition hover:bg-blue-700"
            >
              {isLoggedIn ? 'Bắt đầu sàng lọc CV' : 'Đăng nhập để bắt đầu'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/jd-standardizer')}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-100 bg-white px-5 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Chuẩn hóa JD trước
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Dữ liệu đồng bộ backend</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Không cần mở nhiều tab</span>
          </div>
        </section>

        <section className="min-w-0">
          <div className="w-full overflow-hidden rounded-[26px] border border-blue-100 bg-[#f4f9ff] shadow-[0_24px_70px_rgba(30,64,175,0.14)]">
            <div className="flex items-center justify-between border-b border-blue-100 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Brain className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">Recruitment cockpit</p>
                  <p className="text-xs font-semibold text-slate-500">Phiên sàng lọc Java Developer · 12 CV</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">AI sẵn sàng</span>
            </div>

            <div className="grid gap-3 p-4 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="space-y-2.5 rounded-2xl border border-blue-100 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Luồng xử lý</p>
                {workflowPreviewRows.map((item) => {
                  const RowIcon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600">
                        <RowIcon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-950">{item.title}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-500">{item.detail}</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {statCards.map((item) => {
                    const StatIcon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-blue-100 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-500">{item.label}</p>
                          <StatIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-blue-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">Danh sách ưu tiên</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Ứng viên được xếp hạng kèm lý do đề xuất</p>
                    </div>
                    <span className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Live</span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {candidateRows.map(([name, score, status, tone], index) => (
                      <div key={name} className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-xl border border-blue-100 bg-[#f8fbff] p-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-blue-700">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{name}</p>
                          <p className="text-xs font-semibold text-slate-500">Bằng chứng khớp JD đã sẵn sàng</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-blue-700">{score}</p>
                          <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${tone}`}>{status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">AI tóm tắt</p>
                  <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">
                    3 ứng viên phù hợp nhất đã có lý do đề xuất, điểm cần xác thực và câu hỏi phỏng vấn gợi ý.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WelcomeAppPage;
