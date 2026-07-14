import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";

const sections = [
  { id: "definitions", title: "Định nghĩa", icon: "fa-book", tone: "cyan" },
  { id: "intellectual-property", title: "Sở hữu trí tuệ", icon: "fa-lightbulb", tone: "emerald" },
  { id: "ai-disclaimer", title: "AI và miễn trừ", icon: "fa-robot", tone: "violet" },
  { id: "responsibility", title: "Trách nhiệm", icon: "fa-scale-balanced", tone: "sky" },
  { id: "limitation", title: "Giới hạn trách nhiệm", icon: "fa-ban", tone: "amber" },
  { id: "sla-bcp", title: "SLA và BCP", icon: "fa-server", tone: "rose" },
] satisfies LegalSectionMeta[];

const TermsPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("definitions");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "definitions":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="cyan" icon="fa-cubes" title="Dịch vụ">
                <p>
                  Nền tảng Support HR bao gồm toàn bộ tính năng chuẩn hóa JD, OCR, chấm điểm AI, API và giao diện phục
                  vụ quy trình tuyển dụng.
                </p>
              </LegalCard>

              <LegalCard tone="cyan" icon="fa-user-group" title="Khách hàng">
                <p>Cá nhân hoặc tổ chức đăng ký tài khoản và sử dụng dịch vụ của Support HR cho mục đích tuyển dụng.</p>
              </LegalCard>

              <LegalCard tone="cyan" icon="fa-folder-open" title="Dữ liệu khách hàng">
                <p>
                  Bao gồm mọi thông tin, văn bản, hình ảnh, JD, CV hoặc tài liệu được tải lên, nhập vào hoặc gửi qua hệ
                  thống.
                </p>
              </LegalCard>

              <LegalCard tone="cyan" icon="fa-wand-magic-sparkles" title="Đầu ra AI">
                <p>
                  Bao gồm bảng điểm, gợi ý, xếp hạng và các nội dung được tạo ra từ quá trình xử lý dữ liệu bằng mô
                  hình AI.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "intellectual-property":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-user-check" title="Quyền sở hữu của Khách hàng" badge="2.1">
              <p>
                Khách hàng giữ toàn quyền sở hữu, quyền tác giả và lợi ích hợp pháp đối với dữ liệu tuyển dụng, hồ sơ
                ứng viên và các tài liệu tải lên.
              </p>
            </LegalCard>

            <LegalCard tone="sky" icon="fa-code" title="Quyền sở hữu của Support HR" badge="2.2">
              <p>Support HR sở hữu toàn bộ thành phần cốt lõi của dịch vụ, bao gồm nhưng không giới hạn ở:</p>
              <LegalBulletGrid
                tone="sky"
                columns={2}
                items={["Mã nguồn và giao diện", "Thuật toán WSM", "Quy trình xử lý hai lớp", "Tài liệu kỹ thuật"]}
              />
            </LegalCard>

            <LegalCard tone="violet" icon="fa-key" title="Cấp phép sử dụng dữ liệu" badge="2.3">
              <p>
                Khách hàng cấp cho Support HR giấy phép toàn cầu, không độc quyền và miễn phí bản quyền để truy cập, sao
                chép, lưu trữ và xử lý dữ liệu duy nhất cho mục đích cung cấp dịch vụ.
              </p>
            </LegalCard>
          </div>
        );

      case "ai-disclaimer":
        return (
          <div className="space-y-4">
            <LegalCallout tone="violet" icon="fa-circle-info" title="Bản chất của đầu ra AI">
              Dịch vụ tích hợp các mô hình ngôn ngữ lớn từ bên thứ ba. Do tính chất xác suất của công nghệ này, đầu ra
              AI có thể không hoàn toàn chính xác hoặc đầy đủ trong mọi trường hợp.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="amber" icon="fa-triangle-exclamation" title="Tính chính xác" badge="3.1">
                <p>
                  Các tính năng AI có thể phát sinh kết quả sai lệch hoặc không đầy đủ. Khách hàng cần tự đánh giá lại
                  đầu ra trước khi dùng cho quyết định tuyển dụng.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-user-shield" title="Giữ vòng kiểm duyệt của con người" badge="3.2">
                <p>
                  Support HR là công cụ hỗ trợ ra quyết định, không phải hệ thống tự động thay thế hoàn toàn chuyên viên
                  tuyển dụng hoặc quản lý tuyển dụng.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "responsibility":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-gavel" title="Tuân thủ luật lao động" badge="4.1">
              <p>Khách hàng chịu trách nhiệm đảm bảo cách sử dụng dịch vụ tuân thủ đầy đủ các quy định hiện hành:</p>
              <LegalBulletGrid
                tone="sky"
                columns={2}
                items={["Bộ luật Lao động Việt Nam", "Quy định chống phân biệt đối xử"]}
              />
            </LegalCard>

            <LegalCard tone="rose" icon="fa-shield-virus" title="Dữ liệu bị cấm tải lên" badge="4.2">
              <p>Khách hàng cam kết không tải lên hệ thống các nhóm dữ liệu hoặc nội dung sau:</p>
              <LegalBulletGrid
                tone="rose"
                columns={1}
                items={[
                  "Dữ liệu thuộc danh mục bí mật nhà nước",
                  "Nội dung vi phạm pháp luật hoặc thuần phong mỹ tục",
                  "Mã độc, virus hoặc phần mềm nhằm mục đích tấn công",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "limitation":
        return (
          <div className="space-y-4">
            <LegalCallout tone="amber" icon="fa-scale-unbalanced-flip" title="Giới hạn trách nhiệm tối đa theo pháp luật">
              Trong phạm vi tối đa pháp luật cho phép, trách nhiệm của Support HR được giới hạn theo các điều khoản dưới
              đây.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="amber" icon="fa-arrow-trend-down" title="Thiệt hại gián tiếp không thuộc phạm vi bồi thường" badge="A">
                <p>Support HR sẽ không chịu trách nhiệm đối với các tổn thất gián tiếp, đặc biệt hoặc mang tính hệ quả.</p>
                <LegalBulletGrid tone="amber" columns={1} items={["Mất lợi nhuận", "Mất dữ liệu", "Gián đoạn kinh doanh"]} />
              </LegalCard>

              <LegalCard tone="rose" icon="fa-wallet" title="Trần trách nhiệm tài chính" badge="B">
                <p>
                  Tổng trách nhiệm pháp lý của Support HR đối với một khiếu nại sẽ không vượt quá số tiền Khách hàng đã
                  thanh toán trong ba tháng gần nhất trước thời điểm phát sinh sự kiện.
                </p>
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-center">
                  <p className="text-3xl font-black text-rose-600">03 THÁNG</p>
                  <p className="mt-1 text-sm text-rose-500">Khoảng thời gian tính trần trách nhiệm</p>
                </div>
              </LegalCard>
            </div>
          </div>
        );

      case "sla-bcp":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-signal" title="Mục tiêu sẵn sàng hệ thống" badge="6.1">
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600">Mục tiêu SLA</p>
                  <p className="mt-2 text-3xl font-black text-emerald-700">99.0%</p>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-600">
                  Support HR cam kết nỗ lực hợp lý về mặt thương mại để duy trì dịch vụ ổn định, ngoại trừ các khoảng
                  bảo trì định kỳ hoặc sự cố bất khả kháng ngoài phạm vi kiểm soát.
                </p>
              </div>
            </LegalCard>

            <LegalCard tone="rose" icon="fa-arrows-rotate" title="Kế hoạch dự phòng đối tác" badge="6.2">
              <p>
                Hệ thống được xây dựng với mục tiêu giảm phụ thuộc độc quyền vào một nhà cung cấp duy nhất, nhằm duy trì
                khả năng chuyển đổi khi cần.
              </p>
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">Thông báo thay đổi</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Thông báo cho Khách hàng trước ít nhất 30 ngày, trừ trường hợp khẩn cấp hoặc phát sinh ngoài dự đoán.
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">Chuyển đổi kỹ thuật</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Duy trì nỗ lực kỹ thuật hợp lý để chuyển sang giải pháp thay thế tương đương khi cần bảo toàn vận
                    hành.
                  </p>
                </div>
              </div>
            </LegalCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Điều khoản"
      title="Điều khoản sử dụng dịch vụ"
      subtitle="Điều khoản sử dụng dịch vụ Support HR — trình bày theo từng mục rõ ràng để doanh nghiệp dễ rà soát khi đánh giá pháp lý và vận hành."
      meta="Phiên bản chính thức · Hiệu lực 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Bảo mật", to: "/privacy-policy" }}
      headerTabs={productDocsTabs}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default TermsPage;
