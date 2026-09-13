/**
 * 争鸣桌面端三视图的路由壳。
 *
 * 与原 runi-desktop/src/ui/App.tsx 的关系：那是个完整的聊天应用（57KB），
 * 这里只保留其中与争鸣有关的路由部分 —— 三个 `?view=` 分支。
 * 行为与原实现一致，另加了一个默认落地页（原来落到聊天应用，这里没有）。
 *
 * 入口：
 *   ?view=map     跨议题争议地图（d3 力导向）
 *   ?view=force   力导向辩论图（d3 力导向）
 *   ?view=debate  辩论树（缩进版）
 *   无参数        三张图的落地索引
 */

import { ControversyMap } from "./ui/ControversyMap";
import { DebateForceTree } from "./ui/DebateForceTree";
import { DebateTreePrototype } from "./ui/DebateTreePrototype";

const VIEWS = [
  { id: "map", label: "跨议题争议地图", desc: "同一主张跨议题的横向索引 · 发现该吵哪一场" },
  { id: "force", label: "力导向辩论图", desc: "单个议题内部的对垒结构 · 阵营与攻防" },
  { id: "debate", label: "辩论树", desc: "论点、证据、追问长成一棵可续写的树" },
] as const;

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

function Landing() {
  return (
    <main className="debate-app" style={{ padding: "56px 40px", overflowY: "auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>争鸣 · 桌面视图</h1>
      <p style={{ color: "var(--debate-muted)", fontSize: 14, margin: "0 0 30px" }}>
        三张图各自独立，用 <code>?view=</code> 切换。
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: 12,
          maxWidth: 540,
        }}
      >
        {VIEWS.map((v) => (
          <li key={v.id}>
            <a
              href={`?view=${v.id}`}
              style={{
                display: "block",
                padding: "15px 20px",
                background: "#ffffff",
                border: "1px solid var(--debate-line)",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <strong style={{ display: "block", marginBottom: 4, fontSize: 15 }}>{v.label}</strong>
              <span style={{ fontSize: 13, color: "var(--debate-muted)" }}>{v.desc}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function App() {
  const view = readView();
  if (view === "debate") return <DebateTreePrototype />;
  if (view === "force") {
    return (
      <FullScreen>
        <DebateForceTree />
      </FullScreen>
    );
  }
  if (view === "map") {
    return (
      <FullScreen>
        <ControversyMap />
      </FullScreen>
    );
  }
  return <Landing />;
}
