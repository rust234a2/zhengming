# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

争鸣 (Dissensus) — a Zhihu hackathon project that replaces "likes" with structured debate as the connection mechanism between people with opposing views. This repo contains all product code and documentation, extracted from the `runi` monorepo on 2026-09-13. It has **no dependency on runi** — the three desktop views depend only on `react` and `d3`.

## Environment Constraints (Read First)

- **`npm` is unavailable** on this machine (the shim triggers a `wsl.exe` blacklist). All commands must use the absolute node path:
  ```
  NODE="C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
  ```
- **Bash lacks coreutils** — `ls`, `cat`, `rm`, `head`, `dirname` all fail with "command not found". Use Node `fs` for file operations, or PowerShell.
- **CRLF line endings** (`core.autocrlf=true`, no `.gitattributes`) — any multi-line regex must use `\r?\n`, not just `\n`.

## Repository Layout

```
zhengming/
├── web/                        ★ Standalone frontend (Vite + React 18 + TS + d3)
│   ├── src/ui/                 Two views: ControversyMap / DebateTreePrototype (DebateForceTree removed 2026-09-13, decision D3)
│   ├── src/types/              Graph models (graph.ts for debate tree, map.ts for controversy map)
│   ├── src/data/               Data (controversyMap.ts is auto-generated)
│   ├── src/App.tsx             Thin ?view= router + landing page
│   ├── src/styles.css          Self-contained styles with scoped CSS variables per component
│   ├── tests/                  Vitest (26 items after force-view removal)
│   └── dist/                   Build output (static, deployable)
├── prototypes/                 HTML prototypes, runtime tests, build-app.mjs (moved from docs/design/)
├── research/                   Controversy-map data pipeline + zhihu-corpus scripts (moved from docs/research/)
├── docs/design/                PRDs, product docs, IMPLEMENTATION-PATH.md
├── docs/research/              Research notes (zhihu taxonomy, AI social products)
├── .worktrees/                 Git worktrees for parallel module development (gitignored)
├── README.md                   ★ Start here — full run commands, architecture summary
└── AGENTS.md                   Repo guidelines (coding style, testing, commit conventions)
```

## The Three Views

`web/src/App.tsx` selects views via `?view=` URL param. Each view is a fully self-contained React component that owns its own d3 simulation, drag/zoom behavior, and CSS variable scope:

| View | Route | Component | What it renders |
|------|-------|-----------|-----------------|
| 跨议题争议地图 | `?view=map` | `ControversyMap.tsx` | Network graph: topics → claims → cross-topic clusters, with bridge/rebuts edges |
| 辩论树 | `?view=debate` | `DebateTreePrototype.tsx` | Indented expandable tree with sidebar inspector and "add your argument" form |

**Critical architecture rule** (enforced in both force-layout components): the data layer (`DebateNode`/`MapNodeData`) is **never** passed directly to d3. d3 mutates objects in-place (`x`, `y`, `vx`, `vy`, `source`, `target`), so every simulation gets a fresh independent working copy (`SimNode`/`SimLink` or `MapSimNode`/`MapSimLink`). React state holds the immutable data; refs hold the mutable simulation copies.

## Key Architectural Patterns

**D3 + React integration** (used in `ControversyMap.tsx`; the same rules applied in the removed `DebateForceTree.tsx`):
- d3 owns: force simulation, drag behavior, zoom/pan behavior
- React owns: data state, SVG element tree, interaction state (hover/select/collapse)
- The simulation instance is created once in `useEffect` and reused via `.nodes()` / `.force("link").links()`. Never `new` a simulation on data changes — just reheat with `.alpha(0.9).restart()`.
- Per-frame position updates bypass React state: `syncDomPositions()` directly sets `transform` / `x1y1x2y2` attributes on DOM nodes. React state is only used for structural changes (node count/link count changes from expand/collapse).
- **Snapshot-then-mutate ordering**: d3's `forceLink.links()` rewrites `source`/`target` from string ids to node object references. Always snapshot the id strings before calling `.links()`, otherwise you can never recover the ids for React rendering.

**Data flow**:
- `research/controversy-map/build-ts.mjs` → `web/src/data/controversyMap.ts` (auto-generated, never hand-edited)
- `web/src/data/debateGraph.ts` (hand-authored force-graph mock) was **removed on 2026-09-13** together with the `?view=force` view (design decision D3)

**CSS scoping**: Each view's styles live under its own root class in `web/src/styles.css` (`.debate-app`, `.controversy-map`). CSS variables like `--debate-ink`, `--cm-ink` are defined inside those root classes — no shared variable registry.

**No formatter/linter is configured.** Match neighboring code style: 2-space indent, double quotes, semicolons, trailing commas. Use `npm run build` as the type-safety gate.

## Commands

All frontend commands run from `web/`, using the absolute node path:

```bash
cd web
"$NODE" ./node_modules/typescript/bin/tsc -b        # type-check (no emit)
"$NODE" ./node_modules/vitest/vitest.mjs run        # tests (~45s, 56 items baseline)
"$NODE" ./node_modules/vite/bin/vite.js             # dev server on 127.0.0.1:5299
"$NODE" ./node_modules/vite/bin/vite.js build       # build → web/dist/ (pure static)
"$NODE" ./node_modules/vite/bin/vite.js preview     # serve production build locally
```

Prototype/runtime tests (run from `prototypes/`):
```bash
cd prototypes
"$NODE" debate-graph.test.mjs        # 52 items
"$NODE" debate-room.test.mjs         # 41 items
"$NODE" debate-tree-v2.test.mjs      # 40 items
"$NODE" event-replay.test.mjs        # 26 items
"$NODE" app.test.mjs                 # 36 items
```

Rebuild the integrated demo page after changing any prototype:
```bash
cd prototypes && "$NODE" build-app.mjs    # → zhengming-app.html (do not hand-edit)
```

Controversy-map data pipeline (requires `DEEPSEEK_API_KEY`, supports resume):
```bash
cd research/controversy-map
for s in parse extract-claims mine-cross build-map build-ts; do "$NODE" $s.mjs; done
```

`node_modules` is gitignored but checked into this repo copy (~116 MB). New clones only need `npm install` if npm is available on that machine.

## Testing

- **Frontend**: `web/tests/*.test.tsx` — Vitest + jsdom + Testing Library + jest-dom. Cover interactions, graph/data invariants, and layout behavior.
- **Prototypes**: `prototypes/*.test.mjs` — Node DOM stubs that execute page scripts against real DOM assertions. These are the regression suite for the HTML prototypes.
- Run the full frontend suite with `vitest run` from `web/`. There is no coverage threshold; all suites must pass before review.
- When changing a design prototype, run its matching test first, then regenerate `zhengming-app.html`.

## Parallel Development

Three modules (debate-tree, debate-room, event-replay) each have their own git worktree under `.worktrees/`. Ownership boundaries, shared-file restrictions, and merge order are documented in `docs/design/IMPLEMENTATION-PATH.md` §13.

## Commit Conventions

Short Chinese subjects describing completed outcomes. Keep commits focused. PRs should explain the affected behavior, link the PRD, list commands run, and include before/after screenshots for visual changes. Call out regenerated artifacts and data-source changes.
