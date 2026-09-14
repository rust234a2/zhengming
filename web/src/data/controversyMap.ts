/**
 * 跨议题争议地图数据 —— 自动生成，请勿手工编辑。
 * 生成脚本：zhengming 仓库 research/controversy-map/build-ts.mjs
 *
 * 数据来源：zhihu-cli search zhihu 真实检索（5 次调用，覆盖 5 个检索簇）
 *          → LLM 提炼论点与立场 → LLM 跨议题语义挖掘 → 主张簇归一
 * 生成时间：2026-09-14T07:46:03.844Z
 */

import type { ControversyMapData } from "../types/map";

export const CONTROVERSY_MAP: ControversyMapData = {
  "generatedAt": "2026-09-14T07:46:03.844Z",
  "source": "发现管线 v2：lexicon v2 × 49 query 浅检索 → 门禁 → 完整标题深挖 → LLM 提炼/比对（全部真实检索）",
  "stats": {
    "topics": 106,
    "claims": 244,
    "clusters": 39,
    "edges": 698,
    "bridge": 177,
    "member": 185,
    "rebuts": 92,
    "contains": 244
  },
  "nodes": [
    {
      "id": "zh-1972252087044796716",
      "kind": "topic",
      "label": "AI写程序的能力毋庸置疑很强大,为何没有取代程序员…",
      "fullLabel": "AI写程序的能力毋庸置疑很强大,为何没有取代程序员,是哪个环节的原因?",
      "url": "https://www.zhihu.com/question/1972252087044796716",
      "weight": 5
    },
    {
      "id": "zh-6947040839",
      "kind": "topic",
      "label": "AI有没有可能在十年内完全替代教师这个行业?",
      "fullLabel": "AI有没有可能在十年内完全替代教师这个行业?",
      "url": "https://www.zhihu.com/question/6947040839",
      "weight": 5
    },
    {
      "id": "zh-2069490435995832397",
      "kind": "topic",
      "label": "如果 AI 能给出很多健康答案,医生真正不可替代的…",
      "fullLabel": "如果 AI 能给出很多健康答案,医生真正不可替代的地方是什么?",
      "url": "https://www.zhihu.com/question/2069490435995832397",
      "weight": 6
    },
    {
      "id": "zh-2077824745589028563",
      "kind": "topic",
      "label": "如果人人都可以通过 AI 写代码,程序员还需要存在…",
      "fullLabel": "如果人人都可以通过 AI 写代码,程序员还需要存在吗?未来的程序员的工作会是什么?",
      "url": "https://www.zhihu.com/question/2077824745589028563",
      "weight": 5
    },
    {
      "id": "zh-1903459479011432303",
      "kind": "topic",
      "label": "有了 AI 技术,以后画画还值得专业学习吗?AI …",
      "fullLabel": "有了 AI 技术,以后画画还值得专业学习吗?AI 是否能取代画家?",
      "url": "https://www.zhihu.com/question/1903459479011432303",
      "weight": 4
    },
    {
      "id": "zh-2072979072867747736",
      "kind": "topic",
      "label": "大批 AI 博主集中停更,背后真实原因是什么,AI…",
      "fullLabel": "大批 AI 博主集中停更,背后真实原因是什么,AI 内容赛道接下来会如何发展?",
      "url": "https://www.zhihu.com/question/2072979072867747736",
      "weight": 7
    },
    {
      "id": "zh-2016889470092272129",
      "kind": "topic",
      "label": "AI 是抢走了我们的工作,还是给了我们新的可能?",
      "fullLabel": "AI 是抢走了我们的工作,还是给了我们新的可能?",
      "url": "https://www.zhihu.com/question/2016889470092272129",
      "weight": 8
    },
    {
      "id": "zh-14461028376",
      "kind": "topic",
      "label": "ai 已经能编出很完美的程序,程序员这个行业以后是…",
      "fullLabel": "ai 已经能编出很完美的程序,程序员这个行业以后是不是会消失?",
      "url": "https://www.zhihu.com/question/14461028376",
      "weight": 6
    },
    {
      "id": "zh-2038411932424725710",
      "kind": "topic",
      "label": "ai大概还要多久就可以取代程序员了?",
      "fullLabel": "ai大概还要多久就可以取代程序员了?",
      "url": "https://www.zhihu.com/question/2038411932424725710",
      "weight": 5
    },
    {
      "id": "zh-2042985698823861883",
      "kind": "topic",
      "label": "普通人选什么专业最不容易被 AI 替代?",
      "fullLabel": "普通人选什么专业最不容易被 AI 替代?",
      "url": "https://www.zhihu.com/question/2042985698823861883",
      "weight": 8
    },
    {
      "id": "zh-7712128783",
      "kind": "topic",
      "label": "为什么我觉得AI绘画完全代替不了画师?",
      "fullLabel": "为什么我觉得AI绘画完全代替不了画师?",
      "url": "https://www.zhihu.com/question/7712128783",
      "weight": 8
    },
    {
      "id": "zh-661199186",
      "kind": "topic",
      "label": "AI 未来会部分或完全取代中小学教师吗?",
      "fullLabel": "AI 未来会部分或完全取代中小学教师吗?",
      "url": "https://www.zhihu.com/question/661199186",
      "weight": 3
    },
    {
      "id": "zh-635329472",
      "kind": "topic",
      "label": "AI会取代大量自媒体吗?",
      "fullLabel": "AI会取代大量自媒体吗?",
      "url": "https://www.zhihu.com/question/635329472",
      "weight": 3
    },
    {
      "id": "zh-452243069",
      "kind": "topic",
      "label": "为什么律师不会完全被AI取代?",
      "fullLabel": "为什么律师不会完全被AI取代?",
      "url": "https://www.zhihu.com/question/452243069",
      "weight": 3
    },
    {
      "id": "zh-659369541",
      "kind": "topic",
      "label": "为什么很多律师不承认法律是受人工智能影响最大的行业…",
      "fullLabel": "为什么很多律师不承认法律是受人工智能影响最大的行业之一?",
      "url": "https://www.zhihu.com/question/659369541",
      "weight": 5
    },
    {
      "id": "zh-2052608342816715544",
      "kind": "topic",
      "label": "为什么总有人嘴硬说程序员不会被 AI 替代?",
      "fullLabel": "为什么总有人嘴硬说程序员不会被 AI 替代?",
      "url": "https://www.zhihu.com/question/2052608342816715544",
      "weight": 3
    },
    {
      "id": "zh-2072683028829009863",
      "kind": "topic",
      "label": "世界经济论坛预测AI等因素将促进 1.7 亿岗位新…",
      "fullLabel": "世界经济论坛预测AI等因素将促进 1.7 亿岗位新增,有啥依据吗?为啥程序员、客服成了被替换的重灾区?",
      "url": "https://www.zhihu.com/question/2072683028829009863",
      "weight": 4
    },
    {
      "id": "zh-2030670762495972103",
      "kind": "topic",
      "label": "会计怎样才能不被AI取代?",
      "fullLabel": "会计怎样才能不被AI取代?",
      "url": "https://www.zhihu.com/question/2030670762495972103",
      "weight": 3
    },
    {
      "id": "zh-2048163712138211470",
      "kind": "topic",
      "label": "AI 时代来临,会计职业是否还有前途?",
      "fullLabel": "AI 时代来临,会计职业是否还有前途?",
      "url": "https://www.zhihu.com/question/2048163712138211470",
      "weight": 2
    },
    {
      "id": "zh-2014268583652320290",
      "kind": "topic",
      "label": "中国传媒大学砍掉翻译、摄影等 16 个本科专业,怎…",
      "fullLabel": "中国传媒大学砍掉翻译、摄影等 16 个本科专业,怎样看待这一变化?这些专业真的能被 AI 替代吗?",
      "url": "https://www.zhihu.com/question/2014268583652320290",
      "weight": 5
    },
    {
      "id": "zh-661317726",
      "kind": "topic",
      "label": "800万司机恐失业,AI为何先砸底层人的饭碗?",
      "fullLabel": "800万司机恐失业,AI为何先砸底层人的饭碗?",
      "url": "https://www.zhihu.com/question/661317726",
      "weight": 4
    },
    {
      "id": "zh-1892491048032396428",
      "kind": "topic",
      "label": "会计被列入国控专业意味着什么?",
      "fullLabel": "会计被列入国控专业意味着什么?",
      "url": "https://www.zhihu.com/question/1892491048032396428",
      "weight": 5
    },
    {
      "id": "zh-1902746889251721780",
      "kind": "topic",
      "label": "AI绘画,AI设计,AI真的能代替各行各业的设计师…",
      "fullLabel": "AI绘画,AI设计,AI真的能代替各行各业的设计师吗?",
      "url": "https://www.zhihu.com/question/1902746889251721780",
      "weight": 2
    },
    {
      "id": "zh-2017996212544960495",
      "kind": "topic",
      "label": "为什么画师、配音演员都在抵制 AI,程序员却普遍在…",
      "fullLabel": "为什么画师、配音演员都在抵制 AI,程序员却普遍在拥抱 AI?",
      "url": "https://www.zhihu.com/question/2017996212544960495",
      "weight": 4
    },
    {
      "id": "zh-1931619901778391593",
      "kind": "topic",
      "label": "编程大神 DHH 谈 AI 写代码称「掌握编程的,…",
      "fullLabel": "编程大神 DHH 谈 AI 写代码称「掌握编程的,永远是动手写的人」,AI 取代人类编程的边界在哪里?",
      "url": "https://www.zhihu.com/question/1931619901778391593",
      "weight": 6
    },
    {
      "id": "zh-594432719",
      "kind": "topic",
      "label": "大家觉得ai绘画会替代画师吗?",
      "fullLabel": "大家觉得ai绘画会替代画师吗?",
      "url": "https://www.zhihu.com/question/594432719",
      "weight": 1
    },
    {
      "id": "zh-565119295",
      "kind": "topic",
      "label": "谁能给我一个ai现在无法替代画师的理由?",
      "fullLabel": "谁能给我一个ai现在无法替代画师的理由?",
      "url": "https://www.zhihu.com/question/565119295",
      "weight": 3
    },
    {
      "id": "zh-2061136311206073648",
      "kind": "topic",
      "label": "为什么才短短两三年,AI就已经泛滥成灾,到了人人喊…",
      "fullLabel": "为什么才短短两三年,AI就已经泛滥成灾,到了人人喊打、人嫌狗厌的境地?",
      "url": "https://www.zhihu.com/question/2061136311206073648",
      "weight": 5
    },
    {
      "id": "zh-284641712",
      "kind": "topic",
      "label": "人工智能翻译机会取代传统的人工翻译吗?",
      "fullLabel": "人工智能翻译机会取代传统的人工翻译吗?",
      "url": "https://www.zhihu.com/question/284641712",
      "weight": 4
    },
    {
      "id": "zh-2016930184062789503",
      "kind": "topic",
      "label": "AI 会让年轻人的机会变多还是变少?",
      "fullLabel": "AI 会让年轻人的机会变多还是变少?",
      "url": "https://www.zhihu.com/question/2016930184062789503",
      "weight": 4
    },
    {
      "id": "zh-2077075555535605889",
      "kind": "topic",
      "label": "在这个ai盛行的时代,会计专业的学生还可以找到好工…",
      "fullLabel": "在这个ai盛行的时代,会计专业的学生还可以找到好工作吗?",
      "url": "https://www.zhihu.com/question/2077075555535605889",
      "weight": 1
    },
    {
      "id": "zh-2049934861817869718",
      "kind": "topic",
      "label": "AI会完全取代人类自媒体创作者吗?",
      "fullLabel": "AI会完全取代人类自媒体创作者吗?",
      "url": "https://www.zhihu.com/question/2049934861817869718",
      "weight": 1
    },
    {
      "id": "zh-2035134530596683934",
      "kind": "topic",
      "label": "2026 计算机科学专业还值得报考吗?",
      "fullLabel": "2026 计算机科学专业还值得报考吗?",
      "url": "https://www.zhihu.com/question/2035134530596683934",
      "weight": 3
    },
    {
      "id": "zh-1941132414425495417",
      "kind": "topic",
      "label": "为什么绘圈对AI绘画痛恶欲绝,但其他圈子对AI创作…",
      "fullLabel": "为什么绘圈对AI绘画痛恶欲绝,但其他圈子对AI创作的态度就比较温和?",
      "url": "https://www.zhihu.com/question/1941132414425495417",
      "weight": 3
    },
    {
      "id": "zh-2053791549629129105",
      "kind": "topic",
      "label": "AI在医疗领域能否完全取代医生?",
      "fullLabel": "AI在医疗领域能否完全取代医生?",
      "url": "https://www.zhihu.com/question/2053791549629129105",
      "weight": 2
    },
    {
      "id": "zh-1951817967785456234",
      "kind": "topic",
      "label": "AI 已经/即将摧毁哪些行业?",
      "fullLabel": "AI 已经/即将摧毁哪些行业?",
      "url": "https://www.zhihu.com/question/1951817967785456234",
      "weight": 5
    },
    {
      "id": "zh-1992678011498100641",
      "kind": "topic",
      "label": "会计专业为什么会被吐槽为「人工智能都玩不转的知名天…",
      "fullLabel": "会计专业为什么会被吐槽为「人工智能都玩不转的知名天坑专业」?",
      "url": "https://www.zhihu.com/question/1992678011498100641",
      "weight": 1
    },
    {
      "id": "zh-2067543311850778736",
      "kind": "topic",
      "label": "AI会完全取代码农的工作么?",
      "fullLabel": "AI会完全取代码农的工作么?",
      "url": "https://www.zhihu.com/question/2067543311850778736",
      "weight": 3
    },
    {
      "id": "zh-1923383858025433047",
      "kind": "topic",
      "label": "现在学会计已经没有前途了吗?",
      "fullLabel": "现在学会计已经没有前途了吗?",
      "url": "https://www.zhihu.com/question/1923383858025433047",
      "weight": 2
    },
    {
      "id": "zh-604703607",
      "kind": "topic",
      "label": "AI 入侵设计领域,会完全替代设计师吗?",
      "fullLabel": "AI 入侵设计领域,会完全替代设计师吗?",
      "url": "https://www.zhihu.com/question/604703607",
      "weight": 1
    },
    {
      "id": "zh-593275984",
      "kind": "topic",
      "label": "程序员未来是不是会大量失业?",
      "fullLabel": "程序员未来是不是会大量失业?",
      "url": "https://www.zhihu.com/question/593275984",
      "weight": 1
    },
    {
      "id": "zh-568804205",
      "kind": "topic",
      "label": "到现在为止,AI绘画让多少画师失业了?未来又会让多…",
      "fullLabel": "到现在为止,AI绘画让多少画师失业了?未来又会让多少画师失业?",
      "url": "https://www.zhihu.com/question/568804205",
      "weight": 2
    },
    {
      "id": "zh-2012530352657282469",
      "kind": "topic",
      "label": "AI对画师的斩杀线大概在哪个位置?",
      "fullLabel": "AI对画师的斩杀线大概在哪个位置?",
      "url": "https://www.zhihu.com/question/2012530352657282469",
      "weight": 2
    },
    {
      "id": "zh-2020545061792792654",
      "kind": "topic",
      "label": "医生会被AI取代吗?《实测5款AI医生:一个把我看…",
      "fullLabel": "医生会被AI取代吗?《实测5款AI医生:一个把我看哭了,一个差点把我“送走”!》?",
      "url": "https://www.zhihu.com/question/2020545061792792654",
      "weight": 1
    },
    {
      "id": "zh-2066111436082897266",
      "kind": "topic",
      "label": "AI来了,大量医生失业了,这样真的对吗?",
      "fullLabel": "AI来了,大量医生失业了,这样真的对吗?",
      "url": "https://www.zhihu.com/question/2066111436082897266",
      "weight": 1
    },
    {
      "id": "zh-2061407637246305107",
      "kind": "topic",
      "label": "随着 AI 和智能医疗发展,未来的护士工作会发生哪…",
      "fullLabel": "随着 AI 和智能医疗发展,未来的护士工作会发生哪些改变?",
      "url": "https://www.zhihu.com/question/2061407637246305107",
      "weight": 1
    },
    {
      "id": "zh-661271928",
      "kind": "topic",
      "label": "AI该不该抢司机、外卖哥和快递哥等普通民众的饭碗??",
      "fullLabel": "AI该不该抢司机、外卖哥和快递哥等普通民众的饭碗??",
      "url": "https://www.zhihu.com/question/661271928",
      "weight": 3
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
      "id": "zh-2066911604235571824",
      "kind": "topic",
      "label": "2026年了,大学生还有必要学编程吗,AI会不会让…",
      "fullLabel": "2026年了,大学生还有必要学编程吗,AI会不会让程序员失业?",
      "url": "https://www.zhihu.com/question/2066911604235571824",
      "weight": 2
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
      "id": "zh-1977074341968574068",
      "kind": "topic",
      "label": "和 AI 相比,我们作为人类的核心竞争力是什么?",
      "fullLabel": "和 AI 相比,我们作为人类的核心竞争力是什么?",
      "url": "https://www.zhihu.com/question/1977074341968574068",
      "weight": 3
    },
    {
      "id": "zh-1972861967086666313",
      "kind": "topic",
      "label": "为什么现在画师几乎要被ai替代,而程序员行业不仅没…",
      "fullLabel": "为什么现在画师几乎要被ai替代,而程序员行业不仅没被替代,反而看起来更繁荣了?",
      "url": "https://www.zhihu.com/question/1972861967086666313",
      "weight": 3
    },
    {
      "id": "zh-1393954552",
      "kind": "topic",
      "label": "设计师存在的意义到底是什么?",
      "fullLabel": "设计师存在的意义到底是什么?",
      "url": "https://www.zhihu.com/question/1393954552",
      "weight": 1
    },
    {
      "id": "zh-1953096742175224404",
      "kind": "topic",
      "label": "做技术的人,护城河到底在哪里?",
      "fullLabel": "做技术的人,护城河到底在哪里?",
      "url": "https://www.zhihu.com/question/1953096742175224404",
      "weight": 3
    },
    {
      "id": "zh-10241549244",
      "kind": "topic",
      "label": "在教育领域,AI能否完全替代教师的角色?如果不能,…",
      "fullLabel": "在教育领域,AI能否完全替代教师的角色?如果不能,AI可以扮演什么角色?",
      "url": "https://www.zhihu.com/question/10241549244",
      "weight": 1
    },
    {
      "id": "zh-11373689229",
      "kind": "topic",
      "label": "医院的医疗设备能取代医生吗?",
      "fullLabel": "医院的医疗设备能取代医生吗?",
      "url": "https://www.zhihu.com/question/11373689229",
      "weight": 1
    },
    {
      "id": "zh-612845174",
      "kind": "topic",
      "label": "多款医疗 AI 已问世,能否打败人类医生?",
      "fullLabel": "多款医疗 AI 已问世,能否打败人类医生?",
      "url": "https://www.zhihu.com/question/612845174",
      "weight": 1
    },
    {
      "id": "zh-12085658931",
      "kind": "topic",
      "label": "AI医生在三甲医院辅助诊疗,病情评估更快更准,3-…",
      "fullLabel": "AI医生在三甲医院辅助诊疗,病情评估更快更准,3-5分钟给出诊断报告,AI未来会取代人类医生吗?",
      "url": "https://www.zhihu.com/question/12085658931",
      "weight": 1
    },
    {
      "id": "zh-1953365116692205864",
      "kind": "topic",
      "label": "有人说人工智能抢走了普通人的工作是这样吗?",
      "fullLabel": "有人说人工智能抢走了普通人的工作是这样吗?",
      "url": "https://www.zhihu.com/question/1953365116692205864",
      "weight": 1
    },
    {
      "id": "zh-496888426",
      "kind": "topic",
      "label": "AI智能客服真的智能吗?未来是否真的能替代人工客服?",
      "fullLabel": "AI智能客服真的智能吗?未来是否真的能替代人工客服?",
      "url": "https://www.zhihu.com/question/496888426",
      "weight": 1
    },
    {
      "id": "zh-2058583113865892735",
      "kind": "topic",
      "label": "在面临ai冲击时,企业内的财务和法务岗是变得更容易…",
      "fullLabel": "在面临ai冲击时,企业内的财务和法务岗是变得更容易被取代,还是更具有不可替代性?",
      "url": "https://www.zhihu.com/question/2058583113865892735",
      "weight": 1
    },
    {
      "id": "zh-2073408615956985818",
      "kind": "topic",
      "label": "AI时代早已来临,财务人员如何应对AI冲击?",
      "fullLabel": "AI时代早已来临,财务人员如何应对AI冲击?",
      "url": "https://www.zhihu.com/question/2073408615956985818",
      "weight": 1
    },
    {
      "id": "zh-1914986510035452070",
      "kind": "topic",
      "label": "师范生饱和,出生人口下降,师范类专业是不是不建议报…",
      "fullLabel": "师范生饱和,出生人口下降,师范类专业是不是不建议报了?",
      "url": "https://www.zhihu.com/question/1914986510035452070",
      "weight": 3
    },
    {
      "id": "zh-2039116530319873634",
      "kind": "topic",
      "label": "会计职业是否正在被淘汰?",
      "fullLabel": "会计职业是否正在被淘汰?",
      "url": "https://www.zhihu.com/question/2039116530319873634",
      "weight": 1
    },
    {
      "id": "zh-2081685100555677809",
      "kind": "topic",
      "label": "AI时代下,学习一门编程语言是否还有意义?",
      "fullLabel": "AI时代下,学习一门编程语言是否还有意义?",
      "url": "https://www.zhihu.com/question/2081685100555677809",
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
      "id": "zh-2076694461229409490",
      "kind": "topic",
      "label": "AI 写的代码还需要 Review 吗?只看 Sp…",
      "fullLabel": "AI 写的代码还需要 Review 吗?只看 Spec + Harness 验收是否足够?",
      "url": "https://www.zhihu.com/question/2076694461229409490",
      "weight": 1
    },
    {
      "id": "zh-581137960",
      "kind": "topic",
      "label": "网传 OpenAI 招外包训练 ChatGPT 取…",
      "fullLabel": "网传 OpenAI 招外包训练 ChatGPT 取代码农,会成功吗?",
      "url": "https://www.zhihu.com/question/581137960",
      "weight": 2
    },
    {
      "id": "zh-13655203379",
      "kind": "topic",
      "label": "设计师/程序员/文案等职业会被AI取代吗?现阶段如…",
      "fullLabel": "设计师/程序员/文案等职业会被AI取代吗?现阶段如何用AI工具让自己「不可替代」?",
      "url": "https://www.zhihu.com/question/13655203379",
      "weight": 2
    },
    {
      "id": "zh-1949784266633377083",
      "kind": "topic",
      "label": "随着AI的出现,翻译这个行业是不是凉的透透的了?",
      "fullLabel": "随着AI的出现,翻译这个行业是不是凉的透透的了?",
      "url": "https://www.zhihu.com/question/1949784266633377083",
      "weight": 1
    },
    {
      "id": "zh-2056781761565159896",
      "kind": "topic",
      "label": "AI 现在写代码这么猛,咱程序员的核心竞争力还剩什…",
      "fullLabel": "AI 现在写代码这么猛,咱程序员的核心竞争力还剩什么?",
      "url": "https://www.zhihu.com/question/2056781761565159896",
      "weight": 2
    },
    {
      "id": "zh-1984265501115958721",
      "kind": "topic",
      "label": "现在AI编程这么厉害,还有必要深入学习编程吗?",
      "fullLabel": "现在AI编程这么厉害,还有必要深入学习编程吗?",
      "url": "https://www.zhihu.com/question/1984265501115958721",
      "weight": 2
    },
    {
      "id": "zh-2059300946514023724",
      "kind": "topic",
      "label": "如果 AI 以后能自己学习、自己写代码、自己优化模…",
      "fullLabel": "如果 AI 以后能自己学习、自己写代码、自己优化模型,普通人还有必要学编程吗?",
      "url": "https://www.zhihu.com/question/2059300946514023724",
      "weight": 2
    },
    {
      "id": "zh-11507128017",
      "kind": "topic",
      "label": "DeepSeek 会让医生失业吗?",
      "fullLabel": "DeepSeek 会让医生失业吗?",
      "url": "https://www.zhihu.com/question/11507128017",
      "weight": 1
    },
    {
      "id": "zh-2019355746328932969",
      "kind": "topic",
      "label": "人工智能会取代哪些岗位?",
      "fullLabel": "人工智能会取代哪些岗位?",
      "url": "https://www.zhihu.com/question/2019355746328932969",
      "weight": 2
    },
    {
      "id": "zh-637094806",
      "kind": "topic",
      "label": "现在法学专业还有前途吗?",
      "fullLabel": "现在法学专业还有前途吗?",
      "url": "https://www.zhihu.com/question/637094806",
      "weight": 2
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
      "id": "zh-2058927476735321115",
      "kind": "topic",
      "label": "AI到底是在提高效率,还是在抢普通人的饭碗?",
      "fullLabel": "AI到底是在提高效率,还是在抢普通人的饭碗?",
      "url": "https://www.zhihu.com/question/2058927476735321115",
      "weight": 1
    },
    {
      "id": "zh-12872950823",
      "kind": "topic",
      "label": "AI真的可以代替作家、艺术家的创作吗?还是只能代替…",
      "fullLabel": "AI真的可以代替作家、艺术家的创作吗?还是只能代替80%平庸的创作者,将最优秀的艺术家,留给人类?",
      "url": "https://www.zhihu.com/question/12872950823",
      "weight": 1
    },
    {
      "id": "zh-1962444467077358693",
      "kind": "topic",
      "label": "你认为AI编程未来真的会取代程序员吗?",
      "fullLabel": "你认为AI编程未来真的会取代程序员吗?",
      "url": "https://www.zhihu.com/question/1962444467077358693",
      "weight": 1
    },
    {
      "id": "zh-2458716174",
      "kind": "topic",
      "label": "AI 在未来是否会代替编程工作,AI 与编程的关系…",
      "fullLabel": "AI 在未来是否会代替编程工作,AI 与编程的关系将会走向何方?",
      "url": "https://www.zhihu.com/question/2458716174",
      "weight": 1
    },
    {
      "id": "zh-331578036",
      "kind": "topic",
      "label": "为什么说只会码代码的码农没有前途?",
      "fullLabel": "为什么说只会码代码的码农没有前途?",
      "url": "https://www.zhihu.com/question/331578036",
      "weight": 1
    },
    {
      "id": "zh-2011022777268856579",
      "kind": "topic",
      "label": "Block 因AI裁员近50%,码农裁70%,股价…",
      "fullLabel": "Block 因AI裁员近50%,码农裁70%,股价飙涨24%,AI真会取代大部分人的工作吗?",
      "url": "https://www.zhihu.com/question/2011022777268856579",
      "weight": 1
    },
    {
      "id": "zh-597389916",
      "kind": "topic",
      "label": "现在人工智能做插画越来越厉害了,插画会被取代吗?",
      "fullLabel": "现在人工智能做插画越来越厉害了,插画会被取代吗?",
      "url": "https://www.zhihu.com/question/597389916",
      "weight": 1
    },
    {
      "id": "zh-7007890382",
      "kind": "topic",
      "label": "2024 插画行业有没有受到 AI 冲击?AI 未…",
      "fullLabel": "2024 插画行业有没有受到 AI 冲击?AI 未来真的有可能代替插画师吗?",
      "url": "https://www.zhihu.com/question/7007890382",
      "weight": 1
    },
    {
      "id": "zh-1947363304684119143",
      "kind": "topic",
      "label": "ai发展会取代板绘吗,为什么?",
      "fullLabel": "ai发展会取代板绘吗,为什么?",
      "url": "https://www.zhihu.com/question/1947363304684119143",
      "weight": 1
    },
    {
      "id": "zh-7846729236",
      "kind": "topic",
      "label": "Ai已横空出世,你有过一丝丝的担忧吗?",
      "fullLabel": "Ai已横空出世,你有过一丝丝的担忧吗?",
      "url": "https://www.zhihu.com/question/7846729236",
      "weight": 1
    },
    {
      "id": "zh-2080650408108746685",
      "kind": "topic",
      "label": "在大模型和 AI 工具普及的当下,文案策划与内容运…",
      "fullLabel": "在大模型和 AI 工具普及的当下,文案策划与内容运营者应该具备哪些不可替代的核心能力?",
      "url": "https://www.zhihu.com/question/2080650408108746685",
      "weight": 1
    },
    {
      "id": "zh-2016910965510268796",
      "kind": "topic",
      "label": "AI 这么强,翻译和英专生还有用吗?",
      "fullLabel": "AI 这么强,翻译和英专生还有用吗?",
      "url": "https://www.zhihu.com/question/2016910965510268796",
      "weight": 1
    },
    {
      "id": "zh-1929576321450751480",
      "kind": "topic",
      "label": "为什么现在翻译工具明明已经很发达了,还需要翻译员呢?",
      "fullLabel": "为什么现在翻译工具明明已经很发达了,还需要翻译员呢?",
      "url": "https://www.zhihu.com/question/1929576321450751480",
      "weight": 1
    },
    {
      "id": "zh-2070102488355714670",
      "kind": "topic",
      "label": "AI 对工业设计行业影响有多大?",
      "fullLabel": "AI 对工业设计行业影响有多大?",
      "url": "https://www.zhihu.com/question/2070102488355714670",
      "weight": 1
    },
    {
      "id": "zh-2019860124727031327",
      "kind": "topic",
      "label": "现在ai这么发达,有必要花很多时间去学习编程语言,…",
      "fullLabel": "现在ai这么发达,有必要花很多时间去学习编程语言,像Python、Java吗?",
      "url": "https://www.zhihu.com/question/2019860124727031327",
      "weight": 1
    },
    {
      "id": "zh-2009262232622609492",
      "kind": "topic",
      "label": "未来还有必要学习编程吗?",
      "fullLabel": "未来还有必要学习编程吗?",
      "url": "https://www.zhihu.com/question/2009262232622609492",
      "weight": 1
    },
    {
      "id": "zh-2075618575495197313",
      "kind": "topic",
      "label": "在这个 ai 时代学习编程的意义还大吗?",
      "fullLabel": "在这个 ai 时代学习编程的意义还大吗?",
      "url": "https://www.zhihu.com/question/2075618575495197313",
      "weight": 1
    },
    {
      "id": "zh-2011117101591589597",
      "kind": "topic",
      "label": "AI时代还有必要学编程吗?",
      "fullLabel": "AI时代还有必要学编程吗?",
      "url": "https://www.zhihu.com/question/2011117101591589597",
      "weight": 1
    },
    {
      "id": "zh-8345110904",
      "kind": "topic",
      "label": "ai辅助编程,能替代程序员吗?",
      "fullLabel": "ai辅助编程,能替代程序员吗?",
      "url": "https://www.zhihu.com/question/8345110904",
      "weight": 1
    },
    {
      "id": "zh-2022827505304781613",
      "kind": "topic",
      "label": "大学老师的工作会不会被AI取代掉?",
      "fullLabel": "大学老师的工作会不会被AI取代掉?",
      "url": "https://www.zhihu.com/question/2022827505304781613",
      "weight": 1
    },
    {
      "id": "zh-353011782",
      "kind": "topic",
      "label": "未来30年,医生这个职业将如何演化?",
      "fullLabel": "未来30年,医生这个职业将如何演化?",
      "url": "https://www.zhihu.com/question/353011782",
      "weight": 1
    },
    {
      "id": "zh-2081895865921299074",
      "kind": "topic",
      "label": "未来十年哪些技术不容易被AI取代?",
      "fullLabel": "未来十年哪些技术不容易被AI取代?",
      "url": "https://www.zhihu.com/question/2081895865921299074",
      "weight": 1
    },
    {
      "id": "zh-6782975731",
      "kind": "topic",
      "label": "认真说,ai可以取代人类吗?",
      "fullLabel": "认真说,ai可以取代人类吗?",
      "url": "https://www.zhihu.com/question/6782975731",
      "weight": 1
    },
    {
      "id": "zh-639997162",
      "kind": "topic",
      "label": "AI 越来越强大,创造性工作会被取代吗?",
      "fullLabel": "AI 越来越强大,创造性工作会被取代吗?",
      "url": "https://www.zhihu.com/question/639997162",
      "weight": 1
    },
    {
      "id": "zh-2032572036879476358",
      "kind": "topic",
      "label": "如果 AI 擅长法律检索和案例分析,那律师是不是最…",
      "fullLabel": "如果 AI 擅长法律检索和案例分析,那律师是不是最容易被替代的职业之一?",
      "url": "https://www.zhihu.com/question/2032572036879476358",
      "weight": 1
    },
    {
      "id": "zh-400705285",
      "kind": "topic",
      "label": "未来公办学校教师,会迎来下岗潮吗?",
      "fullLabel": "未来公办学校教师,会迎来下岗潮吗?",
      "url": "https://www.zhihu.com/question/400705285",
      "weight": 1
    },
    {
      "id": "zh-2040875811226510078",
      "kind": "topic",
      "label": "护士岗位面临被机器人替代的风险有多大?",
      "fullLabel": "护士岗位面临被机器人替代的风险有多大?",
      "url": "https://www.zhihu.com/question/2040875811226510078",
      "weight": 1
    },
    {
      "id": "zh-2051439039954396829",
      "kind": "topic",
      "label": "现在这样的就业形势,还有必要报师范吗?",
      "fullLabel": "现在这样的就业形势,还有必要报师范吗?",
      "url": "https://www.zhihu.com/question/2051439039954396829",
      "weight": 1
    },
    {
      "id": "zh-658879898",
      "kind": "topic",
      "label": "曾经大热的会计专业现在还是大热门吗?",
      "fullLabel": "曾经大热的会计专业现在还是大热门吗?",
      "url": "https://www.zhihu.com/question/658879898",
      "weight": 1
    },
    {
      "id": "a-777188139641830549",
      "kind": "claim",
      "label": "程序员拥抱AI是内卷裹挟下的理性自保，而非真心认同技术",
      "fullLabel": "程序员拥抱AI是内卷裹挟下的理性自保，而非真心认同技术",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 5968,
      "topicId": "zh-2017996212544960495",
      "url": "https://www.zhihu.com/question/2017996212544960495/answer/2019449064857580523?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5713819934268214727",
      "kind": "claim",
      "label": "AI只能做出60分作品，70分以上仍需专业画师，无法替代人类",
      "fullLabel": "AI只能做出60分作品，70分以上仍需专业画师，无法替代人类",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 3915,
      "topicId": "zh-1941132414425495417",
      "url": "https://www.zhihu.com/question/1941132414425495417/answer/2057474847484261507?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7011770996733503369",
      "kind": "claim",
      "label": "最迟到2027年AI将替代50%程序员，行业严重缩水",
      "fullLabel": "最迟到2027年AI将替代50%程序员，行业严重缩水",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 2281,
      "topicId": "zh-593275984",
      "url": "https://www.zhihu.com/question/593275984/answer/3383115383?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4240131651699878760",
      "kind": "claim",
      "label": "AI让经验贬值并切断年轻人从打杂起步的上升通道",
      "fullLabel": "AI让经验贬值并切断年轻人从打杂起步的上升通道",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.9,
      "votes": 2278,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2018041426429097572?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5503838410408249309",
      "kind": "claim",
      "label": "对AI的厌恶并非普遍现象，30岁以上群体态度更宽容",
      "fullLabel": "对AI的厌恶并非普遍现象，30岁以上群体态度更宽容",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.75,
      "votes": 1551,
      "topicId": "zh-2061136311206073648",
      "url": "https://www.zhihu.com/question/2061136311206073648/answer/2072425825656476367?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8863528003331150212",
      "kind": "claim",
      "label": "AI从底层画师开始逐层向上吞噬，新人几乎跑不过AI",
      "fullLabel": "AI从底层画师开始逐层向上吞噬，新人几乎跑不过AI",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 1365,
      "topicId": "zh-1951817967785456234",
      "url": "https://www.zhihu.com/question/1951817967785456234/answer/1991715388732498334?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4657783906339585386",
      "kind": "claim",
      "label": "AI已能取代大部分中低级别程序员，包括P7以下和多数外包岗…",
      "fullLabel": "AI已能取代大部分中低级别程序员，包括P7以下和多数外包岗位。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 855,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/1948718530687140531?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4597835304900607258",
      "kind": "claim",
      "label": "画师配音演员抵制AI是因为AI直接替代其最终交付物，而程序…",
      "fullLabel": "画师配音演员抵制AI是因为AI直接替代其最终交付物，而程序员只是把AI当工具。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 767,
      "topicId": "zh-2017996212544960495",
      "url": "https://www.zhihu.com/question/2017996212544960495/answer/2018005349479784455?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5324987417511538813",
      "kind": "claim",
      "label": "AI无法替代脑洞极大的神级画师，因为AI在'想到'新概念上…",
      "fullLabel": "AI无法替代脑洞极大的神级画师，因为AI在'想到'新概念上存在原理性缺陷。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 738,
      "topicId": "zh-565119295",
      "url": "https://www.zhihu.com/question/565119295/answer/1995933038174040389?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-764632049320813660",
      "kind": "claim",
      "label": "高校裁撤翻译摄影等专业主因是市场需求萎缩，AI只是压死骆驼…",
      "fullLabel": "高校裁撤翻译摄影等专业主因是市场需求萎缩，AI只是压死骆驼的最后一根稻草。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.8,
      "votes": 578,
      "topicId": "zh-2014268583652320290",
      "url": "https://www.zhihu.com/question/2014268583652320290/answer/2014279128472363814?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7967126021123033421",
      "kind": "claim",
      "label": "图文赛道会被AI彻底取代，因为AI能以数量级碾压人力出稿的…",
      "fullLabel": "图文赛道会被AI彻底取代，因为AI能以数量级碾压人力出稿的成本效率。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 519,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2075524893353959522?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5112006109323949625",
      "kind": "claim",
      "label": "翻译行业已被AI冲击得最彻底，同传和字幕翻译的人力价格已无…",
      "fullLabel": "翻译行业已被AI冲击得最彻底，同传和字幕翻译的人力价格已无法竞争。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 510,
      "topicId": "zh-1951817967785456234",
      "url": "https://www.zhihu.com/question/1951817967785456234/answer/2001417187517306855?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8096488367717744330",
      "kind": "claim",
      "label": "AI绘画已能对部分画师形成完全替代，完全替代论只是绝对化措…",
      "fullLabel": "AI绘画已能对部分画师形成完全替代，完全替代论只是绝对化措辞。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.75,
      "votes": 463,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/1959289105381847611?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7597617030238682870",
      "kind": "claim",
      "label": "人们厌恶的不是AI本身，而是滥用AI炮制低质内容与诈骗炒作…",
      "fullLabel": "人们厌恶的不是AI本身，而是滥用AI炮制低质内容与诈骗炒作的行为。",
      "side": "neutral",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 375,
      "topicId": "zh-2061136311206073648",
      "url": "https://www.zhihu.com/question/2061136311206073648/answer/2072612474088640703?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2136434335880609321",
      "kind": "claim",
      "label": "AI绘画只是工具，真正有绘画水平的人不会被淘汰。",
      "fullLabel": "AI绘画只是工具，真正有绘画水平的人不会被淘汰。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 330,
      "topicId": "zh-597389916",
      "url": "https://www.zhihu.com/question/597389916/answer/2999192057?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-675605611023760361",
      "kind": "claim",
      "label": "AI工具已能自主完成学习与选型，AI科普和种草博主因此失去…",
      "fullLabel": "AI工具已能自主完成学习与选型，AI科普和种草博主因此失去存在价值。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.72,
      "votes": 312,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2076251239646609624?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-778555317989693620",
      "kind": "claim",
      "label": "翻译、摄影等专业已不需大批量培养，高校砍掉这些专业是明智的。",
      "fullLabel": "翻译、摄影等专业已不需大批量培养，高校砍掉这些专业是明智的。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.78,
      "votes": 310,
      "topicId": "zh-2014268583652320290",
      "url": "https://www.zhihu.com/question/2014268583652320290/answer/2014276105331311148?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--276276232786293620",
      "kind": "claim",
      "label": "岗位是否会被AI取代，取决于其考核指标是否为AI所擅长。",
      "fullLabel": "岗位是否会被AI取代，取决于其考核指标是否为AI所擅长。",
      "side": "neutral",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 282,
      "topicId": "zh-2011022777268856579",
      "url": "https://www.zhihu.com/question/2011022777268856579/answer/2011053177529710576?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8658895751633337560",
      "kind": "claim",
      "label": "翻译专业本就该砍，AI只是提供了动刀的理由，而非根本原因。",
      "fullLabel": "翻译专业本就该砍，AI只是提供了动刀的理由，而非根本原因。",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.75,
      "votes": 278,
      "topicId": "zh-2014268583652320290",
      "url": "https://www.zhihu.com/question/2014268583652320290/answer/2014523544151815766?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1075229406073438720",
      "kind": "claim",
      "label": "AI提升生产力会扩大服务规模，从而增加而非减少相关岗位需求。",
      "fullLabel": "AI提升生产力会扩大服务规模，从而增加而非减少相关岗位需求。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 277,
      "topicId": "zh-2016930184062789503",
      "url": "https://www.zhihu.com/question/2016930184062789503/answer/2021523867974247995?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8400187811174672471",
      "kind": "claim",
      "label": "AI绘画无法还原人类基于视觉补偿原理的细腻色彩处理，因此替…",
      "fullLabel": "AI绘画无法还原人类基于视觉补偿原理的细腻色彩处理，因此替代不了画师。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 258,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/1952118725521175249?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7627082454947294178",
      "kind": "claim",
      "label": "AI算力成本高昂且不可持续，因此AI无法真正取代程序员等白…",
      "fullLabel": "AI算力成本高昂且不可持续，因此AI无法真正取代程序员等白领岗位。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.65,
      "votes": 245,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2003209837874545795?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5148465118168203901",
      "kind": "claim",
      "label": "AI摧毁基础白领岗位后不会产生同等数量的新岗位，因为被替代…",
      "fullLabel": "AI摧毁基础白领岗位后不会产生同等数量的新岗位，因为被替代的是智力本身。",
      "side": "positive",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 222,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2017218182583165346?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6981647910598885200",
      "kind": "claim",
      "label": "AI写代码不构成竞争力优势，因为竞争力来自人而非生产力工具。",
      "fullLabel": "AI写代码不构成竞争力优势，因为竞争力来自人而非生产力工具。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 218,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2072353494615454897?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7087091483973468197",
      "kind": "claim",
      "label": "AI已开始实质减少程序员岗位，计算机专业高薪时代正在终结。",
      "fullLabel": "AI已开始实质减少程序员岗位，计算机专业高薪时代正在终结。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 214,
      "topicId": "zh-2078502972665884970",
      "url": "https://www.zhihu.com/question/2078502972665884970/answer/2078529379026715388?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1665837174359470226",
      "kind": "claim",
      "label": "绘圈痛恨AI是因为AI直接替代了画师靠技艺谋生的根本。",
      "fullLabel": "绘圈痛恨AI是因为AI直接替代了画师靠技艺谋生的根本。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 197,
      "topicId": "zh-1941132414425495417",
      "url": "https://www.zhihu.com/question/1941132414425495417/answer/1951710501751988874?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4174470938112234211",
      "kind": "claim",
      "label": "AI对画师几乎不构成斩杀，因为审美对抗无法被模型覆盖。",
      "fullLabel": "AI对画师几乎不构成斩杀，因为审美对抗无法被模型覆盖。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 194,
      "topicId": "zh-2012530352657282469",
      "url": "https://www.zhihu.com/question/2012530352657282469/answer/2052322250578253779?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-9019339624109839252",
      "kind": "claim",
      "label": "财务机器人已替代超七成基础核算岗，会计专业缩招是必然。",
      "fullLabel": "财务机器人已替代超七成基础核算岗，会计专业缩招是必然。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 177,
      "topicId": "zh-1892491048032396428",
      "url": "https://www.zhihu.com/question/1892491048032396428/answer/1930034200578340107?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3945245772520750417",
      "kind": "claim",
      "label": "AI无法取代程序员，因为软件架构的耦合与复用取舍无法被形式…",
      "fullLabel": "AI无法取代程序员，因为软件架构的耦合与复用取舍无法被形式化。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 176,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2078914989927166773?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2774134015391990851",
      "kind": "claim",
      "label": "中传撤销翻译摄影等专业不能全归因于AI，AI本质只是工具无…",
      "fullLabel": "中传撤销翻译摄影等专业不能全归因于AI，AI本质只是工具无法独立创造价值。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 167,
      "topicId": "zh-2014268583652320290",
      "url": "https://www.zhihu.com/question/2014268583652320290/answer/2014307720430383337?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3181744553442995604",
      "kind": "claim",
      "label": "会计被列为国控专业说明行业已供过于求，基础核算岗位正被AI…",
      "fullLabel": "会计被列为国控专业说明行业已供过于求，基础核算岗位正被AI大规模取代。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 165,
      "topicId": "zh-1892491048032396428",
      "url": "https://www.zhihu.com/question/1892491048032396428/answer/1930296526233645370?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7916746516158566518",
      "kind": "claim",
      "label": "AI最先冲击的是医生中做重复劳动的初级岗位，而非资深临床医…",
      "fullLabel": "AI最先冲击的是医生中做重复劳动的初级岗位，而非资深临床医生。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 163,
      "topicId": "zh-353011782",
      "url": "https://www.zhihu.com/question/353011782/answer/2048733752684237902?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3967858075044158343",
      "kind": "claim",
      "label": "Transformer架构使AI绘画从随机抽卡转向确定性设…",
      "fullLabel": "Transformer架构使AI绘画从随机抽卡转向确定性设计，但成本与精度仍是短板。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 161,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/1980661470699230091?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3138059878309530626",
      "kind": "claim",
      "label": "律师强调法律行业人情世故的特殊性，实质是维持高收费的话术而…",
      "fullLabel": "律师强调法律行业人情世故的特殊性，实质是维持高收费的话术而非AI无法替代。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.75,
      "votes": 160,
      "topicId": "zh-659369541",
      "url": "https://www.zhihu.com/question/659369541/answer/2019314598738670614?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3298101780382736051",
      "kind": "claim",
      "label": "AI将摧毁所有依赖信息不对称和重复性认知劳动的岗位，体力工…",
      "fullLabel": "AI将摧毁所有依赖信息不对称和重复性认知劳动的岗位，体力工作也无法幸免",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 149,
      "topicId": "zh-1951817967785456234",
      "url": "https://www.zhihu.com/question/1951817967785456234/answer/1987913745536677287?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6123579788034080189",
      "kind": "claim",
      "label": "AI无法独立完成涉及硬件物理交互和极端环境实时计算的硬核工…",
      "fullLabel": "AI无法独立完成涉及硬件物理交互和极端环境实时计算的硬核工程任务",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 140,
      "topicId": "zh-660021689",
      "url": "https://www.zhihu.com/question/660021689/answer/2011469279116161065?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8393684584489265199",
      "kind": "claim",
      "label": "AI开发软件已成为行业流程的永久组成部分，且将让外行也能无…",
      "fullLabel": "AI开发软件已成为行业流程的永久组成部分，且将让外行也能无痛开发软件",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.75,
      "votes": 136,
      "topicId": "zh-2038411932424725710",
      "url": "https://www.zhihu.com/question/2038411932424725710/answer/2074611461687619824?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7392279913687727441",
      "kind": "claim",
      "label": "AI生成内容并非全是垃圾，其质量已超过许多非AI作品，因此…",
      "fullLabel": "AI生成内容并非全是垃圾，其质量已超过许多非AI作品，因此不应被全盘否定",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 132,
      "topicId": "zh-2061136311206073648",
      "url": "https://www.zhihu.com/question/2061136311206073648/answer/2072778716078411971?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3626746105289842740",
      "kind": "claim",
      "label": "AI替代的不是专业而是任务类型，选择高原创力和高情感交互密…",
      "fullLabel": "AI替代的不是专业而是任务类型，选择高原创力和高情感交互密度的专业才不易被替代",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.85,
      "votes": 128,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2052446582004625499?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3878948019650956180",
      "kind": "claim",
      "label": "程序员不会被AI替代的说法站不住脚，因为已有项目完全由AI…",
      "fullLabel": "程序员不会被AI替代的说法站不住脚，因为已有项目完全由AI生成却无人能维护",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.65,
      "votes": 124,
      "topicId": "zh-2052608342816715544",
      "url": "https://www.zhihu.com/question/2052608342816715544/answer/2055972196107957444?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7358295969482173416",
      "kind": "claim",
      "label": "AI能替代医生的知识问答，但无法替代医生承担临床决策责任的…",
      "fullLabel": "AI能替代医生的知识问答，但无法替代医生承担临床决策责任的角色。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.9,
      "votes": 123,
      "topicId": "zh-2069490435995832397",
      "url": "https://www.zhihu.com/question/2069490435995832397/answer/2070916250557997500?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--9169751937220422521",
      "kind": "claim",
      "label": "AI时代财会专业比多数理工专业更难被淘汰，因为技术反而扩大…",
      "fullLabel": "AI时代财会专业比多数理工专业更难被淘汰，因为技术反而扩大了财会职责范围。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 107,
      "topicId": "zh-1923383858025433047",
      "url": "https://www.zhihu.com/question/1923383858025433047/answer/1997298782254163691?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4812623908113812622",
      "kind": "claim",
      "label": "大批AI博主停更的真实原因是评测能力不足，而非赛道本身衰退。",
      "fullLabel": "大批AI博主停更的真实原因是评测能力不足，而非赛道本身衰退。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 105,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2075709108490186870?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8809132565924223758",
      "kind": "claim",
      "label": "AI已使商业美术价格回归其应有低位，画师必须向顶层判断力或…",
      "fullLabel": "AI已使商业美术价格回归其应有低位，画师必须向顶层判断力或人机协作转型。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 101,
      "topicId": "zh-2012530352657282469",
      "url": "https://www.zhihu.com/question/2012530352657282469/answer/2033465938146750495?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7786809911667768090",
      "kind": "claim",
      "label": "程序员拥抱AI只是暂时的，因为AI与画师产出同质，最终也会…",
      "fullLabel": "程序员拥抱AI只是暂时的，因为AI与画师产出同质，最终也会冲击程序员岗位。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 97,
      "topicId": "zh-2017996212544960495",
      "url": "https://www.zhihu.com/question/2017996212544960495/answer/2018065046979233295?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4341191114694461656",
      "kind": "claim",
      "label": "当前大语言模型远未达到可安全部署于医疗前端面对普通用户的程…",
      "fullLabel": "当前大语言模型远未达到可安全部署于医疗前端面对普通用户的程度。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.9,
      "votes": 97,
      "topicId": "zh-2053791549629129105",
      "url": "https://www.zhihu.com/question/2053791549629129105/answer/2062027534783492352?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5697019864897919484",
      "kind": "claim",
      "label": "AI绘画无法替代插画师，因为其生成图风格固化、无法满足项目…",
      "fullLabel": "AI绘画无法替代插画师，因为其生成图风格固化、无法满足项目级设计需求。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 94,
      "topicId": "zh-7007890382",
      "url": "https://www.zhihu.com/question/7007890382/answer/66063709091?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4884147300876143995",
      "kind": "claim",
      "label": "AI无法取代律师，因为法律判断依赖非公开信息差，AI在复杂…",
      "fullLabel": "AI无法取代律师，因为法律判断依赖非公开信息差，AI在复杂问题上错误率过半。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 93,
      "topicId": "zh-659369541",
      "url": "https://www.zhihu.com/question/659369541/answer/2040228688436974346?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8414699585281428141",
      "kind": "claim",
      "label": "计算机专业仍值得报考，但普通院校的泛计算机红利期已过，需慎…",
      "fullLabel": "计算机专业仍值得报考，但普通院校的泛计算机红利期已过，需慎选。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 85,
      "topicId": "zh-2035134530596683934",
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2048744406606521482?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3822831705509045065",
      "kind": "claim",
      "label": "AI绘画因市场认知错位和隐性成本被低估，短期内无法在商业价…",
      "fullLabel": "AI绘画因市场认知错位和隐性成本被低估，短期内无法在商业价值上替代画师。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 83,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/1951331597774222217?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5175851305424032479",
      "kind": "claim",
      "label": "AI绘画已实际抢走画师订单并压缩美术岗位，行业冲击正在发生。",
      "fullLabel": "AI绘画已实际抢走画师订单并压缩美术岗位，行业冲击正在发生。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 74,
      "topicId": "zh-568804205",
      "url": "https://www.zhihu.com/question/568804205/answer/2867063114?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7010234659398858855",
      "kind": "claim",
      "label": "AI无法承担会计中的职业判断、伦理决策与法律责任，因此会计…",
      "fullLabel": "AI无法承担会计中的职业判断、伦理决策与法律责任，因此会计核心岗位不可被取代。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 71,
      "topicId": "zh-1992678011498100641",
      "url": "https://www.zhihu.com/question/1992678011498100641/answer/2049828458595988528?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--271755577056779633",
      "kind": "claim",
      "label": "AI不会取代会计，但会淘汰只会记账、缺乏业务判断力的会计。",
      "fullLabel": "AI不会取代会计，但会淘汰只会记账、缺乏业务判断力的会计。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 69,
      "topicId": "zh-658879898",
      "url": "https://www.zhihu.com/question/658879898/answer/1962112404059042448?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1056678539764621563",
      "kind": "claim",
      "label": "在绝大多数翻译场景下，AI翻译将取代传统人工翻译。",
      "fullLabel": "在绝大多数翻译场景下，AI翻译将取代传统人工翻译。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 68,
      "topicId": "zh-284641712",
      "url": "https://www.zhihu.com/question/284641712/answer/3408225968?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--9189395591333446598",
      "kind": "claim",
      "label": "在逐利资本主导下，AI写代码的边界由成本收益决定，而非代码…",
      "fullLabel": "在逐利资本主导下，AI写代码的边界由成本收益决定，而非代码质量。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 65,
      "topicId": "zh-1931619901778391593",
      "url": "https://www.zhihu.com/question/1931619901778391593/answer/1933981534563574356?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7506223916112815660",
      "kind": "claim",
      "label": "程序员行业不会消失，但只会实现需求的中低端岗位将快速被AI…",
      "fullLabel": "程序员行业不会消失，但只会实现需求的中低端岗位将快速被AI洗牌。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 64,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2077721823211476810?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3059213074980422546",
      "kind": "claim",
      "label": "AI会大幅压缩初级程序员岗位，但计算机专业仍值得报考。",
      "fullLabel": "AI会大幅压缩初级程序员岗位，但计算机专业仍值得报考。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 56,
      "topicId": "zh-2035134530596683934",
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2049032354732176922?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2219051504955640382",
      "kind": "claim",
      "label": "工作成果完全在数字世界的岗位易被AI替代，需与物理世界打交…",
      "fullLabel": "工作成果完全在数字世界的岗位易被AI替代，需与物理世界打交道的岗位不易被替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 55,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2051072873201242500?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4236882863799727009",
      "kind": "claim",
      "label": "AI不会抢走所有程序员工作，只会淘汰只会机械写代码、不思考…",
      "fullLabel": "AI不会抢走所有程序员工作，只会淘汰只会机械写代码、不思考不成长的人。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 50,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2018348497066280265?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-478631262804848716",
      "kind": "claim",
      "label": "AI时代真正被淘汰的不是某个专业，而是单一专业路径本身。",
      "fullLabel": "AI时代真正被淘汰的不是某个专业，而是单一专业路径本身。",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.7,
      "votes": 49,
      "topicId": "zh-2014268583652320290",
      "url": "https://www.zhihu.com/question/2014268583652320290/answer/2015873973817197771?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8229830341365635121",
      "kind": "claim",
      "label": "AI无法想象人类未曾见过的事物，因此画师不会被AI替代。",
      "fullLabel": "AI无法想象人类未曾见过的事物，因此画师不会被AI替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 47,
      "topicId": "zh-565119295",
      "url": "https://www.zhihu.com/question/565119295/answer/2022735791982481968?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5012710704733220381",
      "kind": "claim",
      "label": "做AI知识搬运的博主会被模型替代，做AI经验产出的博主才能…",
      "fullLabel": "做AI知识搬运的博主会被模型替代，做AI经验产出的博主才能存活。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 44,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2074194009161983192?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3596866254648524842",
      "kind": "claim",
      "label": "AI会取代只把需求翻译成代码的程序员，但放大定义问题与担责…",
      "fullLabel": "AI会取代只把需求翻译成代码的程序员，但放大定义问题与担责的那层。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.9,
      "votes": 43,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2078577672926634612?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6078019214871629394",
      "kind": "claim",
      "label": "师范、法学、会计等所谓抗AI专业，因需求萎缩和初级劳动被替…",
      "fullLabel": "师范、法学、会计等所谓抗AI专业，因需求萎缩和初级劳动被替代而不再稳定。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 41,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2049181490353795314?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1301128396742181849",
      "kind": "claim",
      "label": "AI永远替代不了画师，但会用AI的人会替代不会用AI的人。",
      "fullLabel": "AI永远替代不了画师，但会用AI的人会替代不会用AI的人。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 41,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/1964410917086291044?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8636163842687801585",
      "kind": "claim",
      "label": "计算机专业仍值得报考，但软硬结合方向比纯软件更不易被AI替…",
      "fullLabel": "计算机专业仍值得报考，但软硬结合方向比纯软件更不易被AI替代。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 38,
      "topicId": "zh-2035134530596683934",
      "url": "https://www.zhihu.com/question/2035134530596683934/answer/2049076385973637252?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8829090024133184570",
      "kind": "claim",
      "label": "AI视频博主集中停更源于算力成本高和团队化竞争，个人创作者…",
      "fullLabel": "AI视频博主集中停更源于算力成本高和团队化竞争，个人创作者难以回本。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.75,
      "votes": 38,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2075818509880267807?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3216813244614454094",
      "kind": "claim",
      "label": "AI会优先取代司机等规则化岗位，但会催生远程监控等新岗位，…",
      "fullLabel": "AI会优先取代司机等规则化岗位，但会催生远程监控等新岗位，净效应并非单纯抢工作。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.7,
      "votes": 36,
      "topicId": "zh-1953365116692205864",
      "url": "https://www.zhihu.com/question/1953365116692205864/answer/1953709499669018079?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3430818952854333748",
      "kind": "claim",
      "label": "AI辅助编程能替代写代码环节，但无法承担代码质量的最终责任…",
      "fullLabel": "AI辅助编程能替代写代码环节，但无法承担代码质量的最终责任，因此不能替代程序员。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 34,
      "topicId": "zh-8345110904",
      "url": "https://www.zhihu.com/question/8345110904/answer/2079169706590744750?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4337304148717625052",
      "kind": "claim",
      "label": "在弱人工智能阶段，AI缺乏跨情境理解与灵活协作能力，无法完…",
      "fullLabel": "在弱人工智能阶段，AI缺乏跨情境理解与灵活协作能力，无法完全替代翻译等专业岗位。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 33,
      "topicId": "zh-2016910965510268796",
      "url": "https://www.zhihu.com/question/2016910965510268796/answer/2073715669036692433?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5083327037914158295",
      "kind": "claim",
      "label": "AI只是接手基础与危险工作，人类通过转为审核者实现人机协作…",
      "fullLabel": "AI只是接手基础与危险工作，人类通过转为审核者实现人机协作，工作并未被真正抢走。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.6,
      "votes": 31,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2022587178492916802?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5870612721970439520",
      "kind": "claim",
      "label": "AI能替代纯内容输出层面的创作，但审美、创造力与人机协作能…",
      "fullLabel": "AI能替代纯内容输出层面的创作，但审美、创造力与人机协作能力本身无法被替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 30,
      "topicId": "zh-12872950823",
      "url": "https://www.zhihu.com/question/12872950823/answer/1904858646455775343?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3008774721068965159",
      "kind": "claim",
      "label": "AI对码农效率的提升远大于社会软件需求的增长，因此码农岗位…",
      "fullLabel": "AI对码农效率的提升远大于社会软件需求的增长，因此码农岗位必然减少。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 30,
      "topicId": "zh-1972861967086666313",
      "url": "https://www.zhihu.com/question/1972861967086666313/answer/1974004775524786188?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7178103508806517538",
      "kind": "claim",
      "label": "AI对画师是替代，对程序员是放大，因为软件需求边界可无限扩…",
      "fullLabel": "AI对画师是替代，对程序员是放大，因为软件需求边界可无限扩张而视觉消费有限。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.9,
      "votes": 30,
      "topicId": "zh-1972861967086666313",
      "url": "https://www.zhihu.com/question/1972861967086666313/answer/1982512647514636913?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3969283045814583921",
      "kind": "claim",
      "label": "AI时代自媒体中纯知识型价值将被替代，唯有真实人格与信任感…",
      "fullLabel": "AI时代自媒体中纯知识型价值将被替代，唯有真实人格与信任感不可取代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 30,
      "topicId": "zh-635329472",
      "url": "https://www.zhihu.com/question/635329472/answer/2022690658968770101?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4542281494250465893",
      "kind": "claim",
      "label": "AI写代码不可靠，出错后仍需程序员排查，因此程序员不会被取…",
      "fullLabel": "AI写代码不可靠，出错后仍需程序员排查，因此程序员不会被取代。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 29,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2079340931757642479?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8256198252371469474",
      "kind": "claim",
      "label": "AI让年轻人机会变多，但最终取决于个人执行力而非技术本身。",
      "fullLabel": "AI让年轻人机会变多，但最终取决于个人执行力而非技术本身。",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.6,
      "votes": 29,
      "topicId": "zh-2016930184062789503",
      "url": "https://www.zhihu.com/question/2016930184062789503/answer/2079862690655252661?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7900839696774041776",
      "kind": "claim",
      "label": "年轻人机会多少由康波周期位置决定，AI作为第六轮周期核心将…",
      "fullLabel": "年轻人机会多少由康波周期位置决定，AI作为第六轮周期核心将带来新机遇。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.7,
      "votes": 29,
      "topicId": "zh-2016930184062789503",
      "url": "https://www.zhihu.com/question/2016930184062789503/answer/2021270753056662615?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-858931080723109320",
      "kind": "claim",
      "label": "大学老师不会被AI取代，因为AI只擅长标准化输出，无法处理…",
      "fullLabel": "大学老师不会被AI取代，因为AI只擅长标准化输出，无法处理学生困惑与判断答案真伪。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 27,
      "topicId": "zh-2022827505304781613",
      "url": "https://www.zhihu.com/question/2022827505304781613/answer/2023061062212134822?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7135962638583945500",
      "kind": "claim",
      "label": "AI新增岗位无法吸纳被取代的劳动者，岗位净增只是数字游戏",
      "fullLabel": "AI新增岗位无法吸纳被取代的劳动者，岗位净增只是数字游戏",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 27,
      "topicId": "zh-2072683028829009863",
      "url": "https://www.zhihu.com/question/2072683028829009863/answer/2072692185464674181?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5009218611275704310",
      "kind": "claim",
      "label": "出生率下跌与AI冲击叠加，公办教师岗位将缓慢但确定地收缩",
      "fullLabel": "出生率下跌与AI冲击叠加，公办教师岗位将缓慢但确定地收缩",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 27,
      "topicId": "zh-400705285",
      "url": "https://www.zhihu.com/question/400705285/answer/2068252009623564426?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6926770995914242054",
      "kind": "claim",
      "label": "AI只能写代码，无法独立构建和维系复杂生产系统，故程序员不…",
      "fullLabel": "AI只能写代码，无法独立构建和维系复杂生产系统，故程序员不可替代",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 26,
      "topicId": "zh-2052608342816715544",
      "url": "https://www.zhihu.com/question/2052608342816715544/answer/2073399408377468668?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-175960481860901278",
      "kind": "claim",
      "label": "需要提供情绪价值和最终把关的职业不会被AI取代",
      "fullLabel": "需要提供情绪价值和最终把关的职业不会被AI取代",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.65,
      "votes": 25,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2056887941188924897?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2866688706434085398",
      "kind": "claim",
      "label": "法学专业对普通家庭学生是陷阱，投入产出严重失衡",
      "fullLabel": "法学专业对普通家庭学生是陷阱，投入产出严重失衡",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.75,
      "votes": 24,
      "topicId": "zh-637094806",
      "url": "https://www.zhihu.com/question/637094806/answer/2067005620604211855?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7190083545853485598",
      "kind": "claim",
      "label": "AI只能生成标准代码，无法胜任系统设计与架构决策，因此取代…",
      "fullLabel": "AI只能生成标准代码，无法胜任系统设计与架构决策，因此取代不了有经验的程序员。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 22,
      "topicId": "zh-1931619901778391593",
      "url": "https://www.zhihu.com/question/1931619901778391593/answer/1933151896798991067?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8937250665072027492",
      "kind": "claim",
      "label": "ChatGPT虽能写代码和修bug，但不会导致程序员大规模…",
      "fullLabel": "ChatGPT虽能写代码和修bug，但不会导致程序员大规模失业，反而会创造新岗位。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.6,
      "votes": 21,
      "topicId": "zh-581137960",
      "url": "https://www.zhihu.com/question/581137960/answer/2865780006?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2874179722140792518",
      "kind": "claim",
      "label": "被AI替代最严重的岗位，在AI浪潮前就已被自动化产品逐步取…",
      "fullLabel": "被AI替代最严重的岗位，在AI浪潮前就已被自动化产品逐步取代。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 21,
      "topicId": "zh-2072683028829009863",
      "url": "https://www.zhihu.com/question/2072683028829009863/answer/2072721699137663602?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7510776705010454167",
      "kind": "claim",
      "label": "会计列入国控专业不是封杀，而是因产能过剩与技术冲击倒逼专业…",
      "fullLabel": "会计列入国控专业不是封杀，而是因产能过剩与技术冲击倒逼专业升级。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.7,
      "votes": 19,
      "topicId": "zh-1892491048032396428",
      "url": "https://www.zhihu.com/question/1892491048032396428/answer/2066459257176848354?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2483126025033303325",
      "kind": "claim",
      "label": "AI无法独立完成系统架构设计，未来程序员将从写代码转为审查…",
      "fullLabel": "AI无法独立完成系统架构设计，未来程序员将从写代码转为审查AI代码。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 18,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2079669249254150636?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6951302731698000672",
      "kind": "claim",
      "label": "AI时代真正被淘汰的是只会标准化输出的人，而非某个具体学科。",
      "fullLabel": "AI时代真正被淘汰的是只会标准化输出的人，而非某个具体学科。",
      "side": "positive",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 18,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2048703944730454003?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7442538956534383648",
      "kind": "claim",
      "label": "AI淘汰的是没有独立思想、知识面狭窄、敷衍工作的文秘人员。",
      "fullLabel": "AI淘汰的是没有独立思想、知识面狭窄、敷衍工作的文秘人员。",
      "side": "positive",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 18,
      "topicId": "zh-13655203379",
      "url": "https://www.zhihu.com/question/13655203379/answer/115028932342?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2236234991474661975",
      "kind": "claim",
      "label": "AI无法取代教师，因为学习动机依赖真实人际关系而非技术能力。",
      "fullLabel": "AI无法取代教师，因为学习动机依赖真实人际关系而非技术能力。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 18,
      "topicId": "zh-661199186",
      "url": "https://www.zhihu.com/question/661199186/answer/2082114118811758602?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3116936308957756347",
      "kind": "claim",
      "label": "AI未能取代程序员，是因为它在长任务中会失控且固执不换路线。",
      "fullLabel": "AI未能取代程序员，是因为它在长任务中会失控且固执不换路线。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 17,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2078925731367858489?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2424424823265271812",
      "kind": "claim",
      "label": "AI淘汰的不是职业本身，而是只会做标准化重复性工作的人。",
      "fullLabel": "AI淘汰的不是职业本身，而是只会做标准化重复性工作的人。",
      "side": "positive",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 17,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2052029560410133166?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8883296274167542039",
      "kind": "claim",
      "label": "2026年大学生仍应学编程，但必须转向AI Agent方向…",
      "fullLabel": "2026年大学生仍应学编程，但必须转向AI Agent方向才有就业价值。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.6,
      "votes": 16,
      "topicId": "zh-2066911604235571824",
      "url": "https://www.zhihu.com/question/2066911604235571824/answer/2072824653446394907?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5887195202431428022",
      "kind": "claim",
      "label": "AI已替代相当一部分程序员，但需求分析这一核心难点未被改变。",
      "fullLabel": "AI已替代相当一部分程序员，但需求分析这一核心难点未被改变。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.75,
      "votes": 15,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2079213215842563423?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6849487066296743475",
      "kind": "claim",
      "label": "AI不会取代画家，因为绘画市场消费的是作者属性与情绪价值而…",
      "fullLabel": "AI不会取代画家，因为绘画市场消费的是作者属性与情绪价值而非效率。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 15,
      "topicId": "zh-1903459479011432303",
      "url": "https://www.zhihu.com/question/1903459479011432303/answer/2041985402576359699?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4691778845565231019",
      "kind": "claim",
      "label": "AI生成内容抹消了作者性并形成框架限制，无法独立完成精细化…",
      "fullLabel": "AI生成内容抹消了作者性并形成框架限制，无法独立完成精细化创作。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 15,
      "topicId": "zh-1903459479011432303",
      "url": "https://www.zhihu.com/question/1903459479011432303/answer/2053897917925160205?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7618442829021878751",
      "kind": "claim",
      "label": "AI泛滥招致反感，根源是KPI驱动的低质内容而非AI技术本…",
      "fullLabel": "AI泛滥招致反感，根源是KPI驱动的低质内容而非AI技术本身。",
      "side": "neutral",
      "reasonType": "责任归属",
      "quality": 0.65,
      "votes": 15,
      "topicId": "zh-2061136311206073648",
      "url": "https://www.zhihu.com/question/2061136311206073648/answer/2077735383354303922?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4114725474784259529",
      "kind": "claim",
      "label": "医生不会被AI取代，只会转为患者与AI之间的沟通桥梁。",
      "fullLabel": "医生不会被AI取代，只会转为患者与AI之间的沟通桥梁。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.7,
      "votes": 15,
      "topicId": "zh-2066111436082897266",
      "url": "https://www.zhihu.com/question/2066111436082897266/answer/2070881187682374931?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3132737687244157601",
      "kind": "claim",
      "label": "计算机专业就业红利期已过，AI发展使毕业生需求持续下降，已…",
      "fullLabel": "计算机专业就业红利期已过，AI发展使毕业生需求持续下降，已不值得为就业而选。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.8,
      "votes": 14,
      "topicId": "zh-465369002",
      "url": "https://www.zhihu.com/question/465369002/answer/2078028688021514184?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--9034118069028287358",
      "kind": "claim",
      "label": "程序员拥抱AI而非抵制，根源是议价地位强、职业身份不依附于…",
      "fullLabel": "程序员拥抱AI而非抵制，根源是议价地位强、职业身份不依附于具体产出。",
      "side": "neutral",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 14,
      "topicId": "zh-2017996212544960495",
      "url": "https://www.zhihu.com/question/2017996212544960495/answer/2082148165638174044?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4640485702391187028",
      "kind": "claim",
      "label": "AI取代标准化编码后，经济规律会让1%的人攫取90%的利润…",
      "fullLabel": "AI取代标准化编码后，经济规律会让1%的人攫取90%的利润，普通人难获益。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.75,
      "votes": 14,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2021917732413653920?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7021779542173971284",
      "kind": "claim",
      "label": "AI翻译已极大取代人工翻译，但因3-4%的硬骨头内容无法完…",
      "fullLabel": "AI翻译已极大取代人工翻译，但因3-4%的硬骨头内容无法完全取代人类。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 14,
      "topicId": "zh-284641712",
      "url": "https://www.zhihu.com/question/284641712/answer/3531744127?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5984559935248563559",
      "kind": "claim",
      "label": "AI冲击司机外卖等岗位不是道德问题，而是生产力发展的必然结…",
      "fullLabel": "AI冲击司机外卖等岗位不是道德问题，而是生产力发展的必然结果。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.7,
      "votes": 14,
      "topicId": "zh-661271928",
      "url": "https://www.zhihu.com/question/661271928/answer/1958934782646941121?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6474644246790139963",
      "kind": "claim",
      "label": "会计被列入国控专业不会让普通会计岗位自动升值，只会加速低质…",
      "fullLabel": "会计被列入国控专业不会让普通会计岗位自动升值，只会加速低质量基础财务岗位的价值压缩。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 14,
      "topicId": "zh-1892491048032396428",
      "url": "https://www.zhihu.com/question/1892491048032396428/answer/2050516043831972476?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6001715965198712772",
      "kind": "claim",
      "label": "AI大规模替代初级程序员将切断行业培养资深工程师的路径，十…",
      "fullLabel": "AI大规模替代初级程序员将切断行业培养资深工程师的路径，十年后无人能承担关键工程责任。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.9,
      "votes": 13,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2082141425899139513?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-9190646177456802717",
      "kind": "claim",
      "label": "AI最多只能节约程序员约25%的工作量，因为写代码从来不是…",
      "fullLabel": "AI最多只能节约程序员约25%的工作量，因为写代码从来不是程序员工作的主体。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 12,
      "topicId": "zh-2038411932424725710",
      "url": "https://www.zhihu.com/question/2038411932424725710/answer/2068255138444325035?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5545344300419036090",
      "kind": "claim",
      "label": "AI只是程序员手中的下一个工具，编程的核心创造力始终属于动…",
      "fullLabel": "AI只是程序员手中的下一个工具，编程的核心创造力始终属于动手写代码的人类。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 12,
      "topicId": "zh-1931619901778391593",
      "url": "https://www.zhihu.com/question/1931619901778391593/answer/1938328382396933918?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7486934681111155064",
      "kind": "claim",
      "label": "AI无法完全取代编程工作，因为代码必须由人调试修改，AI只…",
      "fullLabel": "AI无法完全取代编程工作，因为代码必须由人调试修改，AI只能降低门槛。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 12,
      "topicId": "zh-2458716174",
      "url": "https://www.zhihu.com/question/2458716174/answer/22065902932?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--588152754090473948",
      "kind": "claim",
      "label": "AI无法替代医生，因为医疗信任与责任兜底只能由人类体系提供。",
      "fullLabel": "AI无法替代医生，因为医疗信任与责任兜底只能由人类体系提供。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 12,
      "topicId": "zh-2069490435995832397",
      "url": "https://www.zhihu.com/question/2069490435995832397/answer/2074094005990773510?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8887061255577345053",
      "kind": "claim",
      "label": "AI不会整体取代律师，只会让重复性服务降价、组织判断者产能…",
      "fullLabel": "AI不会整体取代律师，只会让重复性服务降价、组织判断者产能上升。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.8,
      "votes": 12,
      "topicId": "zh-452243069",
      "url": "https://www.zhihu.com/question/452243069/answer/2068667190090392517?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-366995330329654836",
      "kind": "claim",
      "label": "自动驾驶并未抢走司机饭碗，其淘汰岗位数少于老龄化自然退休数。",
      "fullLabel": "自动驾驶并未抢走司机饭碗，其淘汰岗位数少于老龄化自然退休数。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 11,
      "topicId": "zh-661317726",
      "url": "https://www.zhihu.com/question/661317726/answer/1917156913323410756?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5954909559545702906",
      "kind": "claim",
      "label": "AI目前无法独立编写石油勘探等专业性强的综合性生产软件。",
      "fullLabel": "AI目前无法独立编写石油勘探等专业性强的综合性生产软件。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 10,
      "topicId": "zh-2077824745589028563",
      "url": "https://www.zhihu.com/question/2077824745589028563/answer/2081143126660597312?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--9067199109216805190",
      "kind": "claim",
      "label": "只要人类仍承认人的独特性，AI就无法冲击真正的艺术创作。",
      "fullLabel": "只要人类仍承认人的独特性，AI就无法冲击真正的艺术创作。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 10,
      "topicId": "zh-565119295",
      "url": "https://www.zhihu.com/question/565119295/answer/2064252296045793782?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8736220848270490719",
      "kind": "claim",
      "label": "AI不会取代会提问的人，提问能力才是不可替代的核心竞争力。",
      "fullLabel": "AI不会取代会提问的人，提问能力才是不可替代的核心竞争力。",
      "side": "negative",
      "reasonType": "教育培养",
      "quality": 0.7,
      "votes": 10,
      "topicId": "zh-13655203379",
      "url": "https://www.zhihu.com/question/13655203379/answer/113255383250?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2147618782599451840",
      "kind": "claim",
      "label": "AI对翻译行业的冲击被夸大，因为机器翻译早已锁死入水口，剩…",
      "fullLabel": "AI对翻译行业的冲击被夸大，因为机器翻译早已锁死入水口，剩余人工翻译规模小且难以替代。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 10,
      "topicId": "zh-1949784266633377083",
      "url": "https://www.zhihu.com/question/1949784266633377083/answer/2026358834730410371?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7432431057572437253",
      "kind": "claim",
      "label": "AI会压缩律师行业的前端认知工作并加速淘汰普通律师，但无法…",
      "fullLabel": "AI会压缩律师行业的前端认知工作并加速淘汰普通律师，但无法取代法官和司法实践中的沟通环节。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 10,
      "topicId": "zh-659369541",
      "url": "https://www.zhihu.com/question/659369541/answer/2048173863662523229?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6480506393744647351",
      "kind": "claim",
      "label": "AI正在大量替代从事增删改查等低技术含量工作的程序员，而产…",
      "fullLabel": "AI正在大量替代从事增删改查等低技术含量工作的程序员，而产品经理等岗位反而更安全。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 9,
      "topicId": "zh-2019355746328932969",
      "url": "https://www.zhihu.com/question/2019355746328932969/answer/2044464116086092625?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1927231570724299789",
      "kind": "claim",
      "label": "AI无人驾驶会先冲击底层司机岗位，因为其无疲劳、低成本且获…",
      "fullLabel": "AI无人驾驶会先冲击底层司机岗位，因为其无疲劳、低成本且获政策倾斜的优势。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 9,
      "topicId": "zh-661317726",
      "url": "https://www.zhihu.com/question/661317726/answer/1952437293756453426?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1373135577152647903",
      "kind": "claim",
      "label": "AI只能解决法律适用问题，无法替代律师处理复杂案件的事实认…",
      "fullLabel": "AI只能解决法律适用问题，无法替代律师处理复杂案件的事实认定。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 9,
      "topicId": "zh-659369541",
      "url": "https://www.zhihu.com/question/659369541/answer/2074875479522386191?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4443599563206995841",
      "kind": "claim",
      "label": "AI最终会取代所有程序员，包括那些擅长使用AI的人。",
      "fullLabel": "AI最终会取代所有程序员，包括那些擅长使用AI的人。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 8,
      "topicId": "zh-2067543311850778736",
      "url": "https://www.zhihu.com/question/2067543311850778736/answer/2068694767173742954?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6187716839666350814",
      "kind": "claim",
      "label": "AI视频内容不会成为主流，因为它缺乏活人感，无法取代真人创…",
      "fullLabel": "AI视频内容不会成为主流，因为它缺乏活人感，无法取代真人创作。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 7,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2075693440671790953?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2322413823008857432",
      "kind": "claim",
      "label": "AI将快速自动化法律检索和文书起草，但无法替代律师出具可追…",
      "fullLabel": "AI将快速自动化法律检索和文书起草，但无法替代律师出具可追责的法律意见。",
      "side": "neutral",
      "reasonType": "责任归属",
      "quality": 0.9,
      "votes": 7,
      "topicId": "zh-659369541",
      "url": "https://www.zhihu.com/question/659369541/answer/2082167649124012164?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1616394633754373363",
      "kind": "claim",
      "label": "AI取代法律基础工作，真正危害是让新人失去建立判断力的机会。",
      "fullLabel": "AI取代法律基础工作，真正危害是让新人失去建立判断力的机会。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.85,
      "votes": 7,
      "topicId": "zh-637094806",
      "url": "https://www.zhihu.com/question/637094806/answer/2055368906458633755?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1107566537735583804",
      "kind": "claim",
      "label": "AI不会让程序员消失，但会大幅减少初级和中级纯编码岗位。",
      "fullLabel": "AI不会让程序员消失，但会大幅减少初级和中级纯编码岗位。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 6,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2029181651897329541?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5108988535329087971",
      "kind": "claim",
      "label": "AI已取代写代码，但远未取代做产品，被淘汰的是只会写代码的…",
      "fullLabel": "AI已取代写代码，但远未取代做产品，被淘汰的是只会写代码的人。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 6,
      "topicId": "zh-2038411932424725710",
      "url": "https://www.zhihu.com/question/2038411932424725710/answer/2079476049327478723?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6345342579324424872",
      "kind": "claim",
      "label": "公司裁码农并非因AI能替代，而是业务线被整体砍掉。",
      "fullLabel": "公司裁码农并非因AI能替代，而是业务线被整体砍掉。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.7,
      "votes": 6,
      "topicId": "zh-2076694461229409490",
      "url": "https://www.zhihu.com/question/2076694461229409490/answer/2077445481140057032?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-479385971587492418",
      "kind": "claim",
      "label": "AI取代码农是迟早的事，长期将催生人类无法干预的编程语言。",
      "fullLabel": "AI取代码农是迟早的事，长期将催生人类无法干预的编程语言。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.65,
      "votes": 6,
      "topicId": "zh-581137960",
      "url": "https://www.zhihu.com/question/581137960/answer/2865729775?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8963194191942191530",
      "kind": "claim",
      "label": "AI并未真正替代画师，人类审美与定制化需求构成不可替代的护…",
      "fullLabel": "AI并未真正替代画师，人类审美与定制化需求构成不可替代的护城河。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 6,
      "topicId": "zh-1972861967086666313",
      "url": "https://www.zhihu.com/question/1972861967086666313/answer/2062573921053022004?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5938224498983223315",
      "kind": "claim",
      "label": "AI生成内容缺乏人味，读者终将厌倦并导致自媒体平台衰退。",
      "fullLabel": "AI生成内容缺乏人味，读者终将厌倦并导致自媒体平台衰退。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.7,
      "votes": 6,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2016956551986950353?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2576768985750860421",
      "kind": "claim",
      "label": "AI编程时代仍需深入学习编程，因为读懂与调试AI代码的能力…",
      "fullLabel": "AI编程时代仍需深入学习编程，因为读懂与调试AI代码的能力不可替代。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 6,
      "topicId": "zh-1984265501115958721",
      "url": "https://www.zhihu.com/question/1984265501115958721/answer/2077895292490457241?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2220612879756739023",
      "kind": "claim",
      "label": "AI无法替代医生，因为它不能承担执业风险、背锅和提供情绪价…",
      "fullLabel": "AI无法替代医生，因为它不能承担执业风险、背锅和提供情绪价值。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 6,
      "topicId": "zh-2069490435995832397",
      "url": "https://www.zhihu.com/question/2069490435995832397/answer/2077365222923417299?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--2488910800485298326",
      "kind": "claim",
      "label": "WEF预测的1.7亿新增岗位并非AI创造，而是多重结构性因…",
      "fullLabel": "WEF预测的1.7亿新增岗位并非AI创造，而是多重结构性因素共同作用的结果。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 6,
      "topicId": "zh-2072683028829009863",
      "url": "https://www.zhihu.com/question/2072683028829009863/answer/2072691496407638860?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6164472371836495289",
      "kind": "claim",
      "label": "设计师的意义在于赋予产品情感与意义，这是AI最难跨越的领地。",
      "fullLabel": "设计师的意义在于赋予产品情感与意义，这是AI最难跨越的领地。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 5,
      "topicId": "zh-1393954552",
      "url": "https://www.zhihu.com/question/1393954552/answer/2071191003772593358?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4554940962574273439",
      "kind": "claim",
      "label": "AI时代单纯的技术深度已不再是程序员的护城河，业务理解与取…",
      "fullLabel": "AI时代单纯的技术深度已不再是程序员的护城河，业务理解与取舍能力才是。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 5,
      "topicId": "zh-1953096742175224404",
      "url": "https://www.zhihu.com/question/1953096742175224404/answer/2079891482014758179?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6189677471261522049",
      "kind": "claim",
      "label": "AI能通晓医学指南却无法为生命兜底，医生的责任担当永远不可…",
      "fullLabel": "AI能通晓医学指南却无法为生命兜底，医生的责任担当永远不可替代。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 5,
      "topicId": "zh-2069490435995832397",
      "url": "https://www.zhihu.com/question/2069490435995832397/answer/2076599542208844805?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8130782778536502254",
      "kind": "claim",
      "label": "AI会写代码但不会让程序员行业消失，只会让招聘需求转向AI…",
      "fullLabel": "AI会写代码但不会让程序员行业消失，只会让招聘需求转向AI相关岗位。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 4,
      "topicId": "zh-14461028376",
      "url": "https://www.zhihu.com/question/14461028376/answer/2081519104511455372?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7415577803219682552",
      "kind": "claim",
      "label": "AI只能借鉴已有规则，人类无中生有的创造力和共情力才是核心…",
      "fullLabel": "AI只能借鉴已有规则，人类无中生有的创造力和共情力才是核心竞争力。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.6,
      "votes": 4,
      "topicId": "zh-1977074341968574068",
      "url": "https://www.zhihu.com/question/1977074341968574068/answer/2075584109284430210?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8202269146180933098",
      "kind": "claim",
      "label": "AI不会取代手绘，但会把商业美术中间层挤塌，手绘从职业技能…",
      "fullLabel": "AI不会取代手绘，但会把商业美术中间层挤塌，手绘从职业技能变成身份资产。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.9,
      "votes": 4,
      "topicId": "zh-594432719",
      "url": "https://www.zhihu.com/question/594432719/answer/2076605469452407124?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6542132015873777373",
      "kind": "claim",
      "label": "AI绘画只适合自由发挥业务，无法满足甲方细则要求，因此难以…",
      "fullLabel": "AI绘画只适合自由发挥业务，无法满足甲方细则要求，因此难以替代商业画师。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.75,
      "votes": 4,
      "topicId": "zh-1903459479011432303",
      "url": "https://www.zhihu.com/question/1903459479011432303/answer/1909310621213755155?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-988457616486433785",
      "kind": "claim",
      "label": "AI能画出精致图像，但无法复制人类的情感表达与生活体验，因…",
      "fullLabel": "AI能画出精致图像，但无法复制人类的情感表达与生活体验，因此不能取代画家。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 4,
      "topicId": "zh-1903459479011432303",
      "url": "https://www.zhihu.com/question/1903459479011432303/answer/1942754803747881571?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8156374372474315705",
      "kind": "claim",
      "label": "AI绘画无法承接高端定制与艺术性项目，但能驯服AI的画师效…",
      "fullLabel": "AI绘画无法承接高端定制与艺术性项目，但能驯服AI的画师效率将提升百倍。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 4,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/1950932822488486334?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-436754142026920650",
      "kind": "claim",
      "label": "AI能写大部分代码，但程序员吃透业务、翻译需求的经验不可替…",
      "fullLabel": "AI能写大部分代码，但程序员吃透业务、翻译需求的经验不可替代。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 4,
      "topicId": "zh-2056781761565159896",
      "url": "https://www.zhihu.com/question/2056781761565159896/answer/2074992805806601485?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7060855093229756424",
      "kind": "claim",
      "label": "AI导师在结构清晰的学习任务中效果显著，但无法承担教师的身…",
      "fullLabel": "AI导师在结构清晰的学习任务中效果显著，但无法承担教师的身体在场与关系角色。",
      "side": "negative",
      "reasonType": "教育培养",
      "quality": 0.85,
      "votes": 4,
      "topicId": "zh-6947040839",
      "url": "https://www.zhihu.com/question/6947040839/answer/2041634297153577893?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4702340177340402524",
      "kind": "claim",
      "label": "AI能给出系统健康答案，但无法为具体患者的生命风险负责，故…",
      "fullLabel": "AI能给出系统健康答案，但无法为具体患者的生命风险负责，故不能替代医生。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 4,
      "topicId": "zh-2069490435995832397",
      "url": "https://www.zhihu.com/question/2069490435995832397/answer/2078210722820108724?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-805227987191185843",
      "kind": "claim",
      "label": "AI博主停更源于AI内容同质化，因为AI只能重组旧知识而无…",
      "fullLabel": "AI博主停更源于AI内容同质化，因为AI只能重组旧知识而无法真正创造。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 4,
      "topicId": "zh-2072979072867747736",
      "url": "https://www.zhihu.com/question/2072979072867747736/answer/2078150651104834989?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1082727288811701520",
      "kind": "claim",
      "label": "AI淘汰的只是记账职能，管理会计与财务BP反而需求增长，会…",
      "fullLabel": "AI淘汰的只是记账职能，管理会计与财务BP反而需求增长，会计职业不会被淘汰。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 4,
      "topicId": "zh-2039116530319873634",
      "url": "https://www.zhihu.com/question/2039116530319873634/answer/2079145144020890643?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8930286753779581760",
      "kind": "claim",
      "label": "AI无法取代程序员，因为架构决策、隐性需求洞察和最终担责仍…",
      "fullLabel": "AI无法取代程序员，因为架构决策、隐性需求洞察和最终担责仍需人类主导。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 3,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2016489444237137727?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8717578469649032979",
      "kind": "claim",
      "label": "AI对高级工程师的提效仅约15%，因为写代码只占其工作的一…",
      "fullLabel": "AI对高级工程师的提效仅约15%，因为写代码只占其工作的一小部分。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.9,
      "votes": 3,
      "topicId": "zh-2038411932424725710",
      "url": "https://www.zhihu.com/question/2038411932424725710/answer/2068218939965027608?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6512767791850319549",
      "kind": "claim",
      "label": "AI五到十年内无法取代设计师，因为审美判断、思辨与落地协作…",
      "fullLabel": "AI五到十年内无法取代设计师，因为审美判断、思辨与落地协作是人的专属能力。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 3,
      "topicId": "zh-583691915",
      "url": "https://www.zhihu.com/question/583691915/answer/2071984546187368250?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--748655196267483594",
      "kind": "claim",
      "label": "AI编程工具无法培养真正的编程能力，编辑AI代码的能力必须…",
      "fullLabel": "AI编程工具无法培养真正的编程能力，编辑AI代码的能力必须建立在扎实编程基础上。",
      "side": "negative",
      "reasonType": "教育培养",
      "quality": 0.8,
      "votes": 3,
      "topicId": "zh-1931619901778391593",
      "url": "https://www.zhihu.com/question/1931619901778391593/answer/1937288527181218770?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4298882669829287467",
      "kind": "claim",
      "label": "AI正让认知劳动变便宜，最先受冲击的是应届生和初级岗位的就…",
      "fullLabel": "AI正让认知劳动变便宜，最先受冲击的是应届生和初级岗位的就业机会。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 3,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2078096209772819438?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--113937240923609398",
      "kind": "claim",
      "label": "AI时代就业与投资、人力资本、工资与生产率三重脱钩，需向无…",
      "fullLabel": "AI时代就业与投资、人力资本、工资与生产率三重脱钩，需向无人化企业征税并建立AI分红制度。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 3,
      "topicId": "zh-2016889470092272129",
      "url": "https://www.zhihu.com/question/2016889470092272129/answer/2070355489662179259?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3995585743664260981",
      "kind": "claim",
      "label": "AI泛滥成灾的根源不是AI本身，而是被AI击穿的交付底线与…",
      "fullLabel": "AI泛滥成灾的根源不是AI本身，而是被AI击穿的交付底线与过度宣传的落差。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 3,
      "topicId": "zh-2061136311206073648",
      "url": "https://www.zhihu.com/question/2061136311206073648/answer/2074089430441268993?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6647773154164476969",
      "kind": "claim",
      "label": "AI时代仍必须学习编程语言，因为看懂AI生成代码和掌握软件…",
      "fullLabel": "AI时代仍必须学习编程语言，因为看懂AI生成代码和掌握软件工程范式不可省略。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 3,
      "topicId": "zh-2019860124727031327",
      "url": "https://www.zhihu.com/question/2019860124727031327/answer/2079877284043961343?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1166588439102192390",
      "kind": "claim",
      "label": "AI只是编程抽象层级的又一次上升，认真学习一门高级语言依然…",
      "fullLabel": "AI只是编程抽象层级的又一次上升，认真学习一门高级语言依然必要。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 3,
      "topicId": "zh-2011117101591589597",
      "url": "https://www.zhihu.com/question/2011117101591589597/answer/2074033562387472830?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5552869452242441586",
      "kind": "claim",
      "label": "十年内AI无法完全替代教师，因为教育核心是人对人的影响而非…",
      "fullLabel": "十年内AI无法完全替代教师，因为教育核心是人对人的影响而非信息传递。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 3,
      "topicId": "zh-6947040839",
      "url": "https://www.zhihu.com/question/6947040839/answer/2079246531736220091?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5721180101230092572",
      "kind": "claim",
      "label": "长期看AI会让年轻人机会变少，因此当下应短视务实、赶紧用A…",
      "fullLabel": "长期看AI会让年轻人机会变少，因此当下应短视务实、赶紧用AI做产品。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.6,
      "votes": 3,
      "topicId": "zh-2016930184062789503",
      "url": "https://www.zhihu.com/question/2016930184062789503/answer/2081531451712054893?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3637630978259926288",
      "kind": "claim",
      "label": "护理岗位因其非重复性和高专业化，是最不容易被AI替代的职业…",
      "fullLabel": "护理岗位因其非重复性和高专业化，是最不容易被AI替代的职业之一。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 3,
      "topicId": "zh-2061407637246305107",
      "url": "https://www.zhihu.com/question/2061407637246305107/answer/2061757592242852724?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7994886401338126615",
      "kind": "claim",
      "label": "财务法务岗中可SOP化的部分会被AI取代，但担责签字与灰区…",
      "fullLabel": "财务法务岗中可SOP化的部分会被AI取代，但担责签字与灰区判断反而更值钱。",
      "side": "neutral",
      "reasonType": "责任归属",
      "quality": 0.9,
      "votes": 3,
      "topicId": "zh-2058583113865892735",
      "url": "https://www.zhihu.com/question/2058583113865892735/answer/2078434420642652991?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8964003959406597522",
      "kind": "claim",
      "label": "会计专业并未失去前途，被淘汰的只是低端基础核算岗位。",
      "fullLabel": "会计专业并未失去前途，被淘汰的只是低端基础核算岗位。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.8,
      "votes": 3,
      "topicId": "zh-1923383858025433047",
      "url": "https://www.zhihu.com/question/1923383858025433047/answer/2057882123621623020?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3742988258423484085",
      "kind": "claim",
      "label": "AI正在摧毁影楼、初级编程、客服电销等确定性任务密集的行业…",
      "fullLabel": "AI正在摧毁影楼、初级编程、客服电销等确定性任务密集的行业环节。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 3,
      "topicId": "zh-1951817967785456234",
      "url": "https://www.zhihu.com/question/1951817967785456234/answer/1991443632197215612?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8065255280543916133",
      "kind": "claim",
      "label": "AI让设计行业新人失去入门机会，但成手设计师岗位不会被替代。",
      "fullLabel": "AI让设计行业新人失去入门机会，但成手设计师岗位不会被替代。",
      "side": "neutral",
      "reasonType": "教育培养",
      "quality": 0.85,
      "votes": 3,
      "topicId": "zh-1951817967785456234",
      "url": "https://www.zhihu.com/question/1951817967785456234/answer/1997490204727088212?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3265745577596313635",
      "kind": "claim",
      "label": "出生人口下降导致教师过剩不可逆，普通院校师范专业已不建议报…",
      "fullLabel": "出生人口下降导致教师过剩不可逆，普通院校师范专业已不建议报考。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.8,
      "votes": 3,
      "topicId": "zh-1914986510035452070",
      "url": "https://www.zhihu.com/question/1914986510035452070/answer/2078903343334924903?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-919684638745255504",
      "kind": "claim",
      "label": "师范专业仍然值得报，但未来只有省属师范大学以上层次才具备竞…",
      "fullLabel": "师范专业仍然值得报，但未来只有省属师范大学以上层次才具备竞争力。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.7,
      "votes": 3,
      "topicId": "zh-2051439039954396829",
      "url": "https://www.zhihu.com/question/2051439039954396829/answer/2056819040853800504?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3606585513578338451",
      "kind": "claim",
      "label": "人类不可被AI替代的核心竞争力是为结果承担责任，而非创造力…",
      "fullLabel": "人类不可被AI替代的核心竞争力是为结果承担责任，而非创造力或共情力。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-1977074341968574068",
      "url": "https://www.zhihu.com/question/1977074341968574068/answer/2077759023877730622?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1085208124054752999",
      "kind": "claim",
      "label": "AI不会完全取代码农，因为零散、小批量的开发需求让AI不划…",
      "fullLabel": "AI不会完全取代码农，因为零散、小批量的开发需求让AI不划算。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-2067543311850778736",
      "url": "https://www.zhihu.com/question/2067543311850778736/answer/2067641395045741053?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6589912903194608981",
      "kind": "claim",
      "label": "AI编程抬高了判断能力门槛，只会依赖AI而缺乏判断者将成为…",
      "fullLabel": "AI编程抬高了判断能力门槛，只会依赖AI而缺乏判断者将成为风险源。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 2,
      "topicId": "zh-1931619901778391593",
      "url": "https://www.zhihu.com/question/1931619901778391593/answer/2038886121787102319?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--181767306330084835",
      "kind": "claim",
      "label": "AI替代的不是岗位，而是岗位里可编码的任务模块",
      "fullLabel": "AI替代的不是岗位，而是岗位里可编码的任务模块",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-331578036",
      "url": "https://www.zhihu.com/question/331578036/answer/2082134041197913215?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5681636037622442429",
      "kind": "claim",
      "label": "选专业应看哪个领域社会仍需真人负责、到现场、签字兜底",
      "fullLabel": "选专业应看哪个领域社会仍需真人负责、到现场、签字兜底",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2051829584279106960?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6484353842059278362",
      "kind": "claim",
      "label": "法学不是AI时代的安全专业，AI已能承担大量基础法律工作",
      "fullLabel": "法学不是AI时代的安全专业，AI已能承担大量基础法律工作",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.75,
      "votes": 2,
      "topicId": "zh-2042985698823861883",
      "url": "https://www.zhihu.com/question/2042985698823861883/answer/2052104286759343755?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5495754290005366712",
      "kind": "claim",
      "label": "AI替代的是岗位中可标准化重复的任务，而非整个岗位",
      "fullLabel": "AI替代的是岗位中可标准化重复的任务，而非整个岗位",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-7846729236",
      "url": "https://www.zhihu.com/question/7846729236/answer/2074829737436909790?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--221707673298804513",
      "kind": "claim",
      "label": "机器翻译的错误恰好集中在专业术语、歧义句和文化梗等翻错就出…",
      "fullLabel": "机器翻译的错误恰好集中在专业术语、歧义句和文化梗等翻错就出大事的地方，因此翻译员不可被取代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-1929576321450751480",
      "url": "https://www.zhihu.com/question/1929576321450751480/answer/2074179696577755015?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4587934715750170607",
      "kind": "claim",
      "label": "AI 降低了做出软件的门槛，却没有同比例降低把软件做到复杂…",
      "fullLabel": "AI 降低了做出软件的门槛，却没有同比例降低把软件做到复杂可靠可维护的门槛，因此编程学习依然有价值。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.9,
      "votes": 2,
      "topicId": "zh-2075618575495197313",
      "url": "https://www.zhihu.com/question/2075618575495197313/answer/2075655773254959438?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4244626890762322403",
      "kind": "claim",
      "label": "绘圈对 AI 的激烈抵制，源于图片风格易被识别、产能数量级…",
      "fullLabel": "绘圈对 AI 的激烈抵制，源于图片风格易被识别、产能数量级放大且缺乏行业规则缓冲，而非单纯情绪化。",
      "side": "neutral",
      "reasonType": "行业周期",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-1941132414425495417",
      "url": "https://www.zhihu.com/question/1941132414425495417/answer/2060737676563813751?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6020112849420017675",
      "kind": "claim",
      "label": "中小学存在大量缺乏自控力的学生，AI 无法承担育人职责，因…",
      "fullLabel": "中小学存在大量缺乏自控力的学生，AI 无法承担育人职责，因此不能取代中小学教师。",
      "side": "negative",
      "reasonType": "教育培养",
      "quality": 0.7,
      "votes": 2,
      "topicId": "zh-661199186",
      "url": "https://www.zhihu.com/question/661199186/answer/2082735937147106557?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1858274713642811231",
      "kind": "claim",
      "label": "AI能提供知识，但无法替代教师给予学生被看见的情感陪伴价值。",
      "fullLabel": "AI能提供知识，但无法替代教师给予学生被看见的情感陪伴价值。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-10241549244",
      "url": "https://www.zhihu.com/question/10241549244/answer/2080670850576037402?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4769695036315054845",
      "kind": "claim",
      "label": "AI受限于实体无法完成查体问诊，且训练使用成本远高于人类医…",
      "fullLabel": "AI受限于实体无法完成查体问诊，且训练使用成本远高于人类医生。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-2069490435995832397",
      "url": "https://www.zhihu.com/question/2069490435995832397/answer/2074202727551341365?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1289976677312429097",
      "kind": "claim",
      "label": "AI擅长整理病例和列鉴别诊断，但无法应对真实门诊的突发与模…",
      "fullLabel": "AI擅长整理病例和列鉴别诊断，但无法应对真实门诊的突发与模糊信息。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.75,
      "votes": 2,
      "topicId": "zh-2020545061792792654",
      "url": "https://www.zhihu.com/question/2020545061792792654/answer/2076874628232910825?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7611596246177389232",
      "kind": "claim",
      "label": "AI在医疗细分场景纵深不足，且出事故的责任归属无法解决，故…",
      "fullLabel": "AI在医疗细分场景纵深不足，且出事故的责任归属无法解决，故不会取代医生。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-12085658931",
      "url": "https://www.zhihu.com/question/12085658931/answer/2074850544695371340?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3306544196844106705",
      "kind": "claim",
      "label": "大模型基础诊断错误率约20%且会幻觉，无法规避漏诊误诊，故…",
      "fullLabel": "大模型基础诊断错误率约20%且会幻觉，无法规避漏诊误诊，故不能取代医生。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-11507128017",
      "url": "https://www.zhihu.com/question/11507128017/answer/2077770274813093881?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6126823911250599595",
      "kind": "claim",
      "label": "程序员、司机、教师、医生等依赖经验与安全的职业，AI只能辅…",
      "fullLabel": "程序员、司机、教师、医生等依赖经验与安全的职业，AI只能辅助不能取代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.5,
      "votes": 2,
      "topicId": "zh-2081895865921299074",
      "url": "https://www.zhihu.com/question/2081895865921299074/answer/2082127273977763069?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2034176194713719016",
      "kind": "claim",
      "label": "AI取代普通劳动者岗位是技术演进的必然，与道德争议无关",
      "fullLabel": "AI取代普通劳动者岗位是技术演进的必然，与道德争议无关",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.75,
      "votes": 2,
      "topicId": "zh-661271928",
      "url": "https://www.zhihu.com/question/661271928/answer/2034160786529055570?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-488001093571781838",
      "kind": "claim",
      "label": "AI已在系统性取代人类生产性工作，且这一进程不可逆转",
      "fullLabel": "AI已在系统性取代人类生产性工作，且这一进程不可逆转",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.7,
      "votes": 2,
      "topicId": "zh-6782975731",
      "url": "https://www.zhihu.com/question/6782975731/answer/2065498434396861932?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3864455554413364231",
      "kind": "claim",
      "label": "AI冲击的首要是白领岗位，低端体力劳动反而因成本不划算而更…",
      "fullLabel": "AI冲击的首要是白领岗位，低端体力劳动反而因成本不划算而更安全",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-661317726",
      "url": "https://www.zhihu.com/question/661317726/answer/2002760247773795228?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5944933426587561641",
      "kind": "claim",
      "label": "会计的核心竞争力在于懂业务做判断，而非比AI更会算账",
      "fullLabel": "会计的核心竞争力在于懂业务做判断，而非比AI更会算账",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-2030670762495972103",
      "url": "https://www.zhihu.com/question/2030670762495972103/answer/2077809052478871233?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-9061874944177274305",
      "kind": "claim",
      "label": "AI能发现数据差异，但只有人能核实事实并判断差异的真实含义",
      "fullLabel": "AI能发现数据差异，但只有人能核实事实并判断差异的真实含义",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-2030670762495972103",
      "url": "https://www.zhihu.com/question/2030670762495972103/answer/2068236363825166315?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4582466702302758498",
      "kind": "claim",
      "label": "会计行业整体难以被AI取代，但应届会计毕业生很快会被取代",
      "fullLabel": "会计行业整体难以被AI取代，但应届会计毕业生很快会被取代",
      "side": "neutral",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 2,
      "topicId": "zh-2077075555535605889",
      "url": "https://www.zhihu.com/question/2077075555535605889/answer/2077125041909716282?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3822579795580553431",
      "kind": "claim",
      "label": "AI会大幅取代记录型会计岗位，但判断型会计因需业务判断而不…",
      "fullLabel": "AI会大幅取代记录型会计岗位，但判断型会计因需业务判断而不可替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-2048163712138211470",
      "url": "https://www.zhihu.com/question/2048163712138211470/answer/2073462917329053504?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8469733164666249423",
      "kind": "claim",
      "label": "AI不会取代自媒体人，但会用AI的自媒体人将取代不会用AI…",
      "fullLabel": "AI不会取代自媒体人，但会用AI的自媒体人将取代不会用AI的人。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-2049934861817869718",
      "url": "https://www.zhihu.com/question/2049934861817869718/answer/2074287572172403231?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2480978703748265328",
      "kind": "claim",
      "label": "AI会淘汰纯搬运和同质化自媒体，但真人信任纽带使其无法取代…",
      "fullLabel": "AI会淘汰纯搬运和同质化自媒体，但真人信任纽带使其无法取代优质创作者。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 2,
      "topicId": "zh-635329472",
      "url": "https://www.zhihu.com/question/635329472/answer/2026812326351741600?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3507469898199004231",
      "kind": "claim",
      "label": "AI擅长检索和案例分析，但律师因真实案件证据链复杂而难以被…",
      "fullLabel": "AI擅长检索和案例分析，但律师因真实案件证据链复杂而难以被替代。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.75,
      "votes": 2,
      "topicId": "zh-2032572036879476358",
      "url": "https://www.zhihu.com/question/2032572036879476358/answer/2073356617391805690?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7570075034349265",
      "kind": "claim",
      "label": "机器人将逐步替代护士岗位，如同炒菜机器人已取代人类厨师一样。",
      "fullLabel": "机器人将逐步替代护士岗位，如同炒菜机器人已取代人类厨师一样。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.4,
      "votes": 2,
      "topicId": "zh-2040875811226510078",
      "url": "https://www.zhihu.com/question/2040875811226510078/answer/2055428079011550627?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6298885924988383459",
      "kind": "claim",
      "label": "普通二本师范生不应报考师范专业，因为市区主科编制上岸率不足…",
      "fullLabel": "普通二本师范生不应报考师范专业，因为市区主科编制上岸率不足10%。",
      "side": "negative",
      "reasonType": "行业周期",
      "quality": 0.85,
      "votes": 2,
      "topicId": "zh-1914986510035452070",
      "url": "https://www.zhihu.com/question/1914986510035452070/answer/2079131459927926035?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4560790726606256329",
      "kind": "claim",
      "label": "AI时代大学生仍应学编程，但重点应从写代码转向指挥AI和审…",
      "fullLabel": "AI时代大学生仍应学编程，但重点应从写代码转向指挥AI和审查AI产出。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-2066911604235571824",
      "url": "https://www.zhihu.com/question/2066911604235571824/answer/2080358985711073237?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8201144425862317631",
      "kind": "claim",
      "label": "AI替代的是标准化任务而非完整岗位，真正被淘汰的是不会驾驭…",
      "fullLabel": "AI替代的是标准化任务而非完整岗位，真正被淘汰的是不会驾驭AI的人。",
      "side": "neutral",
      "reasonType": "人类特质",
      "quality": 0.75,
      "votes": 1,
      "topicId": "zh-2058927476735321115",
      "url": "https://www.zhihu.com/question/2058927476735321115/answer/2075590453743849834?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7578589222068007825",
      "kind": "claim",
      "label": "人类的核心竞争力在于承担责任、提出问题与试错创造，这些AI…",
      "fullLabel": "人类的核心竞争力在于承担责任、提出问题与试错创造，这些AI无法替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-1977074341968574068",
      "url": "https://www.zhihu.com/question/1977074341968574068/answer/2076334893332698805?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6530814464955242070",
      "kind": "claim",
      "label": "AI编程不会取代程序员，但会淘汰只会把需求翻译成代码的初级…",
      "fullLabel": "AI编程不会取代程序员，但会淘汰只会把需求翻译成代码的初级程序员。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-1962444467077358693",
      "url": "https://www.zhihu.com/question/1962444467077358693/answer/2078157889538151442?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1669107637240250258",
      "kind": "claim",
      "label": "AI不会完全取代码农，因为使用AI需付费且不保证结果正确。",
      "fullLabel": "AI不会完全取代码农，因为使用AI需付费且不保证结果正确。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.4,
      "votes": 1,
      "topicId": "zh-2067543311850778736",
      "url": "https://www.zhihu.com/question/2067543311850778736/answer/2067590453822748018?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7503358984877483228",
      "kind": "claim",
      "label": "AI不会减少泛创作岗位，反而会因甲方要求膨胀而加重工作量",
      "fullLabel": "AI不会减少泛创作岗位，反而会因甲方要求膨胀而加重工作量",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-568804205",
      "url": "https://www.zhihu.com/question/568804205/answer/3372924264?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8838710980769306924",
      "kind": "claim",
      "label": "AI已能替代大部分平面原画工作，但三年内无法替代逐帧动画原画",
      "fullLabel": "AI已能替代大部分平面原画工作，但三年内无法替代逐帧动画原画",
      "side": "neutral",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/2049653571860292529?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--9082679415443766728",
      "kind": "claim",
      "label": "AI绘画难以取代板绘，因为多数使用者无法充分发挥AI能力",
      "fullLabel": "AI绘画难以取代板绘，因为多数使用者无法充分发挥AI能力",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.6,
      "votes": 1,
      "topicId": "zh-1947363304684119143",
      "url": "https://www.zhihu.com/question/1947363304684119143/answer/2076422327353582266?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5100637066742598916",
      "kind": "claim",
      "label": "AI翻译在文档翻译任务上已达95分，人工翻译价值被大幅压缩",
      "fullLabel": "AI翻译在文档翻译任务上已达95分，人工翻译价值被大幅压缩",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-284641712",
      "url": "https://www.zhihu.com/question/284641712/answer/2068418693231596048?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8312072853190959879",
      "kind": "claim",
      "label": "通用AI难以完全取代人工翻译，因翻译本质是理解语境而非对齐…",
      "fullLabel": "通用AI难以完全取代人工翻译，因翻译本质是理解语境而非对齐单词",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.7,
      "votes": 1,
      "topicId": "zh-284641712",
      "url": "https://www.zhihu.com/question/284641712/answer/2045557097744668648?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7599739875221353597",
      "kind": "claim",
      "label": "AI编程智能体已彻底摧毁普通技术人员的护城河，软件技术与业…",
      "fullLabel": "AI编程智能体已彻底摧毁普通技术人员的护城河，软件技术与业务理解都不再构成壁垒。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.6,
      "votes": 1,
      "topicId": "zh-1953096742175224404",
      "url": "https://www.zhihu.com/question/1953096742175224404/answer/2080792571593352952?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1942145208452854170",
      "kind": "claim",
      "label": "AI冲击的是设计流程中靠手速换钱的中间环节，而非设计师本身。",
      "fullLabel": "AI冲击的是设计流程中靠手速换钱的中间环节，而非设计师本身。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-2070102488355714670",
      "url": "https://www.zhihu.com/question/2070102488355714670/answer/2070810739460289766?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6166414108175052214",
      "kind": "claim",
      "label": "AI时代程序员的核心竞争力已从编码速度转向编排AI与设计软…",
      "fullLabel": "AI时代程序员的核心竞争力已从编码速度转向编排AI与设计软件产线的能力。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-2056781761565159896",
      "url": "https://www.zhihu.com/question/2056781761565159896/answer/2073823294877329043?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4342822993392195980",
      "kind": "claim",
      "label": "AI只简化了写代码步骤，定义业务需求与拆解问题的能力仍必须…",
      "fullLabel": "AI只简化了写代码步骤，定义业务需求与拆解问题的能力仍必须由人掌握。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-1984265501115958721",
      "url": "https://www.zhihu.com/question/1984265501115958721/answer/2076084047604982372?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-3689494951822758440",
      "kind": "claim",
      "label": "AI降低了编程实现门槛，但判断与拆解问题的能力仍需人类学习…",
      "fullLabel": "AI降低了编程实现门槛，但判断与拆解问题的能力仍需人类学习，普通人仍应学编程思维。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-2059300946514023724",
      "url": "https://www.zhihu.com/question/2059300946514023724/answer/2074541689855911899?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6414495363497439116",
      "kind": "claim",
      "label": "十年内AI不会完全替代教师，但不会用AI的教师会被会用AI…",
      "fullLabel": "十年内AI不会完全替代教师，但不会用AI的教师会被会用AI的教师替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-6947040839",
      "url": "https://www.zhihu.com/question/6947040839/answer/2081356831247675691?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5590514558985009122",
      "kind": "claim",
      "label": "传统教师90%的教学精力浪费在低效知识灌输上，AI可替代预…",
      "fullLabel": "传统教师90%的教学精力浪费在低效知识灌输上，AI可替代预训练环节，教师角色必须重构。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.75,
      "votes": 1,
      "topicId": "zh-6947040839",
      "url": "https://www.zhihu.com/question/6947040839/answer/2079304813657977158?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6906703058234603657",
      "kind": "claim",
      "label": "AI只能做超级助教完成授业解惑，但传道与情感陪伴必须由人类…",
      "fullLabel": "AI只能做超级助教完成授业解惑，但传道与情感陪伴必须由人类教师承担，无法被替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-6947040839",
      "url": "https://www.zhihu.com/question/6947040839/answer/2080041976007808460?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8040323482570605366",
      "kind": "claim",
      "label": "医疗设备与AI只能当医生的超级助手，诊断所需的综合判断与信…",
      "fullLabel": "医疗设备与AI只能当医生的超级助手，诊断所需的综合判断与信任关系无法被机器替代。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-11373689229",
      "url": "https://www.zhihu.com/question/11373689229/answer/2078218383653351557?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3455695536040532606",
      "kind": "claim",
      "label": "医疗AI缺乏双层透明度机制，患者知情与否全凭运气，无法建立…",
      "fullLabel": "医疗AI缺乏双层透明度机制，患者知情与否全凭运气，无法建立真正的问责基础。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-612845174",
      "url": "https://www.zhihu.com/question/612845174/answer/2081733253858334045?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--4941960030255857488",
      "kind": "claim",
      "label": "AI在医疗领域应走赋能路线而非替代路线，最终决策权必须保留…",
      "fullLabel": "AI在医疗领域应走赋能路线而非替代路线，最终决策权必须保留在医生手中。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-2053791549629129105",
      "url": "https://www.zhihu.com/question/2053791549629129105/answer/2074219916752860573?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8901983278655544963",
      "kind": "claim",
      "label": "AI已在2026年大规模替代初级知识岗位，被替代者事前都误…",
      "fullLabel": "AI已在2026年大规模替代初级知识岗位，被替代者事前都误以为自己安全。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.75,
      "votes": 1,
      "topicId": "zh-2019355746328932969",
      "url": "https://www.zhihu.com/question/2019355746328932969/answer/2067720148350414994?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--496304328253731260",
      "kind": "claim",
      "label": "AI替代司机、外卖员等底层岗位是科技进步的必然结果，应拥抱…",
      "fullLabel": "AI替代司机、外卖员等底层岗位是科技进步的必然结果，应拥抱变化而非抵制。",
      "side": "positive",
      "reasonType": "行业周期",
      "quality": 0.7,
      "votes": 1,
      "topicId": "zh-661271928",
      "url": "https://www.zhihu.com/question/661271928/answer/55317126644?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--3241830959968835068",
      "kind": "claim",
      "label": "AI冲击就业的真正方式是让企业相信更少人加AI也能运转，从…",
      "fullLabel": "AI冲击就业的真正方式是让企业相信更少人加AI也能运转，从而冻结招聘而非直接裁员。",
      "side": "positive",
      "reasonType": "成本经济",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-661317726",
      "url": "https://www.zhihu.com/question/661317726/answer/2070194822485430573?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-184393152028876286",
      "kind": "claim",
      "label": "AI冲击最严重的不是低端工作，而是规则清晰、输入输出明确的…",
      "fullLabel": "AI冲击最严重的不是低端工作，而是规则清晰、输入输出明确的初级知识工作。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-2072683028829009863",
      "url": "https://www.zhihu.com/question/2072683028829009863/answer/2072697344823448929?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--5871390188075001269",
      "kind": "claim",
      "label": "AI只能替代会计中标准化重复的工作，涉及政策判断与风险权衡…",
      "fullLabel": "AI只能替代会计中标准化重复的工作，涉及政策判断与风险权衡的财务判断者不会被取代。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-2030670762495972103",
      "url": "https://www.zhihu.com/question/2030670762495972103/answer/2076658508175618634?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1570016932397432084",
      "kind": "claim",
      "label": "AI时代会计的基础核算岗位会进一步缩减，但背锅与内控职能仍…",
      "fullLabel": "AI时代会计的基础核算岗位会进一步缩减，但背锅与内控职能仍须由人承担。",
      "side": "positive",
      "reasonType": "责任归属",
      "quality": 0.7,
      "votes": 1,
      "topicId": "zh-2048163712138211470",
      "url": "https://www.zhihu.com/question/2048163712138211470/answer/2070207128284009623?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--8908141187348267597",
      "kind": "claim",
      "label": "AI能生产内容却无法替人建立信任，因此自媒体人的个人IP不…",
      "fullLabel": "AI能生产内容却无法替人建立信任，因此自媒体人的个人IP不会被取代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.8,
      "votes": 1,
      "topicId": "zh-635329472",
      "url": "https://www.zhihu.com/question/635329472/answer/2064275255665881586?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--1544821425531467936",
      "kind": "claim",
      "label": "法律规则缺乏标准化且存在地区差异，因此AI无法完成律师的全…",
      "fullLabel": "法律规则缺乏标准化且存在地区差异，因此AI无法完成律师的全部工作。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.75,
      "votes": 1,
      "topicId": "zh-452243069",
      "url": "https://www.zhihu.com/question/452243069/answer/2078504040745398888?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-1564466387070499726",
      "kind": "claim",
      "label": "AI只取代财务中规则固定的重复工作，判断与担责部分仍是人类…",
      "fullLabel": "AI只取代财务中规则固定的重复工作，判断与担责部分仍是人类护城河。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.85,
      "votes": 1,
      "topicId": "zh-2073408615956985818",
      "url": "https://www.zhihu.com/question/2073408615956985818/answer/2073734871109858336?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2059609074143167601",
      "kind": "claim",
      "label": "AI未取代程序员，因为编程的本质是为结果负责而非写代码。",
      "fullLabel": "AI未取代程序员，因为编程的本质是为结果负责而非写代码。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.9,
      "votes": 0,
      "topicId": "zh-1972252087044796716",
      "url": "https://www.zhihu.com/question/1972252087044796716/answer/2082599540432041903?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6845785434957152205",
      "kind": "claim",
      "label": "AI正按任务逐块取代程序员工作，但整个职业短期内不会被取代。",
      "fullLabel": "AI正按任务逐块取代程序员工作，但整个职业短期内不会被取代。",
      "side": "neutral",
      "reasonType": "技术壁垒",
      "quality": 0.8,
      "votes": 0,
      "topicId": "zh-2038411932424725710",
      "url": "https://www.zhihu.com/question/2038411932424725710/answer/2075613164205618947?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4345301056514331697",
      "kind": "claim",
      "label": "AI能写出整个代码库，但设计决策与判断力仍必须由人类主导。",
      "fullLabel": "AI能写出整个代码库，但设计决策与判断力仍必须由人类主导。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-2052608342816715544",
      "url": "https://www.zhihu.com/question/2052608342816715544/answer/2078369208509977032?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7694646029523666707",
      "kind": "claim",
      "label": "AI时代学习编程语言仍有必要，但只需掌握基础而非死磕技术。",
      "fullLabel": "AI时代学习编程语言仍有必要，但只需掌握基础而非死磕技术。",
      "side": "negative",
      "reasonType": "教育培养",
      "quality": 0.6,
      "votes": 0,
      "topicId": "zh-2081685100555677809",
      "url": "https://www.zhihu.com/question/2081685100555677809/answer/2081688569555464603?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6230768604688732246",
      "kind": "claim",
      "label": "AI不会完全替代设计师，设计师应把重复设计沉淀为数字资产。",
      "fullLabel": "AI不会完全替代设计师，设计师应把重复设计沉淀为数字资产。",
      "side": "negative",
      "reasonType": "成本经济",
      "quality": 0.7,
      "votes": 0,
      "topicId": "zh-604703607",
      "url": "https://www.zhihu.com/question/604703607/answer/2081779356519641141?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7940648025065138231",
      "kind": "claim",
      "label": "AI取代的不是设计师，而是设计流程中的执行体力段，判断与提…",
      "fullLabel": "AI取代的不是设计师，而是设计流程中的执行体力段，判断与提问环节仍不可替代。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-1902746889251721780",
      "url": "https://www.zhihu.com/question/1902746889251721780/answer/2076334040039408413?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-4998779688670138215",
      "kind": "claim",
      "label": "AI正在抽走设计职业梯子的最底层，导致新手失去循序渐进的成…",
      "fullLabel": "AI正在抽走设计职业梯子的最底层，导致新手失去循序渐进的成长路径。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.8,
      "votes": 0,
      "topicId": "zh-1902746889251721780",
      "url": "https://www.zhihu.com/question/1902746889251721780/answer/2081427573796619991?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--6165004185748888693",
      "kind": "claim",
      "label": "AI编程无法取代码农，只有掌握AI的人才会取代不会用AI的…",
      "fullLabel": "AI编程无法取代码农，只有掌握AI的人才会取代不会用AI的人。",
      "side": "negative",
      "reasonType": "技术壁垒",
      "quality": 0.65,
      "votes": 0,
      "topicId": "zh-1931619901778391593",
      "url": "https://www.zhihu.com/question/1931619901778391593/answer/1949113822917919015?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--832584820767287079",
      "kind": "claim",
      "label": "AI永远只能基于二手信息，无法获得第一手感官体验，因此代替…",
      "fullLabel": "AI永远只能基于二手信息，无法获得第一手感官体验，因此代替不了画师。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 0,
      "topicId": "zh-7712128783",
      "url": "https://www.zhihu.com/question/7712128783/answer/2082570723437168035?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7698897246818580850",
      "kind": "claim",
      "label": "AI只能做标准化执行，文案运营者的壁垒在于需求解码、共情洞…",
      "fullLabel": "AI只能做标准化执行，文案运营者的壁垒在于需求解码、共情洞察与事实核验。",
      "side": "negative",
      "reasonType": "需求本质",
      "quality": 0.75,
      "votes": 0,
      "topicId": "zh-2080650408108746685",
      "url": "https://www.zhihu.com/question/2080650408108746685/answer/2080704411853133808?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-8951187066600538619",
      "kind": "claim",
      "label": "AI取代的不是技术人，而是只会写代码、缺乏判断力的技术人。",
      "fullLabel": "AI取代的不是技术人，而是只会写代码、缺乏判断力的技术人。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-1953096742175224404",
      "url": "https://www.zhihu.com/question/1953096742175224404/answer/2079132867297390963?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-2846293786060691993",
      "kind": "claim",
      "label": "AI时代仍必须学编程，因为验收与问题拆解能力无法被替代。",
      "fullLabel": "AI时代仍必须学编程，因为验收与问题拆解能力无法被替代。",
      "side": "negative",
      "reasonType": "教育培养",
      "quality": 0.8,
      "votes": 0,
      "topicId": "zh-2009262232622609492",
      "url": "https://www.zhihu.com/question/2009262232622609492/answer/2076738811975971814?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-7004945397760571224",
      "kind": "claim",
      "label": "AI让写代码速度不再稀缺，做对决策的人才能成为新的10x工…",
      "fullLabel": "AI让写代码速度不再稀缺，做对决策的人才能成为新的10x工程师。",
      "side": "positive",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-2059300946514023724",
      "url": "https://www.zhihu.com/question/2059300946514023724/answer/2059401397435622630?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--394543835087671442",
      "kind": "claim",
      "label": "AI无法取代中小学教师，因为情绪价值和责任承担是AI难以替…",
      "fullLabel": "AI无法取代中小学教师，因为情绪价值和责任承担是AI难以替代的核心能力。",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-661199186",
      "url": "https://www.zhihu.com/question/661199186/answer/2082605608952452477?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-6558078831559221404",
      "kind": "claim",
      "label": "人际依赖度低且容错率高的创造性工作更容易被AI取代。",
      "fullLabel": "人际依赖度低且容错率高的创造性工作更容易被AI取代。",
      "side": "positive",
      "reasonType": "需求本质",
      "quality": 0.8,
      "votes": 0,
      "topicId": "zh-639997162",
      "url": "https://www.zhihu.com/question/639997162/answer/3408713336?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--9033255501595148655",
      "kind": "claim",
      "label": "AI智能客服不应完全替代人工，而应定位为辅助人工提升效率的…",
      "fullLabel": "AI智能客服不应完全替代人工，而应定位为辅助人工提升效率的工具。",
      "side": "negative",
      "reasonType": "责任归属",
      "quality": 0.75,
      "votes": 0,
      "topicId": "zh-496888426",
      "url": "https://www.zhihu.com/question/496888426/answer/2081380936726353087?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--7293893386129685681",
      "kind": "claim",
      "label": "AI冲击下基础会计工作正被取代，但会用AI的高端会计人才反…",
      "fullLabel": "AI冲击下基础会计工作正被取代，但会用AI的高端会计人才反而更紧缺。",
      "side": "positive",
      "reasonType": "教育培养",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-1892491048032396428",
      "url": "https://www.zhihu.com/question/1892491048032396428/answer/2082378875439420057?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a-5608855948732439865",
      "kind": "claim",
      "label": "AI取代不了律师，但正在取代律师工作中可被文本化的那部分。",
      "fullLabel": "AI取代不了律师，但正在取代律师工作中可被文本化的那部分。",
      "side": "neutral",
      "reasonType": "技术壁垒",
      "quality": 0.85,
      "votes": 0,
      "topicId": "zh-452243069",
      "url": "https://www.zhihu.com/question/452243069/answer/2068285359729928165?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "a--579030165460407009",
      "kind": "claim",
      "label": "师范训练培养的表达与共情能力是AI短期无法替代的护城河",
      "fullLabel": "师范训练培养的表达与共情能力是AI短期无法替代的护城河",
      "side": "negative",
      "reasonType": "人类特质",
      "quality": 0.7,
      "votes": 0,
      "topicId": "zh-1914986510035452070",
      "url": "https://www.zhihu.com/question/1914986510035452070/answer/2079615271690684377?utm_medium=openapi_platform&utm_source=cf621feb3f2d"
    },
    {
      "id": "cl-ai-not-reduce-jobs",
      "kind": "cluster",
      "label": "AI不减少岗位",
      "summary": "AI不会导致岗位总量减少或大规模失业",
      "side": "positive",
      "weight": 2,
      "topicCount": 4
    },
    {
      "id": "cl-ai-replace-execution-only",
      "kind": "cluster",
      "label": "AI只替代执行环节",
      "summary": "AI只替代执行环节，不替代核心判断",
      "side": "neutral",
      "weight": 8,
      "topicCount": 8
    },
    {
      "id": "cl-ai-cannot-replace-professional-painters",
      "kind": "cluster",
      "label": "AI无法替代专业画师",
      "summary": "AI无法替代专业画师",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-eliminate-low-end-not-professional",
      "kind": "cluster",
      "label": "AI淘汰低端不淘汰专业",
      "summary": "AI淘汰低端，不淘汰专业",
      "side": "positive",
      "weight": 5,
      "topicCount": 6
    },
    {
      "id": "cl-ai-eliminate-mechanical-not-thinkers",
      "kind": "cluster",
      "label": "AI淘汰机械执行不淘汰思考者",
      "summary": "AI淘汰机械执行，不淘汰思考者",
      "side": "positive",
      "weight": 5,
      "topicCount": 6
    },
    {
      "id": "cl-ai-eliminate-non-growers",
      "kind": "cluster",
      "label": "AI淘汰不成长者非职业",
      "summary": "AI淘汰不成长者，而非职业",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-eliminate-standardized-output",
      "kind": "cluster",
      "label": "AI淘汰标准化输出者",
      "summary": "AI淘汰标准化输出者",
      "side": "negative",
      "weight": 3,
      "topicCount": 3
    },
    {
      "id": "cl-ai-replace-standardized-not-core",
      "kind": "cluster",
      "label": "AI替代标准化非核心能力",
      "summary": "AI替代标准化非核心能力",
      "side": "neutral",
      "weight": 6,
      "topicCount": 4
    },
    {
      "id": "cl-human-emotion-creativity-irreplaceable",
      "kind": "cluster",
      "label": "人类情感创造力不可替代",
      "summary": "人类情感创造力不可替代",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-cannot-replace-human-exclusive-jobs",
      "kind": "cluster",
      "label": "AI无法替代人类专属职业",
      "summary": "AI无法替代人类专属职业",
      "side": "positive",
      "weight": 14,
      "topicCount": 6
    },
    {
      "id": "cl-ai-replace-tasks-not-jobs",
      "kind": "cluster",
      "label": "AI替代任务非完整岗位",
      "summary": "AI替代任务而非完整岗位",
      "side": "neutral",
      "weight": 8,
      "topicCount": 7
    },
    {
      "id": "cl-ai-will-replace-programmers",
      "kind": "cluster",
      "label": "AI将替代程序员",
      "summary": "AI将替代程序员",
      "side": "negative",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-cannot-fully-replace-professional-roles",
      "kind": "cluster",
      "label": "AI当前无法完全替代专业岗位",
      "summary": "AI当前无法完全替代专业岗位",
      "side": "positive",
      "weight": 4,
      "topicCount": 5
    },
    {
      "id": "cl-ai-compress-entry-level-not-industry",
      "kind": "cluster",
      "label": "AI压缩初级岗位但行业不消失",
      "summary": "AI压缩初级岗位但行业不消失",
      "side": "neutral",
      "weight": 2,
      "topicCount": 2
    },
    {
      "id": "cl-ai-cannot-do-system-design",
      "kind": "cluster",
      "label": "AI无法胜任系统设计",
      "summary": "AI无法胜任系统设计",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-cannot-complete-complex-tasks",
      "kind": "cluster",
      "label": "AI无法独立完成复杂任务",
      "summary": "AI无法独立完成复杂任务",
      "side": "positive",
      "weight": 4,
      "topicCount": 4
    },
    {
      "id": "cl-ai-cannot-fully-replace-programming",
      "kind": "cluster",
      "label": "AI无法完全取代编程",
      "summary": "AI无法完全取代编程",
      "side": "positive",
      "weight": 5,
      "topicCount": 5
    },
    {
      "id": "cl-ai-cannot-do-architecture-design",
      "kind": "cluster",
      "label": "AI无法独立完成架构设计",
      "summary": "AI无法独立完成架构设计",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-cannot-write-professional-software",
      "kind": "cluster",
      "label": "AI无法独立编写专业软件",
      "summary": "AI无法独立编写专业软件",
      "side": "positive",
      "weight": 4,
      "topicCount": 5
    },
    {
      "id": "cl-still-need-learn-programming",
      "kind": "cluster",
      "label": "AI时代仍需学编程",
      "summary": "AI时代仍需学编程",
      "side": "positive",
      "weight": 4,
      "topicCount": 4
    },
    {
      "id": "cl-ai-deprives-newcomer-entry",
      "kind": "cluster",
      "label": "AI剥夺新人入门机会",
      "summary": "AI剥夺新人入门机会",
      "side": "negative",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-programming-still-needed-but-basics",
      "kind": "cluster",
      "label": "编程仍要学但重基础",
      "summary": "编程仍要学但重基础",
      "side": "positive",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-replace-painters-amplify-programmers",
      "kind": "cluster",
      "label": "AI替代画师放大程序员",
      "summary": "AI替代画师放大程序员",
      "side": "neutral",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-replace-standardized-task-modules",
      "kind": "cluster",
      "label": "AI只替代标准化任务模块",
      "summary": "AI只替代标准化任务模块",
      "side": "neutral",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-hard-real-scenario-fuzzy-info",
      "kind": "cluster",
      "label": "AI难应对真实场景模糊信息",
      "summary": "AI难应对真实场景模糊信息",
      "side": "positive",
      "weight": 5,
      "topicCount": 6
    },
    {
      "id": "cl-ai-hard-real-scenario-complex-info",
      "kind": "cluster",
      "label": "AI难应对真实场景复杂信息",
      "summary": "AI难应对真实场景复杂信息",
      "side": "positive",
      "weight": 6,
      "topicCount": 7
    },
    {
      "id": "cl-ai-hard-replace-context-understanding",
      "kind": "cluster",
      "label": "AI难替代需语境理解的工作",
      "summary": "AI难替代需语境理解的工作",
      "side": "positive",
      "weight": 7,
      "topicCount": 8
    },
    {
      "id": "cl-ai-only-replace-repetitive-work",
      "kind": "cluster",
      "label": "AI只替代重复性工作",
      "summary": "AI只替代重复性工作",
      "side": "neutral",
      "weight": 2,
      "topicCount": 3
    },
    {
      "id": "cl-ai-replace-execution-not-responsibility",
      "kind": "cluster",
      "label": "AI只替代执行层不替代担责层",
      "summary": "AI只替代执行层不替代担责层",
      "side": "positive",
      "weight": 9,
      "topicCount": 6
    },
    {
      "id": "cl-ai-cannot-replace-responsibility-judgment",
      "kind": "cluster",
      "label": "AI无法替代担责与判断角色",
      "summary": "AI无法替代担责与判断角色",
      "side": "positive",
      "weight": 9,
      "topicCount": 5
    },
    {
      "id": "cl-doctors-irreplaceable-due-responsibility",
      "kind": "cluster",
      "label": "医生不可替代因责任兜底",
      "summary": "医生不可替代因责任兜底",
      "side": "positive",
      "weight": 3,
      "topicCount": 2
    },
    {
      "id": "cl-ai-replace-execution-not-responsibility-2",
      "kind": "cluster",
      "label": "AI替代执行不替代担责",
      "summary": "AI替代执行不替代担责",
      "side": "positive",
      "weight": 6,
      "topicCount": 4
    },
    {
      "id": "cl-responsibility-attribution-blocks-ai",
      "kind": "cluster",
      "label": "责任归属阻碍AI取代",
      "summary": "责任归属阻碍AI取代",
      "side": "positive",
      "weight": 3,
      "topicCount": 4
    },
    {
      "id": "cl-ai-assists-human-responsibility",
      "kind": "cluster",
      "label": "AI辅助人担责",
      "summary": "AI辅助人担责",
      "side": "positive",
      "weight": 5,
      "topicCount": 6
    },
    {
      "id": "cl-ai-assistant-not-replacement",
      "kind": "cluster",
      "label": "AI是助手非替代",
      "summary": "AI是助手非替代",
      "side": "positive",
      "weight": 4,
      "topicCount": 5
    },
    {
      "id": "cl-lack-accountability-blocks-replacement",
      "kind": "cluster",
      "label": "问责基础缺失阻碍替代",
      "summary": "问责基础缺失阻碍替代",
      "side": "positive",
      "weight": 6,
      "topicCount": 7
    },
    {
      "id": "cl-ai-replace-execution-not-judgment",
      "kind": "cluster",
      "label": "AI只替代执行不替代判断",
      "summary": "AI只替代执行不替代判断",
      "side": "positive",
      "weight": 5,
      "topicCount": 4
    },
    {
      "id": "cl-ai-not-replace-responsibility-roles",
      "kind": "cluster",
      "label": "AI不替代需担责的人类角色",
      "summary": "AI不替代需担责的人类角色",
      "side": "positive",
      "weight": 5,
      "topicCount": 6
    },
    {
      "id": "cl-ai-should-assist-not-replace",
      "kind": "cluster",
      "label": "AI应辅助而非替代人类",
      "summary": "AI应辅助而非替代人类",
      "side": "positive",
      "weight": 4,
      "topicCount": 5
    }
  ],
  "edges": [
    {
      "source": "zh-2017996212544960495",
      "target": "a-777188139641830549",
      "relation": "contains"
    },
    {
      "source": "zh-1941132414425495417",
      "target": "a--5713819934268214727",
      "relation": "contains"
    },
    {
      "source": "zh-593275984",
      "target": "a-7011770996733503369",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a--4240131651699878760",
      "relation": "contains"
    },
    {
      "source": "zh-2061136311206073648",
      "target": "a-5503838410408249309",
      "relation": "contains"
    },
    {
      "source": "zh-1951817967785456234",
      "target": "a-8863528003331150212",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a-4657783906339585386",
      "relation": "contains"
    },
    {
      "source": "zh-2017996212544960495",
      "target": "a--4597835304900607258",
      "relation": "contains"
    },
    {
      "source": "zh-565119295",
      "target": "a-5324987417511538813",
      "relation": "contains"
    },
    {
      "source": "zh-2014268583652320290",
      "target": "a-764632049320813660",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a-7967126021123033421",
      "relation": "contains"
    },
    {
      "source": "zh-1951817967785456234",
      "target": "a-5112006109323949625",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a--8096488367717744330",
      "relation": "contains"
    },
    {
      "source": "zh-2061136311206073648",
      "target": "a--7597617030238682870",
      "relation": "contains"
    },
    {
      "source": "zh-597389916",
      "target": "a-2136434335880609321",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a-675605611023760361",
      "relation": "contains"
    },
    {
      "source": "zh-2014268583652320290",
      "target": "a-778555317989693620",
      "relation": "contains"
    },
    {
      "source": "zh-2011022777268856579",
      "target": "a--276276232786293620",
      "relation": "contains"
    },
    {
      "source": "zh-2014268583652320290",
      "target": "a--8658895751633337560",
      "relation": "contains"
    },
    {
      "source": "zh-2016930184062789503",
      "target": "a-1075229406073438720",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a-8400187811174672471",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a-7627082454947294178",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a-5148465118168203901",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a--6981647910598885200",
      "relation": "contains"
    },
    {
      "source": "zh-2078502972665884970",
      "target": "a--7087091483973468197",
      "relation": "contains"
    },
    {
      "source": "zh-1941132414425495417",
      "target": "a--1665837174359470226",
      "relation": "contains"
    },
    {
      "source": "zh-2012530352657282469",
      "target": "a--4174470938112234211",
      "relation": "contains"
    },
    {
      "source": "zh-1892491048032396428",
      "target": "a-9019339624109839252",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a-3945245772520750417",
      "relation": "contains"
    },
    {
      "source": "zh-2014268583652320290",
      "target": "a-2774134015391990851",
      "relation": "contains"
    },
    {
      "source": "zh-1892491048032396428",
      "target": "a--3181744553442995604",
      "relation": "contains"
    },
    {
      "source": "zh-353011782",
      "target": "a--7916746516158566518",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a-3967858075044158343",
      "relation": "contains"
    },
    {
      "source": "zh-659369541",
      "target": "a--3138059878309530626",
      "relation": "contains"
    },
    {
      "source": "zh-1951817967785456234",
      "target": "a-3298101780382736051",
      "relation": "contains"
    },
    {
      "source": "zh-660021689",
      "target": "a--6123579788034080189",
      "relation": "contains"
    },
    {
      "source": "zh-2038411932424725710",
      "target": "a--8393684584489265199",
      "relation": "contains"
    },
    {
      "source": "zh-2061136311206073648",
      "target": "a-7392279913687727441",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a-3626746105289842740",
      "relation": "contains"
    },
    {
      "source": "zh-2052608342816715544",
      "target": "a-3878948019650956180",
      "relation": "contains"
    },
    {
      "source": "zh-2069490435995832397",
      "target": "a--7358295969482173416",
      "relation": "contains"
    },
    {
      "source": "zh-1923383858025433047",
      "target": "a--9169751937220422521",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a-4812623908113812622",
      "relation": "contains"
    },
    {
      "source": "zh-2012530352657282469",
      "target": "a-8809132565924223758",
      "relation": "contains"
    },
    {
      "source": "zh-2017996212544960495",
      "target": "a-7786809911667768090",
      "relation": "contains"
    },
    {
      "source": "zh-2053791549629129105",
      "target": "a-4341191114694461656",
      "relation": "contains"
    },
    {
      "source": "zh-7007890382",
      "target": "a--5697019864897919484",
      "relation": "contains"
    },
    {
      "source": "zh-659369541",
      "target": "a--4884147300876143995",
      "relation": "contains"
    },
    {
      "source": "zh-2035134530596683934",
      "target": "a--8414699585281428141",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a--3822831705509045065",
      "relation": "contains"
    },
    {
      "source": "zh-568804205",
      "target": "a-5175851305424032479",
      "relation": "contains"
    },
    {
      "source": "zh-1992678011498100641",
      "target": "a--7010234659398858855",
      "relation": "contains"
    },
    {
      "source": "zh-658879898",
      "target": "a--271755577056779633",
      "relation": "contains"
    },
    {
      "source": "zh-284641712",
      "target": "a-1056678539764621563",
      "relation": "contains"
    },
    {
      "source": "zh-1931619901778391593",
      "target": "a--9189395591333446598",
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
      "source": "zh-2042985698823861883",
      "target": "a--2219051504955640382",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a--4236882863799727009",
      "relation": "contains"
    },
    {
      "source": "zh-2014268583652320290",
      "target": "a-478631262804848716",
      "relation": "contains"
    },
    {
      "source": "zh-565119295",
      "target": "a-8229830341365635121",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a-5012710704733220381",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a--3596866254648524842",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a-6078019214871629394",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a--1301128396742181849",
      "relation": "contains"
    },
    {
      "source": "zh-2035134530596683934",
      "target": "a--8636163842687801585",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a--8829090024133184570",
      "relation": "contains"
    },
    {
      "source": "zh-1953365116692205864",
      "target": "a-3216813244614454094",
      "relation": "contains"
    },
    {
      "source": "zh-8345110904",
      "target": "a--3430818952854333748",
      "relation": "contains"
    },
    {
      "source": "zh-2016910965510268796",
      "target": "a--4337304148717625052",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a-5083327037914158295",
      "relation": "contains"
    },
    {
      "source": "zh-12872950823",
      "target": "a--5870612721970439520",
      "relation": "contains"
    },
    {
      "source": "zh-1972861967086666313",
      "target": "a-3008774721068965159",
      "relation": "contains"
    },
    {
      "source": "zh-1972861967086666313",
      "target": "a-7178103508806517538",
      "relation": "contains"
    },
    {
      "source": "zh-635329472",
      "target": "a-3969283045814583921",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a-4542281494250465893",
      "relation": "contains"
    },
    {
      "source": "zh-2016930184062789503",
      "target": "a-8256198252371469474",
      "relation": "contains"
    },
    {
      "source": "zh-2016930184062789503",
      "target": "a--7900839696774041776",
      "relation": "contains"
    },
    {
      "source": "zh-2022827505304781613",
      "target": "a-858931080723109320",
      "relation": "contains"
    },
    {
      "source": "zh-2072683028829009863",
      "target": "a--7135962638583945500",
      "relation": "contains"
    },
    {
      "source": "zh-400705285",
      "target": "a--5009218611275704310",
      "relation": "contains"
    },
    {
      "source": "zh-2052608342816715544",
      "target": "a-6926770995914242054",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a-175960481860901278",
      "relation": "contains"
    },
    {
      "source": "zh-637094806",
      "target": "a--2866688706434085398",
      "relation": "contains"
    },
    {
      "source": "zh-1931619901778391593",
      "target": "a-7190083545853485598",
      "relation": "contains"
    },
    {
      "source": "zh-581137960",
      "target": "a--8937250665072027492",
      "relation": "contains"
    },
    {
      "source": "zh-2072683028829009863",
      "target": "a--2874179722140792518",
      "relation": "contains"
    },
    {
      "source": "zh-1892491048032396428",
      "target": "a--7510776705010454167",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a--2483126025033303325",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a-6951302731698000672",
      "relation": "contains"
    },
    {
      "source": "zh-13655203379",
      "target": "a-7442538956534383648",
      "relation": "contains"
    },
    {
      "source": "zh-661199186",
      "target": "a-2236234991474661975",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a--3116936308957756347",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a-2424424823265271812",
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
      "source": "zh-1903459479011432303",
      "target": "a-6849487066296743475",
      "relation": "contains"
    },
    {
      "source": "zh-1903459479011432303",
      "target": "a-4691778845565231019",
      "relation": "contains"
    },
    {
      "source": "zh-2061136311206073648",
      "target": "a-7618442829021878751",
      "relation": "contains"
    },
    {
      "source": "zh-2066111436082897266",
      "target": "a--4114725474784259529",
      "relation": "contains"
    },
    {
      "source": "zh-465369002",
      "target": "a-3132737687244157601",
      "relation": "contains"
    },
    {
      "source": "zh-2017996212544960495",
      "target": "a--9034118069028287358",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a-4640485702391187028",
      "relation": "contains"
    },
    {
      "source": "zh-284641712",
      "target": "a-7021779542173971284",
      "relation": "contains"
    },
    {
      "source": "zh-661271928",
      "target": "a-5984559935248563559",
      "relation": "contains"
    },
    {
      "source": "zh-1892491048032396428",
      "target": "a--6474644246790139963",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a--6001715965198712772",
      "relation": "contains"
    },
    {
      "source": "zh-2038411932424725710",
      "target": "a-9190646177456802717",
      "relation": "contains"
    },
    {
      "source": "zh-1931619901778391593",
      "target": "a-5545344300419036090",
      "relation": "contains"
    },
    {
      "source": "zh-2458716174",
      "target": "a--7486934681111155064",
      "relation": "contains"
    },
    {
      "source": "zh-2069490435995832397",
      "target": "a--588152754090473948",
      "relation": "contains"
    },
    {
      "source": "zh-452243069",
      "target": "a--8887061255577345053",
      "relation": "contains"
    },
    {
      "source": "zh-661317726",
      "target": "a-366995330329654836",
      "relation": "contains"
    },
    {
      "source": "zh-2077824745589028563",
      "target": "a--5954909559545702906",
      "relation": "contains"
    },
    {
      "source": "zh-565119295",
      "target": "a--9067199109216805190",
      "relation": "contains"
    },
    {
      "source": "zh-13655203379",
      "target": "a--8736220848270490719",
      "relation": "contains"
    },
    {
      "source": "zh-1949784266633377083",
      "target": "a--2147618782599451840",
      "relation": "contains"
    },
    {
      "source": "zh-659369541",
      "target": "a-7432431057572437253",
      "relation": "contains"
    },
    {
      "source": "zh-2019355746328932969",
      "target": "a--6480506393744647351",
      "relation": "contains"
    },
    {
      "source": "zh-661317726",
      "target": "a-1927231570724299789",
      "relation": "contains"
    },
    {
      "source": "zh-659369541",
      "target": "a-1373135577152647903",
      "relation": "contains"
    },
    {
      "source": "zh-2067543311850778736",
      "target": "a--4443599563206995841",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a-6187716839666350814",
      "relation": "contains"
    },
    {
      "source": "zh-659369541",
      "target": "a-2322413823008857432",
      "relation": "contains"
    },
    {
      "source": "zh-637094806",
      "target": "a-1616394633754373363",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a-1107566537735583804",
      "relation": "contains"
    },
    {
      "source": "zh-2038411932424725710",
      "target": "a--5108988535329087971",
      "relation": "contains"
    },
    {
      "source": "zh-2076694461229409490",
      "target": "a--6345342579324424872",
      "relation": "contains"
    },
    {
      "source": "zh-581137960",
      "target": "a-479385971587492418",
      "relation": "contains"
    },
    {
      "source": "zh-1972861967086666313",
      "target": "a--8963194191942191530",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a--5938224498983223315",
      "relation": "contains"
    },
    {
      "source": "zh-1984265501115958721",
      "target": "a--2576768985750860421",
      "relation": "contains"
    },
    {
      "source": "zh-2069490435995832397",
      "target": "a-2220612879756739023",
      "relation": "contains"
    },
    {
      "source": "zh-2072683028829009863",
      "target": "a--2488910800485298326",
      "relation": "contains"
    },
    {
      "source": "zh-1393954552",
      "target": "a--6164472371836495289",
      "relation": "contains"
    },
    {
      "source": "zh-1953096742175224404",
      "target": "a--4554940962574273439",
      "relation": "contains"
    },
    {
      "source": "zh-2069490435995832397",
      "target": "a--6189677471261522049",
      "relation": "contains"
    },
    {
      "source": "zh-14461028376",
      "target": "a-8130782778536502254",
      "relation": "contains"
    },
    {
      "source": "zh-1977074341968574068",
      "target": "a-7415577803219682552",
      "relation": "contains"
    },
    {
      "source": "zh-594432719",
      "target": "a-8202269146180933098",
      "relation": "contains"
    },
    {
      "source": "zh-1903459479011432303",
      "target": "a--6542132015873777373",
      "relation": "contains"
    },
    {
      "source": "zh-1903459479011432303",
      "target": "a-988457616486433785",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a--8156374372474315705",
      "relation": "contains"
    },
    {
      "source": "zh-2056781761565159896",
      "target": "a-436754142026920650",
      "relation": "contains"
    },
    {
      "source": "zh-6947040839",
      "target": "a-7060855093229756424",
      "relation": "contains"
    },
    {
      "source": "zh-2069490435995832397",
      "target": "a--4702340177340402524",
      "relation": "contains"
    },
    {
      "source": "zh-2072979072867747736",
      "target": "a-805227987191185843",
      "relation": "contains"
    },
    {
      "source": "zh-2039116530319873634",
      "target": "a--1082727288811701520",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a--8930286753779581760",
      "relation": "contains"
    },
    {
      "source": "zh-2038411932424725710",
      "target": "a-8717578469649032979",
      "relation": "contains"
    },
    {
      "source": "zh-583691915",
      "target": "a--6512767791850319549",
      "relation": "contains"
    },
    {
      "source": "zh-1931619901778391593",
      "target": "a--748655196267483594",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a-4298882669829287467",
      "relation": "contains"
    },
    {
      "source": "zh-2016889470092272129",
      "target": "a--113937240923609398",
      "relation": "contains"
    },
    {
      "source": "zh-2061136311206073648",
      "target": "a-3995585743664260981",
      "relation": "contains"
    },
    {
      "source": "zh-2019860124727031327",
      "target": "a--6647773154164476969",
      "relation": "contains"
    },
    {
      "source": "zh-2011117101591589597",
      "target": "a--1166588439102192390",
      "relation": "contains"
    },
    {
      "source": "zh-6947040839",
      "target": "a--5552869452242441586",
      "relation": "contains"
    },
    {
      "source": "zh-2016930184062789503",
      "target": "a--5721180101230092572",
      "relation": "contains"
    },
    {
      "source": "zh-2061407637246305107",
      "target": "a--3637630978259926288",
      "relation": "contains"
    },
    {
      "source": "zh-2058583113865892735",
      "target": "a-7994886401338126615",
      "relation": "contains"
    },
    {
      "source": "zh-1923383858025433047",
      "target": "a--8964003959406597522",
      "relation": "contains"
    },
    {
      "source": "zh-1951817967785456234",
      "target": "a--3742988258423484085",
      "relation": "contains"
    },
    {
      "source": "zh-1951817967785456234",
      "target": "a--8065255280543916133",
      "relation": "contains"
    },
    {
      "source": "zh-1914986510035452070",
      "target": "a-3265745577596313635",
      "relation": "contains"
    },
    {
      "source": "zh-2051439039954396829",
      "target": "a-919684638745255504",
      "relation": "contains"
    },
    {
      "source": "zh-1977074341968574068",
      "target": "a--3606585513578338451",
      "relation": "contains"
    },
    {
      "source": "zh-2067543311850778736",
      "target": "a--1085208124054752999",
      "relation": "contains"
    },
    {
      "source": "zh-1931619901778391593",
      "target": "a-6589912903194608981",
      "relation": "contains"
    },
    {
      "source": "zh-331578036",
      "target": "a--181767306330084835",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a--5681636037622442429",
      "relation": "contains"
    },
    {
      "source": "zh-2042985698823861883",
      "target": "a-6484353842059278362",
      "relation": "contains"
    },
    {
      "source": "zh-7846729236",
      "target": "a--5495754290005366712",
      "relation": "contains"
    },
    {
      "source": "zh-1929576321450751480",
      "target": "a--221707673298804513",
      "relation": "contains"
    },
    {
      "source": "zh-2075618575495197313",
      "target": "a-4587934715750170607",
      "relation": "contains"
    },
    {
      "source": "zh-1941132414425495417",
      "target": "a-4244626890762322403",
      "relation": "contains"
    },
    {
      "source": "zh-661199186",
      "target": "a--6020112849420017675",
      "relation": "contains"
    },
    {
      "source": "zh-10241549244",
      "target": "a--1858274713642811231",
      "relation": "contains"
    },
    {
      "source": "zh-2069490435995832397",
      "target": "a-4769695036315054845",
      "relation": "contains"
    },
    {
      "source": "zh-2020545061792792654",
      "target": "a--1289976677312429097",
      "relation": "contains"
    },
    {
      "source": "zh-12085658931",
      "target": "a-7611596246177389232",
      "relation": "contains"
    },
    {
      "source": "zh-11507128017",
      "target": "a-3306544196844106705",
      "relation": "contains"
    },
    {
      "source": "zh-2081895865921299074",
      "target": "a-6126823911250599595",
      "relation": "contains"
    },
    {
      "source": "zh-661271928",
      "target": "a-2034176194713719016",
      "relation": "contains"
    },
    {
      "source": "zh-6782975731",
      "target": "a-488001093571781838",
      "relation": "contains"
    },
    {
      "source": "zh-661317726",
      "target": "a-3864455554413364231",
      "relation": "contains"
    },
    {
      "source": "zh-2030670762495972103",
      "target": "a-5944933426587561641",
      "relation": "contains"
    },
    {
      "source": "zh-2030670762495972103",
      "target": "a-9061874944177274305",
      "relation": "contains"
    },
    {
      "source": "zh-2077075555535605889",
      "target": "a--4582466702302758498",
      "relation": "contains"
    },
    {
      "source": "zh-2048163712138211470",
      "target": "a--3822579795580553431",
      "relation": "contains"
    },
    {
      "source": "zh-2049934861817869718",
      "target": "a-8469733164666249423",
      "relation": "contains"
    },
    {
      "source": "zh-635329472",
      "target": "a-2480978703748265328",
      "relation": "contains"
    },
    {
      "source": "zh-2032572036879476358",
      "target": "a--3507469898199004231",
      "relation": "contains"
    },
    {
      "source": "zh-2040875811226510078",
      "target": "a--7570075034349265",
      "relation": "contains"
    },
    {
      "source": "zh-1914986510035452070",
      "target": "a--6298885924988383459",
      "relation": "contains"
    },
    {
      "source": "zh-2066911604235571824",
      "target": "a-4560790726606256329",
      "relation": "contains"
    },
    {
      "source": "zh-2058927476735321115",
      "target": "a-8201144425862317631",
      "relation": "contains"
    },
    {
      "source": "zh-1977074341968574068",
      "target": "a-7578589222068007825",
      "relation": "contains"
    },
    {
      "source": "zh-1962444467077358693",
      "target": "a-6530814464955242070",
      "relation": "contains"
    },
    {
      "source": "zh-2067543311850778736",
      "target": "a--1669107637240250258",
      "relation": "contains"
    },
    {
      "source": "zh-568804205",
      "target": "a-7503358984877483228",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a--8838710980769306924",
      "relation": "contains"
    },
    {
      "source": "zh-1947363304684119143",
      "target": "a--9082679415443766728",
      "relation": "contains"
    },
    {
      "source": "zh-284641712",
      "target": "a--5100637066742598916",
      "relation": "contains"
    },
    {
      "source": "zh-284641712",
      "target": "a--8312072853190959879",
      "relation": "contains"
    },
    {
      "source": "zh-1953096742175224404",
      "target": "a-7599739875221353597",
      "relation": "contains"
    },
    {
      "source": "zh-2070102488355714670",
      "target": "a--1942145208452854170",
      "relation": "contains"
    },
    {
      "source": "zh-2056781761565159896",
      "target": "a-6166414108175052214",
      "relation": "contains"
    },
    {
      "source": "zh-1984265501115958721",
      "target": "a--4342822993392195980",
      "relation": "contains"
    },
    {
      "source": "zh-2059300946514023724",
      "target": "a-3689494951822758440",
      "relation": "contains"
    },
    {
      "source": "zh-6947040839",
      "target": "a--6414495363497439116",
      "relation": "contains"
    },
    {
      "source": "zh-6947040839",
      "target": "a--5590514558985009122",
      "relation": "contains"
    },
    {
      "source": "zh-6947040839",
      "target": "a--6906703058234603657",
      "relation": "contains"
    },
    {
      "source": "zh-11373689229",
      "target": "a-8040323482570605366",
      "relation": "contains"
    },
    {
      "source": "zh-612845174",
      "target": "a--3455695536040532606",
      "relation": "contains"
    },
    {
      "source": "zh-2053791549629129105",
      "target": "a--4941960030255857488",
      "relation": "contains"
    },
    {
      "source": "zh-2019355746328932969",
      "target": "a--8901983278655544963",
      "relation": "contains"
    },
    {
      "source": "zh-661271928",
      "target": "a--496304328253731260",
      "relation": "contains"
    },
    {
      "source": "zh-661317726",
      "target": "a--3241830959968835068",
      "relation": "contains"
    },
    {
      "source": "zh-2072683028829009863",
      "target": "a-184393152028876286",
      "relation": "contains"
    },
    {
      "source": "zh-2030670762495972103",
      "target": "a--5871390188075001269",
      "relation": "contains"
    },
    {
      "source": "zh-2048163712138211470",
      "target": "a--1570016932397432084",
      "relation": "contains"
    },
    {
      "source": "zh-635329472",
      "target": "a--8908141187348267597",
      "relation": "contains"
    },
    {
      "source": "zh-452243069",
      "target": "a--1544821425531467936",
      "relation": "contains"
    },
    {
      "source": "zh-2073408615956985818",
      "target": "a-1564466387070499726",
      "relation": "contains"
    },
    {
      "source": "zh-1972252087044796716",
      "target": "a-2059609074143167601",
      "relation": "contains"
    },
    {
      "source": "zh-2038411932424725710",
      "target": "a-6845785434957152205",
      "relation": "contains"
    },
    {
      "source": "zh-2052608342816715544",
      "target": "a-4345301056514331697",
      "relation": "contains"
    },
    {
      "source": "zh-2081685100555677809",
      "target": "a-7694646029523666707",
      "relation": "contains"
    },
    {
      "source": "zh-604703607",
      "target": "a--6230768604688732246",
      "relation": "contains"
    },
    {
      "source": "zh-1902746889251721780",
      "target": "a--7940648025065138231",
      "relation": "contains"
    },
    {
      "source": "zh-1902746889251721780",
      "target": "a-4998779688670138215",
      "relation": "contains"
    },
    {
      "source": "zh-1931619901778391593",
      "target": "a--6165004185748888693",
      "relation": "contains"
    },
    {
      "source": "zh-7712128783",
      "target": "a--832584820767287079",
      "relation": "contains"
    },
    {
      "source": "zh-2080650408108746685",
      "target": "a--7698897246818580850",
      "relation": "contains"
    },
    {
      "source": "zh-1953096742175224404",
      "target": "a-8951187066600538619",
      "relation": "contains"
    },
    {
      "source": "zh-2009262232622609492",
      "target": "a-2846293786060691993",
      "relation": "contains"
    },
    {
      "source": "zh-2059300946514023724",
      "target": "a-7004945397760571224",
      "relation": "contains"
    },
    {
      "source": "zh-661199186",
      "target": "a--394543835087671442",
      "relation": "contains"
    },
    {
      "source": "zh-639997162",
      "target": "a-6558078831559221404",
      "relation": "contains"
    },
    {
      "source": "zh-496888426",
      "target": "a--9033255501595148655",
      "relation": "contains"
    },
    {
      "source": "zh-1892491048032396428",
      "target": "a--7293893386129685681",
      "relation": "contains"
    },
    {
      "source": "zh-452243069",
      "target": "a-5608855948732439865",
      "relation": "contains"
    },
    {
      "source": "zh-1914986510035452070",
      "target": "a--579030165460407009",
      "relation": "contains"
    },
    {
      "source": "a-1075229406073438720",
      "target": "cl-ai-not-reduce-jobs",
      "relation": "member"
    },
    {
      "source": "a-7627082454947294178",
      "target": "cl-ai-not-reduce-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-reduce-jobs",
      "target": "zh-2016930184062789503",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-not-reduce-jobs",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "a--1942145208452854170",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "a--6230768604688732246",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-2070102488355714670",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-604703607",
      "relation": "bridge"
    },
    {
      "source": "a--5713819934268214727",
      "target": "cl-ai-cannot-replace-professional-painters",
      "relation": "member"
    },
    {
      "source": "a--4174470938112234211",
      "target": "cl-ai-cannot-replace-professional-painters",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-professional-painters",
      "target": "zh-1941132414425495417",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-replace-professional-painters",
      "target": "zh-2012530352657282469",
      "relation": "bridge"
    },
    {
      "source": "a--5713819934268214727",
      "target": "cl-ai-eliminate-low-end-not-professional",
      "relation": "member"
    },
    {
      "source": "a--271755577056779633",
      "target": "cl-ai-eliminate-low-end-not-professional",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-low-end-not-professional",
      "target": "zh-1941132414425495417",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-eliminate-low-end-not-professional",
      "target": "zh-658879898",
      "relation": "bridge"
    },
    {
      "source": "a--5713819934268214727",
      "target": "cl-ai-eliminate-mechanical-not-thinkers",
      "relation": "member"
    },
    {
      "source": "a--4236882863799727009",
      "target": "cl-ai-eliminate-mechanical-not-thinkers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-mechanical-not-thinkers",
      "target": "zh-1941132414425495417",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-eliminate-mechanical-not-thinkers",
      "target": "zh-2016889470092272129",
      "relation": "bridge"
    },
    {
      "source": "a-5324987417511538813",
      "target": "cl-ai-eliminate-low-end-not-professional",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-low-end-not-professional",
      "target": "zh-565119295",
      "relation": "bridge"
    },
    {
      "source": "a-5324987417511538813",
      "target": "cl-ai-eliminate-mechanical-not-thinkers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-mechanical-not-thinkers",
      "target": "zh-565119295",
      "relation": "bridge"
    },
    {
      "source": "a-2136434335880609321",
      "target": "cl-ai-cannot-replace-professional-painters",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-professional-painters",
      "target": "zh-597389916",
      "relation": "bridge"
    },
    {
      "source": "a-2136434335880609321",
      "target": "cl-ai-eliminate-low-end-not-professional",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-low-end-not-professional",
      "target": "zh-597389916",
      "relation": "bridge"
    },
    {
      "source": "a-2136434335880609321",
      "target": "cl-ai-eliminate-mechanical-not-thinkers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-mechanical-not-thinkers",
      "target": "zh-597389916",
      "relation": "bridge"
    },
    {
      "source": "a--4174470938112234211",
      "target": "cl-ai-eliminate-low-end-not-professional",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-low-end-not-professional",
      "target": "zh-2012530352657282469",
      "relation": "bridge"
    },
    {
      "source": "a--4174470938112234211",
      "target": "cl-ai-eliminate-mechanical-not-thinkers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-mechanical-not-thinkers",
      "target": "zh-2012530352657282469",
      "relation": "bridge"
    },
    {
      "source": "a--2219051504955640382",
      "target": "cl-ai-eliminate-low-end-not-professional",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-low-end-not-professional",
      "target": "zh-2042985698823861883",
      "relation": "bridge"
    },
    {
      "source": "a--271755577056779633",
      "target": "cl-ai-eliminate-mechanical-not-thinkers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-mechanical-not-thinkers",
      "target": "zh-658879898",
      "relation": "bridge"
    },
    {
      "source": "a--4236882863799727009",
      "target": "cl-ai-eliminate-non-growers",
      "relation": "member"
    },
    {
      "source": "a--1301128396742181849",
      "target": "cl-ai-eliminate-non-growers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-non-growers",
      "target": "zh-2016889470092272129",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-eliminate-non-growers",
      "target": "zh-7712128783",
      "relation": "bridge"
    },
    {
      "source": "a--4236882863799727009",
      "target": "cl-ai-eliminate-standardized-output",
      "relation": "member"
    },
    {
      "source": "a-6951302731698000672",
      "target": "cl-ai-eliminate-standardized-output",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-standardized-output",
      "target": "zh-2016889470092272129",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-eliminate-standardized-output",
      "target": "zh-2042985698823861883",
      "relation": "bridge"
    },
    {
      "source": "a-6951302731698000672",
      "target": "cl-ai-eliminate-non-growers",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-non-growers",
      "target": "zh-2042985698823861883",
      "relation": "bridge"
    },
    {
      "source": "a--5870612721970439520",
      "target": "cl-ai-replace-standardized-not-core",
      "relation": "member"
    },
    {
      "source": "a-3969283045814583921",
      "target": "cl-ai-replace-standardized-not-core",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-standardized-not-core",
      "target": "zh-12872950823",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-standardized-not-core",
      "target": "zh-635329472",
      "relation": "bridge"
    },
    {
      "source": "a-858931080723109320",
      "target": "cl-ai-replace-standardized-not-core",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-standardized-not-core",
      "target": "zh-2022827505304781613",
      "relation": "bridge"
    },
    {
      "source": "a-6951302731698000672",
      "target": "cl-ai-replace-standardized-not-core",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-standardized-not-core",
      "target": "zh-2042985698823861883",
      "relation": "bridge"
    },
    {
      "source": "a-7442538956534383648",
      "target": "cl-ai-eliminate-standardized-output",
      "relation": "member"
    },
    {
      "source": "cl-ai-eliminate-standardized-output",
      "target": "zh-13655203379",
      "relation": "bridge"
    },
    {
      "source": "a-2424424823265271812",
      "target": "cl-ai-eliminate-standardized-output",
      "relation": "member"
    },
    {
      "source": "a--6164472371836495289",
      "target": "cl-human-emotion-creativity-irreplaceable",
      "relation": "member"
    },
    {
      "source": "a-7415577803219682552",
      "target": "cl-human-emotion-creativity-irreplaceable",
      "relation": "member"
    },
    {
      "source": "cl-human-emotion-creativity-irreplaceable",
      "target": "zh-1393954552",
      "relation": "bridge"
    },
    {
      "source": "cl-human-emotion-creativity-irreplaceable",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "a-988457616486433785",
      "target": "cl-human-emotion-creativity-irreplaceable",
      "relation": "member"
    },
    {
      "source": "cl-human-emotion-creativity-irreplaceable",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "a--6512767791850319549",
      "target": "cl-ai-cannot-replace-human-exclusive-jobs",
      "relation": "member"
    },
    {
      "source": "a--5552869452242441586",
      "target": "cl-ai-cannot-replace-human-exclusive-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-exclusive-jobs",
      "target": "zh-583691915",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-replace-human-exclusive-jobs",
      "target": "zh-6947040839",
      "relation": "bridge"
    },
    {
      "source": "a--3637630978259926288",
      "target": "cl-ai-cannot-replace-human-exclusive-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-exclusive-jobs",
      "target": "zh-2061407637246305107",
      "relation": "bridge"
    },
    {
      "source": "a--221707673298804513",
      "target": "cl-ai-cannot-replace-human-exclusive-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-exclusive-jobs",
      "target": "zh-1929576321450751480",
      "relation": "bridge"
    },
    {
      "source": "a--1858274713642811231",
      "target": "cl-ai-cannot-replace-human-exclusive-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-exclusive-jobs",
      "target": "zh-10241549244",
      "relation": "bridge"
    },
    {
      "source": "a-6126823911250599595",
      "target": "cl-ai-cannot-replace-human-exclusive-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-human-exclusive-jobs",
      "target": "zh-2081895865921299074",
      "relation": "bridge"
    },
    {
      "source": "a--3822579795580553431",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "a-8201144425862317631",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-2048163712138211470",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-2058927476735321115",
      "relation": "bridge"
    },
    {
      "source": "a-7011770996733503369",
      "target": "cl-ai-will-replace-programmers",
      "relation": "member"
    },
    {
      "source": "a-3878948019650956180",
      "target": "cl-ai-will-replace-programmers",
      "relation": "member"
    },
    {
      "source": "cl-ai-will-replace-programmers",
      "target": "zh-593275984",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-will-replace-programmers",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "a-4657783906339585386",
      "target": "cl-ai-will-replace-programmers",
      "relation": "member"
    },
    {
      "source": "cl-ai-will-replace-programmers",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "a-4341191114694461656",
      "target": "cl-ai-cannot-fully-replace-professional-roles",
      "relation": "member"
    },
    {
      "source": "a--4337304148717625052",
      "target": "cl-ai-cannot-fully-replace-professional-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-professional-roles",
      "target": "zh-2053791549629129105",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-fully-replace-professional-roles",
      "target": "zh-2016910965510268796",
      "relation": "bridge"
    },
    {
      "source": "a--5697019864897919484",
      "target": "cl-ai-cannot-fully-replace-professional-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-professional-roles",
      "target": "zh-7007890382",
      "relation": "bridge"
    },
    {
      "source": "a-7506223916112815660",
      "target": "cl-ai-compress-entry-level-not-industry",
      "relation": "member"
    },
    {
      "source": "a--3059213074980422546",
      "target": "cl-ai-compress-entry-level-not-industry",
      "relation": "member"
    },
    {
      "source": "cl-ai-compress-entry-level-not-industry",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-compress-entry-level-not-industry",
      "target": "zh-2035134530596683934",
      "relation": "bridge"
    },
    {
      "source": "a--8636163842687801585",
      "target": "cl-ai-compress-entry-level-not-industry",
      "relation": "member"
    },
    {
      "source": "a-4542281494250465893",
      "target": "cl-ai-cannot-fully-replace-professional-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-professional-roles",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-cannot-fully-replace-professional-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-professional-roles",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "a-4542281494250465893",
      "target": "cl-ai-cannot-do-system-design",
      "relation": "member"
    },
    {
      "source": "a-7190083545853485598",
      "target": "cl-ai-cannot-do-system-design",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-do-system-design",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-do-system-design",
      "target": "zh-1931619901778391593",
      "relation": "bridge"
    },
    {
      "source": "a-4542281494250465893",
      "target": "cl-ai-cannot-complete-complex-tasks",
      "relation": "member"
    },
    {
      "source": "a--3116936308957756347",
      "target": "cl-ai-cannot-complete-complex-tasks",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-complete-complex-tasks",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-complete-complex-tasks",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "a-4542281494250465893",
      "target": "cl-ai-cannot-fully-replace-programming",
      "relation": "member"
    },
    {
      "source": "a--7486934681111155064",
      "target": "cl-ai-cannot-fully-replace-programming",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-programming",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-fully-replace-programming",
      "target": "zh-2458716174",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-cannot-do-system-design",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-do-system-design",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-cannot-do-architecture-design",
      "relation": "member"
    },
    {
      "source": "a--2483126025033303325",
      "target": "cl-ai-cannot-do-architecture-design",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-do-architecture-design",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-do-architecture-design",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-cannot-complete-complex-tasks",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-complete-complex-tasks",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-cannot-fully-replace-programming",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-programming",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "a-6926770995914242054",
      "target": "cl-ai-cannot-write-professional-software",
      "relation": "member"
    },
    {
      "source": "a--5954909559545702906",
      "target": "cl-ai-cannot-write-professional-software",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-write-professional-software",
      "target": "zh-2052608342816715544",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-write-professional-software",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a-7190083545853485598",
      "target": "cl-ai-cannot-do-architecture-design",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-do-architecture-design",
      "target": "zh-1931619901778391593",
      "relation": "bridge"
    },
    {
      "source": "a-7190083545853485598",
      "target": "cl-ai-cannot-complete-complex-tasks",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-complete-complex-tasks",
      "target": "zh-1931619901778391593",
      "relation": "bridge"
    },
    {
      "source": "a-7190083545853485598",
      "target": "cl-ai-cannot-fully-replace-programming",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-programming",
      "target": "zh-1931619901778391593",
      "relation": "bridge"
    },
    {
      "source": "a-7190083545853485598",
      "target": "cl-ai-cannot-write-professional-software",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-write-professional-software",
      "target": "zh-1931619901778391593",
      "relation": "bridge"
    },
    {
      "source": "a--2483126025033303325",
      "target": "cl-ai-cannot-complete-complex-tasks",
      "relation": "member"
    },
    {
      "source": "a--2483126025033303325",
      "target": "cl-ai-cannot-fully-replace-programming",
      "relation": "member"
    },
    {
      "source": "a--3116936308957756347",
      "target": "cl-ai-cannot-fully-replace-programming",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-fully-replace-programming",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "a--3116936308957756347",
      "target": "cl-ai-cannot-write-professional-software",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-write-professional-software",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "a--7486934681111155064",
      "target": "cl-ai-cannot-write-professional-software",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-write-professional-software",
      "target": "zh-2458716174",
      "relation": "bridge"
    },
    {
      "source": "a--2576768985750860421",
      "target": "cl-still-need-learn-programming",
      "relation": "member"
    },
    {
      "source": "a--6647773154164476969",
      "target": "cl-still-need-learn-programming",
      "relation": "member"
    },
    {
      "source": "cl-still-need-learn-programming",
      "target": "zh-1984265501115958721",
      "relation": "bridge"
    },
    {
      "source": "cl-still-need-learn-programming",
      "target": "zh-2019860124727031327",
      "relation": "bridge"
    },
    {
      "source": "a--1166588439102192390",
      "target": "cl-still-need-learn-programming",
      "relation": "member"
    },
    {
      "source": "cl-still-need-learn-programming",
      "target": "zh-2011117101591589597",
      "relation": "bridge"
    },
    {
      "source": "a-4587934715750170607",
      "target": "cl-still-need-learn-programming",
      "relation": "member"
    },
    {
      "source": "cl-still-need-learn-programming",
      "target": "zh-2075618575495197313",
      "relation": "bridge"
    },
    {
      "source": "a--6001715965198712772",
      "target": "cl-ai-deprives-newcomer-entry",
      "relation": "member"
    },
    {
      "source": "a--8065255280543916133",
      "target": "cl-ai-deprives-newcomer-entry",
      "relation": "member"
    },
    {
      "source": "cl-ai-deprives-newcomer-entry",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-deprives-newcomer-entry",
      "target": "zh-1951817967785456234",
      "relation": "bridge"
    },
    {
      "source": "a-1616394633754373363",
      "target": "cl-ai-deprives-newcomer-entry",
      "relation": "member"
    },
    {
      "source": "cl-ai-deprives-newcomer-entry",
      "target": "zh-637094806",
      "relation": "bridge"
    },
    {
      "source": "a-4560790726606256329",
      "target": "cl-programming-still-needed-but-basics",
      "relation": "member"
    },
    {
      "source": "a-7694646029523666707",
      "target": "cl-programming-still-needed-but-basics",
      "relation": "member"
    },
    {
      "source": "cl-programming-still-needed-but-basics",
      "target": "zh-2066911604235571824",
      "relation": "bridge"
    },
    {
      "source": "cl-programming-still-needed-but-basics",
      "target": "zh-2081685100555677809",
      "relation": "bridge"
    },
    {
      "source": "a-2846293786060691993",
      "target": "cl-programming-still-needed-but-basics",
      "relation": "member"
    },
    {
      "source": "cl-programming-still-needed-but-basics",
      "target": "zh-2009262232622609492",
      "relation": "bridge"
    },
    {
      "source": "a--4597835304900607258",
      "target": "cl-ai-replace-painters-amplify-programmers",
      "relation": "member"
    },
    {
      "source": "a-7178103508806517538",
      "target": "cl-ai-replace-painters-amplify-programmers",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-painters-amplify-programmers",
      "target": "zh-2017996212544960495",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-painters-amplify-programmers",
      "target": "zh-1972861967086666313",
      "relation": "bridge"
    },
    {
      "source": "a--1665837174359470226",
      "target": "cl-ai-replace-painters-amplify-programmers",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-painters-amplify-programmers",
      "target": "zh-1941132414425495417",
      "relation": "bridge"
    },
    {
      "source": "a--6542132015873777373",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "a-436754142026920650",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-2056781761565159896",
      "relation": "bridge"
    },
    {
      "source": "a--6542132015873777373",
      "target": "cl-ai-replace-standardized-task-modules",
      "relation": "member"
    },
    {
      "source": "a--1082727288811701520",
      "target": "cl-ai-replace-standardized-task-modules",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-standardized-task-modules",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-standardized-task-modules",
      "target": "zh-2039116530319873634",
      "relation": "bridge"
    },
    {
      "source": "a--6542132015873777373",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "a--181767306330084835",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-331578036",
      "relation": "bridge"
    },
    {
      "source": "a--5495754290005366712",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-7846729236",
      "relation": "bridge"
    },
    {
      "source": "a--6542132015873777373",
      "target": "cl-ai-hard-real-scenario-fuzzy-info",
      "relation": "member"
    },
    {
      "source": "a--1289976677312429097",
      "target": "cl-ai-hard-real-scenario-fuzzy-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-fuzzy-info",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-hard-real-scenario-fuzzy-info",
      "target": "zh-2020545061792792654",
      "relation": "bridge"
    },
    {
      "source": "a--6542132015873777373",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "a--3507469898199004231",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-2032572036879476358",
      "relation": "bridge"
    },
    {
      "source": "a--6542132015873777373",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "a--8312072853190959879",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-1903459479011432303",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-284641712",
      "relation": "bridge"
    },
    {
      "source": "a-436754142026920650",
      "target": "cl-ai-replace-standardized-task-modules",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-standardized-task-modules",
      "target": "zh-2056781761565159896",
      "relation": "bridge"
    },
    {
      "source": "a-436754142026920650",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-2056781761565159896",
      "relation": "bridge"
    },
    {
      "source": "a-436754142026920650",
      "target": "cl-ai-hard-real-scenario-fuzzy-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-fuzzy-info",
      "target": "zh-2056781761565159896",
      "relation": "bridge"
    },
    {
      "source": "a-436754142026920650",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-2056781761565159896",
      "relation": "bridge"
    },
    {
      "source": "a-436754142026920650",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-2056781761565159896",
      "relation": "bridge"
    },
    {
      "source": "a--1082727288811701520",
      "target": "cl-ai-replace-tasks-not-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-tasks-not-jobs",
      "target": "zh-2039116530319873634",
      "relation": "bridge"
    },
    {
      "source": "a--1082727288811701520",
      "target": "cl-ai-hard-real-scenario-fuzzy-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-fuzzy-info",
      "target": "zh-2039116530319873634",
      "relation": "bridge"
    },
    {
      "source": "a--1082727288811701520",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-2039116530319873634",
      "relation": "bridge"
    },
    {
      "source": "a--1082727288811701520",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-2039116530319873634",
      "relation": "bridge"
    },
    {
      "source": "a--181767306330084835",
      "target": "cl-ai-hard-real-scenario-fuzzy-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-fuzzy-info",
      "target": "zh-331578036",
      "relation": "bridge"
    },
    {
      "source": "a--181767306330084835",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-331578036",
      "relation": "bridge"
    },
    {
      "source": "a--181767306330084835",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-331578036",
      "relation": "bridge"
    },
    {
      "source": "a--5495754290005366712",
      "target": "cl-ai-hard-real-scenario-fuzzy-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-fuzzy-info",
      "target": "zh-7846729236",
      "relation": "bridge"
    },
    {
      "source": "a--5495754290005366712",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-7846729236",
      "relation": "bridge"
    },
    {
      "source": "a--5495754290005366712",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-7846729236",
      "relation": "bridge"
    },
    {
      "source": "a--1289976677312429097",
      "target": "cl-ai-hard-real-scenario-complex-info",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-real-scenario-complex-info",
      "target": "zh-2020545061792792654",
      "relation": "bridge"
    },
    {
      "source": "a--1289976677312429097",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-2020545061792792654",
      "relation": "bridge"
    },
    {
      "source": "a--3507469898199004231",
      "target": "cl-ai-hard-replace-context-understanding",
      "relation": "member"
    },
    {
      "source": "cl-ai-hard-replace-context-understanding",
      "target": "zh-2032572036879476358",
      "relation": "bridge"
    },
    {
      "source": "a-7503358984877483228",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "a--8312072853190959879",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-568804205",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-284641712",
      "relation": "bridge"
    },
    {
      "source": "a--4342822993392195980",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-1984265501115958721",
      "relation": "bridge"
    },
    {
      "source": "a--7698897246818580850",
      "target": "cl-ai-replace-execution-only",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-only",
      "target": "zh-2080650408108746685",
      "relation": "bridge"
    },
    {
      "source": "a-3216813244614454094",
      "target": "cl-ai-not-reduce-jobs",
      "relation": "member"
    },
    {
      "source": "a--8937250665072027492",
      "target": "cl-ai-not-reduce-jobs",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-reduce-jobs",
      "target": "zh-1953365116692205864",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-not-reduce-jobs",
      "target": "zh-581137960",
      "relation": "bridge"
    },
    {
      "source": "a--8937250665072027492",
      "target": "cl-ai-only-replace-repetitive-work",
      "relation": "member"
    },
    {
      "source": "a--8887061255577345053",
      "target": "cl-ai-only-replace-repetitive-work",
      "relation": "member"
    },
    {
      "source": "cl-ai-only-replace-repetitive-work",
      "target": "zh-581137960",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-only-replace-repetitive-work",
      "target": "zh-452243069",
      "relation": "bridge"
    },
    {
      "source": "a--2147618782599451840",
      "target": "cl-ai-only-replace-repetitive-work",
      "relation": "member"
    },
    {
      "source": "cl-ai-only-replace-repetitive-work",
      "target": "zh-1949784266633377083",
      "relation": "bridge"
    },
    {
      "source": "a--276276232786293620",
      "target": "cl-ai-replace-execution-not-responsibility",
      "relation": "member"
    },
    {
      "source": "a--3596866254648524842",
      "target": "cl-ai-replace-execution-not-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility",
      "target": "zh-2011022777268856579",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a--3430818952854333748",
      "target": "cl-ai-replace-execution-not-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility",
      "target": "zh-8345110904",
      "relation": "bridge"
    },
    {
      "source": "a--7916746516158566518",
      "target": "cl-ai-replace-execution-not-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility",
      "target": "zh-353011782",
      "relation": "bridge"
    },
    {
      "source": "a--7358295969482173416",
      "target": "cl-ai-cannot-replace-responsibility-judgment",
      "relation": "member"
    },
    {
      "source": "a--7010234659398858855",
      "target": "cl-ai-cannot-replace-responsibility-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-responsibility-judgment",
      "target": "zh-2069490435995832397",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-cannot-replace-responsibility-judgment",
      "target": "zh-1992678011498100641",
      "relation": "bridge"
    },
    {
      "source": "a--3596866254648524842",
      "target": "cl-ai-cannot-replace-responsibility-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-responsibility-judgment",
      "target": "zh-2077824745589028563",
      "relation": "bridge"
    },
    {
      "source": "a--3430818952854333748",
      "target": "cl-ai-cannot-replace-responsibility-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-responsibility-judgment",
      "target": "zh-8345110904",
      "relation": "bridge"
    },
    {
      "source": "a--4114725474784259529",
      "target": "cl-ai-cannot-replace-responsibility-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-cannot-replace-responsibility-judgment",
      "target": "zh-2066111436082897266",
      "relation": "bridge"
    },
    {
      "source": "a--588152754090473948",
      "target": "cl-ai-cannot-replace-responsibility-judgment",
      "relation": "member"
    },
    {
      "source": "a--4114725474784259529",
      "target": "cl-ai-replace-execution-not-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility",
      "target": "zh-2066111436082897266",
      "relation": "bridge"
    },
    {
      "source": "a--588152754090473948",
      "target": "cl-ai-replace-execution-not-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility",
      "target": "zh-2069490435995832397",
      "relation": "bridge"
    },
    {
      "source": "a--4114725474784259529",
      "target": "cl-doctors-irreplaceable-due-responsibility",
      "relation": "member"
    },
    {
      "source": "a-2220612879756739023",
      "target": "cl-doctors-irreplaceable-due-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-doctors-irreplaceable-due-responsibility",
      "target": "zh-2066111436082897266",
      "relation": "bridge"
    },
    {
      "source": "cl-doctors-irreplaceable-due-responsibility",
      "target": "zh-2069490435995832397",
      "relation": "bridge"
    },
    {
      "source": "a--6189677471261522049",
      "target": "cl-doctors-irreplaceable-due-responsibility",
      "relation": "member"
    },
    {
      "source": "a--4702340177340402524",
      "target": "cl-doctors-irreplaceable-due-responsibility",
      "relation": "member"
    },
    {
      "source": "a-7432431057572437253",
      "target": "cl-ai-replace-execution-not-responsibility-2",
      "relation": "member"
    },
    {
      "source": "a-1107566537735583804",
      "target": "cl-ai-replace-execution-not-responsibility-2",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility-2",
      "target": "zh-659369541",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility-2",
      "target": "zh-14461028376",
      "relation": "bridge"
    },
    {
      "source": "a--8930286753779581760",
      "target": "cl-ai-replace-execution-not-responsibility-2",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility-2",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "a-2322413823008857432",
      "target": "cl-ai-replace-execution-not-responsibility-2",
      "relation": "member"
    },
    {
      "source": "a-7994886401338126615",
      "target": "cl-ai-replace-execution-not-responsibility-2",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-responsibility-2",
      "target": "zh-2058583113865892735",
      "relation": "bridge"
    },
    {
      "source": "a--8930286753779581760",
      "target": "cl-responsibility-attribution-blocks-ai",
      "relation": "member"
    },
    {
      "source": "a-7611596246177389232",
      "target": "cl-responsibility-attribution-blocks-ai",
      "relation": "member"
    },
    {
      "source": "cl-responsibility-attribution-blocks-ai",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "cl-responsibility-attribution-blocks-ai",
      "target": "zh-12085658931",
      "relation": "bridge"
    },
    {
      "source": "a--8930286753779581760",
      "target": "cl-ai-assists-human-responsibility",
      "relation": "member"
    },
    {
      "source": "a-9061874944177274305",
      "target": "cl-ai-assists-human-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-assists-human-responsibility",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-assists-human-responsibility",
      "target": "zh-2030670762495972103",
      "relation": "bridge"
    },
    {
      "source": "a--8930286753779581760",
      "target": "cl-ai-assistant-not-replacement",
      "relation": "member"
    },
    {
      "source": "a-8040323482570605366",
      "target": "cl-ai-assistant-not-replacement",
      "relation": "member"
    },
    {
      "source": "cl-ai-assistant-not-replacement",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-assistant-not-replacement",
      "target": "zh-11373689229",
      "relation": "bridge"
    },
    {
      "source": "a--8930286753779581760",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "a--3455695536040532606",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-612845174",
      "relation": "bridge"
    },
    {
      "source": "a-7994886401338126615",
      "target": "cl-responsibility-attribution-blocks-ai",
      "relation": "member"
    },
    {
      "source": "cl-responsibility-attribution-blocks-ai",
      "target": "zh-2058583113865892735",
      "relation": "bridge"
    },
    {
      "source": "a-7994886401338126615",
      "target": "cl-ai-assists-human-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-assists-human-responsibility",
      "target": "zh-2058583113865892735",
      "relation": "bridge"
    },
    {
      "source": "a-7994886401338126615",
      "target": "cl-ai-assistant-not-replacement",
      "relation": "member"
    },
    {
      "source": "cl-ai-assistant-not-replacement",
      "target": "zh-2058583113865892735",
      "relation": "bridge"
    },
    {
      "source": "a-7994886401338126615",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-2058583113865892735",
      "relation": "bridge"
    },
    {
      "source": "a--3606585513578338451",
      "target": "cl-responsibility-attribution-blocks-ai",
      "relation": "member"
    },
    {
      "source": "cl-responsibility-attribution-blocks-ai",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "a--3606585513578338451",
      "target": "cl-ai-assists-human-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-assists-human-responsibility",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "a--3606585513578338451",
      "target": "cl-ai-assistant-not-replacement",
      "relation": "member"
    },
    {
      "source": "cl-ai-assistant-not-replacement",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "a--3606585513578338451",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-1977074341968574068",
      "relation": "bridge"
    },
    {
      "source": "a-7611596246177389232",
      "target": "cl-ai-assists-human-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-assists-human-responsibility",
      "target": "zh-12085658931",
      "relation": "bridge"
    },
    {
      "source": "a-7611596246177389232",
      "target": "cl-ai-assistant-not-replacement",
      "relation": "member"
    },
    {
      "source": "cl-ai-assistant-not-replacement",
      "target": "zh-12085658931",
      "relation": "bridge"
    },
    {
      "source": "a-7611596246177389232",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-12085658931",
      "relation": "bridge"
    },
    {
      "source": "a-8040323482570605366",
      "target": "cl-ai-assists-human-responsibility",
      "relation": "member"
    },
    {
      "source": "cl-ai-assists-human-responsibility",
      "target": "zh-11373689229",
      "relation": "bridge"
    },
    {
      "source": "a-9061874944177274305",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-2030670762495972103",
      "relation": "bridge"
    },
    {
      "source": "a-8040323482570605366",
      "target": "cl-lack-accountability-blocks-replacement",
      "relation": "member"
    },
    {
      "source": "cl-lack-accountability-blocks-replacement",
      "target": "zh-11373689229",
      "relation": "bridge"
    },
    {
      "source": "a-8040323482570605366",
      "target": "cl-ai-replace-execution-not-judgment",
      "relation": "member"
    },
    {
      "source": "a--5871390188075001269",
      "target": "cl-ai-replace-execution-not-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-judgment",
      "target": "zh-11373689229",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-replace-execution-not-judgment",
      "target": "zh-2030670762495972103",
      "relation": "bridge"
    },
    {
      "source": "a-1564466387070499726",
      "target": "cl-ai-replace-execution-not-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-judgment",
      "target": "zh-2073408615956985818",
      "relation": "bridge"
    },
    {
      "source": "a-8040323482570605366",
      "target": "cl-ai-not-replace-responsibility-roles",
      "relation": "member"
    },
    {
      "source": "a-2059609074143167601",
      "target": "cl-ai-not-replace-responsibility-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-replace-responsibility-roles",
      "target": "zh-11373689229",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-not-replace-responsibility-roles",
      "target": "zh-1972252087044796716",
      "relation": "bridge"
    },
    {
      "source": "a-8040323482570605366",
      "target": "cl-ai-should-assist-not-replace",
      "relation": "member"
    },
    {
      "source": "a--9033255501595148655",
      "target": "cl-ai-should-assist-not-replace",
      "relation": "member"
    },
    {
      "source": "cl-ai-should-assist-not-replace",
      "target": "zh-11373689229",
      "relation": "bridge"
    },
    {
      "source": "cl-ai-should-assist-not-replace",
      "target": "zh-496888426",
      "relation": "bridge"
    },
    {
      "source": "a--4941960030255857488",
      "target": "cl-ai-replace-execution-not-judgment",
      "relation": "member"
    },
    {
      "source": "cl-ai-replace-execution-not-judgment",
      "target": "zh-2053791549629129105",
      "relation": "bridge"
    },
    {
      "source": "a--4941960030255857488",
      "target": "cl-ai-not-replace-responsibility-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-replace-responsibility-roles",
      "target": "zh-2053791549629129105",
      "relation": "bridge"
    },
    {
      "source": "a--4941960030255857488",
      "target": "cl-ai-should-assist-not-replace",
      "relation": "member"
    },
    {
      "source": "cl-ai-should-assist-not-replace",
      "target": "zh-2053791549629129105",
      "relation": "bridge"
    },
    {
      "source": "a--5871390188075001269",
      "target": "cl-ai-not-replace-responsibility-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-replace-responsibility-roles",
      "target": "zh-2030670762495972103",
      "relation": "bridge"
    },
    {
      "source": "a--5871390188075001269",
      "target": "cl-ai-should-assist-not-replace",
      "relation": "member"
    },
    {
      "source": "cl-ai-should-assist-not-replace",
      "target": "zh-2030670762495972103",
      "relation": "bridge"
    },
    {
      "source": "a-1564466387070499726",
      "target": "cl-ai-not-replace-responsibility-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-replace-responsibility-roles",
      "target": "zh-2073408615956985818",
      "relation": "bridge"
    },
    {
      "source": "a-1564466387070499726",
      "target": "cl-ai-should-assist-not-replace",
      "relation": "member"
    },
    {
      "source": "cl-ai-should-assist-not-replace",
      "target": "zh-2073408615956985818",
      "relation": "bridge"
    },
    {
      "source": "a--9033255501595148655",
      "target": "cl-ai-not-replace-responsibility-roles",
      "relation": "member"
    },
    {
      "source": "cl-ai-not-replace-responsibility-roles",
      "target": "zh-496888426",
      "relation": "bridge"
    },
    {
      "source": "a-7967126021123033421",
      "target": "a-1075229406073438720",
      "relation": "rebuts"
    },
    {
      "source": "a-7967126021123033421",
      "target": "a-7627082454947294178",
      "relation": "rebuts"
    },
    {
      "source": "a-5112006109323949625",
      "target": "a-1075229406073438720",
      "relation": "rebuts"
    },
    {
      "source": "a-5112006109323949625",
      "target": "a-7627082454947294178",
      "relation": "rebuts"
    },
    {
      "source": "a--8096488367717744330",
      "target": "a-1075229406073438720",
      "relation": "rebuts"
    },
    {
      "source": "a--8096488367717744330",
      "target": "a-7627082454947294178",
      "relation": "rebuts"
    },
    {
      "source": "a-1075229406073438720",
      "target": "a--7087091483973468197",
      "relation": "rebuts"
    },
    {
      "source": "a-1075229406073438720",
      "target": "a-9019339624109839252",
      "relation": "rebuts"
    },
    {
      "source": "a-1075229406073438720",
      "target": "a--3181744553442995604",
      "relation": "rebuts"
    },
    {
      "source": "a-7627082454947294178",
      "target": "a--7087091483973468197",
      "relation": "rebuts"
    },
    {
      "source": "a-7627082454947294178",
      "target": "a-9019339624109839252",
      "relation": "rebuts"
    },
    {
      "source": "a-7627082454947294178",
      "target": "a--3181744553442995604",
      "relation": "rebuts"
    },
    {
      "source": "a--8393684584489265199",
      "target": "a-7786809911667768090",
      "relation": "rebuts"
    },
    {
      "source": "a--8393684584489265199",
      "target": "a-3008774721068965159",
      "relation": "rebuts"
    },
    {
      "source": "a-8809132565924223758",
      "target": "a--3822831705509045065",
      "relation": "rebuts"
    },
    {
      "source": "a--3822831705509045065",
      "target": "a-5175851305424032479",
      "relation": "rebuts"
    },
    {
      "source": "a-3008774721068965159",
      "target": "a--6345342579324424872",
      "relation": "rebuts"
    },
    {
      "source": "a-3008774721068965159",
      "target": "a-8717578469649032979",
      "relation": "rebuts"
    },
    {
      "source": "a-8202269146180933098",
      "target": "a-3864455554413364231",
      "relation": "rebuts"
    },
    {
      "source": "a-4298882669829287467",
      "target": "a-3864455554413364231",
      "relation": "rebuts"
    },
    {
      "source": "a-5148465118168203901",
      "target": "a--4174470938112234211",
      "relation": "rebuts"
    },
    {
      "source": "a-5148465118168203901",
      "target": "a-2774134015391990851",
      "relation": "rebuts"
    },
    {
      "source": "a-5148465118168203901",
      "target": "a--271755577056779633",
      "relation": "rebuts"
    },
    {
      "source": "a-7011770996733503369",
      "target": "a-3945245772520750417",
      "relation": "rebuts"
    },
    {
      "source": "a-7011770996733503369",
      "target": "a--6123579788034080189",
      "relation": "rebuts"
    },
    {
      "source": "a-4657783906339585386",
      "target": "a-3945245772520750417",
      "relation": "rebuts"
    },
    {
      "source": "a-4657783906339585386",
      "target": "a--6123579788034080189",
      "relation": "rebuts"
    },
    {
      "source": "a-8400187811174672471",
      "target": "a-3298101780382736051",
      "relation": "rebuts"
    },
    {
      "source": "a-3945245772520750417",
      "target": "a-3298101780382736051",
      "relation": "rebuts"
    },
    {
      "source": "a-3945245772520750417",
      "target": "a-3878948019650956180",
      "relation": "rebuts"
    },
    {
      "source": "a-3298101780382736051",
      "target": "a--6123579788034080189",
      "relation": "rebuts"
    },
    {
      "source": "a-3298101780382736051",
      "target": "a-4341191114694461656",
      "relation": "rebuts"
    },
    {
      "source": "a--6123579788034080189",
      "target": "a-3878948019650956180",
      "relation": "rebuts"
    },
    {
      "source": "a-3878948019650956180",
      "target": "a-7506223916112815660",
      "relation": "rebuts"
    },
    {
      "source": "a-3878948019650956180",
      "target": "a--3059213074980422546",
      "relation": "rebuts"
    },
    {
      "source": "a-3878948019650956180",
      "target": "a--8636163842687801585",
      "relation": "rebuts"
    },
    {
      "source": "a-3878948019650956180",
      "target": "a-4542281494250465893",
      "relation": "rebuts"
    },
    {
      "source": "a-1056678539764621563",
      "target": "a--4337304148717625052",
      "relation": "rebuts"
    },
    {
      "source": "a-7506223916112815660",
      "target": "a-4542281494250465893",
      "relation": "rebuts"
    },
    {
      "source": "a-7506223916112815660",
      "target": "a-6926770995914242054",
      "relation": "rebuts"
    },
    {
      "source": "a--3059213074980422546",
      "target": "a-4542281494250465893",
      "relation": "rebuts"
    },
    {
      "source": "a--3059213074980422546",
      "target": "a-6926770995914242054",
      "relation": "rebuts"
    },
    {
      "source": "a--8636163842687801585",
      "target": "a-4542281494250465893",
      "relation": "rebuts"
    },
    {
      "source": "a--8636163842687801585",
      "target": "a-6926770995914242054",
      "relation": "rebuts"
    },
    {
      "source": "a-4542281494250465893",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a-6926770995914242054",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a-7190083545853485598",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a--2483126025033303325",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a--3116936308957756347",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a--7486934681111155064",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a--5954909559545702906",
      "target": "a--6480506393744647351",
      "relation": "rebuts"
    },
    {
      "source": "a--5954909559545702906",
      "target": "a--4443599563206995841",
      "relation": "rebuts"
    },
    {
      "source": "a--5954909559545702906",
      "target": "a-479385971587492418",
      "relation": "rebuts"
    },
    {
      "source": "a--4443599563206995841",
      "target": "a--5108988535329087971",
      "relation": "rebuts"
    },
    {
      "source": "a--4443599563206995841",
      "target": "a--2576768985750860421",
      "relation": "rebuts"
    },
    {
      "source": "a--4443599563206995841",
      "target": "a--6647773154164476969",
      "relation": "rebuts"
    },
    {
      "source": "a-479385971587492418",
      "target": "a--2576768985750860421",
      "relation": "rebuts"
    },
    {
      "source": "a-479385971587492418",
      "target": "a--6647773154164476969",
      "relation": "rebuts"
    },
    {
      "source": "a-4769695036315054845",
      "target": "a-488001093571781838",
      "relation": "rebuts"
    },
    {
      "source": "a-4769695036315054845",
      "target": "a--7570075034349265",
      "relation": "rebuts"
    },
    {
      "source": "a-4769695036315054845",
      "target": "a-7599739875221353597",
      "relation": "rebuts"
    },
    {
      "source": "a-3306544196844106705",
      "target": "a-488001093571781838",
      "relation": "rebuts"
    },
    {
      "source": "a-3306544196844106705",
      "target": "a--7570075034349265",
      "relation": "rebuts"
    },
    {
      "source": "a-3306544196844106705",
      "target": "a-7599739875221353597",
      "relation": "rebuts"
    },
    {
      "source": "a-488001093571781838",
      "target": "a-8469733164666249423",
      "relation": "rebuts"
    },
    {
      "source": "a-488001093571781838",
      "target": "a-6530814464955242070",
      "relation": "rebuts"
    },
    {
      "source": "a-488001093571781838",
      "target": "a--9082679415443766728",
      "relation": "rebuts"
    },
    {
      "source": "a--4582466702302758498",
      "target": "a-7599739875221353597",
      "relation": "rebuts"
    },
    {
      "source": "a-8469733164666249423",
      "target": "a--7570075034349265",
      "relation": "rebuts"
    },
    {
      "source": "a-8469733164666249423",
      "target": "a-7599739875221353597",
      "relation": "rebuts"
    },
    {
      "source": "a--7570075034349265",
      "target": "a-6530814464955242070",
      "relation": "rebuts"
    },
    {
      "source": "a--7570075034349265",
      "target": "a--9082679415443766728",
      "relation": "rebuts"
    },
    {
      "source": "a-6530814464955242070",
      "target": "a-7599739875221353597",
      "relation": "rebuts"
    },
    {
      "source": "a--9082679415443766728",
      "target": "a-7599739875221353597",
      "relation": "rebuts"
    },
    {
      "source": "a--4240131651699878760",
      "target": "a-8256198252371469474",
      "relation": "rebuts"
    },
    {
      "source": "a--6020112849420017675",
      "target": "a--5590514558985009122",
      "relation": "rebuts"
    },
    {
      "source": "a--9169751937220422521",
      "target": "a-6078019214871629394",
      "relation": "rebuts"
    },
    {
      "source": "a-7178103508806517538",
      "target": "a-9190646177456802717",
      "relation": "rebuts"
    },
    {
      "source": "a-5887195202431428022",
      "target": "a-9190646177456802717",
      "relation": "rebuts"
    },
    {
      "source": "a--6542132015873777373",
      "target": "a-7503358984877483228",
      "relation": "rebuts"
    },
    {
      "source": "a-7503358984877483228",
      "target": "a-6558078831559221404",
      "relation": "rebuts"
    },
    {
      "source": "a--8312072853190959879",
      "target": "a-6558078831559221404",
      "relation": "rebuts"
    },
    {
      "source": "a--4342822993392195980",
      "target": "a-6558078831559221404",
      "relation": "rebuts"
    },
    {
      "source": "a--7698897246818580850",
      "target": "a-6558078831559221404",
      "relation": "rebuts"
    },
    {
      "source": "a-8863528003331150212",
      "target": "a--8937250665072027492",
      "relation": "rebuts"
    },
    {
      "source": "a--5009218611275704310",
      "target": "a--8937250665072027492",
      "relation": "rebuts"
    },
    {
      "source": "a--8937250665072027492",
      "target": "a-3132737687244157601",
      "relation": "rebuts"
    },
    {
      "source": "a-3132737687244157601",
      "target": "a--8887061255577345053",
      "relation": "rebuts"
    },
    {
      "source": "a-3132737687244157601",
      "target": "a--2147618782599451840",
      "relation": "rebuts"
    },
    {
      "source": "a-8130782778536502254",
      "target": "a--5721180101230092572",
      "relation": "rebuts"
    },
    {
      "source": "a-3265745577596313635",
      "target": "a-919684638745255504",
      "relation": "rebuts"
    },
    {
      "source": "a-919684638745255504",
      "target": "a--6298885924988383459",
      "relation": "rebuts"
    }
  ]
};
