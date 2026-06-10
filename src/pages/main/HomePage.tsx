import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppStep } from "@/types";
import LandingHero from "@/pages/main/home/LandingHero";
import PartnerTickerSection from "@/pages/main/home/PartnerTickerSection";
import WorkflowMatrixSection from "@/pages/main/home/WorkflowMatrixSection";
import Footer from "@/pages/main/home/Footer";
import PricingSection from "@/pages/main/home/PricingSection";
import FAQSection from "@/pages/main/home/FAQSection";

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
  { label: "Trang chủ", icon: "fa-house", target: "hero" },
  { label: "Vấn đề", icon: "fa-list-ol", target: "steps" },
  { label: "Tư vấn", icon: "fa-calendar-check", target: "pricing" },
  { label: "FAQ", icon: "fa-circle-question", target: "faq" },
  { label: "Tài liệu", icon: "fa-book-open", href: "/team" },
];

const mobileToolItems: Array<{ label: string; icon: string; step: AppStep; description: string }> = [
  { label: "Thư viện CV", icon: "fa-folder-open", step: "records", description: "Hồ sơ đã lọc" },
  { label: "Chuẩn hóa JD", icon: "fa-wand-magic-sparkles", step: "jd-standardizer", description: "Tối ưu mô tả công việc" },
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
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setToolsMenuOpen(false);
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

  const openTool = (step: AppStep) => {
    setMobileMenuOpen(false);
    setToolsMenuOpen(false);
    if (!isLoggedIn) {
      onLoginRequest();
      return;
    }
    setActiveStep(step);
  };

  const canContinue = completedSteps.length > 0;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-page-shell min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-10" />
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-blue-100 bg-white/95 backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="h-8 w-8 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-bold text-slate-900">Support HR</p>
              <p className="text-[10px] text-slate-500">Nền tảng sàng lọc cho đội ngũ tuyển dụng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-slate-500 hover:text-blue-600"
            aria-label="Đóng menu"
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-700"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <i className={`fa-solid ${item.icon} text-[11px] text-blue-500`} />
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          ))}

          <div className="px-3 pb-1 pt-4">
            <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-blue-500">
              Công cụ
            </p>
          </div>

          {mobileToolItems.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => openTool(item.step)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-700"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <i className={`fa-solid ${item.icon} text-[11px] text-blue-500`} />
              </div>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">{item.label}</span>
                <span className="block truncate text-[10px] text-slate-500">{item.description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-blue-100 p-4">
          {isLoggedIn ? (
            <>
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5">
                <img src={userAvatar || "/images/logos/logo.jpg"} alt="avatar" className="h-7 w-7 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-slate-900">
                    {userName || userEmail?.split("@")[0] || "Tài khoản"}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveStep("jd");
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
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
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
            >
              <i className="fa-solid fa-right-to-bracket text-[11px]" /> Đăng nhập
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/92 backdrop-blur-xl shadow-[0_12px_36px_rgba(30,64,175,0.07)]">
          <div className="flex h-[4.45rem] w-full items-center justify-between px-6 sm:px-10 lg:px-16">
            <button
              type="button"
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-slate-900">
                  Support HR
                </span>
                <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-blue-600">
                  Không gian tuyển dụng AI
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
              <div className="hidden items-center gap-8 lg:flex">
                <button
                  type="button"
                  onClick={() => scrollTo("steps")}
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors duration-200 hover:text-blue-700"
                >
                  VẤN ĐỀ
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("pricing")}
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors duration-200 hover:text-blue-700"
                >
                  TƯ VẤN
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("faq")}
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors duration-200 hover:text-blue-700"
                >
                  FAQ
                </button>
                <Link
                  to="/team"
                  className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors duration-200 hover:text-blue-700"
                >
                  TÀI LIỆU
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setToolsMenuOpen((open) => !open)}
                    className="supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 transition-colors duration-200 hover:text-blue-800"
                    aria-expanded={toolsMenuOpen}
                  >
                    CÔNG CỤ
                  </button>
                  {toolsMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+1rem)] z-[60] w-64 overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_24px_60px_rgba(30,64,175,0.16)]">
                      <button
                        type="button"
                        onClick={() => openTool('records')}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <i className="fa-solid fa-folder-open text-sm" />
                        </span>
                        <span>
                          <span className="block text-sm font-black text-slate-950">Thư viện CV</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">Xem hồ sơ đã lọc từ các phiên trước.</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openTool('jd-standardizer')}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <i className="fa-solid fa-wand-magic-sparkles text-sm" />
                        </span>
                        <span>
                          <span className="block text-sm font-black text-slate-950">Chuẩn hóa JD</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">Tạo bản JD rõ ràng hơn bằng AI.</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {!isLoggedIn ? (
                  <button
                    type="button"
                    onClick={onLoginRequest}
                    className="hidden h-9 items-center justify-center rounded-xl border border-blue-100 bg-white px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition-colors duration-200 hover:border-blue-200 hover:text-blue-700 sm:inline-flex"
                  >
                    ĐĂNG NHẬP
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleStart}
                  className="hidden h-9 items-center justify-center rounded-xl bg-blue-600 px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_34px_rgba(35,136,255,0.18)] transition-colors duration-200 hover:bg-blue-700 sm:inline-flex"
                >
                  {canContinue ? "TIẾP TỤC" : "DÙNG THỬ"}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-600 shadow-sm transition-colors hover:text-blue-700 lg:hidden"
                  aria-label="Mở menu"
                >
                  <i className="fa-solid fa-bars text-sm" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <LandingHero
          onPrimaryAction={handleStart}
          onSecondaryAction={() => navigate("/book-demo")}
          primaryLabel={canContinue ? "Tiếp tục quy trình" : "Dùng thử miễn phí"}
        />

        <PartnerTickerSection partners={partners} />
        <section className="border-y border-blue-100 bg-white">
          <WorkflowMatrixSection onPrimaryAction={handleStart} merged />
        </section>

        <PricingSection />
        <FAQSection />
        <Footer onNavigate={scrollTo} />
      </div>
    </div>
  );
};

export default HomePage;
