import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCountUp } from "./use-count-up";

describe("useCountUp", () => {
  it("stays at 0 while start=false", () => {
    const { result } = renderHook(() => useCountUp(100, { start: false }));
    expect(result.current).toBe(0);
  });

  it("jumps straight to the target under reduced motion", () => {
    window.matchMedia = ((q: string) => ({
      matches: true,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useCountUp(2035, { start: true }));
    return waitFor(() => expect(result.current).toBe(2035));
  });
});
