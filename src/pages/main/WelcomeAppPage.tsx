import React from 'react';
import { ArrowRight, CheckCircle2, FileText, Sparkles, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeAppPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

const steps = [
  { title: 'Nạp JD và CV', icon: UploadCloud },
  { title: 'Chuẩn hóa tiêu chí', icon: FileText },
  { title: 'Xem shortlist AI', icon: Sparkles },
];

const candidates = [
  ['Nguyễn Minh Anh', '94%', 'Ưu tiên'],
  ['Trần Hải Nam', '88%', 'Phù hợp'],
  ['Lê Thu Hà', '81%', 'Cần xem'],
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
      <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-5 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-10">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
            <CheckCircle2 className="h-4 w-4" />
            Support HR Desktop
          </div>

          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[58px]">
            Chào mừng đến với Support HR
          </h1>

          <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-slate-600">
            Một màn hình làm việc gọn cho đội tuyển dụng: nạp JD, đưa CV vào phiên lọc và xem danh sách ứng viên có bằng chứng.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(35,136,255,0.22)] transition hover:bg-blue-700"
            >
              {isLoggedIn ? 'Vào quy trình lọc CV' : 'Đăng nhập để bắt đầu'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/app-docs')}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-blue-100 bg-white px-6 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Xem tài liệu
            </button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
                    Bước {String(index + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-1 text-sm font-black text-slate-950">{step.title}</h2>
                </div>
              );
            })}
          </div>
        </section>

        <section className="min-w-0">
          <div className="rounded-[28px] border border-blue-100 bg-[#f6f9ff] p-4 shadow-[0_24px_70px_rgba(30,64,175,0.12)]">
            <div className="rounded-3xl border border-blue-100 bg-white p-5">
              <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Recruitment cockpit</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Phiên lọc Java Developer</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">AI sẵn sàng</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-3">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] p-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-black text-slate-800">{step.title}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-950">Danh sách ưu tiên</h3>
                    <span className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Live</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {candidates.map(([name, score, status], index) => (
                      <div key={name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{name}</p>
                          <p className="text-xs font-semibold text-slate-500">{status}</p>
                        </div>
                        <p className="text-lg font-black text-blue-700">{score}</p>
                      </div>
                    ))}
                  </div>
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
