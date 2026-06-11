import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  HelpCircle,
  LibraryBig,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Workflow,
} from 'lucide-react';

const workflowItems = [
  {
    icon: UploadCloud,
    title: 'Nạp JD & CV',
    detail: 'Tải JD, nạp hồ sơ ứng viên và kiểm tra danh sách file trước khi phân tích.',
  },
  {
    icon: SlidersIcon,
    title: 'Thiết lập mặc định',
    detail: 'Chuẩn hóa bộ lọc cứng, trọng số và tiêu chí đánh giá theo yêu cầu tuyển dụng.',
  },
  {
    icon: Sparkles,
    title: 'Phân tích AI',
    detail: 'Đọc CV, so khớp với JD, xếp hạng ứng viên và hiển thị bằng chứng đánh giá.',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo & phản hồi',
    detail: 'Theo dõi hiệu quả sàng lọc, xem dashboard và ghi nhận feedback sau phân tích.',
  },
];

const toolItems = [
  {
    icon: LibraryBig,
    title: 'Kho lưu trữ CV',
    href: '/records',
    detail: 'Tổng hợp hồ sơ đã lọc từ các phiên để tìm lại, chọn lại và dùng tiếp khi cần.',
  },
  {
    icon: FileText,
    title: 'Mẫu JD',
    href: '/jd-templates',
    detail: 'Lưu và mở lại các JD thường dùng để khởi tạo quy trình nhanh hơn.',
  },
  {
    icon: Workflow,
    title: 'Chuẩn hóa JD',
    href: '/jd-standardizer',
    detail: 'Tối ưu nội dung JD, phát hiện phần còn thiếu và dùng bản chuẩn hóa cho quy trình lọc CV.',
  },
];

const policyItems = [
  'Dữ liệu JD/CV chỉ dùng để phục vụ quy trình sàng lọc của tài khoản đang thao tác.',
  'Người dùng chịu trách nhiệm kiểm tra dữ liệu đầu vào, quyền sử dụng CV và tính phù hợp của kết quả.',
  'AI hỗ trợ đánh giá và giải thích; quyết định tuyển dụng cuối cùng thuộc về đội ngũ HR hoặc hiring manager.',
  'Không nên tải lên dữ liệu nhạy cảm ngoài phạm vi tuyển dụng nếu doanh nghiệp chưa có chính sách cho phép.',
];

const faqItems = [
  {
    question: 'Support HR thay thế nhà tuyển dụng không?',
    answer: 'Không. Sản phẩm hỗ trợ đọc hồ sơ, so khớp tiêu chí và trình bày bằng chứng để HR quyết định nhanh hơn.',
  },
  {
    question: 'Có thể dùng lại CV đã lọc cho phiên sau không?',
    answer: 'Có. Kho lưu trữ CV giúp xem lại hồ sơ đã lọc và chọn lại ứng viên phù hợp cho nhu cầu tiếp theo.',
  },
  {
    question: 'JD chuẩn hóa có đưa vào quy trình lọc được không?',
    answer: 'Có. Sau khi chuẩn hóa, bạn có thể dùng bản JD đó để mở bước nạp JD và tiếp tục nạp CV.',
  },
];

function SlidersIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </svg>
  );
}

const AppDocumentationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/95 shadow-[0_10px_32px_rgba(30,64,175,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/jd" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
              <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-slate-950">Support HR</span>
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Tài liệu ứng dụng</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <a href="#tong-quan" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700">Tổng quan</a>
            <a href="#bao-mat" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700">Bảo mật</a>
            <a href="#dieu-khoan" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700">Điều khoản</a>
            <Link to="/jd" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700">Vào ứng dụng</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section id="tong-quan" className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Tài liệu Support HR</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Một trang duy nhất cho thông tin sản phẩm, quy trình và chính sách sử dụng
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600">
              Support HR là phần mềm AI hỗ trợ đội tuyển dụng nạp JD, chuẩn hóa tiêu chí, phân tích CV, xếp hạng ứng viên và lưu lại kết quả để phối hợp nội bộ rõ ràng hơn.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/jd" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700">
                <UploadCloud size={17} />
                Bắt đầu quy trình
              </Link>
              <Link to="/records" className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 hover:bg-blue-100">
                <LibraryBig size={17} />
                Mở kho CV
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 shadow-[0_28px_80px_rgba(30,64,175,0.10)]">
            <div className="rounded-2xl border border-blue-100 bg-white p-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">AI workflow</p>
                    <h2 className="text-lg font-black text-slate-950">Quy trình sàng lọc CV</h2>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Đang sẵn sàng</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {workflowItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="rounded-2xl border border-blue-100 bg-white p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-base font-black text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.detail}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="cong-cu" className="mt-12 rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(30,64,175,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Công cụ trong app</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Các trang hỗ trợ được dùng thường xuyên</h2>
            </div>
            <p className="max-w-xl text-sm font-medium leading-6 text-slate-600">Các công cụ này nằm trong ứng dụng chính, không phải trang marketing riêng.</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {toolItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.href} className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 transition hover:border-blue-200 hover:bg-blue-50">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-4 text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.detail}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="bao-mat" className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Bảo mật & dữ liệu</p>
                <h2 className="text-xl font-black text-slate-950">Nguyên tắc xử lý JD và CV</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {policyItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-blue-100 bg-white p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-medium leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article id="dieu-khoan" className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(30,64,175,0.08)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <LockKeyhole size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Điều khoản sử dụng</p>
                <h2 className="text-xl font-black text-slate-950">Trách nhiệm khi dùng AI tuyển dụng</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <h3 className="text-sm font-black text-slate-950">Kiểm soát của người dùng</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">HR có quyền chỉnh tiêu chí, kiểm tra bằng chứng, loại hồ sơ và quyết định danh sách cuối cùng.</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <h3 className="text-sm font-black text-slate-950">Dữ liệu đầu vào</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">JD/CV nên được tải lên đúng mục đích tuyển dụng và tuân thủ chính sách dữ liệu của doanh nghiệp.</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <h3 className="text-sm font-black text-slate-950">Kết quả AI</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Điểm số và nhận định là thông tin hỗ trợ, không phải cam kết tuyển dụng hoặc đánh giá pháp lý.</p>
              </div>
            </div>
          </article>
        </section>

        <section id="trien-khai" className="mt-8 rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(30,64,175,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Database size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Triển khai & phạm vi</p>
              <h2 className="text-xl font-black text-slate-950">Thông tin cần thống nhất trước khi dùng chính thức</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {['Số lượng CV xử lý mỗi tháng', 'Nguồn nhập file: máy tính hoặc Google Drive', 'Quyền truy cập tài khoản và dữ liệu nội bộ'].map((item) => (
              <div key={item} className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 text-sm font-bold text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mt-8 rounded-3xl border border-blue-100 bg-[#f8fbff] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <HelpCircle size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-950">Câu hỏi thường gặp</h2>
          </div>
          <div className="mt-5 divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white">
            {faqItems.map((item) => (
              <article key={item.question} className="p-5">
                <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AppDocumentationPage;
