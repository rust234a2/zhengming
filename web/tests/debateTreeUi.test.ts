import { describe, expect, it } from "vitest";

import type { DebateTreeSeed, SeedClaim, Stance } from "../src/types/debateTree";
import {
  STANCE_LABEL,
  STANCE_ORDER,
  applyVote,
  buildTreeFromSeed,
  claimNodeId,
  findNode,
  findPath,
  groupSeeds,
  maxShareText,
  rootNodeId,
  seedBadges,
  seedMatchesQuery,
  shortText,
  sourceVoteText,
  stanceOf,
  treeStats,
  updateNode,
  walkTree,
} from "../src/ui/debateTreeUi";

/* ─────────── 构造器：只在测试里造种子，真实数据一律来自生成物 ─────────── */

function claim(overrides: Partial<SeedClaim> & { id: string; text: string; stance: Stance }): SeedClaim {
  return {
    sourceSide: overrides.stance === "pro" ? "positive" : overrides.stance === "con" ? "negative" : "neutral",
    author: "答主",
    authorBadge: "",
    voteUp: 0,
    url: "https://www.zhihu.com/question/1/answer/1",
    quote: "原文",
    reasonType: "",
    quality: null,
    ...overrides,
  };
}

function seed(overrides: Partial<DebateTreeSeed> = {}): DebateTreeSeed {
  return {
    id: "zh-1",
    zhihuId: "1",
    title: "这是一个真实议题吗？",
    url: "https://www.zhihu.com/question/1",
    tier: "claims",
    answerCount: 2,
    note: "溯源说明",
    clusters: [],
    clusterMeta: null,
    claims: [],
    answerSamples: [],
    ...overrides,
  };
}

describe("辩论树纯决策层 · 常量", () => {
  it("三派顺序与界面名固定", () => {
    expect(STANCE_ORDER).toEqual(["pro", "neutral", "con"]);
    expect(STANCE_LABEL.pro).toBe("支持");
    expect(STANCE_LABEL.con).toBe("反对");
    expect(STANCE_LABEL.neutral).toBe("看条件");
  });
});

describe("辩论树纯决策层 · 种子成树", () => {
  it("root 用真实题干与真实问题链接，不伪造答主", () => {
    const tree = buildTreeFromSeed(seed());
    expect(tree.id).toBe(rootNodeId("zh-1"));
    expect(tree.type).toBe("root");
    expect(tree.stance).toBe("root");
    expect(tree.text).toBe("这是一个真实议题吗？");
    expect(tree.source?.url).toBe("https://www.zhihu.com/question/1");
    expect(tree.provenanceNote).toBe("溯源说明");
    expect(tree.author).toBeUndefined();
    expect(tree.children).toHaveLength(0);
  });

  it("平台投票一律从 0 起，知乎赞同数只留在 source 上", () => {
    const tree = buildTreeFromSeed(seed({
      claims: [claim({ id: "a1", text: "支持方论点", stance: "pro", voteUp: 204 })],
    }));
    const node = tree.children[0];
    expect(node.votes).toEqual({ up: 0, down: 0 });
    expect(node.viewerVote).toBeNull();
    expect(node.source?.voteUp).toBe(204);
    expect(sourceVoteText(node)).toBe("知乎 204 赞");
  });

  it("一级论点按三派固定顺序排列，派内按真实赞同数降序", () => {
    const tree = buildTreeFromSeed(seed({
      claims: [
        claim({ id: "c1", text: "反方低赞", stance: "con", voteUp: 3 }),
        claim({ id: "n1", text: "看条件", stance: "neutral", voteUp: 9 }),
        claim({ id: "p1", text: "正方低赞", stance: "pro", voteUp: 1 }),
        claim({ id: "c2", text: "反方高赞", stance: "con", voteUp: 88 }),
        claim({ id: "p2", text: "正方高赞", stance: "pro", voteUp: 50 }),
      ],
    }));
    expect(tree.children.map((node) => node.text)).toEqual([
      "正方高赞",
      "正方低赞",
      "看条件",
      "反方高赞",
      "反方低赞",
    ]);
  });

  it("节点 id 带议题命名空间，切换议题不会撞车", () => {
    const tree = buildTreeFromSeed(seed({ claims: [claim({ id: "a1", text: "论点", stance: "pro" })] }));
    expect(tree.children[0].id).toBe(claimNodeId("zh-1", "a1"));
    expect(tree.children[0].id.startsWith("zh-1:")).toBe(true);
  });

  it("答主身份标注随节点带上", () => {
    const tree = buildTreeFromSeed(seed({
      claims: [claim({ id: "a1", text: "论点", stance: "pro", author: "DBinary", authorBadge: "新知答主" })],
    }));
    expect(tree.children[0].author).toBe("DBinary");
    expect(tree.children[0].authorBadge).toBe("新知答主");
  });
});

describe("辩论树纯决策层 · 三派统计", () => {
  it("按节点数统计三派与追问，root 不计入任何一派", () => {
    const tree = buildTreeFromSeed(seed({
      claims: [
        claim({ id: "p1", text: "正", stance: "pro" }),
        claim({ id: "p2", text: "正", stance: "pro" }),
        claim({ id: "c1", text: "反", stance: "con" }),
      ],
    }));
    const stats = treeStats(tree);
    expect(stats.counts).toEqual({ pro: 2, con: 1, neutral: 0, question: 0 });
    expect(stats.total).toBe(3);
    expect(stats.imbalanced).toBe(false);
    expect(maxShareText(stats)).toBe("67%");
  });

  it("最大簇占比严格大于 70% 才算失衡", () => {
    const four = buildTreeFromSeed(seed({
      claims: [
        claim({ id: "p1", text: "正", stance: "pro" }),
        claim({ id: "p2", text: "正", stance: "pro" }),
        claim({ id: "p3", text: "正", stance: "pro" }),
        claim({ id: "c1", text: "反", stance: "con" }),
      ],
    }));
    expect(treeStats(four).maxShare).toBeCloseTo(0.75);
    expect(treeStats(four).imbalanced).toBe(true);

    const ten = buildTreeFromSeed(seed({
      claims: [
        ...Array.from({ length: 7 }, (_, i) => claim({ id: `p${i}`, text: "正", stance: "pro" })),
        ...Array.from({ length: 3 }, (_, i) => claim({ id: `c${i}`, text: "反", stance: "con" })),
      ],
    }));
    expect(treeStats(ten).maxShare).toBeCloseTo(0.7);
    expect(treeStats(ten).imbalanced).toBe(false);
  });

  it("空树不报失衡，也不除零", () => {
    const stats = treeStats(buildTreeFromSeed(seed()));
    expect(stats.total).toBe(0);
    expect(stats.maxShare).toBe(0);
    expect(stats.imbalanced).toBe(false);
  });

  it("追问单独计数，不进三派占比", () => {
    const tree = buildTreeFromSeed(seed({
      claims: [claim({ id: "p1", text: "正", stance: "pro" })],
    }));
    const withQuestion = updateNode(tree, tree.children[0].id, (node) => ({
      ...node,
      children: [{ id: "q1", type: "question", stance: "pro", text: "追问", votes: null, viewerVote: null, children: [] }],
    }));
    const stats = treeStats(withQuestion);
    expect(stats.counts.question).toBe(1);
    expect(stats.total).toBe(1);
    expect(stats.maxShare).toBe(1);
    // 只有一个 claim 时占比必然是 100%，按 PRD F3 的口径同样算失衡——
    // 不为「样本太少」开特例，否则 UI 口径会与调研口径分叉。
    expect(stats.imbalanced).toBe(true);
  });
});

describe("辩论树纯决策层 · 遍历与定位", () => {
  const tree = buildTreeFromSeed(seed({
    claims: [
      claim({ id: "p1", text: "正", stance: "pro" }),
      claim({ id: "c1", text: "反", stance: "con" }),
    ],
  }));

  it("findNode 找得到与找不到", () => {
    expect(findNode(tree, tree.id)?.id).toBe(tree.id);
    expect(findNode(tree, claimNodeId("zh-1", "c1"))?.text).toBe("反");
    expect(findNode(tree, "不存在")).toBeNull();
  });

  it("findPath 返回从根到目标的路径", () => {
    expect(findPath(tree, claimNodeId("zh-1", "p1"))).toEqual([rootNodeId("zh-1"), claimNodeId("zh-1", "p1")]);
    expect(findPath(tree, "不存在")).toBeNull();
  });

  it("updateNode 只改目标节点，其余引用不动", () => {
    const next = updateNode(tree, claimNodeId("zh-1", "p1"), (node) => ({ ...node, text: "改过了" }));
    expect(findNode(next, claimNodeId("zh-1", "p1"))?.text).toBe("改过了");
    expect(findNode(next, claimNodeId("zh-1", "c1"))?.text).toBe("反");
    expect(findNode(next, claimNodeId("zh-1", "p1"))).not.toBe(findNode(tree, claimNodeId("zh-1", "p1")));
  });

  it("walkTree 覆盖全树", () => {
    const seen: string[] = [];
    walkTree(tree, (node) => seen.push(node.text));
    expect(seen).toEqual(["这是一个真实议题吗？", "正", "反"]);
  });

  it("stanceOf：root 不属于任何一派", () => {
    expect(stanceOf(tree)).toBeNull();
    expect(stanceOf(tree.children[0])).toBe("pro");
  });
});

describe("辩论树纯决策层 · 投票语义", () => {
  const node = buildTreeFromSeed(seed({ claims: [claim({ id: "a1", text: "论点", stance: "pro" })] })).children[0];

  it("点一次记一票", () => {
    const voted = applyVote(node, "up");
    expect(voted.votes).toEqual({ up: 1, down: 0 });
    expect(voted.viewerVote).toBe("up");
  });

  it("同一方向再点即撤票，不叠加", () => {
    const voted = applyVote(applyVote(node, "up"), "up");
    expect(voted.votes).toEqual({ up: 0, down: 0 });
    expect(voted.viewerVote).toBeNull();
  });

  it("改向先撤旧票再记新票", () => {
    const voted = applyVote(applyVote(node, "up"), "down");
    expect(voted.votes).toEqual({ up: 0, down: 1 });
    expect(voted.viewerVote).toBe("down");
  });

  it("不可投票的节点原样返回", () => {
    const question = { ...node, votes: null };
    expect(applyVote(question, "up")).toBe(question);
  });
});

describe("辩论树纯决策层 · 议题库", () => {
  it("徽标数量全部来自语料", () => {
    const withClaims = seed({ claims: [claim({ id: "a1", text: "论点", stance: "pro" })] });
    expect(seedBadges(withClaims)).toEqual([{ label: "1 条真实论点", tone: "claims" }]);

    expect(seedBadges(seed({
      tier: "answers",
      answerSamples: [
        { url: "https://www.zhihu.com/question/1/answer/1", summary: "摘要" },
        { url: "https://www.zhihu.com/question/1/answer/2", summary: "摘要" },
      ],
      clusterMeta: { total: 18, valid: 15, topCluster: "支持", ratio: 53 },
    }))).toEqual([
      { label: "2 条真实回答", tone: "answers" },
      { label: "15 条已归类", tone: "clusters" },
    ]);

    expect(seedBadges(seed({ tier: "question" }))).toEqual([{ label: "仅题干", tone: "question" }]);
  });

  it("分档固定顺序，空档不显示", () => {
    const groups = groupSeeds([
      seed({ id: "zh-2", zhihuId: "2", tier: "question" }),
      seed({ id: "zh-1", zhihuId: "1", tier: "claims" }),
    ]);
    expect(groups.map((group) => group.tier)).toEqual(["claims", "question"]);
    expect(groupSeeds([])).toEqual([]);
  });

  it("检索覆盖题干、答主与理由类型", () => {
    const target = seed({
      title: "AI 会取代程序员吗？",
      claims: [claim({ id: "a1", text: "论点", stance: "pro", author: "DBinary", reasonType: "人类特质" })],
    });
    expect(seedMatchesQuery(target, "")).toBe(true);
    expect(seedMatchesQuery(target, "取代程序员")).toBe(true);
    expect(seedMatchesQuery(target, "dbinary")).toBe(true);
    expect(seedMatchesQuery(target, "人类特质")).toBe(true);
    expect(seedMatchesQuery(target, "量子力学")).toBe(false);
  });

  it("知乎赞同数没有就返回空串，不编一个 0", () => {
    const tree = buildTreeFromSeed(seed({ claims: [claim({ id: "a1", text: "论点", stance: "pro" })] }));
    const node = { ...tree.children[0], source: { url: "https://www.zhihu.com/question/1/answer/1", quote: "节选" } };
    expect(sourceVoteText(node)).toBe("");
  });

  it("长文本截断带省略号", () => {
    expect(shortText("短文本", 10)).toBe("短文本");
    expect(shortText("一二三四五六七八九十十一", 5)).toBe("一二三四五…");
  });
});
