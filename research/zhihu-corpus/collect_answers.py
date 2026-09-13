#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
知乎「问题 -> 回答」采集流水线（zhihu-cli 0.6.0+）

链路:
  1) question recommend --query <主题>   -> 按主题找问题（甜区议题候选）
  2) question answers --question-url <URL> --limit 20 [--offset N]
                                          -> 拿该问题下的回答摘要

用法:
  python collect_answers.py recommend                 # 只跑第 1 步，输出候选问题
  python collect_answers.py answers <question_url>    # 只跑第 2 步
  python collect_answers.py pipeline "该不该 值得吗"   # 两步连跑，自动取前 N 个问题

注意:
  - question_answers 与 question recommend 共享同一份额度（默认 10 次/账号）
  - 每次调用前先查额度，不足则中止，避免浪费
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

BASE = Path(__file__).parent
RAW = BASE / "raw"
RAW.mkdir(exist_ok=True)


def find_cli() -> Path:
    """定位 zhihu-cli 可执行文件，优先使用最高版本（question 命令需 0.6.0+）。"""
    home = Path(os.environ.get("LOCALAPPDATA", "")) / "ZhihuCLI"
    cands = []
    for p in (home / "versions").glob("*/*zhihu-cli.exe"):
        m = re.match(r"(\d+)\.(\d+)\.(\d+)", p.parent.name)
        if m:
            cands.append((tuple(int(x) for x in m.groups()), p))
    if cands:
        cands.sort(reverse=True)
        return cands[0][1]
    p = home / "current" / "zhihu-cli.exe"
    if p.exists():
        return p
    sys.exit("未找到 zhihu-cli，请先运行 setup")


CLI = find_cli()


def run(args, timeout=200):
    """调用 CLI 并返回解析后的 JSON。"""
    proc = subprocess.run(
        [str(CLI), *args], capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=timeout,
    )
    out = (proc.stdout or "").strip()
    if not out:
        return {"Code": -1, "Message": (proc.stderr or "empty output").strip()}
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return {"Code": -1, "Message": out[:400]}


def quota_remaining(api_id="question_answers") -> int:
    d = run(["quota", "--api-id", api_id])
    for x in (d.get("Data") or []):
        if x.get("APIID") == api_id:
            return int(x.get("RemainingQuota", 0))
    return 0


def step_recommend(query, count=10):
    """按主题推荐问题。"""
    d = run(["question", "recommend", "--query", query, "--count", str(count)])
    return (d.get("Data") or {}).get("Items") or []


def step_answers(url, limit=20, offset=0, max_pages=1):
    """拉取一个问题下的回答，可翻页。"""
    items, paging = [], {}
    for i in range(max_pages):
        args = ["question", "answers", "--question-url", url,
                "--limit", str(limit)]
        if offset or i:
            args += ["--offset", str(offset + i * limit)]
        d = run(args)
        if d.get("Code") != 0:
            print(f"  [warn] {d.get('Message')}")
            break
        data = d.get("Data") or {}
        batch = data.get("Items") or []
        items.extend(batch)
        paging = data.get("Paging") or {}
        print(f"  第{i+1}页: {len(batch)} 条, IsEnd={paging.get('IsEnd')}")
        if paging.get("IsEnd"):
            break
        time.sleep(1)
    return items, paging


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "pipeline"
    left = quota_remaining()
    print(f"zhihu-cli: {CLI.parent.name}  |  question_answers 剩余额度: {left}")
    if left <= 0:
        sys.exit("额度耗尽，请等待重置")

    if mode == "recommend":
        query = sys.argv[2] if len(sys.argv) > 2 else "该不该 值得吗 人生选择"
        items = step_recommend(query)
        out = RAW / "recommended_questions.json"
        out.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\n候选问题 {len(items)} 条 -> {out.name}")
        for i, it in enumerate(items, 1):
            print(f"{i:>3}. {it['Title'][:52]}  {it['Url']}")

    elif mode == "answers":
        url = sys.argv[2]
        pages = int(sys.argv[3]) if len(sys.argv) > 3 else 1
        items, paging = step_answers(url, max_pages=pages)
        qid = url.rstrip("/").split("/")[-1]
        out = RAW / f"answers_{qid}.json"
        out.write_text(json.dumps(
            {"question_url": url, "items": items, "paging": paging},
            ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\n回答 {len(items)} 条 -> {out.name}")

    elif mode == "pipeline":
        query = sys.argv[2] if len(sys.argv) > 2 else "该不该 值得吗 人生选择"
        nq = int(sys.argv[3]) if len(sys.argv) > 3 else 2
        pages = int(sys.argv[4]) if len(sys.argv) > 4 else 1
        qs = step_recommend(query, count=10)
        print(f"\n候选问题 {len(qs)} 条，取前 {nq} 个拉回答")
        for q in qs[:nq]:
            print(f"\n=== {q['Title'][:50]} ===")
            items, paging = step_answers(q["Url"], max_pages=pages)
            qid = q["Url"].rstrip("/").split("/")[-1]
            rec = {"title": q["Title"], "url": q["Url"],
                   "items": items, "paging": paging}
            (RAW / f"answers_{qid}.json").write_text(
                json.dumps(rec, ensure_ascii=False, indent=1), encoding="utf-8")

    else:
        print(__doc__)


if __name__ == "__main__":
    main()
