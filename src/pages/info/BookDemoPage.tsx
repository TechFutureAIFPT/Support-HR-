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
  { id: "fit", title: "Who should book", icon: "fa-user-tie", tone: "cyan" },
  { id: "agenda", title: "What we cover", icon: "fa-calendar-check", tone: "emerald" },
  { id: "channels", title: "Contact channels", icon: "fa-phone", tone: "sky" },
  { id: "sla", title: "Response promise", icon: "fa-stopwatch", tone: "rose" },
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
          <LegalCallout tone="cyan" icon="fa-handshake" title="Best for serious evaluation">
            Book a demo when your team wants to compare the product against a real hiring workflow, not just browse a
            feature list.
          </LegalCallout>
        );
      case "agenda":
        return (
          <LegalCard tone="emerald" icon="fa-list-check" title="A useful first call usually covers">
            <LegalBulletGrid
              tone="emerald"
              items={[
                "Current hiring workflow and pain points",
                "A sample role and sample CV set",
                "How shortlist review happens today",
                "What commercial fit would look like next",
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
          <LegalCard tone="rose" icon="fa-envelope-open-text" title="Response expectation">
            <p>
              Support requests for a demo should receive a business-hours reply, with the first conversation focused on
              fit, workflow, and the right next commercial step.
            </p>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Book demo"
      title="Book a product walkthrough"
      subtitle="Contact channels and a clear expectation for what the first sales conversation should cover."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Pricing", to: "/pricing" }}
      brandContext="Business docs"
      statusCountLabel="booking details"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default BookDemoPage;
