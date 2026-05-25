import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "parse", title: "JD parsing", icon: "fa-file-lines", tone: "cyan" },
  { id: "criteria", title: "Criteria extraction", icon: "fa-filter", tone: "emerald" },
  { id: "scoring", title: "Scoring logic", icon: "fa-scale-balanced", tone: "sky" },
  { id: "reasoning", title: "Explainability", icon: "fa-comment-dots", tone: "violet" },
  { id: "review", title: "Human review", icon: "fa-user-check", tone: "rose" },
] satisfies LegalSectionMeta[];

const AIMethodologyPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("parse");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "parse":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-diagram-project" title="The flow starts from one role definition">
              The system first interprets the job description so the rest of the workflow is grounded in the same role,
              skill set, and hiring intent.
            </LegalCallout>
          </div>
        );

      case "criteria":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-list-ul" title="What the system tries to extract">
              <LegalBulletGrid
                tone="emerald"
                columns={2}
                items={[
                  "Role-specific skills",
                  "Experience expectations",
                  "Key requirements and hard filters",
                  "Context that shapes the shortlist",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "scoring":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-scale-balanced" title="How scoring should be understood">
              <p>
                Scoring is meant to provide a structured first-pass comparison for one JD, not a universal verdict on a
                candidate across every possible role.
              </p>
            </LegalCard>
          </div>
        );

      case "reasoning":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-message" title="Why explanations matter">
              <p>
                The product is more useful when recruiters can see why a candidate is being surfaced, where the gaps
                are, and what should be verified in the next round.
              </p>
            </LegalCard>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <LegalCallout tone="rose" icon="fa-user-pen" title="A recruiter stays in charge">
              Human review remains the final step. Support HR helps teams inspect the data faster and more consistently,
              but it does not remove the need for hiring judgment.
            </LegalCallout>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="AI"
      title="AI methodology in plain language"
      subtitle="A short explanation of how Support HR reads a JD, extracts criteria, scores candidates, and keeps the recruiter in the decision loop."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Demo", to: "/demo" }}
      brandContext="Business docs"
      statusCountLabel="method notes"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default AIMethodologyPage;
