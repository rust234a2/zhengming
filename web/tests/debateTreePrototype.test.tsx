import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DebateTreePrototype } from "../src/ui/DebateTreePrototype";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("辩论树交互原型", () => {
  it("初始只显示根节点，点击后展开第一级", () => {
    render(<DebateTreePrototype />);
    expect(screen.getAllByText("43 岁县中物理老师考上苏州头部公办校（正式编制），该不该辞职去？")).toHaveLength(2);
    expect(screen.queryByText("苏州编制含金量远高于县中，职业天花板和资源都不是一个量级")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/议题：43 岁县中物理老师/));
    expect(screen.getByText("苏州编制含金量远高于县中，职业天花板和资源都不是一个量级")).toBeInTheDocument();
    expect(screen.queryByText(/苏州头部校高手云集/)).not.toBeInTheDocument();
  });

  it("选择子节点同步详情，再次点击逐级展开", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByLabelText(/议题：43 岁县中物理老师/));
    fireEvent.click(screen.getByLabelText(/支持：苏州编制含金量/));
    expect(screen.getAllByText("物理组张老师").length).toBeGreaterThan(1);
    expect(screen.getByText(/苏州头部校高手云集/)).toBeInTheDocument();
    expect(screen.getByText("待回应")).toBeInTheDocument();
  });

  it("投票只更新票数，不折叠当前分支", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByLabelText(/议题：43 岁县中物理老师/));
    const claim = screen.getByLabelText(/支持：苏州编制含金量/);
    fireEvent.click(screen.getByLabelText(/赞同 苏州编制含金量/));
    expect(claim).toHaveTextContent("13");
    expect(screen.getByText("关键变量是编制性质、住房支持与岗位安排，谈妥了再去")).toBeInTheDocument();
  });

  it("可以从根节点添加带依据的看条件论点", () => {
    vi.spyOn(Date, "now").mockReturnValue(1234);
    render(<DebateTreePrototype />);
    const root = screen.getByLabelText(/议题：43 岁县中物理老师/);
    fireEvent.click(root.querySelectorAll("button")[2]);
    fireEvent.change(screen.getByLabelText("论点内容"), { target: { value: "先确认岗位与住房条件再决定" } });
    fireEvent.change(screen.getByLabelText("论点依据"), { target: { value: "正式 offer 尚未写明岗位" } });
    fireEvent.click(screen.getByRole("button", { name: "发布到树上" }));
    expect(screen.getAllByText("先确认岗位与住房条件再决定")).toHaveLength(2);
    expect(screen.getAllByText(/正式 offer 尚未写明岗位/).length).toBeGreaterThan(1);
    expect(screen.getByLabelText("立场分布")).toHaveTextContent(/看条件\s*2/);
  });

  it("Agent 建议可生成追问，且收起全树写入持久化", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByLabelText(/议题：43 岁县中物理老师/));
    fireEvent.click(screen.getByLabelText(/支持：43 岁是最后的窗口期/));
    fireEvent.click(screen.getByRole("button", { name: "以此追问" }));
    expect(screen.getAllByText(/——请回应/)).toHaveLength(2);
    expect(screen.queryByText("待回应")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "收起全树" }));
    expect(within(screen.getByRole("region", { name: "辩论树" })).queryByText(/——请回应/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /——请回应/ })).toBeInTheDocument();
    expect(window.localStorage.getItem("zhengming.debateTree.expanded")).toBe("[]");
  });

  it("切换到争议地图视图：地图画布渲染，可切回缩进树", () => {
    render(<DebateTreePrototype />);
    fireEvent.click(screen.getByRole("button", { name: "争议地图" }));
    expect(document.querySelector(".controversy-map")).toBeTruthy();
    expect(screen.getByText(/跨议题争议地图/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "缩进树" }));
    expect(screen.getByRole("region", { name: "辩论树" })).toBeInTheDocument();
    expect(screen.getByText("树状缩略图")).toBeInTheDocument();
  });
});
