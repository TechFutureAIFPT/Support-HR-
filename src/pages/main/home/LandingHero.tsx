import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  ListChecks,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";

interface LandingHeroProps {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryLabel: string;
}

const metrics = [
  { label: "CV trong phiên", value: "128", detail: "+18 hôm nay" },
  { label: "Đã phân tích", value: "92", detail: "72% hoàn tất" },
  { label: "Shortlist", value: "18", detail: "6 ưu tiên cao" },
];

const menuItems = [
  { label: "JD", Icon: FileText },
  { label: "CV", Icon: UploadCloud },
  { label: "Tiêu chí", Icon: SlidersHorizontal },
  { label: "Kết quả", Icon: Sparkles },
];

const candidates = [
  { name: "Nguyễn Minh Anh", role: "Talent Acquisition Lead", score: 94, status: "Ưu tiên" },
  { name: "Trần Hải Nam", role: "HR Business Partner", score: 88, status: "Phù hợp" },
  { name: "Lê Thu Hà", role: "Recruitment Specialist", score: 81, status: "Cần xem" },
];

const bars = [48, 62, 70, 78, 84, 90];

function DesktopWorkspacePreview() {
  return (
    <div className="pointer-events-none relative z-10 hidden h-[22rem] w-full overflow-hidden lg:block">
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50">
        <div className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-[#f4f4f2] px-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <div className="ml-3 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-500">
            <Search size={14} />
            supporthr://workspace/screening-session
          </div>
        </div>

        <div className="grid h-[31rem] grid-cols-[11.5rem_minmax(0,1fr)] bg-white">
          <aside className="border-r border-slate-200 bg-[#f4f4f2] p-2.5">
            <div className="mb-4 flex items-center gap-1.5">
              <img src="/images/logos/logo.jpg" alt="" className="h-7 w-7 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-950">Support HR</p>
                <p className="truncate text-[10px] text-slate-500">Desktop workspace</p>
              </div>
            </div>
            <div className="space-y-1">
              {menuItems.map(({ label, Icon }, index) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold ${
                    index === 3 ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                  }`}
                >
                  <span className={`grid h-6 w-6 place-items-center rounded-md border ${index === 3 ? "border-slate-300 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-500"}`}>
                    <Icon size={12} />
                  </span>
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="min-w-0 bg-[#fbfbfa]">
            <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4">
              <div>
                <p className="text-[13px] font-semibold text-slate-950">Kết quả sàng lọc</p>
                <p className="text-[11px] text-slate-500">Senior HR Executive · phiên đang mở</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">Báo cáo</span>
                <span className="rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white">Phiên mới</span>
              </div>
            </div>

            <div className="grid gap-3.5 p-4">
              <div className="grid gap-2.5 grid-cols-3">
                {metrics.map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-medium text-slate-500 truncate">{item.label}</p>
                    <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
                      <span className="text-2xl font-semibold text-slate-950 leading-none">{item.value}</span>
                      <span className="text-[10px] font-semibold text-teal-700 leading-none">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3.5 grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-slate-950">Danh sách ưu tiên</p>
                    <ListChecks className="text-slate-400" size={16} />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {candidates.map((candidate) => (
                      <div key={candidate.name} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border border-slate-100 bg-[#fbfbfa] px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-950">{candidate.name}</p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">{candidate.role}</p>
                        </div>
                        <span className="text-[12px] font-semibold text-slate-950">{candidate.score}%</span>
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">{candidate.status}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-slate-950">Hiệu quả phiên</p>
                    <BarChart3 className="text-slate-400" size={16} />
                  </div>
                  <div className="mt-4 flex h-[6.5rem] items-end gap-1.5">
                    {bars.map((height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t bg-slate-900"
                        style={{ height: `${height}%`, opacity: 0.42 + index * 0.08 }}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function MobileWorkspacePreview() {
  return (
    <div className="pointer-events-none relative mt-10 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 lg:hidden">
      <div className="pointer-events-none absolute inset-x-8 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-2 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-500">
          <Search size={12} />
          <span className="truncate">supporthr://screening-session</span>
        </div>
      </div>

      <div className="bg-slate-50/70 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src="/images/logos/logo.jpg" alt="" className="h-8 w-8 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">Kết quả sàng lọc</p>
              <p className="truncate text-[10px] text-slate-500">Senior HR Executive · phiên đang mở</p>
            </div>
          </div>
          <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Đang chạy</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="truncate text-[9px] font-medium text-slate-500">{item.label}</p>
              <p className="mt-1.5 text-xl font-semibold leading-none text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-900">Danh sách ưu tiên</p>
            <ListChecks className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 space-y-2">
            {candidates.slice(0, 2).map((candidate) => (
              <div key={candidate.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-900">{candidate.name}</p>
                  <p className="truncate text-[9px] text-slate-500">{candidate.role}</p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-blue-700">{candidate.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingHero({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
}: LandingHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="hero" className="relative overflow-hidden bg-white font-sans">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-blue-200 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-violet-200 opacity-20 blur-3xl" />

      <div className="relative mx-auto grid max-w-[92rem] items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-12 lg:py-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 max-w-[38rem]"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100/50 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700">
            <Sparkles size={15} />
            Windows-ready recruiting workspace
          </div>

          <h1 className="home-hero-heading max-w-[11ch] font-sans text-5xl font-extrabold leading-[1.02] tracking-tight text-slate-900 md:text-6xl">
            Support HR{" "}
            <span
              className="bg-[linear-gradient(90deg,#2563eb_0%,#4f46e5_52%,#7c3aed_100%)] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]"
            >
              Desktop
            </span>
          </h1>

          <p className="home-hero-copy mt-6 max-w-[42rem] text-lg leading-8 text-slate-600">
            Một không gian làm việc gọn cho đội tuyển dụng: nạp JD, đưa CV vào phiên lọc, theo dõi điểm khớp và ra quyết định trên giao diện giống app laptop.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.button
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={onPrimaryAction}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {primaryLabel}
              <ArrowRight size={17} />
            </motion.button>

            <motion.button
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={onSecondaryAction}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 motion-reduce:transform-none motion-reduce:transition-none"
            >
              Nhận tư vấn triển khai
              <CheckCircle2 size={16} />
            </motion.button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-700" />
              Dữ liệu cục bộ được giữ trong phiên làm việc
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={16} className="text-amber-700" />
              Thiết kế cho màn hình laptop và desktop
            </span>
          </div>

          <MobileWorkspacePreview />
        </motion.div>

        <DesktopWorkspacePreview />
      </div>
    </section>
  );
}
