import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DebateTreeSeed } from "../src/types/debateTree";
import {
  EXPANDED_STORAGE_KEY,
  LAST_SEED_STORAGE_KEY,
  LEGACY_EXPANDED_STORAGE_KEY,
  readExpanded,
  readRememberedSeed,
  readSeedFromUrl,
  rememberSeed,
  resolveInitialSeed,
  writeExpanded,
  writeSeedToUrl,
} from "../src/ui/debateTreeStorage";

const seeds = [
  { id: "zh-1", zhihuId: "1" },
  { id: "zh-2", zhihuId: "2" },
] as DebateTreeSeed[];

const findSeed = (id: string) => seeds.find((seed) => seed.id === id) ?? null;

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  window.localStorage.clear();
});

describe("辩论树本地记忆 · 展开态", () => {
  it("默认是空的——渐进披露，只开根节点", () => {
    expect([...readExpanded("zh-1")]).toEqual([]);
  });

  it("写完能读回来", () => {
    writeExpanded("zh-1", new Set(["zh-1:root", "zh-1:a1"]));
    expect([...readExpanded("zh-1")].sort()).toEqual(["zh-1:a1", "zh-1:root"]);
  });

  it("不同议题各存各的，不串味", () => {
    writeExpanded("zh-1", new Set(["zh-1:root"]));
    writeExpanded("zh-2", new Set(["zh-2:root", "zh-2:a9"]));
    expect([...readExpanded("zh-1")]).toEqual(["zh-1:root"]);
    expect([...readExpanded("zh-2")].sort()).toEqual(["zh-2:a9", "zh-2:root"]);
  });

  it("覆盖写同一议题不会丢掉别的议题", () => {
    writeExpanded("zh-1", new Set(["a"]));
    writeExpanded("zh-2", new Set(["b"]));
    writeExpanded("zh-1", new Set(["c"]));
    expect([...readExpanded("zh-1")]).toEqual(["c"]);
    expect([...readExpanded("zh-2")]).toEqual(["b"]);
  });

  it("旧版本的扁平数组不再被读进来", () => {
    window.localStorage.setItem(LEGACY_EXPANDED_STORAGE_KEY, JSON.stringify(["zh-1:root"]));
    expect([...readExpanded("zh-1")]).toEqual([]);
  });

  it("数据损坏时回落空集合，不抛错", () => {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, "{ 坏掉的 json");
    expect([...readExpanded("zh-1")]).toEqual([]);
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(["不是对象"]));
    expect([...readExpanded("zh-1")]).toEqual([]);
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify({ "zh-1": [1, "ok"] }));
    expect([...readExpanded("zh-1")]).toEqual(["ok"]);
  });
});

describe("辩论树本地记忆 · 议题记忆与 URL", () => {
  it("记住上次看的议题", () => {
    expect(readRememberedSeed()).toBeNull();
    rememberSeed("zh-2");
    expect(readRememberedSeed()).toBe("zh-2");
  });

  it("URL 里只认合法议题 id", () => {
    window.history.replaceState(null, "", "/?view=debate&topic=zh-2035134530596683934");
    expect(readSeedFromUrl()).toBe("zh-2035134530596683934");

    window.history.replaceState(null, "", "/?view=debate&topic=../../etc/passwd");
    expect(readSeedFromUrl()).toBeNull();

    window.history.replaceState(null, "", "/?view=debate");
    expect(readSeedFromUrl()).toBeNull();
  });

  it("写回 URL 时带上模块与议题参数", () => {
    writeSeedToUrl("zh-2");
    const params = new URLSearchParams(window.location.search);
    expect(params.get("view")).toBe("debate");
    expect(params.get("topic")).toBe("zh-2");
  });

  it("决定首个议题：URL > 记忆 > 默认", () => {
    expect(resolveInitialSeed(seeds, "zh-1", findSeed)).toBe("zh-1");

    rememberSeed("zh-2");
    expect(resolveInitialSeed(seeds, "zh-1", findSeed)).toBe("zh-2");

    window.history.replaceState(null, "", "/?view=debate&topic=zh-1");
    expect(resolveInitialSeed(seeds, "zh-2", findSeed)).toBe("zh-1");
  });

  it("URL 与记忆里是坏 id 时回落默认，不崩", () => {
    window.history.replaceState(null, "", "/?view=debate&topic=zh-999999");
    rememberSeed("zh-999999");
    expect(resolveInitialSeed(seeds, "zh-1", findSeed)).toBe("zh-1");
    expect(window.localStorage.getItem(LAST_SEED_STORAGE_KEY)).toBe("zh-999999");
  });

  it("默认值也失效时退到第一个议题", () => {
    expect(resolveInitialSeed(seeds, "zh-999999", findSeed)).toBe("zh-1");
  });
});
