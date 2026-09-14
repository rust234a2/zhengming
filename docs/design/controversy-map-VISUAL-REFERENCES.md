# 争议地图 · 可借鉴的图形设计参考

> 目的：在不伪造数据、不违背四条产品红线的前提下，让「106 议题 / 244 论点 / 39 簇 / 698 边」这张图更好看、更能容纳复杂度。
> 本文只做**设计输入**，不改变任何既有结论；具体改造须另开任务卡并同步 PRD / PLAN。

---

## 0. 先看结论：三个最值得抄的方向

| 优先级 | 方向 | 解决什么 | 成本 |
| --- | --- | --- | --- |
| ★★★ | **凸包分组**（convex hull + 分组色域） | 「这些议题是一伙的」——让聚类**自己显形**，而不是靠读者脑补 | 低（纯渲染层，不动数据） |
| ★★★ | **分层边捆绑**（hierarchical edge bundling） | 698 条边从「毛线团」变成「河流」，跨域流量一眼可见 | 中（要引入层级路由） |
| ★★☆ | **聚焦透镜**（focus+context / semantic zoom） | 下钻已有，但顶部是「换一张图」；透镜是「放大局部、保留全局」 | 中 |

一句话概括方向：**从「画所有东西」转向「让结构自己浮出来」**。

---

## 1. 范式清单

### 1.1 凸包分组 · 最直接的收益

- 参考：[force layout + convex hull（点击折叠分组）](https://bl.ocks.org/larskotthoff/4e5dbf8be2c83631a05b)、[brushing + hull + 注释弹窗](https://github.com/foadnamjoo/interactive-network-visualization)
- 做法：对每组节点取 `d3.polygonHull`，向外 offset 若干像素，用 `curveBasisClosed` 收边，低透明度填充 + 同色描边；`tick` 里随力模拟实时更新 `d`。
- 为什么适合本图：现在 39 个主张簇是「一堆同色圆点」，没有**团块感**。加上 hull 之后，「编程域有 26 个议题抱团」「这几个簇其实在同一片区域」会变成一眼可见的事实。
- 关键细节：hull 的透明度必须够低（0.06–0.12），否则会吃掉节点标签的对比度；描边用 1px、同色系加深，不要用黑。
- 注意：hull 只表达「当前布局下的邻接」，不是数据事实——**图例里要写明**，否则会被读成「这几个议题有共同归属」。

### 1.2 分层边捆绑 · 治毛线团

- 参考：[D3 Hierarchical Edge Bundling（Observable 官方）](https://observablehq.com/@d3/hierarchical-edge-bundling)、[原理与 tension 参数讲解](https://syntagmatic.github.io/moonshine/d3-power-tools/edge-bundling.html)、[最小可运行版](https://www.d3-graph-gallery.com/graph/hierarchical_edge_bundling_basic.html)
- 做法：`d3.curveBundle.beta(0.85)` + `node.path(target)` 取最小公共祖先路径作为控制点。`beta` 越小（tension 越高）捆得越紧。
- 为什么适合本图：**骨架视图**天然有层级（域 → 簇 → 议题 或 簇 → 议题）。把 bridge / rebuts 两类边喂给 bundling，就能看见「编程域与就业域之间流动最多」这类**宏观信号**，而这恰是现在散点状连线看不出来的。
- ⚠️ 已知副作用（论文里叫 phantom pattern）：被捆在一起的边会合并成一条「假河」，读者会把无关边读成同一种关系。**所以只建议对同一类边做捆绑**（bridge 之间捆、rebuts 之间捆），不要混类；并且保留 tension 滑杆让用户自己调。

### 1.3 语义缩放与聚焦透镜 · 把下钻升级

- 参考：[iSphere: Focus+Context Sphere（CHI 2017）](http://fandu.org/papers/du2017chi-2.pdf)、[Interactive Dynamics for Visual Analysis（ACM Queue 综述）](https://queue.acm.org/detail.cfm?id=2146416)、MoMA [Inventing Abstraction 关系图](http://www.moma.org/interactives/exhibitions/2012/inventingabstraction/?page=connections)
- 核心概念：van Ham & van Wijk 的 **「Search, show context, expand on demand」** —— 先搜索/选中，再显示上下文，按需展开。比「全量铺开 + 手动缩小」更省认知。
- 现在的实现是**替换式下钻**（进入只含邻居的子图）。行业标准的两种升级：
  1. **保留全局的透镜**：整张图不消失，非相关节点降到 alpha 0.15，相关子图放大到中心 —— 用户不会「丢失自己在哪」。
  2. **Degree-of-Interest 淡化**：给每个节点算一个兴趣分（中心性 × 与当前焦点的距离），分数低于阈值的自动变淡/收起，高于的自动浮现。这是自动化的版本，不用用户点。
- 落地建议：先做 1（改动小、观感提升大），再考虑 2。

### 1.4 圆形 / 径向布局 · 当节点多到跑不过来

- 参考：[弧长连接图与弦图（含财新「周永康的人与财」案例）](https://www.sohu.com/a/233394507_416207)
- 做法：节点沿圆周均匀排布，关系用弧线连接；空间利用率远高于 x 轴排列，适合「节点多、边密」。
- 为什么值得考虑：圆周布局**天然消除重叠**，39 个簇 + 106 议题完全塞得下，且排序维度可选（按域、按冲突数、按时间）。代价是失去了「距离≈语义距离」这一直觉。
- 建议定位：**作为「全量视图」的替代方案**做 A/B，而不是替换力导向主体。理由：力导向是这张图的论点（「让聚类自己浮现」），不能丢。

### 1.5 容器框 · 学术界的另一条路

- 参考：[Computer-supported argumentation 综述（container vs graph 风格对比）](https://www.cs.cmu.edu/~bmclaren/pubs/ScheuerEtAl-CompSupportedArgStateOfArt-IJCSCL2010.pdf)、[DebateGraph](https://gitnux.org/best/argument-mapping-software)
- 做法：不画连线，改用「框」表达归属——一个框 = 一个议题，框里装它的论点；框的嵌套 = 层级。
- 讨论组的结论很清楚：容器的优点是「归属一眼可见」，缺点是**无法表达框与框之间的关系**，且大图难览全局。
- 对我们的启示：**不要改用容器**（我们的核心信息恰恰是跨议题关系），但可以**借它的边框语言**——即 1.1 的 hull。用「框感」表达归属，用「线」表达跨域关系，两者结合。

### 1.6 气象图语法 · 争议映射的原创方法

- 参考：Rodighiero 的 [Weather Map（在线实例）](https://rodighiero.github.io/Edgelands/)、[方法介绍](https://www.rug.nl/cf/campus-fryslan/bloggen/research-digest-understanding-surveillance-s-public-debate)
- 做法：借天气预报图的视觉语法——**等值线**画「活跃度等高线」，**H 标记**标出高压中心（即讨论最密集的议题簇），分区像天气图一样命名。
- 为什么有意思：它把抽象的「讨论密度」变成读者**已经会读**的语言，不需要图例教学。3000 篇报道、20000 个主体照样能读。
- 落地建议：可作为**骨架视图的背景层**——淡色等值线 + 少量 H 标记，回答「哪里争议最热」。这是纯视图层推导，不伪造数据（密度是真实计算的）。

### 1.7 小倍数 · 对比而非叠加

- 参考：莎士比亚悲剧人物关系图（多个小力导向图并列，下方标注节点数与密度）
- 做法：同一套视觉语言，切成若干张小图并排。
- 适用场景：我们的「8 个域」很适合做成 8 张小地图并排，一眼比出「哪个域的争议结构最复杂」。大图看结构，小图看对比。

### 1.8 视觉语汇的技术参考

- 节点/边编码规范：[yFiles 知识图谱指南](https://yfiles.com/knowledge-graph/guide) —— 颜色=类别、形状=类型语义、大小=重要性、粗细=关系强度；「同色必同义」的**一致性原则**优先于好看。
- 反例警戒：[Tufte 的 data-ink 原则](https://www.howtothink.ai/learn/graph-visualization-aids-understanding) —— 任何不承载信息的装饰都是 chartjunk。我们的版本：**不加「发光」「粒子」「渐变」这类纯装饰**，除非它编码了某个真实维度。
- 极简范例：[Kim Albrecht《The Network Behind the Cosmic Web》](https://barabasi.com/art/work/cosmic-web)（[WIRED 报道](https://www.wired.com/2016/04/explore-cosmos-bonkers-interactive-model/)）—— 24000 个星系，**纯黑白**，没有任何多余颜色，靠密度和连线本身说话。这是「复杂图要好看」的极端答案：**减色，而不是加色**。
- 渲染性能：当前 500+ 元素 SVG 无压力，不建议换库（[库选型对比](https://ithelp.ithome.com.tw/articles/10387358)：SVG 适合千级以内，WebGL 方案在万级才有优势）。

---

## 2. 视觉语汇清单（可立刻调的部分）

| 项 | 现状 | 建议 | 依据 |
| --- | --- | --- | --- |
| 分组团块 | 无 | 凸包底 + 低透明度填色 | §1.1 |
| 连线形态 | 全直线 | 骨架层改曲线（`curveBasis`），密集时上 bundling | §1.2 |
| 连线透明度 | 固定 | 按关系类型分层（bridge 0.75 / rebuts 0.6 / member 0.25） | yFiles 层级原则 |
| 标签 | 「显示全部标签」开关 | 改**密度自适应**：缩放 > 1.2 或悬停才出全标签 | 语义缩放 |
| 节点形状 | 全是圆 | 保留圆（形状语义已由颜色+大小承担，加形状反而增噪） | data-ink |
| 主题 | 浅色 `#fbfcfe` | 可选加暗色变体（参考 cosmic web 的极简黑白） | §1.8 |
| 动效 | 入场 + 相机过渡 | 保留；再加「选中后邻居依次浮起」的 stagger | iSphere |
| 冲突边 | 红色虚线 1.6px | 已合理；建议宽度改为**按冲突强度编码**（真实字段驱动） | yFiles |

---

## 3. 与现有视图层的映射

| 视图层级 | 现在是什么 | 加什么范式 | 不改什么 |
| --- | --- | --- | --- |
| 骨架（39 簇 + 177 边） | 金色缝合线 + 红虚线 | **边捆绑** + **簇凸包** | 力配置（bridge 强吸引是核心机制） |
| 全量（+106 议题 +244 论点） | 三层节点铺开 | **DOI 淡化** + 标签密度自适应 | 四类边的视觉编码 |
| 聚焦下钻 | 替换式（只显示邻居） | 升级为**透镜式**（保留背景、非相关降透明） | focusPath 栈与面包屑 |
| 详情面板 | 浮层 | 已足够；补 hull 悬停联动（悬停 hull 高亮整组） | — |

---

## 4. 落地优先级

**P0 · 一个下午就能看到效果的**
1. 簇凸包底色（§1.1）—— 改动最小、观感提升最大
2. 连线透明度分层 + 骨架层曲线化（§2）
3. 标签密度自适应，替换「显示全部标签」开关

**P1 · 需要一轮迭代的**
4. 骨架视图边捆绑 + tension 滑杆（§1.2）
5. 聚焦透镜：非相关节点降透明而非移除（§1.3）
6. 骨架背景密度等值线 + H 标记（§1.6）

**P2 · 可选探索**
7. 8 域小倍数对比视图（§1.7）
8. 圆周布局作为「全量视图」备选（§1.4）
9. 暗色主题变体

---

## 5. 反面清单（明确不做）

1. **不要为好看引入装饰**——发光、粒子、渐变、3D 透视，除非编码了真实字段（Tufte / data-ink）。
2. **不要混类捆绑边**——bridge 与 rebuts 捆在一起会产生 phantom pattern，被读成同一种关系。
3. **不要把 hull 当事实**——hull 是布局的产物，不是数据的归属。图例必须写明。
4. **不要硬按正/反/中性分区**——此前已否决（side 是已降级的 LLM 文本判定）。
5. **不要为了配色好看而新增字段**——违背溯源红线，任何视觉维度必须来自真实数据。

---

## 6. 参考链接汇总

**边捆绑**
- <https://observablehq.com/@d3/hierarchical-edge-bundling>
- <https://syntagmatic.github.io/moonshine/d3-power-tools/edge-bundling.html>
- <https://www.d3-graph-gallery.com/graph/hierarchical_edge_bundling_basic.html>

**分组凸包**
- <https://bl.ocks.org/larskotthoff/4e5dbf8be2c83631a05b>
- <https://github.com/foadnamjoo/interactive-network-visualization>

**聚焦 + 上下文**
- <http://fandu.org/papers/du2017chi-2.pdf>
- <https://queue.acm.org/detail.cfm?id=2146416>
- <http://www.moma.org/interactives/exhibitions/2012/inventingabstraction/?page=connections>

**争议映射方法**
- <https://rodighiero.github.io/Edgelands/>
- <https://www.rug.nl/cf/campus-fryslan/bloggen/research-digest-understanding-surveillance-s-public-debate>
- <https://hal.archives-ouvertes.fr/hal-01672300/document>（「丰富 vs 易读」权衡的经典论述）

**论证可视化 / 辩论产品**
- <https://support.kialo-edu.com/en/hc/discussion-minimap>（Tree 与 Sunburst 两种导览并存）
- <https://www.cs.cmu.edu/~bmclaren/pubs/ScheuerEtAl-CompSupportedArgStateOfArt-IJCSCL2010.pdf>
- <https://handwiki.org/wiki/Argument_map>

**审美与规范**
- <https://yfiles.com/knowledge-graph/guide>
- <https://barabasi.com/art/work/cosmic-web>
- <https://www.wired.com/2016/04/explore-cosmos-bonkers-interactive-model/>
- <https://www.howtothink.ai/learn/graph-visualization-aids-understanding>

**弧长连接图 / 弦图**
- <https://www.sohu.com/a/233394507_416207>

**渲染库选型（结论：暂不需要换）**
- <https://ithelp.ithome.com.tw/articles/10387358>
- <https://www.sciencedirect.com/science/article/pii/S2468502X21000619>
