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
    image: "/images/docs/web/01-upload-jd.png",
    targetRoute: "/process",
    targetLabel: "Xem toàn bộ quy trình",
  },
  {
    title: "Thiết lập bộ lọc và trọng số",
    body: "Rà lại điều kiện bắt buộc và mức độ quan trọng của từng tiêu chí. Không giữ các yêu cầu mà JD không nêu rõ.",
    result: "Bộ tiêu chí phản ánh đúng nhu cầu tuyển dụng trước khi chạy phân tích.",
    image: "/images/docs/web/02-jd-templates.png",
    targetRoute: "/ai-methodology",
    targetLabel: "Xem phương pháp đánh giá",
  },
  {
    title: "Xem kết quả có bằng chứng",
    body: "Đọc điểm phù hợp, cảnh báo và bằng chứng lấy từ CV. Mục nào không có dữ liệu phải được HR rà soát thay vì suy đoán.",
    result: "HR có danh sách ưu tiên và lý do đủ rõ để ra quyết định tiếp theo.",
    image: "/images/docs/web/01-upload-jd.png",
    targetRoute: "/security",
    targetLabel: "Xem nguyên tắc dữ liệu",
  },
  {
    title: "Xem dashboard, lịch sử và thư viện CV",
    body: "Sau phiên phân tích, mở thống kê hoặc thư viện để xem lại kết quả đã lưu và tiếp tục xử lý ứng viên.",
    result: "Kết quả được giữ theo phiên và có thể tra cứu lại khi cần.",
    image: "/images/docs/web/02-jd-templates.png",
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

export default function DemoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform: Platform = searchParams.get("platform") === "mobile" ? "mobile" : "web";
  const steps = platform === "web" ? webSteps : mobileSteps;

  const selectPlatform = (nextPlatform: Platform) => {
    setSearchParams({ platform: nextPlatform });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <DocsTopBar brandContext="Hướng dẫn sử dụng" auxiliaryLink={{ label: "Tổng quan tài liệu", to: "/app-docs" }} />

      <main className="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white px-6 py-10 shadow-[0_24px_70px_rgba(30,64,175,0.08)] sm:px-10 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Hướng dẫn trực quan</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">Làm quen với Support HR</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Thực hiện từng bước trên Website hoặc App mobile bằng ảnh chụp từ sản phẩm thực tế. Dữ liệu cá nhân đã được loại khỏi ảnh công khai.
            </p>
          </div>
        </header>

        <div className="sticky top-[4.45rem] z-30 -mx-4 mt-6 border-y border-blue-100 bg-[#f6f8fc]/95 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
          <div className="flex gap-2 overflow-x-auto">
            {(["web", "mobile"] as Platform[]).map((item) => {
              const active = platform === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectPlatform(item)}
                  className={`inline-flex h-11 min-w-fit items-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors ${active ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 hover:text-blue-700"}`}
                >
                  <i className={`fa-solid ${item === "web" ? "fa-display" : "fa-mobile-screen-button"}`} />
                  {item === "web" ? "Website" : "App mobile"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="sticky top-40 hidden rounded-2xl border border-blue-100 bg-white p-4 lg:block">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Trong hướng dẫn</p>
            <nav className="mt-3 space-y-1">
              {steps.map((step, index) => (
                <a key={step.title} href={`#guide-step-${index + 1}`} className="flex gap-3 rounded-xl px-2 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                  <span className="font-bold text-blue-600">{String(index + 1).padStart(2, "0")}</span>
                  <span>{step.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <article id={`guide-step-${index + 1}`} key={step.title} className="scroll-mt-40 overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_16px_50px_rgba(30,64,175,0.06)]">
                <div className={`grid ${platform === "mobile" ? "lg:grid-cols-[minmax(0,1fr)_25rem]" : "xl:grid-cols-[minmax(0,0.8fr)_minmax(30rem,1.2fr)]"}`}>
                  <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</span>
                    <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{step.title}</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">{step.body}</p>
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                      <i className="fa-solid fa-circle-check mr-2 text-emerald-600" />
                      <strong>Kết quả:</strong> {step.result}
                    </div>
                    <Link to={step.targetRoute} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">
                      {step.targetLabel} <i className="fa-solid fa-arrow-right text-xs" />
                    </Link>
                  </div>

                  <div className={`flex items-center justify-center border-t border-blue-100 bg-slate-50 p-4 sm:p-6 lg:border-l lg:border-t-0 ${platform === "mobile" ? "min-h-[34rem]" : "min-h-[22rem]"}`}>
                    <img
                      src={step.image}
                      alt={`${step.title} trên ${platform === "web" ? "Website Support HR" : "App mobile Hipo Tools"}`}
                      loading={index > 1 ? "lazy" : "eager"}
                      className={platform === "mobile" ? "max-h-[46rem] w-auto max-w-full rounded-[1.5rem] border border-slate-200 bg-white shadow-xl" : "w-full rounded-2xl border border-slate-200 bg-white shadow-lg"}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <DocsFooter />
    </div>
  );
}
