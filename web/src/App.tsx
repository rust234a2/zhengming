/**
 * 争鸣桌面端路由壳。
 *
 * 四个平级模块，靠 `?view=` 切换（入口互相可跳转，链接可直接分享）：
 *   ?view=debate / 无参数   辩论树（顶栏可切换 缩进树 | 争议地图）
 *   ?view=map              跨议题争议地图（d3 力导向）
 *   ?view=room             辩论间（真实多人 + Host LLM，需 zhengming-server）
 *   ?view=event            事件推演（单人历史角色扮演，Host LLM 生成推演）
 *
 * 辩论间的邀请链接形如 `?view=room&room=room-xxxxxxxx`，
 * 对方打开后会自动坐到空着的那个席位（见 ui/DebateRoom.tsx）。
 */

import { ControversyMap } from "./ui/ControversyMap";
import { DebateRoom } from "./ui/DebateRoom";
import { DebateTreePrototype } from "./ui/DebateTreePrototype";
import { EventReplay } from "./ui/EventReplay";

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
  if (view === "event") {
    // 事件推演同样自带顶栏与全屏布局，直接渲染
    return <EventReplay />;
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
