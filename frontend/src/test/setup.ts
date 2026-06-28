import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// The runner's localStorage is flaky (Node's experimental one is a no-op without
// a file path) — provide a clean in-memory Storage so storage round-trips work.
const __store = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return __store.size;
  },
  clear: () => __store.clear(),
  getItem: (k: string) => (__store.has(k) ? __store.get(k)! : null),
  key: (i: number) => Array.from(__store.keys())[i] ?? null,
  removeItem: (k: string) => void __store.delete(k),
  setItem: (k: string, v: string) => void __store.set(k, String(v)),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });

// jsdom doesn't implement these — stub them so components that probe the
// environment (reduced-motion, scroll-into-view, canvas) render without crashing.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", MockObserver);
vi.stubGlobal("ResizeObserver", MockObserver);

// Canvas: return null (components guard `if (!ctx) return`); avoids jsdom "not implemented".
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => null,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
