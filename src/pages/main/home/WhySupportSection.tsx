import { motion, useReducedMotion } from "framer-motion";
import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  UserRoundCheck,
} from "lucide-react";

const roleCards = [
  {
    role: "Với Giám đốc nhân sự",
    benefit:
      "Theo dõi hiệu quả tuyển dụng, chất lượng danh sách đề cử và mức độ nhất quán trong đánh giá ứng viên.",
    accent: "text-blue-700",
    surface: "bg-blue-50",
    border: "border-blue-200",
    Icon: ChartNoAxesCombined,
  },
  {
    role: "Với HR Manager",
    benefit:
      "Rút ngắn thời gian xử lý CV, chuẩn hóa quy trình và giảm phụ thuộc vào đánh giá cảm tính.",
    accent: "text-teal-700",
    surface: "bg-teal-50",
    border: "border-teal-200",
    Icon: ClipboardList,
  },
  {
    role: "Với Talent Acquisition",
    benefit:
      "Có danh sách ưu tiên rõ ràng, bằng chứng so khớp và gợi ý câu hỏi để trao đổi nhanh với ứng viên.",
    accent: "text-indigo-700",
    surface: "bg-indigo-50",
    border: "border-indigo-200",
    Icon: UserRoundCheck,
  },
  {
    role: "Với Hiring Manager",
    benefit:
      "Nhận báo cáo ngắn gọn, dễ hiểu, tập trung vào năng lực, kinh nghiệm và mức độ phù hợp với vị trí.",
    accent: "text-sky-700",
    surface: "bg-sky-50",
    border: "border-sky-200",
    Icon: BriefcaseBusiness,
  },
];

export default function WhySupportSection() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -4 };

  return (
    <section className="relative overflow-hidden bg-white pt-0 pb-20 sm:pb-24 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-10" />

      <div className="relative home-section-frame">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(40rem,1.1fr)] xl:items-center">
          <div className="max-w-[42rem]">
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-blue-600">
              Giải pháp theo từng đối tượng
            </p>
            <h2 className="home-section-heading mt-6 max-w-[40rem] font-semibold text-slate-900">
              Mỗi vai trò trong quy trình tuyển dụng nhìn thấy đúng điều họ cần
            </h2>
            <p className="mt-6 max-w-[38rem] text-base leading-8 text-slate-500 sm:text-lg">
              Support HR không chỉ tạo điểm số. Sản phẩm giúp từng người trong quy trình tuyển dụng nhận được đúng loại dữ liệu để phối hợp nhanh hơn và quyết định chắc hơn.
            </p>
          </div>

          <div className="grid self-stretch gap-4 sm:grid-cols-2">
            {roleCards.map(({ role, benefit, accent, surface, border, Icon }, index) => (
              <motion.div
                key={role}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                whileHover={hoverLift}
                transition={{
                  opacity: { duration: 0.42, delay: reduceMotion ? 0 : index * 0.08, ease: "easeOut" },
                  y: { duration: 0.42, delay: reduceMotion ? 0 : index * 0.08, ease: "easeOut" },
                }}
                className={`relative min-h-[13rem] overflow-hidden rounded-2xl border ${border} ${surface} p-6 lg:p-7`}
              >
                <div className="relative z-10">
                  <Icon className={`h-5 w-5 ${accent}`} />
                  <p className={`mt-7 text-[1.35rem] font-bold leading-snug tracking-normal ${accent}`}>
                    {role}
                  </p>
                  <p className="mt-3 max-w-[19rem] text-sm leading-7 text-slate-600">
                    {benefit}
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
