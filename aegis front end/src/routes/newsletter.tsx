import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowUpRight, Mail } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Quantum security reading — Aegis" },
      {
        name: "description",
        content:
          "A curated reading list on post-quantum cryptography and security: NIST's standards and deadlines, the latest qubit resource estimates, and migration guidance.",
      },
    ],
  }),
  component: Newsletter,
});

type Article = {
  title: string;
  source: string;
  date: string;
  tag: "Standard" | "Research" | "Guidance" | "News";
  blurb: string;
  href: string;
};

// Curated, real, reputable sources. Each link opens externally.
const ARTICLES: Article[] = [
  {
    title: "NIST releases the first 3 finalized post-quantum encryption standards",
    source: "NIST",
    date: "Aug 2024",
    tag: "Standard",
    blurb:
      "FIPS 203 (ML-KEM), 204 (ML-DSA) and 205 (SLH-DSA) — the algorithms every PQC migration is now measured against.",
    href: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards",
  },
  {
    title: "NIST IR 8547 — Transition to Post-Quantum Cryptography Standards",
    source: "NIST CSRC",
    date: "2024",
    tag: "Standard",
    blurb:
      "The deadline roadmap: RSA and ECDSA deprecated after 2030 and disallowed after 2035. This is the clock everyone is migrating against.",
    href: "https://csrc.nist.gov/pubs/ir/8547/ipd",
  },
  {
    title: "How to factor 2048-bit RSA integers with less than a million noisy qubits",
    source: "Google Quantum AI · arXiv",
    date: "May 2025",
    tag: "Research",
    blurb:
      "Gidney's estimate cuts the qubit count ~20× from 2019. The reason 'sometime in the 2030s' is no longer comfortably far away.",
    href: "https://arxiv.org/abs/2505.15917",
  },
  {
    title: "Google researcher lowers the quantum bar to crack RSA encryption",
    source: "The Quantum Insider",
    date: "May 2025",
    tag: "News",
    blurb:
      "A readable walk-through of the new resource estimate and what it means for migration timelines.",
    href: "https://thequantuminsider.com/2025/05/24/google-researcher-lowers-quantum-bar-to-crack-rsa-encryption/",
  },
  {
    title: "Quantum-Readiness: Migration to Post-Quantum Cryptography",
    source: "CISA · NSA · NIST",
    date: "Aug 2023",
    tag: "Guidance",
    blurb:
      "The joint guidance that makes the wedge explicit: step one of every migration is building a cryptographic inventory.",
    href: "https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography",
  },
  {
    title: "What is post-quantum cryptography?",
    source: "Cloudflare",
    date: "Evergreen",
    tag: "Guidance",
    blurb:
      "A clear primer on Shor's algorithm, 'harvest now, decrypt later', and why the asymmetric layer is the whole problem.",
    href: "https://www.cloudflare.com/learning/ssl/quantum/what-is-post-quantum-cryptography/",
  },
];

const tagColor: Record<Article["tag"], string> = {
  Standard: "var(--primary)",
  Research: "var(--quantum-violet)",
  Guidance: "var(--pqc)",
  News: "var(--grover)",
};

function Newsletter() {
  return (
    <div className="relative min-h-screen text-foreground">
      <MarketingHeader />

      <section className="relative isolate overflow-hidden border-b border-border bg-background pb-16 pt-36">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="h-px w-6 bg-primary/40" />
              Reading list
            </div>
            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight md:text-5xl">
              Read what moves the <span className="text-gradient">quantum timeline</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A tight, curated feed on post-quantum cryptography — the standards, the deadlines, and
              the research that pulls "someday" closer. No churn, no hype: we only send an update
              when something genuinely matters.
            </p>
          </Reveal>
          <Reveal delay={0.05} className="mt-8">
            <Subscribe />
          </Reveal>
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <FeaturedArticle a={ARTICLES[0]} />
          </Reveal>
          <Stagger className="mt-5 grid gap-5 md:grid-cols-2">
            {ARTICLES.slice(1).map((a) => (
              <StaggerItem key={a.href}>
                <ArticleCard a={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function TagPill({ tag }: { tag: Article["tag"] }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: tagColor[tag],
        background: `color-mix(in oklab, ${tagColor[tag]} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${tagColor[tag]} 28%, transparent)`,
      }}
    >
      {tag}
    </span>
  );
}

/** The lead article — a wide, prominent card spanning the full row. */
function FeaturedArticle({ a }: { a: Article }) {
  return (
    <a href={a.href} target="_blank" rel="noopener noreferrer" className="block">
      <SpotlightCard
        className="overflow-hidden rounded-2xl"
        innerClassName="flex flex-col p-8 pl-9 md:p-10 md:pl-11"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: tagColor[a.tag] }}
        />
        <div className="flex items-center gap-3">
          <TagPill tag={a.tag} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Featured
          </span>
          <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover/spot:-translate-y-0.5 group-hover/spot:translate-x-0.5" />
        </div>
        <h2 className="mt-5 max-w-3xl text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          {a.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{a.blurb}</p>
        <div className="mt-5 text-xs font-medium text-muted-foreground">
          {a.source} · {a.date}
        </div>
      </SpotlightCard>
    </a>
  );
}

function ArticleCard({ a }: { a: Article }) {
  return (
    <a href={a.href} target="_blank" rel="noopener noreferrer" className="block h-full">
      <SpotlightCard
        className="h-full overflow-hidden rounded-2xl"
        innerClassName="flex h-full flex-col p-6 pl-7"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: tagColor[a.tag] }}
        />
        <div className="flex items-center justify-between gap-3">
          <TagPill tag={a.tag} />
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/spot:-translate-y-0.5 group-hover/spot:translate-x-0.5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight">{a.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.blurb}</p>
        <div className="mt-4 text-xs font-medium text-muted-foreground">
          {a.source} · {a.date}
        </div>
      </SpotlightCard>
    </a>
  );
}

function Subscribe() {
  const [email, setEmail] = useState("");
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — no backend yet. A real list provider drops in here later.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    toast.success("You're on the list.");
    setEmail("");
  };
  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          autoComplete="email"
          className="h-11 w-full rounded-md border border-border bg-card pl-10 pr-3 text-sm transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Subscribe
      </motion.button>
    </form>
  );
}
