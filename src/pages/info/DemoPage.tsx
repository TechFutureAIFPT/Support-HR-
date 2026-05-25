import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "intake", title: "Nhập JD", icon: "fa-file-signature", tone: "cyan" },
  { id: "import", title: "Nhập CV", icon: "fa-file-import", tone: "emerald" },
  { id: "review", title: "Chấm điểm và rà soát", icon: "fa-scale-balanced", tone: "sky" },
  { id: "shortlist", title: "Đầu ra danh sách đề cử", icon: "fa-user-check", tone: "violet" },
  { id: "handoff", title: "Bàn giao cho đội ngũ", icon: "fa-share-nodes", tone: "rose" },
] satisfies LegalSectionMeta[];

const DemoPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("intake");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "intake":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-diagram-project" title="Bước 1: xác định vai trò thật rõ">
              Recruiter bắt đầu với một JD, sau đó thiết lập ngữ cảnh quy trình để hệ thống hiểu kỹ năng, tín hiệu và
              hard filter nào quan trọng cho lần tuyển dụng đó.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-list" title="Đội ngũ cần chuẩn bị gì trước">
              <LegalBulletGrid
                tone="cyan"
                items={[
                  "Bản mô tả công việc mục tiêu",
                  "Các tiêu chí ưu tiên cho vị trí",
                  "Những yêu cầu cứng cần được áp dụng",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "import":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-folder-open" title="Bước 2: đưa file ứng viên vào hệ thống">
              <p>
                CV có thể đến từ tải lên cục bộ hoặc Google Drive, nên đội ngũ không phải sắp xếp lại tài liệu trước khi
                dùng sản phẩm.
              </p>
            </LegalCard>
            <LegalCard tone="emerald" icon="fa-file-lines" title="File đầu vào lẫn lộn vẫn xử lý được">
              <p>
                Quy trình được thiết kế để xử lý nhiều kiểu tài liệu khác nhau và vẫn giữ chúng trong cùng một phiên sàng
                lọc.
              </p>
            </LegalCard>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-sliders" title="Bước 3: đối chiếu JD và CV">
              <p>
                Support HR tổ chức đầu vào thành một bề mặt rà soát nhất quán để recruiter kiểm tra độ phù hợp, lý do và
                khoảng trống trước khi chốt shortlist.
              </p>
            </LegalCard>
            <LegalCallout tone="sky" icon="fa-eye" title="Mục tiêu là khả năng rà soát">
              Bên mua thường muốn biết sản phẩm có giúp ra quyết định nhanh hơn mà không biến quy trình thành hộp đen hay
              không. Đây là chỗ quy trình thể hiện giá trị.
            </LegalCallout>
          </div>
        );

      case "shortlist":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-clipboard-list" title="Bước 4: tạo shortlist">
              <LegalBulletGrid
                tone="violet"
                items={[
                  "Danh sách ứng viên xếp hạng cho vị trí hiện tại",
                  "Lý do đứng sau từng đề cử",
                  "Một bề mặt thảo luận gọn hơn cho vòng phỏng vấn tiếp theo",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "handoff":
        return (
          <div className="space-y-4">
            <LegalCard tone="rose" icon="fa-people-group" title="Bước 5: chia sẻ kết quả">
              <p>
                Recruiter có thể mang shortlist vào buổi trao đổi nội bộ với nhiều ngữ cảnh đã được chuẩn bị sẵn cho
                hiring manager hoặc hội đồng phỏng vấn.
              </p>
            </LegalCard>
            <Link
              to="/book-demo"
              className="inline-flex h-10 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
            >
              Đặt lịch trải nghiệm trực tiếp
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Trải nghiệm"
      title="Luồng trải nghiệm sản phẩm"
      subtitle="Mô tả dễ hiểu về cách một recruiter đi từ một JD và một chồng CV đến một danh sách đề cử có thể rà soát ngay bên trong Support HR."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Tài liệu & bảng giá", to: "/pricing" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="bước trong quy trình"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default DemoPage;
