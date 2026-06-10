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
    description: "Workflow HR, ATS, CRM tuyển dụng và hệ thống quản lý ứng viên.",
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
    author: "Trưởng phòng Nhân sự",
    company: "Công ty công nghệ 300+ nhân sự",
  },
  {
    quote:
      "Điểm mạnh nhất là hệ thống không chỉ chấm điểm, mà còn giải thích vì sao ứng viên phù hợp hoặc chưa phù hợp. Điều này giúp trao đổi với hiring manager nhanh hơn rất nhiều.",
    author: "Talent Acquisition Lead",
    company: "Doanh nghiệp dịch vụ B2B",
  },
  {
    quote:
      "Chúng tôi dùng Support HR để chuẩn hóa vòng sàng lọc đầu tiên. HR vẫn là người quyết định, nhưng quyết định đó có dữ liệu tốt hơn.",
    author: "Founder",
    company: "Doanh nghiệp SME đang mở rộng đội ngũ",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="relative border-b border-blue-100 bg-white py-20 sm:py-24">
      <div className="home-section-frame space-y-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="max-w-[42rem]">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
              Hệ sinh thái & tích hợp
            </p>
            <h2 className="home-section-heading mt-6 text-slate-900">
              Kết nối linh hoạt với quy trình tuyển dụng hiện có
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-500 sm:text-lg">
              Support HR được thiết kế để bổ sung vào hệ thống tuyển dụng của doanh nghiệp, không buộc đội ngũ phải thay đổi toàn bộ cách làm việc.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {integrations.map(({ title, description, Icon }) => (
              <article key={title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_16px_42px_rgba(30,64,175,0.07)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-blue-100 bg-blue-50/50 p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
                Khách hàng nói gì
              </p>
              <h2 className="mt-4 max-w-[42rem] text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                Đội tuyển dụng ra quyết định nhanh hơn khi dữ liệu được trình bày rõ ràng
              </h2>
            </div>
            <DatabaseZap className="hidden h-10 w-10 text-blue-500 sm:block" />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.author} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <MessageSquareQuote className="h-6 w-6 text-blue-500" />
                <blockquote className="mt-5 text-sm font-medium leading-7 text-slate-700">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-blue-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">{item.author}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.company}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-blue-100 bg-white p-7 text-center shadow-[0_20px_60px_rgba(30,64,175,0.10)] sm:p-10">
          <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
            Bắt đầu ngay hôm nay
          </p>
          <h2 className="mx-auto mt-4 max-w-[50rem] text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
            Bắt đầu chuẩn hóa quy trình sàng lọc ứng viên ngay hôm nay
          </h2>
          <p className="mx-auto mt-5 max-w-[42rem] text-base leading-8 text-slate-600 sm:text-lg">
            Tải JD, nạp CV và xem cách Support HR giúp đội tuyển dụng tìm ra ứng viên phù hợp nhanh hơn, rõ ràng hơn.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/jd"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_44px_rgba(35,136,255,0.22)] transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Dùng thử miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-blue-100 bg-white px-6 text-sm font-black text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
            >
              Đặt lịch tư vấn
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Phù hợp cho đội HR muốn tăng tốc tuyển dụng mà vẫn giữ quyền kiểm soát trong từng quyết định.
          </p>
        </div>
      </div>
    </section>
  );
}
