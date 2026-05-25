import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { pricingPlans } from "@/pages/info/business-docs-data";
import { LEGAL_TONE_STYLES } from "@/pages/info/legal-ui";

export default function PricingSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="pricing" className="relative border-b border-white/[0.08] bg-black pb-10 pt-24 sm:pb-12 sm:pt-28">
      <div className="home-noise-overlay" />
      <div className="home-section-frame">
        <div className="max-w-[58rem]">
          <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-[#f5d6bb]/75">
            Support HR // Bảng giá
          </p>
          <h2 className="home-section-heading mt-6 text-white">
            Gói giá theo quy mô đội ngũ và cách vận hành tuyển dụng.
          </h2>
          <p className="mt-6 max-w-[42rem] text-base leading-8 text-zinc-400 sm:text-lg">
            Bảng giá trên homepage giúp khách mới nhìn nhanh gói nào phù hợp. Trang bảng giá đầy đủ sẽ giải thích thêm
            phạm vi gói, hỗ trợ triển khai ban đầu, và cách chọn phương án phù hợp với quy mô doanh nghiệp.
          </p>
        </div>

        <div className="home-grid-sheet mt-12 grid gap-px border border-white/[0.08] bg-white/[0.08] xl:grid-cols-3">
          {pricingPlans.map((plan, index) => {
            const style = LEGAL_TONE_STYLES[plan.tone];

            return (
              <motion.article
                key={plan.name}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.42,
                  delay: reduceMotion ? 0 : index * 0.08,
                  ease: "easeOut",
                }}
                className={`relative border ${style.border} bg-[rgba(11,11,12,0.96)] p-6`}
              >
                <p className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${style.label}`}>
                  {plan.audience}
                </p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{plan.capacity}</p>
                  </div>
                  <span className={`supporthr-mono text-[11px] uppercase tracking-[0.18em] ${style.label}`}>
                    {plan.cycle}
                  </span>
                </div>
                <p className="mt-5 text-2xl font-semibold text-white">{plan.price}</p>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{plan.summary}</p>
                <ul className="mt-5 space-y-2 text-sm leading-7 text-zinc-400">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className={`mt-[0.55rem] h-1.5 w-1.5 shrink-0 ${style.dot}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to={plan.ctaHref}
                    className="inline-flex h-10 items-center justify-center bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-100"
                  >
                    {plan.ctaLabel}
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex h-10 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
