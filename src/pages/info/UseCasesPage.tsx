import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "volume", title: "Sàng lọc khối lượng lớn", icon: "fa-layer-group", tone: "cyan" },
  { id: "specialist", title: "Vị trí chuyên môn", icon: "fa-user-gear", tone: "emerald" },
  { id: "shared", title: "Rà soát nhiều bên", icon: "fa-people-arrows", tone: "sky" },
  { id: "audit", title: "Danh sách đề cử dễ rà soát", icon: "fa-clipboard-check", tone: "violet" },
] satisfies LegalSectionMeta[];

const UseCasesPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("volume");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "volume":
        return (
          <LegalCard tone="cyan" icon="fa-inbox" title="Khi quá nhiều CV đổ về cùng lúc">
            <p>
              Đội ngũ có thể dùng Support HR để đưa một lượng lớn ứng viên vào cùng một luồng rà soát, thay vì mở từng
              CV thủ công trước khi có danh sách đề cử đầu tiên.
            </p>
          </LegalCard>
        );
      case "specialist":
        return (
          <LegalCard tone="emerald" icon="fa-code" title="Khi vai trò khó đánh giá nhanh">
            <p>
              Với tuyển dụng chuyên môn, quy trình giúp recruiter gom tín hiệu từ JD và so sánh ứng viên nhất quán hơn
              trước khi bàn giao danh sách đề cử cho người rà soát kỹ thuật.
            </p>
          </LegalCard>
        );
      case "shared":
        return (
          <LegalCard tone="sky" icon="fa-users" title="Khi nhiều người cùng rà soát một vị trí">
            <LegalBulletGrid
              tone="sky"
              items={[
                "Recruiter chuẩn bị danh sách đề cử ban đầu",
                "Quản lý tuyển dụng rà soát trên một tập ứng viên gọn hơn",
                "Cả đội nhìn chung một bề mặt thảo luận nhất quán",
              ]}
            />
          </LegalCard>
        );
      case "audit":
        return (
          <LegalCard tone="violet" icon="fa-book-open-reader" title="Khi đội ngũ cần bản ghi rõ ràng hơn">
            <p>
              Lý do đề cử và lịch sử quy trình giúp việc nhìn lại một lần tuyển dụng dễ hơn: ai được đề cử, vì sao,
              và ngữ cảnh nào đã dẫn đến quyết định đó.
            </p>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Tình huống dùng"
      title="Các tình huống vận hành phù hợp"
      subtitle="Ví dụ về nơi Support HR phát huy tốt nhất: lượng đầu vào lớn, vai trò chuyên môn, rà soát nhiều bên và danh sách đề cử có thể truy vết."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Phương pháp AI", to: "/ai-methodology" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="kịch bản vận hành"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default UseCasesPage;
