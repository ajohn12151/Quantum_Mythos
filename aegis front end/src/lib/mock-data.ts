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

export const algorithmMeta: Record<
  Algorithm,
  { status: CryptoStatus; family: string; note: string }
> = {
  "RSA-2048": {
    status: "broken",
    family: "RSA",
    note: "Broken by Shor's algorithm once a CRQC is available.",
  },
  "RSA-4096": {
    status: "broken",
    family: "RSA",
    note: "Broken by Shor; key size offers no quantum protection.",
  },
  "ECDSA-P256": { status: "broken", family: "ECC", note: "Broken by Shor on elliptic curves." },
  "ECDSA-P384": { status: "broken", family: "ECC", note: "Broken by Shor on elliptic curves." },
  Ed25519: {
    status: "broken",
    family: "ECC",
    note: "Broken by Shor; signature scheme over Curve25519.",
  },
  "DH-2048": { status: "broken", family: "DH", note: "Discrete log broken by Shor's algorithm." },
  "AES-128": {
    status: "weakened",
    family: "AES",
    note: "Grover halves effective security to ~64 bits — upgrade to AES-256.",
  },
  "AES-256": {
    status: "safe",
    family: "AES",
    note: "Effective ~128 bits under Grover — considered quantum-safe.",
  },
  "SHA-1": { status: "broken", family: "Hash", note: "Classically broken; not quantum-related." },
  "SHA-256": { status: "safe", family: "Hash", note: "Grover-resistant at 128-bit security." },
  "ML-KEM-768": { status: "safe", family: "PQC", note: "NIST FIPS 203 — post-quantum KEM." },
  "ML-DSA-65": { status: "safe", family: "PQC", note: "NIST FIPS 204 — post-quantum signature." },
  X25519MLKEM768: {
    status: "safe",
    family: "Hybrid",
    note: "Hybrid PQC key exchange (RFC 9794 draft).",
  },
};

export const assets: Asset[] = [
  {
    id: "ast_001",
    name: "api.acme.com",
    kind: "tls",
    host: "api.acme.com",
    algorithm: "RSA-2048",
    status: "broken",
    exposure: "internet",
    owner: "platform",
    environment: "prod",
    hndlRisk: 92,
    discoveredAt: "2026-06-21",
    recommendedFix: "Migrate to hybrid X25519MLKEM768 on edge LB; enable HRSS on ALPN h2.",
  },
  {
    id: "ast_002",
    name: "checkout.acme.com",
    kind: "tls",
    host: "checkout.acme.com",
    algorithm: "ECDSA-P256",
    status: "broken",
    exposure: "internet",
    owner: "payments",
    environment: "prod",
    hndlRisk: 98,
    discoveredAt: "2026-06-21",
    recommendedFix: "Dual-stack certificate; pin ML-DSA-65 alongside ECDSA until 2027 sunset.",
  },
  {
    id: "ast_003",
    name: "vault.acme.internal",
    kind: "tls",
    host: "vault.acme.internal",
    algorithm: "RSA-4096",
    status: "broken",
    exposure: "internal",
    owner: "security",
    environment: "prod",
    hndlRisk: 88,
    discoveredAt: "2026-06-20",
    recommendedFix: "Rotate to ML-KEM-768 KEM; HSM supports PQC since v3.4.",
  },
  {
    id: "ast_004",
    name: "git-bastion-01",
    kind: "ssh",
    host: "10.4.12.18",
    algorithm: "Ed25519",
    status: "broken",
    exposure: "internal",
    owner: "platform",
    environment: "prod",
    hndlRisk: 45,
    discoveredAt: "2026-06-19",
    recommendedFix: "Switch sshd to hybrid sntrup761x25519 host keys.",
  },
  {
    id: "ast_005",
    name: "payments-svc/jwt.go",
    kind: "code",
    algorithm: "ECDSA-P256",
    status: "broken",
    exposure: "internal",
    owner: "payments",
    environment: "prod",
    hndlRisk: 76,
    discoveredAt: "2026-06-18",
    recommendedFix: "Replace ES256 JWTs with ML-DSA-65 via jose/v5 PQC build.",
  },
  {
    id: "ast_006",
    name: "edge-cdn cert",
    kind: "certificate",
    algorithm: "ECDSA-P384",
    status: "broken",
    exposure: "internet",
    owner: "platform",
    environment: "prod",
    hndlRisk: 81,
    discoveredAt: "2026-06-18",
    recommendedFix: "Issue hybrid cert via Let's Encrypt PQ pilot.",
  },
  {
    id: "ast_007",
    name: "auth-svc/openssl 3.2",
    kind: "library",
    algorithm: "RSA-2048",
    status: "broken",
    exposure: "internal",
    owner: "security",
    environment: "prod",
    hndlRisk: 70,
    discoveredAt: "2026-06-17",
    recommendedFix: "Upgrade to OpenSSL 3.5 with oqs-provider enabled.",
  },
  {
    id: "ast_008",
    name: "telemetry-pipe",
    kind: "tls",
    host: "otel.acme.internal",
    algorithm: "AES-128",
    status: "weakened",
    exposure: "internal",
    owner: "platform",
    environment: "prod",
    hndlRisk: 22,
    discoveredAt: "2026-06-17",
    recommendedFix: "Bump cipher suite to AES-256-GCM.",
  },
  {
    id: "ast_009",
    name: "data-lake at-rest",
    kind: "certificate",
    algorithm: "AES-256",
    status: "safe",
    exposure: "internal",
    owner: "data",
    environment: "prod",
    hndlRisk: 8,
    discoveredAt: "2026-06-15",
  },
  {
    id: "ast_010",
    name: "admin.acme.com (pilot)",
    kind: "tls",
    host: "admin.acme.com",
    algorithm: "X25519MLKEM768",
    status: "safe",
    exposure: "internet",
    owner: "platform",
    environment: "prod",
    hndlRisk: 3,
    discoveredAt: "2026-06-14",
  },
  {
    id: "ast_011",
    name: "release-signer",
    kind: "code",
    algorithm: "ML-DSA-65",
    status: "safe",
    exposure: "internal",
    owner: "platform",
    environment: "prod",
    hndlRisk: 2,
    discoveredAt: "2026-06-12",
  },
  {
    id: "ast_012",
    name: "legacy-sso.acme.com",
    kind: "tls",
    host: "legacy-sso.acme.com",
    algorithm: "SHA-1",
    status: "broken",
    exposure: "internet",
    owner: "identity",
    environment: "prod",
    hndlRisk: 99,
    discoveredAt: "2026-06-22",
    recommendedFix: "Decommission; redirect to identity.acme.com (ML-KEM hybrid).",
  },
  {
    id: "ast_013",
    name: "partner-edi",
    kind: "tls",
    host: "edi.acme.com",
    algorithm: "DH-2048",
    status: "broken",
    exposure: "partner",
    owner: "supply",
    environment: "prod",
    hndlRisk: 84,
    discoveredAt: "2026-06-21",
    recommendedFix: "Negotiate hybrid KEX with partner; fallback DHE-4096 for 90 days.",
  },
  {
    id: "ast_014",
    name: "billing-svc tokens",
    kind: "secret",
    algorithm: "RSA-2048",
    status: "broken",
    exposure: "internal",
    owner: "payments",
    environment: "prod",
    hndlRisk: 67,
    discoveredAt: "2026-06-20",
    recommendedFix: "Re-mint with ML-DSA-65; rotate refresh tokens.",
  },
  {
    id: "ast_015",
    name: "staging.acme.com",
    kind: "tls",
    host: "staging.acme.com",
    algorithm: "RSA-2048",
    status: "broken",
    exposure: "internet",
    owner: "platform",
    environment: "staging",
    hndlRisk: 30,
    discoveredAt: "2026-06-22",
    recommendedFix: "Mirror prod hybrid config.",
  },
];

export function getAsset(id: string) {
  return assets.find((a) => a.id === id);
}

// Posture over 12 weeks — broken trending down, safe trending up
export const postureSeries = [
  { week: "W1", broken: 312, weakened: 48, safe: 12 },
  { week: "W2", broken: 308, weakened: 47, safe: 16 },
  { week: "W3", broken: 301, weakened: 47, safe: 22 },
  { week: "W4", broken: 294, weakened: 45, safe: 31 },
  { week: "W5", broken: 286, weakened: 44, safe: 40 },
  { week: "W6", broken: 271, weakened: 43, safe: 56 },
  { week: "W7", broken: 258, weakened: 41, safe: 71 },
  { week: "W8", broken: 242, weakened: 40, safe: 88 },
  { week: "W9", broken: 224, weakened: 38, safe: 108 },
  { week: "W10", broken: 207, weakened: 36, safe: 127 },
  { week: "W11", broken: 188, weakened: 34, safe: 148 },
  { week: "W12", broken: 169, weakened: 32, safe: 169 },
];

export const recentScans = [
  {
    id: "scn_91",
    kind: "domain",
    target: "acme.com (+ 412 subs)",
    findings: 27,
    ranAt: "2h ago",
    status: "complete",
  },
  {
    id: "scn_90",
    kind: "repo",
    target: "github.com/acme/payments-svc",
    findings: 14,
    ranAt: "5h ago",
    status: "complete",
  },
  {
    id: "scn_89",
    kind: "domain",
    target: "edi.acme.com",
    findings: 3,
    ranAt: "Yesterday",
    status: "complete",
  },
  {
    id: "scn_88",
    kind: "repo",
    target: "github.com/acme/auth-svc",
    findings: 9,
    ranAt: "Yesterday",
    status: "complete",
  },
  {
    id: "scn_87",
    kind: "domain",
    target: "legacy-sso.acme.com",
    findings: 6,
    ranAt: "2d ago",
    status: "complete",
  },
];

// ── Remediation pipeline ────────────────────────────────────────────────────
// One row per asset moving through the lifecycle state machine.
export type RemediationState = "discovered" | "triaged" | "pr_open" | "migrated" | "verified";
export const REMEDIATION_STATES: { key: RemediationState; label: string }[] = [
  { key: "discovered", label: "Discovered" },
  { key: "triaged", label: "Triaged" },
  { key: "pr_open", label: "PR open" },
  { key: "migrated", label: "Migrated" },
  { key: "verified", label: "Verified" },
];

export interface Remediation {
  id: string;
  asset: string;
  from: Algorithm;
  to: Algorithm;
  state: RemediationState;
  owner: string;
  pr?: number;
  updatedAt: string;
  diffBefore?: string;
  diffAfter?: string;
  checks?: { label: string; pass: boolean }[];
}

export const remediations: Remediation[] = [
  {
    id: "rem_01",
    asset: "checkout.acme.com",
    from: "ECDSA-P256",
    to: "X25519MLKEM768",
    state: "pr_open",
    owner: "payments",
    pr: 1284,
    updatedAt: "12m ago",
    diffBefore: "signer := ecdsa.New(elliptic.P256(), key)",
    diffAfter: "signer := pqc.Hybrid(MLDSA65, ecdsaKey)",
    checks: [
      { label: "differential round-trip", pass: true },
      { label: "size assertion · 3309 B ≤ budget", pass: true },
      { label: "interop · legacy clients", pass: true },
    ],
  },
  {
    id: "rem_02",
    asset: "api.acme.com",
    from: "RSA-2048",
    to: "X25519MLKEM768",
    state: "pr_open",
    owner: "platform",
    pr: 1281,
    updatedAt: "1h ago",
    diffBefore: "tls.Config{CurvePreferences: []tls.CurveID{tls.X25519}}",
    diffAfter: "tls.Config{CurvePreferences: []tls.CurveID{tls.X25519MLKEM768, tls.X25519}}",
    checks: [
      { label: "differential round-trip", pass: true },
      { label: "ClientHello ≤ 1400 B", pass: true },
      { label: "handshake p99 < 40ms", pass: false },
    ],
  },
  {
    id: "rem_03",
    asset: "vault.acme.internal",
    from: "RSA-4096",
    to: "ML-KEM-768",
    state: "triaged",
    owner: "security",
    updatedAt: "3h ago",
  },
  {
    id: "rem_04",
    asset: "payments-svc/jwt.go",
    from: "ECDSA-P256",
    to: "ML-DSA-65",
    state: "migrated",
    owner: "payments",
    pr: 1270,
    updatedAt: "Yesterday",
    diffBefore: "jwt.SigningMethodES256",
    diffAfter: "jwt.SigningMethodMLDSA65",
    checks: [
      { label: "differential round-trip", pass: true },
      { label: "token size ≤ 4 KB", pass: true },
    ],
  },
  {
    id: "rem_05",
    asset: "legacy-sso.acme.com",
    from: "SHA-1",
    to: "ML-DSA-65",
    state: "discovered",
    owner: "identity",
    updatedAt: "2h ago",
  },
  {
    id: "rem_06",
    asset: "partner-edi",
    from: "DH-2048",
    to: "ML-KEM-768",
    state: "triaged",
    owner: "supply",
    updatedAt: "5h ago",
  },
  {
    id: "rem_07",
    asset: "git-bastion-01",
    from: "Ed25519",
    to: "X25519MLKEM768",
    state: "discovered",
    owner: "platform",
    updatedAt: "1d ago",
  },
  {
    id: "rem_08",
    asset: "release-signer",
    from: "ECDSA-P256",
    to: "ML-DSA-65",
    state: "verified",
    owner: "platform",
    pr: 1242,
    updatedAt: "3d ago",
    checks: [
      { label: "differential round-trip", pass: true },
      { label: "re-scan · quantum-safe", pass: true },
    ],
  },
  {
    id: "rem_09",
    asset: "admin.acme.com",
    from: "RSA-2048",
    to: "X25519MLKEM768",
    state: "verified",
    owner: "platform",
    pr: 1235,
    updatedAt: "4d ago",
    checks: [
      { label: "differential round-trip", pass: true },
      { label: "re-scan · quantum-safe", pass: true },
    ],
  },
  {
    id: "rem_10",
    asset: "edge-cdn cert",
    from: "ECDSA-P384",
    to: "X25519MLKEM768",
    state: "migrated",
    owner: "platform",
    pr: 1260,
    updatedAt: "Yesterday",
    checks: [
      { label: "differential round-trip", pass: true },
      { label: "chain size ≤ 14 KB", pass: true },
    ],
  },
];

// ── White-box findings (classical crypto misuse) ────────────────────────────
export type Severity = "critical" | "high" | "medium" | "low";
export interface Finding {
  id: string;
  title: string;
  cwe: string;
  severity: Severity;
  file: string;
  repo: string;
  status: "open" | "triaged" | "fixed";
  firstParty: boolean;
  explanation: string;
  fix: string;
}

export const findings: Finding[] = [
  {
    id: "fnd_01",
    title: "Hardcoded AES key in source",
    cwe: "CWE-321",
    severity: "critical",
    file: "internal/crypto/seal.go:31",
    repo: "payments-svc",
    status: "open",
    firstParty: true,
    explanation:
      "A 256-bit AES key is embedded as a string literal, so anyone with read access to the repo can decrypt sealed data.",
    fix: "Load the key from your KMS/secrets manager at runtime; rotate the exposed key immediately.",
  },
  {
    id: "fnd_02",
    title: "Nonce reuse in AES-GCM",
    cwe: "CWE-323",
    severity: "critical",
    file: "internal/storage/aead.go:88",
    repo: "payments-svc",
    status: "open",
    firstParty: true,
    explanation:
      "The same 12-byte nonce is reused across encryptions under one key — GCM nonce reuse leaks the auth key and enables forgery.",
    fix: "Derive a fresh random nonce per message (crypto/rand) or use a misuse-resistant mode (AES-GCM-SIV).",
  },
  {
    id: "fnd_03",
    title: "ECB mode encryption",
    cwe: "CWE-327",
    severity: "high",
    file: "pkg/legacy/cipher.go:54",
    repo: "auth-svc",
    status: "triaged",
    firstParty: true,
    explanation:
      "ECB encrypts identical plaintext blocks to identical ciphertext, revealing structure in the data.",
    fix: "Switch to an authenticated mode (AES-256-GCM) with a random IV.",
  },
  {
    id: "fnd_04",
    title: "Weak RNG for token generation",
    cwe: "CWE-338",
    severity: "high",
    file: "internal/token/mint.go:17",
    repo: "auth-svc",
    status: "open",
    firstParty: true,
    explanation:
      "Session tokens are generated with math/rand, which is predictable and not cryptographically secure.",
    fix: "Use crypto/rand to generate token bytes.",
  },
  {
    id: "fnd_05",
    title: "MD5 used for integrity",
    cwe: "CWE-328",
    severity: "medium",
    file: "pkg/util/checksum.go:9",
    repo: "platform-core",
    status: "open",
    firstParty: true,
    explanation:
      "MD5 is collision-broken; using it for integrity allows tampering to go undetected.",
    fix: "Replace with SHA-256 for integrity, or HMAC-SHA-256 if a key is involved.",
  },
  {
    id: "fnd_06",
    title: "Disabled TLS hostname verification",
    cwe: "CWE-295",
    severity: "critical",
    file: "internal/http/client.go:42",
    repo: "platform-core",
    status: "open",
    firstParty: true,
    explanation:
      "InsecureSkipVerify is set to true, so the client accepts any certificate — enabling trivial MITM.",
    fix: "Remove InsecureSkipVerify; pin or validate the server certificate chain.",
  },
  {
    id: "fnd_07",
    title: "Non-constant-time MAC comparison",
    cwe: "CWE-208",
    severity: "medium",
    file: "internal/webhook/verify.go:63",
    repo: "payments-svc",
    status: "open",
    firstParty: true,
    explanation:
      "Signature comparison uses == on byte slices, leaking timing information that can be used to forge a valid MAC.",
    fix: "Use hmac.Equal / subtle.ConstantTimeCompare.",
  },
  {
    id: "fnd_08",
    title: "Static IV in CBC encryption",
    cwe: "CWE-329",
    severity: "high",
    file: "vendor/cryptoutil/cbc.go:120",
    repo: "auth-svc",
    status: "open",
    firstParty: false,
    explanation:
      "A fixed IV is reused across CBC encryptions, which leaks whether two plaintexts share a prefix.",
    fix: "Generate a random IV per message and prepend it to the ciphertext.",
  },
];

// ── Compliance mandates ─────────────────────────────────────────────────────
export interface Mandate {
  id: string;
  name: string;
  authority: string;
  deadline: string;
  progress: number; // 0-100
  status: "met" | "on_track" | "at_risk";
  summary: string;
  controls: { label: string; done: boolean }[];
}

export const mandates: Mandate[] = [
  {
    id: "man_01",
    name: "NIST IR 8547",
    authority: "NIST",
    deadline: "RSA/ECDSA disallowed after 2035",
    progress: 54,
    status: "on_track",
    summary:
      "Transition away from quantum-vulnerable algorithms; deprecated after 2030, disallowed after 2035.",
    controls: [
      { label: "Cryptographic inventory complete", done: true },
      { label: "Migration plan filed", done: true },
      { label: "≥ 50% of internet-facing assets hybrid", done: true },
      { label: "All asymmetric crypto PQC", done: false },
    ],
  },
  {
    id: "man_02",
    name: "OMB M-23-02 / NSM-10",
    authority: "US OMB",
    deadline: "Annual inventory",
    progress: 78,
    status: "on_track",
    summary:
      "US agencies must produce an annual cryptographic inventory and a prioritized migration plan.",
    controls: [
      { label: "Annual inventory submitted", done: true },
      { label: "Prioritized by HNDL risk", done: true },
      { label: "Migration funding requested", done: true },
      { label: "Quarterly progress reporting", done: false },
    ],
  },
  {
    id: "man_03",
    name: "NSA CNSA 2.0",
    authority: "NSA",
    deadline: "PQC-exclusive signing by 2030",
    progress: 31,
    status: "at_risk",
    summary:
      "National-security systems must support PQC from 2027; software/firmware signing PQC-exclusive by 2030.",
    controls: [
      { label: "Code-signing PQC pilot", done: true },
      { label: "Firmware signing migrated", done: false },
      { label: "PQC in new acquisitions", done: false },
      { label: "Legacy sunset scheduled", done: false },
    ],
  },
  {
    id: "man_04",
    name: "EU PQC Roadmap",
    authority: "EU Commission",
    deadline: "High-risk by 2030",
    progress: 47,
    status: "on_track",
    summary:
      "High-risk use cases quantum-safe by 2030, full transition by 2035; requires cryptographic asset management + dependency maps.",
    controls: [
      { label: "Crypto asset management in place", done: true },
      { label: "Dependency map generated", done: true },
      { label: "High-risk systems migrated", done: false },
      { label: "Vendor attestations collected", done: false },
    ],
  },
  {
    id: "man_05",
    name: "FIPS 203 / 204 / 205",
    authority: "NIST",
    deadline: "Standards finalized 2024-08",
    progress: 62,
    status: "on_track",
    summary:
      "Adopt ML-KEM (203), ML-DSA (204), SLH-DSA (205) as the approved post-quantum primitives.",
    controls: [
      { label: "ML-KEM in TLS edge", done: true },
      { label: "ML-DSA for signing", done: true },
      { label: "Verified library (liboqs) pinned", done: true },
      { label: "SLH-DSA for long-term sigs", done: false },
    ],
  },
];

export const riskScore = 68; // 0-100, higher = worse
export const totals = {
  broken: assets.filter((a) => a.status === "broken").length,
  weakened: assets.filter((a) => a.status === "weakened").length,
  safe: assets.filter((a) => a.status === "safe").length,
  total: assets.length,
  hndlExposed: assets.filter((a) => a.hndlRisk >= 60).length,
};
