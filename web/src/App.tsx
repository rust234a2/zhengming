/**
 * 争鸣桌面端路由壳。
 *
 * 三个平级模块，靠 `?view=` 切换（三个入口互相可跳转，链接可直接分享）：
 *   ?view=debate / 无参数   辩论树（顶栏「辩论树 | 争议地图」为页内视图切换）
 *   ?view=map              跨议题争议地图（d3 力导向）
 *   ?view=room             辩论间（真实多人 + Host LLM，需 zhengming-server）
 *
 * 辩论间的邀请链接形如 `?view=room&room=room-xxxxxxxx`，
 * 对方打开后会自动坐到空着的那个席位（见 ui/DebateRoom.tsx）。
 */

import { ControversyMap } from "./ui/ControversyMap";
import { DebateRoom } from "./ui/DebateRoom";
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

  if (view === "room") {
    // 辩论间自带三栏布局与自己的顶栏，不要再套一层内边距容器
    return <DebateRoom />;
  }
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
