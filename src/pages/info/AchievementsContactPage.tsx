import React, { useEffect, useState } from "react";
import { LegalPageLayout, type LegalSectionMeta } from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";

type TeamImage = {
  src: string;
  alt: string;
  title: string;
  caption: string;
};

type AchievementImage = {
  src: string;
  alt: string;
  title: string;
};

type CarouselImage = {
  src: string;
  alt: string;
  title: string;
  caption?: string;
};

const sections = [
  { id: "team", title: "Đội ngũ", icon: "fa-people-group", tone: "cyan" },
  { id: "achievements", title: "Thành tích", icon: "fa-trophy", tone: "amber" },
] satisfies LegalSectionMeta[];

const teamImages: TeamImage[] = [
  {
    src: "/images/Team/Bizday.jpg",
    alt: "Đội ngũ Support HR tại Bizday",
    title: "Bizday showcase",
    caption: "Hình ảnh giới thiệu sản phẩm trong bối cảnh kinh doanh và vận hành thực tế.",
  },
  {
    src: "/images/Team/hackathon2024.jpg",
    alt: "Đội ngũ Support HR tại Hackathon 2024",
    title: "Hackathon 2024",
    caption: "Giai đoạn đội ngũ tập trung hoàn thiện sản phẩm, trải nghiệm và triển khai kỹ thuật với tốc độ cao.",
  },
  {
    src: "/images/Team/topcv1.jpg",
    alt: "Đội ngũ Support HR tại sự kiện TopCV",
    title: "Phiên làm việc cùng TopCV",
    caption: "Buổi trao đổi giúp đội ngũ kiểm thử quy trình tuyển dụng thực tế và tiếp nhận phản hồi vận hành.",
  },
  {
    src: "/images/Team/topcv2.jpg",
    alt: "Đội ngũ Support HR tại sự kiện TopCV",
    title: "Đối chiếu với tình huống thật",
    caption: "Môi trường thực tế để đối chiếu sản phẩm với những bài toán tuyển dụng cụ thể.",
  },
];

const achievementImages: AchievementImage[] = [
  {
    src: "/images/achieve/khkt-truong.jpg",
    alt: "Giải khoa học kỹ thuật cấp trường",
    title: "Khoa học kỹ thuật cấp trường",
  },
  {
    src: "/images/achieve/stempetition.jpg",
    alt: "Chứng nhận cuộc thi STEM",
    title: "Cuộc thi STEM",
  },
  {
    src: "/images/achieve/sttn.jpg",
    alt: "Giải thưởng sáng tạo thanh thiếu niên",
    title: "Sáng tạo thanh thiếu niên",
  },
  {
    src: "/images/achieve/tht-thanh-pho.jpg",
    alt: "Giải tin học trẻ cấp thành phố",
    title: "Tin học trẻ cấp thành phố",
  },
  {
    src: "/images/achieve/tht1.jpg",
    alt: "Giải tin học trẻ 01",
    title: "Tin học trẻ 01",
  },
  {
    src: "/images/achieve/tht2.jpg",
    alt: "Giải tin học trẻ 02",
    title: "Tin học trẻ 02",
  },
];

const teamHighlights = [
  {
    label: "Định hướng sản phẩm",
    detail: "Support HR được phát triển như một sản phẩm giải quyết bài toán tuyển dụng rõ ràng, ưu tiên tính thực dụng và khả năng áp dụng ngay trong vận hành.",
  },
  {
    label: "Triển khai kỹ thuật",
    detail: "Nhóm TechFuture AI xây dựng sản phẩm xoay quanh luồng sàng lọc CV bằng AI, các bước rà soát minh bạch và giao diện dễ theo dõi.",
  },
  {
    label: "Đồng hành chuyên môn",
    detail: "Dự án đã nhận được sự hỗ trợ từ anh Vũ Nhật Anh, Co-founder TopCV, giúp đội ngũ có thêm góc nhìn thực tiễn về nhu cầu tuyển dụng và phát triển sản phẩm.",
  },
] as const;

function ImageCarousel({
  images,
  eyebrow,
  title,
  description,
  frameClassName,
  wrapperClassName = "max-w-[30rem]",
}: {
  images: CarouselImage[];
  eyebrow: string;
  title: string;
  description: string;
  frameClassName: string;
  wrapperClassName?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? images.length - 1 : currentIndex - 1));
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex === images.length - 1 ? 0 : currentIndex + 1));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-[#f5d6bb]/80">{eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="max-w-xl text-sm leading-7 text-zinc-500">{description}</p>
      </div>

      <figure className={`mx-auto w-full overflow-hidden border border-white/10 bg-black/45 ${wrapperClassName}`}>
        <div className={`relative flex items-center justify-center bg-black ${frameClassName}`}>
          <img src={activeImage.src} alt={activeImage.alt} className="h-full w-full object-contain" />

          <div className="absolute inset-x-0 top-4 flex items-center justify-between px-4">
            <span className="supporthr-mono rounded-full border border-white/12 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-200">
              {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Ảnh trước"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/60 text-zinc-200 transition-colors hover:border-white/24 hover:text-white"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Ảnh tiếp theo"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/60 text-zinc-200 transition-colors hover:border-white/24 hover:text-white"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          </div>
        </div>

        <figcaption className="border-t border-white/8 px-4 py-3">
          <p className="text-sm font-semibold text-white">{activeImage.title}</p>
          {activeImage.caption ? <p className="mt-2 text-sm leading-6 text-zinc-500">{activeImage.caption}</p> : null}
        </figcaption>
      </figure>

      <div className="flex flex-wrap items-center gap-2">
        {images.map((image, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                isActive ? "w-9 bg-[#f5d6bb]" : "w-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

const AchievementsContactPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("team");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "team":
        return (
          <div className="space-y-6">
            <div className="border border-[#f5d6bb]/18 bg-[#f5d6bb]/[0.04] p-4 sm:p-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-[#f5d6bb]/80">Giới thiệu</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Support HR là sản phẩm thuộc nhóm TechFuture AI, được phát triển với định hướng tạo ra một công cụ hỗ
                trợ tuyển dụng hiện đại, dễ ứng dụng và bám sát nhu cầu vận hành thực tế. Đội ngũ tập trung vào việc
                kết hợp tư duy sản phẩm, hiểu biết về quy trình nhân sự và năng lực triển khai công nghệ để xây dựng
                một trải nghiệm sàng lọc hồ sơ rõ ràng, hiệu quả và có thể mở rộng.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {teamHighlights.map((item) => (
                <div key={item.label} className="border border-white/10 bg-white/[0.02] px-4 py-4">
                  <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{item.detail}</p>
                </div>
              ))}
            </div>

            <ImageCarousel
              images={teamImages}
              eyebrow="Hình ảnh đội ngũ"
              title="Hành trình phát triển của TechFuture AI"
              description="Các hình ảnh ghi lại quá trình giới thiệu sản phẩm, làm việc với đối tác và hoàn thiện Support HR qua những bối cảnh thực tế."
              frameClassName="h-[360px] sm:h-[420px] lg:h-[500px]"
              wrapperClassName="max-w-[28rem]"
            />
          </div>
        );

      case "achievements":
        return (
          <ImageCarousel
            images={achievementImages}
            eyebrow="Thành tích dự án"
            title="Các dấu mốc nổi bật"
            description="Phần này tổng hợp những hình ảnh thành tích, giải thưởng và các cột mốc ghi nhận quá trình phát triển của dự án."
            frameClassName="h-[380px] sm:h-[450px] lg:h-[540px]"
            wrapperClassName="max-w-[30rem]"
          />
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Đội ngũ"
      title="TechFuture AI và hành trình phát triển Support HR"
      subtitle="Trang này giới thiệu nhóm phát triển Support HR và các dấu mốc tiêu biểu của dự án. Bạn có thể chuyển giữa mục Đội ngũ và Thành tích bằng phần mục lục bên trái."
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
