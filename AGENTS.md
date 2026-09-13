# Repository Guidelines

## Project Structure & Module Organization

The deployable Vite + React + TypeScript application lives in `web/`. Put visualizations in `web/src/ui/`, graph models in `web/src/types/`, datasets in `web/src/data/`, and component tests in `web/tests/`. `web/src/App.tsx` selects the `map`, `force`, and `debate` views through `?view=`.

`docs/` contains Markdown documentation only. Interactive HTML, screenshots, runtime tests, and the integration builder live in `prototypes/`; treat `prototypes/zhengming-app.html` as generated output. Research scripts, corpora, and data pipelines live in `research/`. Change generated `web/src/data/controversyMap.ts` through `research/controversy-map/`. Ignore `.worktrees/`; it is not canonical source.

## Build, Test, and Development Commands

Run frontend commands from `web/`:

```bash
npm install          # install dependencies in a fresh clone
npm run dev          # start Vite on 127.0.0.1:5299
npm test             # run the Vitest suite once
npm run test:watch   # rerun affected tests while developing
npm run build        # type-check, then create web/dist/
npm run preview      # serve the production build locally
```

After changing a prototype, run its matching test, for example `node prototypes/debate-room.test.mjs`, then regenerate the integrated page with `node prototypes/build-app.mjs`.

## Coding Style & Naming Conventions

TypeScript is strict. Use two-space indentation, double quotes, semicolons, and trailing commas. Use `PascalCase` for components and exported types, `camelCase` for functions and variables, and `UPPER_SNAKE_CASE` for module constants. Scope view CSS under its root class in `web/src/styles.css`. No formatter or linter is configured; match neighboring code and use `npm run build` as the type-safety gate.

## Testing Guidelines

Vitest runs in `jsdom` with Testing Library and jest-dom. Name frontend tests `*.test.tsx` under `web/tests/`; name prototype/runtime tests `*.test.mjs` beside the design artifacts. Cover user interactions, cleanup, graph/data invariants, and layout behavior affected by the change. There is no configured coverage threshold; every relevant suite must pass before review.

## Commit & Pull Request Guidelines

The short history uses concise Chinese subjects describing completed outcomes. Keep commits focused and use similarly direct, outcome-oriented subjects. Pull requests should explain the affected behavior, link the issue or PRD, list commands run, and include before/after screenshots for visual changes. Call out regenerated artifacts and data-source changes.

## Security & Configuration

Keep API credentials such as `DEEPSEEK_API_KEY` in the environment. Never commit secrets or replace source-attributed research data without documenting provenance.
