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
  { id: "plans", title: "Plan overview", icon: "fa-layer-group", tone: "cyan" },
  { id: "included", title: "What is included", icon: "fa-box-open", tone: "emerald" },
  { id: "rollout", title: "Rollout support", icon: "fa-handshake", tone: "sky" },
  { id: "commercial", title: "Commercial fit", icon: "fa-file-invoice-dollar", tone: "violet" },
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
            <LegalCard tone="emerald" icon="fa-list-check" title="Core product scope">
              <LegalBulletGrid
                tone="emerald"
                columns={2}
                items={[
                  "CV import from uploads and Google Drive",
                  "JD-driven screening workflow",
                  "Shortlist with supporting reasoning",
                  "History for recent review sessions",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "rollout":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-handshake-angle" title="What support looks like">
              <LegalBulletGrid
                tone="sky"
                items={[
                  "Initial walkthrough for the recruiting flow",
                  "Help connecting the source documents",
                  "Review of the first sample session",
                  "Commercial follow-up for scaling questions",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "commercial":
        return (
          <div className="space-y-4">
            <LegalCallout tone="violet" icon="fa-building" title="How to choose the right plan">
              Choose based on team size, monthly CV volume, and how much governance or rollout support the organization
              expects during adoption.
            </LegalCallout>
            <LegalCard tone="rose" icon="fa-phone" title="Procurement next step">
              If the pricing structure looks close to your needs, the fastest path is a live demo plus a quick volume
              discussion so the team can scope the right package.
            </LegalCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Pricing"
      title="Pricing and package overview"
      subtitle="A clear view of what each package is meant for, what is included in the core workflow, and how teams can move from evaluation to rollout."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "FAQ", to: "/faq" }}
      brandContext="Business docs"
      statusCountLabel="commercial topics"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default PricingPage;
