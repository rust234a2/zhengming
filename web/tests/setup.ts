import "@testing-library/jest-dom/vitest";

if (typeof HTMLCanvasElement !== "undefined") {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
}

/**
 * jsdom 没有实现 SVG 的尺寸 API（width/height 的 baseVal），
 * 而 d3-zoom 的 defaultExtent() 会去读 svg.width.baseVal.value 来决定缩放范围。
 * 真实浏览器里没问题，但在测试里会抛 TypeError 污染 stderr，
 * 掩盖真正的问题。这里补一个最小实现。
 */
if (typeof SVGElement !== "undefined") {
  const dimension = (value: number) => ({
    value,
    baseVal: { value },
    animVal: { value },
  });
  for (const [prop, fallback] of [
    ["width", 1000],
    ["height", 660],
  ] as const) {
    if (!(prop in SVGElement.prototype)) {
      Object.defineProperty(SVGElement.prototype, prop, {
        configurable: true,
        get() {
          const attr = this.getAttribute?.(prop);
          return dimension(attr ? Number(attr) : fallback);
        },
      });
    }
  }
}

/** jsdom 未实现 ResizeObserver；组件有降级分支，这里补桩以便走主路径。 */
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}
