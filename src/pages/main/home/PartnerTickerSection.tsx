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
    <section className="border-y border-zinc-900 bg-black">
      <div className="mx-auto max-w-full">
        <div className="grid lg:grid-cols-[280px_1fr]">
          <div className="flex min-h-[72px] items-center border-b border-zinc-900 py-3 pl-6 sm:pl-10 lg:pl-16 pr-6 lg:border-b-0 lg:border-r">
            <p className="supporthr-mono max-w-[13rem] text-[10px] uppercase leading-relaxed tracking-[0.2em] text-zinc-500">
              Được tin dùng bởi các doanh nghiệp hiện đại.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent" />

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
                  className="group flex min-h-[72px] w-[140px] flex-none items-center justify-center border-r border-zinc-900 px-6 py-3 sm:w-[170px] lg:w-[195px]"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-7 w-auto max-w-[100px] object-contain opacity-80 transition-all duration-300 group-hover:opacity-100"
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
