import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FileSearch,
  FileStack,
  Gauge,
  ListChecks,
  MessageSquareText,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";

const painSolutions = [
  {
    pain: "CV nhiều, thời gian đọc ít",
    solution:
      "AI tóm tắt hồ sơ, so khớp tiêu chí và xếp hạng để HR tập trung vào ứng viên đáng xem trước.",
    metric: "AI score 94%",
    mockTitle: "Tóm tắt CV trong vài giây",
    mockSubtitle: "Hồ sơ được đọc, chấm điểm và gom bằng chứng theo từng tiêu chí.",
    candidate: "Java Developer",
    score: "94",
    status: "Phù hợp cao",
    evidence: ["3 tiêu chí khớp trực tiếp", "Kinh nghiệm backend rõ ràng", "Có bằng chứng từ CV"],
    Icon: FileStack,
    tone: "blue",
  },
  {
    pain: "Mỗi người đánh giá ứng viên theo một cách khác nhau",
    solution:
      "Support HR chuẩn hóa trọng số, bộ lọc cứng và tiêu chí đánh giá ngay từ JD.",
    metric: "100% tiêu chí chuẩn hóa",
    mockTitle: "Bộ tiêu chí thống nhất",
    mockSubtitle: "Tất cả người tham gia tuyển dụng nhìn cùng một bộ tiêu chí và trọng số.",
    candidate: "Criteria Builder",
    score: "100",
    status: "Đã chuẩn hóa",
    evidence: ["Bộ lọc bắt buộc", "Trọng số theo vai trò", "Điểm đánh giá nhất quán"],
    Icon: Scale,
    tone: "emerald",
  },
  {
    pain: "Khó giải thích vì sao một ứng viên được ưu tiên",
    solution:
      "Mỗi kết quả phân tích đi kèm điểm số, bằng chứng và nhận định để trao đổi nhanh với hiring manager.",
    metric: "3 bằng chứng nổi bật",
    mockTitle: "Lý do đề xuất rõ ràng",
    mockSubtitle: "Điểm số đi kèm bằng chứng, nhận định AI và vùng cần rà soát.",
    candidate: "Shortlist Review",
    score: "88",
    status: "Có thể phỏng vấn",
    evidence: ["Bằng chứng từ CV", "Nhận định AI ngắn gọn", "Cảnh báo cần rà soát"],
    Icon: ClipboardCheck,
    tone: "blue",
  },
  {
    pain: "Quy trình tuyển dụng bị rời rạc giữa file, ghi chú và phản hồi",
    solution:
      "JD, CV, phân tích, gợi ý và feedback được gom trong một luồng làm việc thống nhất.",
    metric: "Shortlist sẵn sàng",
    mockTitle: "Một luồng làm việc liền mạch",
    mockSubtitle: "Từ nạp JD đến feedback sau phân tích, dữ liệu được giữ trong cùng một workspace.",
    candidate: "Hiring Workspace",
    score: "91",
    status: "Sẵn sàng phản hồi",
    evidence: ["Danh sách CV", "Gợi ý câu hỏi", "Feedback có cấu trúc"],
    Icon: MessageSquareText,
    tone: "emerald",
  },
];

const toneStyles = {
  blue: {
    iconShell: "border-blue-100 bg-blue-50",
    icon: "text-blue-600",
    metric: "border-blue-200 bg-blue-50 text-blue-700",
    badge: "bg-blue-600 text-white",
    progress: "bg-blue-600",
    panel: "border-blue-100 bg-blue-50 text-blue-700",
  },
  emerald: {
    iconShell: "border-emerald-100 bg-emerald-50",
    icon: "text-emerald-600",
    metric: "border-emerald-200 bg-emerald-50 text-emerald-700",
    badge: "bg-emerald-500 text-white",
    progress: "bg-emerald-500",
    panel: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
} as const;

interface WorkflowMatrixSectionProps {
  onPrimaryAction: () => void;
  merged?: boolean;
}

export default function WorkflowMatrixSection({
  onPrimaryAction,
  merged = false,
}: WorkflowMatrixSectionProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = painSolutions[activeIndex];
  const ActiveIcon = active.Icon;
  const activeTone = toneStyles[active.tone as keyof typeof toneStyles];

  return (
    <section
      id="steps"
      className={`relative overflow-hidden bg-white ${
        merged ? "py-20 sm:py-24 lg:pt-24 lg:pb-20" : "border-y border-blue-100 py-24 sm:py-28 lg:py-32"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-blue-100" />

      <div className="relative home-section-frame">
        <div className="mx-auto max-w-5xl text-center">
          <p className="supporthr-mono text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600">
            Vấn đề & giải pháp
          </p>
          <h2 className="home-section-heading mx-auto mt-5 max-w-[18ch] font-semibold text-slate-950">
            Tuyển dụng chậm không chỉ vì thiếu ứng viên.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Điểm nghẽn thường nằm ở cách đánh giá thiếu thống nhất. Support HR biến JD, CV, tiêu chí
            và phản hồi thành một quy trình có thể kiểm soát, có bằng chứng và dễ giải trình.
          </p>

          <div className="mt-7 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 supporthr-mono text-[12px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_16px_34px_rgba(35,136,255,0.22)] transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Dùng thử quy trình
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-slate-500">
              Miễn phí trải nghiệm - Không cần nhập thẻ tín dụng
            </p>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_22px_60px_rgba(30,64,175,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)]">
            <div className="border-b border-blue-100 bg-white p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="space-y-3">
                {painSolutions.map((item, index) => {
                  const Icon = item.Icon;
                  const isActive = index === activeIndex;
                  const tone = toneStyles[item.tone as keyof typeof toneStyles];

                  return (
                    <motion.button
                      key={item.pain}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-pressed={isActive}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
                      className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-blue-300 bg-blue-50 shadow-[0_12px_30px_rgba(35,136,255,0.10)]"
                          : "border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/45"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone.iconShell}`}
                        >
                          <Icon className={`h-5 w-5 ${tone.icon}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                              Vấn đề {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 supporthr-mono text-[9px] font-bold uppercase tracking-[0.14em] text-blue-700">
                              Support HR giải quyết
                            </span>
                          </span>
                          <span className="mt-2 block text-base font-bold leading-snug text-slate-950 sm:text-lg">
                            {item.pain}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-slate-600">
                            {item.solution}
                          </span>
                          <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone.metric}`}>
                            {item.metric}
                          </span>
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.div
              key={active.pain}
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="min-w-0 bg-[#F8FAFC] p-4 sm:p-5 lg:p-6"
            >
              <div className="overflow-hidden rounded-[20px] border border-blue-100 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-white px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${activeTone.iconShell}`}>
                      <ActiveIcon className={`h-5 w-5 ${activeTone.icon}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                        Support HR AI
                      </p>
                      <h3 className="truncate text-lg font-bold text-slate-950">{active.mockTitle}</h3>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[0.92fr_1.08fr]">
                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Ứng viên / Workspace</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">{active.candidate}</p>
                      </div>
                      <span className={`rounded-xl px-3 py-2 text-sm font-black ${activeTone.badge}`}>
                        {active.score}%
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      <ProgressRow label="Mức phù hợp" value={`${active.score}%`} width={Number(active.score)} tone={activeTone.progress} />
                      <ProgressRow label="Bằng chứng CV" value="3/3" width={86} tone="bg-emerald-500" />
                    </div>

                    <div className={`mt-5 rounded-xl border px-4 py-3 ${activeTone.panel}`}>
                      <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                        Trạng thái
                      </p>
                      <p className="mt-1 text-sm font-bold">{active.status}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          AI insight
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{active.mockSubtitle}</p>
                      </div>
                      <Bot className="h-7 w-7 shrink-0 text-blue-600" />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                      {[
                        { label: "Điểm AI", value: active.metric, Icon: Gauge },
                        { label: "Shortlist", value: "Sẵn sàng", Icon: BadgeCheck },
                        { label: "Kiểm soát", value: "Có bằng chứng", Icon: Target },
                      ].map((chip) => (
                        <div key={chip.label} className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                          <chip.Icon className="h-4 w-4 text-blue-600" />
                          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            {chip.label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-950">{chip.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-bold text-slate-950">Bằng chứng hiển thị</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {active.evidence.map((item) => (
                          <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <ListChecks className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-slate-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-blue-100 bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <ProofChip icon={<BrainCircuit className="h-3.5 w-3.5" />} label="AI phân tích theo JD" />
                    <ProofChip icon={<FileSearch className="h-3.5 w-3.5" />} label="Có bằng chứng từ CV" tone="emerald" />
                    <ProofChip icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="HR giữ quyền kiểm soát" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressRow({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-50">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ProofChip({
  icon,
  label,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  tone?: "blue" | "emerald";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        tone === "emerald"
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-blue-100 bg-blue-50 text-blue-700"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}
