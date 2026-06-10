import {
  ArrowUpRight,
  BarChart3,
  FileText,
  MessageSquareText,
  Trophy,
} from "lucide-react";

const features = [
  {
    title: "Nạp JD và chuẩn hóa tiêu chí",
    benefit: "Biến mô tả công việc thành bộ tiêu chí đánh giá rõ ràng, có trọng số và có thể điều chỉnh.",
    href: "/guide",
    Icon: FileText,
  },
  {
    title: "Phân tích CV bằng AI",
    benefit: "Tự động đọc hồ sơ, so khớp với JD và đưa ra điểm phù hợp theo từng nhóm tiêu chí.",
    href: "/ai-methodology",
    Icon: BarChart3,
  },
  {
    title: "Bảng xếp hạng ứng viên",
    benefit: "Nhìn nhanh ai phù hợp nhất, ai cần xem thêm và lý do vì sao hệ thống đề xuất.",
    href: "/use-cases",
    Icon: Trophy,
  },
  {
    title: "Phản hồi tuyển dụng có cấu trúc",
    benefit: "Ghi nhận phản hồi sau phân tích để cải thiện chất lượng danh sách đề cử và tăng tính nhất quán trong quyết định.",
    href: "/process",
    Icon: MessageSquareText,
  },
];

const ComparisonTable = () => {
  return (
    <div className="mx-auto w-full max-w-[92rem]">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="max-w-[34rem]">
          <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
            Tính năng nổi bật
          </p>
          <h2 className="home-section-heading mt-6 max-w-[14ch] text-slate-900">
            Tính năng được xây dựng để giúp đội tuyển dụng làm việc nhanh và chắc hơn
          </h2>
          <p className="mt-6 text-base leading-8 text-slate-500 sm:text-lg">
            Mỗi tính năng tập trung vào một lợi ích vận hành: giảm thao tác thủ công, chuẩn hóa đánh giá và giúp đội ngũ giải thích quyết định tuyển dụng rõ ràng hơn.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ title, benefit, href, Icon }, index) => (
            <article
              key={title}
              className="group flex min-h-[17rem] flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_16px_42px_rgba(30,64,175,0.07)] transition-colors hover:bg-blue-50/70"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 group-hover:bg-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="supporthr-mono text-[11px] font-bold text-blue-500">
                  /0{index + 1}
                </span>
              </div>
              <h3 className="mt-7 text-xl font-bold leading-snug text-slate-900">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{benefit}</p>
              <a
                href={href}
                className="mt-auto inline-flex items-center gap-2 pt-7 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 transition-colors hover:text-blue-900"
              >
                Xem chi tiết
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
