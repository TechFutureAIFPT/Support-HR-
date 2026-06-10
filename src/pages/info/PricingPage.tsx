import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  DocsHeaderTabs,
  DocsCopyPageButton,
  DocsFooter,
  DocsTopBar,
  LEGAL_TONE_STYLES,
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  type LegalTone,
} from "./legal-ui";
import { productDocsTabs } from "./docs-header-tabs";
import {
  type BillingMode,
  docsReadinessItems,
  docsNavigation,
  docsTrustMetrics,
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
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-2">
      {options.map((option) => {
        const active = billingMode === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`min-w-[180px] px-4 py-3 text-left transition-colors ${
              active
                ? "rounded-xl bg-white text-blue-700 shadow-sm"
                : "rounded-xl bg-transparent text-slate-600 hover:bg-white hover:text-blue-700"
            }`}
          >
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.18em]">{option.label}</p>
            <p className={`mt-1 text-sm ${active ? "text-slate-600" : "text-slate-500"}`}>{option.note}</p>
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
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border ${style.border} bg-white p-6 shadow-[0_16px_42px_rgba(30,64,175,0.08)]`}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${style.label}`}>
            {plan.highlightLabel}
          </p>
          <h3 className="mt-3 text-[1.85rem] font-semibold leading-tight text-slate-900">{plan.name}</h3>
          <p className="mt-2 text-sm text-slate-500">{plan.audience}</p>
        </div>
        <span className={`supporthr-mono shrink-0 text-[10px] uppercase tracking-[0.18em] ${style.label}`}>
          {modeContent.cycle}
        </span>
      </div>

      <div className="mt-8 border-y border-blue-100 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-3xl font-semibold text-slate-900">{plan.price}</p>
            <p className="mt-2 text-sm text-slate-500">{plan.capacity}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className={`supporthr-mono text-[10px] uppercase tracking-[0.18em] ${style.label}`}>
              {modeContent.commercialLabel}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-600">{plan.summary}</p>
      <p className="mt-4 text-sm leading-7 text-slate-500">{modeContent.serviceNote}</p>

      <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
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
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {plan.ctaLabel}
        </Link>
        <Link
          to="/book-demo"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-100 bg-white px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
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
      <div className="sticky top-28 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-blue-600">
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
                      ? `${style.border} ${style.surface} text-blue-700`
                      : "border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`supporthr-mono min-w-[1.7rem] text-[10px] uppercase tracking-[0.18em] ${
                        active ? style.label : "text-slate-400"
                      }`}
                    >
                      /{String(groupIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${group.icon} text-[11px] ${active ? style.accent : "text-slate-500"}`} />
                        <p className="text-sm font-semibold">{group.label}</p>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-slate-500">{group.description}</p>
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
                            ? `${style.label} rounded-xl bg-blue-50 text-blue-700`
                            : "text-slate-500 hover:rounded-xl hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${childActive ? style.dot : "bg-blue-100"}`} />
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

function DocsTrustPanel() {
  return (
    <div className="min-w-0 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
          Trust center
        </p>
        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(35,136,255,0.35)]" />
      </div>
      <div className="mt-5 space-y-3">
        {docsTrustMetrics.map((metric) => {
          const style = LEGAL_TONE_STYLES[metric.tone];

          return (
            <div key={metric.label} className={`rounded-2xl border ${style.border} bg-white px-4 py-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className={`mt-1 supporthr-mono text-[10px] uppercase tracking-[0.18em] ${style.label}`}>
                    {metric.label}
                  </p>
                </div>
                <span className={`mt-2 h-2 w-2 ${style.dot}`} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{metric.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocsReadinessPanel() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
        <div>
          <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-blue-600">
            Tài liệu sẵn sàng cho mua sắm
          </p>
          <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold leading-[1.02] tracking-normal text-slate-900">
            Các mục giúp website nhìn đáng tin hơn khi gửi cho khách hàng doanh nghiệp.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Một vài nội dung có thể trình bày ngay, nhưng các cam kết pháp lý cần thông tin chính thức để tránh ghi quá tay trên website.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {docsReadinessItems.map((item) => {
            const ready = item.status === "ready";

            return (
              <div key={item.label} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <span
                    className={`supporthr-mono shrink-0 border px-2 py-1 text-[9px] uppercase tracking-[0.16em] ${
                      ready
                        ? "border-teal-200 bg-teal-50 text-teal-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {ready ? "Sẵn sàng" : "Cần dữ liệu"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
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
    <div id={sectionId} className="scroll-mt-28 border-b border-blue-100 pb-6">
      <p className={`supporthr-mono text-[10px] uppercase tracking-[0.24em] ${style.label}`}>Mục lớn</p>
      <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.98] tracking-normal text-slate-900">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
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
    <div className="pricing-docs-page legal-page-shell min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-8" />
      </div>

      <div className="relative z-10">
        <DocsTopBar
          brandContext="Tài liệu doanh nghiệp"
          auxiliaryLink={{ label: "Hỏi đáp", to: "/pricing#faq" }}
        />

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
                <div className="grid gap-10 border-b border-blue-100 px-1 pb-10 pt-2 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-600">Tài liệu Support HR</p>
                    <h1 className="mt-3 max-w-3xl break-words text-[clamp(2rem,3.2vw,2.85rem)] font-semibold leading-[1.08] tracking-normal text-slate-900">
                      Bảng giá, bảo mật và câu hỏi mua hàng
                    </h1>
                    <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600 sm:text-lg">
                      Trang này tập trung riêng cho bảng giá và phần hỏi đáp thương mại. Các nội dung về đội ngũ, bảo mật dữ liệu và cách
                      sử dụng đã được tách sang các trang riêng để việc tra cứu gọn gàng và dễ theo dõi hơn.
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <DocsCopyPageButton />
                      <span className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Tài liệu doanh nghiệp · Cập nhật 2026
                      </span>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        to="/book-demo"
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
                      >
                        Đặt lịch demo
                      </Link>
                      <Link
                        to="/demo"
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-blue-100 bg-white px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
                      >
                        Xem luồng sản phẩm
                      </Link>
                    </div>

                    <div className="mt-8 rounded-2xl border border-blue-100 bg-white px-4 py-4 shadow-sm sm:px-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                          <i className="fa-solid fa-book-open text-xs" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-slate-900">Mục lục tài liệu</h2>
                          <p className="mt-2 text-sm leading-7 text-slate-500">
                            Chọn nhóm nội dung để đi nhanh tới phần tài liệu cần xem trước demo hoặc trước khi gửi cho bộ phận mua sắm.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {docsNavigation.map((group) => (
                        <a
                          key={group.id}
                          href={`#${group.id}`}
                          className="rounded-2xl border border-blue-100 bg-white px-4 py-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 text-sm ${LEGAL_TONE_STYLES[group.tone].accent}`}>
                              <i className={`fa-solid ${group.icon}`} />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-500">{group.description}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <DocsTrustPanel />
                </div>
              </section>

              <div className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm xl:hidden">
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
                            : "border-blue-100 bg-white text-slate-500"
                        }`}
                      >
                        <i className={`fa-solid ${group.icon} text-[10px]`} />
                        {group.label}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm xl:hidden">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Trong trang này</p>
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
                            : "border-blue-100 bg-white text-slate-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? style.dot : "bg-blue-100"}`} />
                        {item.title}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
                <SectionIntro
                  sectionId="pricing"
                  title="Bảng giá"
                  description="Khối này giúp đội ngũ nhìn nhanh cách Support HR định vị từng gói, cách đọc mức cam kết thương mại và đâu là điểm nên trao đổi tiếp trong buổi demo."
                  tone="cyan"
                />

                <section id="pricing-overview" className="scroll-mt-28 pt-8">
                  <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900">Tổng quan thương mại</h3>
                      <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                        Mỗi gói của Support HR được trình bày như một mức độ đồng hành khác nhau: từ bắt đầu nhanh, mở
                        rộng quy mô, đến triển khai có kiểm soát cho doanh nghiệp cần quy trình và tài liệu rõ ràng.
                      </p>

                      <div className="mt-6 flex justify-start">
                        <PricingToggle billingMode={billingMode} onChange={setBillingMode} />
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {pricingHeroHighlights.map((item) => (
                          <div key={item} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                              <p className="text-sm leading-7 text-slate-600">{item}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                      <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-blue-600">
                        Cách đọc nhanh
                      </p>
                      <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                        <p>Ưu tiên xem theo quy mô CV thực tế, số nhà tuyển dụng cùng vận hành và mức hỗ trợ triển khai mong muốn.</p>
                        <p>Công tắc tháng và năm không đổi giá niêm yết; nó chỉ giúp hình dung kiểu cam kết thương mại phù hợp.</p>
                        <p>Nếu đội ngũ đang ở giữa hai mức, demo là cách nhanh nhất để chốt gói đúng mà không phải suy đoán quá nhiều.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="pricing-plans" className="scroll-mt-28 pt-10">
                  <h3 className="text-2xl font-semibold text-slate-900">Ba gói triển khai</h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                    Các gói giữ cùng một triết lý sản phẩm, khác nhau chủ yếu ở quy mô xử lý, số người tham gia và độ sâu hỗ trợ khi đi vào dùng thật.
                  </p>

                  <div className="mt-8 grid gap-4 xl:grid-cols-3">
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
                  <h3 className="text-2xl font-semibold text-slate-900">Bảng so sánh nhanh</h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                    Bảng này không cố thay thế trao đổi thương mại, nhưng đủ rõ để nội bộ hình dung phạm vi từng gói trước khi đi vào buổi đánh giá thực tế.
                  </p>

                  <div className="mt-6 overflow-x-auto rounded-2xl border border-blue-100">
                    <div className="grid min-w-[58rem] grid-cols-[minmax(16rem,1.45fr)_repeat(3,minmax(9rem,1fr))] border-b border-blue-100 bg-blue-50">
                      <div className="px-4 py-4 text-sm font-medium text-slate-600">Hạng mục</div>
                      {pricingPlans.map((plan) => (
                        <div key={plan.name} className="px-4 py-4">
                          <ComparisonTonePill tone={plan.tone} label={plan.name} />
                        </div>
                      ))}
                    </div>

                    {pricingComparisonRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid min-w-[58rem] grid-cols-[minmax(16rem,1.45fr)_repeat(3,minmax(9rem,1fr))] border-b border-blue-100 last:border-b-0"
                      >
                        <div className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{row.description}</p>
                        </div>
                        {pricingPlans.map((plan) => (
                          <div key={`${row.label}-${plan.name}`} className="px-4 py-4 text-sm leading-7 text-slate-600">
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
                      <h3 className="text-2xl font-semibold text-slate-900">Câu hỏi thương mại thường gặp</h3>
                      <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                        Phần này giúp nhà tuyển dụng, quản lý tuyển dụng và bộ phận mua sắm có cùng ngôn ngữ trước khi đi sang giai đoạn đánh giá thực tế.
                      </p>
                      <LegalCallout tone="rose" icon="fa-phone" title="Khi nào nên chuyển từ đọc tài liệu sang buổi demo?">
                        Khi đội ngũ đã có một vị trí tuyển dụng thật, vài CV mẫu và muốn thấy rõ Support HR chấm điểm, đề cử và bàn giao ngữ cảnh ra sao trong quy trình hằng ngày.
                      </LegalCallout>
                    </div>

                    <div className="space-y-3">
                      {pricingFaqs.map((faq, index) => {
                        const open = openFaqIndex === index;

                        return (
                          <div key={faq.question} className="rounded-2xl border border-blue-100 bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(open ? -1 : index)}
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                              <span className="text-sm font-semibold text-slate-900 sm:text-base">{faq.question}</span>
                              <span className={`text-sm text-slate-500 transition-transform ${open ? "rotate-45" : ""}`}>+</span>
                            </button>
                            {open ? (
                              <div className="border-t border-blue-100 px-5 py-4 text-sm leading-7 text-slate-600">
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

              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
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
                        <div key={item.key} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600">
                              <i className={item.iconClass} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {item.eyebrow}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-white px-5 py-4 shadow-sm xl:justify-self-end">
                      <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-blue-600">
                        Vị trí tín hiệu tin cậy
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        DMCA và thông tin bản quyền được đặt ở chân trang để mọi trang công khai có tín hiệu pháp lý nhất quán.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="space-y-6 pt-8">
                  {securityDocSections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-28">
                      <LegalCard tone={section.tone} icon={section.icon} title={section.title}>
                        <p className="text-sm leading-7 text-slate-600">{section.description}</p>
                        <div className="mt-5">
                          <LegalBulletGrid tone={section.tone} items={section.bullets} />
                        </div>
                        {section.note ? <p className="mt-5 text-sm leading-7 text-slate-500">{section.note}</p> : null}
                      </LegalCard>
                    </section>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
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
                        <p className="text-sm leading-7 text-slate-600">{section.description}</p>
                        <div className="mt-5">
                          <LegalBulletGrid tone={section.tone} items={section.bullets} />
                        </div>
                      </LegalCard>
                    </section>
                  ))}
                </div>
              </div>

              <section className="rounded-2xl border border-blue-100 bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-10">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[0.98] tracking-normal text-slate-900">
                      Nếu tài liệu đã đủ rõ, bước tiếp theo nên là xem một flow thật với JD và CV mẫu của đội ngũ.
                    </h2>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                      Buổi demo phù hợp nhất khi đội ngũ đã có một vị trí tuyển dụng thật, vài CV mẫu và mong muốn thấy rõ cách Support HR chấm điểm, đề cử và bàn giao bối cảnh cho người ra quyết định.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/book-demo"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Đặt lịch demo
                    </Link>
                    <Link
                      to="/contact-ready"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-100 bg-white px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                    >
                      Xem kênh liên hệ
                    </Link>
                  </div>
                </div>
              </section>

              <DocsReadinessPanel />
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-28 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-blue-600">
                  Trong trang này
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
                          active ? "rounded-xl bg-blue-50 text-blue-700" : "text-slate-500 hover:rounded-xl hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <span className={`mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full ${active ? style.dot : "bg-blue-100"}`} />
                        <span>{item.title}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </main>
        <DocsFooter />
      </div>
    </div>
  );
};

export default PricingPage;
