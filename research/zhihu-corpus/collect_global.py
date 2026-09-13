# -*- coding: utf-8 -*-
"""用 search global（独立配额）+ 自然问句补全缺失类型的知乎标题语料。"""
import json, os, subprocess, time

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")
CLI = r"C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe"

# (query, 目标类型标签)
QUERIES = [
    ("在南极工作是一种怎样的体验", "经验叙事"),
    ("从大厂裸辞是什么体验", "经验叙事"),
    ("35岁被裁员怎么办", "实务求助"),
    ("孩子沉迷手机家长该怎么办", "实务求助"),
    ("预算三千求推荐笔记本电脑", "求推荐"),
    ("求推荐适合睡前读的书", "求推荐"),
    ("盘点那些年被低估的国产剧", "盘点"),
    ("盘点好用但小众的软件", "盘点"),
    ("吐槽遇到过最离谱的甲方", "吐槽"),
    ("装修踩过的坑 吐槽", "吐槽"),
    ("万字长文 讲透底层逻辑", "深度长文"),
    ("深度解析大模型原理", "深度长文"),
    ("考研和就业哪个更好", "比较选择"),
    ("新能源车和燃油车哪个更好", "比较选择"),
    ("什么才算真正的中产", "概念辨析"),
    ("内向算不算缺点", "概念辨析"),
    ("人工智能会不会取代程序员", "预测推演"),
    ("远程办公会不会成为主流", "预测推演"),
    ("如果穿越回十年前你会做什么", "情境假设"),
    ("如果你有五百万你会怎么花", "情境假设"),
]

out_rows = []
for i, (q, tag) in enumerate(QUERIES, 1):
    n = "%02d" % i
    p = os.path.join(RAW, f"g_{n}.json")
    items = []
    for attempt in range(3):
        try:
            r = subprocess.run([CLI, "search", "global", "--query", q, "--count", "10"],
                               capture_output=True, text=True, encoding="utf-8", timeout=90)
            out = r.stdout or ""
        except Exception:
            out = ""
        try:
            d = json.loads(out)
            items = (d.get("Data") or {}).get("Items") or []
        except Exception:
            items = []
        if items or "rate limit" not in out:
            open(p, "w", encoding="utf-8").write(out)
            break
        time.sleep(20)
    zh = [it for it in items
          if "zhihu" in ((it.get("Title") or "") + (it.get("Url") or "")).lower()]
    for it in zh:
        out_rows.append({"title": it.get("Title", "").replace(" - 知乎", "").strip(),
                         "q": q, "tag": tag, "url": it.get("Url", "")})
    print(f"[{n}] {q}  总{len(items)} 知乎{len(zh)}", flush=True)
    time.sleep(3)

json.dump(out_rows, open(os.path.join(BASE, "global_titles.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("采集完成，知乎标题合计:", len(out_rows))
