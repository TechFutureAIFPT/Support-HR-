import React, { useEffect, useRef, useState } from "react";
import type { AppStep } from '@/types';
import LandingHero from "@/pages/main/home/LandingHero";
import PartnerTickerSection from "@/pages/main/home/PartnerTickerSection";
import WhySupportSection from "@/pages/main/home/WhySupportSection";
import WorkflowMatrixSection from "@/pages/main/home/WorkflowMatrixSection";
import Footer from "@/pages/main/home/Footer";
import ComparisonTable from "@/pages/main/home/ComparisonTable";

const partners = [
  { name: "FPT", logo: "/images/logos/fpt.png" },
  { name: "TopCV", logo: "/images/logos/topcv-1.png" },
  { name: "Vinedimex", logo: "/images/logos/vinedimex-1.png" },
  { name: "HB", logo: "/images/logos/hb.png" },
  { name: "Mì AI", logo: "/images/logos/mi_ai.png" },
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

const HomePage: React.FC<HomePageProps> = ({
  setActiveStep, isLoggedIn, onLoginRequest, completedSteps, userAvatar, userName, userEmail,
}) => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsVideoOpen(false); setMobileMenuOpen(false); setActiveMegaMenu(null); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMegaMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleStart = () => { isLoggedIn ? setActiveStep("jd") : onLoginRequest(); };
  const canContinue = completedSteps.length > 0;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setActiveMegaMenu(null);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const mobileNavItems = [
    { label: "Trang đầu", icon: "fa-house", target: "hero" },
    { label: "Quy trình", icon: "fa-list-ol", target: "steps" },
    { label: "So sánh", icon: "fa-scale-balanced", target: "compare" },
    { label: "Bảng giá", icon: "fa-tags", target: "pricing" },
    { label: "Bảo mật", icon: "fa-user-shield", href: "/privacy-policy" },
    { label: "Điều khoản", icon: "fa-file-contract", href: "/terms" },
  ];

  return (
    <div className="home-page-shell min-h-screen overflow-x-hidden bg-black text-zinc-100">

      {/* ── Ambient Background Orbs ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="supporthr-grid-mask absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_42%)]" />
      </div>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 border-r border-white/10 bg-black/95 backdrop-blur-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-8 h-8 rounded-none object-cover" />
            <div><p className="text-sm font-bold text-white">Support HR</p><p className="text-[10px] text-zinc-500">Nền tảng tuyển dụng AI</p></div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-none bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {mobileNavItems.map((item) => (
            <button key={item.label} onClick={() => item.href ? window.open(item.href, "_blank") : scrollTo(item.target!)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-none text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all text-left">
              <div className="w-7 h-7 rounded-none bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${item.icon} text-[11px] text-zinc-400`} />
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 space-y-2">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-none bg-white/[0.04] mb-1">
                <img src={userAvatar || "/images/logos/logo.jpg"} alt="avatar" className="w-7 h-7 rounded-none object-cover" />
                <div className="min-w-0"><p className="text-[12px] font-semibold text-white truncate">{userName || userEmail?.split("@")[0]}</p><p className="text-[10px] text-zinc-500 truncate">{userEmail}</p></div>
              </div>
              <button onClick={() => { setMobileMenuOpen(false); setActiveStep("jd"); }}
                className="w-full h-10 rounded-none bg-white text-black font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                <i className="fa-solid fa-bolt text-xs" /> Tiếp tục quy trình
              </button>
            </>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); onLoginRequest(); }}
              className="w-full h-10 rounded-none bg-white text-black font-black text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10">
              <i className="fa-solid fa-right-to-bracket text-[11px]" /> Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── Navbar ───────────────────────────────────────── */}
        <nav
          ref={navRef}
          className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black"
        >
          <div className="flex h-[4.45rem] w-full items-center justify-between px-6 sm:px-10 lg:px-16">
            <button
              type="button"
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90"
            >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-none border border-white/14 bg-black">
                  <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>
                <div className="flex flex-col">
                  <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-white">Support HR</span>
                  <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5d6bb]">Tuyển dụng AI</span>
                </div>
            </button>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
              <div className="hidden lg:flex items-center gap-8">
                {[
                  { label: "QUY TRÌNH", href: "#steps" },
                  { label: "SO SÁNH", href: "#compare" },
                  { label: "BẢNG GIÁ", href: "#pricing" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="supporthr-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {!isLoggedIn && (
                  <button
                    onClick={onLoginRequest}
                    className="hidden sm:inline-flex h-8 items-center justify-center rounded-none border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-200 hover:border-white/24 hover:text-white [&_i]:hidden"
                  >
                    <i className="fa-solid fa-right-to-bracket text-xs" /> ĐĂNG NHẬP
                  </button>
                )}
                <button
                  onClick={handleStart}
                  className="hidden sm:inline-flex h-8 items-center justify-center rounded-none bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-200 hover:bg-zinc-100 [&_i]:hidden"
                >
                  <i className="fa-solid fa-bolt text-xs" /> BẮT ĐẦU
                </button>
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-none border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:text-white lg:hidden"
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
          primaryLabel={canContinue ? "TIẾP TỤC QUY TRÌNH" : "GET STARTED"}
        />

        <PartnerTickerSection partners={partners} />

        {/* ── Steps Section ─────────────────────────────────── */}
        <WorkflowMatrixSection onPrimaryAction={handleStart} />

        <WhySupportSection />

        {/* ── Comparison Section ──────────────────────────────── */}
        <section id="compare" className="border-y border-zinc-800 bg-zinc-950 py-20">
          <div className="w-full max-w-none px-4 sm:px-7 lg:px-10">
            <div className="mx-auto mb-12 max-w-[90rem] px-1 text-center">
              <p className="supporthr-mono text-[12px] font-black uppercase tracking-[0.28em] text-blue-300">
                // Bảng so sánh
              </p>
              <h2 className="supporthr-display mt-6 text-5xl font-black uppercase leading-[0.9] tracking-normal text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block">AI Tổng quát</span>
                <span className="block bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent">so với Support HR</span>
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
                So sánh những năng lực tuyển dụng quan trọng nhất khi xử lý JD, CV và dữ liệu ứng viên ở quy mô doanh nghiệp.
              </p>
            </div>

            <ComparisonTable />
          </div>
        </section>

        <div id="pricing" className="h-0 overflow-hidden" aria-hidden="true" />

        {/* ── Contact Section ────────────────────────────────── */}
        <Footer onNavigate={scrollTo} />
      </div>

      {/* ── Video Modal ──────────────────────────────────────── */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setIsVideoOpen(false)}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" style={{ animation: "fadeIn .2s ease" }} />
          <div className="relative z-10 w-full max-w-4xl rounded-none overflow-hidden border border-slate-700 shadow-2xl"
            style={{ animation: "scaleIn .25s ease" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900/95 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-play text-[#f5d6bb]" />
                <span className="text-white font-semibold text-sm">Video giới thiệu – Support HR</span>
              </div>
              <button onClick={() => setIsVideoOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="bg-black aspect-video">
              <video src="/images/video/SPHR Ver3.mp4" poster="/images/video/cover.png" controls autoPlay className="w-full h-full object-contain" />
            </div>
          </div>
          <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } } @keyframes scaleIn { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }`}</style>
        </div>
      )}

    </div>
  );
};

export default HomePage;
