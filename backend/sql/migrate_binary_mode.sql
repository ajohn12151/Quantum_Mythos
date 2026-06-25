-- Allow scan.mode = 'binary' (binary-tier scans). schema.sql already reflects this
-- for fresh databases; run this once against an existing database.
ALTER TABLE scan DROP CONSTRAINT IF EXISTS scan_mode_check;
ALTER TABLE scan ADD CONSTRAINT scan_mode_check
    CHECK (mode IN ('black_box','white_box','binary'));
