/**
 * 辩论树 · 本地浏览记忆（localStorage）
 *
 * 与辩论间不同，树的记忆是**单机浏览状态**而不是席位身份：
 *  - 展开到哪一层（按议题分开存，换议题不该继承上一个议题的展开态）
 *  - 上次看的是哪个议题
 *
 * 用 localStorage 是因为它该长期有效（PRD G4：树是长期公共资产，
 * 回来接着看是常态）；席位令牌那种「每窗口独立」的需求在这里不存在。
 *
 * 存储不可用（隐私模式）时一律降级为「当次会话内存」，不让界面崩。
 */

import type { DebateTreeSeed } from "../types/debateTree";

export const EXPANDED_STORAGE_KEY = "zhengming.debateTree.expanded.v2";
export const LAST_SEED_STORAGE_KEY = "zhengming.debateTree.seed";

/** 旧版本曾把展开态存成扁平数组，换议题会串味；升版本时直接弃用旧 key */
export const LEGACY_EXPANDED_STORAGE_KEY = "zhengming.debateTree.expanded";

type ExpandedRecord = Record<string, string[]>;

function readExpandedRecord(): ExpandedRecord {
  try {
    const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record: ExpandedRecord = {};
    for (const [seedId, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(ids)) record[seedId] = ids.filter((id): id is string => typeof id === "string");
    }
    return record;
  } catch {
    return {};
  }
}

/** 读某个议题的展开集合；读不到就是空的（渐进披露：默认只开 root） */
export function readExpanded(seedId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(readExpandedRecord()[seedId] ?? []);
}

export function writeExpanded(seedId: string, ids: Set<string>): void {
  try {
    const record = readExpandedRecord();
    record[seedId] = [...ids];
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* 存储不可用：本次会话内仍是好的 */
  }
}

export function rememberSeed(seedId: string): void {
  try {
    window.localStorage.setItem(LAST_SEED_STORAGE_KEY, seedId);
  } catch {
    /* 忽略 */
  }
}

export function readRememberedSeed(): string | null {
  try {
    return window.localStorage.getItem(LAST_SEED_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 从 URL 读议题 id（分享链接形如 `/ ...?view=debate&topic=zh-2035134530596683934`） */
export function readSeedFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const topic = new URLSearchParams(window.location.search).get("topic");
  return topic && /^zh-[a-zA-Z0-9-]+$/.test(topic) ? topic : null;
}

/**
 * 把当前议题写回 URL，便于直接分享某个议题的树。
 * 用 replaceState：切议题不该在浏览器历史里堆一长串记录，返回键应当是退出模块。
 */
export function writeSeedToUrl(seedId: string): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "debate");
    url.searchParams.set("topic", seedId);
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* 忽略 */
  }
}

/**
 * 决定首次打开哪个议题：URL 参数 > 上次看过 > 默认值。
 * `findTreeSeed` 由生成物提供，用来挡掉 URL 里被改坏的议题 id。
 */
export function resolveInitialSeed(
  seeds: readonly DebateTreeSeed[],
  fallbackId: string,
  findSeed: (id: string) => DebateTreeSeed | null,
): string {
  const fromUrl = readSeedFromUrl();
  if (fromUrl && findSeed(fromUrl)) return fromUrl;

  const remembered = readRememberedSeed();
  if (remembered && seeds.some((seed) => seed.id === remembered)) return remembered;

  if (findSeed(fallbackId)) return fallbackId;
  return seeds[0]?.id ?? fallbackId;
}
