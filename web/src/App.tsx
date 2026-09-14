/**
 * 争鸣桌面端路由壳。
 *
 * 入口即辩论树（与交互原型 prototypes/debate-tree-prototype.html 的设计一致）：
 *   无参数 / ?view=debate  辩论树（顶栏可切换缩进树 | 关系图谱）
 *   ?view=map             跨议题争议地图（d3 力导向）
 */

import { ControversyMap } from "./ui/ControversyMap";
import { DebateTreePrototype } from "./ui/DebateTreePrototype";

function readView(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("view");
}

/** 全屏视图的外层容器 —— 与原 App.tsx 的包裹方式一致。 */
function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="debate-app">
      <div style={{ height: "100vh", padding: 16, boxSizing: "border-box" }}>{children}</div>
    </main>
  );
}

export function App() {
  const view = readView();
  if (view === "map") {
    return (
      <FullScreen>
        <ControversyMap />
      </FullScreen>
    );
  }
  // 默认（含 ?view=debate）直接进入辩论树页面
  return <DebateTreePrototype />;
}
