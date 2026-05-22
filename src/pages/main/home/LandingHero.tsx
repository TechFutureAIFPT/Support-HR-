import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

const HERO_SYSTEM_PANELS = [
  {
    label: "CV // HÀNG ĐỢI",
    dotClass: "bg-cyan-400",
    accentClass: "text-cyan-400",
    delay: 0,
    lines: [
      "[SCAN] 42 hồ sơ mới vừa tải lên",
      "[OCR] 12 CV ảnh đã chuẩn hóa",
      "[QUEUE] Ưu tiên vị trí Front-end",
    ],
  },
  {
    label: "JD // TÁCH NGHĨA",
    dotClass: "bg-emerald-400",
    accentClass: "text-emerald-400",
    delay: 0.5,
    lines: [
      "[ROLE] Senior Front-end Engineer",
      "[MUST] React, TypeScript, kiến trúc UI",
      "[WEIGHT] Kỹ năng 45 / kinh nghiệm 35",
    ],
  },
  {
    label: "ĐỐI SÁNH // LIVE",
    dotClass: "bg-sky-400",
    accentClass: "text-sky-400",
    delay: 1,
    lines: [
      "[SCORE] 98.2% hồ sơ phù hợp nhất",
      "[RANK] 03 ứng viên nổi bật",
      "[GAP] 01 kỹ năng cần kiểm tra thêm",
    ],
  },
  {
    label: "TUYỂN DỤNG // NHẬT KÝ",
    dotClass: "bg-violet-400",
    accentClass: "text-violet-400",
    delay: 1.5,
    lines: [
      "[SYNC] Dữ liệu JD đã đồng bộ",
      "[NOTE] HR ưu tiên tốc độ phản hồi",
      "[LOG] Phiên đánh giá đang hoạt động",
    ],
  },
  {
    label: "KỸ NĂNG // MA TRẬN",
    dotClass: "bg-cyan-400",
    accentClass: "text-cyan-400",
    delay: 2,
    lines: [
      "[STACK] React / Next.js / TypeScript",
      "[DEPTH] Thiết kế hệ thống giao diện",
      "[MATCH] Kỹ năng cốt lõi đạt chuẩn",
    ],
  },
  {
    label: "PHỎNG VẤN // GỢI Ý",
    dotClass: "bg-emerald-400",
    accentClass: "text-emerald-400",
    delay: 2.5,
    lines: [
      "[PROMPT] Cân bằng tốc độ và chất lượng",
      "[PROMPT] Đọc hiểu kiến trúc Front-end",
      "[PACK] Bộ câu hỏi đã sẵn sàng",
    ],
  },
  {
    label: "ĐỘI NGŨ // DUYỆT",
    dotClass: "bg-sky-400",
    accentClass: "text-sky-400",
    delay: 3,
    lines: [
      "[REVIEW] Hiring manager đã xem shortlist",
      "[STATUS] Chờ phản hồi cuối cùng",
      "[FLOW] Không cần xử lý thủ công dài dòng",
    ],
  },
  {
    label: "KIỂM TOÁN // BÁO CÁO",
    dotClass: "bg-violet-400",
    accentClass: "text-violet-400",
    delay: 3.5,
    lines: [
      "[TRACE] Lý do chấm điểm đầy đủ",
      "[EXPORT] Báo cáo cho hội đồng tuyển dụng",
      "[SAFE] Có thể rà soát từng quyết định",
    ],
  },
  {
    label: "HÀNH VI // TÍN HIỆU",
    dotClass: "bg-cyan-400",
    accentClass: "text-cyan-400",
    delay: 4,
    lines: [
      "[SIGNAL] Khả năng sở hữu sản phẩm cao",
      "[SIGNAL] Chủ động điều phối công việc",
      "[FLAG] Cần hỏi sâu về mentoring",
    ],
  },
  {
    label: "LƯƠNG // ĐỐI CHIẾU",
    dotClass: "bg-emerald-400",
    accentClass: "text-emerald-400",
    delay: 4.5,
    lines: [
      "[RANGE] Đối chiếu theo vị trí",
      "[MARKET] Mức kỳ vọng nằm trong ngưỡng",
      "[ALERT] Không có sai lệch lớn",
    ],
  },
  {
    label: "SHORTLIST // GỬI",
    dotClass: "bg-sky-400",
    accentClass: "text-sky-400",
    delay: 5,
    lines: [
      "[MAIL] Danh sách đề cử đã chuẩn bị",
      "[DOC] Kèm lý do và câu hỏi phỏng vấn",
      "[READY] Có thể gửi ngay cho recruiter",
    ],
  },
  {
    label: "HỆ THỐNG // NHỊP TIM",
    dotClass: "bg-violet-400",
    accentClass: "text-violet-400",
    delay: 5.5,
    lines: [
      "[PING] Bộ máy đối sánh đang ổn định",
      "[CPU] 12% / MEM 3.1GB",
      "[UPTIME] Tác vụ đang chạy mượt",
    ],
  },
];

const HERO_HEADLINE_LINES = [
  { text: "Support HR, đọc CV" },
  { text: "nhanh và chuẩn." },
];

const HERO_VISIBLE_PANELS = [2, 3, 6, 7, 10, 11].map((index) => HERO_SYSTEM_PANELS[index]);

const HERO_VIEWPORT = { once: true, amount: 0.2 };
const HERO_TRANSITION = { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };

interface LandingHeroProps {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryLabel: string;
}

function TypewriterLine({
  text,
  lineDelay,
  reduceMotion,
  accentClass,
}: {
  text: string;
  lineDelay: number;
  reduceMotion: boolean;
  accentClass: string;
}) {
  const [displayed, setDisplayed] = React.useState(reduceMotion ? text : "");
  const [done, setDone] = React.useState(reduceMotion);

  React.useEffect(() => {
    if (reduceMotion) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    let intervalId: number | undefined;
    let timerId: number | undefined;
    const runTypewriter = () => {
      intervalId = window.setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(intervalId);
          setDone(true);
        }
      }, 18);
    };

    if (lineDelay > 0) {
      timerId = window.setTimeout(runTypewriter, lineDelay);
    } else {
      runTypewriter();
    }

    return () => {
      if (timerId) window.clearTimeout(timerId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text, lineDelay, reduceMotion]);

  // Regex to extract prefix like [SCAN]
  const match = displayed.match(/^(\[[A-Z0-9_-]+\])(.*)$/);

  return (
    <span className="relative block supporthr-mono text-[12px] font-medium leading-6 xl:text-[13px]">
      {match ? (
        <>
          <span className={`${accentClass} font-semibold`}>{match[1]}</span>
          <span className="text-zinc-300 ml-1.5">{match[2]}</span>
        </>
      ) : (
        <span className="text-zinc-300">{displayed}</span>
      )}
      {!done && (
        <span
          className="inline-block w-[1.5px] h-[1.1em] bg-zinc-300 ml-[1.5px] align-middle animate-[supporthr-terminal-blink_0.9s_steps(1)_infinite]"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function SystemPanel({
  label,
  dotClass,
  accentClass,
  lines,
  reduceMotion,
}: {
  label: string;
  dotClass: string;
  accentClass: string;
  lines: string[];
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      className="relative flex h-full flex-col justify-between overflow-hidden bg-black/90 p-4 xl:p-5"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top clean dark line border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-900" />

      <div className="relative flex items-center justify-between">
        <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
          {label}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      </div>

      <div className="relative mt-5 space-y-1">
        {lines.map((line, i) => (
          <TypewriterLine
            key={line}
            text={line}
            lineDelay={reduceMotion ? 0 : i * 120}
            reduceMotion={reduceMotion}
            accentClass={accentClass}
          />
        ))}
      </div>
    </motion.div>
  );
}

function HeadlineLine({ text }: { text: string }) {
  return (
    <span className="relative block leading-[1.02] sm:whitespace-nowrap">
      <motion.span
        className="relative block text-white"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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

  return (
    <section id="hero" className="relative overflow-hidden bg-black pt-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.05),transparent_20%),linear-gradient(180deg,#000000_0%,#010101_56%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-18" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.992)_34%,rgba(0,0,0,0.972)_48%,rgba(0,0,0,0.9)_62%,rgba(0,0,0,0.56)_80%,transparent_94%)]" />
      <div className="pointer-events-none absolute left-[-4rem] top-[4rem] z-[1] h-[36rem] w-[74rem] max-w-[80%] bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.9)_34%,rgba(0,0,0,0.98)_68%,transparent_100%)] blur-[10px]" />

      <div className="w-full">
        <div className="relative min-h-[540px] sm:min-h-[580px] lg:min-h-[610px] xl:min-h-[640px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-[0.9] lg:grid lg:grid-cols-5 lg:grid-rows-3"
          >
            <div className="relative col-span-3 row-span-3 overflow-hidden border-r border-zinc-900 bg-[linear-gradient(135deg,rgba(5,14,26,0.72)_0%,rgba(0,0,0,0.9)_42%,rgba(0,0,0,0.58)_100%)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.025),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.36)_0%,rgba(0,0,0,0.08)_74%,transparent_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-900" />
            </div>
            {HERO_VISIBLE_PANELS.map((panel, index) => (
              <div
                key={panel.label}
                className={`home-hero-grid-card border-zinc-900 ${
                  index % 2 === 0 ? "border-r" : ""
                } ${index < HERO_VISIBLE_PANELS.length - 2 ? "border-b" : ""}`}
              >
                <SystemPanel {...panel} reduceMotion={reduceMotion ?? false} />
              </div>
            ))}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={HERO_VIEWPORT}
            transition={HERO_TRANSITION}
            className="relative z-10 max-w-[46rem] px-6 py-12 sm:px-10 sm:py-14 lg:max-w-[64%] lg:px-16 lg:py-14 xl:max-w-[68%] xl:py-16"
          >
            <div className="pointer-events-none absolute bottom-[-2.5rem] left-[-2.25rem] right-0 top-[-2.5rem] -z-10 bg-[radial-gradient(circle_at_22%_24%,rgba(5,14,26,0.98)_0%,rgba(0,0,0,0.94)_26%,rgba(0,0,0,0.74)_54%,rgba(0,0,0,0.34)_76%,transparent_100%)]" />
            <div className="pointer-events-none absolute bottom-[-1.5rem] left-[-2.5rem] right-0 top-[11.25rem] -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.88)_34%,rgba(0,0,0,0.54)_62%,rgba(0,0,0,0.12)_88%,transparent_100%)] blur-[3px]" />

            {/* Blackbox-style eyebrow label with pulsing indicators */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 flex items-center xl:mb-5"
            >
              <span className="supporthr-mono text-[11px] font-bold uppercase tracking-[0.32em] text-[#f5d6bb]/90">
                AI TUYỂN DỤNG
              </span>
            </motion.div>

            {/* Hero headline */}
            <h1 className="home-hero-heading supporthr-display max-w-[20ch] text-[clamp(3.5rem,6vw,6.5rem)] font-bold leading-[1.02] tracking-normal">
              {HERO_HEADLINE_LINES.map((line) => (
                <HeadlineLine key={line.text} text={line.text} />
              ))}
            </h1>

            {/* Body text — lighter weight */}
            <p className="home-hero-copy mt-6 max-w-[43rem] text-[clamp(1rem,1.18vw,1.18rem)] font-light leading-[1.75] tracking-normal text-zinc-400 xl:mt-7">
              Tự động quét CV, hiểu kỹ năng kỹ thuật, đối sánh với JD và tạo danh sách đề cử rõ ràng
              cho nhà tuyển dụng hiện đại.
            </p>

            {/* Blackbox-style square buttons — only GET STARTED, made larger */}
            <div className="mt-8 flex flex-wrap items-center xl:mt-9">
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                onClick={onPrimaryAction}
                className="group relative inline-flex h-[3.1rem] items-center gap-3.5 overflow-hidden rounded-none bg-white px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-black shadow-[0_20px_50px_rgba(255,255,255,0.12)] transition-all duration-200 hover:bg-zinc-100 hover:shadow-[0_24px_60px_rgba(255,255,255,0.2)] sm:h-[3.35rem] sm:px-9 sm:text-[13px]"
              >
                <span className="relative z-10">{primaryLabel}</span>
                <ArrowUpRight className="relative z-10 h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
