/**
 * 辩论树冷启动种子 —— **自动生成，请勿手改**
 *
 * 生成器：`research/debate-tree/gen-tree-seeds.mjs`
 *
 * provenance 红线：下列所有 `title` / `url` / `author` / `authorBadge` / `voteUp` / `quote`
 * 均为真实知乎数据（或真实回答正文节选），**不得修改或伪造**。
 *
 * 三条溯源通道（`tier`）：
 *   - `claims`   一级论点已由立场抽取管线产出，作者 / 赞同数 / 原文链接齐备
 *   - `answers`  只采到真实回答摘要，未做论点抽取：立场归属未经标注，
 *                 因此以 `answerSamples` 并列展示，**不冒充一级论点**
 *   - `question` 仅真实题干，尚无内容，等待参与者立论
 *
 * 注意：`voteUp` 是**知乎赞同数**（来源热度），与争鸣平台自身的投票是两回事，
 * UI 里必须分开展示，不得合并成一个数字。
 *
 * 议题分布实情：27 个议题有真实论点（共 36 条）·
 * 3 个议题有真实回答摘要（共 54 条）· 92 个仅题干。
 *
 * 重新生成：node research/debate-tree/gen-tree-seeds.mjs
 */

import type { DebateTreeSeed } from "../types/debateTree";

/** 全部真实议题；按「有论点 → 有回答 → 仅题干」排列，UI 按 `tier` 分组展示 */
export const DEBATE_TREE_SEEDS: readonly DebateTreeSeed[] = [
  {
    "id": "zh-2035134530596683934",
    "zhihuId": "2035134530596683934",
    "title": "2026 计算机科学专业还值得报考吗?",
    "url": "https://www.zhihu.com/question/2035134530596683934",
    "tier": "claims",
    "answerCount": 4,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--8414699585281428141",
        "text": "计算机专业仍值得报考，但只有强校强城市的计算机才值得优先考虑，普通学校需慎重。",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "佳人李大花",
        "authorBadge": "新知答主",
        "voteUp": 85,
        "url": "https://www.zhihu.com/question/2035134530596683934/answer/2048744406606521482?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "先说说我自己的感受，计算机仍然是各个学校里就业率比较好的专业之一，但是，不同学校之间计算机专业的就业情况堪称“云泥之别”。 强校、强城市、强培养、强课题组的计算机，仍然值得优先考虑，但普通学校的“泛计算机”类，要慎重，不能因为“听说”这个专业热门就闭眼报，普通学校闭眼报的“专业红利期”已经过去了。 虽然我们最近几年经常能看到什么35毕业了，AI让程序员失业了之类的新闻，但从薪资端来看，IT相关行业",
        "reasonType": "教育培养",
        "quality": 0.75
      },
      {
        "id": "a--3059213074980422546",
        "text": "AI降低了初级编程岗位价值，但计算机科学专业仍值得报考。",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "Cat Chen",
        "authorBadge": "",
        "voteUp": 56,
        "url": "https://www.zhihu.com/question/2035134530596683934/answer/2049032354732176922?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "",
        "reasonType": "教育培养",
        "quality": 0.8
      },
      {
        "id": "a--8636163842687801585",
        "text": "AI能写前后端代码，但写不了驱动和调电路板，嵌入式方向不易被替代。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "聊软件的行者",
        "authorBadge": "软件开发行业 从业人员",
        "voteUp": 38,
        "url": "https://www.zhihu.com/question/2035134530596683934/answer/2049076385973637252?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "方案A：985/211 → 放心报，但做好读研的准备 今年校招，清北华五+顶尖211的CS毕业生，大厂Special Offer依然能开到40-60万总包。核心研发岗——AI Inference、分布式系统、数据库内核——薪资不但没降，还在涨。 但一个关键变化：门槛已经从\"本科\"提到了\"硕士\"。 团队里的核心研发岗近两年新进的算法岗和系统架构岗，基本没有本科生了。 所以如果你能上这个梯队的学校：计",
        "reasonType": "技术壁垒",
        "quality": 0.75
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-1977074341968574068",
    "zhihuId": "1977074341968574068",
    "title": "和 AI 相比,我们作为人类的核心竞争力是什么?",
    "url": "https://www.zhihu.com/question/1977074341968574068",
    "tier": "claims",
    "answerCount": 3,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-7415577803219682552",
        "text": "AI缺乏无中生有的创造力和情感共情，无法替代人类在规则以外领域的核心竞争力。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "财会文稿小栈",
        "authorBadge": "会计专业技术资格证持证人",
        "voteUp": 4,
        "url": "https://www.zhihu.com/question/1977074341968574068/answer/2075584109284430210?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "",
        "reasonType": "人类特质",
        "quality": 0.6
      },
      {
        "id": "a--3606585513578338451",
        "text": "人类不可替代的核心竞争力是为结果承担责任，而非创造力或共情力。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "曾经是小赵",
        "authorBadge": "互联网行业 AI 产品经理",
        "voteUp": 2,
        "url": "https://www.zhihu.com/question/1977074341968574068/answer/2077759023877730622?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "",
        "reasonType": "责任归属",
        "quality": 0.85
      },
      {
        "id": "a-7578589222068007825",
        "text": "人类的核心竞争力在于承担后果、提出问题和试错，这些是 AI 无法替代的。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "低代码Helms",
        "authorBadge": "",
        "voteUp": 1,
        "url": "https://www.zhihu.com/question/1977074341968574068/answer/2076334893332698805?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "",
        "reasonType": "人类特质",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-1972252087044796716",
    "zhihuId": "1972252087044796716",
    "title": "AI写程序的能力毋庸置疑很强大,为何没有取代程序员,是哪个环节的原因?",
    "url": "https://www.zhihu.com/question/1972252087044796716",
    "tier": "claims",
    "answerCount": 3,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-3945245772520750417",
        "text": "AI无法取代程序员，因为软件架构中耦合与复用的度只能靠资深工程师的隐性经验判断。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "DBinary",
        "authorBadge": "新知答主",
        "voteUp": 176,
        "url": "https://www.zhihu.com/question/1972252087044796716/answer/2078914989927166773?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "几乎没有一本这种方法论告诉你，耦合和复用就是一个矛盾体，工程里模块的设计不可能零耦合也不会有谁蠢到零复用，所以到底复用到什么程度，耦合到什么程度才是合适的，这堆讲架构的书没有一本会告诉你，你只有真正去做了某一个具体业务具体项目最后把这个东西做出来了，放市场和环境中检验通过了，你才能说这种设计方法在做这个项目的时候放在某一个特定的环境中是合适的。但换一个项目换一个需求换一种环境甚至开发成本没那么多的",
        "reasonType": "人类特质",
        "quality": 0.85
      },
      {
        "id": "a--3116936308957756347",
        "text": "AI无法取代程序员，因为它在长任务中会偏离路线且固执不改",
        "stance": "con",
        "sourceSide": "negative",
        "author": "恋猫",
        "authorBadge": "开源项目《GSYVideoPlayer》 作者",
        "voteUp": 17,
        "url": "https://www.zhihu.com/question/1972252087044796716/answer/2078925731367858489?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "又比如，在改 Bug 的时候，证据不足的情况下，自己就开始瞎猜，甚至猜说是 Token 自己不符合 UTF-8 编码，就是不怀疑自己写的东西有问题： 有时候在长任务里，因为压缩记忆出现问题，然后规则也飘了，然后就把之前写好的功能给整没了，过程里自己把下载地址整没了，然后中途自己写死返回 HTTP 200 临时先绕过，后面又忘了，就变成个坑留着，最后发现这个门禁一直 pass 功能，但是实际是个空方",
        "reasonType": "技术壁垒",
        "quality": 0.75
      },
      {
        "id": "a-5887195202431428022",
        "text": "AI已替代相当一部分程序员，但软件开发真正的难点需求分析并未改变",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "文礼",
        "authorBadge": "游戏开发等 2 个话题下的优秀答主",
        "voteUp": 15,
        "url": "https://www.zhihu.com/question/1972252087044796716/answer/2079213215842563423?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "第一，稍微关注一下最近互联网等业界的裁员潮，就可以知道AI的确是有替代相当一部分程序员的。说没有取代不符合事实。 第二，软件开发真正的难度其实是需求分析与描述。而AI需要你告诉它的也是这个。所以软件开发的真正难点，并没有因为AI的到来而发生根本改变。 第三，古法开发的时候，需求没讲清楚或者自相矛盾的地方，人类程序员往往还会发挥主观能动性帮你补。但是目前的AI，它很直率，所以它真的会按照你那个漏洞百",
        "reasonType": "需求本质",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2066911604235571824",
    "zhihuId": "2066911604235571824",
    "title": "2026年了,大学生还有必要学编程吗,AI会不会让程序员失业?",
    "url": "https://www.zhihu.com/question/2066911604235571824",
    "tier": "claims",
    "answerCount": 2,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-8883296274167542039",
        "text": "2026年大学生仍应学编程，但必须转向AI Agent方向而非传统手搓代码",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "啦啦啦啦",
        "authorBadge": "广西大学 机械硕士",
        "voteUp": 16,
        "url": "https://www.zhihu.com/question/2066911604235571824/answer/2072824653446394907?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "大厂程序员朋友和我说过一句话，“以前不会写代码找不到工作，现在只会写代码也找不到工作。” 很多大学生同学还在纠结，学编程有啥用。但其实真正危险的不是学编程的同学，而是还在用10年前方法学编程的人，这才是最害人的，很多人每天收藏Python教程、刷算法视频、背八股，最后发现简历上除了几个练习项目，一个AI相关大项目都没有。 现在手搓的时代已经换了，你去花个一个钟的时间去看看boss招聘，你会发现未来",
        "reasonType": "教育培养",
        "quality": 0.6
      },
      {
        "id": "a-4560790726606256329",
        "text": "AI 拆除了写代码的门槛，程序员的核心价值已转向业务理解与系统设计。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "老梁码上AI",
        "authorBadge": "",
        "voteUp": 1,
        "url": "https://www.zhihu.com/question/2066911604235571824/answer/2080358985711073237?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "第一，写代码变成最低门槛。以前从需求到实现，中间隔着一道”会不会写”的墙，这道墙挡住了很多人，也保护了很多程序员的饭碗。现在 AI 把这道墙拆了。GitHub Copilot、Cursor、Claude Code 这些工具，让一个懂业务的人能直接生成能跑的代码。需求的翻译、系统的设计、业务的兜底，才是 AI 时代程序员真正要守的位置。 一个刚转行做 Agent 的机械专业学生说得很直白：他自己从零",
        "reasonType": "技术壁垒",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2077824745589028563",
    "zhihuId": "2077824745589028563",
    "title": "如果人人都可以通过 AI 写代码,程序员还需要存在吗?未来的程序员的工作会是什么?",
    "url": "https://www.zhihu.com/question/2077824745589028563",
    "tier": "claims",
    "answerCount": 2,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--3596866254648524842",
        "text": "AI将取代只翻译需求成代码的程序员，但放大定义问题与担责者。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "kimmking",
        "authorBadge": "",
        "voteUp": 43,
        "url": "https://www.zhihu.com/question/2077824745589028563/answer/2078577672926634612?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "我在团队里天天看人用 Copilot、Claude 写业务代码，说句实话：需要，但「程序员」这词的含义在塌方式重定义。 场景一：重复 CRUD、表单、单测、胶水脚本，Agent 一天干完你一周的活，这部分岗位确实在收缩，初级「翻译需求成文」的岗位最先承压。场景二：把模糊需求拆成可执行的任务、定架构边界、拍板技术选型、对线上事故负责——这些 Agent 替不了，因为要担责和判断，而模型本身不承担后果",
        "reasonType": "责任归属",
        "quality": 0.85
      },
      {
        "id": "a--2483126025033303325",
        "text": "未来程序员将从写代码转为审查AI代码，但审查能力仍需完整编程知识",
        "stance": "con",
        "sourceSide": "negative",
        "author": "Rainchester",
        "authorBadge": "知势榜影响力榜经济与管理领域上榜答主",
        "voteUp": 18,
        "url": "https://www.zhihu.com/question/2077824745589028563/answer/2079669249254150636?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "这块儿不仅仅是程序员，data scientist和quant当前也面临着类似的变革。 3. 框架与系统设计 决定系统的扩展性、高可用性与安全性，设计清晰的解耦接口与模块边界，避免系统随时间演化为单体泥潭。 这部分目前也还是需要资深程序员面对具体问题提供解决方案，纯AI很难完成。 纯“Vibe Coding”的潜在风险 “Vibe Coding”（氛围编程）最初是由 OpenAI 联合创始人、前特",
        "reasonType": "技术壁垒",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-14461028376",
    "zhihuId": "14461028376",
    "title": "ai 已经能编出很完美的程序,程序员这个行业以后是不是会消失?",
    "url": "https://www.zhihu.com/question/14461028376",
    "tier": "claims",
    "answerCount": 2,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-7506223916112815660",
        "text": "AI越强，程序员的核心价值越转向承担责任而非编写代码。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "张文保",
        "authorBadge": "深圳人机交互信息技术有限公司 创始人",
        "voteUp": 63,
        "url": "https://www.zhihu.com/question/14461028376/answer/2077721823211476810?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "第三类，能定义问题的。这类人其实已经不算纯粹的程序员了，是产品思维加技术能力的混合体。他们的活儿是判断”这东西该不该做”“做成什么样算成功”。AI越强，这类人的杠杆越大，因为执行成本趋近于零，剩下的全是判断力的比拼。 具体怎么办，说点能落地的 如果你已经在这行，或者正准备入行，我给几条实在建议。 第一条，别再练打字速度了，练问问题的能力。 现在决定输出质量的，不是你写代码多快，是你给AI的上下文有",
        "reasonType": "责任归属",
        "quality": 0.85
      },
      {
        "id": "a-8130782778536502254",
        "text": "AI 会写代码后，程序员行业不会消失，但纯编码劳动的价值将持续贬值。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "AI小D",
        "authorBadge": "互联网行业 AI产品经理",
        "voteUp": 1,
        "url": "https://www.zhihu.com/question/14461028376/answer/2081519104511455372?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "短期内不会。 不过，这个行业不可能照旧运行。公司依然需要人开发软件，单纯敲代码的价值却在下降。 一个任务如果已经被描述得足够清楚，输入输出明确，又能靠测试自动验收，AI 接手只是时间问题。麻烦在于，真实的软件开发很少从一张完美的需求单开始，也不会在代码成功运行时结束。 国内招聘市场目前呈现的，正是这种分化。 招聘没有消失，需求正在换方向 根据智联招聘发布的《2026 年人工智能产业人才发展报告》，",
        "reasonType": "技术壁垒",
        "quality": 0.85
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2053994309955872738",
    "zhihuId": "2053994309955872738",
    "title": "2026年在保证本科中下985的条件下,计算机科学与技术是否仍然是值得报考有前途的专业呢?",
    "url": "https://www.zhihu.com/question/2053994309955872738",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--6819956167400761675",
        "text": "对普通人而言，计算机仍是少有的努力卷就能获得高回报的专业。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "涤生大数据",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/2053994309955872738/answer/2055794754642776895?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "你这个算是比较明智的选择了，其实除非是特别牛的计算机院校，比如北邮，西电等等，招聘的时候很少会有人在意这个学科评估的等级的，大家更在意的是否是985，211，是不是硕士等等。 然后就是北京的地理位置，这个搞计算机是完全没有问题的，你可以有更多的机会去实习等等。然后考研的话，到时候会稍微有点点影响，这时候对学科评估和学校含金量看的比较多了，因为这会影响你们后续科研的主要方向等等，不过还好，毕竟是98",
        "reasonType": "成本经济",
        "quality": 0.7
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-1892518226979709619",
    "zhihuId": "1892518226979709619",
    "title": "5年后计算机专业出来还有前途吗?",
    "url": "https://www.zhihu.com/question/1892518226979709619",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--6636081953562257961",
        "text": "AI接管基础工作后，普通本科计算机毕业生岗位空间持续收缩。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "与云与诗",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/1892518226979709619/answer/2081759005005838128?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "规模庞大的中间群体，困在平庸夹层当中。他们熟练运用各类AI工具，完成常规开发、系统运维、数字化项目实施，勉强入职企业信息化运维、外包项目、企业网管一类岗位。薪资褪去互联网行业曾经暴利的光环，回归普通白领水准，收入微薄，加班常态化，晋升通道狭窄。三十五岁失业的阴影常年笼罩头顶。有一份勉强糊口的工作，谈不上事业理想，仅仅是谋生差事，精力不断消耗，薪资上涨近乎停滞。绝大多数普通本科计算机毕业生，最终困在",
        "reasonType": "技术壁垒",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-662412262",
    "zhihuId": "662412262",
    "title": "二本院校学生计算机科学与技术专业往后的出路是什么?",
    "url": "https://www.zhihu.com/question/662412262",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--2080743341833820012",
        "text": "二本计算机学生应优先选实践型细分方向而非计科理论专业。",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "世纪前程",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/662412262/answer/2072994509353493625?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "第四类是完全没有自学能力，只会等着老师喂知识的考生。二本院校的计算机课程，普遍更新速度很慢，很多教材用的还是十年前的旧内容，根本跟不上行业的发展。如果你只会被动学习学校安排的课程，不会主动去自学AI、云计算、数据分析等新兴技术，毕业之后你掌握的知识早就过时了，根本满足不了企业的招聘需求。 四、避坑指南：计算机报考，必须避开的几个致命陷阱 如果你经过前面的判断，确认自己适合报考计算机专业，那么在志愿",
        "reasonType": "教育培养",
        "quality": 0.65
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-660021689",
    "zhihuId": "660021689",
    "title": "计算机专业还值得学吗?",
    "url": "https://www.zhihu.com/question/660021689",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--6123579788034080189",
        "text": "AI只能消灭初级码农岗位，而能指挥AI构建复杂工程的计算机人才价值将暴涨。",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "BugBuster喵",
        "authorBadge": "",
        "voteUp": 140,
        "url": "https://www.zhihu.com/question/660021689/answer/2011469279116161065?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "奥特曼：OpenAI CEO。他的观点很有意思。他说现在是进入计算机领域的历史性时刻，是杠杆率最高的时代。编码的方式会彻底改变，从手写变成驾驶。我们要学会当一个AI的驾驶员。他说了一句很重的话：使用AI的人将取代不使用AI的人。 Andrej Karpathy ：技术圈顶流。他前两天刚发了一个推文：过去两个月，编程发生了断崖式的变化。以前的Coding Agent（编程智能体）还得哄着干，现在扔给",
        "reasonType": "技术壁垒",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2054231707188991838",
    "zhihuId": "2054231707188991838",
    "title": "计算机专业现在的就业前景怎么样?",
    "url": "https://www.zhihu.com/question/2054231707188991838",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-3016148963550676388",
        "text": "计算机仍是就业口径最宽、最值得推荐的专业之一。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "二流三四",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/2054231707188991838/answer/2076758194739734459?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "计算机到现在为止仍然是最值得推荐的专业之一。首先确定一下，这个专业确实没有问题，真的很好，相当值得推荐。 为什么值得推荐？其实很简单。什么样的专业叫好专业？就是这个专业出来以后的就业口径越宽，这个专业越好。计算机专业可以适配于所有行业。你说哪个行业不需要计算机？ 比如我进体制内，公务员、事业编、央国企、军队，都需要计算机专业人才。就以公务员为例，2026届全国公务员国考招录岗位中，有28%的公务员",
        "reasonType": "需求本质",
        "quality": 0.75
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-49097006",
    "zhihuId": "49097006",
    "title": "计算机专业真的如此完美吗?",
    "url": "https://www.zhihu.com/question/49097006",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-148125889147348205",
        "text": "AI助手已能替代大学教师完成计算机课程的答疑解惑，课堂授课价值被大幅削弱。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "让往事都随风随风",
        "authorBadge": "",
        "voteUp": 203,
        "url": "https://www.zhihu.com/question/49097006/answer/2070823452051879520?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "前文有提到，大学里的某些老师的授课质量是很难评的，他们的工作重点是科研而不是授课，授课对他们来说更像是某个不得不完成的任务，甚至有些大学老师对自己所教的这门课的掌握程度也不敢恭维，这就导致哪怕你有不明白的地方，有时也很难在老师那里得到满意的答案——好消息是，我们生活在AI（尤其是大语言模型）高度发展的时代，现有的AI助手已经完全可以帮你答疑解惑 举个最基本的例子： 当你的代码遇到了报错，你完全可以",
        "reasonType": "教育培养",
        "quality": 0.7
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2078502972665884970",
    "zhihuId": "2078502972665884970",
    "title": "马斯克预计到明年底人类将无法与 AI 竞争软件开发,AI 将胜任所有数字工作,对程序员群体影响有多大?",
    "url": "https://www.zhihu.com/question/2078502972665884970",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--7087091483973468197",
        "text": "AI已对程序员职业造成毁灭性打击，新人进不来、薪资溢价下降、晋升通道断裂。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "冰码达",
        "authorBadge": "互联网行业 从业人员",
        "voteUp": 204,
        "url": "https://www.zhihu.com/question/2078502972665884970/answer/2078529379026715388?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "AI 对程序员群体的打击绝对是毁灭性的。 一个职业不需要彻底消失，才算遭到毁灭性打击。新人进不来、团队人数持续缩减、工资溢价下降、晋升通道断裂，已经足够摧毁一个职业。个人能做的，只是在越来越少的席位里竞争，或者赶在原来的岗位消失前，转成另一种人。 不用看明年底，单看现在的模型能力，就已经足够强了。METR 对前沿模型的测试显示，最强的公开智能体已经能够完成原本需要人类专家数小时乃至数天的、定义清楚",
        "reasonType": "行业周期",
        "quality": 0.85
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-465369002",
    "zhihuId": "465369002",
    "title": "为什么别选计算机专业?",
    "url": "https://www.zhihu.com/question/465369002",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-3132737687244157601",
        "text": "AI发展导致计算机专业毕业生需求持续下降，红利期已过，不应再劝人报考。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "三两",
        "authorBadge": "中国科学院大学 生物学博士",
        "voteUp": 14,
        "url": "https://www.zhihu.com/question/465369002/answer/2078028688021514184?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "虽不似往日风光，但也没到劝退的地步。 先说明一下我自己，我不是计算机专业的学生，也不是计算机行业相关的从业者，我只是一个坐在轮椅上的博士，生物是我的专业，对，你没看错，就是那个被戏称为\"四大天坑\"之首的生物。 我们生物专业被劝退了很多年，我刚开始在知乎上写一些关于生物专业的回答时，也会劝一些希望本科毕业后直接就业找到工作环境体面且工资尚可的工作的学生转专业到计算机等热门工科专业，只是现在如果还这么",
        "reasonType": "行业周期",
        "quality": 0.75
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2052608342816715544",
    "zhihuId": "2052608342816715544",
    "title": "为什么总有人嘴硬说程序员不会被 AI 替代?",
    "url": "https://www.zhihu.com/question/2052608342816715544",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-6926770995914242054",
        "text": "AI不会消灭程序员，只会像Java一样重新定义程序员的工作内容",
        "stance": "con",
        "sourceSide": "negative",
        "author": "SamDeepThinking",
        "authorBadge": "软件开发行业 研发高级经理",
        "voteUp": 26,
        "url": "https://www.zhihu.com/question/2052608342816715544/answer/2073399408377468668?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "现在确实有很多人(比如我认识的一些产品经理)通过提示词，完整写出了小程序和App，并且真的上线运营、有了真实用户。这不再是概念验证，而是实实在在的产品。 否认这一点，就是无视正在发生的事实。但用AI做出一个能用的产品和以编程为职业(指那些以系统性保障软件长期可靠运行为核心职责的角色)，仍然是两件事。前者解决的是从无到有的爆发力问题，后者承担的是从有到稳、再到持续演进的系统性责任。一个人可以借助AI",
        "reasonType": "行业周期",
        "quality": 0.85
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-583691915",
    "zhihuId": "583691915",
    "title": "未来几年 AI 会取代艺术设计类的工作吗?",
    "url": "https://www.zhihu.com/question/583691915",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--6512767791850319549",
        "text": "AI只是工具，只要具备审美判断与思辨能力，设计师就不会被取代。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "贺嘉",
        "authorBadge": "工业设计行业  人形机器人设计专家",
        "voteUp": 3,
        "url": "https://www.zhihu.com/question/583691915/answer/2071984546187368250?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "不动脑子，干什么都会被取代。 我是工业设计专业，20年听“狼来了”听的耳朵都起茧子了。 ai只是工具，啥时候ai有了自我意识了，那就不是“取代艺术设计类”工作，而是“人类”要被取代了。 那也轮不到你着急了。 如果你都没建立起自己的“正确”审美、没有思辨只会技法（画图）、对设计上下游毫不关心。 那确实该担心。 接下来一个一个来盘盘： 1. 学校教的大多是“理论”，技法都教不全面，就更别提建立“审美判",
        "reasonType": "人类特质",
        "quality": 0.7
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-593208377",
    "zhihuId": "593208377",
    "title": "艺术工作者会被AI取代吗?",
    "url": "https://www.zhihu.com/question/593208377",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-7001840320934439329",
        "text": "AI在原理上无法制造艺术，只能生成内容，但会摧毁艺术赖以生存的市场条件",
        "stance": "con",
        "sourceSide": "negative",
        "author": "卓聿CountGiger",
        "authorBadge": "北京电影学院 艺术硕士",
        "voteUp": 21,
        "url": "https://www.zhihu.com/question/593208377/answer/2057978577845588610?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "AI生成图像的底层逻辑，跟人类画画是两套完全不同的机制。你打开Nano Banana，输入一段提示词，它吐出一张图。这张图是怎么来的？它从训练数据里学过几十亿张图片，建立起了一个关于“东西应该长什么样”的统计地图。当你输入“一棵树”，它就去那张统计地图上找“树”对应的数字分布，然后生成一张符合那个分布的图。就像把一万张脸叠加在一起得到一张平均面孔那样，AI生成的每一张图，本质上都是它看过的所有图像",
        "reasonType": "人类特质",
        "quality": 0.9
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-1992302419741266883",
    "zhihuId": "1992302419741266883",
    "title": "在AI能秒答一切的时代,人的核心竞争力到底是什么?",
    "url": "https://www.zhihu.com/question/1992302419741266883",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-2068354476218263395",
        "text": "AI越强，人的核心竞争力越在于定义问题、判断价值与承担风险，而非知道答案。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "法徒铭纹",
        "authorBadge": "法律职业资格证持证人",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/1992302419741266883/answer/2015119838058684502?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "当AI能秒答所有问题、高效完成各类知识性任务，很多人陷入焦虑，质疑人的价值与竞争力。实则AI只是工具，真正不可替代的，是人类独有的思维与感知能力，核心可归结为三点。 向内看，保持内省、维持主体性，是立足AI时代的根基。AI能输出标准答案，却无法拥有自我认知与价值判断。人唯有持续内省，才能明确自身需求、坚守价值底线，不被AI的海量信息裹挟，不沦为工具的附庸。这种主体性让我们在复杂选择中保持清醒，在A",
        "reasonType": "人类特质",
        "quality": 0.85
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-604703607",
    "zhihuId": "604703607",
    "title": "AI 入侵设计领域,会完全替代设计师吗?",
    "url": "https://www.zhihu.com/question/604703607",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--6230768604688732246",
        "text": "AI 不会完全替代设计师，设计师应把重复设计沉淀为可售卖的数字资产。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "壹号单元",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/604703607/answer/2081779356519641141?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "",
        "reasonType": "成本经济",
        "quality": 0.7
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2056406404399722866",
    "zhihuId": "2056406404399722866",
    "title": "AI 最终会扩大「人与人的差距」还是「缩小人与人的差距」?",
    "url": "https://www.zhihu.com/question/2056406404399722866",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--6593649656487523089",
        "text": "AI本质上是强者的加速器，会扩大而非缩小人与人之间的差距。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "宫非",
        "authorBadge": "台湾科技大学 工学博士",
        "voteUp": 9,
        "url": "https://www.zhihu.com/question/2056406404399722866/answer/2072958219698311223?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "典型案例来自医疗领域。印度 Qure.ai公司开发了一套胸部 X光片 AI分析系统，部署到偏远农村的移动医疗车上。过去当地极度缺乏放射科医生，误诊率居高不下；如今基层护士拍摄 X光片后，AI数秒内给出敏感度超过 95%的初步诊断。成千上万买不起专家号的普通人，第一次享受到了准专家级的医疗服务——这正是 AI平权力量的生动写照。 但另一方面，当我们撕开“人人皆可创造”的幻象，会发现更扎心的现实：AI",
        "reasonType": "人类特质",
        "quality": 0.85
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2038411932424725710",
    "zhihuId": "2038411932424725710",
    "title": "ai大概还要多久就可以取代程序员了?",
    "url": "https://www.zhihu.com/question/2038411932424725710",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--8393684584489265199",
        "text": "软件开发本质是工业化流程，AI比人更适合遵守工业化策略，将永久取代大部分程序员。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "独元殇",
        "authorBadge": "",
        "voteUp": 136,
        "url": "https://www.zhihu.com/question/2038411932424725710/answer/2074611461687619824?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "正好，今天我在外网，看到了一个老外写的很有意思的长文章，文章大概意思，讲的是程序员的未来，内容写的很深入，我觉得未来确实会这样。。。 地址： newsletter.powderworks.dev... 作者认为，大多数公司的软件开发，其实是一个工业过程（就像在电子厂打螺丝的流程一样），而不是手艺过程（就像雕塑、手工皮鞋差不多），其实在 AI 出现以前，程序员，在这个过程里，就基本没有很大的自由发挥",
        "reasonType": "需求本质",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2058927476735321115",
    "zhihuId": "2058927476735321115",
    "title": "AI到底是在提高效率,还是在抢普通人的饭碗?",
    "url": "https://www.zhihu.com/question/2058927476735321115",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-8201144425862317631",
        "text": "AI 替代的是重复性任务而非完整岗位，真正被淘汰的是不会驾驭 AI 的人。",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "花肚token小龙人",
        "authorBadge": "",
        "voteUp": 1,
        "url": "https://www.zhihu.com/question/2058927476735321115/answer/2075590453743849834?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "这大概是现在讨论 AI 绕不开的灵魂拷问。 我的观点很直接：AI 一边大幅提升效率，一边确实在冲击部分岗位；但它抢的更多是重复的任务，而不是全部人的饭碗，真正拉开差距的，是人会不会驾驭 AI 这个工具。 一、先看清现实：AI 实实在在提升了效率 AI 的本质是生产力杠杆。 写方案、整理文档、翻译、做初稿、数据整理、简单绘图，过去几小时的工作，现在几分钟就能输出初稿。 放到技术开发领域感受会更明显：",
        "reasonType": "人类特质",
        "quality": 0.75
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-1902746889251721780",
    "zhihuId": "1902746889251721780",
    "title": "AI绘画,AI设计,AI真的能代替各行各业的设计师吗?",
    "url": "https://www.zhihu.com/question/1902746889251721780",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--7940648025065138231",
        "text": "AI取代的不是设计师，而是设计流程中的执行与试错环节。",
        "stance": "pro",
        "sourceSide": "positive",
        "author": "时间斗士",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/1902746889251721780/answer/2076334040039408413?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "AI能不能取代设计师？我把设计这行拆成了一条流水线，逐段看AI啃到了哪 利益相关先摆这儿：我在做一个 AI 生图平台，天天跟各种生图模型打交道，也天天看设计师用户怎么用它们。所以这篇既不是”AI取代论”的恐慌文，也不是”AI只是工具”的安慰文——两边的话术我都听腻了，这篇只讲我实际观察到的东西。 先给结论：取代的不是设计师，是设计流程里的”体力段”。 哪段是体力段、哪段AI已经啃下来了、哪段还啃不",
        "reasonType": "技术壁垒",
        "quality": 0.85
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-660051452",
    "zhihuId": "660051452",
    "title": "AI时代的教育以培养什么能力为主?",
    "url": "https://www.zhihu.com/question/660051452",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--8022784150870965630",
        "text": "AI时代教育应培养持续学习与开拓创新能力，而非单纯会用AI或记忆知识。",
        "stance": "neutral",
        "sourceSide": "neutral",
        "author": "wuck",
        "authorBadge": "信息技术高级工程师证书持证人",
        "voteUp": 2,
        "url": "https://www.zhihu.com/question/660051452/answer/2080192453458540349?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "第三个高度一致的判断：AI 时代最稀缺的能力，不是\"会用 AI\"，而是\"能持续学习\"和\"能做开拓者\"。 港科大广州倪明选讲得最系统： \"更重要的是终身学习能力，学生只有具备这种能力，才能确保永远不被淘汰。\" 福耀王树国讲得最有冲击： \"我们要培养这样的人才：做别人还没有发现、还没有做的事情，做新赛道的开拓者。\" \"生态是挑战，是面向社会未来，发现问题、提出问题和解决问题的能力。\" 他举例梁文峰（D",
        "reasonType": "教育培养",
        "quality": 0.65
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2081685100555677809",
    "zhihuId": "2081685100555677809",
    "title": "AI时代下,学习一门编程语言是否还有意义?",
    "url": "https://www.zhihu.com/question/2081685100555677809",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a-7694646029523666707",
        "text": "AI 时代学习编程语言仍有必要，但只需掌握基础而非死磕技术细节。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "Laffinty",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/2081685100555677809/answer/2081688569555464603?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "",
        "reasonType": "教育培养",
        "quality": 0.6
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2025152386188985204",
    "zhihuId": "2025152386188985204",
    "title": "AI越来越强,人类真正不可替代的到底是什么?",
    "url": "https://www.zhihu.com/question/2025152386188985204",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--27641170957010190",
        "text": "人类不可替代的核心是AI永远无法模拟的有机智能。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "启融科技 曹新宇",
        "authorBadge": "",
        "voteUp": 0,
        "url": "https://www.zhihu.com/question/2025152386188985204/answer/2081747870907103015?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "作者：启融科技 曹新宇 真正不可替代的，是你的「有机智能」 现在越来越多人陷入一种深层焦虑： AI学得比我快、懂得比我多、干活比我稳。 我到底还剩下什么价值？ GPT几十秒就能甩出上百个创意方向，Claude一分钟写完一份完整商业计划书，AI能搞定文案、做方案、数据分析、批量产出内容。 在算力、速度、知识储备这三件事上，普通人跟AI比拼，本质上就是以卵击石。 如果你的竞争力，停留在“会做事、懂知识",
        "reasonType": "人类特质",
        "quality": 0.7
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-12872950823",
    "zhihuId": "12872950823",
    "title": "AI真的可以代替作家、艺术家的创作吗?还是只能代替80%平庸的创作者,将最优秀的艺术家,留给人类?",
    "url": "https://www.zhihu.com/question/12872950823",
    "tier": "claims",
    "answerCount": 1,
    "note": "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [
      {
        "id": "a--5870612721970439520",
        "text": "AI将快速替代纯内容输出，但替代不了审美与创造力本身。",
        "stance": "con",
        "sourceSide": "negative",
        "author": "猪头猫",
        "authorBadge": "",
        "voteUp": 30,
        "url": "https://www.zhihu.com/question/12872950823/answer/1904858646455775343?utm_medium=openapi_platform&utm_source=cf621feb3f2d",
        "quote": "一年后（26年8月）更新 绘画圈反ai已经是信仰了，手绘艺术家和观众/买家众志成城建立了次元壁，明确了绘画承载了人类存在意义的内核。所以目前来看至少手绘不会死于ai。未来商业模式很难说，也许画家需要直播作画，同时买家在线成交？ ai视觉赛道从“卷上天”已经演进到“卷到外太空了”，最大门槛还不是一年前大家共识的审美能力、创造力等等等等，而是创作者能否负担算力成本——ai在人物场景一致性和镜头可控性上",
        "reasonType": "人类特质",
        "quality": 0.8
      }
    ],
    "answerSamples": []
  },
  {
    "id": "zh-2038884733304697602",
    "zhihuId": "2038884733304697602",
    "title": "43岁县中物理老师考上苏州头部公办校，该不该辞职去？",
    "url": "https://www.zhihu.com/question/2038884733304697602",
    "tier": "answers",
    "answerCount": 18,
    "note": "语料只采到真实回答摘要，未做论点抽取——立场归属未经标注，因此**不冒充一级论点**，仅作为真实回答并列展示。",
    "clusters": [
      {
        "label": "支持去",
        "count": 8
      },
      {
        "label": "看条件再定",
        "count": 3
      },
      {
        "label": "反对去",
        "count": 2
      },
      {
        "label": "有编就去",
        "count": 2
      }
    ],
    "clusterMeta": {
      "total": 18,
      "valid": 15,
      "topCluster": "支持去",
      "ratio": 53
    },
    "claims": [],
    "answerSamples": [
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2066276538488827942",
        "summary": "如果是为了孩子，那其实是该去的。 有个关系很好的朋友就在淮安，她一直感慨苏南和苏北教育资源极度不均衡。在淮安，同级别的好学校只有区区几所可选。而苏南，依然有具备清北水平的镇中存在。 选择面广，对于孩子来说，总是好事。何况苏州是移民城市，相对于锡常来说，本土方言困难几乎没有。"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038995093496001975",
        "summary": "一定要去，你去考就是已经动心了。 如果不去，以后的时间你可能后悔，甚至不知不觉表现在生活中。 孩子应该可以带到你新工作的学校读书，你不要担心孩子，更好的学校会更令他受益。"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039445066603827526",
        "summary": "犹豫一秒钟，就是个大傻子。 大城市，那是什么概念，你得个头疼感冒，就可以去三甲医院。在县里，不得了癌症，一般都去不了大城市。 学校，在大城市，中考普通高中录取率到百分之七十，还有无数的私立高中，县里可能也就百分之五十五还不到，那多出来的百分之十，就可能决定你孩子是去普通高中，还是去技校。 房子嘛，有钱就买大点，没钱就买小点，再没有就租几年，那问题是不大的。 打工的都知道往大城市里跑，还是个知识分子"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038897713572524645",
        "summary": "公办有编制，属于高层次教育人才，收入苏北县中班主任17万多点，收入包括周末上课，苏州高级职称加上公积金接近30"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038894854483228613",
        "summary": "2个考量 1，考上 的那个学校有没有编制，没有就不考虑 2，工资高一倍，是5000到1万还是，1万到2万，，，这个有实质的差别"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039642109448337254",
        "summary": "不要犹豫！ 肯定去苏州啊！ 买房压力大可以先租房！ 苏州一个好老师，别人求着你补课，好吧，买房根本不用愁。 对孩子来说，机会、机遇都不一样。"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039067160199307961",
        "summary": "去，压力在哪都有，孩子的成绩大部分靠自己，给孩子做个榜样，去更好更高的平台。"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2070142432331802411",
        "summary": "人往高处走，水往低处流，有啥好犹豫的？"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039693111295730254",
        "summary": "可以辞职去！因为你既然参加了考试，说明是自己的愿望，更何况愿望达成！若不去会后悔一生。其实这就是换个地方工作而已，与孩子中考与买房没啥关系。我这样说不知你同意否？"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039663998375819101",
        "summary": "为什么去考，难道是闲着没事干嘛？"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039616887936562934",
        "summary": "如果辞职了，还会有更好的吗？你现在的待遇，已秒杀多少人了？ [图片] [图片] [图片]"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038957954104283340",
        "summary": "这问题没把所有条件说明 是离异了带个娃 还是老婆也在当地 是不是有编制还是普通打工人 家里条件怎么样 老婆要是有编制 是不是愿意一起来苏州还是分居两地 很多问题要具体分析 要是一个人肯定建议去苏州"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038923661294482589",
        "summary": "只有一个问题。 有没有正规的事业编制。 如果有，当然去。 一年二十多，三十个左右的明面上的收入，你还担心什么？ 另外，你这个物理老师的经济账还得好好算算。 何止高了一倍。要计算扣除硬性支出后的可支配收入的。"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038913546734527875",
        "summary": "别的方面我经验也不多，给不到你， 但在苏州教育这方面，可以给你几个我自己的看法。 第一，有没有编，没编后面不用看了， 第二，苏州和淮安教育资源本质上没什么区别，尤其是k12阶段，不用觉得苏州教育资源能好到哪里去，至少对孩子的中高考几乎没什么差别影响。尤其是你娃都要中考了，到高中教育资源大家基本都一样，甚至由于人脉关系，你在淮安能张罗到的教育资源可能更好。 唯一有区别的是，你孩子的同学资源会有所不同"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039455719850779977",
        "summary": "43岁，年龄摆在这，公办学校的尿性你二十多年了还没弄清楚吗？真的凭实力说话吗？万一你抛弃目前有的一切过来了，但不受重用，给你坐冷板凳，给你dirty work虚耗，你又不善于公关领导，你到时只会后悔。除非你是这个公办校的校长钦定引进，进来后的政治待遇和经济待遇由校长保障，那你可以去。"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039013267885007460",
        "summary": "为什么不去？虽然你已经43岁，人生过半，能考上杭州头部公办学校，且有正式编制，是你这辈子修来的福分，一定要抓住这次鱼跃龙门的机会。因为你再干17年就该退休了，但福利待遇却是按杭州这边的编制给发放的，比你在小县城干一辈子物理老师不知道要强多少倍。 至于牵扯到孩子中考、买房、生活压力等现实问题，你可以采取稳住大后方的态度和策略，家里的一切都还是按原来的节奏正常进行就可以，不必要在杭州买房，全家都搬过去"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2039003496930865252",
        "summary": "该不该辞职其实需要自己认真梳理下，任何选择都是硬币的两面，去也会有未知的风险，不去也会有留下的遗憾，但是人生只有一次，既然你参加了考试想必也是希望通过吧，只是未知的风险会让你却步，如果现在你觉得还有发展考试只是为了证明自己的实力，倒是可以不去，但如果现在的发展有限为什么不去试试呢？每个人要为自己的选择负责，祝福你找到自己所愿尽可能不要留有遗憾，谢谢！"
      },
      {
        "url": "https://www.zhihu.com/question/2038884733304697602/answer/2038999483875382002",
        "summary": "去"
      }
    ]
  },
  {
    "id": "zh-1952821980752484262",
    "zhihuId": "1952821980752484262",
    "title": "自由是「拥有更多选择」，还是「不需要做选择」？",
    "url": "https://www.zhihu.com/question/1952821980752484262",
    "tier": "answers",
    "answerCount": 16,
    "note": "语料只采到真实回答摘要，未做论点抽取——立场归属未经标注，因此**不冒充一级论点**，仅作为真实回答并列展示。",
    "clusters": [
      {
        "label": "支持更多选择",
        "count": 5
      },
      {
        "label": "辩证统一/递进",
        "count": 3
      },
      {
        "label": "选择权本身即自由",
        "count": 3
      },
      {
        "label": "支持不需选择",
        "count": 1
      },
      {
        "label": "主动选择/减法",
        "count": 1
      },
      {
        "label": "消极自由(不做的自由)",
        "count": 1
      }
    ],
    "clusterMeta": {
      "total": 16,
      "valid": 14,
      "topCluster": "支持更多选择",
      "ratio": 36
    },
    "claims": [],
    "answerSamples": [
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/1953000336420734308",
        "summary": "肯定是前者啦。“不需要做选择”其实是另一种选项，说明你有更多选择吗。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/1953505593076737840",
        "summary": "自由可以拥有数不清的“选择”。这就是自由的最高境界。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/1954267171787118046",
        "summary": "你懂个毛线的自由，别反复的扯这个话题了"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/1952829346935990228",
        "summary": "这个辩证关系的问题。 拥有多，选择的多，机会也多，更自由一些。 不需要选择，不用机会，就拥有一切，是一种君临天下的自由。 前者是量变到质变，积累，拥有的多，选择更宽松更自由。 不需要，不用选择，是一种超凡脱俗的境界，是一种无任何边界的自由。 如果需要评论，也可能是一种递进关系。前者是必要选择的自由，后者是充分选择的自由，在进一层，无需选择的自由。 [图片]"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2043277318962114858",
        "summary": "自由是拥有更多选择。自由不仅是自己选择，还要自己承担责任？"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2042986871001707439",
        "summary": "肯定是前者啊，后者是被计划、被自由，跟自由不是一个词，甚至是反义词。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2025355975096300184",
        "summary": "不需要做选择，这就从思想和肉体上将自己解脱了出来，真正的自由并不是无牵无挂，随心所欲，真正的自由源自于对自已的“放生”，看透生命的本质，看透人生的始与终，便不再纠结、焦虑、自缚。用宽容的心态看淡发生的一切。祝您通透！"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2025105923023085723",
        "summary": "命运会让你觉得，无论做多少选择，都有一条大致的规律。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2079310212448757006",
        "summary": "自由选和不选才是自由。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2077440742927119825",
        "summary": "有选擇权去決定选擇或不选擇, 才是自由."
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2077013590905824020",
        "summary": "拥有更多选择，是自由的工具；不需要做选择，是自由的心境。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2044799297082983530",
        "summary": "我觉得真正的自由，是拥有选择的底气，却又能从容地做减法。它不是被选项推着走，而是知道自己真正想要什么，能坦然拒绝多余的选项，专注于真正重要的事。比起被动的“无需选择”，带着清醒的主动选择，才是更高级的自由。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2042846311548968970",
        "summary": "这是一个好问题，是这两者的和谐统一，不需要选择的前提是你的人生终极目标已经确定，你的生命内核非常稳定，不会再疑惑、迷茫、徘徊、焦虑、纠结、不安，这是自由真正的内核。其次是这个内核体现出来的思维的广度和深度，主要体现在拥有更多选择的自由度上，是一个人智慧高度的体现。这两者缺一个都不行。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2042826144890804016",
        "summary": "自由不是想做什么就做什么，而是可以不做自己不想做的。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/2036837832510154713",
        "summary": "自由是相对的，所以我还是选择拥有更多选择的权利吧！不做选择是不可能的。定规则的人都要多少遵守点规则，所以没有绝对的自由。"
      },
      {
        "url": "https://www.zhihu.com/question/1952821980752484262/answer/1953818825033253555",
        "summary": "你看，我们回答你的这个问题是自由的，因为我们可以选择“拥有更多的选择”也可以选择“不需要做选择”。"
      }
    ]
  },
  {
    "id": "zh-1965011596905522487",
    "zhihuId": "1965011596905522487",
    "title": "送孩子去国际学校，高昂学费投入真的值得吗？",
    "url": "https://www.zhihu.com/question/1965011596905522487",
    "tier": "answers",
    "answerCount": 20,
    "note": "语料只采到真实回答摘要，未做论点抽取——立场归属未经标注，因此**不冒充一级论点**，仅作为真实回答并列展示。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": [
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1973329802531469013",
        "summary": "前两天，我去我们学校日本外教老师家做客，他有一个小女儿，在中国出生，上小学2年级。 在外教来我们学校之前，他女儿在江宁区某实验小学上学，学习成绩不突出，成绩不好被罚站。这个一开始家长想想入乡随俗也就算了。 但某次，小女儿和老师无意撞在一起，老师的手机掉地上摔坏了，为此老师不但要家长赔偿，还让小女儿罚站了一上午。这就让她妈妈受不了了，跑学校和老师吵了一架。回来就考虑给孩子转学。正好我们学校有个职位，"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1999223016014489319",
        "summary": "有个妈妈说，孩子从小学三年级开始到高三，整整十年，平均每天学习10个小时以上。 学什么专业，十年，每天学习10个小时以上，还学不专？学不好？ 但她笃信，十年后，她儿子大概率考上本科都费劲，更别说成专家了。 大学四年，硕士三年，出来还是啥用没有，找工作依然费劲。 一个人6岁上学，25岁硕士毕业，读19年的书，依然找不到像样的工作。 什么错了？ 学校教育出大问题了。 孩子的成长最需要什么？最需要自主性"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1969370088864986759",
        "summary": "走国际学校这条路，性价比最高的就是那些能考上985或者好一点的211的那些孩子。在超能力的加持下，至少他们大概率能上一个不次于清北的国外名校，这对他们将来的路要好走很多很多。 我身边有这么很熟悉的几个孩子，都是国际高中，然后海本（大部分加海硕），现在已有部分毕业部分继续深造。 这每个孩子身上投入都是3~500万起步，我只说明一下他们现在的情况，不具体描述评价，你看看值不值？ 当然这几个孩子都属于成"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1979245313035375716",
        "summary": "国际学校唯一的优势，就是你考试进入外国大学的时候可以提前帮你适应外国的考试，其他基本没了，又贵又容易培养纨绔子弟，自己想好。"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1965020069248624248",
        "summary": "一个字：别去！ 开放式课程和全人教育是给有闲阶级的。如果你不属于那个阶层，而国家财政又给孩子免费接受教育的机会，为什么不要呢？"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2021905765888266428",
        "summary": "小学阶段没必要，公立学校的数学教的更好，并且小孩需要一定程度的语文基础。但是英语确保能跟上就行，就绝对不能是中国公立学校的英语，要是能读英语原著的水平，能看懂全英语的少儿读物。 我说的国际学校是全英语的国际学校，老师除了中文课之外没有中国人的那种学校，不是那种中英文学校。 初中之后可以考虑过去，科学课（特别是化学和生物）、地理课、历史课上读的英语单词是很难记的，如果初中之后走国内系统，高中很难转过"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2052086444370442094",
        "summary": "你要仔细挑选课程。如果是真的国际化教育，那就很值得。"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2017044489588462438",
        "summary": "留学都已经没有价值了，国际学校还有什么可浪费钱的。以前是向西看，现在已经全面向东看了。 中国好的教育资源都在公立学校，把去国际学校的钱攒着，就近有好的公立学校就就近上，就近没有好的公立学校，可以找找关系跨区进入好的公立学校。不要去上私立学校，更不要去上国际学校。 越轻松的学习环境越耽误孩子，越个性化的学习方法越脱离社会，你可以不卷孩子，但不要让孩子离开卷的环境，在上学的时候多卷些，走向社会的时候就"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1969394884831086428",
        "summary": "普通家庭就压根别考虑国际学校。 学费之外的，你考虑过吗？ 校服、校车、学校伙食费，二三万起。 别人家孩子，钢琴，滑雪，网球，你家怎么也得弄个课外兴趣培养着。 学校每年游学，夏令营，最次也得是日本、新加坡，欧洲美国至少7万起，你家孩子参不参加？ 国际考试、竞赛，报名费，住宿费，三五千算少的。 雅思托福强化班上不上？小班也得四五百左右一小时，一对一1000起步。你家上吗。 终于熬到出国读本科了，四年国"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1965783809682282477",
        "summary": "这个问题问得很好，非常的及时，也非常的切身。我相信这个问题也是大多数的家庭一直在考虑、一直在衡量的一个问题，就是值不值得花这么多的钱跟精力，让自己的孩子去一个西方教育的学校，吸取西方教育的一些独特性和优势。到后来，花了这么多的精力，是不是能够得到一些成功？所付出的代价跟学生到后来的成就是否能够相配？ 那么这个问题呢，其实用很多角度我们去衡量它，是蛮复杂的。那我就跟大家分享，要好好地、明智地去分析…"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1966177204284134241",
        "summary": "作为一位经历过择校纠结的家长，我非常理解您对教育投入和孩子发展的双重顾虑。结合北京国际学校的实际情况和家庭经济压力，我建议优先考虑性价比突出的国际学校，既能接触国际化教育理念，又能避免过度透支家庭经济。以下是几所北京性价比高、口碑优秀的国际学校推荐，供您参考： 北京中关村外国语学校 学费：初中双语班（国际班）9万元/年，住宿费9800元/年，餐费、校服等杂费约5000元/年。 优势：课程体系：融合"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2021602021334087143",
        "summary": "其实这个需要看家庭情况。 有些家庭读国际学校并不是为了以后有多大的回报，只是让孩子能拓宽眼界、提升阅历、结识更多人脉，多接触了解不同国家的文化传统、民族差异等等。 有些家庭确实会考虑投入回报，这也是现实问题，但国内高考太卷了，能考上985 211的只是那部分成绩拔尖的学生。相对于走高考路线来说，同样的成绩水平学国际课程，然后留学更容易申请到排名更好的学校。 如果觉得国际学校的学费就是一笔巨额开支的"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1967980826957443430",
        "summary": "当你问这个问题时，其实就表明你不太愿意走这条路。而且大概率是因为经济问题。 我就不给你分析什么了，简单说一句： 富裕家庭的基本配置，在普通家庭里就需要被讨论值不值。 其实这就说明几个问题： 1.普通人认为这可能是个好东西。但是好在哪里，或者不好在哪里，说不清想不明。总像隔着一层纱。 2.因为第一点的因素，再加上富裕度不够，无法承担试错成本。所以自然考虑值不值的问题。 所以，这是一场赌局，你只能赌一"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2018977696764408157",
        "summary": "孩子能听懂一些日常英语，家庭经济条件可以轻松供读，能进入地道的国际学校（不是中国人扎堆那种），满足这三个，那就值得"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2021907508189566627",
        "summary": "按照你的描述，“巨额开支”，算了吧，这个话题已经停了，安心公立，真的以后家庭收入很可以，到大学再出去也来得及，现在各国大学录取的方式还是蛮多样性的"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1977328170580608427",
        "summary": "看到这个提问，忍不住回复了下，从我个人经历看，我目前还是觉得国际学校是有一定优势了，当然了，每个孩子的性格不一样，有些孩子适合公立学校，有些孩子适合国际学校。 我从小在一个小山村长大，后来毕业后，去了一个繁荣的城市工作和生活。我经历了很多，也见过很多，也认识了很多优秀的人，渐渐的，我发现彼此还是有差距的。 差距不是知识，而是表达和处理事情方面。认识的人中，有不少性格开朗，落落大方，侃侃而谈的人，与"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1965368966517092460",
        "summary": "人建议呢？如果说家庭经济能力一般的情况下，可以先让孩子在国内的中小学先就读到初中毕业，初中毕业之后呢？如果说还有这种想法，那就转给国际教育就好了\\^O^/！ 但是在初中阶段的话，一定要让孩子学好英语，因为如果未来转轨的话，英语很重要，这样额外的能省出很多钱！"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2024141830766302255",
        "summary": "普通家庭是多普通？主要看未来的投入对生活质量的影响，毕竟国内读国际学校之后想参加高考可能有点费劲，除英语之外个别科目卷不过普高的。主要还是先考虑一下经济情况，主要是大学的学费问题，本科的全额奖学金还不太容易拿。"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/1973939962685714730",
        "summary": "有经济实力肯定去好的国际学校。"
      },
      {
        "url": "https://www.zhihu.com/question/1965011596905522487/answer/2018353110309975541",
        "summary": "或许你可尝试先读一下，我往期类似的回答，这里有我家的故事： 夫妻月入 3 万，供一个孩子读国际学校压力大吗？ 然后再来划重点词条。 [图片] 1、想听听有经验的家长的意见么？ 你在文中也提到了，我划重点词条中的绿色部分“身边有些朋友...大家的反馈褒贬不一”。其实有经验的家长 给你的意见亦是如此，由于每个家庭的选择【不只是基于客观做出的决定，更重要是融合主观后的综合考量】，而你的主观或者说“孩子适"
      }
    ]
  },
  {
    "id": "zh-64159076",
    "zhihuId": "64159076",
    "title": "“是不是”可否归纳入“为什么”“是什么”及“怎么样”中?",
    "url": "https://www.zhihu.com/question/64159076",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-624362403",
    "zhihuId": "624362403",
    "title": "“我”是什么,我何以为“我”?",
    "url": "https://www.zhihu.com/question/624362403",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2069142262626383436",
    "zhihuId": "2069142262626383436",
    "title": "《欢迎来龙餐馆》开点映了,看完的朋友来说说,如何评价这部电影?",
    "url": "https://www.zhihu.com/question/2069142262626383436",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2079298778436321909",
    "zhihuId": "2079298778436321909",
    "title": "《欢迎来龙餐馆》为什么袭击的时候偏偏留了老扎一命？",
    "url": "https://www.zhihu.com/question/2079298778436321909",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080666441016256229",
    "zhihuId": "2080666441016256229",
    "title": "「甲醛风波」后康保白菜收购价跌至三分之一，全县紧急自救，网格员监督采收、菜农生吃白菜，能挽回信任吗？",
    "url": "https://www.zhihu.com/question/2080666441016256229",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1971177590283810301",
    "zhihuId": "1971177590283810301",
    "title": "33岁,想去读研究生,有必要吗?",
    "url": "https://www.zhihu.com/question/1971177590283810301",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2017597112888608162",
    "zhihuId": "2017597112888608162",
    "title": "本人单身,喜欢上了一个离异带儿子的女人,到底该不该娶?",
    "url": "https://www.zhihu.com/question/2017597112888608162",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2061407971196900972",
    "zhihuId": "2061407971196900972",
    "title": "穿越成刚毕业的祁同伟，被分到偏远乡镇司法所，你会怎么办？",
    "url": "https://www.zhihu.com/question/2061407971196900972",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 情境假设；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2017239716030874821",
    "zhihuId": "2017239716030874821",
    "title": "打工人真的能用AI提效吗?",
    "url": "https://www.zhihu.com/question/2017239716030874821",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-67944769",
    "zhihuId": "67944769",
    "title": "到底该不该成为恋人想要的样子?",
    "url": "https://www.zhihu.com/question/67944769",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2068655052978500109",
    "zhihuId": "2068655052978500109",
    "title": "都说 ThinkPad 是经典,现在入手联想 ThinkPad 系列还值得吗?",
    "url": "https://www.zhihu.com/question/2068655052978500109",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2024900061482460141",
    "zhihuId": "2024900061482460141",
    "title": "豆包、千问、deepseek、元宝这几个AI助手哪个更好用?",
    "url": "https://www.zhihu.com/question/2024900061482460141",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 比较选择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2070490071837454810",
    "zhihuId": "2070490071837454810",
    "title": "对小朋友而言,每天两个小时以上的户外活动真的有必要吗?",
    "url": "https://www.zhihu.com/question/2070490071837454810",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2071229337567867394",
    "zhihuId": "2071229337567867394",
    "title": "该不该为了“好的就业”,而放弃“热爱”?",
    "url": "https://www.zhihu.com/question/2071229337567867394",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1906357313964580934",
    "zhihuId": "1906357313964580934",
    "title": "跟你一起上班的搭子离职了,你会不会也会离职?",
    "url": "https://www.zhihu.com/question/1906357313964580934",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080530466931843728",
    "zhihuId": "2080530466931843728",
    "title": "孩子做错事,到底该不该当众批评?",
    "url": "https://www.zhihu.com/question/2080530466931843728",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1995628400660996886",
    "zhihuId": "1995628400660996886",
    "title": "花费人生最珍贵的20年养育孩子值得吗?",
    "url": "https://www.zhihu.com/question/1995628400660996886",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080312037121471070",
    "zhihuId": "2080312037121471070",
    "title": "华为鸿蒙 7 操作系统采用超空间存储技术，用户升级后最多可节省 109 GB存储空间，如何看待该性能？",
    "url": "https://www.zhihu.com/question/2080312037121471070",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-61220975",
    "zhihuId": "61220975",
    "title": "会不会和能不能做一件事的区别?",
    "url": "https://www.zhihu.com/question/61220975",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2022768663053308956",
    "zhihuId": "2022768663053308956",
    "title": "仅仅凭借兴趣,去学习一辈子用不上的知识,值得吗?",
    "url": "https://www.zhihu.com/question/2022768663053308956",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1999041081275355787",
    "zhihuId": "1999041081275355787",
    "title": "仅凭ai真的能做好复杂项目吗?",
    "url": "https://www.zhihu.com/question/1999041081275355787",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080384784979554445",
    "zhihuId": "2080384784979554445",
    "title": "近期不少医院医生挂号页面出现「医保扣分情况」介绍，这是什么意思？",
    "url": "https://www.zhihu.com/question/2080384784979554445",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1979822729885671603",
    "zhihuId": "1979822729885671603",
    "title": "看书、健身能真的能缓解焦虑吗?",
    "url": "https://www.zhihu.com/question/1979822729885671603",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-25710791",
    "zhihuId": "25710791",
    "title": "旅行真的能使人改变吗?",
    "url": "https://www.zhihu.com/question/25710791",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2078132215284753080",
    "zhihuId": "2078132215284753080",
    "title": "毛阿敏为什么要在镜头面前把许晴逼到崩溃？",
    "url": "https://www.zhihu.com/question/2078132215284753080",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2074132739167610655",
    "zhihuId": "2074132739167610655",
    "title": "没有wtxj和wtgj会不会感染性病对吗?",
    "url": "https://www.zhihu.com/question/2074132739167610655",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-771776742",
    "zhihuId": "771776742",
    "title": "男生会不会喜欢一个长得不好看,但对他非常好的女生?",
    "url": "https://www.zhihu.com/question/771776742",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-66766801",
    "zhihuId": "66766801",
    "title": "你觉得杭州这座城市怎么样?",
    "url": "https://www.zhihu.com/question/66766801",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 审美评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-340267163",
    "zhihuId": "340267163",
    "title": "你觉得江苏常州怎么样?",
    "url": "https://www.zhihu.com/question/340267163",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 审美评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2004562129647313736",
    "zhihuId": "2004562129647313736",
    "title": "你觉得你在家庭中的付出值得吗?",
    "url": "https://www.zhihu.com/question/2004562129647313736",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-593708590",
    "zhihuId": "593708590",
    "title": "你觉得最有感觉的诗句是什么?",
    "url": "https://www.zhihu.com/question/593708590",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080462476299321591",
    "zhihuId": "2080462476299321591",
    "title": "普通家庭到底该不该卷孩子教育?",
    "url": "https://www.zhihu.com/question/2080462476299321591",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-14950584841",
    "zhihuId": "14950584841",
    "title": "人生,是什么?",
    "url": "https://www.zhihu.com/question/14950584841",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-307311764",
    "zhihuId": "307311764",
    "title": "人生到底值不值得?",
    "url": "https://www.zhihu.com/question/307311764",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-24138172",
    "zhihuId": "24138172",
    "title": "人为什么会提出这么多的问题和为什么?这我猜应该是一个没有答案的终极问题?",
    "url": "https://www.zhihu.com/question/24138172",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2056905083812589859",
    "zhihuId": "2056905083812589859",
    "title": "如果今年中国介入战争,你如何看待?",
    "url": "https://www.zhihu.com/question/2056905083812589859",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080587236807128910",
    "zhihuId": "2080587236807128910",
    "title": "如果一份工作稳定但没有成长,该不该为了确定性一直做下去?",
    "url": "https://www.zhihu.com/question/2080587236807128910",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-322964938",
    "zhihuId": "322964938",
    "title": "如果有一天地球冰川全部融化,人类会不会生活在水中?",
    "url": "https://www.zhihu.com/question/322964938",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080654680389051865",
    "zhihuId": "2080654680389051865",
    "title": "如何看待 Buckmaster 披露 OpenAI 在 NS 方程突破中的学术掠夺与威胁言论？",
    "url": "https://www.zhihu.com/question/2080654680389051865",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区（高风险）」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2075184281400493544",
    "zhihuId": "2075184281400493544",
    "title": "如何看待“必要的牺牲”这类言论?",
    "url": "https://www.zhihu.com/question/2075184281400493544",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-528779789",
    "zhihuId": "528779789",
    "title": "如何看待00后多数人对电脑基础知识的缺失?",
    "url": "https://www.zhihu.com/question/528779789",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-26616271",
    "zhihuId": "26616271",
    "title": "如何看待00后这个群体?",
    "url": "https://www.zhihu.com/question/26616271",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080594668526514773",
    "zhihuId": "2080594668526514773",
    "title": "如何看待冯小刚电影《抓特务》上线流媒体后出现口碑逆袭？可能有哪些原因？",
    "url": "https://www.zhihu.com/question/2080594668526514773",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-459392094",
    "zhihuId": "459392094",
    "title": "如何看待年轻人「躺平」的现象?",
    "url": "https://www.zhihu.com/question/459392094",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2065427328394647412",
    "zhihuId": "2065427328394647412",
    "title": "如何看待商务部发布《关于所谓“产能过剩”问题,中方阐明立场!》?",
    "url": "https://www.zhihu.com/question/2065427328394647412",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区（高风险）」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-12137646002",
    "zhihuId": "12137646002",
    "title": "如何看待现在县城的中学逐渐衰弱?",
    "url": "https://www.zhihu.com/question/12137646002",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2058734226548250080",
    "zhihuId": "2058734226548250080",
    "title": "如何评价 OpenAI 正式推出的 GPT-5.6 系列模型?使用体验如何?",
    "url": "https://www.zhihu.com/question/2058734226548250080",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2070182701299152586",
    "zhihuId": "2070182701299152586",
    "title": "如何评价《欢迎来龙餐馆》这部电影?",
    "url": "https://www.zhihu.com/question/2070182701299152586",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2074218358602573057",
    "zhihuId": "2074218358602573057",
    "title": "如何评价《牛来》IMDb 评分 6.4,打 10 分比例占 7 成?能说明外国人也很喜欢《牛来》吗?",
    "url": "https://www.zhihu.com/question/2074218358602573057",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2050183673253778928",
    "zhihuId": "2050183673253778928",
    "title": "如何评价《射雕英雄传》中杨康这个亦正亦邪的角色？",
    "url": "https://www.zhihu.com/question/2050183673253778928",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-408440790",
    "zhihuId": "408440790",
    "title": "如何评价复旦大学教授沈逸?",
    "url": "https://www.zhihu.com/question/408440790",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2070960286089966971",
    "zhihuId": "2070960286089966971",
    "title": "如何评价恋综《心动的信号 第九季》？",
    "url": "https://www.zhihu.com/question/2070960286089966971",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-20549637",
    "zhihuId": "20549637",
    "title": "如何评价梁文道?",
    "url": "https://www.zhihu.com/question/20549637",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-21358166",
    "zhihuId": "21358166",
    "title": "如何评价知乎?",
    "url": "https://www.zhihu.com/question/21358166",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1943409314778821536",
    "zhihuId": "1943409314778821536",
    "title": "如何评价知名作者当年明月评价海瑞为好人,但是个没用无能的官?",
    "url": "https://www.zhihu.com/question/1943409314778821536",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2079499882709233769",
    "zhihuId": "2079499882709233769",
    "title": "如何评价AA推出V4.2评分标准，GPT-6分数超过Muse Spark 1.3？",
    "url": "https://www.zhihu.com/question/2079499882709233769",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080743820598010604",
    "zhihuId": "2080743820598010604",
    "title": "上海10月1日起生娃个人「不花钱」，产检超额费用全兜底，住院分娩政策内费用全报销，新政会带来哪些利好？",
    "url": "https://www.zhihu.com/question/2080743820598010604",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-372696866",
    "zhihuId": "372696866",
    "title": "什么是\"是什么\"?",
    "url": "https://www.zhihu.com/question/372696866",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2074050445392327068",
    "zhihuId": "2074050445392327068",
    "title": "数学学习中使用错题本真的有必要吗?",
    "url": "https://www.zhihu.com/question/2074050445392327068",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2078942322033796756",
    "zhihuId": "2078942322033796756",
    "title": "孙悟空大闹天宫时，如来佛祖为什么那么听话，玉帝一\"传旨\"他就来？",
    "url": "https://www.zhihu.com/question/2078942322033796756",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080698018320344249",
    "zhihuId": "2080698018320344249",
    "title": "太子奶创始人李途纯去世，曾以8888万夺央视「标王」，被拘禁15个月后获无罪释放，如何评价他的一生？",
    "url": "https://www.zhihu.com/question/2080698018320344249",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区（高风险）」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-488979181",
    "zhihuId": "488979181",
    "title": "王菲九月主旋律新歌 《如愿》你觉得怎么样?",
    "url": "https://www.zhihu.com/question/488979181",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 审美评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080294144782644902",
    "zhihuId": "2080294144782644902",
    "title": "网传长江武汉段三艘驳船，单次十秒倾倒大量黑色物质入江，相关部门已紧急巡查，倾倒物可能是什么？危害多大？",
    "url": "https://www.zhihu.com/question/2080294144782644902",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080319967770015402",
    "zhihuId": "2080319967770015402",
    "title": "网友称自己上班时突然不认识字了，连数字也不认识了，这是咋回事？能认定为工伤吗？",
    "url": "https://www.zhihu.com/question/2080319967770015402",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2023911893291550702",
    "zhihuId": "2023911893291550702",
    "title": "微信会成为中国版的超级Telegram吗？",
    "url": "https://www.zhihu.com/question/2023911893291550702",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-392756518",
    "zhihuId": "392756518",
    "title": "为什么很多人喜欢问为什么?",
    "url": "https://www.zhihu.com/question/392756518",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2016674512280760598",
    "zhihuId": "2016674512280760598",
    "title": "为什么会“明知不可为而为之”?",
    "url": "https://www.zhihu.com/question/2016674512280760598",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1893752823713335174",
    "zhihuId": "1893752823713335174",
    "title": "为什么科学只能解释“如何”发生,而无法解释“为什么”发生?",
    "url": "https://www.zhihu.com/question/1893752823713335174",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2062999125675749405",
    "zhihuId": "2062999125675749405",
    "title": "为什么我们总忍不住问「为什么」?其深层原因是什么?",
    "url": "https://www.zhihu.com/question/2062999125675749405",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2063913247355547653",
    "zhihuId": "2063913247355547653",
    "title": "为什么要先问是不是再问为什么?",
    "url": "https://www.zhihu.com/question/2063913247355547653",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2071695666879927307",
    "zhihuId": "2071695666879927307",
    "title": "为什么有些人愿意把自己一点一点摸索出来的经验,毫无保留的分享给别人?",
    "url": "https://www.zhihu.com/question/2071695666879927307",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-936226915",
    "zhihuId": "936226915",
    "title": "为什么在做一件事之前,脑海先想到的是「如果失败怎么办、会不会很尴尬、会不会很麻烦、被别人嘲笑怎么办」?",
    "url": "https://www.zhihu.com/question/936226915",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1897117397099472494",
    "zhihuId": "1897117397099472494",
    "title": "为什么这么长时间知乎用户还是学不会先问是不是,再问为什么?",
    "url": "https://www.zhihu.com/question/1897117397099472494",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1970026286752695372",
    "zhihuId": "1970026286752695372",
    "title": "我们在问一个“为什么”的问题之前,是否应该先把“为什么”换成“是不是”?",
    "url": "https://www.zhihu.com/question/1970026286752695372",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1890557928639035353",
    "zhihuId": "1890557928639035353",
    "title": "现在的国产影视剧为何总被吐槽「剧情拖沓」「逻辑漏洞」?如何提升质量?",
    "url": "https://www.zhihu.com/question/1890557928639035353",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2071510814574563507",
    "zhihuId": "2071510814574563507",
    "title": "相声艺术该不该掺杂“荤段子、脏段子”?",
    "url": "https://www.zhihu.com/question/2071510814574563507",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-427488834",
    "zhihuId": "427488834",
    "title": "想买个笔记本锐龙r7和酷睿i5哪个更好一些?或则说各自的优势是什么?",
    "url": "https://www.zhihu.com/question/427488834",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2069710609210516469",
    "zhihuId": "2069710609210516469",
    "title": "心里难受的时候该不该找人倾诉?",
    "url": "https://www.zhihu.com/question/2069710609210516469",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2077671894501831704",
    "zhihuId": "2077671894501831704",
    "title": "一味讨好别人真的能赢得接纳吗?",
    "url": "https://www.zhihu.com/question/2077671894501831704",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2019227105947309977",
    "zhihuId": "2019227105947309977",
    "title": "因为害怕失去而一味妥协,这样的感情真的能走到最后吗?",
    "url": "https://www.zhihu.com/question/2019227105947309977",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-304880302",
    "zhihuId": "304880302",
    "title": "有没有必要经常向领导汇报工作,为什么?",
    "url": "https://www.zhihu.com/question/304880302",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1999984986703544538",
    "zhihuId": "1999984986703544538",
    "title": "在工作看不到未来,迷茫的时候该不该辞职呢?",
    "url": "https://www.zhihu.com/question/1999984986703544538",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080799652820029727",
    "zhihuId": "2080799652820029727",
    "title": "怎么看 DeepSeek Flash 系列9月10日将再调整定价，除输出外回归8月17日前价格？",
    "url": "https://www.zhihu.com/question/2080799652820029727",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080681933982393659",
    "zhihuId": "2080681933982393659",
    "title": "怎么看 OpenAI 在 Navier–Stokes 数学难题上取得的进展反而出现争议？",
    "url": "https://www.zhihu.com/question/2080681933982393659",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区（高风险）」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1999977464231900132",
    "zhihuId": "1999977464231900132",
    "title": "怎么看待经常去嫖娼的男生?",
    "url": "https://www.zhihu.com/question/1999977464231900132",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 观点评价；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-315964268",
    "zhihuId": "315964268",
    "title": "怎么判断一段感情该不该继续下去?",
    "url": "https://www.zhihu.com/question/315964268",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 决策抉择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-441287772",
    "zhihuId": "441287772",
    "title": "针对“为什么”回答必是“原因”,那针对“如何”回答必是什么呢?针对“你如何知道”回答必是什么呢?",
    "url": "https://www.zhihu.com/question/441287772",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 概念辨析；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-10745649318",
    "zhihuId": "10745649318",
    "title": "知乎为什么会有「先问是不是,再问为什么」这样一个潜规定?",
    "url": "https://www.zhihu.com/question/10745649318",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1927517675652875487",
    "zhihuId": "1927517675652875487",
    "title": "iphone16pro和pro max 选哪个更好呢?",
    "url": "https://www.zhihu.com/question/1927517675652875487",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「可用区」 · 比较选择；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-2080887293624304807",
    "zhihuId": "2080887293624304807",
    "title": "OpenAI 宣布攻克了 N-S equations 这一千禧年问题，这意味着什么？会产生哪些影响？",
    "url": "https://www.zhihu.com/question/2080887293624304807",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-1915554757478678997",
    "zhihuId": "1915554757478678997",
    "title": "wtbdkj和dtxj会不会HIV和tp?",
    "url": "https://www.zhihu.com/question/1915554757478678997",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「甜区」 · 预测推演；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  },
  {
    "id": "zh-580636426",
    "zhihuId": "580636426",
    "title": "yes 不是 是 的意思吗?为什么这个说No?",
    "url": "https://www.zhihu.com/question/580636426",
    "tier": "question",
    "answerCount": null,
    "note": "题干经语料门禁判为「弱可辩」 · 归因探究；尚无真实论点，等待参与者立论。",
    "clusters": [],
    "clusterMeta": null,
    "claims": [],
    "answerSamples": []
  }
];

/** 默认打开的议题：真实论点最多且正反兼具 */
export const DEFAULT_TREE_SEED_ID = "zh-1972252087044796716";

export const TREE_SEED_STATS = {
  topics: 122,
  claimTopics: 27,
  answerTopics: 3,
  questionOnlyTopics: 92,
  claims: 36,
  answerSamples: 54,
} as const;

/** 按议题 id（`zh-<zhihuId>`）取种子；找不到返回 null，不抛错 */
export function findTreeSeed(id: string): DebateTreeSeed | null {
  return DEBATE_TREE_SEEDS.find((seed) => seed.id === id) ?? null;
}
