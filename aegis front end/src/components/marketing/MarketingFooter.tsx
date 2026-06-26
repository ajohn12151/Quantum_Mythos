import { Link } from "@tanstack/react-router";
import { AegisLogo } from "../AegisLogo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <AegisLogo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Quantum cryptographic posture management. Discover, prioritize, remediate, and verify
              the cryptography quantum will break — before someone harvests it.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Product
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/newsletter"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reading list
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Company
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="#"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="#"
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="#"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <p className="max-w-2xl">
            Honesty note: a quantum computer capable of breaking RSA does not exist today. Aegis
            measures exposure and helps you migrate before one plausibly does — likely the 2030s.
          </p>
          <p>© {new Date().getFullYear()} Aegis Security, Inc.</p>
        </div>
      </div>
    </footer>
  );
}
