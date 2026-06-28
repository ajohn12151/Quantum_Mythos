import { createFileRoute } from "@tanstack/react-router";
import { Github, Globe, KeyRound, Bell } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/app/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Organization, monitored domains, source integrations, and API access."
      />
      <div className="px-8 py-8">
        <Stagger immediate className="mx-auto grid max-w-5xl gap-6">
          <StaggerItem>
            <OrgCard />
          </StaggerItem>
          <StaggerItem>
            <ComingSoonCard
              icon={Globe}
              title="Monitored domains"
              description="Continuously re-scan domains and alert on change. Run scans from the Scan page for now."
            />
          </StaggerItem>
          <StaggerItem>
            <ComingSoonCard
              icon={Github}
              title="Source integrations"
              description="A GitHub App for in-place migration PRs. Today, white-box scans run from a repo URL on the Scan page."
            />
          </StaggerItem>
          <StaggerItem>
            <ComingSoonCard
              icon={KeyRound}
              title="API access"
              description="Programmatic API keys to pull inventory and findings into your own tooling."
            />
          </StaggerItem>
          <StaggerItem>
            <ComingSoonCard
              icon={Bell}
              title="Notifications"
              description="Alerts on new critical findings, posture changes, and merged migration PRs."
            />
          </StaggerItem>
        </Stagger>
      </div>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-6">
      <div className="mb-5">
        <h2 className="font-display text-lg tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        readOnly
        name={label.toLowerCase().replace(/\s+/g, "-")}
        autoComplete="off"
        className={`h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground/90 focus:outline-none ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function OrgCard() {
  const { orgName, plan } = useMe();
  return (
    <Section title="Organization" description="How Aegis labels your workspace and reports.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organization name" value={orgName} />
        <Field label="Plan" value={plan} mono />
      </div>
    </Section>
  );
}

function ComingSoonCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
}) {
  return (
    <div className="surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-display text-lg tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Coming soon
        </span>
      </div>
    </div>
  );
}
