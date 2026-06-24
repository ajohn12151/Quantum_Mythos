// Aegis mock data — realistic crypto posture for a fictional org "Acme Corp".
// Structured as DTOs so a real API can drop in without touching components.

export type CryptoStatus = "broken" | "weakened" | "safe" | "unknown";
export type AssetKind = "tls" | "ssh" | "code" | "certificate" | "library" | "secret";
export type Algorithm =
  | "RSA-2048"
  | "RSA-4096"
  | "ECDSA-P256"
  | "ECDSA-P384"
  | "Ed25519"
  | "DH-2048"
  | "AES-128"
  | "AES-256"
  | "SHA-1"
  | "SHA-256"
  | "ML-KEM-768"
  | "ML-DSA-65"
  | "X25519MLKEM768";

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  host?: string;
  algorithm: Algorithm;
  status: CryptoStatus;
  exposure: "internet" | "internal" | "partner";
  owner: string;
  environment: "prod" | "staging" | "dev";
  hndlRisk: number; // 0-100
  discoveredAt: string;
  recommendedFix?: string;
}

export const algorithmMeta: Record<Algorithm, { status: CryptoStatus; family: string; note: string }> = {
  "RSA-2048": { status: "broken", family: "RSA", note: "Broken by Shor's algorithm once a CRQC is available." },
  "RSA-4096": { status: "broken", family: "RSA", note: "Broken by Shor; key size offers no quantum protection." },
  "ECDSA-P256": { status: "broken", family: "ECC", note: "Broken by Shor on elliptic curves." },
  "ECDSA-P384": { status: "broken", family: "ECC", note: "Broken by Shor on elliptic curves." },
  "Ed25519": { status: "broken", family: "ECC", note: "Broken by Shor; signature scheme over Curve25519." },
  "DH-2048": { status: "broken", family: "DH", note: "Discrete log broken by Shor's algorithm." },
  "AES-128": { status: "weakened", family: "AES", note: "Grover halves effective security to ~64 bits — upgrade to AES-256." },
  "AES-256": { status: "safe", family: "AES", note: "Effective ~128 bits under Grover — considered quantum-safe." },
  "SHA-1": { status: "broken", family: "Hash", note: "Classically broken; not quantum-related." },
  "SHA-256": { status: "safe", family: "Hash", note: "Grover-resistant at 128-bit security." },
  "ML-KEM-768": { status: "safe", family: "PQC", note: "NIST FIPS 203 — post-quantum KEM." },
  "ML-DSA-65": { status: "safe", family: "PQC", note: "NIST FIPS 204 — post-quantum signature." },
  "X25519MLKEM768": { status: "safe", family: "Hybrid", note: "Hybrid PQC key exchange (RFC 9794 draft)." },
};

export const assets: Asset[] = [
  { id: "ast_001", name: "api.acme.com", kind: "tls", host: "api.acme.com", algorithm: "RSA-2048", status: "broken", exposure: "internet", owner: "platform", environment: "prod", hndlRisk: 92, discoveredAt: "2026-06-21", recommendedFix: "Migrate to hybrid X25519MLKEM768 on edge LB; enable HRSS on ALPN h2." },
  { id: "ast_002", name: "checkout.acme.com", kind: "tls", host: "checkout.acme.com", algorithm: "ECDSA-P256", status: "broken", exposure: "internet", owner: "payments", environment: "prod", hndlRisk: 98, discoveredAt: "2026-06-21", recommendedFix: "Dual-stack certificate; pin ML-DSA-65 alongside ECDSA until 2027 sunset." },
  { id: "ast_003", name: "vault.acme.internal", kind: "tls", host: "vault.acme.internal", algorithm: "RSA-4096", status: "broken", exposure: "internal", owner: "security", environment: "prod", hndlRisk: 88, discoveredAt: "2026-06-20", recommendedFix: "Rotate to ML-KEM-768 KEM; HSM supports PQC since v3.4." },
  { id: "ast_004", name: "git-bastion-01", kind: "ssh", host: "10.4.12.18", algorithm: "Ed25519", status: "broken", exposure: "internal", owner: "platform", environment: "prod", hndlRisk: 45, discoveredAt: "2026-06-19", recommendedFix: "Switch sshd to hybrid sntrup761x25519 host keys." },
  { id: "ast_005", name: "payments-svc/jwt.go", kind: "code", algorithm: "ECDSA-P256", status: "broken", exposure: "internal", owner: "payments", environment: "prod", hndlRisk: 76, discoveredAt: "2026-06-18", recommendedFix: "Replace ES256 JWTs with ML-DSA-65 via jose/v5 PQC build." },
  { id: "ast_006", name: "edge-cdn cert", kind: "certificate", algorithm: "ECDSA-P384", status: "broken", exposure: "internet", owner: "platform", environment: "prod", hndlRisk: 81, discoveredAt: "2026-06-18", recommendedFix: "Issue hybrid cert via Let's Encrypt PQ pilot." },
  { id: "ast_007", name: "auth-svc/openssl 3.2", kind: "library", algorithm: "RSA-2048", status: "broken", exposure: "internal", owner: "security", environment: "prod", hndlRisk: 70, discoveredAt: "2026-06-17", recommendedFix: "Upgrade to OpenSSL 3.5 with oqs-provider enabled." },
  { id: "ast_008", name: "telemetry-pipe", kind: "tls", host: "otel.acme.internal", algorithm: "AES-128", status: "weakened", exposure: "internal", owner: "platform", environment: "prod", hndlRisk: 22, discoveredAt: "2026-06-17", recommendedFix: "Bump cipher suite to AES-256-GCM." },
  { id: "ast_009", name: "data-lake at-rest", kind: "certificate", algorithm: "AES-256", status: "safe", exposure: "internal", owner: "data", environment: "prod", hndlRisk: 8, discoveredAt: "2026-06-15" },
  { id: "ast_010", name: "admin.acme.com (pilot)", kind: "tls", host: "admin.acme.com", algorithm: "X25519MLKEM768", status: "safe", exposure: "internet", owner: "platform", environment: "prod", hndlRisk: 3, discoveredAt: "2026-06-14" },
  { id: "ast_011", name: "release-signer", kind: "code", algorithm: "ML-DSA-65", status: "safe", exposure: "internal", owner: "platform", environment: "prod", hndlRisk: 2, discoveredAt: "2026-06-12" },
  { id: "ast_012", name: "legacy-sso.acme.com", kind: "tls", host: "legacy-sso.acme.com", algorithm: "SHA-1", status: "broken", exposure: "internet", owner: "identity", environment: "prod", hndlRisk: 99, discoveredAt: "2026-06-22", recommendedFix: "Decommission; redirect to identity.acme.com (ML-KEM hybrid)." },
  { id: "ast_013", name: "partner-edi", kind: "tls", host: "edi.acme.com", algorithm: "DH-2048", status: "broken", exposure: "partner", owner: "supply", environment: "prod", hndlRisk: 84, discoveredAt: "2026-06-21", recommendedFix: "Negotiate hybrid KEX with partner; fallback DHE-4096 for 90 days." },
  { id: "ast_014", name: "billing-svc tokens", kind: "secret", algorithm: "RSA-2048", status: "broken", exposure: "internal", owner: "payments", environment: "prod", hndlRisk: 67, discoveredAt: "2026-06-20", recommendedFix: "Re-mint with ML-DSA-65; rotate refresh tokens." },
  { id: "ast_015", name: "staging.acme.com", kind: "tls", host: "staging.acme.com", algorithm: "RSA-2048", status: "broken", exposure: "internet", owner: "platform", environment: "staging", hndlRisk: 30, discoveredAt: "2026-06-22", recommendedFix: "Mirror prod hybrid config." },
];

export function getAsset(id: string) {
  return assets.find((a) => a.id === id);
}

// Posture over 12 weeks — broken trending down, safe trending up
export const postureSeries = [
  { week: "W1",  broken: 312, weakened: 48, safe: 12 },
  { week: "W2",  broken: 308, weakened: 47, safe: 16 },
  { week: "W3",  broken: 301, weakened: 47, safe: 22 },
  { week: "W4",  broken: 294, weakened: 45, safe: 31 },
  { week: "W5",  broken: 286, weakened: 44, safe: 40 },
  { week: "W6",  broken: 271, weakened: 43, safe: 56 },
  { week: "W7",  broken: 258, weakened: 41, safe: 71 },
  { week: "W8",  broken: 242, weakened: 40, safe: 88 },
  { week: "W9",  broken: 224, weakened: 38, safe: 108 },
  { week: "W10", broken: 207, weakened: 36, safe: 127 },
  { week: "W11", broken: 188, weakened: 34, safe: 148 },
  { week: "W12", broken: 169, weakened: 32, safe: 169 },
];

export const recentScans = [
  { id: "scn_91", kind: "domain", target: "acme.com (+ 412 subs)", findings: 27, ranAt: "2h ago", status: "complete" },
  { id: "scn_90", kind: "repo",   target: "github.com/acme/payments-svc", findings: 14, ranAt: "5h ago", status: "complete" },
  { id: "scn_89", kind: "domain", target: "edi.acme.com", findings: 3, ranAt: "Yesterday", status: "complete" },
  { id: "scn_88", kind: "repo",   target: "github.com/acme/auth-svc", findings: 9, ranAt: "Yesterday", status: "complete" },
  { id: "scn_87", kind: "domain", target: "legacy-sso.acme.com", findings: 6, ranAt: "2d ago", status: "complete" },
];

export const riskScore = 68; // 0-100, higher = worse
export const totals = {
  broken: assets.filter((a) => a.status === "broken").length,
  weakened: assets.filter((a) => a.status === "weakened").length,
  safe: assets.filter((a) => a.status === "safe").length,
  total: assets.length,
  hndlExposed: assets.filter((a) => a.hndlRisk >= 60).length,
};
