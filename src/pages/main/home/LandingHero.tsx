import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HERO_SYSTEM_PANELS = [
  {
    label: "CV // HÀNG ĐỢI",
    dotClass: "bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.75)]",
    labelGradientClass: "from-cyan-100 via-cyan-200 to-sky-300",
    lineGradientClass: "from-cyan-100 via-slate-100 to-cyan-300",
    glowClass: "from-cyan-400/26 via-cyan-300/12 to-transparent",
    delay: 0,
    lines: [
      "[SCAN] 42 hồ sơ mới vừa tải lên",
      "[OCR] 12 CV ảnh đã chuẩn hóa",
      "[QUEUE] Ưu tiên vị trí Front-end",
    ],
  },
  {
    label: "JD // TÁCH NGHĨA",
    dotClass: "bg-emerald-300 shadow-[0_0_22px_rgba(52,211,153,0.72)]",
    labelGradientClass: "from-emerald-100 via-lime-100 to-emerald-300",
    lineGradientClass: "from-emerald-100 via-slate-100 to-lime-200",
    glowClass: "from-emerald-400/26 via-emerald-300/12 to-transparent",
    delay: 0.5,
    lines: [
      "[ROLE] Senior Front-end Engineer",
      "[MUST] React, TypeScript, kiến trúc UI",
      "[WEIGHT] Kỹ năng 45 / kinh nghiệm 35",
    ],
  },
  {
    label: "ĐỐI SÁNH // LIVE",
    dotClass: "bg-sky-300 shadow-[0_0_22px_rgba(56,189,248,0.72)]",
    labelGradientClass: "from-sky-100 via-cyan-100 to-blue-300",
    lineGradientClass: "from-sky-100 via-slate-100 to-cyan-300",
    glowClass: "from-sky-400/24 via-cyan-300/12 to-transparent",
    delay: 1,
    lines: [
      "[SCORE] 98.2% hồ sơ phù hợp nhất",
      "[RANK] 03 ứng viên nổi bật",
      "[GAP] 01 kỹ năng cần kiểm tra thêm",
    ],
  },
  {
    label: "TUYỂN DỤNG // NHẬT KÝ",
    dotClass: "bg-violet-300 shadow-[0_0_22px_rgba(196,181,253,0.75)]",
    labelGradientClass: "from-violet-100 via-fuchsia-100 to-violet-300",
    lineGradientClass: "from-violet-100 via-slate-100 to-fuchsia-200",
    glowClass: "from-violet-400/24 via-fuchsia-300/10 to-transparent",
    delay: 1.5,
    lines: [
      "[SYNC] Dữ liệu JD đã đồng bộ",
      "[NOTE] HR ưu tiên tốc độ phản hồi",
      "[LOG] Phiên đánh giá đang hoạt động",
    ],
  },
  {
    label: "KỸ NĂNG // MA TRẬN",
    dotClass: "bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.75)]",
    labelGradientClass: "from-cyan-100 via-sky-100 to-cyan-300",
    lineGradientClass: "from-cyan-100 via-slate-100 to-sky-300",
    glowClass: "from-cyan-400/24 via-sky-300/10 to-transparent",
    delay: 2,
    lines: [
      "[STACK] React / Next.js / TypeScript",
      "[DEPTH] Thiết kế hệ thống giao diện",
      "[MATCH] Kỹ năng cốt lõi đạt chuẩn",
    ],
  },
  {
    label: "PHỎNG VẤN // GỢI Ý",
    dotClass: "bg-emerald-300 shadow-[0_0_22px_rgba(52,211,153,0.72)]",
    labelGradientClass: "from-emerald-100 via-lime-100 to-cyan-200",
    lineGradientClass: "from-emerald-100 via-slate-100 to-cyan-200",
    glowClass: "from-emerald-400/26 via-cyan-300/10 to-transparent",
    delay: 2.5,
    lines: [
      "[PROMPT] Cân bằng tốc độ và chất lượng",
      "[PROMPT] Đọc hiểu kiến trúc Front-end",
      "[PACK] Bộ câu hỏi đã sẵn sàng",
    ],
  },
  {
    label: "ĐỘI NGŨ // DUYỆT",
    dotClass: "bg-sky-300 shadow-[0_0_22px_rgba(56,189,248,0.72)]",
    labelGradientClass: "from-sky-100 via-blue-100 to-cyan-300",
    lineGradientClass: "from-sky-100 via-slate-100 to-blue-300",
    glowClass: "from-sky-400/24 via-blue-300/10 to-transparent",
    delay: 3,
    lines: [
      "[REVIEW] Hiring manager đã xem shortlist",
      "[STATUS] Chờ phản hồi cuối cùng",
      "[FLOW] Không cần xử lý thủ công dài dòng",
    ],
  },
  {
    label: "KIỂM TOÁN // BÁO CÁO",
    dotClass: "bg-violet-300 shadow-[0_0_22px_rgba(196,181,253,0.75)]",
    labelGradientClass: "from-violet-100 via-fuchsia-100 to-pink-300",
    lineGradientClass: "from-violet-100 via-slate-100 to-pink-300",
    glowClass: "from-violet-400/24 via-pink-300/10 to-transparent",
    delay: 3.5,
    lines: [
      "[TRACE] Lý do chấm điểm đầy đủ",
      "[EXPORT] Báo cáo cho hội đồng tuyển dụng",
      "[SAFE] Có thể rà soát từng quyết định",
    ],
  },
  {
    label: "HÀNH VI // TÍN HIỆU",
    dotClass: "bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.75)]",
    labelGradientClass: "from-cyan-100 via-teal-100 to-sky-300",
    lineGradientClass: "from-cyan-100 via-slate-100 to-teal-300",
    glowClass: "from-cyan-400/24 via-teal-300/10 to-transparent",
    delay: 4,
    lines: [
      "[SIGNAL] Khả năng sở hữu sản phẩm cao",
      "[SIGNAL] Chủ động điều phối công việc",
      "[FLAG] Cần hỏi sâu về mentoring",
    ],
  },
  {
    label: "LƯƠNG // ĐỐI CHIẾU",
    dotClass: "bg-emerald-300 shadow-[0_0_22px_rgba(52,211,153,0.72)]",
    labelGradientClass: "from-emerald-100 via-cyan-100 to-lime-200",
    lineGradientClass: "from-emerald-100 via-slate-100 to-lime-200",
    glowClass: "from-emerald-400/24 via-lime-300/10 to-transparent",
    delay: 4.5,
    lines: [
      "[RANGE] Đối chiếu theo vị trí",
      "[MARKET] Mức kỳ vọng nằm trong ngưỡng",
      "[ALERT] Không có sai lệch lớn",
    ],
  },
  {
    label: "SHORTLIST // GỬI",
    dotClass: "bg-sky-300 shadow-[0_0_22px_rgba(56,189,248,0.72)]",
    labelGradientClass: "from-sky-100 via-cyan-100 to-violet-200",
    lineGradientClass: "from-sky-100 via-slate-100 to-violet-200",
    glowClass: "from-sky-400/24 via-violet-300/10 to-transparent",
    delay: 5,
    lines: [
      "[MAIL] Danh sách đề cử đã chuẩn bị",
      "[DOC] Kèm lý do và câu hỏi phỏng vấn",
      "[READY] Có thể gửi ngay cho recruiter",
    ],
  },
  {
    label: "HỆ THỐNG // NHỊP TIM",
    dotClass: "bg-violet-300 shadow-[0_0_22px_rgba(196,181,253,0.75)]",
    labelGradientClass: "from-violet-100 via-fuchsia-100 to-cyan-200",
    lineGradientClass: "from-violet-100 via-slate-100 to-cyan-200",
    glowClass: "from-violet-400/24 via-cyan-300/10 to-transparent",
    delay: 5.5,
    lines: [
      "[PING] Bộ máy đối sánh đang ổn định",
      "[CPU] 12% / MEM 3.1GB",
      "[UPTIME] Tác vụ đang chạy mượt",
    ],
  },
];

const HERO_HEADLINE_LINES = [
  {
    text: "Support HR,",
    gradientClass: "from-white via-cyan-100 to-sky-300",
    delay: 0,
  },
  {
    text: "đọc CV",
    gradientClass: "from-cyan-200 via-sky-300 to-violet-300",
    delay: 0.4,
  },
  {
    text: "nhanh và chuẩn.",
    gradientClass: "from-white via-emerald-200 to-cyan-300",
    delay: 0.8,
  },
];

const HERO_VIEWPORT = { once: true, amount: 0.2 };
const HERO_TRANSITION = { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };

interface LandingHeroProps {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryLabel: string;
}

function GhostGradientText({
  text,
  gradientClass,
  className,
  glowClassName,
}: {
  text: string;
  gradientClass: string;
  className: string;
  glowClassName: string;
}) {
  return (
    <span className={`relative block ${className}`}>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${gradientClass} bg-[length:185%_185%] bg-clip-text text-transparent blur-[10px] ${glowClassName}`}
      >
        {text}
      </span>
      <span
        className={`relative block bg-gradient-to-r ${gradientClass} bg-[length:185%_185%] bg-clip-text text-transparent`}
      >
        {text}
      </span>
    </span>
  );
}

function SystemPanel({
  label,
  dotClass,
  labelGradientClass,
  lineGradientClass,
  glowClass,
  delay,
  lines,
  reduceMotion,
}: {
  label: string;
  dotClass: string;
  labelGradientClass: string;
  lineGradientClass: string;
  glowClass: string;
  delay: number;
  lines: string[];
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      className="relative flex h-full flex-col justify-between overflow-hidden border-white/[0.04] p-4 xl:p-5"
      animate={
        reduceMotion
          ? undefined
          : {
              opacity: [0.78, 0.98, 0.84],
              filter: [
                "brightness(0.92) saturate(0.96)",
                "brightness(1.08) saturate(1.1)",
                "brightness(0.96) saturate(1)",
              ],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 8.5,
              ease: "easeInOut",
              repeat: Infinity,
              delay,
            }
      }
    >
      <div className={`pointer-events-none absolute left-4 right-8 top-5 h-14 bg-gradient-to-r ${glowClass} opacity-55 blur-3xl`} />
      <div className={`pointer-events-none absolute inset-x-5 bottom-5 top-16 bg-gradient-to-br ${glowClass} opacity-32 blur-[44px]`} />

      <div className="relative flex items-center justify-between">
        <GhostGradientText
          text={label}
          gradientClass={labelGradientClass}
          className="supporthr-mono text-[10px] font-medium uppercase tracking-[0.26em] opacity-70"
          glowClassName="opacity-45"
        />
        <span className={`h-2 w-2 rounded-full ${dotClass} opacity-80`} />
      </div>

      <div className="relative mt-8 space-y-2">
        {lines.map((line) => (
          <GhostGradientText
            key={line}
            text={line}
            gradientClass={lineGradientClass}
            className="supporthr-mono text-[12px] leading-6 opacity-[0.56] xl:text-[13px]"
            glowClassName="opacity-28"
          />
        ))}
      </div>
    </motion.div>
  );
}

function HeadlineLine({
  text,
  gradientClass,
  delay,
  reduceMotion,
}: {
  text: string;
  gradientClass: string;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <span className="relative block leading-[0.8]">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${gradientClass} bg-[length:170%_170%] bg-clip-text text-transparent blur-[18px] opacity-55`}
      >
        {text}
      </span>
      <motion.span
        className={`relative block bg-gradient-to-r ${gradientClass} bg-[length:170%_170%] bg-clip-text text-transparent`}
        animate={
          reduceMotion
            ? undefined
            : {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                opacity: [0.96, 1, 0.97],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 10,
                ease: "easeInOut",
                repeat: Infinity,
                delay,
              }
        }
      >
        {text}
      </motion.span>
    </span>
  );
}

export default function LandingHero({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
}: LandingHeroProps) {
  const reduceMotion = useReducedMotion();
  const buttonHover = reduceMotion ? undefined : { scale: 1.02, y: -2 };

  return (
    <section id="hero" className="relative overflow-hidden bg-black pt-3 sm:pt-6 lg:pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.05),transparent_20%),linear-gradient(180deg,#000000_0%,#010101_56%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-18" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.992)_34%,rgba(0,0,0,0.972)_48%,rgba(0,0,0,0.9)_62%,rgba(0,0,0,0.56)_80%,transparent_94%)]" />
      <div className="pointer-events-none absolute left-[-4rem] top-[4rem] z-[1] h-[36rem] w-[74rem] max-w-[80%] bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.9)_34%,rgba(0,0,0,0.98)_68%,transparent_100%)] blur-[10px]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[10vw] min-w-[48px] bg-black" />

      <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="relative min-h-[500px] sm:min-h-[540px] lg:min-h-[620px]">
          <div className="pointer-events-none absolute inset-0 hidden opacity-[0.38] lg:grid lg:grid-cols-4 lg:grid-rows-3">
            {HERO_SYSTEM_PANELS.map((panel, index) => (
              <div
                key={panel.label}
                className={`border-white/[0.05] ${
                  index % 4 === 3 ? "" : "border-r"
                } ${index >= HERO_SYSTEM_PANELS.length - 4 ? "" : "border-b"}`}
              >
                <SystemPanel {...panel} reduceMotion={reduceMotion} />
              </div>
            ))}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={HERO_VIEWPORT}
            transition={HERO_TRANSITION}
            className="relative z-10 max-w-[60rem] py-10 sm:py-12 lg:py-16"
          >
            <div className="pointer-events-none absolute inset-x-[-2.25rem] inset-y-[-2.5rem] -z-10 bg-[radial-gradient(circle_at_22%_24%,rgba(5,14,26,0.98)_0%,rgba(0,0,0,0.94)_26%,rgba(0,0,0,0.74)_54%,rgba(0,0,0,0.34)_76%,transparent_100%)]" />
            <div className="pointer-events-none absolute bottom-[-1.5rem] left-[-2.5rem] top-[11.25rem] -z-10 w-[58rem] max-w-[90vw] bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.88)_34%,rgba(0,0,0,0.54)_62%,rgba(0,0,0,0.12)_88%,transparent_100%)] blur-[3px]" />

            <h1 className="supporthr-display max-w-[8.4ch] text-[clamp(4.35rem,10vw,10.2rem)] font-black tracking-[-0.1em]">
              {HERO_HEADLINE_LINES.map((line) => (
                <HeadlineLine
                  key={line.text}
                  text={line.text}
                  gradientClass={line.gradientClass}
                  delay={line.delay}
                  reduceMotion={reduceMotion}
                />
              ))}
            </h1>

            <p className="mt-7 max-w-[42rem] text-[clamp(1rem,1.45vw,1.22rem)] leading-[1.85] text-zinc-300 drop-shadow-[0_10px_30px_rgba(0,0,0,0.72)]">
              Tự động quét CV, hiểu kỹ năng kỹ thuật, đối sánh với JD và tạo danh sách đề cử rõ ràng
              cho nhà tuyển dụng hiện đại.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                whileHover={buttonHover}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={onPrimaryAction}
                className="inline-flex h-12 items-center gap-2 rounded-none bg-white px-6 text-sm font-semibold text-black shadow-[0_24px_60px_rgba(255,255,255,0.14)] transition-colors hover:bg-zinc-100"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={buttonHover}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={onSecondaryAction}
                className="inline-flex h-12 items-center gap-2 rounded-none border border-white/12 bg-white/[0.02] px-6 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.05]"
              >
                Xem quy trình
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
