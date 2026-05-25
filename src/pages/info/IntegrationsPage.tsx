import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "drive", title: "Google Drive", icon: "fa-folder-open", tone: "cyan" },
  { id: "uploads", title: "Tải lên trực tiếp", icon: "fa-upload", tone: "emerald" },
  { id: "history", title: "Ghi nhớ workflow", icon: "fa-clock-rotate-left", tone: "sky" },
  { id: "roadmap", title: "Hướng mở rộng", icon: "fa-plug", tone: "violet" },
] satisfies LegalSectionMeta[];

const IntegrationsPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("drive");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "drive":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-link" title="Drive là một phần của workflow hằng ngày">
              Đội ngũ có thể kết nối tài khoản đã đăng nhập và duyệt file tuyển dụng mà không cần rời khỏi luồng sàng
              lọc.
            </LegalCallout>
          </div>
        );
      case "uploads":
        return (
          <LegalCard tone="emerald" icon="fa-file-arrow-up" title="Tải lên trực tiếp vẫn rất hữu ích">
            <p>
              Nếu tài liệu chưa nằm trong Drive, người dùng vẫn có thể nhập file trực tiếp và giữ nguyên cùng một
              workflow trong sản phẩm.
            </p>
          </LegalCard>
        );
      case "history":
        return (
          <LegalCard tone="sky" icon="fa-timeline" title="Ngữ cảnh gần nhất vẫn có thể xem lại">
            <LegalBulletGrid
              tone="sky"
              items={[
                "Khôi phục được trạng thái sàng lọc gần đây",
                "Có thể quay lại một phiên review đang làm dở",
                "Tải lại trang không làm đứt mạch sử dụng thông thường",
              ]}
            />
          </LegalCard>
        );
      case "roadmap":
        return (
          <LegalCard tone="violet" icon="fa-puzzle-piece" title="Trang này muốn phát tín hiệu điều gì">
            <p>
              Đây là bản tóm tắt thực dụng về tích hợp ở thời điểm hiện tại. Các kết nối sâu hơn như ATS hay HRIS có
              thể được mở rộng về sau trong lộ trình sản phẩm và rollout doanh nghiệp.
            </p>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Tích hợp"
      title="Tổng quan tích hợp"
      subtitle="Bản tóm tắt dành cho bên mua về cách Support HR kết nối với luồng tài liệu hiện tại và vị trí sản phẩm trong vận hành hằng ngày."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Bảo mật", to: "/security" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="chủ đề tích hợp"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default IntegrationsPage;
