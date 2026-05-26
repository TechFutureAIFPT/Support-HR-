import React, { useEffect, useState } from "react";
import { LegalCallout, LegalCard, LegalPageLayout, type LegalSectionMeta } from "./legal-ui";
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
            <LegalCallout tone="cyan" icon="fa-lock" title="Khung nội dung bảo mật dữ liệu">
              Trang này đã được tách riêng để bạn trình bày chính sách bảo mật, phân quyền truy cập và các nguyên tắc xử lý dữ liệu theo
              cách dễ tra cứu hơn.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-file-shield" title="Chờ nội dung chi tiết">
              <p className="text-sm leading-7 text-zinc-500">
                Chưa có thông tin bảo mật chính thức được cung cấp. Bạn có thể bổ sung cam kết xử lý dữ liệu, phạm vi truy cập và mức độ
                kiểm soát ở phần này sau.
              </p>
            </LegalCard>
          </div>
        );
      case "storage":
        return (
          <LegalCard tone="emerald" icon="fa-server" title="Mô tả lưu trữ và vòng đời dữ liệu">
            <div className="rounded border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-500">
              Khu vực trống để điền nơi lưu dữ liệu, thời gian lưu trữ, chính sách xóa dữ liệu và cách đội ngũ xử lý tài liệu tuyển dụng
              của khách hàng.
            </div>
          </LegalCard>
        );
      case "ops":
        return (
          <LegalCard tone="sky" icon="fa-user-shield" title="Quy trình vận hành nội bộ">
            <div className="rounded border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-500">
              Bạn có thể thêm quy trình cấp quyền, nhật ký thao tác, kiểm tra định kỳ hoặc cách phản hồi khi có yêu cầu rà soát bảo mật.
            </div>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Bảo mật dữ liệu"
      title="Trang bảo mật dữ liệu"
      subtitle="Một trang riêng để tập hợp nội dung về bảo mật, lưu trữ và quy trình vận hành thay vì gộp vào bảng giá như trước."
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

