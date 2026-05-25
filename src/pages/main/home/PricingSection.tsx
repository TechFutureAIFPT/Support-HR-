import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { pricingPlans } from "@/pages/info/business-docs-data";
import { LEGAL_TONE_STYLES } from "@/pages/info/legal-ui";

export default function PricingSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="pricing" className="relative border-b border-white/[0.08] bg-black pb-12 pt-24 sm:pb-14 sm:pt-28">
      <div className="home-noise-overlay" />
      <div className="home-section-frame">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
          <div className="max-w-[42rem]">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-[#f5d6bb]/75">
              Support HR // Tài liệu & bảng giá
            </p>
            <h2 className="home-section-heading mt-6 text-white">
              Một teaser ngắn để đi sang trung tâm tài liệu chi tiết.
            </h2>
            <p className="mt-6 text-base leading-8 text-zinc-400 sm:text-lg">
              Homepage chỉ giữ phần nhìn nhanh. Trang tài liệu riêng sẽ gộp bảng giá, bảo mật và hỏi đáp để đội ngũ
              đọc liền mạch hơn trước khi chốt demo hoặc rollout.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-11 items-center justify-center bg-white px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-100"
              >
                Xem tài liệu & bảng giá
              </Link>
              <Link
                to="/book-demo"
                className="inline-flex h-11 items-center justify-center border border-white/12 px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
              >
                Đặt lịch demo
              </Link>
            </div>
          </div>

          <div className="border border-white/8 bg-white/[0.02] p-5">
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Nhìn nhanh</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {pricingPlans.map((plan, index) => {
                const style = LEGAL_TONE_STYLES[plan.tone];

                return (
                  <motion.article
                    key={plan.name}
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : index * 0.07,
                      ease: "easeOut",
                    }}
                    className={`border ${style.border} bg-[rgba(11,11,12,0.92)] p-4`}
                  >
                    <p className={`supporthr-mono text-[10px] uppercase tracking-[0.2em] ${style.label}`}>
                      {plan.highlightLabel}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-white">{plan.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{plan.audience}</p>
                    <p className="mt-4 text-sm font-medium text-white">{plan.price}</p>
                    <p className="mt-1 text-sm text-zinc-500">{plan.capacity}</p>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">{plan.summary}</p>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-400">
                      {plan.features.slice(0, 2).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className={`mt-[0.55rem] h-1.5 w-1.5 shrink-0 ${style.dot}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
