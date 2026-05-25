import { motion, useReducedMotion } from "framer-motion";
import {
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const impactStats = [
  {
    value: "Nhanh hơn",
    label: "Rút ngắn thao tác đọc CV và gom về một luồng rà soát gọn hơn.",
    accent: "text-cyan-300",
    surface: "bg-[rgba(4,24,28,0.92)]",
    border: "border-cyan-400/18",
    Icon: Clock3,
  },
  {
    value: "Rõ hơn",
    label: "Giữ danh sách đề cử, ghi chú và lý do đánh giá trong một màn hình làm việc.",
    accent: "text-violet-300",
    surface: "bg-[rgba(13,11,28,0.92)]",
    border: "border-violet-400/18",
    Icon: Sparkles,
  },
  {
    value: "Chắc hơn",
    label: "Bổ sung đủ ngữ cảnh để chuyên viên tuyển dụng và quản lý tuyển dụng cùng rà soát.",
    accent: "text-rose-300",
    surface: "bg-[rgba(30,8,15,0.92)]",
    border: "border-rose-400/18",
    Icon: ShieldCheck,
  },
  {
    value: "Dễ mở rộng",
    label: "Phù hợp từ đội ngũ nhỏ đến quy trình cần chia sẻ danh sách đề cử cho nhiều bên.",
    accent: "text-emerald-300",
    surface: "bg-[rgba(4,24,16,0.92)]",
    border: "border-emerald-400/18",
    Icon: Users,
  },
];

export default function WhySupportSection() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -4 };

  return (
    <section className="relative overflow-hidden bg-black pt-0 pb-20 sm:pb-24 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.03),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_62%)]" />
      <div className="home-noise-overlay" />

      <div className="relative home-section-frame">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(40rem,1.1fr)] xl:items-center">
          <div className="max-w-[42rem]">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-emerald-300/75">
              Support HR // Vì sao đội ngũ business dễ chấp nhận hơn
            </p>
            <h2 className="home-section-heading mt-6 max-w-[40rem] font-semibold text-white">
              Chuyển quy trình sàng lọc thành một bề mặt vận hành rõ ràng cho đội tuyển dụng.
            </h2>
            <p className="mt-6 max-w-[38rem] text-base leading-8 text-zinc-400 sm:text-lg">
              Support HR được thiết kế để đội tuyển dụng nhìn ngay file nào đang được xử lý, ứng viên nào đang được đề
              cử, và vì sao danh sách đó được đưa lên trước. Mục tiêu là giảm thao tác lặp, không phải tạo thêm một hộp đen.
            </p>
          </div>

          <div className="home-grid-sheet grid self-stretch gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
            {impactStats.map(({ value, label, accent, surface, border, Icon }) => (
              <motion.div
                key={label}
                whileHover={hoverLift}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`relative min-h-[11.25rem] overflow-hidden border ${border} ${surface} p-6 lg:p-7`}
              >
                <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div className="relative z-10">
                  <Icon className={`h-5 w-5 ${accent}`} />
                  <p className={`mt-7 text-[clamp(1.8rem,2.45vw,2.45rem)] font-semibold leading-none tracking-normal ${accent}`}>
                    {value}
                  </p>
                  <p className="mt-3 max-w-[15rem] text-sm leading-7 text-zinc-400">
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
