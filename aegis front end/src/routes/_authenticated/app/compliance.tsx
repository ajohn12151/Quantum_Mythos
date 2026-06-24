import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderBody } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/app/compliance")({ component: Page });
function Page() {
  return (
    <>
      <PageHeader eyebrow="Mandate" title="Compliance & audit" description="Mandate tracker with migration progress, deadlines, and exports." />
      <PlaceholderBody title="Compliance module lands in phase 4." body="NIST IR 8547, OMB M-23-02, CNSA 2.0, EU PQC roadmap — with progress bars, auditor-ready PDF/CSV export, and CBOM (CycloneDX)." />
    </>
  );
}
