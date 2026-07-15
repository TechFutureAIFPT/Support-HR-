import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DocsFooter, DocsTopBar } from "./legal-ui";

type Platform = "web" | "mobile";

type GuideStep = {
  title: string;
  body: string;
  result: string;
  image: string;
  targetRoute: string;
  targetLabel: string;
};

const webSteps: GuideStep[] = [
  {
    title: "Bắt đầu phiên và nạp JD",
    body: "Từ trang đầu, kéo thả JD hoặc chọn file từ máy/Google Drive. Hệ thống hiển thị nội dung đọc được ở khung bên phải.",
    result: "JD được nạp và sẵn sàng để trích xuất điều kiện tuyển dụng.",
    image: "/images/docs/web/01-upload-jd.png",
    targetRoute: "/",
    targetLabel: "Mở màn hình Nạp JD",
  },
  {
    title: "Chọn mẫu hoặc chuẩn hóa JD",
    body: "Nếu chưa có bản mô tả hoàn chỉnh, mở thư viện mẫu để chọn nội dung phù hợp rồi điều chỉnh theo vị trí thực tế.",
    result: "Có một bản JD rõ yêu cầu, địa điểm, kinh nghiệm và kỹ năng bắt buộc.",
    image: "/images/docs/web/02-jd-templates.png",
    targetRoute: "/docs/jd-templates",
    targetLabel: "Xem tài liệu Mẫu JD",
  },
  {
    title: "Nạp CV ứng viên",
    body: "Sau khi xác nhận JD, chuyển sang bước Nạp CV và chọn các hồ sơ cần sàng lọc trong cùng một phiên.",
    result: "Danh sách file hợp lệ xuất hiện trước khi thiết lập tiêu chí.",
    image: "/images/docs/web/03-upload-cv.png",
    targetRoute: "/process",
    targetLabel: "Xem toàn bộ quy trình",
  },
  {
    title: "Thiết lập bộ lọc và trọng số",
    body: "Rà lại điều kiện bắt buộc và mức độ quan trọng của từng tiêu chí. Không giữ các yêu cầu mà JD không nêu rõ.",
    result: "Bộ tiêu chí phản ánh đúng nhu cầu tuyển dụng trước khi chạy phân tích.",
    image: "/images/docs/web/04-weights-filter.png",
    targetRoute: "/ai-methodology",
    targetLabel: "Xem phương pháp đánh giá",
  },
  {
    title: "Xem kết quả có bằng chứng",
    body: "Đọc điểm phù hợp, cảnh báo và bằng chứng lấy từ CV. Mục nào không có dữ liệu phải được HR rà soát thay vì suy đoán.",
    result: "HR có danh sách ưu tiên và lý do đủ rõ để ra quyết định tiếp theo.",
    image: "/images/docs/web/05-results.png",
    targetRoute: "/security",
    targetLabel: "Xem nguyên tắc dữ liệu",
  },
  {
    title: "Xem dashboard, lịch sử và thư viện CV",
    body: "Sau phiên phân tích, mở thống kê hoặc thư viện để xem lại kết quả đã lưu và tiếp tục xử lý ứng viên.",
    result: "Kết quả được giữ theo phiên và có thể tra cứu lại khi cần.",
    image: "/images/docs/web/06-dashboard.png",
    targetRoute: "/docs/cv-library",
    targetLabel: "Xem tài liệu Kho CV",
  },
];

const mobileSteps: GuideStep[] = [
  {
    title: "Đăng nhập và đồng bộ tài khoản",
    body: "Mở mục tài khoản, đăng nhập bằng email hoặc Google để nhận dữ liệu đã đồng bộ từ Website.",
    result: "Tài khoản sẵn sàng nhận lịch sử, mẫu JD và hồ sơ đã lưu.",
    image: "/images/docs/mobile/06-mobile-account.png",
    targetRoute: "/integrations",
    targetLabel: "Xem cách đồng bộ",
  },
  {
    title: "Chấm điểm CV nhanh",
    body: "Trong tab Công cụ, chọn Chấm điểm CV nhanh rồi chụp hoặc tải tối đa ba hồ sơ trong một lượt.",
    result: "CV được đưa vào luồng đánh giá nhanh trên điện thoại.",
    image: "/images/docs/mobile/02-mobile-quick-cv.png",
    targetRoute: "/ai-methodology",
    targetLabel: "Xem phương pháp đánh giá",
  },
  {
    title: "Xem kết quả ứng viên",
    body: "Mở Bảng điều khiển HR để theo dõi phiên lọc gần đây và truy cập nhanh hồ sơ cần xử lý.",
    result: "Những kết quả đã đồng bộ được đặt trong luồng công việc hằng ngày.",
    image: "/images/docs/mobile/01-mobile-home.png",
    targetRoute: "/process",
    targetLabel: "Xem quy trình sàng lọc",
  },
  {
    title: "Xem ứng viên, lịch sử và mẫu JD",
    body: "Tab Hồ sơ tập hợp danh sách ứng viên, các phiên lọc trước và mẫu JD đã lưu.",
    result: "Có thể quay lại dữ liệu tuyển dụng mà không cần tìm lại file gốc.",
    image: "/images/docs/mobile/03-mobile-records.png",
    targetRoute: "/docs/cv-library",
    targetLabel: "Xem tài liệu Kho CV",
  },
  {
    title: "Dùng chatbot và chuẩn hóa JD",
    body: "Tab Công cụ cung cấp chatbot tuyển dụng, chấm CV nhanh và màn hình chuẩn hóa JD từ file hoặc nội dung dán.",
    result: "Các công cụ hỗ trợ tuyển dụng được gom trong một khu vực nhất quán.",
    image: "/images/docs/mobile/05-mobile-jd-standardizer.png",
    targetRoute: "/docs/jd-standardizer",
    targetLabel: "Xem tài liệu Chuẩn hóa JD",
  },
  {
    title: "Quản lý công cụ và dữ liệu",
    body: "Dùng màn hình Công cụ để chuyển nhanh giữa các tác vụ; kiểm tra trạng thái đồng bộ trước khi làm việc trên thiết bị khác.",
    result: "Quy trình trên mobile tiếp nối dữ liệu từ Website mà không thay thế bước duyệt của HR.",
    image: "/images/docs/mobile/04-mobile-tools.png",
    targetRoute: "/security",
    targetLabel: "Xem bảo mật dữ liệu",
  },
];

const navSections = [
  { id: "huong-dan", label: "Hướng dẫn sử dụng", icon: "fa-book-open" },
  { id: "tinh-huong", label: "Tình huống sử dụng", icon: "fa-briefcase" },
  { id: "kho-cv", label: "Kho lưu trữ CV", icon: "fa-box-archive" },
  { id: "mau-jd", label: "Mẫu JD", icon: "fa-file-lines" },
  { id: "chuan-hoa-jd", label: "Chuẩn hóa JD", icon: "fa-wand-magic-sparkles" },
  { id: "tich-hop", label: "Tích hợp", icon: "fa-plug" },
];

type FeatureDoc = {
  eyebrow: string;
  title: string;
  summary: string;
  icon: string;
  capabilities: { title: string; body: string; icon: string }[];
  steps: string[];
  note: string;
};

const featureDocs: Record<string, FeatureDoc> = {
  "kho-cv": {
    eyebrow: "Tài liệu tính năng",
    title: "Kho lưu trữ CV",
    summary: "Theo dõi hồ sơ ứng viên, lịch sử sàng lọc và kết quả đã đồng bộ trong một khu vực dễ tra cứu.",
    icon: "fa-box-archive",
    capabilities: [
      { title: "Hồ sơ tập trung", body: "Tập hợp ứng viên từ các phiên sàng lọc để HR không phải tìm lại từng file.", icon: "fa-users" },
      { title: "Lịch sử có ngữ cảnh", body: "Mỗi kết quả giữ thông tin JD, thời điểm phân tích và kết luận phục vụ rà soát.", icon: "fa-clock-rotate-left" },
      { title: "Đồng bộ đa thiết bị", body: "Dữ liệu đã đồng bộ có thể được xem lại trên Website và App mobile.", icon: "fa-rotate" },
    ],
    steps: [
      "Mở Thư viện CV hoặc mục Hồ sơ trên App mobile.",
      "Chọn ứng viên hoặc phiên sàng lọc cần xem lại.",
      "Đối chiếu kết quả, bằng chứng và cảnh báo trước khi tiếp tục quy trình.",
    ],
    note: "Chỉ những dữ liệu đã được lưu hoặc đồng bộ mới xuất hiện trong kho. HR vẫn là người quyết định bước tuyển dụng tiếp theo.",
  },
  "mau-jd": {
    eyebrow: "Tài liệu tính năng",
    title: "Mẫu JD",
    summary: "Tạo, lưu và sử dụng lại mô tả công việc để khởi động phiên tuyển dụng nhanh hơn mà vẫn giữ tiêu chí nhất quán.",
    icon: "fa-file-lines",
    capabilities: [
      { title: "Mẫu theo nhóm nghề", body: "Phân loại mẫu theo ngành và vị trí để tìm đúng nội dung nhanh hơn.", icon: "fa-layer-group" },
      { title: "Tái sử dụng có kiểm soát", body: "Chọn mẫu làm điểm bắt đầu rồi điều chỉnh theo yêu cầu thực tế của đợt tuyển dụng.", icon: "fa-copy" },
      { title: "Lịch sử hoạt động", body: "Theo dõi các mẫu đã dùng gần đây và nội dung đã lưu.", icon: "fa-clock-rotate-left" },
    ],
    steps: [
      "Mở Mẫu JD từ sidebar hoặc nút Mẫu tại màn hình Nạp JD.",
      "Tìm theo ngành nghề hoặc chọn mẫu đã lưu.",
      "Kiểm tra nội dung, nhấn Sử dụng và chỉnh lại trước khi nạp CV.",
    ],
    note: "Mẫu JD là nội dung tham khảo. Cần kiểm tra lại địa điểm, kinh nghiệm, kỹ năng bắt buộc và các điều kiện pháp lý trước khi đăng tuyển.",
  },
  "chuan-hoa-jd": {
    eyebrow: "Tài liệu tính năng",
    title: "Chuẩn hóa JD",
    summary: "Kiểm tra phần còn thiếu, làm rõ yêu cầu tuyển dụng và tạo một bản JD dễ đọc trước khi dùng để sàng lọc CV.",
    icon: "fa-wand-magic-sparkles",
    capabilities: [
      { title: "Kiểm tra cấu trúc", body: "Rà soát các phần chính như trách nhiệm, yêu cầu, quyền lợi và thông tin làm việc.", icon: "fa-list-check" },
      { title: "Bổ sung thông tin thiếu", body: "Gợi ý các trường cần làm rõ để hạn chế tiêu chí mơ hồ khi đánh giá ứng viên.", icon: "fa-circle-plus" },
      { title: "Đa nguồn đầu vào", body: "Nhận file JD hoặc nội dung dán trực tiếp trên Website và App mobile.", icon: "fa-file-arrow-up" },
    ],
    steps: [
      "Mở Chuẩn hóa JD trong mục Công cụ.",
      "Tải file hoặc dán nội dung JD hiện có.",
      "Rà lại gợi ý, chỉnh nội dung và chỉ sử dụng bản đã được HR xác nhận.",
    ],
    note: "Chuẩn hóa giúp nội dung rõ ràng hơn nhưng không thay thế việc duyệt chính sách tuyển dụng, mức lương và yêu cầu chuyên môn của doanh nghiệp.",
  },
};

const useCases = [
  {
    id: "volume",
    title: "Sàng lọc khối lượng lớn",
    icon: "fa-layer-group",
    iconStyle: "bg-cyan-50 border-cyan-200 text-cyan-600",
    tag: "Tốc độ xử lý",
    tagStyle: "bg-cyan-50 text-cyan-700",
    body: "Đội ngũ có thể dùng Support HR để đưa một lượng lớn ứng viên vào cùng một luồng rà soát, thay vì mở từng CV thủ công trước khi có danh sách đề cử đầu tiên.",
  },
  {
    id: "specialist",
    title: "Vị trí chuyên môn",
    icon: "fa-user-gear",
    iconStyle: "bg-emerald-50 border-emerald-200 text-emerald-600",
    tag: "Chuyên môn sâu",
    tagStyle: "bg-emerald-50 text-emerald-700",
    body: "Với tuyển dụng chuyên môn, quy trình giúp nhà tuyển dụng gom tín hiệu từ JD và so sánh ứng viên nhất quán hơn trước khi bàn giao danh sách đề cử cho người rà soát kỹ thuật.",
  },
  {
    id: "shared",
    title: "Rà soát nhiều bên",
    icon: "fa-people-arrows",
    iconStyle: "bg-sky-50 border-sky-200 text-sky-600",
    tag: "Cộng tác nhóm",
    tagStyle: "bg-sky-50 text-sky-700",
    body: "Recruiter chuẩn bị danh sách đề cử ban đầu. Quản lý tuyển dụng rà soát trên một tập ứng viên gọn hơn. Cả đội nhìn chung một bề mặt thảo luận nhất quán.",
  },
  {
    id: "audit",
    title: "Đề cử dễ rà soát",
    icon: "fa-clipboard-check",
    iconStyle: "bg-violet-50 border-violet-200 text-violet-600",
    tag: "Minh bạch quy trình",
    tagStyle: "bg-violet-50 text-violet-700",
    body: "Lý do đề cử và lịch sử quy trình giúp việc nhìn lại một lần tuyển dụng dễ hơn: ai được đề cử, vì sao, và ngữ cảnh nào đã dẫn đến quyết định đó.",
  },
];

const integrationCards = [
  {
    icon: "fa-folder-open",
    iconStyle: "bg-cyan-50 border-cyan-200 text-cyan-600",
    title: "Google Drive",
    tag: "OAuth 2.0",
    tagStyle: "bg-cyan-50 text-cyan-700",
    body: "Đội ngũ có thể kết nối tài khoản đã đăng nhập và duyệt file tuyển dụng mà không cần rời khỏi luồng sàng lọc.",
  },
  {
    icon: "fa-file-arrow-up",
    iconStyle: "bg-emerald-50 border-emerald-200 text-emerald-600",
    title: "Tải lên trực tiếp",
    tag: "PDF · DOCX · IMG",
    tagStyle: "bg-emerald-50 text-emerald-700",
    body: "Nếu tài liệu chưa nằm trong Drive, người dùng vẫn có thể nhập file trực tiếp và giữ nguyên cùng một quy trình trong sản phẩm.",
  },
  {
    icon: "fa-clock-rotate-left",
    iconStyle: "bg-sky-50 border-sky-200 text-sky-600",
    title: "Ghi nhớ quy trình",
    tag: "Tiếp tục từ chỗ dừng",
    tagStyle: "bg-sky-50 text-sky-700",
    body: "Khôi phục được trạng thái sàng lọc gần đây. Có thể quay lại một phiên rà soát đang làm dở mà không mất ngữ cảnh.",
  },
  {
    icon: "fa-puzzle-piece",
    iconStyle: "bg-violet-50 border-violet-200 text-violet-600",
    title: "Hướng mở rộng",
    tag: "Lộ trình phát triển",
    tagStyle: "bg-violet-50 text-violet-700",
    body: "Đây là bản tóm tắt thực dụng về tích hợp hiện tại. Các kết nối sâu hơn như ATS hay HRIS có thể được mở rộng về sau.",
  },
];

function SectionHeading({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">{label}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[#172033] sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#475467]">{description}</p>
    </div>
  );
}

function FeatureDocSection({ docKey, screenshot }: { docKey: string; screenshot?: string }) {
  const doc = featureDocs[docKey];
  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
      <div className="border-b border-[#e4e7ec] bg-[#f8fafc] px-6 py-6 sm:px-8">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
            <i className={`fa-solid ${doc.icon} text-lg`} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">{doc.eyebrow}</p>
            <h3 className="mt-0.5 text-xl font-bold tracking-[-0.02em] text-[#172033]">{doc.title}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#475467]">{doc.summary}</p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {doc.capabilities.map((cap) => (
            <div key={cap.title} className="rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-5">
              <i className={`fa-solid ${cap.icon} text-[#1d4e89]`} />
              <p className="mt-3 text-sm font-semibold text-[#172033]">{cap.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#475467]">{cap.body}</p>
            </div>
          ))}
        </div>

        {screenshot && (
          <div className="mt-6 overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f8fafc]">
            <div className="flex items-center gap-2 border-b border-[#e4e7ec] bg-white px-4 py-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">Trong sản phẩm</span>
            </div>
            <img
              src={screenshot}
              alt={`Giao diện ${doc.title}`}
              loading="lazy"
              className="w-full"
            />
          </div>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">Cách sử dụng</p>
          {doc.steps.map((step, i) => (
            <div key={step} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d4e89] text-xs font-bold text-[#ffffff]">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-7 text-[#344054]">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-[#b54708]/20 bg-[#b54708]/[0.06] p-5 text-sm leading-7 text-[#7a2e0e]">
          <i className="fa-solid fa-triangle-exclamation mr-2 text-amber-500" />
          <strong>Lưu ý vận hành:</strong> {doc.note}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform: Platform = searchParams.get("platform") === "mobile" ? "mobile" : "web";
  const steps = platform === "web" ? webSteps : mobileSteps;
  const [activeSection, setActiveSection] = useState("huong-dan");
  const observersRef = useRef<IntersectionObserver[]>([]);

  const selectPlatform = (next: Platform) => {
    setSearchParams({ platform: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    observersRef.current.forEach((o) => o.disconnect());
    observersRef.current = [];

    navSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-15% 0px -75% 0px" }
      );
      obs.observe(el);
      observersRef.current.push(obs);
    });

    return () => observersRef.current.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, []);

  return (
    <div className="legal-page-shell min-h-screen bg-[#f6f8fb] text-[#172033]">
      <DocsTopBar brandContext="Hướng dẫn sử dụng" auxiliaryLink={{ label: "Tổng quan tài liệu", to: "/app-docs" }} />

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white px-6 py-8 shadow-[0_8px_24px_rgba(16,24,40,0.05)] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#1d4e89]/[0.08] blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1d4e89]/20 bg-[#1d4e89]/[0.06] px-3 py-1 text-[12px] font-medium text-[#1d4e89]">
                <i className="fa-solid fa-book-open text-[11px]" />
                Trung tâm hướng dẫn SupportHR
              </p>
              <h1 className="text-balance text-4xl font-bold leading-[1.12] tracking-[-0.025em] text-[#172033] sm:text-[46px]">
                Làm chủ quy trình tuyển dụng từ bước đầu tiên
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#475467] sm:text-[17px]">
                Chọn Website hoặc App mobile, làm theo từng bước bằng ảnh chụp thật và mở đúng tính năng khi cần thực hành.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {navSections.slice(0, 4).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollTo(id)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2 text-xs font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                  >
                    <i className={`fa-solid ${icon} text-[11px] text-[#1d4e89]`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-5" aria-label="Chọn nền tảng hướng dẫn">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Bắt đầu nhanh</p>
                <span className="text-xs font-semibold text-[#17915f]">{steps.length} bước</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#172033]">Bạn đang sử dụng nền tảng nào?</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(["web", "mobile"] as Platform[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectPlatform(item)}
                    aria-pressed={platform === item}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-[10px] border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d4e89] ${
                      platform === item
                        ? "border-[#1d4e89] bg-[#1d4e89] text-[#ffffff]"
                        : "border-[#d0d5dd] bg-white text-[#475467] hover:bg-[#f2f4f7]"
                    }`}
                  >
                    <i className={`fa-solid ${item === "web" ? "fa-display" : "fa-mobile-screen-button"}`} />
                    {item === "web" ? "Website" : "Mobile"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollTo("huong-dan")}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1d4e89]/[0.08] px-4 text-sm font-semibold text-[#1d4e89] transition-colors hover:bg-[#1d4e89]/[0.12] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
              >
                Xem từng bước <i className="fa-solid fa-arrow-down text-[10px]" />
              </button>
            </aside>
          </div>
        </header>

        {/* 2-column layout */}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 rounded-xl border border-[#e4e7ec] bg-white p-3 shadow-sm">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Nội dung trang</p>
              <div className="space-y-0.5">
                {navSections.map(({ id, label, icon }) => {
                  const active = activeSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => scrollTo(id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-[#1d4e89]/[0.06] font-semibold text-[#1d4e89]"
                          : "text-[#667085] hover:bg-[#f8fafc] hover:text-[#172033]"
                      }`}
                    >
                      <i className={`fa-solid ${icon} w-4 shrink-0 text-center text-[11px] ${active ? "text-[#1d4e89]" : "text-[#98a2b3]"}`} />
                      <span className="text-left">{label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-20">

            {/* ── Section 1: Hướng dẫn sử dụng ── */}
            <section id="huong-dan" className="scroll-mt-28">
              <SectionHeading
                label="Hướng dẫn trực quan"
                title="Làm quen với Support HR"
                description="Thực hiện từng bước trên Website hoặc App mobile bằng ảnh chụp từ sản phẩm thực tế."
              />

              {/* Platform switcher */}
              <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-[#e4e7ec] bg-[#f6f8fb]/95 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-xl sm:border sm:px-3">
                <div className="flex gap-2 overflow-x-auto">
                  {(["web", "mobile"] as Platform[]).map((item) => {
                    const active = platform === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectPlatform(item)}
                        className={`inline-flex h-10 min-w-fit items-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors ${
                          active ? "bg-[#1d4e89] text-[#ffffff] shadow-sm" : "bg-white text-[#667085] hover:text-[#1d4e89]"
                        }`}
                      >
                        <i className={`fa-solid ${item === "web" ? "fa-display" : "fa-mobile-screen-button"}`} />
                        {item === "web" ? "Website" : "App mobile"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step cards */}
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <article
                    id={`guide-step-${index + 1}`}
                    key={step.title}
                    className="scroll-mt-40 overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.05)]"
                  >
                    <div className={`grid ${platform === "mobile" ? "lg:grid-cols-[minmax(0,1fr)_25rem]" : "xl:grid-cols-[minmax(0,0.8fr)_minmax(30rem,1.2fr)]"}`}>
                      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d4e89] text-sm font-bold text-[#ffffff]">
                          {index + 1}
                        </span>
                        <h3 className="mt-6 text-2xl font-bold tracking-[-0.025em] text-[#172033] sm:text-3xl">{step.title}</h3>
                        <p className="mt-4 text-base leading-7 text-[#475467]">{step.body}</p>
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                          <i className="fa-solid fa-circle-check mr-2 text-emerald-600" />
                          <strong>Kết quả:</strong> {step.result}
                        </div>
                        <Link
                          to={step.targetRoute}
                          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#1d4e89] hover:text-[#163a5f] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                        >
                          {step.targetLabel} <i className="fa-solid fa-arrow-right text-xs" />
                        </Link>
                      </div>
                      <div className={`flex items-center justify-center border-t border-[#e4e7ec] bg-[#f8fafc] p-4 sm:p-6 lg:border-l lg:border-t-0 ${platform === "mobile" ? "min-h-[34rem]" : "min-h-[22rem]"}`}>
                        <img
                          src={step.image}
                          alt={`${step.title} trên ${platform === "web" ? "Website Support HR" : "App mobile Hipo Tools"}`}
                          loading={index > 1 ? "lazy" : "eager"}
                          className={
                            platform === "mobile"
                              ? "max-h-[46rem] w-auto max-w-full rounded-xl border border-[#d0d5dd] bg-white shadow-xl"
                              : "w-full rounded-xl border border-[#d0d5dd] bg-white shadow-lg"
                          }
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ── Section 2: Tình huống sử dụng ── */}
            <section id="tinh-huong" className="scroll-mt-28">
              <SectionHeading
                label="Use cases"
                title="Tình huống vận hành phù hợp"
                description="Ví dụ về nơi Support HR phát huy tốt nhất — lượng đầu vào lớn, vai trò chuyên môn, rà soát nhiều bên và danh sách đề cử có thể truy vết."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {useCases.map((uc) => (
                  <div
                    key={uc.id}
                    className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.05)]"
                  >
                    <div className="flex items-start gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${uc.iconStyle}`}>
                        <i className={`fa-solid ${uc.icon}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold tracking-[-0.02em] text-[#172033]">{uc.title}</h3>
                          <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${uc.tagStyle}`}>{uc.tag}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#475467]">{uc.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f8fafc]">
                <div className="flex items-center gap-2 border-b border-[#e4e7ec] bg-white px-4 py-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tình huống sử dụng · supporthr-tf.com.vn/use-cases</span>
                </div>
                <img src="/images/docs/web/feat-use-cases.png" alt="Tình huống sử dụng Support HR" loading="lazy" className="w-full" />
              </div>
            </section>

            {/* ── Section 3: Kho lưu trữ CV ── */}
            <section id="kho-cv" className="scroll-mt-28">
              <SectionHeading
                label="Records · CV Library"
                title="Kho lưu trữ CV"
                description="Tổng hợp hồ sơ đã lọc từ nhiều phiên, có tìm kiếm, lọc, xem chi tiết và chọn lại ứng viên."
              />
              <FeatureDocSection docKey="kho-cv" screenshot="/images/docs/web/feat-kho-cv.png" />
            </section>

            {/* ── Section 4: Mẫu JD ── */}
            <section id="mau-jd" className="scroll-mt-28">
              <SectionHeading
                label="JD Templates"
                title="Mẫu JD"
                description="Tạo, lưu và sử dụng lại mô tả công việc để khởi động phiên tuyển dụng nhanh hơn."
              />
              <FeatureDocSection docKey="mau-jd" screenshot="/images/docs/web/02-jd-templates.png" />
            </section>

            {/* ── Section 5: Chuẩn hóa JD ── */}
            <section id="chuan-hoa-jd" className="scroll-mt-28">
              <SectionHeading
                label="JD Standardizer"
                title="Chuẩn hóa JD"
                description="Kiểm tra phần còn thiếu và tạo bản JD rõ cấu trúc trước khi dùng để sàng lọc CV."
              />
              <FeatureDocSection docKey="chuan-hoa-jd" screenshot="/images/docs/web/feat-jd-standardizer.png" />
            </section>

            {/* ── Section 6: Tích hợp ── */}
            <section id="tich-hop" className="scroll-mt-28">
              <SectionHeading
                label="Integrations"
                title="Tích hợp và nguồn dữ liệu"
                description="Bản tóm tắt về cách Support HR kết nối với luồng tài liệu hiện tại và vị trí sản phẩm trong vận hành hằng ngày."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {integrationCards.map((card) => (
                  <div
                    key={card.title}
                    className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.05)]"
                  >
                    <div className="flex items-start gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${card.iconStyle}`}>
                        <i className={`fa-solid ${card.icon}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold tracking-[-0.02em] text-[#172033]">{card.title}</h3>
                          <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${card.tagStyle}`}>{card.tag}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#475467]">{card.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f8fafc]">
                <div className="flex items-center gap-2 border-b border-[#e4e7ec] bg-white px-4 py-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tích hợp · supporthr-tf.com.vn/integrations</span>
                </div>
                <img src="/images/docs/web/feat-integrations.png" alt="Tổng quan tích hợp Support HR" loading="lazy" className="w-full" />
              </div>

              {/* Related links */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/security"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc] hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <i className="fa-solid fa-shield-halved text-xs text-[#1d4e89]" />
                  Bảo mật dữ liệu
                  <i className="fa-solid fa-arrow-right text-xs text-slate-400" />
                </Link>
                <Link
                  to="/faq"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc] hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <i className="fa-solid fa-circle-question text-xs text-[#1d4e89]" />
                  Câu hỏi thường gặp
                  <i className="fa-solid fa-arrow-right text-xs text-slate-400" />
                </Link>
                <Link
                  to="/app-docs"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc] hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <i className="fa-solid fa-compass text-xs text-[#1d4e89]" />
                  Tổng quan tài liệu
                  <i className="fa-solid fa-arrow-right text-xs text-slate-400" />
                </Link>
              </div>
            </section>

          </div>
        </div>
      </main>

      <DocsFooter />
    </div>
  );
}
