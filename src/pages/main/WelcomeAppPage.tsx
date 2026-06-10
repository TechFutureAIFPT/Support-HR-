import React from 'react';
import { ArrowRight, CheckCircle2, FileText, MonitorDown, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WindowsAppInstallButton from '@/components/pwa/WindowsAppInstallButton';

interface WelcomeAppPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

const workflowItems = [
  { label: 'Nạp JD & CV', detail: 'Tải JD/CV · Bước 1-2', icon: UploadCloud, active: true },
  { label: 'Thiết lập mặc định', detail: 'Tiêu chí & bộ lọc · Bước 3', icon: FileText },
  { label: 'Phân tích AI', detail: 'Xử lý · Bước 4', icon: Sparkles },
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
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-blue-100 bg-white/95 px-5 py-4 shadow-[0_12px_36px_rgba(30,64,175,0.07)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="Support HR" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <div>
              <p className="text-sm font-black text-slate-950">Support HR</p>
              <p className="text-xs font-semibold text-slate-500">Windows App · Recruitment Intelligence</p>
            </div>
          </div>
          <WindowsAppInstallButton variant="full" />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-14">
        <section className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            <MonitorDown className="h-4 w-4" />
            Ứng dụng Windows
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Chào mừng đến với Support HR Desktop
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Mở Support HR như một ứng dụng riêng trên Windows, giữ toàn bộ quy trình tuyển dụng trong một không gian làm việc gọn, nhanh và dễ kiểm soát.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ['Không cần mở nhiều tab', 'Tập trung vào phiên sàng lọc hiện tại.'],
              ['Dữ liệu đồng bộ', 'Thông báo và lịch sử lấy từ backend.'],
              ['Giao diện như app', 'Sidebar, topbar và workflow mở trực tiếp.'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_16px_36px_rgba(35,136,255,0.22)] transition hover:bg-blue-700"
            >
              {isLoggedIn ? 'Vào quy trình tuyển dụng' : 'Đăng nhập để bắt đầu'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-blue-100 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
            >
              Xem trang chủ
            </button>
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-500">
            Khi cài từ Chrome hoặc Edge, Support HR sẽ xuất hiện trong Start Menu và mở bằng cửa sổ app riêng.
          </p>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-[#f3f8ff] shadow-[0_30px_80px_rgba(30,64,175,0.16)]">
          <div className="flex items-center justify-between border-b border-blue-100 bg-white px-5 py-4">
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="text-xl font-black text-slate-950">Nạp hồ sơ ứng viên</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Phiếu Tuyển Dụng / JOB ORDER · 4/4 bước</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-700">Mẫu JD</span>
              <span className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">+ Phiên mới</span>
            </div>
          </div>

          <div className="grid min-h-[33rem] lg:grid-cols-[16rem_1fr]">
            <aside className="border-r border-blue-100 bg-blue-50/80 p-4">
              <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quy trình phân tích</p>
              <div className="space-y-2">
                {workflowItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-center gap-3 rounded-2xl border p-3 ${item.active ? 'border-blue-200 bg-white text-slate-950 shadow-sm' : 'border-blue-100 bg-white/70 text-slate-500'}`}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-black">{item.label}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-500">{item.detail}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="bg-white p-6">
              <div className="grid gap-6 lg:grid-cols-[0.92fr_1fr]">
                <div>
                  <p className="supporthr-mono text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Bước 02</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">Nạp CV</h2>
                  <p className="mt-2 text-sm text-slate-600">Tối đa 20 hồ sơ trong một lần phân tích.</p>
                  <div className="mt-8 flex min-h-[18rem] flex-col items-center justify-center border border-dashed border-blue-200 bg-white text-center">
                    <UploadCloud className="h-12 w-12 text-blue-600" />
                    <p className="mt-4 text-2xl font-black text-slate-950">Kéo thả CV</p>
                    <p className="mt-2 text-sm text-slate-500">PDF, DOCX, PNG, JPG</p>
                    <div className="mt-5 flex gap-3">
                      <span className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">File</span>
                      <span className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Drive</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-950">Danh sách CV</h3>
                  <p className="mt-2 text-sm text-slate-600">Kiểm tra và loại bỏ tệp trước khi phân tích.</p>
                  <div className="mt-8 flex min-h-[24rem] flex-col items-center justify-center border border-blue-100 bg-white text-center">
                    <FileText className="h-12 w-12 text-slate-500" />
                    <p className="mt-4 text-lg font-black text-slate-950">Chưa có CV</p>
                    <p className="mt-2 text-sm text-slate-500">File đã nạp sẽ hiện tại đây.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-100 bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Cửa sổ app riêng, vẫn dùng cùng tài khoản và dữ liệu backend.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WelcomeAppPage;
