import { motion, useReducedMotion } from "framer-motion";
import {
  BotMessageSquare,
  BrainCircuit,
  FileSearch2,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

const INTERVIEW_QUESTIONS = [
  "Bạn sẽ xây dựng một hệ thống thiết kế như thế nào để mở rộng tốt cho nhiều nhóm cùng lúc?",
  "Hãy kể về một lần bạn cân bằng tốc độ bàn giao với chất lượng mã nguồn khi sát hạn.",
  "Những lựa chọn kiến trúc nào thể hiện năng lực sở hữu ở cấp cao cho một nền tảng React?",
];

const MATCHING_STACK = [
  { label: "Độ khớp stack cốt lõi", score: 98 },
  { label: "Kinh nghiệm theo lĩnh vực", score: 94 },
  { label: "Tín hiệu lãnh đạo", score: 89 },
];

const FILTER_CHIPS = [
  "Front-end",
  "5+ năm",
  "Tiếng Anh B2+",
  "Sẵn sàng làm việc từ xa",
  "React / Next.js",
  "Năng lực lãnh đạo",
];

const AUTOMATION_STEPS = [
  { label: "Đã phân tích CV", time: "00:02" },
  { label: "Đã đối sánh JD", time: "00:11" },
  { label: "Bộ câu hỏi phỏng vấn", time: "00:18" },
  { label: "Đã gửi danh sách", time: "00:23" },
];

const FEATURE_VIEWPORT = { once: true, amount: 0.2 };
const FEATURE_TRANSITION = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

function FeatureCard({
  title,
  description,
  icon: Icon,
  accent,
  className = "",
  delay,
  reduceMotion,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Sparkles;
  accent: string;
  className?: string;
  delay: number;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02, y: -4 }}
      viewport={FEATURE_VIEWPORT}
      transition={{ ...FEATURE_TRANSITION, delay }}
      className={`supporthr-surface relative overflow-hidden rounded-[30px] p-6 ${className}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accent} to-transparent`} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Support HR</p>
            <h3 className="supporthr-display mt-3 text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-cyan-200">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 flex-1">{children}</div>
      </div>
    </motion.article>
  );
}

export default function LandingFeatures() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-12 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.14),transparent_46%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={FEATURE_VIEWPORT}
          transition={FEATURE_TRANSITION}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="supporthr-display text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
            Được thiết kế như một nền tảng AI, không chỉ là một bảng điều khiển HR.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-500 sm:text-lg">
            Support HR kết hợp trích xuất CV, chuẩn bị phỏng vấn bằng AI, đối sánh công việc và quyền
            kiểm soát cho nhà tuyển dụng trong một giao diện tối giản nhưng có chiều sâu kỹ thuật rõ ràng.
          </p>
        </motion.div>

        <div className="mt-14 grid auto-rows-[minmax(250px,1fr)] gap-4 lg:grid-cols-3">
          <FeatureCard
            title="Trích xuất CV"
            description="Tải lên PDF, DOCX hoặc ảnh scan. Tác tử tự phân tích cấu trúc hồ sơ, chuẩn hóa dữ liệu và giữ nguyên những tín hiệu kỹ thuật quan trọng."
            icon={FileSearch2}
            accent="via-cyan-300/50"
            className="supporthr-border-beam lg:col-span-2 lg:row-span-2"
            delay={0}
            reduceMotion={reduceMotion}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
              <div className="rounded-[24px] border border-blue-100 bg-white/35 p-4">
                <div className="supporthr-mono flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  <span>Nhật ký OCR / phân tích</span>
                  <span className="text-cyan-200">Đang chạy</span>
                </div>
                <div className="supporthr-mono mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2">
                    &gt; Đã nhận diện hồ sơ: senior-frontend-cv.pdf
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2">
                    &gt; Đã trích xuất 34 trường dữ liệu và 12 tín hiệu kỹ thuật
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">
                    &gt; Sẵn sàng đối sánh JD và tạo bộ câu hỏi phỏng vấn
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
                  <p className="supporthr-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
                    Định dạng hỗ trợ
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["PDF", "DOCX", "Ảnh scan", "Nhập từ Drive"].map((item) => (
                      <span
                        key={item}
                        className="supporthr-mono rounded-full border border-blue-100 bg-white/30 px-3 py-1 text-xs text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
                  <p className="supporthr-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">Trạng thái lô</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-blue-100 bg-white/30 p-3">
                      <p className="supporthr-mono text-xs text-slate-500">Đang chờ</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">20</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white/30 p-3">
                      <p className="supporthr-mono text-xs text-slate-500">Dự kiến</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">02:14</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            title="Phỏng vấn AI"
            description="Tự sinh câu hỏi chuyên sâu theo từng hồ sơ, tập trung đúng khoảng trống kỹ năng và mức độ phù hợp với vị trí tuyển dụng."
            icon={BotMessageSquare}
            accent="via-violet-300/50"
            delay={0.08}
            reduceMotion={reduceMotion}
          >
            <div className="space-y-3">
              {INTERVIEW_QUESTIONS.map((question) => (
                <div key={question} className="rounded-[22px] border border-blue-100 bg-white/35 px-4 py-3">
                  <p className="supporthr-mono text-[11px] uppercase tracking-[0.25em] text-violet-200/80">
                    Câu hỏi gợi ý
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{question}</p>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            title="Đối sánh công việc"
            description="Điểm phù hợp hiển thị bằng ngôn ngữ kỹ thuật rõ ràng để nhà tuyển dụng và quản lý tuyển dụng cùng nhìn trên một dữ liệu."
            icon={Radar}
            accent="via-emerald-300/50"
            delay={0.16}
            reduceMotion={reduceMotion}
          >
            <div className="space-y-4">
              {MATCHING_STACK.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-blue-100 bg-white/35 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{item.label}</p>
                    <span className="supporthr-mono text-sm text-emerald-200">{item.score}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="supporthr-neon-bar h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-400 to-sky-400"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            title="Điều khiển cho nhà tuyển dụng"
            description="Giữ quyền kiểm soát với bộ lọc cứng, trọng số tuyển dụng và các mức ưu tiên theo từng bản mô tả công việc."
            icon={SlidersHorizontal}
            accent="via-white/30"
            delay={0.24}
            reduceMotion={reduceMotion}
          >
            <div className="flex flex-wrap gap-2">
              {FILTER_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="supporthr-mono rounded-full border border-blue-100 bg-white/35 px-3 py-2 text-xs text-slate-600"
                >
                  {chip}
                </span>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            title="Bàn giao tự động"
            description="Từ lúc phân tích đến khi tạo danh sách đề cử, Support HR vẫn giữ được tốc độ lẫn khả năng kiểm tra để đội tuyển dụng ra quyết định nhanh hơn."
            icon={Zap}
            accent="via-cyan-300/50"
            className="lg:col-span-2"
            delay={0.32}
            reduceMotion={reduceMotion}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid gap-3 sm:grid-cols-2">
                {AUTOMATION_STEPS.map((step) => (
                  <div key={step.label} className="rounded-[22px] border border-blue-100 bg-white/35 px-4 py-4">
                    <p className="supporthr-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">{step.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{step.time}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="supporthr-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">
                      Lớp kiểm duyệt
                    </p>
                    <p className="mt-1 text-base font-medium text-slate-900">Sẵn sàng để con người duyệt</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Nhà tuyển dụng nhận danh sách đề cử, câu hỏi phỏng vấn và lý do chấm điểm trong cùng một luồng xử lý.
                </p>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/35 px-4 py-3">
                  <BrainCircuit className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm text-slate-600">Quy trình do AI vận hành, nhà tuyển dụng phê duyệt</span>
                </div>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
