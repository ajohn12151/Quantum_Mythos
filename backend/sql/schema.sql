-- Quantum Mythos — Aurora PostgreSQL schema.
-- This is the integration contract: the dashboard reads these tables via the API.
-- The DB is the product: a lifecycle state machine (Discover -> Prioritize -> Remediate -> Verify).

CREATE TABLE IF NOT EXISTS org (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    plan         TEXT NOT NULL DEFAULT 'free'
                 CHECK (plan IN ('free','pro','enterprise')),  -- entitlement tier
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- idempotent for already-created DBs
ALTER TABLE IF EXISTS org ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Minimal user table for the demo sign-up/login (Alan's button hits this).
CREATE TABLE IF NOT EXISTS app_user (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    email        TEXT UNIQUE NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    mode         TEXT NOT NULL CHECK (mode IN ('black_box','white_box','binary')),
    target       TEXT NOT NULL,                 -- domain (black-box), repo URL (white-box), or path/artifact (binary)
    status       TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','done','error')),
    summary_json JSONB,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at  TIMESTAMPTZ
);

-- One row per discovered cryptographic asset (black-box OR white-box).
CREATE TABLE IF NOT EXISTS crypto_asset (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    scan_id       UUID REFERENCES scan(id) ON DELETE SET NULL,
    source        TEXT NOT NULL,                -- 'tls'|'ssh'|'mail'|'ct_log'|'code_dep'|'code_misuse'
    host          TEXT,                         -- network locus
    file_path     TEXT,                         -- source locus
    line          INT,
    pubkey_algo   TEXT,
    key_bits      INT,
    curve         TEXT,
    sig_algo      TEXT,
    kex_group     TEXT,
    tls_version   TEXT,
    category      TEXT CHECK (category IN ('shor_broken','grover_weakened','pqc','unknown')),
    forward_secrecy        BOOLEAN,
    reachable_from_public  BOOLEAN,             -- white-box reasoning output
    data_sensitivity       TEXT,                -- 'pii'|'secrets'|'public'|'unknown'
    confidentiality_lifetime_years INT,
    est_time_to_break      TEXT,                -- resource-estimation output (the moat column)
    hndl_risk              TEXT,                -- 'high'|'medium'|'low'
    priority_score         NUMERIC,            -- data_lifetime x quantum_horizon ranking
    priority_rationale     TEXT,                -- plain-English "why this rank" (REASON layer)
    first_seen    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asset_org ON crypto_asset(org_id);
CREATE INDEX IF NOT EXISTS idx_asset_category ON crypto_asset(category);
ALTER TABLE IF EXISTS crypto_asset ADD COLUMN IF NOT EXISTS priority_rationale TEXT;

-- Remediation lifecycle state machine. Re-scan flips state to 'verified' (red -> green).
CREATE TABLE IF NOT EXISTS remediation (
    asset_id     UUID PRIMARY KEY REFERENCES crypto_asset(id) ON DELETE CASCADE,
    state        TEXT NOT NULL DEFAULT 'discovered'
                 CHECK (state IN ('discovered','triaged','pr_open','migrated','verified')),
    pr_url       TEXT,
    opened_at    TIMESTAMPTZ,
    verified_at  TIMESTAMPTZ
);

-- Classical crypto-misuse findings (white-box discover layer).
CREATE TABLE IF NOT EXISTS finding (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id     UUID REFERENCES crypto_asset(id) ON DELETE CASCADE,
    org_id       UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    cwe          TEXT,
    title        TEXT NOT NULL,
    severity     TEXT,                          -- 'critical'|'high'|'medium'|'low'
    file_path    TEXT,
    line         INT,
    explanation  TEXT,
    suggested_fix TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posture snapshot per scan — the seed of the historical state-of-record.
-- Feeds the dashboard "posture over time" (red->green) trend; accrues real
-- history going forward (we cannot fabricate a past). One row per scan.
CREATE TABLE IF NOT EXISTS scan_summary (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    scan_id      UUID REFERENCES scan(id) ON DELETE SET NULL,
    captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    broken       INT NOT NULL DEFAULT 0,
    weakened     INT NOT NULL DEFAULT 0,
    safe         INT NOT NULL DEFAULT 0,
    total        INT NOT NULL DEFAULT 0,
    risk_score   INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_scan_summary_org_time ON scan_summary(org_id, captured_at);

-- idempotent migrations (so an already-created DB picks up new columns)
ALTER TABLE IF EXISTS finding ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE IF EXISTS finding ADD COLUMN IF NOT EXISTS line INT;
ALTER TABLE IF EXISTS finding ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;
