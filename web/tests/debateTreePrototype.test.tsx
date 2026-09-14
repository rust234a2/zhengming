import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_TREE_SEED_ID, findTreeSeed } from "../src/data/debateTreeSeed";
import type { DebateTreeSeed } from "../src/types/debateTree";
import { DebateTreePrototype } from "../src/ui/DebateTreePrototype";
import { EXPANDED_STORAGE_KEY, LAST_SEED_STORAGE_KEY } from "../src/ui/debateTreeStorage";

const defaultSeed = findTreeSeed(DEFAULT_TREE_SEED_ID) as DebateTreeSeed;
const proClaim = defaultSeed.claims.find((claim) => claim.stance === "pro")!;
const conClaim = defaultSeed.claims
  .filter((claim) => claim.stance === "con")
  .sort((a, b) => b.voteUp - a.voteUp)[0];
const answerSeed = findTreeSeed("zh-2038884733304697602") as DebateTreeSeed;

/** 展开某个节点卡片 */
function expandRoot(): void {
  fireEvent.click(screen.getByLabelText(/^议题：/));
}

function cardOf(text: string): HTMLElement {
  return screen.getByLabelText(new RegExp(`^(支持|反对|看条件)：${text.slice(0, 12)}`));
}

/** 平台票记在 .dt-votes 里；知乎赞同数是它旁边另一枚独立标签 */
function voteWidget(card: HTMLElement): HTMLElement {
  return card.querySelector(".dt-votes") as HTMLElement;
}

function voteCount(card: HTMLElement): string {
  return voteWidget(card).querySelector("b")?.textContent ?? "";
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
});

describe("辩论树 · 真实议题渲染", () => {
  it("初始只渲染根节点，题干就是真实知乎问题", () => {
    render(<DebateTreePrototype />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(defaultSeed.title);
    expect(screen.getByLabelText(`议题：${defaultSeed.title}`)).toBeInTheDocument();
    expect(screen.queryByText(proClaim.text)).not.toBeInTheDocument();
    expect(screen.queryByText(conClaim.text)).not.toBeInTheDocument();
  });

  it("展开后的一级论点是真实内容：答主、身份、赞同数、原文链接各自独立", () => {
    render(<DebateTreePrototype />);
    expandRoot();

    const card = cardOf(proClaim.text);
    expect(within(card).getByText(proClaim.author)).toBeInTheDocument();
    expect(within(card).getByText(proClaim.authorBadge)).toBeInTheDocument();
    expect(within(card).getByText(`知乎 ${proClaim.voteUp} 赞`)).toBeInTheDocument();
    expect(within(card).getByText("原文节选")).toBeInTheDocument();
    expect(within(card).getByText("源自知乎回答")).toHaveAttribute("href", proClaim.url);
  });

  it("平台投票从 0 起、可改向，且绝不动知乎赞同数", () => {
    render(<DebateTreePrototype />);
    expandRoot();
    const card = cardOf(proClaim.text);

    expect(voteCount(card)).toBe("0");

    fireEvent.click(within(card).getByLabelText(/^赞同 /));
    expect(voteCount(card)).toBe("1");
    expect(within(card).getByText(`知乎 ${proClaim.voteUp} 赞`)).toBeInTheDocument();

    fireEvent.click(within(card).getByLabelText(/^反对 /));
    expect(voteCount(card)).toBe("-1");
    expect(within(card).getByText(`知乎 ${proClaim.voteUp} 赞`)).toBeInTheDocument();
  });

  it("点同一方向即撤票，不叠加", () => {
    render(<DebateTreePrototype />);
    expandRoot();
    const card = cardOf(proClaim.text);
    fireEvent.click(within(card).getByLabelText(/^反对 /));
    fireEvent.click(within(card).getByLabelText(/^反对 /));
    expect(voteCount(card)).toBe("0");
  });

  it("展开态按议题分别存放，换议题不继承", () => {
    render(<DebateTreePrototype />);
    expandRoot();
    const record = JSON.parse(window.localStorage.getItem(EXPANDED_STORAGE_KEY) ?? "{}");
    expect(record[defaultSeed.id]).toEqual([`${defaultSeed.id}:root`]);

    fireEvent.click(screen.getByRole("button", { name: "收起全树" }));
    expect(JSON.parse(window.localStorage.getItem(EXPANDED_STORAGE_KEY) ?? "{}")[defaultSeed.id]).toEqual([]);
  });
});

describe("辩论树 · 议题库", () => {
  it("顶栏议题名即入口：可搜、可换、换完写回 URL 与本地记忆", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByRole("button", { name: /个真实议题/ }));

    const dialog = screen.getByRole("dialog", { name: "议题库" });
    fireEvent.change(within(dialog).getByLabelText("搜索议题"), { target: { value: "县中" } });
    fireEvent.click(within(dialog).getByRole("button", { name: new RegExp(answerSeed.title.slice(0, 10)) }));

    expect(screen.getAllByText(answerSeed.title).length).toBeGreaterThan(0);
    expect(window.location.search).toContain(`topic=${answerSeed.id}`);
    expect(window.localStorage.getItem(LAST_SEED_STORAGE_KEY)).toBe(answerSeed.id);
    expect(screen.queryByRole("dialog", { name: "议题库" })).not.toBeInTheDocument();
  });

  it("搜不到时给空态", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByRole("button", { name: /个真实议题/ }));
    const dialog = screen.getByRole("dialog", { name: "议题库" });
    fireEvent.change(within(dialog).getByLabelText("搜索议题"), { target: { value: "量子纠缠猫" } });
    expect(within(dialog).getByText("没有匹配的议题")).toBeInTheDocument();
  });

  it("只有真实回答的议题：不冒充论点，把回答并列列出来", () => {
    window.history.replaceState(null, "", `/?view=debate&topic=${answerSeed.id}`);
    render(<DebateTreePrototype />);

    expect(screen.getAllByText(answerSeed.title).length).toBeGreaterThan(0);
    expect(screen.getByText(/立场未经标注，未作为一级论点/)).toBeInTheDocument();
    expect(screen.getByText(answerSeed.note)).toBeInTheDocument();

    const list = document.querySelector(".dt-answers ul") as HTMLElement;
    expect(within(list).getAllByRole("link")).toHaveLength(answerSeed.answerSamples.length);
  });

  it("立场聚类按真实数量画出来", () => {
    window.history.replaceState(null, "", `/?view=debate&topic=${answerSeed.id}`);
    render(<DebateTreePrototype />);
    expect(screen.getByText(/条回答做了立场聚类/)).toBeInTheDocument();
    for (const cluster of answerSeed.clusters) {
      expect(screen.getAllByText(cluster.label).length).toBeGreaterThan(0);
      const rows = Array.from(document.querySelectorAll(".dt-cluster-row"));
      expect(rows.map((row) => row.textContent)).toContain(`${cluster.label}${cluster.count}`);
    }
  });
});

describe("辩论树 · 参与行为", () => {
  it("可以在根节点下添加看条件论点，统计条跟着变", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByRole("button", { name: "添加反对论点" }));
    fireEvent.click(screen.getByRole("button", { name: "看条件" }));
    fireEvent.change(screen.getByLabelText("论点内容"), { target: { value: "先确认岗位与住房条件再决定" } });
    fireEvent.change(screen.getByLabelText("论点依据"), { target: { value: "正式 offer 尚未写明岗位" } });
    fireEvent.click(screen.getByRole("button", { name: "发布到树上" }));

    expect(screen.getAllByText("先确认岗位与住房条件再决定").length).toBeGreaterThan(1);
    expect(screen.getAllByText("我").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("立场分布")).toHaveTextContent(/看条件\s*1/);
  });

  it("追问由自己署名，不再本地伪造 Agent 建议", () => {
    render(<DebateTreePrototype />);
    expandRoot();
    fireEvent.click(cardOf(proClaim.text));
    fireEvent.click(screen.getByRole("button", { name: "追问此节点" }));

    fireEvent.change(screen.getByLabelText("追问内容"), { target: { value: "这条论据的依据是什么？" } });
    fireEvent.click(screen.getByRole("button", { name: "发布到树上" }));

    expect(screen.getAllByText("这条论据的依据是什么？").length).toBeGreaterThan(0);
    expect(screen.getByText("待回应")).toBeInTheDocument();
    expect(screen.queryByText("Agent 追问建议")).not.toBeInTheDocument();
  });

  it("详情面板不再提供进入辩论间的出口，顶栏模块导航保留", () => {
    render(<DebateTreePrototype />);
    expandRoot();
    fireEvent.click(cardOf(proClaim.text));

    // 节点详情面板只保留树内动作：没有任何指向辩论间的链接
    const actions = document.querySelector(".dt-detail-actions") as HTMLElement;
    expect(actions).toBeTruthy();
    expect(actions.querySelectorAll("a")).toHaveLength(0);
    expect(actions.textContent).not.toContain("开实时辩论间");
    expect(within(actions).getByRole("button", { name: "添加支持论点" })).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: "追问此节点" })).toBeInTheDocument();

    // 顶栏的「辩论树 | 争议地图 | 辩论间」是模块级导航，不属于被删的定向入口
    expect(screen.getByRole("link", { name: "辩论间" })).toHaveAttribute("href", "?view=room");
  });

  it("顶栏只有一排模块标签：辩论树（页内视图）｜争议地图｜辩论间", () => {
    render(<DebateTreePrototype />);
    const nav = document.querySelector(".dt-nav") as HTMLElement;
    expect(nav).toBeTruthy();

    // 一排里：辩论树 / 争议地图是页内视图切换按钮（辩论树在最前），辩论间是模块跳转链接
    const buttons = Array.from(nav.querySelectorAll("button")).map((b) => b.textContent?.trim());
    const links = Array.from(nav.querySelectorAll("a")).map((a) => a.textContent?.trim());
    expect(buttons).toEqual(["辩论树", "争议地图"]);
    expect(links).toEqual(["辩论间"]);
    expect(screen.getByRole("link", { name: "辩论间" })).toHaveAttribute("href", "?view=room");

    // 旧的「缩进树」标签与独立的视图切换组（.dt-vbtns）已删除
    expect(document.querySelector(".dt-vbtns")).toBeNull();
    expect(document.body.textContent).not.toContain("缩进树");

    // 默认视图是辩论树，且处于选中态
    expect(nav.querySelector("button.on")?.textContent?.trim()).toBe("辩论树");
  });

  it("争议地图视图可来回切换", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByRole("button", { name: "争议地图" }));
    expect(document.querySelector(".controversy-map")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "辩论树" }));
    expect(screen.getByRole("region", { name: "辩论树" })).toBeInTheDocument();
    expect(screen.getByText("树状缩略图")).toBeInTheDocument();
  });
});
