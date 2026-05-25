import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppStep } from "@/types";
import LandingHero from "@/pages/main/home/LandingHero";
import PartnerTickerSection from "@/pages/main/home/PartnerTickerSection";
import WhySupportSection from "@/pages/main/home/WhySupportSection";
import WorkflowMatrixSection from "@/pages/main/home/WorkflowMatrixSection";
import Footer from "@/pages/main/home/Footer";
import ComparisonTable from "@/pages/main/home/ComparisonTable";
import PricingSection from "@/pages/main/home/PricingSection";

const partners = [
  { name: "FPT", logo: "/images/logos/fpt.png" },
  { name: "TopCV", logo: "/images/logos/topcv-1.png" },
  { name: "Vinedimex", logo: "/images/logos/vinedimex-1.png" },
  { name: "HB", logo: "/images/logos/hb.png" },
  { name: "Mi AI", logo: "/images/logos/mi_ai.png" },
  { name: "2.1 Studio", logo: "/images/logos/2.1.png" },
];

interface HomePageProps {
  setActiveStep: (step: AppStep) => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  completedSteps: AppStep[];
  userAvatar?: string | null;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

const mobileNavItems = [
  { label: "Trang đầu", icon: "fa-house", target: "hero" },
  { label: "Quy trình", icon: "fa-list-ol", target: "steps" },
  { label: "So sánh", icon: "fa-scale-balanced", target: "compare" },
  { label: "Bảng giá", icon: "fa-tags", target: "pricing" },
  { label: "Bảo mật", icon: "fa-user-shield", href: "/security" },
  { label: "Hỏi đáp", icon: "fa-circle-question", href: "/faq" },
  { label: "Trải nghiệm", icon: "fa-circle-play", href: "/demo" },
];

const HomePage: React.FC<HomePageProps> = ({
  setActiveStep,
  isLoggedIn,
  onLoginRequest,
  completedSteps,
  userAvatar,
  userName,
  userEmail,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleStart = () => {
    if (isLoggedIn) {
      setActiveStep("jd");
      return;
    }
    onLoginRequest();
  };

  const canContinue = completedSteps.length > 0;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-page-shell min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_42%)]" />
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-white/10 bg-black/95 backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="h-8 w-8 object-cover" />
            <div>
              <p className="text-sm font-bold text-white">Support HR</p>
              <p className="text-[10px] text-zinc-500">Nền tảng sàng lọc cho đội ngũ tuyển dụng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center bg-white/[0.04] text-zinc-400 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {mobileNavItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if ("href" in item && item.href) {
                  setMobileMenuOpen(false);
                  navigate(item.href);
                  return;
                }
                scrollTo(item.target!);
              }}
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-zinc-300 transition-all hover:bg-white/[0.05] hover:text-white"
            >
              <div className="flex h-7 w-7 items-center justify-center bg-white/[0.04]">
                <i className={`fa-solid ${item.icon} text-[11px] text-zinc-400`} />
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-white/10 p-4">
          {isLoggedIn ? (
            <>
              <div className="mb-1 flex items-center gap-3 bg-white/[0.04] px-3 py-2.5">
                <img
                  src={userAvatar || "/images/logos/logo.jpg"}
                  alt="avatar"
                  className="h-7 w-7 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-white">
                    {userName || userEmail?.split("@")[0] || "Tài khoản"}
                  </p>
                  <p className="truncate text-[10px] text-zinc-500">{userEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveStep("jd");
                }}
                className="flex h-10 w-full items-center justify-center gap-2 bg-white text-[13px] font-bold text-black shadow-lg shadow-white/10"
              >
                <i className="fa-solid fa-bolt text-xs" /> Tiếp tục sàng lọc
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLoginRequest();
              }}
              className="flex h-10 w-full items-center justify-center gap-2 bg-white text-[13px] font-black text-black shadow-lg shadow-white/10"
            >
              <i className="fa-solid fa-right-to-bracket text-[11px]" /> Đăng nhập
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black">
          <div className="flex h-[4.45rem] w-full items-center justify-between px-6 sm:px-10 lg:px-16">
            <button
              type="button"
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90"
            >
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden border border-white/14 bg-black">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-white">
                  Support HR
                </span>
                <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5d6bb]">
                  Không gian tuyển dụng AI
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
              <div className="hidden items-center gap-8 lg:flex">
                <button
                  type="button"
                  onClick={() => scrollTo("steps")}
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  QUY TRÌNH
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("compare")}
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  SO SÁNH
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("pricing")}
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  BẢNG GIÁ
                </button>
                <Link
                  to="/security"
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  BẢO MẬT
                </Link>
                <Link
                  to="/faq"
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  HỎI ĐÁP
                </Link>
                <Link
                  to="/demo"
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  TRẢI NGHIỆM
                </Link>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {!isLoggedIn ? (
                  <button
                    type="button"
                    onClick={onLoginRequest}
                    className="hidden h-8 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-200 hover:border-white/24 hover:text-white sm:inline-flex"
                  >
                    DANG NHAP
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleStart}
                  className="hidden h-8 items-center justify-center bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-200 hover:bg-zinc-100 sm:inline-flex"
                >
                  {canContinue ? "TIEP TUC" : "BAT DAU"}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:text-white lg:hidden"
                >
                  <i className="fa-solid fa-bars text-sm" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <LandingHero
          onPrimaryAction={handleStart}
          onSecondaryAction={() => scrollTo("steps")}
          primaryLabel={canContinue ? "TIẾP TỤC QUY TRÌNH" : "BẮT ĐẦU DÙNG THỬ"}
        />

        <PartnerTickerSection partners={partners} />
        <WorkflowMatrixSection onPrimaryAction={handleStart} />
        <WhySupportSection />

        <section id="compare" className="border-y border-zinc-800 bg-zinc-950 py-12 sm:py-14">
          <div className="w-full max-w-none px-4 sm:px-7 lg:px-10">
            <ComparisonTable />
          </div>
        </section>

        <PricingSection />
        <Footer onNavigate={scrollTo} />
      </div>
    </div>
  );
};

export default HomePage;
