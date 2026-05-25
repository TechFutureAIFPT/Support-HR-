import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "fit", title: "Phù hợp với ai", icon: "fa-users", tone: "cyan" },
  { id: "data", title: "CV và dữ liệu", icon: "fa-file-lines", tone: "emerald" },
  { id: "ai", title: "AI hỗ trợ thế nào", icon: "fa-brain", tone: "sky" },
  { id: "setup", title: "Onboarding", icon: "fa-rocket", tone: "violet" },
  { id: "plans", title: "Gói và hỗ trợ", icon: "fa-comments-dollar", tone: "rose" },
] satisfies LegalSectionMeta[];

const FAQPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("fit");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "fit":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-question" title="Support HR được xây cho kiểu đội ngũ nào?">
              Support HR phù hợp với đội tuyển dụng cần một nơi để nhập CV, đối chiếu với JD và chia sẻ shortlist có
              thể review cho các bên liên quan.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-briefcase" title="Tình huống dùng phổ biến">
              <LegalBulletGrid
                tone="cyan"
                columns={2}
                items={[
                  "Sàng lọc cho một vị trí đang mở",
                  "Khối lượng CV lớn cho một recruiter",
                  "Review chung giữa recruiter và hiring manager",
                  "Một workflow shortlist có thể lặp lại cho cả đội",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "data":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-folder-tree" title="Có thể đưa những file nào vào?">
              <p>
                Đội ngũ có thể làm việc từ file tải lên và nội dung Google Drive đã kết nối, giúp giữ tài liệu tuyển
                dụng trong cùng một luồng vận hành.
              </p>
            </LegalCard>
            <LegalCard tone="emerald" icon="fa-user-shield" title="Dữ liệu ứng viên có được xử lý cẩn thận không?">
              <p>
                Sản phẩm được thiết kế để dùng đúng các file và ngữ cảnh tài khoản cần cho workflow sàng lọc, chứ không
                tự mở các thư mục hay nguồn dữ liệu không liên quan ở nền.
              </p>
            </LegalCard>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-4">
            <LegalCallout tone="sky" icon="fa-sparkles" title="AI có thay recruiter không?">
              Không. Mục tiêu là tăng tốc bước trích xuất, đối chiếu và chuẩn bị shortlist, trong khi quyết định tuyển
              dụng cuối cùng vẫn nằm ở đội ngũ.
            </LegalCallout>
            <LegalCard tone="sky" icon="fa-scale-balanced" title="Điểm số nên được dùng như thế nào?">
              <LegalBulletGrid
                tone="sky"
                items={[
                  "Như một lớp xếp hạng vòng đầu có cấu trúc",
                  "Như gợi ý để con người review sâu hơn",
                  "Như cách đối chiếu ứng viên với một JD thật nhất quán",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "setup":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-list-check" title="Onboarding sẽ diễn ra như thế nào?">
              <LegalBulletGrid
                tone="violet"
                items={[
                  "Chốt workflow tuyển dụng và vị trí mục tiêu",
                  "Kết nối tài khoản đội ngũ và Drive nếu cần",
                  "Nạp một JD mẫu và một bộ CV mẫu",
                  "Review cùng nhau shortlist và định dạng báo cáo",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "plans":
        return (
          <div className="space-y-4">
            <LegalCard tone="rose" icon="fa-tags" title="Các gói khác nhau ở đâu?">
              <p>
                Các gói chủ yếu khác nhau ở số lượng CV theo tháng, số recruiter tham gia và mức hỗ trợ onboarding,
                vận hành mà đội ngũ cần.
              </p>
            </LegalCard>
            <LegalCallout tone="rose" icon="fa-phone" title="Nếu cần hỏi thêm về thương mại thì liên hệ ở đâu?">
              Bạn có thể xem trang bảng giá để hiểu gói, hoặc đi thẳng tới trang đặt lịch nếu đội ngũ muốn một buổi
              walkthrough trực tiếp.
            </LegalCallout>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="FAQ"
      title="Câu hỏi thường gặp"
      subtitle="FAQ thực dụng cho bên mua và onboarding, dành cho đội ngũ muốn hiểu rõ độ phù hợp, workflow và kỳ vọng vận hành trước khi dùng Support HR."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Đặt lịch demo", to: "/book-demo" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="câu hỏi của bên mua"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default FAQPage;
