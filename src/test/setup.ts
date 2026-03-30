import '@testing-library/jest-dom';

// Polyfill ResizeObserver for jsdom (used by TabsNav, TabsHorizontal)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(): void { /* noop in tests */ }
    unobserve(): void { /* noop in tests */ }
    disconnect(): void { /* noop in tests */ }
  };
}
