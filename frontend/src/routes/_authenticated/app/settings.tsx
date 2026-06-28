import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Github, Globe, KeyRound, Plus, Check } from "lucide-react";
import { toast } from "sonner";
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
            <DomainsCard />
          </StaggerItem>
          <StaggerItem>
            <IntegrationsCard />
          </StaggerItem>
          <StaggerItem>
            <ApiKeyCard />
          </StaggerItem>
          <StaggerItem>
            <NotificationsCard />
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
        defaultValue={value}
        name={label.toLowerCase().replace(/\s+/g, "-")}
        autoComplete="off"
        className={`h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring ${mono ? "font-mono" : ""}`}
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
      <div className="mt-4 flex justify-end">
        <SaveButton />
      </div>
    </Section>
  );
}

function DomainsCard() {
  const [domains, setDomains] = useState([
    { host: "acme.com", cadence: "Daily" },
    { host: "edi.acme.com", cadence: "Weekly" },
    { host: "legacy-sso.acme.com", cadence: "Daily" },
  ]);
  const [input, setInput] = useState("");
  function add() {
    if (!input.trim()) return;
    setDomains((d) => [...d, { host: input.trim(), cadence: "Daily" }]);
    setInput("");
    toast.success(`Now monitoring ${input.trim()}.`);
  }
  return (
    <Section
      title="Monitored domains"
      description="Aegis continuously re-scans these and alerts on change."
    >
      <div className="space-y-2">
        {domains.map((d) => (
          <div
            key={d.host}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <Globe className="h-4 w-4 text-quantum-cyan" />
            <span className="flex-1 font-mono text-sm">{d.host}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {d.cadence}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="add a domain…"
          aria-label="Add a domain to monitor"
          autoComplete="off"
          spellCheck={false}
          className="h-10 flex-1 rounded-lg border border-border bg-card px-3 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={add}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </Section>
  );
}

function IntegrationsCard() {
  const [connected, setConnected] = useState(false);
  return (
    <Section
      title="Source integrations"
      description="Connect a repository to unlock white-box analysis and migration PRs."
    >
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Github className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">GitHub</div>
          <div className="text-xs text-muted-foreground">
            {connected ? "acme-org · 12 repositories" : "Not connected"}
          </div>
        </div>
        <button
          onClick={() => {
            setConnected((v) => !v);
            toast.success(connected ? "GitHub disconnected." : "GitHub connected.");
          }}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors ${
            connected
              ? "border border-border bg-card text-muted-foreground hover:text-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </Section>
  );
}

function ApiKeyCard() {
  const key = "aegis_sk_live_8f2c…a91d";
  return (
    <Section
      title="API access"
      description="Use the API to pull inventory and findings into your own tooling."
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
        <KeyRound className="h-4 w-4 text-quantum-violet" />
        <span className="flex-1 font-mono text-sm tracking-tight">{key}</span>
        <button
          onClick={() => toast.success("API key copied to clipboard.")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
    </Section>
  );
}

function NotificationsCard() {
  const items = [
    { label: "New critical finding", on: true },
    { label: "Posture score change > 5 points", on: true },
    { label: "Migration PR merged", on: true },
    { label: "Weekly digest", on: false },
  ];
  return (
    <Section title="Notifications" description="Choose what Aegis tells you about.">
      <div className="space-y-2">
        {items.map((i) => (
          <NotifRow key={i.label} label={i.label} defaultOn={i.on} />
        ))}
      </div>
    </Section>
  );
}

function NotifRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => {
        setSaved(true);
        toast.success("Settings saved.");
        window.setTimeout(() => setSaved(false), 1600);
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {saved ? <Check className="h-4 w-4" /> : null}
      {saved ? "Saved" : "Save changes"}
    </button>
  );
}
