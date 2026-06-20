import { Link, useLocation } from "react-router-dom";
import { DocsFooter, DocsTopBar } from "./legal-ui";

type FeatureDoc = {
  eyebrow: string;
  title: string;
  summary: string;
  icon: string;
  capabilities: Array<{ title: string; body: string; icon: string }>;
  steps: string[];
  note: string;
};

const featureDocs: Record<string, FeatureDoc> = {
  "/docs/cv-library": {
    eyebrow: "Tài liệu tính năng",
    title: "Kho lưu trữ CV",
    summary: "Theo dõi hồ sơ ứng viên, lịch sử sàng lọc và kết quả đã đồng bộ trong một khu vực dễ tra cứu.",
    icon: "fa-box-archive",
    capabilities: [
      { title: "Hồ sơ tập trung", body: "Tập hợp ứng viên từ các phiên sàng lọc để HR không phải tìm lại từng file.", icon: "fa-users" },
      { title: "Lịch sử có ngữ cảnh", body: "Mỗi kết quả giữ thông tin JD, thời điểm phân tích và kết luận phục vụ rà soát.", icon: "fa-clock-rotate-left" },
      { title: "Đồng bộ đa thiết bị", body: "Dữ liệu đã đồng bộ có thể được xem lại trên Website và App mobile.", icon: "fa-rotate" },
    ],
    steps: ["Mở Thư viện CV hoặc mục Hồ sơ trên App mobile.", "Chọn ứng viên hoặc phiên sàng lọc cần xem lại.", "Đối chiếu kết quả, bằng chứng và cảnh báo trước khi tiếp tục quy trình."],
    note: "Chỉ những dữ liệu đã được lưu hoặc đồng bộ mới xuất hiện trong kho. HR vẫn là người quyết định bước tuyển dụng tiếp theo.",
  },
  "/docs/jd-templates": {
    eyebrow: "Tài liệu tính năng",
    title: "Mẫu JD",
    summary: "Tạo, lưu và sử dụng lại mô tả công việc để khởi động phiên tuyển dụng nhanh hơn mà vẫn giữ tiêu chí nhất quán.",
    icon: "fa-file-lines",
    capabilities: [
      { title: "Mẫu theo nhóm nghề", body: "Phân loại mẫu theo ngành và vị trí để tìm đúng nội dung nhanh hơn.", icon: "fa-layer-group" },
      { title: "Tái sử dụng có kiểm soát", body: "Chọn mẫu làm điểm bắt đầu rồi điều chỉnh theo yêu cầu thực tế của đợt tuyển dụng.", icon: "fa-copy" },
      { title: "Lịch sử hoạt động", body: "Theo dõi các mẫu đã dùng gần đây và nội dung đã lưu.", icon: "fa-clock-rotate-left" },
    ],
    steps: ["Mở Mẫu JD từ sidebar hoặc nút Mẫu tại màn hình Nạp JD.", "Tìm theo ngành nghề hoặc chọn mẫu đã lưu.", "Kiểm tra nội dung, nhấn Sử dụng và chỉnh lại trước khi nạp CV."],
    note: "Mẫu JD là nội dung tham khảo. Cần kiểm tra lại địa điểm, kinh nghiệm, kỹ năng bắt buộc và các điều kiện pháp lý trước khi đăng tuyển.",
  },
  "/docs/jd-standardizer": {
    eyebrow: "Tài liệu tính năng",
    title: "Chuẩn hóa JD",
    summary: "Kiểm tra phần còn thiếu, làm rõ yêu cầu tuyển dụng và tạo một bản JD dễ đọc trước khi dùng để sàng lọc CV.",
    icon: "fa-wand-magic-sparkles",
    capabilities: [
      { title: "Kiểm tra cấu trúc", body: "Rà soát các phần chính như trách nhiệm, yêu cầu, quyền lợi và thông tin làm việc.", icon: "fa-list-check" },
      { title: "Bổ sung thông tin thiếu", body: "Gợi ý các trường cần làm rõ để hạn chế tiêu chí mơ hồ khi đánh giá ứng viên.", icon: "fa-circle-plus" },
      { title: "Đa nguồn đầu vào", body: "Nhận file JD hoặc nội dung dán trực tiếp trên Website và App mobile.", icon: "fa-file-arrow-up" },
    ],
    steps: ["Mở Chuẩn hóa JD trong mục Công cụ.", "Tải file hoặc dán nội dung JD hiện có.", "Rà lại gợi ý, chỉnh nội dung và chỉ sử dụng bản đã được HR xác nhận."],
    note: "Chuẩn hóa giúp nội dung rõ ràng hơn nhưng không thay thế việc duyệt chính sách tuyển dụng, mức lương và yêu cầu chuyên môn của doanh nghiệp.",
  },
};

export default function ProductFeatureDocsPage() {
  const { pathname } = useLocation();
  const doc = featureDocs[pathname] ?? featureDocs["/docs/cv-library"];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <DocsTopBar brandContext="Trung tâm tài liệu" auxiliaryLink={{ label: "Hướng dẫn sử dụng", to: "/guide" }} />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-[0_24px_70px_rgba(30,64,175,0.08)] sm:p-10 lg:p-14">
          <header className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
              <i className={`fa-solid ${doc.icon}`} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">{doc.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{doc.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{doc.summary}</p>
          </header>

          <section className="mt-12 grid gap-4 md:grid-cols-3">
            {doc.capabilities.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <i className={`fa-solid ${item.icon} text-blue-600`} />
                <h2 className="mt-4 text-base font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </section>

          <section className="mt-12 border-t border-slate-200 pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Cách sử dụng</p>
            <div className="mt-6 space-y-5">
              {doc.steps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                  <p className="pt-1 text-base leading-7 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
            <strong>Lưu ý vận hành:</strong> {doc.note}
          </aside>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
            <Link to="/guide" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              Xem hướng dẫn bằng ảnh <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
            <Link to="/app-docs" className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              Về tổng quan tài liệu
            </Link>
          </div>
        </div>
      </main>
      <DocsFooter />
    </div>
  );
}
