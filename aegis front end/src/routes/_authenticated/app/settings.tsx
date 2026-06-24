import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderBody } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/app/settings")({ component: Page });
function Page() {
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Settings" description="Org, monitored domains, integrations, team, notifications." />
      <PlaceholderBody title="Settings panel lands in phase 4." body="GitHub connect, SSO placeholder, API keys, monitored domains with scan cadence, and team management." />
    </>
  );
}
