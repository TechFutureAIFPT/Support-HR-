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
    <div className="pointer-events-none absolute inset-x-4 bottom-[-8.5rem] hidden lg:block xl:bottom-[-7rem]">
      <div className="mx-auto max-w-[78rem] overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.22)]">
        <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-[#f4f4f2] px-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <div className="ml-3 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-500">
            <Search size={14} />
            supporthr://workspace/screening-session
          </div>
        </div>

        <div className="grid h-[31rem] grid-cols-[15rem_minmax(0,1fr)] bg-white">
          <aside className="border-r border-slate-200 bg-[#f4f4f2] p-3">
            <div className="mb-4 flex items-center gap-2">
              <img src="/images/logos/logo.jpg" alt="" className="h-8 w-8 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Support HR</p>
                <p className="text-[11px] text-slate-500">Desktop workspace</p>
              </div>
            </div>
            <div className="space-y-1">
              {menuItems.map(({ label, Icon }, index) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold ${
                    index === 3 ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                  }`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-md border ${index === 3 ? "border-slate-300 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-500"}`}>
                    <Icon size={14} />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </aside>

          <main className="min-w-0 bg-[#fbfbfa]">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
              <div>
                <p className="text-sm font-semibold text-slate-950">Kết quả sàng lọc</p>
                <p className="text-[12px] text-slate-500">Senior HR Executive · phiên đang mở</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600">Báo cáo</span>
                <span className="rounded-lg bg-slate-950 px-3 py-1.5 text-[12px] font-semibold text-white">Phiên mới</span>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid gap-3 md:grid-cols-3">
                {metrics.map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-3xl font-semibold text-slate-950">{item.value}</span>
                      <span className="text-[11px] font-semibold text-teal-700">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">Danh sách ưu tiên</p>
                    <ListChecks className="text-slate-400" size={18} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {candidates.map((candidate) => (
                      <div key={candidate.name} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border border-slate-100 bg-[#fbfbfa] px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-950">{candidate.name}</p>
                          <p className="mt-0.5 truncate text-[12px] text-slate-500">{candidate.role}</p>
                        </div>
                        <span className="text-[13px] font-semibold text-slate-950">{candidate.score}%</span>
                        <span className="rounded-md bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">{candidate.status}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">Hiệu quả phiên</p>
                    <BarChart3 className="text-slate-400" size={18} />
                  </div>
                  <div className="mt-5 flex h-36 items-end gap-2">
                    {bars.map((height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t-md bg-slate-900"
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

export default function LandingHero({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
}: LandingHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="hero" className="relative overflow-hidden border-b border-slate-200 bg-[#f7f6f2]">
      <div className="absolute inset-0 opacity-[0.36] [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7f6f2] to-transparent" />

      <DesktopWorkspacePreview />

      <div className="relative mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-[92rem] flex-col px-5 pb-44 pt-12 sm:px-8 lg:px-12 lg:pb-[22rem] lg:pt-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[55rem]"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm">
            <Sparkles size={14} className="text-teal-600" />
            Windows-ready recruiting workspace
          </div>

          <h1 className="home-hero-heading max-w-[11ch] text-6xl font-semibold leading-none text-slate-950 sm:text-7xl lg:text-8xl">
            Support HR Desktop
          </h1>

          <p className="home-hero-copy mt-6 max-w-[45rem] text-lg leading-8 text-slate-600">
            Một không gian làm việc gọn cho đội tuyển dụng: nạp JD, đưa CV vào phiên lọc, theo dõi điểm khớp và ra quyết định trên giao diện giống app laptop.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.button
              type="button"
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              onClick={onPrimaryAction}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)] transition hover:bg-slate-800"
            >
              {primaryLabel}
              <ArrowRight size={17} />
            </motion.button>

            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/85 px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
            >
              <CheckCircle2 size={16} />
              Nhận tư vấn triển khai
            </button>
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
        </motion.div>
      </div>
    </section>
  );
}
