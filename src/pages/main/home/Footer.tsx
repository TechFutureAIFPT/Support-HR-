import {
  ArrowUpRight,
  BookOpenText,
  Building2,
  CalendarRange,
  Mail,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import DmcaBadge from "@/components/common/DmcaBadge";

type FooterNavItem =
  | {
      label: string;
      note?: string;
      target: string;
      href?: never;
      to?: never;
    }
  | {
      label: string;
      note?: string;
      href: string;
      target?: never;
      to?: never;
    }
  | {
      label: string;
      note?: string;
      to: string;
      href?: never;
      target?: never;
    };

type FooterProps = {
  onNavigate: (target: string) => void;
};

type FooterSection = {
  title: string;
  Icon: typeof Workflow;
  items: FooterNavItem[];
};

const productLinks: FooterNavItem[] = [
  { label: "Quy trình vận hành", note: "Luồng JD - CV - shortlist", target: "steps" },
  { label: "Ma trận so sánh", note: "Cách Support HR khác AI đa dụng", target: "compare" },
  { label: "Bảng giá", note: "Chọn gói theo quy mô đội ngũ", target: "pricing" },
  { label: "Trải nghiệm", note: "Xem demo sản phẩm", to: "/demo" },
];

const resourceLinks: FooterNavItem[] = [
  { label: "Bảo mật", note: "Dữ liệu, quyền truy cập, lưu trữ", to: "/security" },
  { label: "Hỏi đáp", note: "Các câu hỏi mua hàng phổ biến", to: "/faq" },
  { label: "Phương pháp AI", note: "Cách hệ thống đọc và chấm CV", to: "/ai-methodology" },
  { label: "Tình huống sử dụng", note: "Các mô hình triển khai thực tế", to: "/use-cases" },
];

const salesLinks: FooterNavItem[] = [
  { label: "Đặt lịch demo", note: "Lịch trải nghiệm trực tiếp", to: "/book-demo" },
  { label: "Email tư vấn", note: "support@supporthr.vn", href: "mailto:support@supporthr.vn" },
  { label: "Hotline", note: "0899 280 108", href: "tel:0899280108" },
  { label: "Tích hợp", note: "Google Drive và luồng nhập liệu", to: "/integrations" },
];

const legalLinks: FooterNavItem[] = [
  { label: "Chính sách riêng tư", to: "/privacy-policy" },
  { label: "Điều khoản dịch vụ", to: "/terms" },
  { label: "Trang bảo mật", to: "/security" },
];

const footerSections: FooterSection[] = [
  { title: "Sản phẩm", Icon: Workflow, items: productLinks },
  { title: "Tài liệu", Icon: BookOpenText, items: resourceLinks },
  { title: "Kinh doanh", Icon: Building2, items: salesLinks },
];

const baseLinkClass =
  "group flex items-start justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0";

function FooterNavLink({
  item,
  onNavigate,
  compact = false,
}: {
  item: FooterNavItem;
  onNavigate: FooterProps["onNavigate"];
  compact?: boolean;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white transition-colors duration-200 group-hover:text-[#f5d6bb]">
          {item.label}
        </p>
        {item.note ? (
          <p className={`mt-1 text-zinc-500 ${compact ? "text-[11px]" : "text-xs"}`}>{item.note}</p>
        ) : null}
      </div>
      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors duration-200 group-hover:text-[#f5d6bb]" />
    </>
  );

  if ("target" in item) {
    return (
      <button type="button" onClick={() => onNavigate(item.target)} className={`${baseLinkClass} text-left`}>
        {content}
      </button>
    );
  }

  if ("to" in item) {
    return (
      <Link to={item.to} className={baseLinkClass}>
        {content}
      </Link>
    );
  }

  const isExternal = item.href.startsWith("http");

  return (
    <a
      href={item.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={baseLinkClass}
    >
      {content}
    </a>
  );
}

function FooterQuickLink({
  item,
  onNavigate,
}: {
  item: FooterNavItem;
  onNavigate: FooterProps["onNavigate"];
}) {
  const className =
    "supporthr-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-200 hover:text-white";

  if ("target" in item) {
    return (
      <button type="button" onClick={() => onNavigate(item.target)} className={className}>
        {item.label}
      </button>
    );
  }

  if ("to" in item) {
    return (
      <Link to={item.to} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  );
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-white/[0.08] bg-black">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,214,187,0.08),transparent_28%)]" />

      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="home-grid-sheet border border-white/[0.08] bg-[rgba(8,8,9,0.96)]">
          <div className="grid border-b border-white/[0.08] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <section className="relative px-6 py-8 lg:px-8 lg:py-9">
              <div className="home-noise-overlay" />
              <div className="relative z-10">
                <p className="supporthr-mono text-[11px] uppercase tracking-[0.22em] text-[#f5d6bb]/80">
                  Support HR // Nền tảng vận hành tuyển dụng
                </p>
                <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  Gói toàn bộ quy trình sàng lọc vào một không gian làm việc rõ ràng cho đội tuyển dụng.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                  Support HR giúp đội ngũ giữ JD, CV, điểm đánh giá, phản hồi recruiter và tài liệu vận hành trên
                  cùng một bề mặt để ra quyết định nhanh và dễ bàn giao hơn.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/book-demo"
                    className="inline-flex min-h-11 items-center gap-2 border border-white bg-white px-5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-zinc-100"
                  >
                    Đặt lịch demo
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onNavigate("steps")}
                    className="inline-flex min-h-11 items-center gap-2 border border-white/[0.12] bg-transparent px-5 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/[0.22] hover:text-[#f5d6bb]"
                  >
                    Xem quy trình
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            <section className="grid border-t border-white/[0.08] sm:grid-cols-2 lg:border-l lg:border-t-0">
              <div className="border-b border-white/[0.08] px-6 py-6 sm:border-r">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/[0.12] bg-white/[0.02] text-[#f5d6bb]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Liên hệ</p>
                    <a
                      href="mailto:support@supporthr.vn"
                      className="mt-1 block text-sm font-medium text-white transition-colors hover:text-[#f5d6bb]"
                    >
                      support@supporthr.vn
                    </a>
                  </div>
                </div>
                <a
                  href="tel:0899280108"
                  className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <PhoneCall className="h-4 w-4 text-[#f5d6bb]" />
                  0899 280 108
                </a>
              </div>

              <div className="border-b border-white/[0.08] px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/[0.12] bg-white/[0.02] text-[#f5d6bb]">
                    <CalendarRange className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Trải nghiệm</p>
                    <p className="mt-1 text-sm font-medium text-white">Hẹn lịch review luồng tuyển dụng</p>
                  </div>
                </div>
                <Link
                  to="/book-demo"
                  className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Chọn thời gian phù hợp
                  <ArrowUpRight className="h-4 w-4 text-[#f5d6bb]" />
                </Link>
              </div>

              <div className="border-b border-white/[0.08] px-6 py-6 sm:border-b-0 sm:border-r">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/[0.12] bg-white/[0.02] text-[#f5d6bb]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Niềm tin</p>
                    <p className="mt-1 text-sm font-medium text-white">Tài liệu bảo mật và pháp lý rõ ràng</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                  {legalLinks.map((item) => (
                    <FooterQuickLink key={item.label} item={item} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/[0.12] bg-white/[0.02] text-[#f5d6bb]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Phạm vi</p>
                    <p className="mt-1 text-sm font-medium text-white">Từ sàng lọc đầu vào đến bàn giao shortlist</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => onNavigate("compare")}
                    className="supporthr-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-200 hover:text-white"
                  >
                    So sánh
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("pricing")}
                    className="supporthr-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-200 hover:text-white"
                  >
                    Bảng giá
                  </button>
                  <Link
                    to="/integrations"
                    className="supporthr-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-200 hover:text-white"
                  >
                    Tích hợp
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="grid divide-y divide-white/[0.08] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] lg:divide-x lg:divide-y-0">
            <section className="px-6 py-7 lg:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-white/[0.12] bg-black">
                  <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="supporthr-mono text-[16px] font-semibold uppercase tracking-[0.18em] text-white">
                    Support HR
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-400">
                    Nền tảng hỗ trợ đội tuyển dụng điều phối hồ sơ, giữ ngữ cảnh đánh giá và đưa ra quyết định trên một
                    luồng làm việc thống nhất.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <a
                  href="mailto:support@supporthr.vn"
                  className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 text-[#f5d6bb]" />
                  support@supporthr.vn
                </a>
                <a
                  href="tel:0899280108"
                  className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <PhoneCall className="h-4 w-4 text-[#f5d6bb]" />
                  0899 280 108
                </a>
              </div>
            </section>

            {footerSections.map(({ title, Icon, items }) => (
              <section key={title} className="px-6 py-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-white/[0.12] bg-white/[0.02] text-[#f5d6bb]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{title}</p>
                  </div>
                </div>

                <div className="mt-4">
                  {items.map((item) => (
                    <FooterNavLink key={item.label} item={item} onNavigate={onNavigate} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="grid items-center gap-6 border-t border-white/[0.08] px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {legalLinks.map((item) => (
                  <FooterQuickLink key={item.label} item={item} onNavigate={onNavigate} />
                ))}
                <Link
                  to="/book-demo"
                  className="supporthr-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  Liên hệ kinh doanh
                </Link>
              </div>

              <div className="flex flex-col gap-1 text-xs text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                <span>© 2026 Support HR. Mọi quyền được bảo lưu.</span>
                <span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:inline-block" />
                <span>Thiết kế cho luồng tuyển dụng nội bộ, demo và trao đổi với bên mua.</span>
              </div>
            </div>

            <div className="w-full max-w-[252px] justify-self-start lg:justify-self-end">
              <DmcaBadge note="Nội dung và tài sản số của Support HR được gắn bảo vệ DMCA." />
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
