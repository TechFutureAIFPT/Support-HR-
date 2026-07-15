import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";

const sections = [
  { id: "google-data",  title: "Google user data",    icon: "fa-cloud-arrow-down",  tone: "cyan" },
  { id: "roles",        title: "Vai trò xử lý",        icon: "fa-sitemap",           tone: "cyan" },
  { id: "scope",        title: "Phạm vi dữ liệu",      icon: "fa-database",          tone: "emerald" },
  { id: "improvement",  title: "Cải thiện dữ liệu",    icon: "fa-chart-line",        tone: "sky" },
  { id: "security",     title: "Bảo mật và lưu trữ",   icon: "fa-shield-halved",     tone: "violet" },
  { id: "rights",       title: "Quyền chủ thể",        icon: "fa-user-shield",       tone: "rose" },
] satisfies LegalSectionMeta[];

const PrivacyPolicyPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("google-data");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "google-data":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-info" title="Google user data disclosure">
              Support HR uses Google sign-in and read-only Google Drive access only to authenticate users and let them
              chọn tài liệu tuyển dụng để nhập vào quy trình sàng lọc.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-3">
              <LegalCard tone="cyan" icon="fa-id-card" title="Account data">
                <LegalBulletGrid
                  tone="cyan"
                  columns={1}
                  items={[
                    "Google account name",
                    "Email address",
                    "Profile photo",
                    "Google account identifier",
                  ]}
                />
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-folder-open" title="Drive data">
                <LegalBulletGrid
                  tone="emerald"
                  columns={1}
                  items={[
                    "File name and file ID",
                    "MIME type and file size",
                    "Modified time",
                    "Content of files selected by the user",
                  ]}
                />
              </LegalCard>

              <LegalCard tone="sky" icon="fa-wand-magic-sparkles" title="Use limitation">
                <p>
                  Google user data is used to provide sign-in, selected file import, CV/JD extraction, candidate
                  phân tích, lịch sử quy trình đã lưu, hỗ trợ, bảo mật và bảo trì sản phẩm.
                </p>
              </LegalCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="violet" icon="fa-share-nodes" title="Sharing">
                <p>
                  Support HR does not sell Google user data. Data may be processed by infrastructure, storage,
                  authentication, and AI service providers only to provide and secure Support HR functionality.
                </p>
              </LegalCard>

              <LegalCard tone="rose" icon="fa-trash-can" title="Retention and deletion">
                <p>
                  Users may request deletion of account data, uploaded files, imported Google Drive content, and related
                  analysis results. Verified deletion requests are targeted for completion within 30 days unless a longer
                  period is required by law.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "roles":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-scale-balanced" title="Khung xử lý dữ liệu minh bạch">
              Để đảm bảo tính minh bạch theo{" "}
              <strong className="text-[#1d4e89]">Nghị định 13/2023/NĐ-CP</strong>,
              Support HR xác định rõ vai trò của các bên trong toàn bộ quá trình xử lý dữ liệu cá nhân.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="emerald" icon="fa-user-tie" title="Khách hàng là bên kiểm soát" badge="Kiểm soát">
                <p>
                  Khách hàng quyết định mục đích và phương tiện xử lý dữ liệu cá nhân của ứng viên trong từng quy trình
                  tuyển dụng.
                </p>
                <p className="text-slate-500">
                  Mọi quyết định tuyển chọn cuối cùng, tiêu chí ưu tiên và phạm vi khai thác dữ liệu đều do Khách hàng
                  xác lập.
                </p>
              </LegalCard>

              <LegalCard tone="sky" icon="fa-gears" title="Support HR là bên xử lý" badge="Processor">
                <p>
                  Support HR thực hiện các hoạt động thu thập, lưu trữ, chuẩn hóa và phân tích dữ liệu thay mặt cho
                  Khách hàng.
                </p>
                <p className="text-slate-500">
                  Toàn bộ xử lý chỉ được thực hiện theo chỉ thị của Khách hàng và trong phạm vi vận hành dịch vụ.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "scope":
        return (
          <div className="space-y-4">
            <p className="max-w-3xl text-sm leading-7 text-slate-500">
              Hệ thống thu thập và xử lý đúng các nhóm dữ liệu cần thiết để vận hành tính năng cốt lõi như trích xuất
              CV, chấm điểm và đối sánh hồ sơ với JD.
            </p>

            <div className="grid gap-4 xl:grid-cols-3">
              <LegalCard tone="cyan" icon="fa-building" title="Thông tin tài khoản doanh nghiệp">
                <LegalBulletGrid
                  tone="cyan"
                  columns={1}
                  items={["Tên doanh nghiệp", "Email liên hệ", "Logo công ty", "Mã số thuế"]}
                />
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-file-lines" title="Dữ liệu ứng viên">
                <LegalBulletGrid
                  tone="emerald"
                  columns={1}
                  items={["Họ tên và thông tin liên hệ", "Lịch sử làm việc", "Học vấn", "Kỹ năng trong CV"]}
                />
              </LegalCard>

              <LegalCard tone="sky" icon="fa-briefcase" title="Dữ liệu tuyển dụng">
                <LegalBulletGrid
                  tone="sky"
                  columns={1}
                  items={["Nội dung JD", "Tiêu chí đánh giá", "Trọng số ưu tiên"]}
                />
              </LegalCard>
            </div>
          </div>
        );

      case "improvement":
        return (
          <div className="space-y-4">
            <p className="max-w-3xl text-sm leading-7 text-slate-500">
              Khi được Khách hàng cho phép, Support HR có thể sử dụng dữ liệu đã được xử lý phù hợp để nâng chất
              lượng hệ thống và cải thiện độ chính xác của mô hình.
            </p>

            <div className="grid gap-4 xl:grid-cols-3">
              <LegalCard tone="sky" icon="fa-user-secret" title="Ẩn danh hóa dữ liệu">
                <p>
                  Loại bỏ hoàn toàn thông tin định danh cá nhân như tên, email, số điện thoại và địa chỉ khỏi dữ liệu
                  gốc.
                </p>
              </LegalCard>

              <LegalCard tone="emerald" icon="fa-microchip" title="Huấn luyện mô hình">
                <p>
                  Sử dụng dữ liệu đã được ẩn danh để tinh chỉnh thuật toán chấm điểm, tối ưu khả năng đối sánh và giảm
                  sai lệch trong khâu sàng lọc.
                </p>
              </LegalCard>

              <LegalCard tone="violet" icon="fa-chart-pie" title="Báo cáo thống kê">
                <p>
                  Tạo các thống kê tổng hợp như xu hướng kỹ năng hoặc mặt bằng thị trường mà không làm lộ dữ liệu định
                  danh của từng cá nhân.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-lock" title="Biện pháp bảo vệ dữ liệu">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Mã hóa đường truyền", value: "TLS 1.2+" },
                  { title: "Mã hóa lưu trữ", value: "AES-256" },
                  { title: "Quản lý khóa API", value: "Server-side" },
                  { title: "Kiểm soát rò rỉ", value: "Anti-breach" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-indigo-500">{item.title}</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </LegalCard>

            <LegalCard tone="cyan" icon="fa-clock-rotate-left" title="Thời gian lưu trữ">
              <p>
                Dữ liệu được lưu trữ trong suốt thời gian Khách hàng sử dụng dịch vụ để bảo đảm quy trình tuyển dụng vận
                hành liên tục và có thể rà soát.
              </p>
              <LegalCallout tone="cyan" icon="fa-trash-can" title="Cơ chế xóa dữ liệu khi chấm dứt dịch vụ">
                Khi Khách hàng chấm dứt hợp đồng hoặc gửi yêu cầu xóa tài khoản, Support HR sẽ tiến hành{" "}
                <strong className="text-[#1d4e89]">xóa vĩnh viễn toàn bộ dữ liệu trong vòng 30 ngày</strong>, trừ khi
                pháp luật yêu cầu thời hạn lưu trữ dài hơn.
              </LegalCallout>
            </LegalCard>
          </div>
        );

      case "rights":
        return (
          <div className="space-y-4">
            <LegalCallout tone="rose" icon="fa-scale-balanced" title="Hỗ trợ quyền của chủ thể dữ liệu">
              Support HR cam kết hỗ trợ Khách hàng thực hiện đầy đủ nghĩa vụ đối với chủ thể dữ liệu theo quy định của{" "}
              <strong className="text-rose-700">Nghị định 13/2023/NĐ-CP</strong>.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="cyan" icon="fa-download" title="Trích xuất dữ liệu theo yêu cầu">
                <p>
                  Hệ thống hỗ trợ trích xuất thông tin khi có yêu cầu từ ứng viên hoặc từ cơ quan có thẩm quyền trong
                  phạm vi pháp luật cho phép.
                </p>
              </LegalCard>

              <LegalCard tone="rose" icon="fa-user-slash" title="Thực thi quyền được lãng quên">
                <p>
                  Support HR hỗ trợ xóa bỏ hoàn toàn thông tin của một ứng viên cụ thể khỏi hệ thống khi phát sinh yêu
                  cầu hợp lệ từ chủ thể dữ liệu.
                </p>
              </LegalCard>
            </div>

            <div className="rounded-xl border border-[#1d4e89]/20 bg-[#1d4e89]/[0.06] px-5 py-4 text-sm leading-7 text-[#475467]">
              <i className="fa-solid fa-circle-info mr-2 text-[#1d4e89]" />
              Tất cả các quyền này được thực hiện theo quy định về bảo vệ dữ liệu cá nhân và các văn bản pháp luật có
              liên quan, với mục tiêu cân bằng giữa vận hành tuyển dụng và quyền riêng tư của ứng viên.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Bảo mật"
      title="Chính sách bảo mật và xử lý dữ liệu"
      subtitle="Support HR trình bày rõ vai trò xử lý, phạm vi khai thác dữ liệu và cơ chế bảo vệ thông tin ứng viên theo từng nhóm mục cụ thể."
      meta="Nghị định 13/2023/NĐ-CP · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Điều khoản", to: "/terms" }}
      headerTabs={productDocsTabs}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default PrivacyPolicyPage;
