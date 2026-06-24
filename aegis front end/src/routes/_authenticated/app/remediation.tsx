import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderBody } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/app/remediation")({ component: Page });
function Page() {
  return (
    <>
      <PageHeader eyebrow="Pipeline" title="Remediation" description="Discovered → Triaged → PR Open → Migrated → Verified." />
      <PlaceholderBody title="Remediation kanban lands in phase 3." body="Draggable cards with PR previews, differential-test status, and a satisfying re-scan-to-verify animation that flips assets to green." />
    </>
  );
}
