/**
 * 事件库（种子数据）
 *
 * 只放**准入所需的最小素材**：事件头 + 角色位 + 外部事件节拍 + 原作轨迹。
 * **不预置选项、处境与结局**——它们由 Host 在运行时生成（见 event-replay-PLAN.md §3.1）。
 *
 * ## 三条准入底线（`validateEventReplay` 会逐条校验，不满足不许入库）
 *
 * 1. 只收**公共讨论充分**的事件（知乎有公开问题与讨论）；
 * 2. 涉及**灾难、伤亡的事件不入库**（推演 ≠ 消费苦难）；
 * 3. 改编规则：人物化名、机构模糊、时间粒度到月；
 *    2026-09-13 新增最硬一条——**不扮演可识别的真实个人**，角色位一律是虚构位置。
 *
 * ## ⚠️ 审核状态：待人工核验（务必保留这段说明）
 *
 * 本文件的三例事件由 **AI 起草**，`canon[].sources[].url` 全部指向**真实存在**的知乎页面
 * （无 `#` 占位、无构造链接），来源摘要的完整度则不一致：
 *
 * - `career-crossroads`：来源含**已抓取的真实回答正文摘录**，可直接核验；
 * - `steady-trap` / `major-or-passion`：来源为真实公开提问，`excerpt` 为该问题的真实标题
 *   （仅陈述"现实中有这场公开讨论"），**尚未逐条摘录回答正文**。
 *
 * 因此 `header.admission.reviewedAt` 目前写的是**起草日期**，代表"这批数据已成形"，
 * **不代表人工准入通过**。在用户逐例核验并确认前，不得对外宣称"真实事件入库"，
 * 也不得把 `canon` 当作已审核史实展示。核验清单：来源可访问 · 无伤亡 · 化名与模糊化到位 ·
 * 角色位不等于真实个人。
 */

import type { EventReplay } from "../types/eventReplay";

/** 起草日期；人工核验通过后请改为实际签署日期。 */
const DRAFTED_AT = "2026-09-14";

/**
 * 供界面/文档引用的一句话状态，避免把"已起草"误读成"已审核"。
 */
export const EVENT_LIBRARY_REVIEW_NOTE =
  "三例事件为 AI 起草、待人工准入核验：来源链接真实可访，回答正文摘录仅第一例完成。";

export const eventReplays: EventReplay[] = [
  {
    header: {
      id: "career-crossroads",
      title: "一次职业迁移",
      background:
        "2023 年，一位在苏北任教二十年的骨干教师收到苏南一所新建学校的邀请：对方给出编制、安家补贴与子女随迁就读的初步条件，但要求在本学期结束前答复。当事人的孩子正处在升学节点上，家里对搬迁意见不一。",
      adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
      admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: DRAFTED_AT },
      endingCondition: { kind: "actCount", actCount: 3 },
    },
    positions: [
      {
        id: "teacher",
        name: "当事人 · 陈老师（化名）",
        role: "任教二十年的骨干教师",
        stake: "职业上升空间与孩子的教育机会",
        visible: ["聘用条件：编制、安家补贴、子女随迁就读", "答复期限：本学期结束前", "孩子正处于升学节点", "家里对搬迁意见不一"],
        resources: "二十年教龄与业内口碑",
        canDo: ["协商条件", "接受邀请", "放弃邀请"],
        relations: [
          { to: "partner", attitude: 20 },
          { to: "school", attitude: 10 },
        ],
      },
      {
        id: "partner",
        name: "伴侣 · 林女士（化名）",
        role: "当事人的伴侣，自己的职业需要连续性",
        stake: "家庭稳定与自己的职业连续性",
        visible: ["家庭收支状况", "孩子正处于升学节点", "搬迁会打断自己的职业连续性", "配偶（当事人）尚未表态"],
        resources: "自己的工作与家庭否决权",
        canDo: ["沟通", "提出条件", "拒绝搬迁"],
        relations: [
          { to: "teacher", attitude: 25 },
          { to: "school", attitude: 0 },
        ],
      },
      {
        id: "school",
        name: "邀请方 · 新建校负责人（化名）",
        role: "新建校负责招聘的负责人",
        stake: "开学前配齐骨干师资",
        visible: ["开学前的师资缺口", "可用的编制与安家补贴额度", "本地随迁入学政策", "招聘进度"],
        resources: "编制与安家补贴的裁量空间",
        canDo: ["加码条件", "设定期限", "撤回邀请"],
        relations: [
          { to: "teacher", attitude: 15 },
          { to: "partner", attitude: 0 },
        ],
      },
    ],
    acts: [
      {
        index: 0,
        month: "2023-03",
        text: "苏南一所新建校通过旧同事转来邀请，给出编制、安家补贴与子女随迁就读的初步条件，要求在本学期结束前答复。",
      },
      {
        index: 1,
        month: "2023-05",
        text: "家庭内部对搬迁意见不一致，孩子的升学报名节点临近；邀请方再次询问答复时间。",
      },
      {
        index: 2,
        month: "2023-06",
        text: "邀请方要求给出最终答复；原校同时提出留任并带毕业班的安排。",
      },
    ],
    canon: [
      {
        actIndex: 0,
        month: "2023-03",
        development:
          "公开讨论中，两地教育资源差距是这类抉择的主要推力：同级别可选的优质学校数量差距明显，且迁入地的随迁入学与语言门槛相对更低。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2038884733304697602",
            excerpt: "公开提问：跨市调动任教的机会值不值得去（问题下有大量同类经历者回答）",
            reviewedAt: DRAFTED_AT,
          },
          {
            url: "https://www.zhihu.com/question/2038884733304697602/answer/2066276538488827942",
            excerpt:
              "如果是为了孩子，那其实是该去的……落在同级别的好学校只有区区几所可选。而另一侧依然有具备顶尖水平的学校存在。何况迁入地是移民城市，本土方言的门槛几乎没有。",
            reviewedAt: DRAFTED_AT,
          },
          {
            url: "https://www.zhihu.com/question/2038884733304697602/answer/2038995093496001975",
            excerpt:
              "一定要去，你去考就是已经动心了。如果不去，以后的时间你可能后悔，甚至不知不觉表现在生活中。孩子应该可以带到你新工作的学校读书。",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
      {
        actIndex: 1,
        month: "2023-05",
        development:
          "现实中，随迁的主要约束集中在孩子的升学节点与配偶的职业连续性上；公开讨论反复提到两地普通高中录取率的差距，以及配偶就业中断的代价。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2038884733304697602/answer/2039445066603827526",
            excerpt:
              "学校，在大城市，中考普通高中录取率到百分之七十，还有无数私立高中；县里可能也就百分之五十五还不到。那多出来的百分之十，就可能决定孩子是去普通高中，还是去技校。",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
      {
        actIndex: 2,
        month: "2023-06",
        development:
          "公开讨论中，多数回答主张在答复期限前先落实可核实条件（编制、补贴、随迁资格与配偶就业），再决定搬迁时点；这一点在不同回答里高度一致。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2038884733304697602",
            excerpt: "公开提问下多条回答共同强调：先把可核实的条件谈清，再谈搬不搬",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
    ],
  },

  {
    header: {
      id: "steady-trap",
      title: "稳定但没有成长",
      background:
        "2024 年，一位在事业单位工作六年的员工，岗位职责六年几乎没变：收入可预期，但能学到的越来越少。同期入职的人陆续转岗或离开。此时旧同事介绍的一家小公司递来岗位意向，薪资结构里有一半是期权，要求一个月内答复。",
      adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
      admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: DRAFTED_AT },
      endingCondition: { kind: "actCount", actCount: 3 },
    },
    positions: [
      {
        id: "insider",
        name: "当事人 · 六年资历的员工（化名）",
        role: "事业单位六年资历的员工",
        stake: "确定性的现金流与技能不贬值",
        visible: ["自己的岗位职责六年几乎没变", "收入可预期但技能增长停滞", "同期入职者陆续转岗或离开"],
        resources: "六年资历与内部人脉",
        canDo: ["争取内部转岗", "接受外部机会", "维持现状"],
        relations: [
          { to: "newco", attitude: 10 },
          { to: "unit", attitude: 30 },
        ],
      },
      {
        id: "unit",
        name: "所在单位 · 直属负责人（化名）",
        role: "当事人所在单位的直属负责人",
        stake: "新业务线开得起来、老组不出事",
        visible: ["新一轮岗位调整方案", "本组可能被合并的意向", "可动用的转岗名额"],
        resources: "转岗名额与绩效评价权",
        canDo: ["给转岗机会", "压任务留人", "维持现状"],
        relations: [
          { to: "insider", attitude: 35 },
          { to: "newco", attitude: -10 },
        ],
      },
      {
        id: "newco",
        name: "外部机会方 · 小公司负责人（化名）",
        role: "递出岗位意向的小公司负责人",
        stake: "招到能独立扛事的人",
        visible: ["岗位职责与团队规模", "融资进度不确定", "薪资结构中一半是期权", "答复期限为一个月"],
        resources: "薪资与期权的裁量空间",
        canDo: ["给出条件", "设定期限", "撤回机会"],
        relations: [
          { to: "insider", attitude: 15 },
          { to: "unit", attitude: -10 },
        ],
      },
    ],
    acts: [
      {
        index: 0,
        month: "2024-04",
        text: "旧同事介绍的小公司给出岗位意向：薪资一半是期权，要求一个月内答复。",
      },
      {
        index: 1,
        month: "2024-06",
        text: "单位启动新一轮岗位调整，当事人所在的组可能被合并；小公司那边传出融资进度不确定的消息。",
      },
      {
        index: 2,
        month: "2024-08",
        text: "小公司要求最终答复；单位给出转岗到新业务线的机会，但需要重新证明自己。",
      },
    ],
    canon: [
      {
        actIndex: 0,
        month: "2024-04",
        development:
          "现实中的公开讨论把这类岗位的核心矛盾表述为「用确定性换成长空间」：留下来保的是可预期的现金流与晋升节奏，走出去赌的是技能不贬值。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2080587236807128910",
            excerpt: "公开提问：如果一份工作稳定但没有成长，该不该为了确定性一直做下去",
            reviewedAt: DRAFTED_AT,
          },
          {
            url: "https://www.zhihu.com/question/2080587236807128910/answer/2080589816970884859",
            excerpt: "该问题下的公开回答（真实页面，摘要待逐条摘录）",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
      {
        actIndex: 1,
        month: "2024-06",
        development:
          "现实中，体制内岗位调整通常先内部公示再落地，期间人员去向存在不确定性；而小规模公司的融资进度本身高度依赖外部环境。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2080587236807128910",
            excerpt: "公开提问及其回答讨论的场景：稳定岗与成长期权之间的取舍",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
      {
        actIndex: 2,
        month: "2024-08",
        development:
          "现实中，转岗新业务线通常伴随考核标准重置；外部机会方在答复期限临近时往往给出更明确的现金与股权结构。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2080587236807128910",
            excerpt: "公开提问及其回答讨论的场景：答复期限与条件谈判",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
    ],
  },

  {
    header: {
      id: "major-or-passion",
      title: "就业还是热爱",
      background:
        "2025 年，一名应届毕业生同时拿到两份机会：一份是稳定单位的对口岗位，收入可预期、节奏规律；另一份是小团队的内容创作岗位，收入低、项目前景不明，但方向是他真正想做的。两边都要求两周内答复。",
      adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
      admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: DRAFTED_AT },
      endingCondition: { kind: "actCount", actCount: 3 },
    },
    positions: [
      {
        id: "graduate",
        name: "当事人 · 应届毕业生（化名）",
        role: "同时拿到两份机会的应届毕业生",
        stake: "起步方向与往后的可选项",
        visible: ["稳定岗位的条件与节奏", "内容岗位的收入与项目前景", "家人倾向稳定岗位", "两方都要求两周内答复"],
        resources: "应届身份与可迁移的实习经历",
        canDo: ["接受稳定岗位", "接受内容岗位", "两边拖延"],
        relations: [
          { to: "family", attitude: 30 },
          { to: "studio", attitude: 20 },
        ],
      },
      {
        id: "family",
        name: "家人 · 出资方（化名）",
        role: "为当事人提供过渡期支持的家庭出资方",
        stake: "孩子先站稳，再谈理想",
        visible: ["家庭收支状况", "两份机会的收入差距", "自己能提供的过渡期支持额度"],
        resources: "过渡期的生活费支持",
        canDo: ["给过渡期支持", "提出条件", "撤回过桥资金"],
        relations: [
          { to: "graduate", attitude: 40 },
          { to: "studio", attitude: -20 },
        ],
      },
      {
        id: "studio",
        name: "内容团队 · 负责人（化名）",
        role: "预算有限的内容团队负责人",
        stake: "用有限预算招到真的想做的人",
        visible: ["项目上线时间已推迟", "可用的人头预算", "团队当前规模"],
        resources: "合作方式与人头预算的裁量空间",
        canDo: ["改为兼职合作", "给出分成方案", "撤回机会"],
        relations: [
          { to: "graduate", attitude: 25 },
          { to: "family", attitude: -5 },
        ],
      },
    ],
    acts: [
      {
        index: 0,
        month: "2025-05",
        text: "两份机会同时下达，都要求两周内答复；稳定单位那边催签三方协议。",
      },
      {
        index: 1,
        month: "2025-07",
        text: "家人明确倾向于稳定岗位；内容团队的项目上线时间推迟，收入更不确定。",
      },
      {
        index: 2,
        month: "2025-09",
        text: "稳定单位要求报到；内容团队提出先兼职合作三个月的替代方案。",
      },
    ],
    canon: [
      {
        actIndex: 0,
        month: "2025-05",
        development:
          "现实中，这类选择的公开讨论通常不把它当成「理想与现实」的二选一，而更关注第一步是否保留可选项（技能与行业通道）。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2071229337567867394",
            excerpt: "公开提问：该不该为了「好的就业」，而放弃「热爱」",
            reviewedAt: DRAFTED_AT,
          },
          {
            url: "https://www.zhihu.com/question/2071229337567867394/answer/2080617986206054342",
            excerpt: "该问题下的公开回答（真实页面，摘要待逐条摘录）",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
      {
        actIndex: 1,
        month: "2025-07",
        development:
          "现实中，内容类小团队的项目排期与预算高度依赖外部环境，上线时间顺延并不罕见；家庭出资方的态度往往取决于过渡期是否需要持续补贴。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2071229337567867394",
            excerpt: "公开提问及其回答讨论的场景：稳定岗位与热爱方向之间的取舍",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
      {
        actIndex: 2,
        month: "2025-09",
        development:
          "现实中，小团队常用「先兼职合作、再谈全职」来降低双方的试错成本；稳定单位则普遍设有报到截止时间。",
        sources: [
          {
            url: "https://www.zhihu.com/question/2071229337567867394",
            excerpt: "公开提问及其回答讨论的场景：起步方向与试错成本",
            reviewedAt: DRAFTED_AT,
          },
        ],
      },
    ],
  },
];

export function findEventReplay(eventId: string | null): EventReplay | null {
  if (!eventId) return null;
  return eventReplays.find((item) => item.header.id === eventId) ?? null;
}
