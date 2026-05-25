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

      <div className="relative home-section-frame flex min-h-[30rem] flex-col py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col items-center gap-12 lg:gap-14">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <button
              type="button"
              onClick={() => onNavigate("hero")}
              className="group grid w-fit grid-cols-[2.5rem_auto_2.5rem] items-center gap-3 text-center"
              aria-label="Ve trang dau Support HR"
              
            >
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035]">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </span>
              <span className="text-center">
                <span className="supporthr-mono block text-[18px] font-black uppercase tracking-[0.12em] text-white transition-colors duration-300 group-hover:text-[#f5d6bb]">
                  Support HR
                </span>
                <span className="supporthr-mono mt-1 block text-[10px] font-bold uppercase tracking-[0.26em] text-[#f5d6bb]">
                  Quy trình tuyển dụng cho đội ngũ tuyển dụng hiện đại
                </span>
              </span>
            </button>

            <p className="mt-8 max-w-[34rem] text-sm leading-7 text-gray-400">
              Support HR giúp đội ngũ tuyển dụng đọc CV nhanh hơn, đối chiếu theo JD rõ ràng hơn, và chia sẻ danh sách
              đề cử để rà soát trong một quy trình dễ kiểm soát.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 text-gray-400 sm:flex-row sm:flex-wrap">
              {contactLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group inline-flex w-fit items-center gap-2 text-sm transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[#f5d6bb] transition-all duration-300 group-hover:bg-white/10">
                    <IconGlyph name={link.icon} className="h-3.5 w-3.5" />
                  </span>
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <SocialLinks />
            </div>
          </div>

          <div className="grid w-full max-w-5xl justify-items-center gap-10 border-t border-white/[0.08] pt-10 sm:grid-cols-3 sm:gap-12 lg:pt-12">
            <FooterColumn title="Sản phẩm" items={productLinks} onNavigate={onNavigate} />
            <FooterColumn title="Kinh doanh" items={salesLinks} onNavigate={onNavigate} />
            <FooterColumn title="Pháp lý" items={legalLinks} onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mt-14 w-full border-t border-white/10 pt-7">
          <div className="flex flex-col items-center justify-center gap-4 text-center text-xs text-zinc-600 sm:flex-row">
            <p>© 2026 Support HR. Mọi quyền được bảo lưu.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link to="/privacy-policy" className="transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white">
                Chính sách riêng tư
              </Link>
              <Link to="/terms" className="transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white">
                Điều khoản dịch vụ
              </Link>
              <Link to="/security" className="transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white">
                Bảo mật
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
