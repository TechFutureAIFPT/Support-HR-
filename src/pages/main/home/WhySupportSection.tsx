import { motion, useReducedMotion } from "framer-motion";
import {
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const impactStats = [
  {
    value: "Nhanh hon",
    label: "Rut ngan thao tac doc CV va gom ve mot luong review gon hon.",
    accent: "text-cyan-300",
    surface: "bg-[rgba(4,24,28,0.92)]",
    border: "border-cyan-400/18",
    Icon: Clock3,
  },
  {
    value: "Ro hon",
    label: "Giu shortlist, ghi chu, va ly do danh gia trong mot man hinh lam viec.",
    accent: "text-violet-300",
    surface: "bg-[rgba(13,11,28,0.92)]",
    border: "border-violet-400/18",
    Icon: Sparkles,
  },
  {
    value: "An toan hon",
    label: "Bo sung context de recruiter va hiring manager cung review de dang hon.",
    accent: "text-rose-300",
    surface: "bg-[rgba(30,8,15,0.92)]",
    border: "border-rose-400/18",
    Icon: ShieldCheck,
  },
  {
    value: "De mo rong",
    label: "Phu hop tu doi ngu nho den quy trinh can chia se shortlist cho nhieu ben.",
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
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-black py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.03),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_62%)]" />

      <div className="relative home-section-frame">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,0.95fr)_minmax(34rem,1.05fr)] xl:items-center">
          <div className="max-w-[46rem]">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-emerald-300/75">
              Support HR // Vi sao doi ngu business de chap nhan hon
            </p>
            <h2 className="home-section-heading mt-6 max-w-[46rem] font-semibold text-white">
              Chuyen quy trinh screening thanh mot bo mat van hanh ro rang cho recruiter.
            </h2>
            <p className="mt-6 max-w-[41rem] text-base leading-8 text-zinc-400 sm:text-lg">
              Support HR duoc thiet ke de recruiter nhin thay ngay file nao dang duoc xu ly, ung vien nao dang duoc de
              cu, va vi sao shortlist do duoc de xuat. Muc tieu la giam thao tac lap, khong phai tao them mot hop den.
            </p>
          </div>

          <div className="grid self-stretch gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
            {impactStats.map(({ value, label, accent, surface, border, Icon }) => (
              <motion.div
                key={label}
                whileHover={hoverLift}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`relative min-h-[12rem] overflow-hidden border ${border} ${surface} p-7 lg:p-8`}
              >
                <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div className="relative z-10">
                  <Icon className={`h-5 w-5 ${accent}`} />
                  <p className={`mt-8 text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-none tracking-normal ${accent}`}>
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
