import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "fit", title: "Who it is for", icon: "fa-users", tone: "cyan" },
  { id: "data", title: "CV and data handling", icon: "fa-file-lines", tone: "emerald" },
  { id: "ai", title: "How AI helps", icon: "fa-brain", tone: "sky" },
  { id: "setup", title: "Onboarding", icon: "fa-rocket", tone: "violet" },
  { id: "plans", title: "Plans and support", icon: "fa-comments-dollar", tone: "rose" },
] satisfies LegalSectionMeta[];

const FAQPage: React.FC = () => {
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
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-question" title="What kind of team is Support HR built for?">
              Support HR fits recruiting teams that need one place to import CVs, compare them against a JD, and share
              a reviewable shortlist with hiring stakeholders.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-briefcase" title="Common use cases">
              <LegalBulletGrid
                tone="cyan"
                columns={2}
                items={[
                  "Screening for one active role",
                  "High-volume intake for one recruiter",
                  "Shared review between recruiter and hiring manager",
                  "A repeatable shortlist workflow across the team",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "data":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-folder-tree" title="Which files can we bring in?">
              <p>
                Teams can work from uploaded files and connected Google Drive content, which makes it easier to keep
                recruiting materials in the same operating flow.
              </p>
            </LegalCard>
            <LegalCard tone="emerald" icon="fa-user-shield" title="Is candidate data handled carefully?">
              <p>
                The product is designed to use the files and account context required for the screening workflow, not
                to open unrelated folders or data sources in the background.
              </p>
            </LegalCard>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-4">
            <LegalCallout tone="sky" icon="fa-sparkles" title="Does AI replace the recruiter?">
              No. The goal is to speed up extraction, comparison, and shortlist preparation while keeping the final
              hiring judgment with the team.
            </LegalCallout>
            <LegalCard tone="sky" icon="fa-scale-balanced" title="How is scoring meant to be used?">
              <LegalBulletGrid
                tone="sky"
                items={[
                  "As a structured first-pass ranking",
                  "As a prompt for deeper human review",
                  "As a way to compare candidates against one JD consistently",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "setup":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-list-check" title="What does onboarding look like?">
              <LegalBulletGrid
                tone="violet"
                items={[
                  "Confirm the hiring workflow and target role",
                  "Connect the team account and Drive if needed",
                  "Load a sample JD and sample CV set",
                  "Review the shortlist and reporting format together",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "plans":
        return (
          <div className="space-y-4">
            <LegalCard tone="rose" icon="fa-tags" title="How do plans differ?">
              <p>
                Plans are shaped mainly by monthly CV volume, the number of recruiters involved, and the level of
                onboarding and operational support needed.
              </p>
            </LegalCard>
            <LegalCallout tone="rose" icon="fa-phone" title="Where do we ask sales questions?">
              Use the pricing page for package context, or go straight to the booking page if your team wants a live
              walkthrough.
            </LegalCallout>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="FAQ"
      title="Frequently asked questions"
      subtitle="A practical buying and onboarding FAQ for teams that want to understand fit, workflow, and operational expectations before adopting Support HR."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Book a demo", to: "/book-demo" }}
      brandContext="Business docs"
      statusCountLabel="buyer questions"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default FAQPage;
