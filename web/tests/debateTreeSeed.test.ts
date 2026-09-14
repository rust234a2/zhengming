import { describe, expect, it } from "vitest";

import {
  DEBATE_TREE_SEEDS,
  DEFAULT_TREE_SEED_ID,
  TREE_SEED_STATS,
  findTreeSeed,
} from "../src/data/debateTreeSeed";
import { BANNED_WORDS } from "../src/domain/roomClient";

const QUESTION_URL = /^https:\/\/www\.zhihu\.com\/question\/(\d+)$/;
const ANSWER_URL = /^https:\/\/www\.zhihu\.com\/question\/(\d+)\/answer\/\d+/;

function questionIdOf(url: string): string | null {
  return url.match(QUESTION_URL)?.[1] ?? null;
}

/** 生成物是「真实语料」的搬运，这一组断言守的是 provenance 红线本身 */
describe("辩论树种子（真实知乎语料）", () => {
  it("规模与统计口径一致，三个溯源通道都有内容", () => {
    expect(DEBATE_TREE_SEEDS.length).toBe(TREE_SEED_STATS.topics);
    expect(DEBATE_TREE_SEEDS.length).toBeGreaterThan(100);

    const tiers = new Set(DEBATE_TREE_SEEDS.map((seed) => seed.tier));
    expect(tiers).toEqual(new Set(["claims", "answers", "question"]));
    expect(TREE_SEED_STATS.claimTopics).toBeGreaterThan(0);
    expect(TREE_SEED_STATS.answerTopics).toBeGreaterThan(0);
    expect(TREE_SEED_STATS.questionOnlyTopics).toBeGreaterThan(0);

    expect(DEBATE_TREE_SEEDS.reduce((sum, seed) => sum + seed.claims.length, 0)).toBe(TREE_SEED_STATS.claims);
    expect(DEBATE_TREE_SEEDS.reduce((sum, seed) => sum + seed.answerSamples.length, 0)).toBe(TREE_SEED_STATS.answerSamples);
  });

  it("每个议题都能追到真实知乎问题链接", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      expect(seed.id, seed.title).toBe(`zh-${seed.zhihuId}`);
      expect(seed.url, seed.id).toMatch(QUESTION_URL);
      expect(questionIdOf(seed.url), seed.id).toBe(seed.zhihuId);
      expect(seed.title.trim().length, seed.id).toBeGreaterThan(0);
      expect(seed.note.trim().length, seed.id).toBeGreaterThan(0);
    }
  });

  it("一级论点保留真实答主、真实赞同数与知乎回答链接", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      for (const claim of seed.claims) {
        expect(claim.author, claim.id).toBeTruthy();
        expect(typeof claim.voteUp, claim.id).toBe("number");
        expect(claim.voteUp, claim.id).toBeGreaterThanOrEqual(0);
        expect(claim.url, claim.id).toMatch(ANSWER_URL);
        expect(["pro", "con", "neutral"]).toContain(claim.stance);
      }
    }
  });

  it("原文节选要么是干净的真实正文，要么因命中禁用词被整段省略", () => {
    const withQuote = DEBATE_TREE_SEEDS.flatMap((seed) => seed.claims).filter((claim) => claim.quote.length > 0);
    const withoutQuote = DEBATE_TREE_SEEDS.flatMap((seed) => seed.claims).filter((claim) => claim.quote.length === 0);

    // 省略节选是例外而非常态：绝大多数论点仍该带着真实原文
    expect(withQuote.length).toBeGreaterThan(withoutQuote.length * 3);
    for (const claim of withQuote) {
      expect(claim.quote.trim().length, claim.id).toBeGreaterThan(0);
      expect(claim.quote.length, claim.id).toBeLessThanOrEqual(200);
    }
    // 被省略的那几条仍然保留论点、答主与链接——provenance 不因省略而丢
    for (const claim of withoutQuote) {
      expect(claim.text.trim().length, claim.id).toBeGreaterThan(0);
      expect(claim.author, claim.id).toBeTruthy();
      expect(claim.url, claim.id).toMatch(ANSWER_URL);
    }
  });

  it("论点必须挂在自己的议题下——跨议题的内容不得伪装成同一议题的正反方", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      for (const claim of seed.claims) {
        const id = claim.url.match(ANSWER_URL)?.[1];
        expect(id, `${claim.id} 挂在 ${seed.id} 下`).toBe(seed.zhihuId);
      }
    }
  });

  it("真实回答摘要必须是知乎回答链接，且不被当成一级论点", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      if (seed.tier === "answers") {
        expect(seed.claims, seed.id).toHaveLength(0);
        expect(seed.answerSamples.length, seed.id).toBeGreaterThan(0);
      }
      for (const sample of seed.answerSamples) {
        expect(sample.url, seed.id).toMatch(ANSWER_URL);
        expect(sample.summary.trim().length, seed.id).toBeGreaterThan(0);
      }
    }
  });

  it("仅题干档不得夹带论点或回答", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      if (seed.tier !== "question") continue;
      expect(seed.claims, seed.id).toHaveLength(0);
      expect(seed.answerSamples, seed.id).toHaveLength(0);
    }
  });

  it("立场聚类要么没有，要么带上完整的口径", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      if (seed.clusters.length === 0) continue;
      expect(seed.clusterMeta, seed.id).not.toBeNull();
      expect(seed.clusterMeta!.valid, seed.id).toBeGreaterThan(0);
      expect(seed.clusters.reduce((sum, cluster) => sum + cluster.count, 0), seed.id).toBe(seed.clusterMeta!.valid);
    }
  });

  it("全量文本不出现产品禁用词（含题干、论点、原文节选、回答摘要）", () => {
    for (const seed of DEBATE_TREE_SEEDS) {
      const texts = [
        seed.title,
        ...seed.claims.map((claim) => claim.text),
        ...seed.claims.map((claim) => claim.quote),
        ...seed.answerSamples.map((sample) => sample.summary),
      ].join("\n");
      for (const word of BANNED_WORDS) {
        expect(texts.includes(word), `${seed.id} 含禁用词「${word}」`).toBe(false);
      }
    }
  });

  it("默认议题存在，且是能看出分叉的那一类", () => {
    const seed = findTreeSeed(DEFAULT_TREE_SEED_ID);
    expect(seed).not.toBeNull();
    expect(seed!.claims.length).toBeGreaterThanOrEqual(2);
    const stances = new Set(seed!.claims.map((claim) => claim.stance));
    expect([...stances].some((stance) => stance === "con")).toBe(true);
    expect([...stances].some((stance) => stance === "pro" || stance === "neutral")).toBe(true);
  });

  it("找不到的议题返回 null 而不是抛错", () => {
    expect(findTreeSeed("zh-000000000000")).toBeNull();
  });
});
