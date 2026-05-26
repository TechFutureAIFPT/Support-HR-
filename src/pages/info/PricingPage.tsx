import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import DmcaBadge from "@/components/common/DmcaBadge";
import {
  DocsHeaderTabs,
  LEGAL_TONE_STYLES,
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  type LegalTone,
} from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";
import {
  type BillingMode,
  docsNavigation,
  faqGuideSections,
  pricingComparisonRows,
  pricingFaqs,
  pricingHeroHighlights,
  pricingPlans,
  securityDocSections,
  securityTrustHighlights,
} from "./business-docs-data";

function PricingToggle({
  billingMode,
  onChange,
}: {
  billingMode: BillingMode;
  onChange: (mode: BillingMode) => void;
}) {
  const options: Array<{ key: BillingMode; label: string; note: string }> = [
    { key: "monthly", label: "Theo tháng", note: "Linh hoạt để bắt đầu nhanh" },
    { key: "yearly", label: "Theo năm", note: "Ưu tiên rollout và đồng hành sâu hơn" },
  ];

  return (
    <div className="inline-flex flex-wrap items-center gap-2 border border-white/10 bg-white/[0.03] p-2">
      {options.map((option) => {
        const active = billingMode === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`min-w-[180px] px-4 py-3 text-left transition-colors ${
              active
                ? "bg-white text-black"
                : "bg-transparent text-zinc-300 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em]">{option.label}</p>
            <p className={`mt-1 text-sm ${active ? "text-black/75" : "text-zinc-500"}`}>{option.note}</p>
          </button>
        );
      })}
    </div>
  );
}

function PricingCard({
  plan,
  billingMode,
  index,
  reduceMotion,
}: {
  plan: (typeof pricingPlans)[number];
  billingMode: BillingMode;
  index: number;
  reduceMotion: boolean;
}) {
  const style = LEGAL_TONE_STYLES[plan.tone];
  const modeContent = plan.billingModes[billingMode];

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 26 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.42,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: "easeOut",
      }}
      className={`relative flex h-full flex-col overflow-hidden border ${style.border} bg-[linear-gradient(180deg,rgba(9,9,11,0.98),rgba(6,6,8,0.92))] p-6`}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${style.label}`}>
            {plan.highlightLabel}
          </p>
          <h3 className="mt-3 text-[1.85rem] font-semibold leading-tight text-white">{plan.name}</h3>
          <p className="mt-2 text-sm text-zinc-500">{plan.audience}</p>
        </div>
        <span className={`supporthr-mono shrink-0 text-[10px] uppercase tracking-[0.18em] ${style.label}`}>
          {modeContent.cycle}
        </span>
      </div>

      <div className="mt-8 border-y border-white/8 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-3xl font-semibold text-white">{plan.price}</p>
            <p className="mt-2 text-sm text-zinc-500">{plan.capacity}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className={`supporthr-mono text-[10px] uppercase tracking-[0.18em] ${style.label}`}>
              {modeContent.commercialLabel}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-zinc-400">{plan.summary}</p>
      <p className="mt-4 text-sm leading-7 text-zinc-500">{modeContent.serviceNote}</p>

      <ul className="mt-6 space-y-3 text-sm leading-7 text-zinc-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className={`mt-[0.72rem] h-1.5 w-1.5 shrink-0 ${style.dot}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap gap-3 pt-7">
        <Link
          to={plan.ctaHref}
          className="inline-flex h-11 items-center justify-center bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-100"
        >
          {plan.ctaLabel}
        </Link>
        <Link
          to="/book-demo"
          className="inline-flex h-11 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
        >
          {plan.ctaSecondaryLabel}
        </Link>
      </div>
    </motion.article>
  );
}

function ComparisonTonePill({
  tone,
  label,
}: {
  tone: LegalTone;
  label: string;
}) {
  const style = LEGAL_TONE_STYLES[tone];

  return (
    <span
      className={`supporthr-mono inline-flex border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${style.border} ${style.label}`}
    >
      {label}
    </span>
  );
}

function DocsSidebar({
  activeGroupId,
  activeAnchor,
}: {
  activeGroupId: string;
  activeAnchor: string;
}) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-28 border border-white/8 bg-black/80 p-4 backdrop-blur-xl">
        <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]/70">
          Trung tâm tài liệu
        </p>
        <div className="mt-4 space-y-4">
          {docsNavigation.map((group, groupIndex) => {
            const style = LEGAL_TONE_STYLES[group.tone];
            const active = activeGroupId === group.id;

            return (
              <div key={group.id} className="space-y-2">
                <a
                  href={`#${group.id}`}
                  className={`block border px-3 py-3 transition-colors ${
                    active
                      ? `${style.border} ${style.surface} text-white`
                      : "border-white/8 bg-white/[0.02] text-zinc-300 hover:border-white/14 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`supporthr-mono min-w-[1.7rem] text-[10px] uppercase tracking-[0.18em] ${
                        active ? style.label : "text-zinc-600"
                      }`}
                    >
                      /{String(groupIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${group.icon} text-[11px] ${active ? style.accent : "text-zinc-500"}`} />
                        <p className="text-sm font-semibold">{group.label}</p>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-zinc-500">{group.description}</p>
                    </div>
                  </div>
                </a>

                <div className="space-y-1 pl-4">
                  {group.items.map((item) => {
                    const childActive = activeAnchor === item.id;

                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          childActive
                            ? `${style.label} bg-white/[0.04] text-white`
                            : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 ${childActive ? style.dot : "bg-zinc-700"}`} />
                        <span>{item.title}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SectionIntro({
  sectionId,
  title,
  description,
  tone,
}: {
  sectionId: string;
  title: string;
  description: string;
  tone: LegalTone;
}) {
  const style = LEGAL_TONE_STYLES[tone];

  return (
    <div id={sectionId} className="scroll-mt-28 border-b border-white/8 pb-6">
      <p className={`supporthr-mono text-[10px] uppercase tracking-[0.24em] ${style.label}`}>Mục lớn</p>
      <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-white">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">{description}</p>
    </div>
  );
}

const PricingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
  const [activeAnchor, setActiveAnchor] = useState<string>("pricing");
  const reduceMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ids = docsNavigation.flatMap((group) => [group.id, ...group.items.map((item) => item.id)]);

    const updateActiveAnchor = () => {
      const sections = ids
        .map((id) => document.getElementById(id))
        .filter((section): section is HTMLElement => Boolean(section));

      let current = ids[0];

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= 220) {
          current = section.id;
        }
      });

      setActiveAnchor(current);
    };

    updateActiveAnchor();
    window.addEventListener("scroll", updateActiveAnchor, { passive: true });
    window.addEventListener("resize", updateActiveAnchor);

    return () => {
      window.removeEventListener("scroll", updateActiveAnchor);
      window.removeEventListener("resize", updateActiveAnchor);
    };
  }, []);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.slice(1);
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const activeGroup =
    docsNavigation.find((group) => group.id === activeAnchor || group.items.some((item) => item.id === activeAnchor)) ??
    docsNavigation[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_48%)]" />
        <div className="absolute left-0 top-16 h-[20rem] w-[34rem] bg-[radial-gradient(circle_at_left_top,rgba(245,214,187,0.08),transparent_72%)]" />
        <div className="absolute bottom-0 right-0 h-[24rem] w-[32rem] bg-[radial-gradient(circle_at_right_bottom,rgba(245,214,187,0.07),transparent_74%)]" />
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/92 backdrop-blur-xl">
          <div className="mx-auto flex h-[4.45rem] w-full max-w-[96rem] items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3 transition-opacity duration-300 hover:opacity-90">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden border border-white/14 bg-black">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-white">
                  Support HR
                </span>
                <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5d6bb]">
                  Tài liệu doanh nghiệp
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/pricing#faq"
                className="hidden h-8 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-200 hover:border-white/24 hover:text-white sm:inline-flex"
              >
                Hỏi đáp
              </Link>
              <Link
                to="/book-demo"
                className="hidden h-8 shrink-0 items-center justify-center bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-200 hover:bg-zinc-100 sm:inline-flex"
              >
                Đặt lịch demo
              </Link>
            </div>
          </div>
        </nav>

        <DocsHeaderTabs tabs={productDocsTabs} />

        <main className="mx-auto max-w-[96rem] px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
          <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_15rem]">
            <DocsSidebar activeGroupId={activeGroup.id} activeAnchor={activeAnchor} />

            <div className="min-w-0 space-y-6">
              <section
                className={`transition-all duration-700 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <div className="grid gap-10 border border-white/8 bg-[linear-gradient(180deg,rgba(8,8,10,0.92),rgba(0,0,0,0.86))] px-5 py-8 sm:px-8 sm:py-10 xl:grid-cols-[minmax(0,1fr)_18rem] xl:px-10 xl:py-12">
                  <div className="min-w-0">
                    <h1 className="supporthr-display max-w-5xl break-words text-[clamp(1.65rem,8.5vw,5.4rem)] font-bold leading-[0.95] tracking-[-0.045em] sm:leading-[0.92] sm:tracking-[-0.075em] text-white">
                      Bảng giá rõ ràng để đội tuyển dụng, bên mua và quản lý chốt nhanh phạm vi triển khai.
                    </h1>
                    <p className="mt-6 max-w-3xl break-words text-base leading-8 text-zinc-400 sm:text-lg">
                      Trang này tập trung riêng cho bảng giá và phần hỏi đáp thương mại. Các nội dung về đội ngũ, bảo mật dữ liệu và cách
                      sử dụng đã được tách sang các trang riêng để việc tra cứu gọn gàng và dễ theo dõi hơn.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        to="/book-demo"
                        className="inline-flex h-11 w-full items-center justify-center bg-white px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-100 sm:w-auto"
                      >
                        Đặt lịch demo
                      </Link>
                      <Link
                        to="/demo"
                        className="inline-flex h-11 w-full items-center justify-center border border-white/12 px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03] sm:w-auto"
                      >
                        Xem flow sản phẩm
                      </Link>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {docsNavigation.map((group) => (
                        <a
                          key={group.id}
                          href={`#${group.id}`}
                          className="border border-white/8 bg-white/[0.02] px-4 py-4 transition-colors hover:border-white/14 hover:bg-white/[0.04]"
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 text-sm ${LEGAL_TONE_STYLES[group.tone].accent}`}>
                              <i className={`fa-solid ${group.icon}`} />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">{group.label}</p>
                              <p className="mt-2 text-sm leading-7 text-zinc-500">{group.description}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(245,214,187,0.06),rgba(255,255,255,0.018))] p-5">
                    <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                      Tóm tắt hub
                    </p>
                    <div className="mt-5 space-y-3">
                      <div className="border border-white/10 bg-black/45 px-4 py-4">
                        <p className="text-3xl font-semibold text-white">4</p>
                        <p className="mt-1 text-sm text-zinc-500">trang tài liệu chính trong cụm header mới</p>
                      </div>
                      <div className="border border-white/10 bg-black/45 px-4 py-4">
                        <p className="text-3xl font-semibold text-white">11</p>
                        <p className="mt-1 text-sm text-zinc-500">anchor để đi thẳng tới đúng chủ đề cần đọc</p>
                      </div>
                      <div className="border border-white/10 bg-black/45 px-4 py-4">
                        <p className="text-3xl font-semibold text-white">1</p>
                        <p className="mt-1 text-sm text-zinc-500">trang tập trung riêng cho giá và câu hỏi thương mại</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="border border-white/8 bg-black/78 p-3 backdrop-blur-xl xl:hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {docsNavigation.map((group) => {
                    const active = activeGroup.id === group.id;
                    const style = LEGAL_TONE_STYLES[group.tone];

                    return (
                      <a
                        key={group.id}
                        href={`#${group.id}`}
                        className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-medium transition-colors ${
                          active
                            ? `${style.border} ${style.surface} ${style.accent}`
                            : "border-white/8 bg-white/[0.02] text-zinc-500"
                        }`}
                      >
                        <i className={`fa-solid ${group.icon} text-[10px]`} />
                        {group.label}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="border border-white/8 bg-black/78 p-3 backdrop-blur-xl xl:hidden">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">On this page</p>
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                  {activeGroup.items.map((item) => {
                    const active = activeAnchor === item.id;
                    const style = LEGAL_TONE_STYLES[activeGroup.tone];

                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-medium transition-colors ${
                          active
                            ? `${style.border} ${style.surface} ${style.accent}`
                            : "border-white/8 bg-white/[0.02] text-zinc-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 ${active ? style.dot : "bg-zinc-700"}`} />
                        {item.title}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(8,8,10,0.94),rgba(0,0,0,0.92))] p-5 sm:p-7">
                <SectionIntro
                  sectionId="pricing"
                  title="Bảng giá"
                  description="Khối này giúp đội ngũ nhìn nhanh cách Support HR định vị từng gói, cách đọc mức cam kết thương mại và đâu là điểm nên trao đổi tiếp trong buổi demo."
                  tone="cyan"
                />

                <section id="pricing-overview" className="scroll-mt-28 pt-8">
                  <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Tổng quan thương mại</h3>
                      <p className="mt-3 max-w-3xl text-base leading-8 text-zinc-400">
                        Mỗi gói của Support HR được trình bày như một mức độ đồng hành khác nhau: từ bắt đầu nhanh, mở
                        rộng quy mô, đến triển khai có kiểm soát cho doanh nghiệp cần quy trình và tài liệu rõ ràng.
                      </p>

                      <div className="mt-6 flex justify-start">
                        <PricingToggle billingMode={billingMode} onChange={setBillingMode} />
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {pricingHeroHighlights.map((item) => (
                          <div key={item} className="border border-white/8 bg-white/[0.02] px-4 py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 bg-[#f5d6bb]" />
                              <p className="text-sm leading-7 text-zinc-300">{item}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-white/8 bg-white/[0.02] p-5">
                      <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]/75">
                        Cách đọc nhanh
                      </p>
                      <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-400">
                        <p>Ưu tiên xem theo quy mô CV thực tế, số recruiter cùng vận hành và mức hỗ trợ triển khai mong muốn.</p>
                        <p>Toggle tháng và năm không đổi giá niêm yết; nó chỉ giúp hình dung kiểu cam kết thương mại phù hợp.</p>
                        <p>Nếu đội ngũ đang ở giữa hai mức, demo là cách nhanh nhất để chốt gói đúng mà không phải suy đoán quá nhiều.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="pricing-plans" className="scroll-mt-28 pt-10">
                  <h3 className="text-2xl font-semibold text-white">Ba gói triển khai</h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-zinc-400">
                    Các gói giữ cùng một triết lý sản phẩm, khác nhau chủ yếu ở quy mô xử lý, số người tham gia và độ sâu hỗ trợ khi đi vào dùng thật.
                  </p>

                  <div className="mt-8 grid gap-px border border-white/[0.08] bg-white/[0.08] xl:grid-cols-3">
                    {pricingPlans.map((plan, index) => (
                      <PricingCard
                        key={plan.name}
                        plan={plan}
                        billingMode={billingMode}
                        index={index}
                        reduceMotion={Boolean(reduceMotion)}
                      />
                    ))}
                  </div>
                </section>

                <section id="pricing-comparison" className="scroll-mt-28 pt-10">
                  <h3 className="text-2xl font-semibold text-white">Bảng so sánh nhanh</h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-zinc-400">
                    Bảng này không cố thay thế trao đổi thương mại, nhưng đủ rõ để nội bộ hình dung phạm vi từng gói trước khi đi vào buổi đánh giá thực tế.
                  </p>

                  <div className="mt-6 overflow-x-auto border border-white/8">
                    <div className="grid min-w-[58rem] grid-cols-[minmax(16rem,1.45fr)_repeat(3,minmax(9rem,1fr))] border-b border-white/8 bg-white/[0.03]">
                      <div className="px-4 py-4 text-sm font-medium text-zinc-400">Hạng mục</div>
                      {pricingPlans.map((plan) => (
                        <div key={plan.name} className="px-4 py-4">
                          <ComparisonTonePill tone={plan.tone} label={plan.name} />
                        </div>
                      ))}
                    </div>

                    {pricingComparisonRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid min-w-[58rem] grid-cols-[minmax(16rem,1.45fr)_repeat(3,minmax(9rem,1fr))] border-b border-white/8 last:border-b-0"
                      >
                        <div className="px-4 py-4">
                          <p className="text-sm font-semibold text-white">{row.label}</p>
                          <p className="mt-1 text-sm leading-6 text-zinc-500">{row.description}</p>
                        </div>
                        {pricingPlans.map((plan) => (
                          <div key={`${row.label}-${plan.name}`} className="px-4 py-4 text-sm leading-7 text-zinc-300">
                            {row.values[plan.comparisonKey]}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>

                <section id="pricing-commercial" className="scroll-mt-28 pt-10">
                  <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Câu hỏi thương mại thường gặp</h3>
                      <p className="mt-3 max-w-2xl text-base leading-8 text-zinc-400">
                        Phần này giúp recruiter, quản lý tuyển dụng và bộ phận mua sắm có cùng ngôn ngữ trước khi đi sang giai đoạn đánh giá thực tế.
                      </p>
                      <LegalCallout tone="rose" icon="fa-phone" title="Khi nào nên chuyển từ đọc tài liệu sang buổi demo?">
                        Khi đội ngũ đã có một vị trí tuyển dụng thật, vài CV mẫu và muốn thấy rõ Support HR chấm điểm, đề cử và bàn giao ngữ cảnh ra sao trong flow hằng ngày.
                      </LegalCallout>
                    </div>

                    <div className="space-y-3">
                      {pricingFaqs.map((faq, index) => {
                        const open = openFaqIndex === index;

                        return (
                          <div key={faq.question} className="border border-white/8 bg-white/[0.02]">
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(open ? -1 : index)}
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                              <span className="text-sm font-semibold text-white sm:text-base">{faq.question}</span>
                              <span className={`text-sm text-zinc-500 transition-transform ${open ? "rotate-45" : ""}`}>+</span>
                            </button>
                            {open ? (
                              <div className="border-t border-white/8 px-5 py-4 text-sm leading-7 text-zinc-400">
                                {faq.answer}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>

              <div className="border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(8,8,10,0.94),rgba(0,0,0,0.92))] p-5 sm:p-7">
                <SectionIntro
                  sectionId="security"
                  title="Bảo mật"
                  description="Khối này tóm tắt cách Support HR xử lý truy cập, tệp tuyển dụng, phạm vi dùng Google Drive và các tín hiệu niềm tin mà bên mua thường hỏi trong giai đoạn đầu."
                  tone="emerald"
                />

                <section id="security-overview" className="scroll-mt-28 pt-8">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {securityTrustHighlights.map((item) => (
                        <div key={item.key} className="border border-white/10 bg-white/[0.02] px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[#f5d6bb]/25 bg-[#f5d6bb]/8 text-[#f5d6bb]">
                              <i className={item.iconClass} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {item.eyebrow}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-zinc-100">{item.title}</p>
                              <p className="mt-2 text-sm leading-6 text-zinc-500">{item.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="max-w-[320px] xl:justify-self-end">
                      <DmcaBadge note="Trang này gắn liên kết xác thực bản quyền DMCA cho website." />
                    </div>
                  </div>
                </section>

                <div className="space-y-6 pt-8">
                  {securityDocSections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-28">
                      <LegalCard tone={section.tone} icon={section.icon} title={section.title}>
                        <p className="text-sm leading-7 text-zinc-400">{section.description}</p>
                        <div className="mt-5">
                          <LegalBulletGrid tone={section.tone} items={section.bullets} />
                        </div>
                        {section.note ? <p className="mt-5 text-sm leading-7 text-zinc-500">{section.note}</p> : null}
                      </LegalCard>
                    </section>
                  ))}
                </div>
              </div>

              <div className="border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(8,8,10,0.94),rgba(0,0,0,0.92))] p-5 sm:p-7">
                <SectionIntro
                  sectionId="faq"
                  title="Hỏi đáp"
                  description="Khối này gom các câu hỏi ngắn mà đội ngũ thường cần trước khi quyết định dùng thử, làm việc với bộ phận mua sắm hoặc chốt buổi demo đầu tiên."
                  tone="violet"
                />

                <div className="space-y-6 pt-8">
                  {faqGuideSections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-28">
                      <LegalCard tone={section.tone} icon={section.icon} title={section.title}>
                        <p className="text-sm leading-7 text-zinc-400">{section.description}</p>
                        <div className="mt-5">
                          <LegalBulletGrid tone={section.tone} items={section.bullets} />
                        </div>
                      </LegalCard>
                    </section>
                  ))}
                </div>
              </div>

              <section className="border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(245,214,187,0.06),rgba(255,255,255,0.018))] px-5 py-8 sm:px-8 lg:px-10">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-white">
                      Nếu tài liệu đã đủ rõ, bước tiếp theo nên là xem một flow thật với JD và CV mẫu của đội ngũ.
                    </h2>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">
                      Buổi demo phù hợp nhất khi đội ngũ đã có một vị trí tuyển dụng thật, vài CV mẫu và mong muốn thấy rõ cách Support HR chấm điểm, đề cử và bàn giao bối cảnh cho người ra quyết định.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/book-demo"
                      className="inline-flex h-11 items-center justify-center bg-white px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-100"
                    >
                      Đặt lịch demo
                    </Link>
                    <Link
                      to="/contact-ready"
                      className="inline-flex h-11 items-center justify-center border border-white/12 px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
                    >
                      Xem kênh liên hệ
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-28 border border-white/8 bg-black/80 p-4 backdrop-blur-xl">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]/70">
                  On this page
                </p>
                <div className="mt-4 space-y-1">
                  {activeGroup.items.map((item) => {
                    const active = activeAnchor === item.id;
                    const style = LEGAL_TONE_STYLES[activeGroup.tone];

                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`flex items-start gap-3 px-3 py-2 text-sm transition-colors ${
                          active ? "bg-white/[0.04] text-white" : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                        }`}
                      >
                        <span className={`mt-[0.45rem] h-1.5 w-1.5 shrink-0 ${active ? style.dot : "bg-zinc-700"}`} />
                        <span>{item.title}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PricingPage;
