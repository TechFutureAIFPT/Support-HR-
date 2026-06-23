import React, { useEffect, useState } from "react";
import { LegalCard, LegalCallout, LegalPageLayout, type LegalSectionMeta } from "./legal-ui";

const sections = [
  { id: "bat-dau",  title: "Bắt đầu sử dụng",    icon: "fa-play",      tone: "cyan" },
  { id: "du-lieu",  title: "CV và dữ liệu",        icon: "fa-file-lines",tone: "emerald" },
  { id: "danh-gia", title: "Đánh giá ứng viên",    icon: "fa-chart-bar", tone: "sky" },
  { id: "tai-khoan",title: "Tài khoản & quyền",    icon: "fa-user-shield",tone: "violet" },
] satisfies LegalSectionMeta[];

const FAQPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("bat-dau");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case "bat-dau":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-info" title="Dành cho ai?">
              Support HR phù hợp với đội tuyển dụng cần chuẩn hóa JD, xử lý nhiều CV và tạo shortlist
              có lý do rõ ràng để cùng rà soát.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="cyan" icon="fa-rocket" title="Cần chuẩn bị gì cho phiên đầu tiên?">
                <p>
                  Bạn cần một JD cho vị trí đang tuyển và bộ CV thực tế. Sau khi tải dữ liệu lên, hãy kiểm
                  tra điều kiện bắt buộc và trọng số trước khi chạy phân tích.
                </p>
              </LegalCard>

              <LegalCard tone="sky" icon="fa-route" title="Luồng sử dụng cơ bản">
                <p>
                  Nạp JD → nạp CV → thiết lập bộ lọc và trọng số → chạy phân tích AI → xem dashboard
                  → lưu kết quả hoặc ghi phản hồi.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-users" title="Ai trong đội có thể dùng?">
                <p>
                  HR Manager, Talent Acquisition, Hiring Manager và bất kỳ thành viên nào cần tham gia
                  rà soát ứng viên. Mỗi người đăng nhập bằng tài khoản riêng.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-graduation-cap" title="Có cần biết kỹ thuật không?">
                <p>
                  Không. Giao diện được thiết kế cho người dùng HR không có nền tảng kỹ thuật. Mọi thao
                  tác đều có hướng dẫn ngay trên màn hình.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "du-lieu":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="emerald" icon="fa-upload" title="Có thể lấy CV từ đâu?">
                <p>
                  Bạn có thể tải file trực tiếp từ máy tính hoặc chọn tài liệu từ Google Drive đã được
                  cấp quyền. Hệ thống chỉ xử lý tài liệu người dùng chủ động chọn.
                </p>
              </LegalCard>

              <LegalCard tone="cyan" icon="fa-file-pdf" title="Hỗ trợ định dạng nào?">
                <p>
                  PDF, DOCX, PNG và JPG là các định dạng phổ biến được hỗ trợ theo cấu hình upload hiện
                  tại của hệ thống.
                </p>
              </LegalCard>

              <LegalCard tone="sky" icon="fa-clock-rotate-left" title="Lịch sử phân tích có được lưu không?">
                <p>
                  Kết quả được lưu trong lịch sử tài khoản để xem lại và bàn giao. Người dùng có thể
                  điều chỉnh đồng bộ hoặc xóa dữ liệu trong phần Cài đặt.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-rotate" title="Có thể dùng lại CV từ phiên cũ không?">
                <p>
                  Có. Thư viện CV tổng hợp hồ sơ từ các phiên đã phân tích, cho phép bạn lấy lại ứng
                  viên để đưa vào lượt lọc tiếp theo mà không cần tải lại file.
                </p>
              </LegalCard>
            </div>

            <LegalCallout tone="emerald" icon="fa-shield-halved" title="Ai có thể xem dữ liệu của bạn?">
              Dữ liệu JD/CV chỉ dùng để phục vụ quy trình sàng lọc của tài khoản đang thao tác. Người
              dùng chịu trách nhiệm đảm bảo quyền sử dụng CV và dữ liệu ứng viên trước khi tải lên.
            </LegalCallout>
          </div>
        );

      case "danh-gia":
        return (
          <div className="space-y-4">
            <LegalCallout tone="sky" icon="fa-scale-balanced" title="Điểm số AI có thay thế quyết định của HR không?">
              Không. Điểm số, bằng chứng và cảnh báo hỗ trợ vòng rà soát ban đầu; quyết định tuyển dụng
              cuối cùng vẫn thuộc về nhà tuyển dụng và doanh nghiệp.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="sky" icon="fa-magnifying-glass" title="CV thiếu dữ liệu thì xử lý thế nào?">
                <p>
                  Thông tin không xuất hiện trong CV sẽ được đánh dấu là chưa tìm thấy hoặc cần HR rà
                  soát, thay vì tự suy đoán năng lực của ứng viên.
                </p>
              </LegalCard>

              <LegalCard tone="cyan" icon="fa-sliders" title="Điều chỉnh trọng số ảnh hưởng thế nào?">
                <p>
                  Trọng số phản ánh mức độ quan trọng của từng nhóm tiêu chí (Job Fit, kinh nghiệm, kỹ
                  năng, học vấn…). Thay đổi trọng số sẽ thay đổi thứ hạng ứng viên ngay lập tức.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-list-check" title="Bộ lọc cứng là gì?">
                <p>
                  Bộ lọc cứng loại trừ các ứng viên không đáp ứng điều kiện bắt buộc (địa điểm, kinh
                  nghiệm tối thiểu, ngôn ngữ…) trước khi chạy phân tích chi tiết.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-comment-dots" title="Phản hồi sau phân tích dùng để làm gì?">
                <p>
                  Phản hồi giúp ghi nhận ý kiến của HR về kết quả, cải thiện shortlist và giữ tính nhất
                  quán cho các lần phân tích tiếp theo với vị trí tương tự.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "tai-khoan":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="violet" icon="fa-right-to-bracket" title="Đăng nhập bằng gì?">
                <p>
                  Bạn đăng nhập bằng tài khoản Google. Hệ thống dùng Google OAuth để xác thực và chỉ yêu
                  cầu quyền truy cập Drive khi bạn chọn tài liệu từ đó.
                </p>
              </LegalCard>

              <LegalCard tone="cyan" icon="fa-folder-open" title="Quyền Google Drive hoạt động thế nào?">
                <p>
                  Quyền Drive chỉ áp dụng cho file bạn chủ động chọn trong phiên làm việc. Hệ thống không
                  tự động quét hoặc truy cập toàn bộ Drive của bạn.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-trash-can" title="Xóa dữ liệu như thế nào?">
                <p>
                  Bạn có thể xóa lịch sử phân tích và dữ liệu cá nhân trong phần Cài đặt tài khoản. Yêu
                  cầu xóa hoàn toàn tài khoản gửi về kênh hỗ trợ chính thức.
                </p>
              </LegalCard>

              <LegalCard tone="sky" icon="fa-envelope" title="Liên hệ hỗ trợ ở đâu?">
                <p>
                  Gửi yêu cầu hỗ trợ, phản hồi lỗi hoặc yêu cầu xóa dữ liệu qua email{" "}
                  <a href="mailto:support@supporthr.vn" className="font-semibold text-blue-600 hover:underline">
                    support@supporthr.vn
                  </a>{" "}
                  hoặc số{" "}
                  <a href="tel:0899280108" className="font-semibold text-blue-600 hover:underline">
                    0899 280 108
                  </a>.
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
      pageLabel="Câu hỏi thường gặp"
      title="Giải đáp nhanh về Support HR"
      subtitle="Hướng dẫn ngắn gọn về cách bắt đầu, quản lý dữ liệu CV, vai trò của kết quả đánh giá AI và các câu hỏi về tài khoản."
      meta="Cập nhật 2026 · Tất cả tính năng"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Bảo mật dữ liệu", to: "/security" }}
      brandContext="Trung tâm tài liệu"
    >
      {renderContent()}
    </LegalPageLayout>
  );
};

export default FAQPage;
