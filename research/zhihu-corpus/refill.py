#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""补采剩余关键词（实名认证后额度充足版）。"""
import json
import subprocess
import sys
import time
from pathlib import Path

BASE = Path(__file__).parent
RAW = BASE / "raw"
CLI = str(Path.home() / "AppData/Local/ZhihuCLI/versions/0.6.0/zhihu-cli.exe")

KEYWORDS = [
    "怎么办", "如何", "求推荐", "靠谱吗", "会不会", "哪个更好", "是什么",
    "真的能", "有必要吗", "盘点", "深度解析", "万字", "吐槽", "分享",
    "你觉得", "是不是",
]
START_IDX = 9  # kw_09 起


def fetch(kw: str, idx: int) -> bool:
    out = RAW / f"kw_{idx:02d}.json"
    p = subprocess.run(
        [CLI, "search", "zhihu", "--query", kw, "--count", "10"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=120,
    )
    try:
        d = json.loads((p.stdout or "").strip())
    except json.JSONDecodeError:
        print(f"[{idx:02d}] {kw}: 解析失败 {p.stdout[:100]}")
        return False
    items = (d.get("Data") or {}).get("Items") or []
    if d.get("Code") == 0 and items:
        out.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        print(f"[{idx:02d}] {kw}: {len(items)} 条")
        return True
    print(f"[{idx:02d}] {kw}: Code={d.get('Code')} {d.get('Message')}")
    return False


def main():
    ok = 0
    for i, kw in enumerate(KEYWORDS, START_IDX):
        if fetch(kw, i):
            ok += 1
        time.sleep(2)
    print(f"\n完成 {ok}/{len(KEYWORDS)}")


if __name__ == "__main__":
    sys.exit(main())
