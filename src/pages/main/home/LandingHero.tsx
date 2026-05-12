import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HERO_SYSTEM_PANELS = [
  {
    label: "CV // HÀNG ĐỢI",
    tone: "bg-cyan-300",
    lines: [
      "[SCAN] 42 hồ sơ mới vừa tải lên",
      "[OCR] 12 CV ảnh đã chuẩn hóa",
      "[QUEUE] Ưu tiên vị trí Front-end",
    ],
  },
  {
    label: "JD // TÁCH NGHĨA",
    tone: "bg-emerald-300",
    lines: [
      "[ROLE] Senior Front-end Engineer",
      "[MUST] React, TypeScript, kiến trúc UI",
      "[WEIGHT] Kỹ năng 45 / kinh nghiệm 35",
    ],
  },
  {
    label: "ĐỐI SÁNH // LIVE",
    tone: "bg-sky-300",
    lines: [
      "[SCORE] 98.2% hồ sơ phù hợp nhất",
      "[RANK] 03 ứng viên nổi bật",
      "[GAP] 01 kỹ năng cần kiểm tra thêm",
    ],
  },
  {
    label: "TUYỂN DỤNG // NHẬT KÝ",
    tone: "bg-violet-300",
    lines: [
      "[SYNC] Dữ liệu JD đã đồng bộ",
      "[NOTE] HR ưu tiên tốc độ phản hồi",
      "[LOG] Phiên đánh giá đang hoạt động",
    ],
  },
  {
    label: "KỸ NĂNG // MA TRẬN",
    tone: "bg-cyan-300",
    lines: [
      "[STACK] React / Next.js / TypeScript",
      "[DEPTH] Thiết kế hệ thống giao diện",
      "[MATCH] Kỹ năng cốt lõi đạt chuẩn",
    ],
  },
  {
    label: "PHỎNG VẤN // GỢI Ý",
    tone: "bg-emerald-300",
    lines: [
      "[PROMPT] Cân bằng tốc độ và chất lượng",
      "[PROMPT] Đọc hiểu kiến trúc Front-end",
      "[PACK] Bộ câu hỏi đã sẵn sàng",
    ],
  },
  {
    label: "ĐỘI NGŨ // DUYỆT",
    tone: "bg-sky-300",
    lines: [
      "[REVIEW] Hiring manager đã xem shortlist",
      "[STATUS] Chờ phản hồi cuối cùng",
      "[FLOW] Không cần xử lý thủ công dài dòng",
    ],
  },
  {
    label: "KIỂM TOÁN // BÁO CÁO",
    tone: "bg-violet-300",
    lines: [
      "[TRACE] Lý do chấm điểm đầy đủ",
      "[EXPORT] Báo cáo cho hội đồng tuyển dụng",
      "[SAFE] Có thể rà soát từng quyết định",
    ],
  },
  {
    label: "HÀNH VI // TÍN HIỆU",
    tone: "bg-cyan-300",
    lines: [
      "[SIGNAL] Khả năng sở hữu sản phẩm cao",
      "[SIGNAL] Chủ động điều phối công việc",
      "[FLAG] Cần hỏi sâu về mentoring",
    ],
  },
  {
    label: "LƯƠNG // ĐỐI CHIẾU",
    tone: "bg-emerald-300",
    lines: [
      "[RANGE] Đối chiếu theo vị trí",
      "[MARKET] Mức kỳ vọng nằm trong ngưỡng",
      "[ALERT] Không có sai lệch lớn",
    ],
  },
  {
    label: "SHORTLIST // GỬI",
    tone: "bg-sky-300",
    lines: [
      "[MAIL] Danh sách đề cử đã chuẩn bị",
      "[DOC] Kèm lý do và câu hỏi phỏng vấn",
      "[READY] Có thể gửi ngay cho recruiter",
    ],
  },
  {
    label: "HỆ THỐNG // NHỊP TIM",
    tone: "bg-violet-300",
    lines: [
      "[PING] Bộ máy đối sánh đang ổn định",
      "[CPU] 12% / MEM 3.1GB",
      "[UPTIME] Tác vụ đang chạy mượt",
    ],
  },
];

const HERO_VIEWPORT = { once: true, amount: 0.2 };
const HERO_TRANSITION = { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };

interface LandingHeroProps {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryLabel: string;
}

function SystemPanel({
  label,
  tone,
  lines,
}: {
  label: string;
  tone: string;
  lines: string[];
}) {
  return (
    <div className="flex h-full flex-col justify-between border-white/[0.07] p-4 xl:p-5">
      <div className="supporthr-mono flex items-center justify-between text-[10px] uppercase tracking-[0.26em] text-zinc-700/75">
        <span>{label}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${tone} opacity-80`} />
      </div>
      <div className="supporthr-mono mt-8 space-y-2 text-[12px] leading-6 text-zinc-800/55 xl:text-[13px]">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
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
  const buttonHover = reduceMotion ? undefined : { scale: 1.02, y: -2 };

  return (
    <section id="hero" className="relative overflow-hidden bg-black pt-3 sm:pt-6 lg:pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.035),transparent_24%),linear-gradient(180deg,#000000_0%,#020202_56%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-40" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.99)_28%,rgba(0,0,0,0.97)_44%,rgba(0,0,0,0.86)_58%,rgba(0,0,0,0.52)_72%,transparent_92%)]" />
      <div className="pointer-events-none absolute left-0 top-[5.25rem] z-[1] h-[28rem] w-[64rem] max-w-[72%] bg-[radial-gradient(circle_at_left_top,rgba(0,0,0,1)_0%,rgba(0,0,0,0.98)_44%,rgba(0,0,0,0.84)_68%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[10vw] min-w-[48px] bg-black" />

      <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="relative min-h-[500px] sm:min-h-[540px] lg:min-h-[620px]">
          <div className="pointer-events-none absolute inset-0 hidden lg:grid lg:grid-cols-4 lg:grid-rows-3">
            {HERO_SYSTEM_PANELS.map((panel, index) => (
              <div
                key={panel.label}
                className={`border-white/[0.07] ${
                  index % 4 === 3 ? "" : "border-r"
                } ${index >= HERO_SYSTEM_PANELS.length - 4 ? "" : "border-b"}`}
              >
                <SystemPanel {...panel} />
              </div>
            ))}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={HERO_VIEWPORT}
          transition={HERO_TRANSITION}
          className="relative z-10 max-w-[58rem] py-10 sm:py-12 lg:py-14"
        >
            <h1 className="supporthr-display text-[clamp(3.6rem,9.2vw,8.5rem)] font-bold tracking-[-0.08em] text-white">
              <span className="block leading-[0.84]">Support HR,</span>
              <span className="block leading-[0.84]">đọc CV</span>
              <span className="block leading-[0.84] text-zinc-300">nhanh và chuẩn.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Tự động quét CV, hiểu kỹ năng kỹ thuật, đối sánh với JD và tạo danh sách đề cử rõ ràng
              cho nhà tuyển dụng hiện đại. Gọn về bố cục, mạnh ở tốc độ và độ chính xác.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                whileHover={buttonHover}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={onPrimaryAction}
                className="inline-flex h-12 items-center gap-2 rounded-none bg-white px-6 text-sm font-semibold text-black shadow-[0_24px_60px_rgba(255,255,255,0.12)] transition-colors hover:bg-zinc-100"
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
