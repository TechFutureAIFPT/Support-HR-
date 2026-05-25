import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "parse", title: "Đọc JD", icon: "fa-file-lines", tone: "cyan" },
  { id: "criteria", title: "Trích tiêu chí", icon: "fa-filter", tone: "emerald" },
  { id: "scoring", title: "Cách hiểu điểm số", icon: "fa-scale-balanced", tone: "sky" },
  { id: "reasoning", title: "Khả năng giải thích", icon: "fa-comment-dots", tone: "violet" },
  { id: "review", title: "Vòng kiểm duyệt của con người", icon: "fa-user-check", tone: "rose" },
] satisfies LegalSectionMeta[];

const AIMethodologyPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("parse");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "parse":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-diagram-project" title="Luồng bắt đầu từ một định nghĩa vai trò rõ ràng">
              Hệ thống đọc mô tả công việc trước để phần còn lại của quy trình luôn bám vào cùng một vai trò, cùng bộ kỹ
              năng và cùng ý định tuyển dụng.
            </LegalCallout>
          </div>
        );

      case "criteria":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-list-ul" title="Hệ thống cố gắng trích ra những gì">
              <LegalBulletGrid
                tone="emerald"
                columns={2}
                items={[
                  "Kỹ năng gắn với vai trò",
                  "Kỳ vọng về kinh nghiệm",
                  "Yêu cầu quan trọng và hard filter",
                  "Ngữ cảnh định hình danh sách đề cử",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "scoring":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-scale-balanced" title="Điểm số nên được hiểu như thế nào">
              <p>
                Điểm số được dùng để tạo một lớp so sánh có cấu trúc cho một JD cụ thể, chứ không phải phán quyết tuyệt
                đối về ứng viên ở mọi vai trò.
              </p>
            </LegalCard>
          </div>
        );

      case "reasoning":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-message" title="Vì sao phần giải thích quan trọng">
              <p>
                Sản phẩm hữu ích hơn khi recruiter nhìn thấy vì sao ứng viên được đưa lên, còn thiếu điều gì, và nên
                xác minh thêm gì ở vòng sau.
              </p>
            </LegalCard>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <LegalCallout tone="rose" icon="fa-user-pen" title="Recruiter vẫn là người giữ quyền quyết định">
              Vòng rà soát của con người vẫn là bước cuối cùng. Support HR giúp đội ngũ nhìn dữ liệu nhanh hơn và nhất
              quán hơn, nhưng không thay thế phán đoán tuyển dụng.
            </LegalCallout>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="AI"
      title="Phương pháp AI bằng ngôn ngữ dễ hiểu"
      subtitle="Giải thích ngắn gọn cách Support HR đọc JD, trích tiêu chí, chấm điểm ứng viên và vẫn giữ recruiter trong vòng quyết định."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Trải nghiệm", to: "/demo" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="ghi chú phương pháp"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default AIMethodologyPage;
