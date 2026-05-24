type FooterNavItem =
  | {
      label: string;
      target: string;
      href?: never;
    }
  | {
      label: string;
      href: string;
      target?: never;
    };

type FooterProps = {
  onNavigate: (target: string) => void;
};

const productLinks: FooterNavItem[] = [
  { label: "Trang đầu", target: "hero" },
  { label: "Bảng giá", target: "pricing" },
  { label: "Quy trình", target: "steps" },
  { label: "So sánh", target: "compare" },
  { label: "Liên hệ", target: "contact" },
];

const companyLinks: FooterNavItem[] = [
  { label: "Giới thiệu", target: "hero" },
  { label: "Bảo mật", href: "/privacy-policy" },
  { label: "Điều khoản", href: "/terms" },
  { label: "Liên hệ", href: "mailto:support@supporthr.vn" },
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
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/tmhpprofile2801/",
    icon: "linkedin",
  },
];

const contactLinks = [
  { label: "0899 280 108", href: "tel:0899280108", icon: "phone" },
  { label: "support@supporthr.vn", href: "mailto:support@supporthr.vn", icon: "mail" },
];

const asciiLogo = [
  " ####  #   # #####  #####  #####  ####  #####     #   # #### ",
  "#      #   # #   #  #   # #   #  #   #   #       #   # #   #",
  " ###   #   # #####  ##### #   #  ####    #       ##### #### ",
  "    #  #   # #      #     #   #  #  #    #       #   # #  # ",
  "####    ###  #      #      ##### #   #   #       #   # #   #",
];

const terminalNoise = [
  "[SCAN] supporthr.ai candidate map ----- score vectors stable",
  "+++++ ###### %%%%%% @@@@@@ 000000 ------ :::::: ++++++",
  "JD_PARSE // CV_MATCH // OCR_PIPE // SHORTLIST // AUDIT",
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

  if (name === "linkedin") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M5.1 8.8H1.8V22h3.3V8.8zM3.5 2.4a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM22.2 14.8c0-4-2.1-5.8-5-5.8-2.3 0-3.3 1.2-3.9 2.1V8.8H10V22h3.4v-6.5c0-1.7.3-3.4 2.5-3.4 2.1 0 2.1 2 2.1 3.5V22h3.4l.8-7.2z" />
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

const FooterAsciiBackdrop = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
    <div className="absolute left-0 top-0 h-80 w-96 bg-gradient-to-br from-emerald-500/10 via-blue-500/8 to-transparent blur-3xl" />
    <div className="absolute bottom-0 right-0 h-80 w-[32rem] bg-gradient-to-tl from-purple-500/12 via-blue-500/8 to-transparent blur-3xl" />

    <pre className="supporthr-footer-ascii absolute left-1/2 top-[46%] hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-pre text-left font-mono text-[12px] font-black leading-[0.86] tracking-[0.18em] text-zinc-500/[0.06] xl:block xl:text-[22px] 2xl:text-[24px]">
      {asciiLogo.join("\n")}
    </pre>

    <pre className="supporthr-footer-noise absolute inset-x-4 bottom-32 hidden select-none overflow-hidden whitespace-pre text-center font-mono text-[10px] font-bold leading-5 tracking-[0.42em] text-zinc-500/[0.08] lg:block">
      {terminalNoise.join("\n")}
    </pre>

    <div className="supporthr-footer-scan absolute left-0 top-20 h-px w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    <div className="absolute inset-x-0 bottom-28 h-px bg-white/[0.055]" />
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
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 ease-in-out hover:scale-110 hover:border-blue-400/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
      >
        <IconGlyph name={link.icon} className="h-4 w-4" />
      </a>
    ))}
  </div>
);

const Footer = ({ onNavigate }: FooterProps) => {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-white/10 bg-black">
      <FooterAsciiBackdrop />

      <div className="relative home-section-frame flex min-h-[30rem] flex-col py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col items-center gap-12 lg:gap-14">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <button
              type="button"
              onClick={() => onNavigate("hero")}
              className="group grid w-fit grid-cols-[2.5rem_auto_2.5rem] items-center gap-3 text-center"
              aria-label="Về trang đầu Support HR"
            >
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035]">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </span>
              <span className="text-center">
                <span className="supporthr-mono block text-[18px] font-black uppercase tracking-[0.12em] text-white transition-colors duration-300 group-hover:text-[#f5d6bb]">
                  Support HR
                </span>
                <span className="supporthr-mono mt-1 block text-[10px] font-bold uppercase tracking-[0.26em] text-[#f5d6bb]">
                  AI tuyển dụng
                </span>
              </span>
            </button>

            <p className="mt-8 max-w-[31rem] text-sm leading-7 text-gray-400">
              Nền tảng tuyển dụng AI cho doanh nghiệp Việt Nam. Đọc CV, đối sánh JD và tạo shortlist có kiểm chứng trong một luồng làm việc.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 text-gray-400 sm:flex-row sm:flex-wrap">
              {contactLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group inline-flex w-fit items-center gap-2 text-sm transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-blue-300 transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.35)]">
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

          <div className="grid w-full max-w-4xl justify-items-center gap-10 border-t border-white/[0.08] pt-10 sm:grid-cols-3 sm:gap-12 lg:max-w-5xl lg:pt-12">
            <FooterColumn title="Sản phẩm" items={productLinks} onNavigate={onNavigate} />
            <FooterColumn title="Công ty" items={companyLinks} onNavigate={onNavigate} />
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <h4 className="supporthr-mono mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Kết nối</h4>
              <div className="space-y-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 w-full border-t border-white/10 pt-7">
          <div className="flex flex-col items-center justify-center gap-4 text-center text-xs text-zinc-600 sm:flex-row">
            <p>© 2026 Support HR. Mọi quyền được bảo lưu.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a href="/privacy-policy" className="transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white">
                Privacy Policy
              </a>
              <a href="/terms" className="transition-all duration-300 ease-in-out hover:translate-x-1 hover:text-white">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
