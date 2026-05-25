import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "volume", title: "High-volume screening", icon: "fa-layer-group", tone: "cyan" },
  { id: "specialist", title: "Specialist roles", icon: "fa-user-gear", tone: "emerald" },
  { id: "shared", title: "Shared recruiter review", icon: "fa-people-arrows", tone: "sky" },
  { id: "audit", title: "Audit-friendly shortlists", icon: "fa-clipboard-check", tone: "violet" },
] satisfies LegalSectionMeta[];

const UseCasesPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("volume");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "volume":
        return (
          <LegalCard tone="cyan" icon="fa-inbox" title="When too many CVs arrive at once">
            <p>
              Teams can use Support HR to bring a large candidate pool into one review flow instead of opening every CV
              manually before the first shortlist.
            </p>
          </LegalCard>
        );
      case "specialist":
        return (
          <LegalCard tone="emerald" icon="fa-code" title="When the role is harder to evaluate quickly">
            <p>
              For specialist hiring, the workflow helps recruiters organize JD signals and compare applicants more
              consistently before handing the shortlist to a technical reviewer.
            </p>
          </LegalCard>
        );
      case "shared":
        return (
          <LegalCard tone="sky" icon="fa-users" title="When multiple people review the same role">
            <LegalBulletGrid
              tone="sky"
              items={[
                "Recruiter prepares the initial shortlist",
                "Hiring manager reviews a tighter candidate set",
                "The team keeps one consistent discussion surface",
              ]}
            />
          </LegalCard>
        );
      case "audit":
        return (
          <LegalCard tone="violet" icon="fa-book-open-reader" title="When the team needs a cleaner record">
            <p>
              Shortlist reasoning and workflow history make it easier to revisit how a hiring run was organized and why
              certain candidates were surfaced.
            </p>
          </LegalCard>
        );
      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Use cases"
      title="Operational use cases"
      subtitle="Examples of where Support HR helps most: high intake, specialist roles, shared review, and shortlist traceability."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "AI methodology", to: "/ai-methodology" }}
      brandContext="Business docs"
      statusCountLabel="operating scenarios"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default UseCasesPage;
