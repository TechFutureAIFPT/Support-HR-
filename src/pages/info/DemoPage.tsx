import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "intake", title: "JD intake", icon: "fa-file-signature", tone: "cyan" },
  { id: "import", title: "CV import", icon: "fa-file-import", tone: "emerald" },
  { id: "review", title: "Scoring and review", icon: "fa-scale-balanced", tone: "sky" },
  { id: "shortlist", title: "Shortlist output", icon: "fa-user-check", tone: "violet" },
  { id: "handoff", title: "Team handoff", icon: "fa-share-nodes", tone: "rose" },
] satisfies LegalSectionMeta[];

const DemoPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("intake");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "intake":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-diagram-project" title="Step 1: define the role clearly">
              A recruiter starts with one JD, then sets the workflow context so the system knows which skills, signals,
              and hard filters matter for that hiring run.
            </LegalCallout>
            <LegalCard tone="cyan" icon="fa-list" title="What the team prepares first">
              <LegalBulletGrid
                tone="cyan"
                items={[
                  "The target job description",
                  "Priority criteria for the role",
                  "Any hard requirements worth enforcing",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "import":
        return (
          <div className="space-y-4">
            <LegalCard tone="emerald" icon="fa-folder-open" title="Step 2: bring in candidate files">
              <p>
                CVs can come from local upload or Google Drive, so the team does not have to reorganize documents
                before using the product.
              </p>
            </LegalCard>
            <LegalCard tone="emerald" icon="fa-file-lines" title="Messy file inputs are still workable">
              <p>
                The workflow is designed to handle mixed document inputs and keep them inside the same screening run.
              </p>
            </LegalCard>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-sliders" title="Step 3: compare JD and CVs">
              <p>
                Support HR organizes the inputs into a consistent review surface so the recruiter can inspect fit,
                reasons, and possible gaps before finalizing a shortlist.
              </p>
            </LegalCard>
            <LegalCallout tone="sky" icon="fa-eye" title="The goal is reviewability">
              Buyers usually want to know whether the product helps them decide faster without turning the process into
              a black box. This is where the workflow proves itself.
            </LegalCallout>
          </div>
        );

      case "shortlist":
        return (
          <div className="space-y-4">
            <LegalCard tone="violet" icon="fa-clipboard-list" title="Step 4: produce a shortlist">
              <LegalBulletGrid
                tone="violet"
                items={[
                  "Ranked candidates for the current role",
                  "Reasons that support each recommendation",
                  "A tighter discussion surface for the next interview step",
                ]}
              />
            </LegalCard>
          </div>
        );

      case "handoff":
        return (
          <div className="space-y-4">
            <LegalCard tone="rose" icon="fa-people-group" title="Step 5: share the outcome">
              <p>
                The recruiter can bring the shortlist into a team conversation with more context already prepared for
                the hiring manager or panel.
              </p>
            </LegalCard>
            <Link
              to="/book-demo"
              className="inline-flex h-10 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
            >
              Book a live walkthrough
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Demo"
      title="Product walkthrough"
      subtitle="A plain-language walkthrough of how a recruiter can move from one JD and a pile of CVs to a reviewable shortlist inside Support HR."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Pricing", to: "/pricing" }}
      brandContext="Business docs"
      statusCountLabel="workflow steps"
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default DemoPage;
