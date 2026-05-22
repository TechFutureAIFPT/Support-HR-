import React, { useEffect, useRef, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Factory,
  FileImage,
  Layers3,
  MessageSquare,
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
import Footer from "@/pages/main/home/Footer";

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

const comparisonStats = [
  { value: "12", label: "Tiêu chí", caption: "Theo từng bước sàng lọc CV" },
  { value: "100+", label: "CV mỗi lượt", caption: "Phù hợp xử lý tuyển dụng theo lô" },
  { value: "70%", label: "Giảm thao tác", caption: "Tối ưu vòng đánh giá ban đầu" },
];

const ComparisonTable = ({ rows }: { rows: typeof comparisonRows }) => {
  const [activeRow, setActiveRow] = useState(rows[0]?.label ?? "");
  const cellClass = "min-h-[5.35rem] border-r border-white/14 px-5 py-4 last:border-r-0";

  return (
    <div className="relative">
      <span className="pointer-events-none absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-[#f5d6bb]" />
      <span className="pointer-events-none absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-[#f5d6bb]" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-[#f5d6bb]" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-[#f5d6bb]" />
      <div
        role="table"
        aria-label="Bảng so sánh Support HR và ChatGPT"
        className="relative w-full min-w-[880px] overflow-hidden rounded-none border border-white/16 bg-black/92 shadow-[0_30px_90px_rgba(0,0,0,0.34),0_0_0_1px_rgba(255,255,255,0.04),0_0_46px_rgba(245,214,187,0.06)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(245,214,187,0.05),transparent)] opacity-70" />
        <div className="relative grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/12 bg-[#1f1f1f] text-[10px] uppercase tracking-[0.24em] text-slate-400 font-mono">
          <div className="border-r border-white/10 px-7 py-7 text-[12px] tracking-[0.32em]">Tiêu chí</div>
          <div className="flex items-center gap-4 border-r border-white/10 px-7 py-7">
            <MessageSquare className="h-5 w-5 text-emerald-300" aria-hidden="true" />
            <div>
              <p className="text-sm normal-case font-black tracking-[0.08em] text-white">ChatGPT</p>
              <p className="mt-1 text-[10px] normal-case tracking-[0.3em] text-slate-500">AI tổng quát</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-7 py-7">
            <Target className="h-5 w-5 text-[#f5d6bb]" aria-hidden="true" />
            <div>
              <p className="text-sm normal-case font-black tracking-[0.08em] text-[#f5d6bb]">Support HR</p>
              <p className="mt-1 text-[10px] normal-case tracking-[0.3em] text-slate-500">AI tuyển dụng</p>
            </div>
          </div>
        </div>
        {rows.map((row) => {
          const isActive = activeRow === row.label;
          const rowTone = isActive
            ? "border-[#f5d6bb]/65 bg-[linear-gradient(90deg,rgba(245,214,187,0.13),rgba(245,214,187,0.045)_28%,rgba(0,0,0,0.18))] shadow-[inset_0_0_0_1px_rgba(245,214,187,0.35),0_0_34px_rgba(245,214,187,0.10)]"
            : row.emphasis
              ? "border-white/16 bg-[#f5d6bb]/[0.035] hover:border-[#f5d6bb]/36 hover:bg-[#f5d6bb]/[0.065]"
              : "border-white/12 bg-black/25 hover:border-[#f5d6bb]/28 hover:bg-white/[0.035]";

          return (
            <button
              key={row.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveRow(row.label)}
              className={`group/row relative grid w-full grid-cols-[1.5fr_1fr_1fr] border-t text-left outline-none transition-all duration-300 ease-out focus-visible:border-[#f5d6bb]/70 focus-visible:ring-2 focus-visible:ring-[#f5d6bb]/30 active:scale-[0.998] ${rowTone}`}
            >
              <span
                className={`pointer-events-none absolute inset-y-3 left-0 w-[3px] bg-[#f5d6bb] transition-all duration-300 ${
                  isActive ? "opacity-100 shadow-[0_0_24px_rgba(245,214,187,0.7)]" : "opacity-0 group-hover/row:opacity-60"
                }`}
              />
              <div className={`${cellClass} flex items-center gap-3`}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-none border bg-white/[0.035] text-slate-400 transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? "border-[#f5d6bb]/50 text-[#f5d6bb] shadow-[0_0_22px_rgba(245,214,187,0.12)]"
                      : "border-white/8 group-hover/row:border-white/18 group-hover/row:text-slate-200"
                  }`}
                >
                  {React.createElement(row.icon, {
                    className: `h-3.5 w-3.5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover/row:scale-105"}`,
                    "aria-hidden": true,
                  })}
                </span>
                <p className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : "text-slate-200"}`}>{row.label}</p>
              </div>
              <div className={`${cellClass} flex items-center`}>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-none transition-transform duration-300 ${statusStyles[row.chatgpt.status].badgeClass} ${isActive ? "scale-105" : "group-hover/row:scale-[1.03]"}`}>
                    {React.createElement(statusStyles[row.chatgpt.status].icon, { className: "h-4 w-4", "aria-hidden": true })}
                  </span>
                  <span className={`leading-tight ${statusStyles[row.chatgpt.status].textClass}`}>{row.chatgpt.text}</span>
                </div>
              </div>
              <div className={`${cellClass} flex items-center`}>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-none transition-transform duration-300 ${statusStyles[row.support.status].badgeClass} ${isActive ? "scale-105 shadow-[0_0_22px_rgba(245,214,187,0.12)]" : "group-hover/row:scale-[1.03]"}`}>
                    {React.createElement(statusStyles[row.support.status].icon, { className: "h-4 w-4", "aria-hidden": true })}
                  </span>
                  <span className={`leading-tight ${statusStyles[row.support.status].textClass}`}>{row.support.text}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

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
        <section id="compare" className="border-y border-[#f5d6bb]/12 bg-black py-20">
          <div className="w-full max-w-none px-3 sm:px-7 lg:px-10">
            <div className="mx-auto mb-16 max-w-[90rem] px-3 text-center">
              <p className="supporthr-mono text-[12px] font-black uppercase tracking-[0.28em] text-[#f5d6bb]">
                // So sánh chi tiết
              </p>
              <h2 className="supporthr-display mt-6 text-5xl font-black uppercase leading-[0.9] tracking-normal text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block">Support HR</span>
                <span className="block text-[#f5d6bb]">so với ChatGPT</span>
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                So sánh chi tiết giữa AI tổng quát và nền tảng tuyển dụng chuyên biệt của Support HR.
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden w-full md:block overflow-x-auto px-0"><ComparisonTable rows={comparisonRows} /></div>

            <div className="mx-auto mt-14 hidden max-w-[90rem] grid-cols-3 gap-6 md:grid">
              {comparisonStats.map((stat) => (
                <div key={stat.label} className="relative border border-white/14 bg-[#141414] px-8 py-8 text-center">
                  <span className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-[#f5d6bb]" />
                  <span className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-[#f5d6bb]" />
                  <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-[#f5d6bb]" />
                  <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-[#f5d6bb]" />
                  <p className="supporthr-display text-4xl font-black leading-none text-[#f5d6bb] xl:text-5xl">{stat.value}</p>
                  <p className="mt-4 text-base font-black text-white">{stat.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{stat.caption}</p>
                </div>
              ))}
            </div>

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
