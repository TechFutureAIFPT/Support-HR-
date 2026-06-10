import { motion, useReducedMotion } from "framer-motion";

interface Partner {
  name: string;
  logo: string;
}

interface PartnerTickerSectionProps {
  partners: Partner[];
}

const proofMetrics = [
  { value: "70%", label: "thời gian sàng lọc có thể được rút ngắn" },
  { value: "100%", label: "tiêu chí đánh giá được chuẩn hóa theo JD" },
  { value: "20+", label: "hồ sơ có thể xử lý trong một phiên tuyển dụng" },
  { value: "4 nhóm", label: "đội HR nội bộ, agency, SME và doanh nghiệp mở rộng" },
];

export default function PartnerTickerSection({
  partners,
}: PartnerTickerSectionProps) {
  const reduceMotion = useReducedMotion();
  const tickerItems = [...partners, ...partners];

  return (
    <section className="border-y border-blue-100 bg-white">
      <div className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.35fr] lg:items-center">
          <div>
            <p className="text-base font-semibold leading-7 text-slate-900">
              Được thiết kế cho các đội ngũ tuyển dụng cần tốc độ, độ chính xác và khả năng giải trình.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Logo khách hàng và đối tác có thể đặt tại đây theo nhóm doanh nghiệp công nghệ, nhân sự, đào tạo, tài chính và bán lẻ.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {proofMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-2xl font-black text-blue-700">{metric.value}</p>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-blue-100">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

          <motion.div
            animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
            transition={reduceMotion ? undefined : { duration: 28, ease: "linear", repeat: Infinity }}
            className="flex w-max"
          >
            {tickerItems.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="group flex min-h-[74px] w-[142px] flex-none items-center justify-center border-r border-blue-100 px-5 py-3 sm:w-[174px] lg:w-[205px]"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-[28px] w-auto max-w-[105px] object-contain opacity-55 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
