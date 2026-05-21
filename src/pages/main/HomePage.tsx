import React, { useEffect, useRef, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Code2,
  Factory,
  FileImage,
  Layers3,
  Mic,
  Minus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AppStep } from '@/types';
import type { ComparisonCell } from "@/pages/main/home/comparison";
import LandingHero from "@/pages/main/home/LandingHero";
import PartnerTickerSection from "@/pages/main/home/PartnerTickerSection";
import WhySupportSection from "@/pages/main/home/WhySupportSection";
import WorkflowMatrixSection from "@/pages/main/home/WorkflowMatrixSection";

const partners = [
  { name: "FPT", logo: "/images/logos/fpt.png" },
  { name: "TopCV", logo: "/images/logos/topcv-1.png" },
  { name: "Vinedimex", logo: "/images/logos/vinedimex-1.png" },
  { name: "HB", logo: "/images/logos/hb.png" },
  { name: "Mì AI", logo: "/images/logos/mi_ai.png" },
  { name: "2.1 Studio", logo: "/images/logos/2.1.png" },
];

const comparisonRows = [
  { icon: Layers3, label: "Xử lý hàng loạt CV", chatgpt: { status: "negative" as const, text: "Chỉ 1 CV/lần" }, support: { status: "positive" as const, text: "Hàng trăm CV cùng lúc" } },
  { icon: Target, label: "Độ chính xác AI", chatgpt: { status: "neutral" as const, text: "~70% · AI tổng quát" }, support: { status: "positive" as const, text: "95%+ · AI chuyên HR" } },
  { icon: BriefcaseBusiness, label: "Phân tích kinh nghiệm", chatgpt: { status: "negative" as const, text: "Đọc văn bản cơ bản" }, support: { status: "positive" as const, text: "Phân tích sâu theo ngành" } },
  { icon: FileImage, label: "Đọc CV ảnh/scan", chatgpt: { status: "negative" as const, text: "Không hỗ trợ" }, support: { status: "positive" as const, text: "OCR đa định dạng" } },
  { icon: Factory, label: "Nhận diện ngành nghề", chatgpt: { status: "negative" as const, text: "Thủ công" }, support: { status: "positive" as const, text: "Tự động từ JD" } },
  { icon: SlidersHorizontal, label: "Tùy chỉnh trọng số", chatgpt: { status: "negative" as const, text: "Không có" }, support: { status: "positive" as const, text: "Giao diện trực quan" } },
  { icon: BarChart3, label: "Bảng phân tích", chatgpt: { status: "negative" as const, text: "Chỉ trò chuyện văn bản" }, support: { status: "positive" as const, text: "Biểu đồ chi tiết" } },
  { icon: Mic, label: "Câu hỏi phỏng vấn", chatgpt: { status: "neutral" as const, text: "Nhập thủ công" }, support: { status: "positive" as const, text: "Tự động từ CV + JD" } },
  { icon: CircleDollarSign, label: "Phân tích mức lương", chatgpt: { status: "negative" as const, text: "Không có" }, support: { status: "positive" as const, text: "Đối chiếu theo vị trí" } },
  { icon: RotateCcw, label: "Lưu lịch sử", chatgpt: { status: "negative" as const, text: "Giới hạn" }, support: { status: "positive" as const, text: "Vĩnh viễn" } },
  { icon: Users, label: "Làm việc nhóm", chatgpt: { status: "negative" as const, text: "Không có không gian nhóm" }, support: { status: "positive" as const, text: "Nhiều người dùng" } },
  { icon: BadgeDollarSign, label: "Chi phí & hiệu quả", chatgpt: { status: "neutral" as const, text: "$20/tháng · Vẫn thủ công nhiều" }, support: { status: "highlight" as const, text: "Liên hệ · Tiết kiệm 70%" }, emphasis: true },
];

const statusStyles: Record<ComparisonCell["status"], { icon: LucideIcon; badgeClass: string; textClass: string }> = {
  positive: { icon: Check, badgeClass: "border border-[#f5d6bb]/35 bg-[#f5d6bb]/10 text-[#f5d6bb]", textClass: "text-slate-100" },
  negative: { icon: X, badgeClass: "border border-rose-500/40 bg-rose-500/10 text-rose-200", textClass: "text-slate-300" },
  neutral: { icon: Minus, badgeClass: "border border-amber-500/30 bg-amber-500/10 text-amber-200", textClass: "text-slate-200" },
  highlight: { icon: Sparkles, badgeClass: "border border-[#f5d6bb]/40 bg-gradient-to-r from-[#f5d6bb]/25 to-white/8 text-white", textClass: "text-white font-semibold" },
};

const comparisonRowsMobile = comparisonRows.slice(0, 5);

const ComparisonTable = ({ rows }: { rows: typeof comparisonRows }) => (
  <div className="w-full min-w-[880px] overflow-hidden rounded-none border border-white/8 bg-black/90 shadow-[0_28px_65px_rgba(0,0,0,0.28)]">
    <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/6 bg-white/[0.035] px-5 py-3 text-[10px] uppercase tracking-[0.35em] text-slate-600 font-mono">
      <div>Tiêu chí</div>
      <div><p className="text-slate-300 text-xs normal-case font-semibold">ChatGPT</p><p className="text-[10px] text-slate-600 normal-case mt-0.5">AI tổng quát</p></div>
      <div><p className="text-[#f5d6bb] text-xs normal-case font-semibold">Support HR</p><p className="text-[10px] text-slate-600 normal-case mt-0.5">AI chuyên biệt</p></div>
    </div>
    {rows.map((row) => (
      <div key={row.label} className={`grid grid-cols-[1.5fr_1fr_1fr] px-5 py-4 border-b border-white/6 last:border-b-0 hover:bg-white/[0.03] transition-colors ${row.emphasis ? "bg-[#f5d6bb]/[0.03]" : ""}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-none bg-white/5 text-slate-400 flex-shrink-0">
            {React.createElement(row.icon, { className: "h-3.5 w-3.5", "aria-hidden": true })}
          </span>
          <p className="text-sm font-medium text-slate-200">{row.label}</p>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-none ${statusStyles[row.chatgpt.status].badgeClass}`}>
              {React.createElement(statusStyles[row.chatgpt.status].icon, { className: "h-4 w-4", "aria-hidden": true })}
            </span>
            <span className={`leading-tight ${statusStyles[row.chatgpt.status].textClass}`}>{row.chatgpt.text}</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-none ${statusStyles[row.support.status].badgeClass}`}>
              {React.createElement(statusStyles[row.support.status].icon, { className: "h-4 w-4", "aria-hidden": true })}
            </span>
            <span className={`leading-tight ${statusStyles[row.support.status].textClass}`}>{row.support.text}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

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
          className={`sticky top-0 z-50 w-full transition-all duration-300 ${
            isScrolled
              ? "border-b border-white/10 bg-black/95 backdrop-blur-xl"
              : "border-b border-white/[0.08] bg-black/92"
          }`}
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
          primaryLabel={canContinue ? "Tiếp tục quy trình AI" : "Bắt đầu với Support HR"}
        />

        <PartnerTickerSection partners={partners} />

        {/* ── Steps Section ─────────────────────────────────── */}
        <WorkflowMatrixSection onPrimaryAction={handleStart} />

        <WhySupportSection />

        {/* ── Comparison Section ──────────────────────────────── */}
        <section id="compare" className="border-y border-[#f5d6bb]/12 bg-[linear-gradient(180deg,rgba(245,214,187,0.025),rgba(0,0,0,0.96))] py-24">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6">
            <div className="text-center mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-none border border-[#f5d6bb]/22 bg-[#f5d6bb]/[0.06] px-4 py-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <Code2 className="h-3 w-3 text-[#f5d6bb]" aria-hidden="true" />
                <span className="text-[11px] font-bold text-[#f5d6bb] uppercase tracking-widest">So sánh</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Support HR so với ChatGPT
              </h2>
              <p className="mt-4 text-slate-400 max-w-lg mx-auto">
                So sánh chi tiết giữa AI tổng quát và nền tảng tuyển dụng chuyên biệt của Support HR.
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden w-full md:block overflow-x-auto"><ComparisonTable rows={comparisonRows} /></div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {comparisonRowsMobile.map((row) => (
                <div key={row.label} className={`rounded-none border p-4 shadow-[0_16px_36px_rgba(2,8,23,0.14)] ${row.emphasis ? "border-[#f5d6bb]/14 bg-[#f5d6bb]/[0.03]" : "border-white/5 bg-white/3"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-none bg-white/5 text-slate-400">
                      {React.createElement(row.icon, { className: "h-3.5 w-3.5", "aria-hidden": true })}
                    </span>
                    <p className="text-sm font-semibold text-slate-100">{row.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">ChatGPT</p>
                      <div className="flex items-start gap-2">
                        {React.createElement(statusStyles[row.chatgpt.status].icon, {
                          className: `mt-0.5 h-3 w-3 ${row.chatgpt.status === "negative" ? "text-rose-400" : "text-slate-500"}`,
                          "aria-hidden": true,
                        })}
                        <span className="text-xs text-slate-400 leading-tight">{row.chatgpt.text}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#f5d6bb]/70 mb-1">Support HR</p>
                      <div className="flex items-start gap-2">
                        {React.createElement(statusStyles[row.support.status].icon, {
                          className: "mt-0.5 h-3 w-3 text-[#f5d6bb]",
                          "aria-hidden": true,
                        })}
                        <span className={`text-xs leading-tight ${row.support.status === "highlight" ? "text-white font-semibold" : "text-[#f5d6bb]/85"}`}>{row.support.text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => scrollTo("compare")} className="w-full py-3 text-sm text-slate-400 hover:text-white transition-colors text-center">
                Xem thêm 7 tiêu chí khác ↓
              </button>
            </div>
          </div>
        </section>

        <div id="pricing" className="h-0 overflow-hidden" aria-hidden="true" />

        {/* ── Contact Section ────────────────────────────────── */}
        <section id="contact" className="border-t border-slate-800/50 bg-black">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6 py-12">
            <div className="grid md:grid-cols-4 gap-10 rounded-none border border-white/10 bg-white/[0.025] p-8 shadow-[0_22px_55px_rgba(2,8,23,0.18)]">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-9 h-9 rounded-none object-cover" />
                  <div>
                    <p className="text-base font-bold text-white">Support HR</p>
                    <p className="text-[10px] text-[#f5d6bb] uppercase tracking-widest">Nền tảng tuyển dụng AI</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
                  Nền tảng tuyển dụng thông minh hàng đầu Việt Nam. Sử dụng AI để tìm kiếm, sàng lọc và đánh giá ứng viên nhanh chóng, chính xác.
                </p>
                <div className="flex items-center gap-3 text-slate-400">
                  <a href="tel:0899280108" className="text-sm hover:text-[#f5d6bb] transition-colors">
                    <i className="fa-solid fa-phone text-xs mr-1" /> 0899 280 108
                  </a>
                  <span className="text-slate-600">·</span>
                  <a href="mailto:support@supporthr.vn" className="text-sm hover:text-[#f5d6bb] transition-colors">
                    <i className="fa-solid fa-envelope text-xs mr-1" /> support@supporthr.vn
                  </a>
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Sản phẩm</h4>
                <div className="space-y-2.5">
                  {["Trang đầu", "Bảng giá", "Quy trình", "So sánh", "Liên hệ"].map((l) => (
                    <button key={l} onClick={() => scrollTo(l === "Trang đầu" ? "hero" : l === "Bảng giá" ? "pricing" : l === "Quy trình" ? "steps" : l === "So sánh" ? "compare" : "contact")}
                      className="block text-sm text-slate-400 hover:text-white transition-colors text-left">{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Công ty</h4>
                <div className="space-y-2.5">
                  {[
                    { label: "Giới thiệu", href: "#hero" },
                    { label: "Bảo mật", href: "/privacy-policy" },
                    { label: "Điều khoản", href: "/terms" },
                    { label: "Liên hệ", href: "mailto:support@supporthr.vn" },
                  ].map((l) => (
                    <a key={l.label} href={l.href}
                      className="block text-sm text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                © 2026 SupportHR. Mọi quyền được bảo lưu.
              </p>
              <div className="flex items-center gap-4 text-slate-500">
                <a href="https://github.com/phucdevweb" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors">
                  <i className="fa-brands fa-github text-base" />
                </a>
                <a href="#" className="text-xs hover:text-white transition-colors">
                  <i className="fa-brands fa-facebook text-base" />
                </a>
                <a href="#" className="text-xs hover:text-white transition-colors">
                  <i className="fa-brands fa-linkedin text-base" />
                </a>
              </div>
            </div>
          </div>
        </section>
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
