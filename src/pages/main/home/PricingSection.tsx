import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  DatabaseZap,
  FileStack,
  LayoutDashboard,
  MessageSquareQuote,
  PlugZap,
} from "lucide-react";

const integrations = [
  {
    title: "Tệp JD/CV",
    description: "PDF, DOCX, hình ảnh và tài liệu tuyển dụng phổ biến.",
    Icon: FileStack,
  },
  {
    title: "Công cụ nội bộ",
    description: "Quy trình HR, ATS, CRM tuyển dụng và hệ thống quản lý ứng viên.",
    Icon: PlugZap,
  },
  {
    title: "Báo cáo",
    description: "Dashboard, phân tích chi tiết và xuất dữ liệu khi cần.",
    Icon: LayoutDashboard,
  },
  {
    title: "AI assistant",
    description: "Gợi ý ứng viên, câu hỏi phỏng vấn và nhóm ứng viên theo cấp độ.",
    Icon: Bot,
  },
];

const testimonials = [
  {
    quote:
      "Trước đây team mất nhiều thời gian để đọc từng CV và tranh luận về tiêu chí. Support HR giúp chúng tôi có một bảng đánh giá thống nhất ngay từ đầu.",
    author: "Trần Thị Mai Anh",
    role: "Trưởng phòng Nhân sự",
    company: "Công ty Công nghệ VTI",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop",
  },
  {
    quote:
      "Điểm mạnh nhất là hệ thống không chỉ chấm điểm, mà còn giải thích vì sao ứng viên phù hợp hoặc chưa phù hợp. Điều này giúp trao đổi với quản lý tuyển dụng nhanh hơn rất nhiều.",
    author: "Nguyễn Huy Hoàng",
    role: "Talent Acquisition Lead",
    company: "FPT Software",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&auto=format&fit=crop",
  },
  {
    quote:
      "Chúng tôi dùng Support HR để chuẩn hóa vòng sàng lọc đầu tiên. HR vẫn là người quyết định, nhưng quyết định đó có dữ liệu tốt hơn.",
    author: "Lê Minh Tuấn",
    role: "Founder & CEO",
    company: "Base.vn (SME Division)",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="relative bg-white py-20 sm:py-24">
      <div className="home-section-frame space-y-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="max-w-[42rem]">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
              Hệ sinh thái & tích hợp
            </p>
            <h2 className="font-space home-section-heading mt-6 text-slate-900 leading-tight">
              Kết nối linh hoạt với quy trình tuyển dụng hiện có
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-500 sm:text-lg">
              Support HR được thiết kế để bổ sung vào hệ thống tuyển dụng của doanh nghiệp, không buộc đội ngũ phải thay đổi toàn bộ cách làm việc.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {integrations.map(({ title, description, Icon }) => (
              <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.035)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_48px_rgba(37,99,235,0.08)] transition-all duration-300">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-50 bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-[#F4F6F8] p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
                Khách hàng nói gì
              </p>
              <h2 className="font-space mt-4 max-w-[42rem] text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                Đội tuyển dụng ra quyết định nhanh hơn khi dữ liệu được trình bày rõ ràng
              </h2>
            </div>
            <DatabaseZap className="hidden h-10 w-10 text-blue-500 sm:block" />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.author} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_38px_rgba(15,23,42,0.035)] hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(37,99,235,0.075)] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <MessageSquareQuote className="h-6 w-6 text-blue-500" />
                    <span className="flex gap-0.5 text-xs text-amber-400">
                      {"★".repeat(5)}
                    </span>
                  </div>
                  <blockquote className="mt-5 text-[0.925rem] font-medium leading-7 text-slate-700">
                    "{item.quote}"
                  </blockquote>
                </div>
                <figcaption className="mt-6 border-t border-slate-100 pt-4 flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.author}
                    className="h-10 w-10 rounded-full object-cover border border-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.author}</p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">{item.role} · {item.company}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/45 to-violet-50/60 p-7 text-center shadow-[0_22px_64px_rgba(37,99,235,0.07)] sm:p-10 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

          <p className="relative z-10 supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
            Bắt đầu ngay hôm nay
          </p>
          <h2 className="font-space relative z-10 mx-auto mt-4 max-w-[50rem] text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
            Bắt đầu chuẩn hóa quy trình sàng lọc ứng viên ngay hôm nay
          </h2>
          <p className="relative z-10 mx-auto mt-5 max-w-[42rem] text-base leading-8 text-slate-600 sm:text-lg">
            Tải JD, nạp CV và xem cách Support HR giúp đội tuyển dụng tìm ra ứng viên phù hợp nhanh hơn, rõ ràng hơn.
          </p>
          <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/jd"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto"
            >
              Dùng thử miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-black text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50/50 hover:border-blue-300 sm:w-auto"
            >
              Đặt lịch tư vấn
            </Link>
          </div>
          <p className="relative z-10 mt-5 text-sm text-slate-500">
            Phù hợp cho đội HR muốn tăng tốc tuyển dụng mà vẫn giữ quyền kiểm soát trong từng quyết định.
          </p>
        </div>
      </div>
    </section>
  );
}
