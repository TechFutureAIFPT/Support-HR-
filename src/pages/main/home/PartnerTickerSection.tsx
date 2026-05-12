import { motion, useReducedMotion } from "framer-motion";

interface Partner {
  name: string;
  logo: string;
}

interface PartnerTickerSectionProps {
  partners: Partner[];
}

export default function PartnerTickerSection({
  partners,
}: PartnerTickerSectionProps) {
  const reduceMotion = useReducedMotion();
  const tickerItems = [...partners, ...partners];

  return (
    <section className="border-y border-white/[0.08] bg-[#05070c]/90">
      <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="grid border-x border-white/[0.08] lg:grid-cols-[350px_minmax(0,1fr)]">
          <div className="flex min-h-[104px] items-center border-b border-white/[0.08] px-6 py-6 lg:border-b-0 lg:border-r lg:px-10">
            <p className="supporthr-mono max-w-[14rem] text-[11px] uppercase leading-8 tracking-[0.22em] text-zinc-500">
              Được tin dùng bởi doanh nghiệp và đội tuyển dụng hiện đại.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#05070c] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#05070c] to-transparent" />

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: ["0%", "-50%"],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 26,
                      ease: "linear",
                      repeat: Infinity,
                    }
              }
              className="flex w-max"
            >
              {tickerItems.map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className="group flex min-h-[104px] w-[190px] flex-none items-center justify-center border-r border-white/[0.08] px-8 py-6 sm:w-[220px] lg:w-[245px]"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-11 w-auto max-w-[140px] object-contain opacity-35 grayscale transition-all duration-300 group-hover:opacity-80 group-hover:grayscale-0"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
