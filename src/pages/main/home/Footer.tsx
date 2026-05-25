import {
  ArrowUpRight,
  Blocks,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

type FooterNavItem =
  | {
      label: string;
      target: string;
      href?: never;
      to?: never;
    }
  | {
      label: string;
      href: string;
      target?: never;
      to?: never;
    }
  | {
      label: string;
      to: string;
      href?: never;
      target?: never;
    };

type FooterProps = {
  onNavigate: (target: string) => void;
};

type FooterPanel = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  Icon: typeof Blocks;
  items: FooterNavItem[];
};

const footerPanels: FooterPanel[] = [
  {
    eyebrow: "Quy trình",
    title: "Điều phối sàng lọc trên một bề mặt làm việc",
    description:
      "Giữ JD, CV, chấm điểm và danh sách đề cử trong cùng một luồng vận hành gọn cho đội tuyển dụng.",
    ctaLabel: "Mở quy trình",
    Icon: Blocks,
    items: [
      { label: "Quy trình vận hành", target: "steps" },
      { label: "Ma trận so sánh", target: "compare" },
      { label: "Bảng giá", target: "pricing" },
    ],
  },
  {
    eyebrow: "Kinh doanh",
    title: "Xem sản phẩm như một công cụ vận hành thực tế",
    description:
      "Dành cho đội ngũ muốn rà soát quy trình tuyển dụng, hiểu phạm vi triển khai và lên lịch trải nghiệm trực tiếp.",
    ctaLabel: "Đặt lịch trải nghiệm",
    Icon: CalendarRange,
    items: [
      { label: "Trang bảng giá", to: "/pricing" },
      { label: "Tình huống sử dụng", to: "/use-cases" },
      { label: "Đặt lịch demo", to: "/book-demo" },
    ],
  },
  {
    eyebrow: "Niềm tin",
    title: "Nội dung rõ ràng cho bên mua và đội triển khai",
    description:
      "Trình bày bảo mật, tích hợp và phương pháp AI theo ngôn ngữ dễ kiểm tra, phù hợp cho trao đổi nội bộ.",
    ctaLabel: "Xem bảo mật",
    Icon: ShieldCheck,
    items: [
      { label: "Bảo mật", to: "/security" },
      { label: "Hỏi đáp", to: "/faq" },
      { label: "Phương pháp AI", to: "/ai-methodology" },
    ],
  },
];

const secondaryLinks: FooterNavItem[] = [
  { label: "Chính sách riêng tư", to: "/privacy-policy" },
  { label: "Điều khoản dịch vụ", to: "/terms" },
  { label: "Tích hợp", to: "/integrations" },
  { label: "Email tư vấn", href: "mailto:support@supporthr.vn" },
  { label: "Hotline", href: "tel:0899280108" },
];

const footerLinkClass =
  "group inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors duration-200 hover:text-white";

function FooterLink({
  item,
  onNavigate,
}: {
  item: FooterNavItem;
  onNavigate: FooterProps["onNavigate"];
}) {
  if ("target" in item) {
    return (
      <button type="button" onClick={() => onNavigate(item.target)} className={`${footerLinkClass} text-left`}>
        <span className="h-1 w-1 bg-[#f5d6bb]/60 transition-colors duration-200 group-hover:bg-[#f5d6bb]" />
        {item.label}
      </button>
    );
  }

  if ("to" in item) {
    return (
      <Link to={item.to} className={footerLinkClass}>
        <span className="h-1 w-1 bg-[#f5d6bb]/60 transition-colors duration-200 group-hover:bg-[#f5d6bb]" />
        {item.label}
      </Link>
    );
  }

  const isExternal = item.href.startsWith("http");

  return (
    <a
      href={item.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={footerLinkClass}
    >
      <span className="h-1 w-1 bg-[#f5d6bb]/60 transition-colors duration-200 group-hover:bg-[#f5d6bb]" />
      {item.label}
    </a>
  );
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="contact" className="relative overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_34%)]" />

      <div className="relative w-full px-4 pb-10 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-12 lg:pt-6">
        <div className="home-grid-sheet border border-white/[0.08] bg-[rgba(10,10,11,0.96)]">
          <div className="grid divide-y divide-white/[0.08] xl:grid-cols-3 xl:divide-x xl:divide-y-0">
          {footerPanels.map(({ eyebrow, title, description, ctaLabel, Icon, items }) => (
            <section key={title} className="relative px-6 py-6 lg:px-7 lg:py-7">
              <div className="home-noise-overlay" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-[#f5d6bb]/75">
                    {eyebrow}
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center text-[#f5d6bb]">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>

                <h3 className="mt-7 max-w-[16rem] text-[1.45rem] font-semibold leading-tight text-white">
                  {title}
                </h3>
                <p className="mt-4 max-w-[28rem] text-sm leading-7 text-zinc-400">{description}</p>

                <div className="mt-6 flex flex-col gap-3">
                  {items.map((item) => (
                    <FooterLink key={item.label} item={item} onNavigate={onNavigate} />
                  ))}
                </div>

                <div className="mt-8 pt-6">
                  {"target" in items[0] ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(items[0].target)}
                      className="inline-flex items-center gap-2 supporthr-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:text-[#f5d6bb]"
                    >
                      {ctaLabel}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  ) : "to" in items[0] ? (
                    <Link
                      to={items[0].to}
                      className="inline-flex items-center gap-2 supporthr-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:text-[#f5d6bb]"
                    >
                      {ctaLabel}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <a
                      href={items[0].href}
                      className="inline-flex items-center gap-2 supporthr-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:text-[#f5d6bb]"
                    >
                      {ctaLabel}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {secondaryLinks.map((item) => (
              <FooterLink key={item.label} item={item} onNavigate={onNavigate} />
            ))}
          </div>

          <div className="pt-2">
            <p className="supporthr-mono text-[16px] font-semibold uppercase tracking-[0.26em] text-white">
              Support HR
            </p>
            <p className="mt-2 text-xs text-zinc-600">© 2026 Support HR. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
