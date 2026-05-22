import { Check, Minus } from "lucide-react";

const comparisonRows = [
  {
    criteria: "Xử lý CV hàng loạt",
    generalAi: "Chỉ 1 CV/lần",
    supportHr: "Hàng trăm CV/lần",
  },
  {
    criteria: "Nhận diện CV ảnh (OCR)",
    generalAi: "Hạn chế",
    supportHr: "OCR 99% chính xác",
  },
  {
    criteria: "Phân tích ngữ nghĩa",
    generalAi: "Bề mặt",
    supportHr: "Phân tích sâu",
  },
  {
    criteria: "Chống thiên kiến tuyển dụng",
    generalAi: "Không có",
    supportHr: "Mù hóa dữ liệu",
  },
  {
    criteria: "Tự học & Tiến hóa",
    generalAi: "Không có",
    supportHr: "Tự tiến hóa theo JD",
  },
  {
    criteria: "Tối ưu chi phí",
    generalAi: "Cao",
    supportHr: "Tối ưu hóa",
  },
];

const GeneralStatus = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3 text-zinc-400">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/70 text-zinc-500">
      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
    <span className="text-sm font-medium">{children}</span>
  </div>
);

const SupportStatus = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3 text-zinc-50">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.14)]">
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
    <span className="text-sm font-semibold">{children}</span>
  </div>
);

const ComparisonTable = () => {
  return (
    <div className="mx-auto w-full max-w-[90rem]">
      <div className="hidden overflow-hidden border border-zinc-800 bg-zinc-950 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/35">
              <th className="supporthr-mono w-[38%] px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Tiêu chí
              </th>
              <th className="supporthr-mono w-[29%] border-l border-zinc-800 px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                AI Tổng quát
              </th>
              <th className="supporthr-mono relative w-[33%] border-l border-blue-400/20 bg-blue-900/10 px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-400/5 to-transparent" />
                <span className="relative">Support HR</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr
                key={row.criteria}
                className="group border-b border-zinc-800/80 transition-colors duration-300 last:border-b-0 hover:bg-white/[0.025]"
              >
                <td className="px-6 py-5 text-sm font-semibold text-zinc-100 transition-colors duration-300 group-hover:text-white">
                  {row.criteria}
                </td>
                <td className="border-l border-zinc-800 px-6 py-5">
                  <GeneralStatus>{row.generalAi}</GeneralStatus>
                </td>
                <td className="relative border-l border-blue-400/15 bg-blue-900/10 px-6 py-5 shadow-[inset_16px_0_32px_rgba(30,64,175,0.08)]">
                  <span className="pointer-events-none absolute inset-y-2 left-0 w-px bg-gradient-to-b from-transparent via-blue-300/40 to-transparent opacity-70" />
                  <SupportStatus>{row.supportHr}</SupportStatus>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {comparisonRows.map((row) => (
          <article
            key={row.criteria}
            className="border border-zinc-800 bg-zinc-950 p-4 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50"
          >
            <h3 className="text-sm font-semibold text-white">{row.criteria}</h3>
            <div className="mt-4 grid gap-3">
              <div className="border border-zinc-800 bg-zinc-900/35 p-3">
                <p className="supporthr-mono mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  AI Tổng quát
                </p>
                <GeneralStatus>{row.generalAi}</GeneralStatus>
              </div>
              <div className="border border-blue-400/20 bg-blue-900/10 p-3 shadow-[0_0_28px_rgba(37,99,235,0.08)]">
                <p className="supporthr-mono mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Support HR
                </p>
                <SupportStatus>{row.supportHr}</SupportStatus>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ComparisonTable;
