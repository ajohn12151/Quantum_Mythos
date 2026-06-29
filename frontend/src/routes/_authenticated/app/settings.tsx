import { createFileRoute } from "@tanstack/react-router";
import { Github, Globe, KeyRound, Bell, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { useMe } from "@/hooks/useMe";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
          <StaggerItem>
            <DangerZone />
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

function DangerZone() {
  const { orgName } = useMe();
  const qc = useQueryClient();
  const isDemo = orgName === "Demo Org";
  const clear = useMutation({
    mutationFn: api.clearOrgData,
    onSuccess: (r) => {
      // Refetch dashboard / assets / findings / me so the UI resets immediately.
      qc.invalidateQueries();
      const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
      toast.success(
        `Workspace cleared — removed ${plural(r.scans, "scan")}, ${plural(r.assets, "asset")}, and ${plural(r.findings, "finding")}.`,
      );
    },
    onError: () =>
      toast.error(
        isDemo
          ? "Sign in to manage your own workspace — the shared demo can’t be cleared."
          : "Couldn’t clear the workspace. Please try again.",
      ),
  });

  return (
    <div className="surface border-destructive/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Trash2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-display text-lg tracking-tight">Clear all scan data</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Permanently delete every scan, discovered asset, finding, and remediation
              in this workspace — a clean slate for a fresh run. Your account and
              organization stay intact, and you remain signed in.
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDemo || clear.isPending}
              className="shrink-0"
            >
              {clear.isPending ? "Clearing…" : "Clear data"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all scan data?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes all scans, assets, findings, and remediations
                for <span className="font-medium text-foreground">{orgName}</span>. It
                can’t be undone. Your account and organization are kept, so you stay
                signed in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clear.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {isDemo && (
        <p className="mt-3 text-xs text-muted-foreground">
          Sign in to manage your own workspace data — the shared demo can’t be cleared.
        </p>
      )}
    </div>
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
