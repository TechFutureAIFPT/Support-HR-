import React, { useEffect, useState } from "react";
import { LegalBulletGrid, LegalCallout, LegalCard, LegalPageLayout, type LegalSectionMeta } from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";

const sections = [
  { id: "policy", title: "Nguyên tắc bảo mật", icon: "fa-shield-halved", tone: "cyan" },
  { id: "storage", title: "Lưu trữ dữ liệu", icon: "fa-database", tone: "emerald" },
  { id: "ops", title: "Quy trình vận hành", icon: "fa-user-lock", tone: "sky" },
] satisfies LegalSectionMeta[];

const SecurityCompliancePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("policy");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "policy":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-lock" title="Nguyên tắc trình bày với khách hàng">
              Support HR nên mô tả bảo mật theo hướng rõ phạm vi, rõ hành động của người dùng và không đưa ra cam kết pháp lý khi đội ngũ chưa chốt chính sách chính thức.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-file-shield" title="Phạm vi xử lý dữ liệu tuyển dụng" badge="Có thể công bố">
              <p>
                Hệ thống chỉ nên dùng dữ liệu phục vụ phiên sàng lọc hiện tại: JD, file CV do người dùng tải lên hoặc file người dùng chủ động chọn từ Google Drive.
              </p>
              <LegalBulletGrid
                tone="cyan"
                items={[
                  "JD được dùng làm chuẩn đối chiếu khi chấm điểm ứng viên.",
                  "CV được xử lý để trích xuất tín hiệu phù hợp với vị trí tuyển dụng.",
                  "Kết quả AI là gợi ý để recruiter rà soát, không thay quyết định cuối cùng của con người.",
                ]}
              />
            </LegalCard>
            <LegalCard tone="sky" icon="fa-circle-info" title="Các cam kết cần chốt trước khi ghi mạnh hơn" badge="Cần xác nhận">
              <LegalBulletGrid
                tone="sky"
                items={[
                  "Có mã hóa dữ liệu lưu trữ hay chỉ mã hóa đường truyền.",
                  "Dữ liệu CV được lưu ở Firestore, server riêng hay chỉ local/session.",
                  "Ai trong nội bộ có quyền xem dữ liệu khách hàng.",
                  "Có quy trình DPA/SLA cho khách doanh nghiệp hay chưa.",
                ]}
              />
            </LegalCard>
          </div>
        );
      case "storage":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-server" title="Vòng đời dữ liệu đề xuất" badge="Khung nội dung">
              <LegalBulletGrid
                tone="emerald"
                items={[
                  "Người dùng đưa JD và CV vào một phiên sàng lọc cụ thể.",
                  "Hệ thống xử lý file để tạo điểm số, giải thích và shortlist có thể rà soát.",
                  "Lịch sử phiên được giữ để người dùng xem lại, bàn giao hoặc tiếp tục phân tích.",
                  "Yêu cầu xóa dữ liệu nên có kênh tiếp nhận rõ ràng và thời gian phản hồi cụ thể.",
                ]}
              />
            </LegalCard>
            <LegalCallout tone="amber" icon="fa-triangle-exclamation" title="Thông tin còn thiếu để hoàn thiện trang">
              Bạn nên cung cấp thời gian lưu dữ liệu, nơi lưu dữ liệu chính, người phụ trách yêu cầu xóa và email tiếp nhận yêu cầu bảo mật. Có đủ 4 ý này thì trang bảo mật sẽ thuyết phục hơn nhiều.
            </LegalCallout>
          </div>
        );
      case "ops":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-user-shield" title="Kiểm soát vận hành" badge="Docs-ready">
              <p>
                Phần vận hành nên nói rõ cách đội ngũ kiểm soát truy cập và phản hồi khi khách hàng cần rà soát. Nội dung dưới đây đủ an toàn để trình bày như định hướng quy trình.
              </p>
              <LegalBulletGrid
                tone="sky"
                items={[
                  "Tài khoản người dùng gắn với phiên làm việc và dữ liệu tuyển dụng của họ.",
                  "Quyền Google Drive chỉ nên dùng cho file người dùng chủ động chọn.",
                  "Các yêu cầu hỗ trợ, xóa dữ liệu hoặc mở rộng tài liệu bảo mật được tiếp nhận qua kênh chính thức.",
                ]}
              />
            </LegalCard>
            <LegalCard tone="rose" icon="fa-clipboard-check" title="Checklist để làm trang uy tín hơn" badge="Cần bạn cung cấp">
              <LegalBulletGrid
                tone="rose"
                items={[
                  "Email bảo mật hoặc người phụ trách bảo mật.",
                  "Thời gian phản hồi yêu cầu xóa dữ liệu.",
                  "Các chứng nhận hoặc trạng thái xác minh hiện có: SSL, OAuth, DMCA, domain.",
                  "Chính sách dùng dữ liệu CV để huấn luyện AI: có dùng hay không dùng.",
                ]}
              />
            </LegalCard>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Bảo mật dữ liệu"
      title="Security and data handling"
      subtitle="Tài liệu mô tả cách Support HR xử lý JD, CV, quyền Google Drive và các điểm cần xác nhận trước khi làm việc với khách hàng doanh nghiệp."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Cách sử dụng", to: "/guide" }}
      brandContext="Tài liệu doanh nghiệp"
      headerTabs={productDocsTabs}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default SecurityCompliancePage;
