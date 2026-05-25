import React, { useEffect, useState } from "react";
import { bookDemoChannels } from "./business-docs-data";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "fit", title: "Ai nên đặt lịch", icon: "fa-user-tie", tone: "cyan" },
  { id: "agenda", title: "Nội dung buổi làm việc", icon: "fa-calendar-check", tone: "emerald" },
  { id: "channels", title: "Kênh liên hệ", icon: "fa-phone", tone: "sky" },
  { id: "sla", title: "Cam kết phản hồi", icon: "fa-stopwatch", tone: "rose" },
] satisfies LegalSectionMeta[];

const BookDemoPage: React.FC = () => {
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
          <LegalCallout tone="cyan" icon="fa-handshake" title="Phù hợp nhất khi muốn đánh giá nghiêm túc">
            Hãy đặt lịch trải nghiệm khi đội ngũ của bạn muốn so sản phẩm với một quy trình tuyển dụng thật, chứ không
            chỉ xem danh sách tính năng.
          </LegalCallout>
        );
      case "agenda":
        return (
          <LegalCard tone="emerald" icon="fa-list-check" title="Một buổi làm việc đầu tiên thường nên có">
            <LegalBulletGrid
              tone="emerald"
              items={[
                "Quy trình tuyển dụng hiện tại và điểm đau đang gặp",
                "Một vai trò mẫu và một bộ CV mẫu",
                "Cách đội ngũ đang rà soát danh sách đề cử hôm nay",
                "Bước thương mại tiếp theo nếu thấy phù hợp",
              ]}
            />
          </LegalCard>
        );
      case "channels":
        return (
          <div className="grid gap-4 xl:grid-cols-3">
            {bookDemoChannels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                className="border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
              >
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{channel.label}</p>
                <p className="mt-3 text-lg font-semibold text-white">{channel.value}</p>
              </a>
            ))}
          </div>
        );
      case "sla":
        return (
          <LegalCard tone="rose" icon="fa-envelope-open-text" title="Kỳ vọng phản hồi">
            <p>
              Yêu cầu trải nghiệm nên nhận được phản hồi trong giờ làm việc, với cuộc trao đổi đầu tiên tập trung vào độ
              phù hợp, quy trình và bước thương mại tiếp theo.
            </p>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Đặt lịch trải nghiệm"
      title="Đặt lịch trao đổi sản phẩm"
      subtitle="Các kênh liên hệ và kỳ vọng rõ ràng cho cuộc trao đổi đầu tiên với đội ngũ tư vấn."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Tài liệu & bảng giá", to: "/pricing" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="chi tiết đặt lịch"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default BookDemoPage;
