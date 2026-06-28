import { describe, it, expect } from "vitest";
import { assets, totals, algorithmMeta, mandates, findings, remediations } from "./mock-data";

describe("mock-data integrity", () => {
  it("totals match the asset list", () => {
    const broken = assets.filter((a) => a.status === "broken").length;
    const weakened = assets.filter((a) => a.status === "weakened").length;
    const safe = assets.filter((a) => a.status === "safe").length;
    expect(totals.total).toBe(assets.length);
    expect(totals.broken).toBe(broken);
    expect(totals.weakened).toBe(weakened);
    expect(totals.safe).toBe(safe);
    expect(broken + weakened + safe).toBe(assets.length);
  });

  it("every asset has the required fields and a valid HNDL score", () => {
    for (const a of assets) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.algorithm).toBeTruthy();
      expect(["broken", "weakened", "safe", "unknown"]).toContain(a.status);
      expect(a.hndlRisk).toBeGreaterThanOrEqual(0);
      expect(a.hndlRisk).toBeLessThanOrEqual(100);
    }
  });

  it("each asset's status agrees with its algorithm's classification", () => {
    for (const a of assets) {
      expect(algorithmMeta[a.algorithm].status).toBe(a.status);
    }
  });

  it("mandate progress is a 0–100 percentage", () => {
    for (const m of mandates) {
      expect(m.progress).toBeGreaterThanOrEqual(0);
      expect(m.progress).toBeLessThanOrEqual(100);
    }
  });

  it("findings carry a CWE and a severity", () => {
    for (const f of findings) {
      expect(f.cwe).toMatch(/^CWE-\d+$/);
      expect(["critical", "high", "medium", "low"]).toContain(f.severity);
    }
  });

  it("remediations use a valid lifecycle state", () => {
    const states = ["discovered", "triaged", "pr_open", "migrated", "verified"];
    for (const r of remediations) expect(states).toContain(r.state);
  });
});
