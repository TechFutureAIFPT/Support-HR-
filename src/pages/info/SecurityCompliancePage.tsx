import React, { useEffect, useState } from "react";
import {
  LegalBulletGrid,
  LegalCallout,
  LegalCard,
  LegalPageLayout,
  type LegalSectionMeta,
} from "./legal-ui";

const sections = [
  { id: "controls", title: "Security controls", icon: "fa-shield-halved", tone: "cyan" },
  { id: "access", title: "Access and roles", icon: "fa-user-lock", tone: "emerald" },
  { id: "retention", title: "Retention and deletion", icon: "fa-clock-rotate-left", tone: "sky" },
  { id: "drive", title: "Google Drive scope", icon: "fa-folder-open", tone: "violet" },
  { id: "operations", title: "Operations and SLA", icon: "fa-life-ring", tone: "rose" },
] satisfies LegalSectionMeta[];

const SecurityCompliancePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("controls");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "controls":
        return (
          <div className="space-y-4">
            <LegalCallout tone="cyan" icon="fa-circle-check" title="Built for reviewable hiring operations">
              Support HR is designed so recruiting teams can move faster without losing visibility over files,
              criteria, and shortlist decisions.
            </LegalCallout>

            <div className="grid gap-4 xl:grid-cols-3">
              <LegalCard tone="cyan" icon="fa-lock" title="Transport and storage">
                <LegalBulletGrid
                  tone="cyan"
                  items={[
                    "Encrypted traffic for browser and API communication",
                    "Server-side credential handling for external services",
                    "Structured session storage for workflow continuity",
                  ]}
                />
              </LegalCard>
              <LegalCard tone="emerald" icon="fa-file-shield" title="Workflow protection">
                <LegalBulletGrid
                  tone="emerald"
                  items={[
                    "Per-user workspace state",
                    "Imported files only after user action",
                    "Traceable scoring and shortlist context",
                  ]}
                />
              </LegalCard>
              <LegalCard tone="violet" icon="fa-clipboard-check" title="Review readiness">
                <p>
                  The product keeps enough context around JD, CV imports, and scoring outputs for teams to review a
                  hiring session without rebuilding the entire flow from scratch.
                </p>
              </LegalCard>
            </div>
          </div>
        );

      case "access":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="emerald" icon="fa-users-gear" title="Who can access what" badge="Role-based use">
                <p>
                  Recruiters access the workflows they run, while admins can coordinate rollout, support, and policy
                  decisions for the team.
                </p>
                <p className="text-zinc-500">
                  Access to external services such as Google Drive is tied to the authenticated user session rather
                  than opened broadly across the organization.
                </p>
              </LegalCard>
              <LegalCard tone="sky" icon="fa-key" title="Credential handling">
                <LegalBulletGrid
                  tone="sky"
                  items={[
                    "Authentication stays linked to the signed-in account",
                    "Drive authorization is scoped to the connected user",
                    "Operational secrets are not exposed in the browser UI",
                  ]}
                />
              </LegalCard>
            </div>
          </div>
        );

      case "retention":
        return (
          <div className="space-y-4">
            <LegalCard tone="sky" icon="fa-database" title="Retention approach">
              <p>
                Workflow history is kept to support recruiter review, handoff, and audit of recent hiring decisions.
                Teams should align their retention window with internal hiring policy.
              </p>
            </LegalCard>
            <LegalCallout tone="rose" icon="fa-trash-can" title="Deletion support">
              When a team requests account or workspace cleanup, imported files and related workflow records should be
              removed in line with the agreed operating process and legal obligations.
            </LegalCallout>
          </div>
        );

      case "drive":
        return (
          <div className="space-y-4">
            <LegalCallout tone="violet" icon="fa-folder-open" title="Minimal Drive usage">
              Google Drive is used to help a signed-in user browse, select, and import recruiting documents into the
              screening workflow.
            </LegalCallout>
            <div className="grid gap-4 xl:grid-cols-2">
              <LegalCard tone="violet" icon="fa-list" title="What the integration touches">
                <LegalBulletGrid
                  tone="violet"
                  items={[
                    "File metadata needed for browsing and selection",
                    "The contents of files chosen by the user",
                    "Connected account context for the current session",
                  ]}
                />
              </LegalCard>
              <LegalCard tone="cyan" icon="fa-ban" title="What it does not do">
                <LegalBulletGrid
                  tone="cyan"
                  items={[
                    "No broad workspace ingestion without user action",
                    "No public sharing of imported files",
                    "No hidden background sync of unrelated Drive folders",
                  ]}
                />
              </LegalCard>
            </div>
          </div>
        );

      case "operations":
        return (
          <div className="space-y-4">
            <LegalCard tone="rose" icon="fa-headset" title="Operational expectations">
              <LegalBulletGrid
                tone="rose"
                items={[
                  "Business-hours response for rollout and usage questions",
                  "Support for onboarding, workflow setup, and product guidance",
                  "Issue triage when file processing or access flows need review",
                ]}
              />
            </LegalCard>
            <LegalCallout tone="emerald" icon="fa-handshake" title="Best fit">
              This page is intended as a practical trust summary for buyers. Teams with formal procurement requirements
              can extend it later with a DPA, security questionnaire, and dedicated SLA sheet.
            </LegalCallout>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LegalPageLayout
      pageLabel="Security"
      title="Security and compliance overview"
      subtitle="A buyer-facing summary of how Support HR handles access, file import, retention, and day-to-day operational trust for recruiting teams."
      meta="Business docs · Updated 2026"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isVisible={isVisible}
      auxiliaryLink={{ label: "Privacy policy", to: "/privacy-policy" }}
      brandContext="Business docs"
      statusCountLabel="trust checkpoints"
      statusNotes={[
        "[LIVE] Covers the current review topic",
        "[SYNC] Matches the same product language as the sales pages",
        "[NEXT] DPA and extended SLA can be added later",
      ]}
    >
      {renderSectionContent()}
    </LegalPageLayout>
  );
};

export default SecurityCompliancePage;
