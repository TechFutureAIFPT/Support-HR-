import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BrainCircuit,
  FileSearch,
  FolderKanban,
  MessageSquareCode,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

type Accent = "cyan" | "emerald" | "violet";

const panelAccent: Record<
  Accent,
  {
    border: string;
    icon: string;
    dot: string;
    label: string;
    hoverSurface: string;
    link: string;
  }
> = {
  cyan: {
    border: "border-cyan-400/20",
    icon: "text-cyan-300",
    dot: "bg-cyan-300",
    label: "text-cyan-300/80",
    hoverSurface: "rgba(5, 28, 33, 0.96)",
    link: "group-hover:text-cyan-200",
  },
  emerald: {
    border: "border-emerald-400/20",
    icon: "text-emerald-300",
    dot: "bg-emerald-300",
    label: "text-emerald-300/80",
    hoverSurface: "rgba(5, 27, 19, 0.96)",
    link: "group-hover:text-emerald-200",
  },
  violet: {
    border: "border-violet-400/20",
    icon: "text-violet-300",
    dot: "bg-violet-300",
    label: "text-violet-300/80",
    hoverSurface: "rgba(16, 11, 32, 0.96)",
    link: "group-hover:text-violet-200",
  },
};

const workflowPanels = [
  {
    label: "JD // CHUẨN HÓA",
    title: "Biến mô tả tuyển dụng thành tín hiệu có cấu trúc",
    description:
      "Support HR tách kỹ năng, seniority, mức ưu tiên và điều kiện bắt buộc để hệ thống chấm điểm nhất quán ngay từ đầu.",
    bullets: ["Tách kỹ năng bắt buộc", "Nhận diện cấp độ vị trí", "Khởi tạo trọng số nền"],
    cta: "Thiết lập đầu vào",
    accent: "cyan" as const,
    Icon: FileSearch,
  },
  {
    label: "CV // HẤP THỤ",
    title: "Nhập hồ sơ hàng loạt mà vẫn giữ độ sạch dữ liệu",
    description:
      "Từ PDF, DOCX đến CV scan, mỗi hồ sơ đều được chuẩn hóa để phục vụ đối sánh và truy vết về sau.",
    bullets: ["OCR cho CV ảnh", "Chuẩn hóa định dạng", "Giữ lịch sử nguồn tải"],
    cta: "Mở luồng nạp CV",
    accent: "emerald" as const,
    Icon: FolderKanban,
  },
  {
    label: "MATCH // ENGINE",
    title: "Chấm điểm và xếp hạng như một bộ máy tuyển dụng riêng",
    description:
      "Không chỉ đọc CV, hệ thống đối sánh sâu theo kỹ năng, kinh nghiệm, mức phù hợp và khoảng cách còn thiếu.",
    bullets: ["Điểm phù hợp có lý do", "Phát hiện khoảng trống kỹ năng", "Ưu tiên ứng viên nổi bật"],
    cta: "Xem logic chấm điểm",
    accent: "violet" as const,
    Icon: BrainCircuit,
  },
  {
    label: "INTERVIEW // PACK",
    title: "Tạo bộ câu hỏi phỏng vấn bám đúng hồ sơ và JD",
    description:
      "Mỗi shortlist đều đi kèm gợi ý hỏi sâu để recruiter và hiring manager đi nhanh mà vẫn giữ chất lượng đánh giá.",
    bullets: ["Câu hỏi theo kỹ năng", "Tình huống theo seniority", "Điểm cần xác thực thêm"],
    cta: "Chuẩn bị vòng phỏng vấn",
    accent: "cyan" as const,
    Icon: MessageSquareCode,
  },
  {
    label: "REVIEW // TEAM",
    title: "Cho phép nhiều người cùng duyệt trong một nhịp thống nhất",
    description:
      "Recruiter, trưởng bộ phận và hội đồng tuyển dụng đều có thể nhìn cùng một bức tranh thay vì trao đổi rời rạc.",
    bullets: ["Danh sách ưu tiên chung", "Ghi chú theo ứng viên", "Luồng phối hợp rõ ràng"],
    cta: "Điều phối shortlist",
    accent: "emerald" as const,
    Icon: UsersRound,
  },
  {
    label: "AUDIT // CONTROL",
    title: "Lưu lại mọi quyết định để báo cáo và truy vết",
    description:
      "Mỗi lần chấm điểm, điều chỉnh trọng số hay chọn ứng viên đều có thể được rà soát lại khi cần báo cáo nội bộ.",
    bullets: ["Lịch sử thay đổi rõ ràng", "Báo cáo cho từng phiên", "Kiểm soát quyết định AI"],
    cta: "Theo dõi toàn bộ phiên",
    accent: "violet" as const,
    Icon: ShieldCheck,
  },
];

interface WorkflowMatrixSectionProps {
  onPrimaryAction: () => void;
}

export default function WorkflowMatrixSection({
  onPrimaryAction,
}: WorkflowMatrixSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="steps" className="relative overflow-hidden border-y border-white/[0.08] bg-black py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.01),transparent_60%)]" />

      <div className="relative home-section-frame">
        <div className="max-w-[76rem]">
          <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            Support HR // Quy trình vận hành
          </p>
          <h2 className="home-section-heading mt-6 max-w-[72rem] font-semibold text-white">
            Điều phối tuyển dụng AI từ một giao diện duy nhất.
          </h2>
          <p className="mt-6 max-w-[56rem] text-base leading-8 text-zinc-400 sm:text-lg">
            Thay cho các bước rời rạc, Support HR gom khâu đọc CV, chấm điểm, chuẩn bị phỏng vấn và phối hợp nội bộ
            thành một hệ thống làm việc mạch lạc và có thể mở rộng.
          </p>
        </div>

        <div className="mt-14 grid gap-px border border-white/[0.07] bg-white/[0.07] lg:grid-cols-2 xl:grid-cols-3">
          {workflowPanels.map(({ label, title, description, bullets, cta, accent, Icon }) => {
            const tone = panelAccent[accent];

            return (
              <motion.article
                key={label}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        backgroundColor: tone.hoverSurface,
                      }
                }
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="group relative min-h-[18rem] overflow-hidden bg-[rgba(7,7,8,0.96)]"
              >
                <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_38%)] opacity-70" />

                <div className="relative z-10 flex h-full flex-col px-7 py-7 lg:px-8 lg:py-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`supporthr-mono text-[10px] uppercase tracking-[0.24em] ${tone.label}`}>
                      {label}
                    </span>
                    <div className={`flex h-9 w-9 items-center justify-center border ${tone.border} bg-black/40 transition-colors duration-200 group-hover:bg-white/[0.03]`}>
                      <Icon className={`h-4 w-4 ${tone.icon}`} />
                    </div>
                  </div>

                  <h3 className="mt-8 max-w-[20rem] text-[1.45rem] font-semibold leading-tight tracking-normal text-white">
                    {title}
                  </h3>
                  <p className="mt-4 max-w-[30rem] text-sm leading-7 text-zinc-400">
                    {description}
                  </p>

                  <ul className="mt-6 space-y-2.5 text-sm text-zinc-300">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className={`mt-[0.45rem] h-1.5 w-1.5 flex-none ${tone.dot} opacity-90`} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    className={`mt-auto inline-flex items-center gap-2 pt-8 supporthr-mono text-[11px] uppercase tracking-[0.2em] text-white transition-colors ${tone.link}`}
                  >
                    {cta}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
