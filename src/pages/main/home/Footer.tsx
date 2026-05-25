import { Link } from "react-router-dom";
import DmcaBadge from "@/components/common/DmcaBadge";

type FooterNavItem =
  | {
      label: string;
      target: string;
      to?: never;
      href?: never;
    }
  | {
      label: string;
      to: string;
      target?: never;
      href?: never;
    }
  | {
      label: string;
      href: string;
      target?: never;
      to?: never;
    };

type FooterProps = {
  onNavigate: (target: string) => void;
};

type FooterColumn = {
  title: string;
  items: FooterNavItem[];
};

const footerColumns: FooterColumn[] = [
  {
    title: "TÃ i nguyÃªn",
    items: [
      { label: "Báº£ng giÃ¡", target: "pricing" },
      { label: "Báº£o máº­t", to: "/security" },
      { label: "Há»i Ä‘Ã¡p", to: "/faq" },
      { label: "Demo", to: "/demo" },
    ],
  },
  {
    title: "Sáº£n pháº©m",
    items: [
      { label: "Quy trÃ¬nh", target: "steps" },
      { label: "So sÃ¡nh", target: "compare" },
      { label: "TÃ­ch há»£p", to: "/integrations" },
      { label: "PhÆ°Æ¡ng phÃ¡p AI", to: "/ai-methodology" },
    ],
  },
  {
    title: "PhÃ¡p lÃ½",
    items: [
      { label: "Äiá»u khoáº£n", to: "/terms" },
      { label: "RiÃªng tÆ°", to: "/privacy-policy" },
      { label: "LiÃªn há»‡", href: "mailto:support@supporthr.vn" },
    ],
  },
];

function FooterLink({
  item,
  onNavigate,
}: {
  item: FooterNavItem;
  onNavigate: FooterProps["onNavigate"];
}) {
  const className =
    "block text-base text-zinc-400 transition-colors duration-200 hover:text-white sm:text-[1.05rem]";

  if ("target" in item) {
    return (
      <button type="button" onClick={() => onNavigate(item.target)} className={`${className} text-left`}>
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
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-15" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_42%)]" />

      <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-16 hidden justify-center lg:flex">
            <p className="supporthr-mono select-none text-[8.5rem] font-semibold uppercase leading-none tracking-[0.08em] text-white/[0.05]">
              SUPPORT HR
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden border border-white/[0.12] bg-black">
                  <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
                </div>
                <span className="supporthr-mono text-2xl font-semibold uppercase tracking-[0.04em] text-white">
                  Support HR
                </span>
              </div>

              <div className="lg:hidden">
                <p className="supporthr-mono select-none text-4xl font-semibold uppercase tracking-[0.16em] text-white/[0.06] sm:text-6xl">
                  SUPPORT HR
                </p>
              </div>

              <p className="max-w-md text-sm leading-7 text-zinc-500 sm:text-base">
                KhÃ´ng gian sÃ ng lá»c dÃ nh cho Ä‘á»™i tuyá»ƒn dá»¥ng cáº§n tá»‘c Ä‘á»™, ngá»¯ cáº£nh vÃ  kháº£ nÄƒng bÃ n giao rÃµ rÃ ng.
              </p>
            </div>

            <div className="relative z-10 grid gap-8 sm:grid-cols-3 sm:gap-12">
              {footerColumns.map((column) => (
                <section key={column.title} className="min-w-[150px]">
                  <p className="supporthr-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {column.title}
                  </p>
                  <div className="mt-5 space-y-4">
                    {column.items.map((item) => (
                      <FooterLink key={item.label} item={item} onNavigate={onNavigate} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-white/[0.08] pt-6 sm:mt-12 sm:pt-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Â© 2026 Support HR. Má»i quyá»n Ä‘Æ°á»£c báº£o lÆ°u.</p>
                <div className="flex flex-col gap-1 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:gap-x-4">
                  <a href="mailto:support@supporthr.vn" className="transition-colors hover:text-zinc-400">
                    support@supporthr.vn
                  </a>
                  <a href="tel:0899280108" className="transition-colors hover:text-zinc-400">
                    0899 280 108
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:justify-end">
                <DmcaBadge
                  className="border-0 bg-transparent px-0 py-0"
                  centered={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
