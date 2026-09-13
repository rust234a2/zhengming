#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""立场均衡度验证：对甜区议题的回答做立场聚类，检验「句式甜区 != 可辩」假设。"""
import json
import subprocess
from pathlib import Path

BASE = Path(__file__).parent
RAW = BASE / "raw"
CLI = str(Path.home() / "AppData/Local/ZhihuCLI/versions/0.6.0/zhihu-cli.exe")

QUESTIONS = {
    "2038884733304697602": "43岁县中物理老师考上苏州头部公办校，该不该辞职去？",
    "1965011596905522487": "送孩子去国际学校，高昂学费投入真的值得吗？",
    "1952821980752484262": "自由是「拥有更多选择」，还是「不需要做选择」？",
}

PROMPT = """你是立场分析器。下面是知乎问题「{q}」下的 {n} 条回答摘要（编号 1-{n}）。

对每条回答输出一个 JSON 对象，格式：
{{"id": 编号, "cluster": "立场标签(≤10字，相同立场必须用相同标签)", "valid": true或false}}

valid=false 表示：噪声(太短/无观点/纯讲故事没表态/答非所问)。
不要输出任何其他文字，只输出 JSON 数组。

回答列表：
{answers}"""


def zhida(query: str) -> str:
    p = subprocess.run(
        [CLI, "answer", "--query", query, "--model", "zhida-fast-1p5"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=200,
    )
    d = json.loads((p.stdout or "").strip())
    return d["choices"][0]["message"]["content"]


def extract_json(text: str):
    s, e = text.find("["), text.rfind("]")
    if s < 0 or e < 0:
        return []
    try:
        return json.loads(text[s:e + 1])
    except json.JSONDecodeError:
        return []


def main():
    report = {}
    for qid, qtitle in QUESTIONS.items():
        d = json.load(open(RAW / f"answers_{qid}.json", encoding="utf-8"))
        items = (d.get("Data") or {}).get("Items") or []
        answers = "\n".join(
            f"{i}. {(it.get('Summary') or '').strip()[:180]}"
            for i, it in enumerate(items, 1))
        prompt = PROMPT.format(q=qtitle, n=len(items), answers=answers)
        out = extract_json(zhida(prompt))
        clusters = {}
        for r in out:
            if not r.get("valid"):
                continue
            clusters.setdefault(r.get("cluster", "?"), []).append(r["id"])
        ranked = sorted(clusters.items(), key=lambda x: -len(x[1]))
        valid_n = sum(len(v) for v in clusters.values())
        top = len(ranked[0][1]) if ranked else 0
        ratio = top / valid_n * 100 if valid_n else 0
        report[qtitle] = {"total": len(items), "valid": valid_n,
                          "top_cluster": ranked[0][0] if ranked else "-",
                          "top_n": top, "ratio": round(ratio),
                          "clusters": {k: len(v) for k, v in ranked}}
        print(f"\n=== {qtitle[:30]} ===")
        print(f"回答 {len(items)} 条，有效 {valid_n} 条，立场簇 {len(clusters)} 个")
        for k, v in ranked:
            print(f"  {len(v):>2}  {k}")
        bal = "失衡" if ratio > 70 else ("偏斜" if ratio > 55 else "均衡")
        print(f"  最大簇占比 {ratio:.0f}% -> {bal}")

    (BASE / "stance_balance.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
