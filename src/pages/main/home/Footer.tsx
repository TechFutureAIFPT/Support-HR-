import { ArrowUpRight, Building2, Mail, Phone, ShieldCheck } from "lucide-react";
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

const productLinks: FooterNavItem[] = [
  { label: "Quy trình", target: "steps" },
  { label: "So sánh", target: "compare" },
  { label: "Bảng giá", target: "pricing" },
  { label: "Trải nghiệm", to: "/demo" },
  { label: "Tích hợp", to: "/integrations" },
  { label: "Phương pháp AI", to: "/ai-methodology" },
];

const salesLinks: FooterNavItem[] = [
  { label: "Trang bảng giá", to: "/pricing" },
  { label: "Tình huống sử dụng", to: "/use-cases" },
  { label: "Hỏi đáp", to: "/faq" },
  { label: "Đặt lịch demo", to: "/book-demo" },
  { label: "Hotline", href: "tel:0899280108" },
  { label: "Email tư vấn", href: "mailto:support@supporthr.vn" },
];

const legalLinks: FooterNavItem[] = [
  { label: "Bảo mật", to: "/security" },
  { label: "Chính sách riêng tư", to: "/privacy-policy" },
  { label: "Điều khoản", to: "/terms" },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61577736765345",
    icon: "facebook",
  },
  {
    label: "GitHub",
    href: "https://github.com/TechFutureAIFPT",
    icon: "github",
  },
];

const contactLinks = [
  { label: "0899 280 108", href: "tel:0899280108", icon: "phone" },
  { label: "support@supporthr.vn", href: "mailto:support@supporthr.vn", icon: "mail" },
];

const linkClass =
  "block w-fit text-sm text-gray-400 transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white";

const IconGlyph = ({ name, className = "h-4 w-4" }: { name: string; className?: string }) => {
  const common = {
    className,
    "aria-hidden": true,
    viewBox: "0 0 24 24",
  };

  if (name === "facebook") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M16.8 13.5l.5-3.5h-3.4V7.7c0-1 .5-1.9 2-1.9h1.6v-3A19 19 0 0 0 14.7 2C11.9 2 10 3.7 10 6.8V10H6.8v3.5H10V22h3.9v-8.5h2.9z" />
      </svg>
    );
  }

  if (name === "github") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 .8a11.2 11.2 0 0 0-3.5 21.8c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2A11 11 0 0 1 12 5.1c1 0 2 .1 2.9.4 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.8 5.5-5.4 5.8.4.4.8 1.1.8 2.2V22c0 .3.2.7.8.6A11.2 11.2 0 0 0 12 .8z" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
      </svg>
    );
  }

  return (
    <svg {...common} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
};

const FooterLink = ({ item, onNavigate }: { item: FooterNavItem; onNavigate: FooterProps["onNavigate"] }) => {
  if ("target" in item) {
    return (
      <button type="button" onClick={() => onNavigate(item.target)} className={`${linkClass} text-left`}>
        {item.label}
      </button>
    );
  }

  if ("to" in item) {
    return (
      <Link to={item.to} className={linkClass}>
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
      className={linkClass}
    >
      {item.label}
    </a>
  );
};

const FooterColumn = ({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: FooterNavItem[];
  onNavigate: FooterProps["onNavigate"];
}) => (
  <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
    <h4 className="supporthr-mono mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{title}</h4>
    <div className="space-y-4">
      {items.map((item) => (
        <FooterLink key={item.label} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  </div>
);

const SocialLinks = () => (
  <div className="flex items-center gap-3">
    {socialLinks.map((link) => (
      <a
        key={link.label}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.label}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 ease-in-out hover:scale-110 hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <IconGlyph name={link.icon} className="h-4 w-4" />
      </a>
    ))}
  </div>
);

const Footer = ({ onNavigate }: FooterProps) => {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-white/10 bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute left-0 top-0 h-80 w-96 bg-[radial-gradient(circle_at_top_left,rgba(245,214,187,0.1),transparent_65%)]" />
        <div className="absolute bottom-0 right-0 h-80 w-[32rem] bg-[radial-gradient(circle_at_bottom_right,rgba(245,214,187,0.08),transparent_68%)]" />
      </div>

      <div className="relative home-section-frame py-12 sm:py-14 lg:py-16">
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="grid gap-8 border-b border-white/8 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:px-8">
            <div className="max-w-[34rem]">
              <button
                type="button"
                onClick={() => onNavigate("hero")}
                className="group flex items-center gap-3 text-left"
                aria-label="Về trang đầu Support HR"
              >
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035]">
                  <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
                </span>
                <span>
                  <span className="supporthr-mono block text-[16px] font-bold uppercase tracking-[0.1em] text-white transition-colors duration-300 group-hover:text-[#f5d6bb]">
                    Support HR
                  </span>
                  <span className="supporthr-mono mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5d6bb]/75">
                    Không gian sàng lọc cho đội ngũ tuyển dụng
                  </span>
                </span>
              </button>

              <p className="mt-4 max-w-[32rem] text-sm leading-7 text-zinc-400">
                Hỗ trợ đội tuyển dụng đọc CV nhanh hơn, đối chiếu theo JD rõ hơn, và chuyển danh sách đề cử sang bước
                rà soát nội bộ trong một quy trình dễ kiểm soát.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/book-demo"
                  className="inline-flex h-10 items-center gap-2 border border-white/12 bg-white px-4 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-100"
                >
                  Đặt lịch trải nghiệm
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/security"
                  className="inline-flex h-10 items-center gap-2 border border-white/12 px-4 text-[12px] font-semibold text-zinc-200 transition-colors hover:border-white/24 hover:bg-white/[0.03] hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4 text-[#f5d6bb]" />
                  Xem thông tin bảo mật
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="tel:0899280108"
                className="border border-white/8 bg-black/45 px-4 py-4 transition-colors hover:border-white/16 hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.03] text-[#f5d6bb]">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Hotline</p>
                    <p className="mt-1 text-sm font-semibold text-white">0899 280 108</p>
                  </div>
                </div>
              </a>
              <a
                href="mailto:support@supporthr.vn"
                className="border border-white/8 bg-black/45 px-4 py-4 transition-colors hover:border-white/16 hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.03] text-[#f5d6bb]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Email</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">support@supporthr.vn</p>
                  </div>
                </div>
              </a>
              <div className="border border-white/8 bg-black/45 px-4 py-4 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.03] text-[#f5d6bb]">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Hỗ trợ doanh nghiệp</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Phù hợp cho đội ngũ cần sàng lọc CV, giữ lịch sử phiên và chia sẻ kết quả cho nhiều bên.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-5 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr_0.9fr_auto] lg:px-8">
            <FooterColumn title="Sản phẩm" items={productLinks} onNavigate={onNavigate} />
            <FooterColumn title="Kinh doanh" items={salesLinks} onNavigate={onNavigate} />
            <FooterColumn title="Pháp lý" items={legalLinks} onNavigate={onNavigate} />
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <h4 className="supporthr-mono mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Kết nối
              </h4>
              <SocialLinks />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Support HR. Mọi quyền được bảo lưu.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="transition-colors hover:text-white">
              Chính sách riêng tư
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              Điều khoản dịch vụ
            </Link>
            <Link to="/security" className="transition-colors hover:text-white">
              Bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
