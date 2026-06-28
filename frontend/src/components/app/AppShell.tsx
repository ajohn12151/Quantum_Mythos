import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMe } from "@/hooks/useMe";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
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
  ArrowLeft,
} from "lucide-react";
import { AegisLogo } from "@/components/AegisLogo";
import { supabase } from "@/integrations/supabase/client";
import { endDemoSession } from "@/lib/demo-auth";

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
  const reduce = useReducedMotion();
  // Key the content on the route so each screen animates in/out on navigation.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <motion.div
          className="flex min-w-0 flex-1 flex-col"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Topbar />
          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </motion.div>
      </div>
    </MotionConfig>
  );
}

function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card/60 backdrop-blur transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-[244px]"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {collapsed ? <AegisLogo withWordmark={false} size={26} /> : <AegisLogo />}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary"
                  aria-hidden
                />
              )}
              <item.icon
                className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          to="/"
          className="group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          title={collapsed ? "Back to site" : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {!collapsed && <span>Back to site</span>}
        </Link>
      </div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-3 inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" /> Collapse
          </>
        )}
      </button>
    </aside>
  );
}

function Topbar() {
  const navigate = useNavigate();
  const { orgName } = useMe();
  const onLogout = async () => {
    endDemoSession();
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { redirect: undefined } });
  };
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-x-0 border-t-0 px-6">
      <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="max-w-[180px] truncate">{orgName}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="relative ml-2 hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          aria-label="Search assets, hosts, and findings"
          placeholder="Search assets, hosts, findings…"
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:block">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/app/scan"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New scan
        </Link>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={onLogout}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
