/**
 * 辩论间议题数据测试
 *
 * provenance 红线（ROLLUP §5 / AGENTS.md「Never replace source-attributed research data without
 * documenting provenance」）：真实作者、赞同数、知乎原文链接必须保留，不得伪造。
 *
 * 本测试同时是**数据实情的守门人**：如果哪天语料更新导致成对议题数量变化，
 * 这里会失败并提示同步 UI 的「跨议题配对」标注逻辑。
 */

import { describe, expect, it } from "vitest";

import {
  CROSS_PAIRED_TOPICS,
  DEBATE_TOPICS,
  PLAYABLE_TOPICS,
  SINGLE_SIDED_TOPICS,
  TOPIC_STATS,
  findTopic,
} from "../src/data/debateRoomTopics";

const ZHIHU_URL = /^https:\/\/www\.zhihu\.com\//;
const PRESET_CONCLUSION_TOPIC_ID = "zh-1972252087044796716";

describe("provenance：真实数据不得被伪造", () => {
  it("每个可开局议题至少一侧有论点，已有论点都带真实 provenance", () => {
    expect(PLAYABLE_TOPICS.length).toBeGreaterThan(0);
    for (const topic of PLAYABLE_TOPICS) {
      expect(Boolean(topic.pro || topic.con), `${topic.questionId} 至少应有一侧真实论点`).toBe(true);
      for (const side of ["pro", "con"] as const) {
        const claim = topic[side];
        if (!claim) continue;
        expect(claim!.author.trim().length, `${topic.questionId}.${side}.author`).toBeGreaterThan(0);
        expect(typeof claim!.voteUp, `${topic.questionId}.${side}.voteUp`).toBe("number");
        expect(claim!.voteUp).toBeGreaterThanOrEqual(0);
        expect(claim!.url, `${topic.questionId}.${side}.url`).toMatch(ZHIHU_URL);
        expect(claim!.claim.trim().length, `${topic.questionId}.${side}.claim`).toBeGreaterThan(4);
      }
    }
  });

  it("单侧议题素材同样保留 provenance", () => {
    expect(SINGLE_SIDED_TOPICS.length).toBeGreaterThan(0);
    for (const item of SINGLE_SIDED_TOPICS) {
      expect(item.topClaim.author.trim().length).toBeGreaterThan(0);
      expect(item.topClaim.url).toMatch(ZHIHU_URL);
      expect(item.claimCount).toBeGreaterThan(0);
      expect(["pro", "con", "neutral"]).toContain(item.side);
    }
  });
});

describe("配对标注：不许假装是同一议题的正反方", () => {
  it("天然成对议题标记 paired=true 且不是 crossPaired", () => {
    expect(DEBATE_TOPICS.length).toBeGreaterThan(0);
    for (const topic of DEBATE_TOPICS) {
      expect(topic.paired).toBe(true);
      expect(topic.crossPaired).toBeFalsy();
      expect(topic.pro).not.toBeNull();
      expect(topic.con).not.toBeNull();
    }
  });

  it("跨议题配对的双方来自**不同**议题，且有 pairingNote 说明", () => {
    expect(CROSS_PAIRED_TOPICS.length).toBeGreaterThan(0);
    for (const topic of CROSS_PAIRED_TOPICS) {
      expect(topic.crossPaired).toBe(true);
      expect(topic.paired).toBe(false);
      expect(topic.pairingNote, `${topic.questionId} 缺 pairingNote`).toBeTruthy();
      expect(topic.pairingNote).toContain("跨议题");

      // 两侧论点来自不同议题：知乎 answer 链接的 question 段必须不同
      const proQ = topic.pro!.url.split("/answer/")[0];
      const conQ = topic.con!.url.split("/answer/")[0];
      expect(proQ, `${topic.questionId} 两侧来自同一议题`).not.toBe(conQ);
    }
  });

  it("跨议题配对不会重复使用同一个论点", () => {
    const used = new Set<string>();
    for (const topic of CROSS_PAIRED_TOPICS) {
      for (const side of ["pro", "con"] as const) {
        const id = topic[side]!.id;
        expect(used.has(id), `论点 ${id} 被多个跨议题配对复用`).toBe(false);
        used.add(id);
      }
    }
  });

  it("真实成对议题的双方来自**同一**议题", () => {
    for (const topic of DEBATE_TOPICS) {
      const proQ = topic.pro!.url.split("/answer/")[0];
      const conQ = topic.con!.url.split("/answer/")[0];
      expect(proQ, `${topic.questionId} 被标为成对但两侧议题不同`).toBe(conQ);
    }
  });
});

describe("数据实情守卫", () => {
  it("排除预设结论、只追问原因的开放解释题", () => {
    expect(PLAYABLE_TOPICS.some((topic) => topic.questionId === PRESET_CONCLUSION_TOPIC_ID)).toBe(false);
  });

  it("统计数字自洽", () => {
    expect(TOPIC_STATS.totalClaims).toBeGreaterThanOrEqual(TOPIC_STATS.totalQuestions);
    expect(TOPIC_STATS.pairedTopics).toBe(DEBATE_TOPICS.length);
    expect(TOPIC_STATS.crossPairedTopics).toBe(CROSS_PAIRED_TOPICS.length);
    expect(TOPIC_STATS.singleSidedTopics).toBe(SINGLE_SIDED_TOPICS.length);
    expect(TOPIC_STATS.totalQuestions).toBe(
      TOPIC_STATS.pairedTopics + TOPIC_STATS.singleSidedTopics,
    );
  });

  it("PLAYABLE_TOPICS = 成对 + 跨议题配对 + 有明确站队结构的单侧议题", () => {
    expect(PLAYABLE_TOPICS.length).toBe(
      DEBATE_TOPICS.length +
        CROSS_PAIRED_TOPICS.length +
        SINGLE_SIDED_TOPICS.filter((topic) => topic.side !== "neutral").length,
    );
  });

  it("可开局议题数量够撑起演示（至少 8 个）", () => {
    expect(PLAYABLE_TOPICS.length).toBeGreaterThanOrEqual(8);
  });
});

describe("findTopic", () => {
  it("按 id 命中，未知 id 返回 null", () => {
    const first = PLAYABLE_TOPICS[0];
    expect(findTopic(first.questionId)?.questionId).toBe(first.questionId);
    expect(findTopic("not-a-real-topic")).toBeNull();
  });
});
