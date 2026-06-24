import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ScanLine,
  Boxes,
  Target,
  GitPullRequest,
  AlertOctagon,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { AegisLogo } from "@/components/AegisLogo";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/scan", label: "New scan", icon: ScanLine },
  { to: "/app/assets", label: "Assets", icon: Boxes },
  { to: "/app/prioritization", label: "Prioritization", icon: Target },
  { to: "/app/remediation", label: "Remediation", icon: GitPullRequest },
  { to: "/app/findings", label: "Findings", icon: AlertOctagon },
  { to: "/app/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-elevated/50 backdrop-blur transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-[244px]"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {collapsed ? <AegisLogo withWordmark={false} size={26} /> : <AegisLogo />}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors ${
                active
                  ? "bg-elevated-2 text-foreground"
                  : "text-muted-foreground hover:bg-elevated-2 hover:text-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-quantum"
                  aria-hidden
                />
              )}
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-quantum-cyan" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="m-3 inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-elevated-2 text-xs text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
      </button>
    </aside>
  );
}

function Topbar() {
  const navigate = useNavigate();
  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-elevated-2 px-3 py-1.5 text-sm text-foreground hover:border-quantum-cyan/40">
        <span className="h-2 w-2 rounded-full bg-quantum" />
        Acme Corp
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="relative ml-2 hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search assets, hosts, findings…"
          className="h-9 w-full rounded-md border border-border bg-elevated-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-quantum-cyan focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:block">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/app/scan"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-quantum px-3 text-sm font-medium text-primary-foreground shadow-glow-cyan transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" /> New scan
        </Link>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-elevated-2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={onLogout}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-elevated-2 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
