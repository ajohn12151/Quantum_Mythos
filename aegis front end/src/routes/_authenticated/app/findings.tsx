import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderBody } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/app/findings")({ component: Page });
function Page() {
  return (
    <>
      <PageHeader eyebrow="White-box" title="Findings" description="Classical crypto misuse — CWE-tagged, severity-filtered, first-party prioritized." />
      <PlaceholderBody title="Findings table lands in phase 4." body="Hardcoded keys, IV/nonce reuse, ECB, weak RNG, MD5/SHA-1, broken hostname validation — with explanation + suggested fix." />
    </>
  );
}
