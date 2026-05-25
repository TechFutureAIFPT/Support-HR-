import {
  BriefcaseBusiness,
  Check,
  CircleMinus,
  FileSearch,
  Files,
  History,
  ListChecks,
  ScanSearch,
} from "lucide-react";

const comparisonRows = [
  {
    title: "Xử lý nhiều CV trong cùng một quy trình",
    detail: "Khi khối lượng CV lớn, việc gom mọi bước về cùng một bề mặt giúp đội ngũ ít bị vỡ mạch hơn.",
    generalAi: "Thường phải tách từng việc nhỏ rồi nối kết quả lại bằng tay.",
    supportHr: "Giữ toàn bộ phiên sàng lọc trong một luồng làm việc xuyên suốt.",
    Icon: Files,
  },
  {
    title: "Đọc file scan và dữ liệu tổng hợp",
    detail: "Nguồn CV trong thực tế rất lẫn lộn: PDF, ảnh scan, thư mục cũ, bảng tổng hợp ứng viên.",
    generalAi: "Dễ phát sinh bước làm sạch hoặc chuyển đổi thủ công trước khi dùng.",
    supportHr: "Hỗ trợ OCR và luồng nhập rõ ràng để giảm công đoạn chuẩn bị ban đầu.",
    Icon: ScanSearch,
  },
  {
    title: "Đối chiếu theo đúng một JD cụ thể",
    detail: "Điều quan trọng không chỉ là đọc CV, mà là đọc trong đúng ngữ cảnh vị trí đang tuyển.",
    generalAi: "Thường trả lời theo từng tệp riêng lẻ, khó giữ cùng một chuẩn so sánh.",
    supportHr: "Giữ xuyên suốt ngữ cảnh vị trí, tiêu chí và mức ưu tiên trong cả phiên.",
    Icon: FileSearch,
  },
  {
    title: "Tạo danh sách đề cử để chia sẻ nội bộ",
    detail: "Đầu ra tốt phải đủ gọn để bàn giao cho người quản lý tuyển dụng hoặc hội đồng phỏng vấn.",
    generalAi: "Kết quả thường cần tổng hợp lại trước khi đưa sang vòng tiếp theo.",
    supportHr: "Có sẵn danh sách đề cử, lý do đánh giá và bề mặt trao đổi cho cả đội.",
    Icon: ListChecks,
  },
  {
    title: "Giữ lịch sử và trạng thái của phiên",
    detail: "Một quy trình tuyển dụng hiếm khi xong trong một lần mở màn hình.",
    generalAi: "Dễ đứt mạch khi đổi bước hoặc tải lại trang sau một khoảng làm việc.",
    supportHr: "Ghi nhớ trạng thái gần nhất để người dùng quay lại đúng chỗ đang làm dở.",
    Icon: History,
  },
  {
    title: "Phù hợp với mục tiêu sản phẩm",
    detail: "Đội ngũ business thường mua một công cụ vận hành, không phải một ô chat đa dụng.",
    generalAi: "Là công cụ chung, linh hoạt nhưng không tối ưu cho tuyển dụng theo quy trình.",
    supportHr: "Là không gian làm việc chuyên cho sàng lọc, rà soát và bàn giao ứng viên.",
    Icon: BriefcaseBusiness,
  },
];

const comparisonHighlights = [
  "Một quy trình xuyên suốt từ JD đến danh sách đề cử.",
  "Ít thao tác vòng lại hơn khi nhập, đọc và đối chiếu CV.",
  "Giữ được lý do đánh giá để chia sẻ với đội ngũ tuyển dụng.",
];

function ColumnCell({
  tone,
  children,
}: {
  tone: "general" | "support";
  children: string;
}) {
  const isSupport = tone === "support";

  return (
    <div
      className={`relative h-full border px-5 py-5 ${
        isSupport
          ? "border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(245,214,187,0.08),rgba(245,214,187,0.03))]"
          : "border-white/8 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border ${
            isSupport
              ? "border-[#f5d6bb]/24 bg-[#f5d6bb]/10 text-[#f5d6bb]"
              : "border-white/10 bg-black/45 text-zinc-500"
          }`}
        >
          {isSupport ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleMinus className="h-3.5 w-3.5" aria-hidden="true" />}
        </span>
        <p className={`text-sm leading-7 ${isSupport ? "font-medium text-zinc-100" : "text-zinc-400"}`}>{children}</p>
      </div>
    </div>
  );
}

const ComparisonTable = () => {
  return (
    <div className="mx-auto w-full max-w-[92rem]">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] xl:items-start">
        <div className="max-w-[32rem]">
          <p className="supporthr-mono text-[11px] uppercase tracking-[0.24em] text-[#f5d6bb]/75">
            Support HR // Ma trận so sánh
          </p>
          <h2 className="home-section-heading mt-6 max-w-[18ch] text-white">
            So sánh theo đúng nhu cầu vận hành tuyển dụng.
          </h2>
          <p className="mt-6 text-base leading-8 text-zinc-400 sm:text-lg">
            Phần khác biệt lớn nhất không nằm ở việc “có AI hay không”, mà ở việc sản phẩm có giữ được cả quy trình
            tuyển dụng trên cùng một bề mặt làm việc hay không.
          </p>

          <div className="mt-8 grid gap-3">
            {comparisonHighlights.map((highlight, index) => (
              <div key={highlight} className="border border-white/8 bg-white/[0.02] px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="supporthr-mono mt-0.5 text-[11px] uppercase tracking-[0.18em] text-[#f5d6bb]/70">
                    /0{index + 1}
                  </span>
                  <p className="text-sm leading-7 text-zinc-300">{highlight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/[0.08] bg-black/80">
          <div className="hidden lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="border-b border-r border-white/8 px-5 py-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Tiêu chí</p>
            </div>
            <div className="border-b border-r border-white/8 px-5 py-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">AI đa dụng</p>
            </div>
            <div className="border-b border-[#f5d6bb]/18 bg-[#f5d6bb]/[0.05] px-5 py-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]">Support HR</p>
            </div>

            {comparisonRows.map(({ title, detail, generalAi, supportHr, Icon }) => (
              <>
                <div key={`${title}-meta`} className="border-r border-t border-white/8 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/[0.03] text-[#f5d6bb]">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{detail}</p>
                    </div>
                  </div>
                </div>
                <div key={`${title}-general`} className="border-r border-t border-white/8 p-4">
                  <ColumnCell tone="general">{generalAi}</ColumnCell>
                </div>
                <div key={`${title}-support`} className="border-t border-[#f5d6bb]/18 bg-[#f5d6bb]/[0.03] p-4">
                  <ColumnCell tone="support">{supportHr}</ColumnCell>
                </div>
              </>
            ))}
          </div>

          <div className="grid gap-4 p-4 lg:hidden">
            {comparisonRows.map(({ title, detail, generalAi, supportHr, Icon }) => (
              <article key={title} className="border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/[0.03] text-[#f5d6bb]">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">{detail}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <p className="supporthr-mono mb-2 text-[10px] uppercase tracking-[0.22em] text-zinc-500">AI đa dụng</p>
                    <ColumnCell tone="general">{generalAi}</ColumnCell>
                  </div>
                  <div>
                    <p className="supporthr-mono mb-2 text-[10px] uppercase tracking-[0.22em] text-[#f5d6bb]">Support HR</p>
                    <ColumnCell tone="support">{supportHr}</ColumnCell>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
