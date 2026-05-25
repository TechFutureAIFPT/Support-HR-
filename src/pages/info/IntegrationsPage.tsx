import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "drive", title: "Google Drive", icon: "fa-folder-open", tone: "cyan" },
  { id: "uploads", title: "Direct upload", icon: "fa-upload", tone: "emerald" },
  { id: "history", title: "Workflow memory", icon: "fa-clock-rotate-left", tone: "sky" },
  { id: "roadmap", title: "Roadmap fit", icon: "fa-plug", tone: "violet" },
] satisfies LegalSectionMeta[];

const IntegrationsPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("drive");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "drive":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-link" title="Drive is part of the daily workflow">
              Teams can connect the signed-in account and browse recruiting files without leaving the screening flow.
            </LegalCallout>
          </div>
        );
      case "uploads":
        return (
          <LegalCard tone="emerald" icon="fa-file-arrow-up" title="Upload still works for ad hoc sourcing">
            <p>
              If documents are not already in Drive, users can still import files directly and keep the same workflow
              inside the product.
            </p>
          </LegalCard>
        );
      case "history":
        return (
          <LegalCard tone="sky" icon="fa-timeline" title="Recent workflow context stays reviewable">
            <LegalBulletGrid
              tone="sky"
              items={[
                "Recent screening state can be restored",
                "The team can return to an in-progress review",
                "Reloading the page does not break normal continuity",
              ]}
            />
          </LegalCard>
        );
      case "roadmap":
        return (
          <LegalCard tone="violet" icon="fa-puzzle-piece" title="What this page is meant to signal">
            <p>
              This page is a practical integration summary for buyers today. Deeper ATS or HRIS integrations can be
              added later as part of the product roadmap and enterprise rollout discussions.
            </p>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Integrations"
      title="Integrations overview"
      subtitle="A buyer-facing summary of how Support HR connects to the current document workflow and where teams can expect the product to fit operationally."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Security", to: "/security" }}
      brandContext="Business docs"
      statusCountLabel="integration topics"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default IntegrationsPage;
