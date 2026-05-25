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
          <div className="flex min-h-[57px] items-center border-b border-zinc-900 px-6 py-2 sm:pl-10 lg:border-b-0 lg:border-r lg:pl-16">
            <p className="supporthr-mono max-w-[14rem] text-[10px] uppercase leading-relaxed tracking-[0.2em] text-zinc-500">
              Gan voi nhung thuong hieu ma recruiter da quen trong he sinh thai cong viec.
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
                  className="group flex min-h-[57px] w-[133px] flex-none items-center justify-center border-r border-zinc-900 px-5 py-2 sm:w-[162px] lg:w-[185px]"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-[26px] w-auto max-w-[95px] object-contain opacity-80 transition-all duration-300 group-hover:opacity-100"
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
