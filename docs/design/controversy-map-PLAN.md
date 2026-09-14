# 跨议题争议地图 PLAN

版本 v0.1 · 2026-09-14 · 基线：PRD v0.2（实现稿） · 视觉参考：`controversy-map-VISUAL-REFERENCES.md` · 实施路径卡位：**卡 3-4**

---

## 0. 一句话

把 PRD v0.2 的视觉规格逐条落进 `web/src/ui/ControversyMap.tsx` 与 `web/src/styles.css`，全程不动数据层、不碰交互模型。

## 1. 现状盘点（2026-09-14）

| 资产 | 状态 | 说明 |
|---|---|---|
| `web/src/data/controversyMap.ts` | ✅ 基线 | 106 议题 / 244 论点 / 39 簇 / 698 边；自动生成物，**禁止手改** |
| `web/src/ui/ControversyMap.tsx`（约 1250 行） | ✅ 已升级 v0.2 视觉 | 含凸包分组、连线分层、弧线缝合线、标签三档；导出 `HULL_GROUPS` / `hullPathFor` / `labelTierFromK` 供测试共用口径 |
| `web/src/styles.css` 的 `.cm-*` 块 | ✅ 已升级 | 新增 `.cm-hull` / `.cm-lg .hull` 规则及暗色变体 |
| `web/tests/controversyMap.test.tsx`（约 1030 行，49 项） | ✅ 七个 describe | 数据 / 布局 / 组件 / 聚焦 / 凸包 / 连线分层 / 标签密度 |
| 骨架 / 全量两档 + 聚焦下钻（focusPath 栈） | ✅ 基线 | 6979c34 起，dc60470 的"删议题层"已于 6410dde revert 回退 |
| 域层级（8 域） | ⚠️ 存档不再作基线 | 完整实现在 f698f5b，回退于 026a17b；重启须走新增 PRD |
| 边捆绑 / 聚焦透镜 / 密度等值线 | ☐ 未实施 | VISUAL-REFERENCES 的 P1，另立卡 |
| 小倍数 / 圆周布局 / 暗色主题 | ☐ 未实施 | P2 可选探索 |

## 2. 已完成：P0 视觉增强（卡 3-4 主体）

三条全部只动渲染层，数据层 `controversyMap.ts` / `map.json` 一字未改：

| # | 条目 | 提交 | 关键决策 |
|---|---|---|---|
| A1 | 簇凸包底色 | `61d4080` | 分组依据 = **bridge 边**（数据事实），包络形状才是布局产物，图例分开讲；采样成"圆集凸包"免写退化特例；聚焦视图不渲染；悬停分档 is-context / is-muted |
| A2 | 连线透明度分层 + 缝合线弧线化 | `8dbb9ec` | bridge 0.75 / rebuts 0.6 / member 0.25 / contains 0.2；弧线 = 二次贝塞尔，弯向按 id 字典序固定，同一条边不左右翻 |
| A3 | 标签密度自适应 | `8dbb9ec` | k≥1.2 near / k<0.6 far / 其余 mid；跨档才 setState；聚焦强制 mid；按钮降级为手动覆盖 |

## 3. 测试策略

四层口径不变（数据 / 布局 / 组件 / 交互），新增三层：

1. **几何正确性**：`hullPathFor` 纯函数断言——包络包围盒覆盖成员中心、单点成圆、成员全缺时返回 null。
2. **口径锁定**：`HULL_GROUPS` 与数据层 bridge 边逐组比对（防止将来被改成"几何邻近"式分组，那才是伪造数据）；覆盖率锁定 75/106。
3. **视觉编码**：连线常态透明度按关系查表断言；弧线端点必须钉在两端节点坐标上（贝塞尔只影响中段）；标签三档用 `labelTierFromK` 边界值 + 滚轮缩放集成测试（注意 d3 对 wheel 有 150ms 去抖，须 `await` 300ms）。

回归命令：

```bash
cd web && node <node>/vitest.mjs run --reporter=basic   # 全量 223+
node <node>/tsc -b                                       # 0 错误
node <node>/vite.js build                                # ~466KB / gzip ~140KB
```

## 4. 风险表

| 风险 | 等级 | 对策 |
|---|---|---|
| 弧线化动了每帧热路径（syncDomPositions 分流 path/line） | 中 | 已由"弧线端点钉在节点上"测试锁定；若日后掉帧，先隔帧更新凸包再动连线 |
| 凸包每帧重算（39 组 × ~44 采样点） | 低 | 当前远低于连线写入量；簇数上到数百时按 alpha 隔帧更新 |
| 凸包被误读为"共同归属" | 中 | 图例声明 + PRD 反面清单 + 测试锁定分组口径来自 bridge 边 |
| 31/106 议题不落包络被当成 bug | 中 | 测试锁定覆盖率 75/106；图例写明"尚未归入任何跨议题主张" |
| worktree 与 main 的 PRD 漂移（main 还停在 v0.1） | 中 | 合并回 main 时以本 worktree 为准整体覆盖，勿手工挑行合并 |
| d3 wheel 去抖导致标签测试假阴 | 低 | 测试内 `await` 300ms（150ms 去抖 + 富余） |

## 5. 后续（P1 / P2，均另立卡）

- **P1**：骨架视图分层边捆绑（只捆同类边，tension 滑杆）；聚焦透镜（非相关降透明而非移除，属交互语义变更，动工前须更新 PRD §4）；骨架背景密度等值线 + H 标记。
- **P2**：八域小倍数对比；圆周布局作为全量视图备选；暗色主题已具雏形（hull/连线均已有变体），补全剩余规则即可。
