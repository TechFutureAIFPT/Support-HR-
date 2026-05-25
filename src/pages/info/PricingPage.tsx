import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pricingPlans } from "./business-docs-data";
import {
  LEGAL_TONE_STYLES,
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "plans", title: "Tổng quan gói", icon: "fa-layer-group", tone: "cyan" },
  { id: "included", title: "Bao gồm những gì", icon: "fa-box-open", tone: "emerald" },
  { id: "rollout", title: "Hỗ trợ triển khai", icon: "fa-handshake", tone: "sky" },
  { id: "commercial", title: "Phù hợp thương mại", icon: "fa-file-invoice-dollar", tone: "violet" },
] satisfies LegalSectionMeta[];

const PricingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("plans");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "plans":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              {pricingPlans.map((plan) => {
                const style = LEGAL_TONE_STYLES[plan.tone];

                return (
                  <div key={plan.name} className={`border ${style.border} bg-white/[0.02] p-5`}>
                    <p className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${style.label}`}>
                      {plan.audience}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{plan.name}</h3>
                    <p className="mt-2 text-2xl font-semibold text-white">{plan.price}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {plan.cycle} · {plan.capacity}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">{plan.summary}</p>
                    <div className="mt-4">
                      <LegalBulletGrid tone={plan.tone} items={plan.features} />
                    </div>
                    <Link
                      to={plan.ctaHref}
                      className="mt-5 inline-flex h-10 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
                    >
                      {plan.ctaLabel}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "included":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-list-check" title="Phạm vi sản phẩm cốt lõi">
              <LegalBulletGrid
                tone="emerald"
                columns={2}
                items={[
                  "Nhập CV từ tải lên và Google Drive",
                  "Quy trình sàng lọc bám theo JD",
                  "Danh sách đề cử có lý do đi kèm",
                  "Lịch sử cho các phiên rà soát gần đây",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "rollout":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-handshake-angle" title="Hỗ trợ sẽ diễn ra ra sao">
              <LegalBulletGrid
                tone="sky"
                items={[
                  "Buổi hướng dẫn ban đầu cho luồng tuyển dụng",
                  "Hỗ trợ kết nối nguồn tài liệu",
                  "Rà soát phiên mẫu đầu tiên",
                  "Theo dõi tiếp cho các câu hỏi mở rộng quy mô",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "commercial":
        return (
          <div className="space-y-4">
            <LegalCallout tone="violet" icon="fa-building" title="Chọn gói phù hợp như thế nào">
              Nên chọn dựa trên quy mô đội ngũ, lượng CV theo tháng và mức kiểm soát hoặc hỗ trợ triển khai mà tổ chức
              kỳ vọng trong giai đoạn áp dụng.
            </LegalCallout>
            <LegalCard tone="rose" icon="fa-phone" title="Bước tiếp theo cho bộ phận mua sắm">
              Nếu cấu trúc giá nhìn đã gần nhu cầu, cách nhanh nhất là xem trải nghiệm trực tiếp và trao đổi nhanh về quy mô
              để chốt đúng gói phù hợp.
            </LegalCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Bảng giá"
      title="Tổng quan bảng giá và gói dịch vụ"
      subtitle="Cái nhìn rõ ràng về việc mỗi gói dành cho ai, bao gồm những gì trong quy trình cốt lõi và cách đội ngũ có thể đi từ đánh giá thử sang triển khai."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Hỏi đáp", to: "/faq" }}
      brandContext="Tài liệu doanh nghiệp"
      statusCountLabel="chủ đề thương mại"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default PricingPage;
