import React, { useEffect, useState } from "react";
import { LegalCallout, LegalCard, LegalPageLayout, type LegalSectionMeta } from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";

const sections = [
  { id: "overview", title: "Giới thiệu", icon: "fa-people-group", tone: "cyan" },
  { id: "achievements", title: "Thành tích", icon: "fa-trophy", tone: "amber" },
  { id: "contact", title: "Liên hệ", icon: "fa-envelope", tone: "sky" },
] satisfies LegalSectionMeta[];

const achievements = [
  { src: "/photo/trophie/Khuyáº¿n KhÃ­ch Tin Há»c Tráº».jpg", alt: "Khuyáº¿n KhÃ­ch Tin Há»c Tráº»" },
  { src: "/photo/trophie/sÃ¡ng táº¡o thanh thiáº¿u niÃªn.jpg", alt: "SÃ¡ng táº¡o Thanh Thiáº¿u NiÃªn" },
  { src: "/photo/trophie/tmhp.png", alt: "TMHP" },
];

const contactCards = [
  { icon: "fa-phone", label: "Điện thoại", value: "0899 280 108", accent: "text-emerald-300" },
  { icon: "fa-envelope", label: "Email", value: "support@supporthr.vn", accent: "text-sky-300" },
  { icon: "fa-github", label: "GitHub", value: "phucdevweb", accent: "text-zinc-200" },
];

const AchievementsContactPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-info" title="Thông tin đội ngũ">
              Khu vực này đã được tách riêng để bạn bổ sung phần giới thiệu đội ngũ theo cách rõ ràng hơn. Hiện tại mình để sẵn khung
              trống để bạn có thể điền tên thành viên, vai trò, nhiệm vụ hoặc câu chuyện hình thành sản phẩm sau.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-pen-ruler" title="Chỗ trống để điền nội dung">
              <div className="rounded border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-500">
                Chưa có dữ liệu giới thiệu đội ngũ. Bạn có thể thêm mô tả ngắn về nhóm, người phụ trách AI, frontend, backend hoặc thành
                viên nổi bật tại đây.
              </div>
            </LegalCard>
          </div>
        );
      case "achievements":
        return (
          <div className="grid gap-4 md:grid-cols-3">
            {achievements.map((item) => (
              <LegalCard key={item.alt} tone="amber" icon="fa-award" title={item.alt}>
                <div className="overflow-hidden border border-white/10 bg-black/40">
                  <img src={item.src} alt={item.alt} className="aspect-square w-full object-cover" />
                </div>
              </LegalCard>
            ))}
          </div>
        );
      case "contact":
        return (
          <div className="grid gap-4 md:grid-cols-3">
            {contactCards.map((item) => (
              <LegalCard key={item.label} tone="sky" icon={item.icon} title={item.label}>
                <p className={`text-lg font-semibold ${item.accent}`}>{item.value}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-500">
                  Có thể thay phần này bằng kênh liên hệ chính thức của đội ngũ khi bạn cập nhật nội dung thật.
                </p>
              </LegalCard>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Đội ngũ"
      title="Giới thiệu đội ngũ & thành tích thành viên"
      subtitle="Một trang riêng để người xem tra cứu đội ngũ thực hiện, thành tích đạt được và thông tin liên hệ mà không bị trộn với bảng giá hay tài liệu kỹ thuật."
      meta="Tài liệu doanh nghiệp · Cập nhật 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Bảng giá", to: "/pricing" }}
      brandContext="Tài liệu doanh nghiệp"
      headerTabs={productDocsTabs}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default AchievementsContactPage;

