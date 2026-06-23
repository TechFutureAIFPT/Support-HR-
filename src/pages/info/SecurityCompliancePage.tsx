import React, { useEffect, useState } from "react";
import { LegalBulletGrid, LegalCallout, LegalCard, LegalPageLayout, type LegalSectionMeta } from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";

const sections = [
  { id: "policy",   title: "Nguyên tắc bảo mật",  icon: "fa-shield-halved", tone: "cyan" },
  { id: "storage",  title: "Lưu trữ dữ liệu",      icon: "fa-database",      tone: "emerald" },
  { id: "ops",      title: "Kiểm soát vận hành",    icon: "fa-user-lock",     tone: "sky" },
  { id: "rights",   title: "Quyền người dùng",      icon: "fa-hand-holding",  tone: "violet" },
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
            <LegalCallout tone="cyan" icon="fa-lock" title="Phạm vi xử lý dữ liệu tuyển dụng">
              Support HR chỉ sử dụng dữ liệu trong phạm vi phiên sàng lọc hiện tại: JD, file CV do người
              dùng tải lên hoặc tài liệu người dùng chủ động chọn từ Google Drive.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="cyan" icon="fa-file-shield" title="Dữ liệu JD" badge="Mục đích">
                <p>
                  JD được dùng làm chuẩn đối chiếu duy nhất khi AI chấm điểm ứng viên trong phiên sàng
                  lọc. Nội dung JD không được chia sẻ ra ngoài tài khoản của bạn.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-id-card" title="Dữ liệu CV" badge="Mục đích">
                <p>
                  CV được xử lý để trích xuất tín hiệu phù hợp với vị trí tuyển dụng. Kết quả AI là gợi
                  ý hỗ trợ rà soát, không thay thế quyết định cuối cùng của nhà tuyển dụng.
                </p>
              </LegalCard>

              <LegalCard tone="sky" icon="fa-circle-check" title="Xác thực Google" badge="OAuth 2.0">
                <p>
                  Đăng nhập qua Google OAuth 2.0. Quyền truy cập Google Drive chỉ áp dụng cho tài liệu
                  người dùng chủ động chọn trong phiên làm việc.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-robot" title="Mô hình AI bên thứ ba" badge="Minh bạch">
                <p>
                  Hệ thống tích hợp mô hình ngôn ngữ lớn từ nhà cung cấp bên thứ ba. Dữ liệu được gửi đi
                  chỉ trong phạm vi cần thiết để phân tích, không được lưu lại ở phía nhà cung cấp AI.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "storage":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-slate-50 px-4 py-4">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Mã hóa đường truyền</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">TLS 1.2+</p>
                <p className="mt-1 text-sm text-slate-500">Toàn bộ dữ liệu truyền giữa trình duyệt và máy chủ</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-slate-50 px-4 py-4">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Lưu trữ đám mây</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">Firebase</p>
                <p className="mt-1 text-sm text-slate-500">Firestore và Firebase Auth — hạ tầng Google Cloud</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-slate-50 px-4 py-4">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Xóa dữ liệu</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">30 ngày</p>
                <p className="mt-1 text-sm text-slate-500">Thời gian mục tiêu hoàn thành yêu cầu xóa hợp lệ</p>
              </div>
            </div>

            <LegalCard tone="emerald" icon="fa-server" title="Vòng đời dữ liệu">
              <LegalBulletGrid
                tone="emerald"
                items={[
                  "Người dùng đưa JD và CV vào một phiên sàng lọc cụ thể.",
                  "Hệ thống xử lý file để tạo điểm số, giải thích và danh sách đề cử có thể rà soát.",
                  "Lịch sử phiên được giữ để xem lại, bàn giao hoặc tiếp tục phân tích trong tương lai.",
                  "Người dùng có thể xóa dữ liệu bất kỳ lúc nào trong phần Cài đặt tài khoản.",
                ]}
              />
            </LegalCard>

            <LegalCallout tone="cyan" icon="fa-clock-rotate-left" title="Thời gian lưu dữ liệu">
              Dữ liệu được giữ trong suốt thời gian tài khoản hoạt động để đảm bảo quy trình tuyển dụng liên
              tục. Khi tài khoản bị xóa hoặc có yêu cầu hợp lệ, dữ liệu được xóa vĩnh viễn trong vòng 30
              ngày, trừ khi pháp luật yêu cầu thời hạn lưu dài hơn.
            </LegalCallout>
          </div>
        );

      case "ops":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-user-shield" title="Kiểm soát truy cập">
              <LegalBulletGrid
                tone="sky"
                items={[
                  "Tài khoản người dùng gắn với phiên làm việc và dữ liệu tuyển dụng của họ.",
                  "Quyền Google Drive chỉ dùng cho file người dùng chủ động chọn trong phiên.",
                  "Các route ứng dụng được bảo vệ theo trạng thái đăng nhập.",
                  "Không có nhân viên nội bộ nào truy cập dữ liệu khách hàng ngoài mục đích hỗ trợ được yêu cầu.",
                ]}
              />
            </LegalCard>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="emerald" icon="fa-triangle-exclamation" title="Phản hồi sự cố">
                <p>
                  Khi phát hiện sự cố bảo mật ảnh hưởng đến dữ liệu người dùng, Support HR sẽ thông báo
                  trong thời gian sớm nhất có thể và mô tả rõ phạm vi tác động.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-envelope" title="Kênh liên hệ bảo mật">
                <p>
                  Gửi báo cáo lỗ hổng, yêu cầu kiểm tra dữ liệu hoặc yêu cầu xóa tài khoản qua email{" "}
                  <a href="mailto:support@supporthr.vn" className="font-semibold text-violet-700 hover:underline">
                    support@supporthr.vn
                  </a>.
                  Mọi yêu cầu sẽ nhận được phản hồi trong vòng 3 ngày làm việc.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "rights":
        return (
          <div className="space-y-4">
            <LegalCallout tone="violet" icon="fa-scale-balanced" title="Quyền của người dùng và ứng viên">
              Support HR hỗ trợ thực hiện đầy đủ quyền chủ thể dữ liệu theo quy định của{" "}
              <strong className="text-violet-700">Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="cyan" icon="fa-download" title="Trích xuất dữ liệu">
                <p>
                  Người dùng hoặc ứng viên có thể yêu cầu trích xuất thông tin cá nhân được lưu trong
                  hệ thống. Yêu cầu được xử lý qua kênh hỗ trợ chính thức.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-user-slash" title="Quyền được lãng quên">
                <p>
                  Support HR hỗ trợ xóa hoàn toàn thông tin của một ứng viên cụ thể khỏi hệ thống khi có
                  yêu cầu hợp lệ từ chủ thể dữ liệu hoặc khách hàng doanh nghiệp.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-pen-to-square" title="Quyền chỉnh sửa">
                <p>
                  Người dùng có thể cập nhật thông tin hồ sơ tài khoản và điều chỉnh dữ liệu phiên làm
                  việc trực tiếp trong ứng dụng.
                </p>
              </LegalCard>

              <LegalCard tone="sky" icon="fa-ban" title="Quyền phản đối xử lý">
                <p>
                  Người dùng có thể yêu cầu ngừng xử lý dữ liệu cụ thể bằng cách xóa phiên hoặc liên hệ
                  hỗ trợ để vô hiệu hóa đồng bộ dữ liệu.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Bảo mật dữ liệu"
      title="Bảo mật và xử lý dữ liệu"
      subtitle="Tài liệu mô tả cách Support HR lưu trữ, bảo vệ và xử lý JD, CV, quyền Google Drive và dữ liệu tài khoản người dùng."
      meta="Nghị định 13/2023/NĐ-CP · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Chính sách bảo mật", to: "/privacy-policy" }}
      brandContext="Tài liệu doanh nghiệp"
      headerTabs={productDocsTabs}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default SecurityCompliancePage;
