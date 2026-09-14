/**
 * 辩论间议题与论点对 —— **自动生成，请勿手改**
 *
 * 生成器：`research/controversy-map/gen-debate-topics.mjs`
 * 数据源：`research/controversy-map/claims.json`（知乎立场抽取管线）
 *
 * provenance 红线：以下所有 `author` / `voteUp` / `url` 均为真实数据，**不得修改或伪造**。
 * 议题分布实情：27 个源议题中有 16 个通过明确站队题干门禁；其中 1 个天然同时有正反论点，
 * 因此另有 3 组**跨议题配对**（`crossPaired: true`）——
 * 跨议题配对的双方论点来自不同问题，UI 必须显式标注，不得假装是同一议题的正反方。
 *
 * 重新生成：node research/controversy-map/gen-debate-topics.mjs
 */

import type { DebateTopic, TopicClaim } from "../types/debateRoom";

/** 辩论间可直接开局的议题（成对议题优先，跨议题配对次之） */
export const DEBATE_TOPICS: readonly DebateTopic[] = [
  {
    "questionId": "zh-2077824745589028563",
    "title": "如果人人都可以通过 AI 写代码,程序员还需要存在吗?未来的程序员的工作会是什么?",
    "url": "https://www.zhihu.com/question/2077824745589028563/answer/2078577672926634612?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "paired": true,
    "crossPaired": false,
    "pairingNote": "同一议题下的真实正反论点（争议地图管线立场抽取）",
    "pro": {
      "id": "a--3596866254648524842",
      "claim": "AI将取代只翻译需求成代码的程序员，但放大定义问题与担责者。",
      "author": "kimmking",
      "authorBadge": "",
      "voteUp": 43,
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2078577672926634612?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "责任归属",
      "quality": 0.85
    },
    "con": {
      "id": "a--2483126025033303325",
      "claim": "未来程序员将从写代码转为审查AI代码，但审查能力仍需完整编程知识",
      "author": "Rainchester",
      "authorBadge": "知势榜影响力榜经济与管理领域上榜答主",
      "voteUp": 18,
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2079669249254150636?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "技术壁垒",
      "quality": 0.8
    }
  }
] as const;

/** 跨议题配对（两侧论点来自不同议题，UI 需标注） */
export const CROSS_PAIRED_TOPICS = [
  {
    "questionId": "cross-人类特质-技术壁垒",
    "title": "「AI 最终会扩大「人与人的差距」还是「缩小人与人的差距」?」×「2026 计算机科学专业还值得报考吗?」",
    "url": "https://www.zhihu.com/question/2056406404399722866/answer/2072958219698311223?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "paired": false,
    "crossPaired": true,
    "pairingNote": "跨议题配对 · 人类特质（正）对 技术壁垒（反）· 张力：「只有人能做的」对「机器终将能做」。两侧论点来自不同议题，不是同一问题的正反方。",
    "pro": {
      "id": "a--6593649656487523089",
      "claim": "AI本质上是强者的加速器，会扩大而非缩小人与人之间的差距。",
      "author": "宫非",
      "authorBadge": "台湾科技大学 工学博士",
      "voteUp": 9,
      "url": "https://www.zhihu.com/question/2056406404399722866/answer/2072958219698311223?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.85
    },
    "con": {
      "id": "a--8636163842687801585",
      "claim": "AI能写前后端代码，但写不了驱动和调电路板，嵌入式方向不易被替代。",
      "author": "聊软件的行者",
      "authorBadge": "软件开发行业 从业人员",
      "voteUp": 38,
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2049076385973637252?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "技术壁垒",
      "quality": 0.75
    }
  },
  {
    "questionId": "cross-技术壁垒-教育培养",
    "title": "「ai 已经能编出很完美的程序,程序员这个行业以后是不是会消失?」×「AI时代下,学习一门编程语言是否还有意义?」",
    "url": "https://www.zhihu.com/question/14461028376/answer/2081519104511455372?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "paired": false,
    "crossPaired": true,
    "pairingNote": "跨议题配对 · 技术壁垒（正）对 教育培养（反）· 张力：「壁垒还在」对「人也能被培养出来绕过它」。两侧论点来自不同议题，不是同一问题的正反方。",
    "pro": {
      "id": "a-8130782778536502254",
      "claim": "AI 会写代码后，程序员行业不会消失，但纯编码劳动的价值将持续贬值。",
      "author": "AI小D",
      "authorBadge": "互联网行业 AI产品经理",
      "voteUp": 1,
      "url": "https://www.zhihu.com/question/14461028376/answer/2081519104511455372?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "技术壁垒",
      "quality": 0.85
    },
    "con": {
      "id": "a-7694646029523666707",
      "claim": "AI 时代学习编程语言仍有必要，但只需掌握基础而非死磕技术细节。",
      "author": "Laffinty",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/2081685100555677809/answer/2081688569555464603?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "教育培养",
      "quality": 0.6
    }
  },
  {
    "questionId": "cross-成本经济-人类特质",
    "title": "「2026年在保证本科中下985的条件下,计算机科学与技术是否仍然是值得报考有前途的专业呢?」×「艺术工作者会被AI取代吗?」",
    "url": "https://www.zhihu.com/question/2053994309955872738/answer/2055794754642776895?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "paired": false,
    "crossPaired": true,
    "pairingNote": "跨议题配对 · 成本经济（正）对 人类特质（反）· 张力：「人力成本更贵」对「人的判断贵得有道理」。两侧论点来自不同议题，不是同一问题的正反方。",
    "pro": {
      "id": "a--6819956167400761675",
      "claim": "对普通人而言，计算机仍是少有的努力卷就能获得高回报的专业。",
      "author": "涤生大数据",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/2053994309955872738/answer/2055794754642776895?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "成本经济",
      "quality": 0.7
    },
    "con": {
      "id": "a-7001840320934439329",
      "claim": "AI在原理上无法制造艺术，只能生成内容，但会摧毁艺术赖以生存的市场条件",
      "author": "卓聿CountGiger",
      "authorBadge": "北京电影学院 艺术硕士",
      "voteUp": 21,
      "url": "https://www.zhihu.com/question/593208377/answer/2057978577845588610?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.9
    }
  }
] as const;

/** 单侧议题；其中非 neutral 且题干可站队的项目也可开局，另一侧由对手自主立论。 */
export const SINGLE_SIDED_TOPICS: readonly {
  questionId: string;
  title: string;
  url: string;
  claimCount: number;
  topClaim: TopicClaim;
  side: "pro" | "con" | "neutral";
}[] = [
  {
    "questionId": "zh-49097006",
    "title": "计算机专业真的如此完美吗?",
    "url": "https://www.zhihu.com/question/49097006/answer/2070823452051879520?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a-148125889147348205",
      "claim": "AI助手已能替代大学教师完成计算机课程的答疑解惑，课堂授课价值被大幅削弱。",
      "author": "让往事都随风随风",
      "authorBadge": "",
      "voteUp": 203,
      "url": "https://www.zhihu.com/question/49097006/answer/2070823452051879520?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "教育培养",
      "quality": 0.7
    },
    "side": "pro"
  },
  {
    "questionId": "zh-660021689",
    "title": "计算机专业还值得学吗?",
    "url": "https://www.zhihu.com/question/660021689/answer/2011469279116161065?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--6123579788034080189",
      "claim": "AI只能消灭初级码农岗位，而能指挥AI构建复杂工程的计算机人才价值将暴涨。",
      "author": "BugBuster喵",
      "authorBadge": "",
      "voteUp": 140,
      "url": "https://www.zhihu.com/question/660021689/answer/2011469279116161065?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "技术壁垒",
      "quality": 0.8
    },
    "side": "neutral"
  },
  {
    "questionId": "zh-2035134530596683934",
    "title": "2026 计算机科学专业还值得报考吗?",
    "url": "https://www.zhihu.com/question/2035134530596683934/answer/2048744406606521482?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 4,
    "topClaim": {
      "id": "a--8414699585281428141",
      "claim": "计算机专业仍值得报考，但只有强校强城市的计算机才值得优先考虑，普通学校需慎重。",
      "author": "佳人李大花",
      "authorBadge": "新知答主",
      "voteUp": 85,
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2048744406606521482?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "教育培养",
      "quality": 0.75
    },
    "side": "neutral"
  },
  {
    "questionId": "zh-14461028376",
    "title": "ai 已经能编出很完美的程序,程序员这个行业以后是不是会消失?",
    "url": "https://www.zhihu.com/question/14461028376/answer/2077721823211476810?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 2,
    "topClaim": {
      "id": "a-7506223916112815660",
      "claim": "AI越强，程序员的核心价值越转向承担责任而非编写代码。",
      "author": "张文保",
      "authorBadge": "深圳人机交互信息技术有限公司 创始人",
      "voteUp": 63,
      "url": "https://www.zhihu.com/question/14461028376/answer/2077721823211476810?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "责任归属",
      "quality": 0.85
    },
    "side": "pro"
  },
  {
    "questionId": "zh-12872950823",
    "title": "AI真的可以代替作家、艺术家的创作吗?还是只能代替80%平庸的创作者,将最优秀的艺术家,留给人类?",
    "url": "https://www.zhihu.com/question/12872950823/answer/1904858646455775343?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--5870612721970439520",
      "claim": "AI将快速替代纯内容输出，但替代不了审美与创造力本身。",
      "author": "猪头猫",
      "authorBadge": "",
      "voteUp": 30,
      "url": "https://www.zhihu.com/question/12872950823/answer/1904858646455775343?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.8
    },
    "side": "con"
  },
  {
    "questionId": "zh-593208377",
    "title": "艺术工作者会被AI取代吗?",
    "url": "https://www.zhihu.com/question/593208377/answer/2057978577845588610?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a-7001840320934439329",
      "claim": "AI在原理上无法制造艺术，只能生成内容，但会摧毁艺术赖以生存的市场条件",
      "author": "卓聿CountGiger",
      "authorBadge": "北京电影学院 艺术硕士",
      "voteUp": 21,
      "url": "https://www.zhihu.com/question/593208377/answer/2057978577845588610?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.9
    },
    "side": "con"
  },
  {
    "questionId": "zh-2066911604235571824",
    "title": "2026年了,大学生还有必要学编程吗,AI会不会让程序员失业?",
    "url": "https://www.zhihu.com/question/2066911604235571824/answer/2072824653446394907?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 2,
    "topClaim": {
      "id": "a-8883296274167542039",
      "claim": "2026年大学生仍应学编程，但必须转向AI Agent方向而非传统手搓代码",
      "author": "啦啦啦啦",
      "authorBadge": "广西大学 机械硕士",
      "voteUp": 16,
      "url": "https://www.zhihu.com/question/2066911604235571824/answer/2072824653446394907?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "教育培养",
      "quality": 0.6
    },
    "side": "neutral"
  },
  {
    "questionId": "zh-2056406404399722866",
    "title": "AI 最终会扩大「人与人的差距」还是「缩小人与人的差距」?",
    "url": "https://www.zhihu.com/question/2056406404399722866/answer/2072958219698311223?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--6593649656487523089",
      "claim": "AI本质上是强者的加速器，会扩大而非缩小人与人之间的差距。",
      "author": "宫非",
      "authorBadge": "台湾科技大学 工学博士",
      "voteUp": 9,
      "url": "https://www.zhihu.com/question/2056406404399722866/answer/2072958219698311223?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.85
    },
    "side": "pro"
  },
  {
    "questionId": "zh-583691915",
    "title": "未来几年 AI 会取代艺术设计类的工作吗?",
    "url": "https://www.zhihu.com/question/583691915/answer/2071984546187368250?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--6512767791850319549",
      "claim": "AI只是工具，只要具备审美判断与思辨能力，设计师就不会被取代。",
      "author": "贺嘉",
      "authorBadge": "工业设计行业  人形机器人设计专家",
      "voteUp": 3,
      "url": "https://www.zhihu.com/question/583691915/answer/2071984546187368250?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.7
    },
    "side": "con"
  },
  {
    "questionId": "zh-2058927476735321115",
    "title": "AI到底是在提高效率,还是在抢普通人的饭碗?",
    "url": "https://www.zhihu.com/question/2058927476735321115/answer/2075590453743849834?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a-8201144425862317631",
      "claim": "AI 替代的是重复性任务而非完整岗位，真正被淘汰的是不会驾驭 AI 的人。",
      "author": "花肚token小龙人",
      "authorBadge": "",
      "voteUp": 1,
      "url": "https://www.zhihu.com/question/2058927476735321115/answer/2075590453743849834?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "人类特质",
      "quality": 0.75
    },
    "side": "neutral"
  },
  {
    "questionId": "zh-2081685100555677809",
    "title": "AI时代下,学习一门编程语言是否还有意义?",
    "url": "https://www.zhihu.com/question/2081685100555677809/answer/2081688569555464603?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a-7694646029523666707",
      "claim": "AI 时代学习编程语言仍有必要，但只需掌握基础而非死磕技术细节。",
      "author": "Laffinty",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/2081685100555677809/answer/2081688569555464603?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "教育培养",
      "quality": 0.6
    },
    "side": "con"
  },
  {
    "questionId": "zh-604703607",
    "title": "AI 入侵设计领域,会完全替代设计师吗?",
    "url": "https://www.zhihu.com/question/604703607/answer/2081779356519641141?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--6230768604688732246",
      "claim": "AI 不会完全替代设计师，设计师应把重复设计沉淀为可售卖的数字资产。",
      "author": "壹号单元",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/604703607/answer/2081779356519641141?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "成本经济",
      "quality": 0.7
    },
    "side": "con"
  },
  {
    "questionId": "zh-1902746889251721780",
    "title": "AI绘画,AI设计,AI真的能代替各行各业的设计师吗?",
    "url": "https://www.zhihu.com/question/1902746889251721780/answer/2076334040039408413?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--7940648025065138231",
      "claim": "AI取代的不是设计师，而是设计流程中的执行与试错环节。",
      "author": "时间斗士",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/1902746889251721780/answer/2076334040039408413?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "技术壁垒",
      "quality": 0.85
    },
    "side": "pro"
  },
  {
    "questionId": "zh-2053994309955872738",
    "title": "2026年在保证本科中下985的条件下,计算机科学与技术是否仍然是值得报考有前途的专业呢?",
    "url": "https://www.zhihu.com/question/2053994309955872738/answer/2055794754642776895?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--6819956167400761675",
      "claim": "对普通人而言，计算机仍是少有的努力卷就能获得高回报的专业。",
      "author": "涤生大数据",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/2053994309955872738/answer/2055794754642776895?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "成本经济",
      "quality": 0.7
    },
    "side": "pro"
  },
  {
    "questionId": "zh-1892518226979709619",
    "title": "5年后计算机专业出来还有前途吗?",
    "url": "https://www.zhihu.com/question/1892518226979709619/answer/2081759005005838128?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
    "claimCount": 1,
    "topClaim": {
      "id": "a--6636081953562257961",
      "claim": "AI接管基础工作后，普通本科计算机毕业生岗位空间持续收缩。",
      "author": "与云与诗",
      "authorBadge": "",
      "voteUp": 0,
      "url": "https://www.zhihu.com/question/1892518226979709619/answer/2081759005005838128?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
      "reasonType": "技术壁垒",
      "quality": 0.8
    },
    "side": "pro"
  }
] as const;

/** 全部可开局的议题：真实成对 + 跨议题配对 + 非 neutral 单侧议题。 */
const SINGLE_SIDED_PLAYABLE_TOPICS: readonly DebateTopic[] = SINGLE_SIDED_TOPICS
  .filter((topic) => topic.side !== "neutral")
  .map((topic) => ({
    questionId: topic.questionId,
    title: topic.title,
    url: topic.url,
    paired: false,
    crossPaired: false,
    pairingNote: "单侧真实论点；另一立场由对手自主立论。",
    pro: topic.side === "pro" ? topic.topClaim : null,
    con: topic.side === "con" ? topic.topClaim : null,
  }));

export const PLAYABLE_TOPICS: readonly (DebateTopic & { crossPaired?: boolean; pairingNote?: string })[] = [
  ...DEBATE_TOPICS,
  ...CROSS_PAIRED_TOPICS,
  ...SINGLE_SIDED_PLAYABLE_TOPICS,
];

/** 统计：给 UI 与自检用，避免各处硬编码数字 */
export const TOPIC_STATS = {
  totalQuestions: 16,
  totalClaims: 22,
  pairedTopics: 1,
  crossPairedTopics: 3,
  singleSidedTopics: 15,
} as const;

/** 按 id 取议题 */
export function findTopic(questionId: string) {
  return PLAYABLE_TOPICS.find((topic) => topic.questionId === questionId) ?? null;
}
