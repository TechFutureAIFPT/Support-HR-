import React, { useEffect, useMemo, useState, useRef } from "react";
import type { AppStep } from '@/shared/types';
import { analysisCacheService } from '@/lib/services/history-cache/analysisCache';
import { cvFilterHistoryService } from '@/lib/services/history-cache/analysisHistory';
import type { ComparisonCell } from "@/pages/main/home/comparison";

const flowOrder: AppStep[] = ["jd", "weights", "upload", "analysis"];

const partners = [
  { name: "FPT", logo: "/images/logos/fpt.png" },
  { name: "TopCV", logo: "/images/logos/topcv-1.png" },
  { name: "Vinedimex", logo: "/images/logos/vinedimex-1.png" },
  { name: "HB", logo: "/images/logos/hb.png" },
  { name: "Mì AI", logo: "/images/logos/mi_ai.png" },
  { name: "2.1 Studio", logo: "/images/logos/2.1.png" },
];

const techStack = [
  { name: "Tailwind CSS", icon: "fa-brands fa-css3-alt", color: "text-[#38bdf8]" },
  { name: "Python", icon: "fa-brands fa-python", color: "text-[#ffd343]" },
  { name: "Gemini AI", icon: "fa-solid fa-brain", color: "text-[#8e75ff]" },
  { name: "Firebase", icon: "fa-solid fa-fire", color: "text-[#ff9100]" },
  { name: "React", icon: "fa-brands fa-react", color: "text-[#00d8ff]" },
  { name: "TypeScript", icon: "fa-brands fa-js", color: "text-[#3178c6]" },
];

const comparisonRows = [
  { icon: "fa-solid fa-layer-group", label: "Xử lý hàng loạt CV", chatgpt: { status: "negative" as const, text: "Chỉ 1 CV/lần" }, support: { status: "positive" as const, text: "Hàng trăm CV cùng lúc" } },
  { icon: "fa-solid fa-bullseye", label: "Độ chính xác AI", chatgpt: { status: "neutral" as const, text: "~70% · AI tổng quát" }, support: { status: "positive" as const, text: "95%+ · AI chuyên HR" } },
  { icon: "fa-solid fa-briefcase", label: "Phân tích kinh nghiệm", chatgpt: { status: "negative" as const, text: "Đọc text cơ bản" }, support: { status: "positive" as const, text: "Deep learning ngành" } },
  { icon: "fa-solid fa-image", label: "Đọc CV ảnh/scan", chatgpt: { status: "negative" as const, text: "Không hỗ trợ" }, support: { status: "positive" as const, text: "OCR đa định dạng" } },
  { icon: "fa-solid fa-industry", label: "Nhận diện ngành nghề", chatgpt: { status: "negative" as const, text: "Thủ công" }, support: { status: "positive" as const, text: "Tự động từ JD" } },
  { icon: "fa-solid fa-sliders", label: "Tùy chỉnh trọng số", chatgpt: { status: "negative" as const, text: "Không có" }, support: { status: "positive" as const, text: "UI trực quan" } },
  { icon: "fa-solid fa-chart-line", label: "Dashboard phân tích", chatgpt: { status: "negative" as const, text: "Chỉ chat text" }, support: { status: "positive" as const, text: "Biểu đồ chi tiết" } },
  { icon: "fa-solid fa-microphone-lines", label: "Câu hỏi phỏng vấn", chatgpt: { status: "neutral" as const, text: "Prompt thủ công" }, support: { status: "positive" as const, text: "Tự động CV+JD" } },
  { icon: "fa-solid fa-dollar-sign", label: "Phân tích mức lương", chatgpt: { status: "negative" as const, text: "Không có" }, support: { status: "positive" as const, text: "Benchmark vị trí" } },
  { icon: "fa-solid fa-rotate", label: "Lưu lịch sử", chatgpt: { status: "negative" as const, text: "Giới hạn" }, support: { status: "positive" as const, text: "Vĩnh viễn" } },
  { icon: "fa-solid fa-users", label: "Làm việc nhóm", chatgpt: { status: "negative" as const, text: "Không workspace" }, support: { status: "positive" as const, text: "Multi-user" } },
  { icon: "fa-solid fa-money-bill-trend-up", label: "Chi phí & hiệu quả", chatgpt: { status: "neutral" as const, text: "$20/tháng · Vẫn thủ công nhiều" }, support: { status: "highlight" as const, text: "Liên hệ · Tiết kiệm 70%" }, emphasis: true },
];

const statusStyles: Record<ComparisonCell["status"], { icon: string; badgeClass: string; textClass: string }> = {
  positive: { icon: "fa-solid fa-check", badgeClass: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200", textClass: "text-slate-100" },
  negative: { icon: "fa-solid fa-xmark", badgeClass: "border border-rose-500/40 bg-rose-500/10 text-rose-200", textClass: "text-slate-300" },
  neutral: { icon: "fa-solid fa-minus", badgeClass: "border border-amber-500/30 bg-amber-500/10 text-amber-200", textClass: "text-slate-200" },
  highlight: { icon: "fa-solid fa-star", badgeClass: "border border-cyan-500/40 bg-gradient-to-r from-cyan-500/30 to-emerald-500/20 text-white", textClass: "text-white font-semibold" },
};

const navLinks = [
  { label: "Tính năng", href: "#features" },
  { label: "Quy trình", href: "#steps" },
  { label: "So sánh", href: "#compare" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Liên hệ", href: "#contact" },
];

const features = [
  {
    icon: "fa-solid fa-brain-circuit",
    title: "AI Phân Tích Sâu",
    desc: "Gemini AI phân tích CV theo ngữ cảnh ngành nghề, kinh nghiệm và kỹ năng mềm.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: "fa-solid fa-layer-group",
    title: "Xử Lý Hàng Loạt",
    desc: "Upload đồng thời 20 CV. AI phân tích toàn bộ chỉ trong 2 phút.",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: "fa-solid fa-sliders",
    title: "Tùy Chỉnh Linh Hoạt",
    desc: "Cấu hình trọng số và bộ lọc cứng theo nhu cầu tuyển dụng riêng của bạn.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: "fa-solid fa-chart-pie",
    title: "Dashboard Trực Quan",
    desc: "Biểu đồ, bảng điểm và xếp hạng ứng viên trực tiếp trên giao diện.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: "fa-solid fa-wand-magic-sparkles",
    title: "Câu Hỏi Phỏng Vấn",
    desc: "Tự động sinh câu hỏi chuyên sâu phù hợp từng ứng viên và vị trí tuyển dụng.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Bảo Mật & Riêng Tư",
    desc: "Dữ liệu được mã hóa, lưu trữ an toàn. Chỉ bạn mới có quyền truy cập.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
];

const steps = [
  {
    num: "01",
    icon: "fa-solid fa-file-pen",
    title: "Nhập Job Description",
    desc: "Dán JD hoặc tải file PDF/DOCX. AI tự trích xuất thông tin.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    num: "02",
    icon: "fa-solid fa-sliders",
    title: "Cấu Hình Tiêu Chí",
    desc: "Đặt trọng số và bộ lọc cứng phù hợp với yêu cầu tuyển dụng.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    num: "03",
    icon: "fa-solid fa-cloud-arrow-up",
    title: "Upload Hồ Sơ",
    desc: "Kéo thả hàng loạt CV (PDF, DOCX, ảnh). Hỗ trợ Google Drive.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    num: "04",
    icon: "fa-solid fa-chart-line",
    title: "Xem Kết Quả",
    desc: "Nhận bảng điểm chi tiết, xếp hạng và gợi ý phỏng vấn ngay.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

const comparisonRowsMobile = comparisonRows.slice(0, 5);
const processingMessages = [
  "Đang quét CV theo JD và tiêu chí cứng...",
  "Đang so khớp kỹ năng, kinh nghiệm và mức độ phù hợp...",
  "Đang xếp hạng ứng viên theo trọng số tuyển dụng...",
  "Đang chuẩn bị shortlist cho nhà tuyển dụng...",
];
const heroBackdropCards = [
  { title: "CV-01 // FRONTEND", lines: ["[CV] Nguyễn Văn A / Senior Frontend", "[SKILL] React / TypeScript / Next.js", "[MATCH] JD phù hợp 96%"] },
  { title: "CV-02 // DATA", lines: ["[CV] Trần Thị B / Data Analyst", "[SKILL] SQL / Python / Power BI", "[MATCH] Kinh nghiệm phù hợp 91%"] },
  { title: "CV-03 // DESIGN", lines: ["[CV] Lê Hoàng C / Product Designer", "[SKILL] Figma / UX Research / Design System", "[MATCH] Hồ sơ rõ năng lực"] },
  { title: "CV-04 // MARKETING", lines: ["[CV] Phạm Minh D / Performance Lead", "[SKILL] Meta Ads / GA4 / CRM", "[MATCH] Đạt tiêu chí tăng trưởng"] },
  { title: "CV-05 // OCR", lines: ["[READ] CV_scan_204.png", "[TEXT] Kỹ năng và kinh nghiệm đã trích xuất", "[CHECK] Chuẩn hóa định dạng hoàn tất"] },
  { title: "CV-06 // PIPELINE", lines: ["[QUEUE] 20 CV trong phiên hiện tại", "[FLOW] Parse -> Match -> Rank", "[ETA] Còn khoảng 02:14"] },
  { title: "CV-07 // BENCHMARK", lines: ["[COMPARE] So sánh level với JD", "[CHECK] Đối chiếu số năm kinh nghiệm", "[FLAG] Cần phỏng vấn sâu về leadership"] },
  { title: "CV-08 // SHORTLIST", lines: ["[BUILD] Danh sách ứng viên nổi bật", "[SEND] Gửi tóm tắt cho hiring manager", "[DONE] Sẵn sàng vòng phỏng vấn"] },
];
const heroScanCandidates = [
  { name: "Nguyễn Văn A", role: "Senior Frontend Developer", match: "96%", summary: "React, TypeScript, leadership, mentoring" },
  { name: "Trần Thị B", role: "Data Analyst", match: "91%", summary: "SQL, Python, Power BI, product analytics" },
  { name: "Lê Hoàng C", role: "Product Designer", match: "88%", summary: "Design system, UX research, collaboration" },
  { name: "Phạm Minh D", role: "Performance Lead", match: "84%", summary: "Meta Ads, GA4, funnel optimization" },
];

const ComparisonTable = ({ rows }: { rows: typeof comparisonRows }) => (
  <div className="min-w-[680px] overflow-hidden rounded-[14px] border border-white/8 bg-[#09111d]/88 shadow-[0_28px_65px_rgba(2,8,23,0.24)]">
    <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/6 bg-white/[0.035] px-5 py-3 text-[10px] uppercase tracking-[0.35em] text-slate-600 font-mono">
      <div>Tiêu chí</div>
      <div><p className="text-slate-300 text-xs normal-case font-semibold">ChatGPT</p><p className="text-[10px] text-slate-600 normal-case mt-0.5">AI tổng quát</p></div>
      <div><p className="text-emerald-400 text-xs normal-case font-semibold">Support HR</p><p className="text-[10px] text-slate-600 normal-case mt-0.5">AI chuyên biệt</p></div>
    </div>
    {rows.map((row) => (
      <div key={row.label} className={`grid grid-cols-[1.5fr_1fr_1fr] px-5 py-4 border-b border-white/6 last:border-b-0 hover:bg-white/[0.03] transition-colors ${row.emphasis ? "bg-emerald-500/3" : ""}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-slate-400 flex-shrink-0"><i className={row.icon} /></span>
          <p className="text-sm font-medium text-slate-200">{row.label}</p>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${statusStyles[row.chatgpt.status].badgeClass}`}><i className={`${statusStyles[row.chatgpt.status].icon} text-base`} /></span>
            <span className={`leading-tight ${statusStyles[row.chatgpt.status].textClass}`}>{row.chatgpt.text}</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${statusStyles[row.support.status].badgeClass}`}><i className={`${statusStyles[row.support.status].icon} text-base`} /></span>
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
  const [processingIndex, setProcessingIndex] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0, oldestEntry: 0, newestEntry: 0 });
  const [historyStats, setHistoryStats] = useState({ totalSessions: 0, lastSession: null as string | null, thisWeekCount: 0, thisMonthCount: 0 });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const certificates = useMemo(() => ["/images/achive/Khuyến Khích Tin Học Trẻ.jpg", "/images/achive/sáng tạo thanh thiếu niên.jpg"], []);
  const [certIndex, setCertIndex] = useState(0);

  const refreshHistoryData = () => {
    setCacheStats(analysisCacheService.getCacheStats());
    setHistoryStats(cvFilterHistoryService.getHistoryStats());
    setRecentHistory(cvFilterHistoryService.getRecentHistory());
  };

  useEffect(() => {
    if (certificates.length > 1) {
      const interval = setInterval(() => setCertIndex((prev) => (prev + 1) % certificates.length), 5000);
      return () => clearInterval(interval);
    }
  }, [certificates]);

  useEffect(() => { refreshHistoryData(); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProcessingIndex((prev) => (prev + 1) % processingMessages.length);
    }, 1800);
    return () => window.clearInterval(interval);
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
  const nextStep = useMemo(() => flowOrder.find((step) => !completedSteps.includes(step)) || "analysis", [completedSteps]);
  const canContinue = completedSteps.length > 0;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setActiveMegaMenu(null);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearCache = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ cache?")) {
      analysisCacheService.clearCache();
      refreshHistoryData();
    }
  };

  const mobileNavItems = [
    { label: "Tính năng", icon: "fa-circle-info", target: "features" },
    { label: "Quy trình", icon: "fa-list-ol", target: "steps" },
    { label: "So sánh", icon: "fa-scale-balanced", target: "compare" },
    { label: "Bảng giá", icon: "fa-tags", target: "pricing" },
    { label: "Bảo mật", icon: "fa-user-shield", href: "/privacy-policy" },
    { label: "Điều khoản", icon: "fa-file-contract", href: "/terms" },
  ];

  return (
    <div className="home-page-shell min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#10203c_0%,#0a1220_32%,#060b14_100%)] text-slate-100">

      {/* ── Ambient Background Orbs ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-60 -left-60 h-[700px] w-[700px] rounded-full bg-cyan-500/[0.06] blur-[150px]" />
        <div className="absolute right-[-120px] top-[12%] h-[520px] w-[520px] rounded-full bg-violet-500/[0.07] blur-[145px]" />
        <div className="absolute bottom-[-120px] left-1/4 h-[620px] w-[620px] rounded-full bg-blue-500/[0.05] blur-[160px]" />
        <div className="absolute inset-x-[18%] top-0 h-[340px] bg-gradient-to-b from-cyan-400/[0.08] via-transparent to-transparent blur-[110px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.018]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute inset-0 opacity-[0.055]" style={{
          backgroundImage: 'linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.08) 48%, transparent 100%)',
          backgroundSize: '100% 180px',
        }} />
      </div>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0B1120] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-out lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-8 h-8 rounded-none object-cover" />
            <div><p className="text-sm font-bold text-white">SupportHR</p><p className="text-[10px] text-slate-500">AI Recruitment Platform</p></div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-none bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {mobileNavItems.map((item) => (
            <button key={item.label} onClick={() => item.href ? window.open(item.href, "_blank") : scrollTo(item.target!)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-none text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-left">
              <div className="w-7 h-7 rounded-none bg-slate-800 flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${item.icon} text-[11px] text-slate-400`} />
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800 space-y-2">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-none bg-slate-800/60 mb-1">
                <img src={userAvatar || "/images/logos/logo.jpg"} alt="avatar" className="w-7 h-7 rounded-none object-cover" />
                <div className="min-w-0"><p className="text-[12px] font-semibold text-white truncate">{userName || userEmail?.split("@")[0]}</p><p className="text-[10px] text-slate-500 truncate">{userEmail}</p></div>
              </div>
              <button onClick={() => { setMobileMenuOpen(false); setActiveStep("jd"); }}
                className="w-full h-10 rounded-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                <i className="fa-solid fa-bolt text-xs" /> Bắt đầu ngay
              </button>
            </>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); onLoginRequest(); }}
              className="w-full h-10 rounded-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
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
          className={`sticky top-0 w-full z-50 transition-all duration-500 ${
            isScrolled
              ? "bg-[#081427]/94 backdrop-blur-2xl border-b border-cyan-400/15 shadow-[0_20px_45px_rgba(2,8,23,0.34)]"
              : "bg-transparent"
          }`}
        >
          <div
            className={`absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 ${
              isScrolled
                ? "opacity-100 bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent"
                : "opacity-0"
            }`}
          />
          <div className="max-w-[96rem] mx-auto px-3 sm:px-5 lg:px-6">
            <div className={`flex items-center justify-between h-16 transition-all duration-500 ${
              isScrolled
                ? "bg-[#10233d]/98 border-y border-cyan-950/70 shadow-[0_20px_48px_rgba(2,8,23,0.34)]"
                : "bg-[#0f2037]/92 border-y border-cyan-950/60"
            }`}>
              <div className="flex items-center gap-3 cursor-pointer py-2 transition-all duration-300 hover:opacity-90" onClick={() => scrollTo("hero")}>
                <div className="w-10 h-10 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <img src="/images/logos/logo.jpg" alt="Support HR" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight leading-none text-white">Support HR</span>
                  <span className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">AI Recruitment</span>
                </div>
              </div>

              <div className="hidden lg:block h-full w-px bg-slate-800/90" />

              <div className="hidden lg:flex flex-1 items-center justify-center gap-1">
                {[
                  { label: "PLATFORM", href: "#features" },
                  { label: "PRICING", href: "#pricing" },
                  { label: "DOCS", href: "#steps" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="hidden lg:block h-full w-px bg-slate-800/90" />

              <div className="flex items-center gap-3">
                {!isLoggedIn && (
                  <button
                    onClick={onLoginRequest}
                    className="hidden sm:flex h-10 px-5 border border-slate-700 bg-transparent font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200 hover:border-slate-500 hover:text-white transition-all items-center gap-2"
                  >
                    <i className="fa-solid fa-right-to-bracket text-xs" /> LOGIN
                  </button>
                )}
                <button
                  onClick={handleStart}
                  className="h-10 px-6 bg-white text-[#081427] font-mono font-bold text-[11px] uppercase tracking-[0.2em] transition-all items-center gap-2 shadow-[0_16px_36px_rgba(255,255,255,0.14)] flex"
                >
                  <i className="fa-solid fa-bolt text-xs" /> GET ACCESS
                </button>
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden w-10 h-10 bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-bars text-sm" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <section id="hero" className="relative pt-2 pb-20">
          <div className="home-hero-stage relative min-h-[820px] overflow-hidden bg-[#050b12] shadow-[0_36px_120px_rgba(2,8,23,0.52)]">
            <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
              <div className="relative border-r border-slate-900/90">
                <div className="home-hero-grid absolute inset-0 grid grid-cols-2 grid-rows-4">
                  {heroBackdropCards.slice(0, 8).map((card) => (
                    <div key={card.title} className="home-hero-grid-card border-b border-r border-slate-900/80 p-5 font-mono text-[11px] text-cyan-950/70">
                      <div className="mb-4 flex items-center justify-between uppercase text-slate-700/70">
                        <span>{card.title}</span>
                        <span className="h-2 w-2 bg-cyan-400/40" />
                      </div>
                      <div className="space-y-1.5">
                        {card.lines.map((line) => (
                          <p key={line} className="truncate">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#050b12]/96 via-[#050b12]/88 to-[#071827]/72" />
              </div>

              <div className="relative hidden border-l border-slate-900/90 lg:block">
                <div className="absolute inset-0 grid grid-rows-4">
                  {heroScanCandidates.map((candidate) => (
                    <div key={candidate.name} className="relative border-b border-slate-900/90 bg-[#071423]/78 px-6 py-5 font-mono">
                      <div className="absolute right-5 top-5 h-2 w-2 bg-emerald-400/75" />
                      <div className="text-[10px] uppercase text-cyan-300/65">Candidate Scan</div>
                      <div className="mt-4 flex items-start justify-between gap-8">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-white">{candidate.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{candidate.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-slate-600">Match</p>
                          <p className="mt-2 text-2xl font-black text-cyan-300">{candidate.match}</p>
                        </div>
                      </div>
                      <div className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-[10px] uppercase text-slate-600">
                        <div className="grid grid-cols-[5rem_1fr] gap-4">
                          <span>Skills</span>
                          <span className="truncate text-slate-400">{candidate.summary}</span>
                        </div>
                        <div className="grid grid-cols-[5rem_1fr] gap-4">
                          <span>Status</span>
                          <span className="truncate text-emerald-300/80">Đang so khớp với JD và tiêu chí</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="home-cv-cloud pointer-events-none absolute inset-0" />
              </div>
            </div>

            <div className="home-hero-vignette absolute inset-0" />
            <div className="home-hero-scan absolute inset-y-0 left-[7%] w-[24%]" />

            <div className="relative z-10 max-w-[96rem] mx-auto px-8 sm:px-10 lg:px-12 xl:px-16 pt-12 sm:pt-16 lg:pt-20">
              <div className="max-w-[52rem]">
                <div className="inline-flex items-center gap-3 bg-[#071827] px-5 py-3 font-mono">
                  <div className="h-2 w-2 bg-cyan-400" />
                  <span className="text-[11px] font-bold uppercase text-cyan-400">Support HR AI</span>
                </div>

                <h1 className="home-hero-heading mt-8 max-w-[50rem] text-[5.25rem] font-black leading-[0.92] text-white sm:text-[6.2rem] lg:text-[6.85rem]">
                  <span>Sàng Lọc CV</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                    Nhanh Gấp 10 Lần.
                  </span>
                </h1>

                <p className="mt-9 max-w-[45rem] text-[1.28rem] leading-[1.65] text-slate-400">
                  Nền tảng AI chuyên biệt cho tuyển dụng. Phân tích hàng trăm CV chỉ trong{" "}
                  <span className="font-semibold text-cyan-300">2 phút</span>, xếp hạng và gợi ý phỏng vấn tự động.
                </p>

                <button
                  onClick={handleStart}
                  className="mt-10 h-14 bg-white px-10 font-mono text-[13px] font-bold uppercase text-[#050b12] transition-all hover:bg-cyan-100"
                >
                  GET STARTED <i className="fa-solid fa-arrow-up-right-from-square ml-2 text-xs" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800/50 bg-[#0B1120]/50 py-8">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6">
            <p className="text-center text-[11px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-8">
              Được tin dùng bởi doanh nghiệp & tổ chức
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-10 bg-white/[0.02] px-8 py-6">
              {partners.map((p) => (
                <div key={p.name} className="h-10 flex items-center opacity-55 hover:opacity-80 transition-opacity">
                  <img src={p.logo} alt={p.name} className="h-full w-auto object-contain brightness-150" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Section ───────────────────────────────── */}
        <section id="features" className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6 py-24">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-4 py-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <i className="fa-solid fa-sparkles text-indigo-400 text-[10px]" />
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Tính năng nổi bật</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Mọi thứ bạn cần để<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">tuyển dụng thông minh hơn</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Từ phân tích CV đến gợi ý phỏng vấn — Support HR cung cấp giải pháp toàn diện cho quy trình tuyển dụng hiện đại.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className={`group relative overflow-hidden rounded-[14px] border ${feature.border} ${feature.bg} p-6 hover:${feature.border} hover:${feature.bg.replace('/10', '/15')} transition-all duration-300 hover:-translate-y-1 cursor-default shadow-[0_18px_45px_rgba(2,8,23,0.18)]`}>
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {/* Icon */}
                <div className={`w-12 h-12 rounded-[12px] ${feature.bg} border ${feature.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]`}>
                  <i className={`fa-solid ${feature.icon} text-xl ${feature.iconColor}`} />
                </div>
                {/* Text */}
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                {/* Arrow */}
                <div className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${feature.iconColor}`}>
                  <i className="fa-solid fa-arrow-right text-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Steps Section ─────────────────────────────────── */}
        <section id="steps" className="bg-[#0B1120]/60 border-y border-slate-800/50 py-24">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6">
            <div className="text-center mb-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <i className="fa-solid fa-route text-cyan-400 text-[10px]" />
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Quy trình</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Chỉ 4 bước đơn giản
              </h2>
              <p className="mt-4 text-slate-400 max-w-lg mx-auto">
                Từ nhập JD đến kết quả phân tích — toàn bộ quy trình tự động hóa, nhanh chóng và chính xác.
              </p>
            </div>

            <div className="relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

              <div className="grid md:grid-cols-4 gap-8">
                {steps.map((step, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center group rounded-[14px] border border-white/10 bg-white/[0.025] px-5 py-6 shadow-[0_18px_45px_rgba(2,8,23,0.16)]">
                    {/* Step Number */}
                    <div className={`w-14 h-14 rounded-[12px] ${step.bg} border ${step.border} flex items-center justify-center mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20`}>
                      <i className={`fa-solid ${step.icon} text-xl ${step.color}`} />
                      <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-[10px] bg-[#0B1120] border border-slate-700 text-[10px] font-black text-slate-400 flex items-center justify-center shadow-[0_8px_20px_rgba(2,8,23,0.24)]">{step.num}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA after steps */}
            <div className="text-center mt-16">
              <button onClick={handleStart}
                className="h-12 px-10 rounded-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto">
                <i className="fa-solid fa-rocket text-sm" /> Thử ngay — Miễn phí 7 ngày
              </button>
            </div>
          </div>
        </section>

        {/* ── Why Us Section ────────────────────────────────── */}
        <section className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <i className="fa-solid fa-bolt text-emerald-400 text-[10px]" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Tại sao chọn Support HR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-6">
                Thay thế quy trình thủ công bằng
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400"> AI thông minh</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Thay vì đọc từng CV trong hàng giờ, Support HR giúp bạn tìm được ứng viên phù hợp nhất chỉ trong vài phút với độ chính xác vượt trội.
              </p>

              {/* Comparison mini cards */}
              <div className="space-y-3">
                <div className="flex items-start gap-4 rounded-[12px] border border-rose-500/20 bg-rose-500/[0.06] p-4 shadow-[0_18px_40px_rgba(2,8,23,0.14)]">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-xmark text-sm text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Quy trình thủ công</p>
                    <p className="text-xs text-slate-500 mt-0.5">30-45 phút/CV · Dễ bỏ sót ứng viên tiềm năng</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-[12px] border border-emerald-500/20 bg-emerald-500/[0.06] p-4 shadow-[0_18px_40px_rgba(2,8,23,0.14)]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-check text-sm text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Support HR AI</p>
                    <p className="text-xs text-slate-400 mt-0.5">100 CV trong 2 phút · Highlight kỹ năng tự động · Điểm số trực quan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "85%", label: "Thời gian tiết kiệm", icon: "fa-clock", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                { value: "3X", label: "Tốc độ tuyển dụng", icon: "fa-bolt", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                { value: "99%", label: "Độ hài lòng", icon: "fa-heart", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                { value: "0đ", label: "Chi phí dùng thử", icon: "fa-tag", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-[14px] border ${stat.border} ${stat.bg} p-6 hover:${stat.border} transition-all hover:-translate-y-0.5 shadow-[0_20px_45px_rgba(2,8,23,0.18)]`}>
                  <i className={`fa-solid ${stat.icon} ${stat.color} text-lg mb-3`} />
                  <p className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison Section ──────────────────────────────── */}
        <section id="compare" className="bg-[#0B1120]/60 border-y border-slate-800/50 py-24">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6">
            <div className="text-center mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-4 py-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <i className="fa-solid fa-code-compare text-violet-400 text-[10px]" />
                <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">So sánh</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Support HR vs ChatGPT
              </h2>
              <p className="mt-4 text-slate-400 max-w-lg mx-auto">
                So sánh chi tiết giữa AI tổng quát và nền tảng tuyển dụng chuyên biệt của Support HR.
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-[14px] border border-white/10 bg-white/[0.025] p-3 shadow-[0_24px_60px_rgba(2,8,23,0.2)]"><ComparisonTable rows={comparisonRows} /></div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {comparisonRowsMobile.map((row) => (
                <div key={row.label} className={`rounded-[12px] border p-4 shadow-[0_16px_36px_rgba(2,8,23,0.14)] ${row.emphasis ? "border-emerald-500/10 bg-emerald-500/3" : "border-white/5 bg-white/3"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-slate-400"><i className={`${row.icon} text-sm`} /></span>
                    <p className="text-sm font-semibold text-slate-100">{row.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">ChatGPT</p>
                      <div className="flex items-start gap-2">
                        <i className={`${statusStyles[row.chatgpt.status].icon} mt-0.5 text-xs ${row.chatgpt.status === "negative" ? "text-rose-400" : "text-slate-500"}`} />
                        <span className="text-xs text-slate-400 leading-tight">{row.chatgpt.text}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-emerald-500/70 mb-1">Support HR</p>
                      <div className="flex items-start gap-2">
                        <i className={`${statusStyles[row.support.status].icon} mt-0.5 text-xs text-emerald-400`} />
                        <span className={`text-xs leading-tight ${row.support.status === "highlight" ? "text-white font-semibold" : "text-emerald-300/80"}`}>{row.support.text}</span>
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

        {/* ── Pricing / CTA Section ───────────────────────────── */}
        <section id="pricing" className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6 py-24">
          <div className="relative overflow-hidden rounded-[16px] border border-cyan-400/20 bg-gradient-to-br from-cyan-950/65 via-[#0B1120] to-indigo-950/45 shadow-[0_30px_90px_rgba(2,8,23,0.34)] ring-1 ring-white/5">
            {/* Glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-none bg-cyan-600/10 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-none bg-indigo-600/10 blur-[120px]" />

            <div className="relative z-10 text-center py-16 px-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <i className="fa-solid fa-rocket text-cyan-400 text-[10px]" />
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Bắt đầu ngay hôm nay</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Sẵn sàng tuyển dụng thông minh hơn?
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-10">
                Tham gia cùng hàng nghìn chuyên gia HR đã tin tưởng Support HR để tìm kiếm nhân tài.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={handleStart}
                  className="h-12 px-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-[0_20px_44px_rgba(34,211,238,0.3)] hover:shadow-[0_24px_48px_rgba(34,211,238,0.34)] transition-all hover:-translate-y-0.5 flex items-center gap-2.5 ring-1 ring-cyan-300/20">
                  <i className="fa-solid fa-rocket text-sm" /> Dùng thử miễn phí
                </button>
                <button onClick={onLoginRequest}
                  className="h-12 px-8 rounded-full bg-white/[0.045] border border-white/10 text-white font-bold text-base hover:bg-white/[0.08] transition-all flex items-center gap-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <i className="fa-solid fa-calendar text-sm" /> Đặt lịch demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact Section ────────────────────────────────── */}
        <section id="contact" className="border-t border-slate-800/50 bg-[#0B1120]/55">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-5 lg:px-6 py-12">
            <div className="grid md:grid-cols-4 gap-10 rounded-[16px] border border-white/10 bg-white/[0.025] p-8 shadow-[0_22px_55px_rgba(2,8,23,0.18)]">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <p className="text-base font-bold text-white">Support HR</p>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest">AI Recruitment Platform</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
                  Nền tảng tuyển dụng thông minh hàng đầu Việt Nam. Sử dụng AI để tìm kiếm, sàng lọc và đánh giá ứng viên nhanh chóng, chính xác.
                </p>
                <div className="flex items-center gap-3 text-slate-400">
                  <a href="tel:0899280108" className="text-sm hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-phone text-xs mr-1" /> 0899 280 108
                  </a>
                  <span className="text-slate-600">·</span>
                  <a href="mailto:support@supporthr.vn" className="text-sm hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-envelope text-xs mr-1" /> support@supporthr.vn
                  </a>
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Sản phẩm</h4>
                <div className="space-y-2.5">
                  {["Tính năng", "Bảng giá", "Quy trình", "So sánh", "API Docs"].map((l) => (
                    <button key={l} onClick={() => scrollTo(l === "Tính năng" ? "features" : l === "Quy trình" ? "steps" : l === "So sánh" ? "compare" : "#")}
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
                <i className="fa-solid fa-circle-play text-blue-400" />
                <span className="text-white font-semibold text-sm">Video Demo – Support HR</span>
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
