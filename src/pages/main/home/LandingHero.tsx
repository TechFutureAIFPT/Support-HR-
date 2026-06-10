import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
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

const pipeline = [
  { label: "CV đang chờ", value: "128", tone: "text-blue-700 bg-blue-50" },
  { label: "Đã phân tích", value: "92", tone: "text-teal-700 bg-teal-50" },
  { label: "Cần rà soát", value: "18", tone: "text-amber-700 bg-amber-50" },
];

const menuItems = [
  { label: "Nạp JD", Icon: FileText },
  { label: "Nạp hồ sơ", Icon: UploadCloud },
  { label: "Thiết lập mặc định", Icon: SlidersHorizontal },
  { label: "Phân tích AI", Icon: Sparkles },
];

const candidates = [
  { name: "Nguyễn Minh Anh", role: "Nhà tuyển dụng cấp cao", score: 94, status: "Ưu tiên" },
  { name: "Trần Hải Nam", role: "HR Business Partner", score: 88, status: "Phù hợp" },
  { name: "Lê Thu Hà", role: "Talent Acquisition", score: 81, status: "Cần xem" },
];

const bars = [48, 62, 70, 78, 84, 90];

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-full overflow-hidden lg:max-w-[50rem]">
      <div className="absolute -right-3 top-8 z-20 hidden rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_24px_70px_rgba(30,64,175,0.12)] lg:block">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bot size={20} />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">AI tóm tắt</p>
            <p className="mt-1 max-w-[13rem] text-[11px] leading-5 text-slate-500">
              3 ứng viên phù hợp nhất đã có lý do đề xuất và điểm cần xác thực.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-blue-100 bg-white p-3 shadow-[0_30px_90px_rgba(30,64,175,0.14)]">
        <div className="flex items-center justify-between gap-3 border-b border-blue-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
              <Briefcase size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">Support HR</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-500">Không gian tuyển dụng</p>
            </div>
          </div>
          <div className="hidden h-10 min-w-[14rem] items-center gap-2 rounded-xl bg-slate-50 px-3 text-slate-400 sm:flex">
            <Search size={15} />
            <span className="text-xs font-medium">Tìm ứng viên, JD, báo cáo...</span>
          </div>
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-[0.62fr_1.38fr]">
          <aside className="hidden rounded-2xl bg-blue-50/70 p-3 lg:block">
            {menuItems.map(({ label, Icon }, index) => (
              <div
                key={label}
                className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold ${
                  index === 3 ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${index === 3 ? "bg-blue-600 text-white" : "bg-white text-blue-500"}`}>
                  <Icon size={15} />
                </span>
                {label}
              </div>
            ))}
          </aside>

          <main className="min-w-0 space-y-3">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles size={16} />
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Phân tích bởi AI</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    JD đã được chuẩn hóa thành tiêu chí, CV được xếp hạng theo mức phù hợp và bằng chứng so khớp.
                  </p>
                </div>
                <span className="hidden rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm sm:inline-flex">Đang hoạt động</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {pipeline.map((item) => (
                <div key={item.label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-500">{item.label}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-black text-slate-900">{item.value}</span>
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${item.tone}`}>+12%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">Danh sách ưu tiên</p>
                  <ListChecks className="text-blue-500" size={18} />
                </div>
                <div className="mt-4 space-y-3">
                  {candidates.map((candidate, index) => (
                    <div key={candidate.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">{candidate.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{candidate.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-700">{candidate.score}%</span>
                        <span className={`hidden rounded-lg px-2 py-1 text-[10px] font-bold sm:inline-flex ${index === 0 ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"}`}>
                          {candidate.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">Hiệu quả sàng lọc</p>
                  <BarChart3 className="text-blue-500" size={18} />
                </div>
                <div className="mt-5 flex h-32 items-end gap-2">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-xl bg-gradient-to-t from-blue-600 to-teal-300"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
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
    <section id="hero" className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-10" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4.45rem)] max-w-[92rem] items-center gap-10 overflow-hidden px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <h1 className="max-w-[11ch] text-[clamp(2.45rem,8.4vw,5.45rem)] font-black leading-[1.03] tracking-normal text-slate-950 sm:max-w-[12ch] sm:text-[clamp(3rem,5.1vw,5.45rem)]">
            Sàng lọc ứng viên nhanh hơn, ra quyết định tuyển dụng rõ ràng hơn
          </h1>

          <p className="mt-6 max-w-[42rem] text-base leading-8 text-slate-600 sm:text-lg">
            Support HR giúp đội ngũ tuyển dụng đọc JD, chuẩn hóa tiêu chí, phân tích CV và xếp hạng ứng viên bằng AI trong một quy trình thống nhất, minh bạch và dễ kiểm soát.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <motion.button
              type="button"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={onPrimaryAction}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_44px_rgba(35,136,255,0.22)] transition hover:bg-blue-700 sm:w-auto"
            >
              {primaryLabel}
              <ArrowRight size={18} />
            </motion.button>

            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-6 text-sm font-black text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
            >
              <CheckCircle2 size={17} />
              Nhận tư vấn triển khai
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-500">
            <ShieldCheck size={17} className="text-teal-600" />
            Không cần thay đổi quy trình hiện tại. Bắt đầu từ JD và CV bạn đang có.
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
