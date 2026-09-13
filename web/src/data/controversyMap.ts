/**
 * 跨议题争议地图数据 —— 自动生成，请勿手工编辑。
 * 生成脚本：zhengming 仓库 docs/research/controversy-map/build-ts.mjs
 *
 * 数据来源：zhihu-cli search zhihu 真实检索（5 次调用，覆盖 5 个检索簇）
 *          → LLM 提炼论点与立场 → LLM 跨议题语义挖掘 → 主张簇归一
 * 生成时间：2026-09-12T06:38:11.325Z
 */

import type { ControversyMapData } from "../types/map";

export const CONTROVERSY_MAP: ControversyMapData = {
  "generatedAt": "2026-09-12T06:38:11.325Z",
  "source": "zhihu-cli search zhihu（真实检索，5 次调用）",
  "stats": {
    "topics": 15,
    "claims": 23,
    "clusters": 5,
    "edges": 71,
    "bridge": 20,
    "member": 20,
    "rebuts": 8,
    "contains": 23
  },
  "nodes": [
    {
      "id": "zh-2035134530596683934",
      "kind": "topic",
      "label": "2026 计算机科学专业还值得报考吗?",
      "fullLabel": "2026 计算机科学专业还值得报考吗?",
      "url": "https://www.zhihu.com/question/2035134530596683934",
      "weight": 4
    },
    {
      "id": "zh-1972252087044796716",
      "kind": "topic",
      "label": "AI写程序的能力毋庸置疑很强大,为何没有取代程序员…",
      "fullLabel": "AI写程序的能力毋庸置疑很强大,为何没有取代程序员,是哪个环节的原因?",
      "url": "https://www.zhihu.com/question/1972252087044796716",
      "weight": 3
    },
    {
      "id": "zh-1977074341968574068",
      "kind": "topic",
      "label": "和 AI 相比,我们作为人类的核心竞争力是什么?",
      "fullLabel": "和 AI 相比,我们作为人类的核心竞争力是什么?",
      "url": "https://www.zhihu.com/question/1977074341968574068",
      "weight": 3
    },
    {
      "id": "zh-2077824745589028563",
      "kind": "topic",
      "label": "如果人人都可以通过 AI 写代码,程序员还需要存在…",
      "fullLabel": "如果人人都可以通过 AI 写代码,程序员还需要存在吗?未来的程序员的工作会是什么?",
      "url": "https://www.zhihu.com/question/2077824745589028563",
      "weight": 2
    },
    {
      "id": "zh-14461028376",
      "kind": "topic",
      "label": "ai 已经能编出很完美的程序,程序员这个行业以后是…",
      "fullLabel": "ai 已经能编出很完美的程序,程序员这个行业以后是不是会消失?",
      "url": "https://www.zhihu.com/question/14461028376",
      "weight": 2
    },
    {
      "id": "zh-2066911604235571824",
      "kind": "topic",
      "label": "2026年了,大学生还有必要学编程吗,AI会不会让…",
      "fullLabel": "2026年了,大学生还有必要学编程吗,AI会不会让程序员失业?",
      "url": "https://www.zhihu.com/question/2066911604235571824",
      "weight": 2
    },
    {
      "id": "zh-2078502972665884970",
      "kind": "topic",
      "label": "马斯克预计到明年底人类将无法与 AI 竞争软件开发…",
      "fullLabel": "马斯克预计到明年底人类将无法与 AI 竞争软件开发,AI 将胜任所有数字工作,对程序员群体影响有多大?",
      "url": "https://www.zhihu.com/question/2078502972665884970",
      "weight": 1
    },
    {
      "id": "zh-2052608342816715544",
      "kind": "topic",
      "label": "为什么总有人嘴硬说程序员不会被 AI 替代?",
      "fullLabel": "为什么总有人嘴硬说程序员不会被 AI 替代?",
      "url": "https://www.zhihu.com/question/2052608342816715544",
      "weight": 1
    },
    {
      "id": "zh-660021689",
      "kind": "topic",
      "label": "计算机专业还值得学吗?",
      "fullLabel": "计算机专业还值得学吗?",
      "url": "https://www.zhihu.com/question/660021689",
      "weight": 1
    },
    {
      "id": "zh-1902746889251721780",
      "kind": "topic",
      "label": "AI绘画,AI设计,AI真的能代替各行各业的设计师…",
      "fullLabel": "AI绘画,AI设计,AI真的能代替各行各业的设计师吗?",
      "url": "https://www.zhihu.com/question/1902746889251721780",
      "weight": 1
    },
    {
      "id": "zh-583691915",
      "kind": "topic",
      "label": "未来几年 AI 会取代艺术设计类的工作吗?",
      "fullLabel": "未来几年 AI 会取代艺术设计类的工作吗?",
      "url": "https://www.zhihu.com/question/583691915",
      "weight": 1
    },
    {
      "id": "zh-465369002",
      "kind": "topic",
      "label": "为什么别选计算机专业?",
      "fullLabel": "为什么别选计算机专业?",
      "url": "https://www.zhihu.com/question/465369002",
      "weight": 1
    },
    {
      "id": "zh-1892518226979709619",
      "kind": "topic",
      "label": "5年后计算机专业出来还有前途吗?",
      "fullLabel": "5年后计算机专业出来还有前途吗?",
      "url": "https://www.zhihu.com/question/1892518226979709619",
      "weight": 1
    },
    {
      "id": "zh-2025152386188985204",
      "kind": "topic",
      "label": "AI越来越强,人类真正不可替代的到底是什么?",
      "fullLabel": "AI越来越强,人类真正不可替代的到底是什么?",
      "url": "https://www.zhihu.com/question/2025152386188985204",
      "weight": 1
    },
    {
      "id": "zh-1992302419741266883",
      "kind": "topic",
      "label": "在AI能秒答一切的时代,人的核心竞争力到底是什么?",
      "fullLabel": "在AI能秒答一切的时代,人的核心竞争力到底是什么?",
      "url": "https://www.zhihu.com/question/1992302419741266883",
      "weight": 1
    },
    {
      "id": "a--7087091483973468197",
      "kind": "claim",
      "label": "AI已对程序员职业造成毁灭性打击，新人进不来、薪资溢价下降…",
      "fullLabel": "AI已对程序员职业造成毁灭性打击，新人进不来、薪资溢价下降、晋升通道断裂。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 204,
      "topicId": "zh-2078502972665884970",
      "url": "https://www.zhihu.com/question/2078502972665884970/answer/2078529379026715388?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3945245772520750417",
      "kind": "claim",
      "label": "AI无法取代程序员，因为软件架构中耦合与复用的度只能靠资深…",
      "fullLabel": "AI无法取代程序员，因为软件架构中耦合与复用的度只能靠资深工程师的隐性经验判断。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 176,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2078914989927166773?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6123579788034080189",
      "kind": "claim",
      "label": "AI只能消灭初级码农岗位，而能指挥AI构建复杂工程的计算机…",
      "fullLabel": "AI只能消灭初级码农岗位，而能指挥AI构建复杂工程的计算机人才价值将暴涨。",
      "side": "neutral",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 140,
      "topicId": "zh-660021689",
      "url": "https://www.zhihu.com/question/660021689/answer/2011469279116161065?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8414699585281428141",
      "kind": "claim",
      "label": "计算机专业仍值得报考，但只有强校强城市的计算机才值得优先考…",
      "fullLabel": "计算机专业仍值得报考，但只有强校强城市的计算机才值得优先考虑，普通学校需慎重。",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.75,
      "votes": 85,
      "topicId": "zh-2035134530596683934",
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2048744406606521482?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7506223916112815660",
      "kind": "claim",
      "label": "AI越强，程序员的核心价值越转向承担责任而非编写代码。",
      "fullLabel": "AI越强，程序员的核心价值越转向承担责任而非编写代码。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 63,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2077721823211476810?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3059213074980422546",
      "kind": "claim",
      "label": "AI降低了初级编程岗位价值，但计算机科学专业仍值得报考。",
      "fullLabel": "AI降低了初级编程岗位价值，但计算机科学专业仍值得报考。",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.8,
      "votes": 56,
      "topicId": "zh-2035134530596683934",
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2049032354732176922?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3596866254648524842",
      "kind": "claim",
      "label": "AI将取代只翻译需求成代码的程序员，但放大定义问题与担责者。",
      "fullLabel": "AI将取代只翻译需求成代码的程序员，但放大定义问题与担责者。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 43,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2078577672926634612?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6926770995914242054",
      "kind": "claim",
      "label": "AI不会消灭程序员，只会像Java一样重新定义程序员的工作…",
      "fullLabel": "AI不会消灭程序员，只会像Java一样重新定义程序员的工作内容",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 26,
      "topicId": "zh-2052608342816715544",
      "url": "https://www.zhihu.com/question/2052608342816715544/answer/2073399408377468668?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2483126025033303325",
      "kind": "claim",
      "label": "未来程序员将从写代码转为审查AI代码，但审查能力仍需完整编…",
      "fullLabel": "未来程序员将从写代码转为审查AI代码，但审查能力仍需完整编程知识",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 18,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2079669249254150636?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3116936308957756347",
      "kind": "claim",
      "label": "AI无法取代程序员，因为它在长任务中会偏离路线且固执不改",
      "fullLabel": "AI无法取代程序员，因为它在长任务中会偏离路线且固执不改",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 17,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2078925731367858489?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8883296274167542039",
      "kind": "claim",
      "label": "2026年大学生仍应学编程，但必须转向AI Agent方向…",
      "fullLabel": "2026年大学生仍应学编程，但必须转向AI Agent方向而非传统手搓代码",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.6,
      "votes": 16,
      "topicId": "zh-2066911604235571824",
      "url": "https://www.zhihu.com/question/2066911604235571824/answer/2072824653446394907?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5887195202431428022",
      "kind": "claim",
      "label": "AI已替代相当一部分程序员，但软件开发真正的难点需求分析并…",
      "fullLabel": "AI已替代相当一部分程序员，但软件开发真正的难点需求分析并未改变",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 15,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2079213215842563423?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3132737687244157601",
      "kind": "claim",
      "label": "AI发展导致计算机专业毕业生需求持续下降，红利期已过，不应…",
      "fullLabel": "AI发展导致计算机专业毕业生需求持续下降，红利期已过，不应再劝人报考。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 14,
      "topicId": "zh-465369002",
      "url": "https://www.zhihu.com/question/465369002/answer/2078028688021514184?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7415577803219682552",
      "kind": "claim",
      "label": "AI缺乏无中生有的创造力和情感共情，无法替代人类在规则以外…",
      "fullLabel": "AI缺乏无中生有的创造力和情感共情，无法替代人类在规则以外领域的核心竞争力。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.6,
      "votes": 4,
      "topicId": "zh-1977074341968574068",
      "url": "https://www.zhihu.com/question/1977074341968574068/answer/2075584109284430210?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6512767791850319549",
      "kind": "claim",
      "label": "AI只是工具，只要具备审美判断与思辨能力，设计师就不会被取…",
      "fullLabel": "AI只是工具，只要具备审美判断与思辨能力，设计师就不会被取代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 3,
      "topicId": "zh-583691915",
      "url": "https://www.zhihu.com/question/583691915/answer/2071984546187368250?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3606585513578338451",
      "kind": "claim",
      "label": "人类不可替代的核心竞争力是为结果承担责任，而非创造力或共情…",
      "fullLabel": "人类不可替代的核心竞争力是为结果承担责任，而非创造力或共情力。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-1977074341968574068",
      "url": "https://www.zhihu.com/question/1977074341968574068/answer/2077759023877730622?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8130782778536502254",
      "kind": "claim",
      "label": "AI 会写代码后，程序员行业不会消失，但纯编码劳动的价值将…",
      "fullLabel": "AI 会写代码后，程序员行业不会消失，但纯编码劳动的价值将持续贬值。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2081519104511455372?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4560790726606256329",
      "kind": "claim",
      "label": "AI 拆除了写代码的门槛，程序员的核心价值已转向业务理解与…",
      "fullLabel": "AI 拆除了写代码的门槛，程序员的核心价值已转向业务理解与系统设计。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-2066911604235571824",
      "url": "https://www.zhihu.com/question/2066911604235571824/answer/2080358985711073237?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7578589222068007825",
      "kind": "claim",
      "label": "人类的核心竞争力在于承担后果、提出问题和试错，这些是 AI…",
      "fullLabel": "人类的核心竞争力在于承担后果、提出问题和试错，这些是 AI 无法替代的。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-1977074341968574068",
      "url": "https://www.zhihu.com/question/1977074341968574068/answer/2076334893332698805?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7940648025065138231",
      "kind": "claim",
      "label": "AI取代的不是设计师，而是设计流程中的执行与试错环节。",
      "fullLabel": "AI取代的不是设计师，而是设计流程中的执行与试错环节。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-1902746889251721780",
      "url": "https://www.zhihu.com/question/1902746889251721780/answer/2076334040039408413?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6636081953562257961",
      "kind": "claim",
      "label": "AI接管基础工作后，普通本科计算机毕业生岗位空间持续收缩。",
      "fullLabel": "AI接管基础工作后，普通本科计算机毕业生岗位空间持续收缩。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 0,
      "topicId": "zh-1892518226979709619",
      "url": "https://www.zhihu.com/question/1892518226979709619/answer/2081759005005838128?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--27641170957010190",
      "kind": "claim",
      "label": "人类不可替代的核心是AI永远无法模拟的有机智能。",
      "fullLabel": "人类不可替代的核心是AI永远无法模拟的有机智能。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 0,
      "topicId": "zh-2025152386188985204",
      "url": "https://www.zhihu.com/question/2025152386188985204/answer/2081747870907103015?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2068354476218263395",
      "kind": "claim",
      "label": "AI越强，人的核心竞争力越在于定义问题、判断价值与承担风险…",
      "fullLabel": "AI越强，人的核心竞争力越在于定义问题、判断价值与承担风险，而非知道答案。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-1992302419741266883",
      "url": "https://www.zhihu.com/question/1992302419741266883/answer/2015119838058684502?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "cl-ai-shrinks-programmer-demand",
      "kind": "cluster",
      "label": "AI致程序员需求萎缩",
      "summary": "AI导致程序员岗位需求减少",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-cannot-replace-human-core",
      "kind": "cluster",
      "label": "AI不可替代人类核心",
      "summary": "AI无法取代人类核心能力",
      "side": "negative",
      "weight": 9,
      "topicCount": 4
    },
    {
      "id": "cl-programmer-value-shifts-to-advanced",
      "kind": "cluster",
      "label": "程序员转向高阶能力",
      "summary": "程序员价值转向高阶能力",
      "side": "neutral",
      "weight": 3,
      "topicCount": 4
    },
    {
      "id": "cl-ai-only-replaces-execution",
      "kind": "cluster",
      "label": "AI只替代执行环节",
      "summary": "AI仅替代执行性工作环节",
      "side": "positive",
      "weight": 6,
      "topicCount": 6
    },
    {
      "id": "cl-value-shifts-to-responsibility",
      "kind": "cluster",
      "label": "核心价值在担责",
      "summary": "人类核心价值转向承担责任",
      "side": "neutral",
      "weight": 3,
      "topicCount": 3
    }
  ],
  "edges": [
    {
      "source": "zh-2078502972665884970",
      "target": "a--7087091483973468197",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a-3945245772520750417",
      "relation": "contains"
    },
    {
      "source": "zh-660021689",
      "target": "a--6123579788034080189",
      "relation": "contains"
    },
    {
      "source": "zh-2035134530596683934",
      "target": "a--8414699585281428141",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a-7506223916112815660",
      "relation": "contains"
    },
    {
      "source": "zh-2035134530596683934",
      "target": "a--3059213074980422546",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a--3596866254648524842",
      "relation": "contains"
    },
    {
      "source": "zh-2052608342816715544",
      "target": "a-6926770995914242054",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a--2483126025033303325",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a--3116936308957756347",
      "relation": "contains"
    },
    {
      "source": "zh-2066911604235571824",
      "target": "a-8883296274167542039",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a-5887195202431428022",
      "relation": "contains"
    },
    {
      "source": "zh-465369002",
      "target": "a-3132737687244157601",
      "relation": "contains"
    },
    {
      "source": "zh-1977074341968574068",
      "target": "a-7415577803219682552",
      "relation": "contains"
    },
    {
      "source": "zh-583691915",
      "target": "a--6512767791850319549",
      "relation": "contains"
    },
    {
      "source": "zh-1977074341968574068",
      "target": "a--3606585513578338451",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a-8130782778536502254",
      "relation": "contains"
    },
    {
      "source": "zh-2066911604235571824",
      "target": "a-4560790726606256329",
      "relation": "contains"
    },
    {
      "source": "zh-1977074341968574068",
      "target": "a-7578589222068007825",
      "relation": "contains"
    },
    {
      "source": "zh-1902746889251721780",
      "target": "a--7940648025065138231",
      "relation": "contains"
    },
    {
      "source": "zh-1892518226979709619",
      "target": "a--6636081953562257961",
      "relation": "contains"
    },
    {
      "source": "zh-2025152386188985204",
      "target": "a--27641170957010190",
      "relation": "contains"
    },
    {
      "source": "zh-1992302419741266883",
      "target": "a-2068354476218263395",
      "relation": "contains"
    },
    {
      "source": "a--7087091483973468197",
      "target": "cl-ai-shrinks-programmer-demand",
      "relation": "member"
    },
    {
      "source": "a-3132737687244157601",
      "target": "cl-ai-shrinks-programmer-demand",
      "relation": "member"
    },
    {
      "source": "cl-ai-shrinks-programmer-demand",
      "target": "zh-2078502972665884970",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-shrinks-programmer-demand",
      "target": "zh-465369002",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-shrinks-programmer-demand",
      "relation": "member"
    },
    {
      "source": "cl-ai-shrinks-programmer-demand",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "a-7415577803219682552",
      "target": "cl-ai-cannot-replace-human-core",
      "relation": "member"
    },
    {
      "source": "a--6512767791850319549",
      "target": "cl-ai-cannot-replace-human-core",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-core",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-replace-human-core",
      "target": "zh-583691915",
      "relation": "bridge"
    },
    {
      "source": "a--27641170957010190",
      "target": "cl-ai-cannot-replace-human-core",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-core",
      "target": "zh-2025152386188985204",
      "relation": "bridge"
    },
    {
      "source": "a-2068354476218263395",
      "target": "cl-ai-cannot-replace-human-core",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-core",
      "target": "zh-1992302419741266883",
      "relation": "bridge"
    },
    {
      "source": "a-7578589222068007825",
      "target": "cl-ai-cannot-replace-human-core",
      "relation": "member"
    },
    {
      "source": "a--6123579788034080189",
      "target": "cl-programmer-value-shifts-to-advanced",
      "relation": "member"
    },
    {
      "source": "a-4560790726606256329",
      "target": "cl-programmer-value-shifts-to-advanced",
      "relation": "member"
    },
    {
      "source": "cl-programmer-value-shifts-to-advanced",
      "target": "zh-660021689",
      "relation": "bridge"
    },
    {
      "source": "cl-programmer-value-shifts-to-advanced",
      "target": "zh-2066911604235571824",
      "relation": "bridge"
    },
    {
      "source": "a--6123579788034080189",
      "target": "cl-ai-only-replaces-execution",
      "relation": "member"
    },
    {
      "source": "a--7940648025065138231",
      "target": "cl-ai-only-replaces-execution",
      "relation": "member"
    },
    {
      "source": "cl-ai-only-replaces-execution",
      "target": "zh-660021689",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-only-replaces-execution",
      "target": "zh-1902746889251721780",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-only-replaces-execution",
      "target": "zh-2035134530596683934",
      "relation": "bridge"
    },
    {
      "source": "a--2483126025033303325",
      "target": "cl-programmer-value-shifts-to-advanced",
      "relation": "member"
    },
    {
      "source": "cl-programmer-value-shifts-to-advanced",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a--2483126025033303325",
      "target": "cl-ai-only-replaces-execution",
      "relation": "member"
    },
    {
      "source": "cl-ai-only-replaces-execution",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a-8130782778536502254",
      "target": "cl-programmer-value-shifts-to-advanced",
      "relation": "member"
    },
    {
      "source": "cl-programmer-value-shifts-to-advanced",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "a-8130782778536502254",
      "target": "cl-ai-only-replaces-execution",
      "relation": "member"
    },
    {
      "source": "cl-ai-only-replaces-execution",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "a-4560790726606256329",
      "target": "cl-ai-only-replaces-execution",
      "relation": "member"
    },
    {
      "source": "cl-ai-only-replaces-execution",
      "target": "zh-2066911604235571824",
      "relation": "bridge"
    },
    {
      "source": "a-7506223916112815660",
      "target": "cl-value-shifts-to-responsibility",
      "relation": "member"
    },
    {
      "source": "a--3596866254648524842",
      "target": "cl-value-shifts-to-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-value-shifts-to-responsibility",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "cl-value-shifts-to-responsibility",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a--3606585513578338451",
      "target": "cl-value-shifts-to-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-value-shifts-to-responsibility",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "a--7087091483973468197",
      "target": "a-6926770995914242054",
      "relation": "rebuts"
    },
    {
      "source": "a-6926770995914242054",
      "target": "a-3132737687244157601",
      "relation": "rebuts"
    },
    {
      "source": "a--6123579788034080189",
      "target": "a--6636081953562257961",
      "relation": "rebuts"
    },
    {
      "source": "a--2483126025033303325",
      "target": "a--6636081953562257961",
      "relation": "rebuts"
    },
    {
      "source": "a--3116936308957756347",
      "target": "a--6636081953562257961",
      "relation": "rebuts"
    },
    {
      "source": "a-8130782778536502254",
      "target": "a--6636081953562257961",
      "relation": "rebuts"
    },
    {
      "source": "a-4560790726606256329",
      "target": "a--6636081953562257961",
      "relation": "rebuts"
    },
    {
      "source": "a--7940648025065138231",
      "target": "a--6636081953562257961",
      "relation": "rebuts"
    }
  ]
};
