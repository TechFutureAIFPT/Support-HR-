import { motion, useReducedMotion } from "framer-motion";
import {
  Clock3,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";

const impactStats = [
  {
    value: "85%",
    label: "thời gian đọc hồ sơ được cắt giảm",
    accent: "text-cyan-300",
    surface: "bg-[rgba(4,24,28,0.92)]",
    border: "border-cyan-400/18",
    Icon: Clock3,
  },
  {
    value: "3x",
    label: "tốc độ shortlist cho vị trí kỹ thuật",
    accent: "text-violet-300",
    surface: "bg-[rgba(13,11,28,0.92)]",
    border: "border-violet-400/18",
    Icon: TrendingUp,
  },
  {
    value: "99%",
    label: "phiên đánh giá có giải thích rõ lý do",
    accent: "text-rose-300",
    surface: "bg-[rgba(30,8,15,0.92)]",
    border: "border-rose-400/18",
    Icon: Sparkles,
  },
  {
    value: "0đ",
    label: "chi phí khởi động cho bản dùng thử",
    accent: "text-emerald-300",
    surface: "bg-[rgba(4,24,16,0.92)]",
    border: "border-emerald-400/18",
    Icon: Tag,
  },
];

export default function WhySupportSection() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -4 };

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-black py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.03),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_62%)]" />

      <div className="relative mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
          <div className="max-w-2xl">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-emerald-300/75">
              Support HR // Vì sao hiệu quả hơn
            </p>
            <h2 className="mt-6 text-[clamp(2.8rem,6vw,5.4rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-white">
              Chuyển từ đọc hồ sơ thủ công sang vận hành tuyển dụng bằng AI.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Support HR được thiết kế như một lớp điều phối cho recruiter: đọc CV nhanh, chấm điểm có lý do và giữ
              toàn bộ phiên tuyển dụng trong một giao diện đủ sâu để làm việc thật.
            </p>
          </div>

          <div className="grid gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
            {impactStats.map(({ value, label, accent, surface, border, Icon }) => (
              <motion.div
                key={label}
                whileHover={hoverLift}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`relative min-h-[13rem] overflow-hidden border ${border} ${surface} px-7 py-7`}
              >
                <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div className="relative z-10">
                  <Icon className={`h-5 w-5 ${accent}`} />
                  <p className={`mt-8 text-[clamp(2.4rem,4vw,3.4rem)] font-semibold leading-none tracking-[-0.06em] ${accent}`}>
                    {value}
                  </p>
                  <p className="mt-3 max-w-[13rem] text-sm leading-7 text-zinc-400">
                    {label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
