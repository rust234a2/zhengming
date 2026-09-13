# -*- coding: utf-8 -*-
"""基于句式关键词对知乎标题做类型归类 + 辩论适配度评估。

一级：按句式关键词（关键词分类）
二级：按宾语性质判定可辩性（同一句式，宾语决定能不能吵起来）
"""
import json, os, re, collections

BASE = os.path.dirname(os.path.abspath(__file__))

# (类型, 正则列表) —— 按优先级从高到低
RULES = [
    ("情境假设", [r"穿越", r"如果.{0,16}你会", r"假如你是", r"假设你", r"如果是你", r"你会怎么办", r"重生"]),
    ("事实核查", [r"是真的吗", r"真的吗", r"真的假的", r"谣言", r"辟谣", r"确有其事", r"真实性", r"是不是真的"]),
    ("观点评价", [r"如何评价", r"怎么看", r"如何看待", r"怎么看待", r"怎样看待", r"如何看", r"作何评价", r"怎么评价"]),
    ("决策抉择", [r"该不该", r"要不要", r"值得吗", r"有必要吗", r"应不应该", r"值不值", r"该不该", r"划不划算", r"要不要"]),
    ("预测推演", [r"会不会", r"能.{0,10}吗", r"会成为", r"意味着什么", r"会产生哪些影响", r"带来哪些", r"还有.{0,4}竞争力吗", r"不可避免吗"]),
    ("资源聚合", [r"有哪些", r"有什么", r"求推荐", r"推荐一下", r"盘点", r"汇总", r"合集", r"书单", r"清单", r"值得一看"]),
    ("经验叙事", [r"是什么体验", r"什么感受", r"什么感觉", r"我的.{0,8}经历", r"我是怎么"]),
    ("实务求助", [r"怎么办", r"怎么才能", r"该如何", r"求教", r"求助", r"请教", r"注意什么", r"怎么处理", r"如何办理", r"需要什么"]),
    ("概念辨析", [r"是什么", r"什么叫", r"什么意思", r"的定义", r"到底指", r"算是", r"算不算"]),
    ("比较选择", [r"哪个更好", r"哪个更", r"还是.{0,12}哪个", r"对比", r"vs", r"有什么区别", r"哪个更值得"]),
    ("归因探究", [r"为什么", r"为何", r"是什么原因", r"怎么会", r"咋回事"]),
    ("审美评价", [r"好看吗", r"好听吗", r"水平如何", r"成色", r"怎么样"]),
]
FALLBACK = "其他/未分类"

# 二级：宾语性质 → 可辩性档位。用关键词粗判。
SCIENCE_HINT = r"体温|大脑|物理|化学|数学|生物|光|电|原子|进化|宇宙|地球|医学|病|发烧|睡眠|记忆|神经|算法|模型训练|为什么会冷"
MOTIVE_HINT = r"他|她|为什么要在|为什么要在镜头|心理|动机|是不是故意|为什么总|为什么喜欢问"
SOCIAL_HINT = r"年轻人|90后|00后|社会|教育|职场|房价|生育|结婚|躺平|内卷|县城|农村|行业|公司|市场|政策|文化|历史|为什么现在|为什么很多"

TIER = {
    # 类型: (认知性质, 可辩性档位, 辩论适配, 说明)
    "事实核查": ("事实认定", "排除区", "✗", "有唯一答案，查证即可，无可辩空间"),
    "资源聚合": ("信息列举", "排除区", "✗", "答案是清单，不存在对立立场"),
    "实务求助": ("操作求解", "排除区", "✗", "求的是步骤，不是观点"),
    "经验叙事": ("个人经历", "排除区", "✗", "比的是谁的经历更特别，不是论证"),
    "审美评价": ("主观偏好", "弱可辩", "△", "偏好分歧，无推理链，吵不出东西"),
    "归因探究": ("因果解释", "弱可辩→可用", "○", "取决于宾语：科学机制有标准答案，社会成因可辩"),
    "概念辨析": ("定义界定", "可用区", "○", "被低估：可辩性高、天然收敛、不需外部事实"),
    "比较选择": ("权衡取舍", "可用区", "○", "可辩，但易退化成参数罗列"),
    "观点评价": ("价值+论证", "甜区（高风险）", "◎", "主战场；但多为时事，事实未定、情绪浓度高"),
    "决策抉择": ("价值判断", "甜区", "◎", "最干净：不涉事实、不站队、人人可答、理由有分辨力"),
    "预测推演": ("预判", "甜区", "◎", "独有优势是可证伪，可做「三个月后回看」钩子"),
    "情境假设": ("思想实验", "甜区", "◎", "知乎独有：无标准答案、需完整推理链、不涉身份政治"),
    "其他/未分类": ("—", "待判", "?", "需人工复核"),
}


def classify(title):
    for name, pats in RULES:
        for p in pats:
            if re.search(p, title):
                return name, p
    return FALLBACK, ""


def sub_tier(ttype, title):
    """二级判定：同一类型内按宾语调整可辩性。"""
    if ttype == "归因探究":
        if re.search(SCIENCE_HINT, title):
            return "排除区", "问自然/科学机制，有标准答案"
        if re.search(MOTIVE_HINT, title):
            return "弱可辩", "揣测他人动机，无证据可依"
        if re.search(SOCIAL_HINT, title):
            return "可用区", "问社会现象成因，多因一果，可辩"
        return "弱可辩", "归因对象不明确"
    if ttype == "观点评价":
        if re.search(r"电影|电视剧|综艺|游戏|小说|专辑|歌|角色|演员|导演|恋综|评分|IMDb", title):
            return "弱可辩", "评价文艺作品，属审美偏好"
        if re.search(r"去世|逝世|逝世|事件|通报|政策|宣布|披露|争议|曝光|上市|发布", title):
            return "甜区（高风险）", "评价公共事件/决策，可辩但事实未定"
        return "可用区", "评价人物或长期现象"
    if ttype == "决策抉择":
        return "甜区", "个人价值取舍，无事实争议"
    return TIER.get(ttype, ("—", "待判", "?", ""))[1], TIER.get(ttype, ("—", "待判", "?", ""))[3]


def main():
    rows = json.load(open(os.path.join(BASE, "titles.json"), encoding="utf-8"))
    out = []
    for r in rows:
        t, pat = classify(r["title"])
        tier, note = sub_tier(t, r["title"])
        r2 = dict(r)
        r2["type"] = t
        r2["hit"] = pat
        r2["tier"] = tier
        r2["note"] = note
        out.append(r2)

    cnt = collections.Counter(r["type"] for r in out)
    print("总标题数:", len(out))
    print("\n== 类型分布 ==")
    for k, v in cnt.most_common():
        print(f"  {k:<10} {v:>4}  ({v/len(out)*100:4.1f}%)")

    print("\n== 可辩性档位分布 ==")
    tc = collections.Counter(r["tier"] for r in out)
    for k, v in tc.most_common():
        print(f"  {k:<14} {v:>4}  ({v/len(out)*100:4.1f}%)")

    print("\n== 关键词 × 类型 ==")
    cross = collections.defaultdict(collections.Counter)
    for r in out:
        for kw in r["kw"]:
            cross[kw][r["type"]] += 1
    for kw in sorted(cross):
        top = cross[kw].most_common(3)
        print(f"  {kw:<10} " + " | ".join(f"{t}:{c}" for t, c in top))

    by = collections.defaultdict(list)
    for r in out:
        by[r["type"]].append(r)
    print("\n== 各类型样例 ==")
    for k, c in cnt.most_common():
        print(f"\n【{k}】{c} 条 | 档位 {TIER.get(k,('?','?','?','?'))[1]} | 适配 {TIER.get(k,('?','?','?','?'))[2]}")
        for r in by[k][:5]:
            print(f"   - {r['title']}  → {r['tier']}")

    json.dump(out, open(os.path.join(BASE, "classified.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    with open(os.path.join(BASE, "classified.txt"), "w", encoding="utf-8") as f:
        for r in out:
            f.write(f"{r['type']}\t{r['tier']}\t{r['title']}\n")


if __name__ == "__main__":
    main()
