import { Link } from "react-router-dom";
import { pricingPlans } from "@/pages/info/business-docs-data";
import { LEGAL_TONE_STYLES } from "@/pages/info/legal-ui";

export default function PricingSection() {
  return (
    <section id="pricing" className="border-b border-white/[0.08] bg-black py-24 sm:py-28">
      <div className="home-section-frame">
        <div className="max-w-[52rem]">
          <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-[#f5d6bb]/75">
            Support HR // Pricing
          </p>
          <h2 className="home-section-heading mt-6 text-white">
            Goi gia theo quy mo doi ngu va cach van hanh tuyen dung.
          </h2>
          <p className="mt-6 max-w-[42rem] text-base leading-8 text-zinc-400 sm:text-lg">
            Bang gia tren homepage giup khach moi nhin nhanh package nao phu hop. Trang pricing day du se giai thich
            them pham vi goi, onboarding, va cach chon option phu hop voi quy mo doanh nghiep.
          </p>
        </div>

        <div className="mt-12 grid gap-4 xl:grid-cols-3">
          {pricingPlans.map((plan) => {
            const style = LEGAL_TONE_STYLES[plan.tone];

            return (
              <article key={plan.name} className={`border ${style.border} bg-white/[0.02] p-6`}>
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
                    Xem chi tiet
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
