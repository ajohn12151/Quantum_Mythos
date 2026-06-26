import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { AegisLogo } from "../AegisLogo";
import { useStartDemo } from "@/lib/demo-auth";

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const startDemo = useStartDemo();

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hide when scrolling down past a threshold; show when scrolling up.
      const last = lastScrollY.current;
      if (y > 120 && y > last) {
        setHidden(true);
      } else if (y < last) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "border-b border-border bg-background/65 backdrop-blur-xl"
            : "border-b border-transparent bg-background/25"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
        >
          <Link to="/" className="flex items-center">
            <AegisLogo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link
              to="/"
              className="transition-colors hover:text-foreground"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground" }}
            >
              Product
            </Link>
            <Link
              to="/how-it-works"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              How it works
            </Link>
            <Link
              to="/pricing"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startDemo}
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              <Play className="h-3.5 w-3.5" /> Live demo
            </button>
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              search={{ domain: undefined }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
            >
              Start free scan
            </Link>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
