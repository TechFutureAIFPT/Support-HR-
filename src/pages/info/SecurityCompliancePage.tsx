import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "controls", title: "Kiểm soát bảo mật", icon: "fa-shield-halved", tone: "cyan" },
  { id: "access", title: "Truy cập và vai trò", icon: "fa-user-lock", tone: "emerald" },
  { id: "retention", title: "Lưu trữ và xóa", icon: "fa-clock-rotate-left", tone: "sky" },
  { id: "drive", title: "Phạm vi Google Drive", icon: "fa-folder-open", tone: "violet" },
  { id: "operations", title: "Vận hành và SLA", icon: "fa-life-ring", tone: "rose" },
] satisfies LegalSectionMeta[];

const SecurityCompliancePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("controls");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "controls":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-check" title="Xây cho quy trình tuyển dụng có thể rà soát">
              Support HR giúp đội ngũ tuyển dụng đi nhanh hơn mà vẫn giữ được khả năng theo dõi file, tiêu chí và quyết
              định shortlist.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-3">
              <LegalCard tone="cyan" icon="fa-lock" title="Truyền tải và lưu trữ">
                <LegalBulletGrid
                  tone="cyan"
                  items={[
                    "Mã hóa lưu lượng giữa trình duyệt và API",
                    "Thông tin xác thực dịch vụ ngoài được xử lý phía máy chủ",
                    "Lưu phiên có cấu trúc để giữ tính liên tục của quy trình",
                  ]}
                />
              </LegalCard>
              <LegalCard tone="emerald" icon="fa-file-shield" title="Bảo vệ quy trình">
                <LegalBulletGrid
                  tone="emerald"
                  items={[
                    "Trạng thái làm việc theo từng người dùng",
                    "Chỉ nhập file sau khi người dùng chủ động chọn",
                    "Có thể truy vết ngữ cảnh chấm điểm và shortlist",
                  ]}
                />
              </LegalCard>
              <LegalCard tone="violet" icon="fa-clipboard-check" title="Sẵn sàng cho bước review">
                <p>
                  Hệ thống giữ đủ ngữ cảnh quanh JD, file CV đã nhập và kết quả chấm điểm để đội ngũ xem lại một phiên
                  tuyển dụng mà không phải dựng lại từ đầu.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "access":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="emerald" icon="fa-users-gear" title="Ai được truy cập phần nào" badge="Theo vai trò">
                <p>
                  Recruiter truy cập các quy trình mình vận hành, còn admin có thể điều phối rollout, hỗ trợ và các
                  quyết định chính sách cho đội ngũ.
                </p>
                <p className="text-zinc-500">
                  Truy cập tới dịch vụ ngoài như Google Drive được gắn với phiên người dùng đã xác thực, thay vì mở
                  rộng chung cho cả tổ chức.
                </p>
              </LegalCard>
              <LegalCard tone="sky" icon="fa-key" title="Xử lý thông tin xác thực">
                <LegalBulletGrid
                  tone="sky"
                  items={[
                    "Xác thực luôn gắn với tài khoản đã đăng nhập",
                    "Quyền Google Drive được giới hạn theo người dùng đã kết nối",
                    "Bí mật vận hành không bị lộ ra giao diện trình duyệt",
                  ]}
                />
              </LegalCard>
            </div>
          </div>
        );

      case "retention":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-database" title="Cách tiếp cận lưu trữ">
              <p>
                Lịch sử quy trình được giữ lại để hỗ trợ recruiter review, bàn giao và rà soát các quyết định tuyển
                dụng gần đây. Đội ngũ nên đặt thời gian lưu phù hợp với chính sách nội bộ.
              </p>
            </LegalCard>
            <LegalCallout tone="rose" icon="fa-trash-can" title="Hỗ trợ xóa dữ liệu">
              Khi đội ngũ yêu cầu dọn tài khoản hoặc workspace, các file đã nhập và bản ghi liên quan cần được xóa theo
              quy trình vận hành đã thống nhất và nghĩa vụ pháp lý.
            </LegalCallout>
          </div>
        );

      case "drive":
        return (
          <div className="space-y-4">
            <LegalCallout tone="violet" icon="fa-folder-open" title="Sử dụng Drive ở mức tối thiểu cần thiết">
              Google Drive được dùng để hỗ trợ người dùng đã đăng nhập duyệt, chọn và nhập tài liệu tuyển dụng vào quy
              trình sàng lọc.
            </LegalCallout>
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="violet" icon="fa-list" title="Tích hợp sẽ chạm tới những gì">
                <LegalBulletGrid
                  tone="violet"
                  items={[
                    "Metadata file cần thiết cho việc duyệt và chọn",
                    "Nội dung của những file do người dùng chọn",
                    "Ngữ cảnh tài khoản đã kết nối của phiên hiện tại",
                  ]}
                />
              </LegalCard>
              <LegalCard tone="cyan" icon="fa-ban" title="Những gì hệ thống không làm">
                <LegalBulletGrid
                  tone="cyan"
                  items={[
                    "Không quét rộng cả workspace nếu người dùng không yêu cầu",
                    "Không chia sẻ công khai các file đã nhập",
                    "Không âm thầm đồng bộ các thư mục Drive không liên quan",
                  ]}
                />
              </LegalCard>
            </div>
          </div>
        );

      case "operations":
        return (
          <div className="space-y-4">
            <LegalCard tone="rose" icon="fa-headset" title="Kỳ vọng vận hành">
              <LegalBulletGrid
                tone="rose"
                items={[
                  "Phản hồi trong giờ làm việc cho câu hỏi rollout và sử dụng",
                  "Hỗ trợ onboarding, thiết lập workflow và hướng dẫn sản phẩm",
                  "Tiếp nhận và phân loại lỗi khi luồng file hoặc truy cập cần xem lại",
                ]}
              />
            </LegalCard>
            <LegalCallout tone="emerald" icon="fa-handshake" title="Khi nào trang này phù hợp nhất">
              Đây là bản tóm tắt niềm tin dành cho bên mua. Nếu doanh nghiệp có quy trình mua sắm nghiêm ngặt hơn, có
              thể bổ sung DPA, bảng câu hỏi bảo mật và SLA riêng ở bước sau.
            </LegalCallout>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Bảo mật"
      title="Tổng quan bảo mật và tuân thủ"
      subtitle="Bản tóm tắt dành cho bên mua về cách Support HR xử lý truy cập, nhập file, lưu trữ dữ liệu và niềm tin vận hành hằng ngày cho đội ngũ tuyển dụng."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Chính sách riêng tư", to: "/privacy-policy" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="điểm kiểm tra niềm tin"
      statusNotes={[
        "[LIVE] Bao phủ đúng chủ đề đang được xem",
        "[SYNC] Đồng bộ cùng ngôn ngữ sản phẩm của các trang bán hàng",
        "[NEXT] Có thể bổ sung DPA và SLA mở rộng sau",
      ]}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default SecurityCompliancePage;
