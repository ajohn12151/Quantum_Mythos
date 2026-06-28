import { describe, it, expect, beforeEach } from "vitest";
import { isDemoSession, startDemoSession, endDemoSession, demoUser } from "./demo-auth";

describe("demo-auth", () => {
  // Reset via the module's own API so we stay on the same storage the code uses.
  beforeEach(() => endDemoSession());

  it("is not a demo session by default", () => {
    expect(isDemoSession()).toBe(false);
  });

  it("starts and ends a demo session (round-trip)", () => {
    startDemoSession();
    expect(isDemoSession()).toBe(true);
    endDemoSession();
    expect(isDemoSession()).toBe(false);
  });

  it("exposes a demo user with an id and email", () => {
    expect(demoUser.id).toBeTruthy();
    expect(demoUser.email).toMatch(/@/);
  });
});
