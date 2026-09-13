# -*- coding: utf-8 -*-
"""补齐被限流中断的关键词采集，带指数退避。"""
import json, os, subprocess, time

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")
CLI = r"C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe"

kws = [l.strip() for l in open(os.path.join(BASE, "keywords.txt"), encoding="utf-8") if l.strip()]

pending = []
for i, kw in enumerate(kws, 1):
    n = "%02d" % i
    p = os.path.join(RAW, f"kw_{n}.json")
    ok = False
    if os.path.exists(p):
        try:
            d = json.load(open(p, encoding="utf-8"))
            ok = bool((d.get("Data") or {}).get("Items"))
        except Exception:
            ok = False
    if not ok:
        pending.append((n, kw))

print("待补采:", [(n, k) for n, k in pending])

for n, kw in pending:
    p = os.path.join(RAW, f"kw_{n}.json")
    for attempt in range(5):
        r = subprocess.run([CLI, "search", "zhihu", "--query", kw, "--count", "10"],
                           capture_output=True, text=True, encoding="utf-8", timeout=90)
        out = r.stdout or ""
        open(p, "w", encoding="utf-8").write(out)
        try:
            d = json.loads(out)
            items = (d.get("Data") or {}).get("Items") or []
        except Exception:
            items = []
        if items:
            print(f"[{n}] {kw} -> {len(items)} 条")
            break
        wait = 20 * (attempt + 1)
        print(f"[{n}] {kw} 失败(第{attempt+1}次) {d.get('Message') if 'd' in dir() else out[:80]} 等待{wait}s")
        time.sleep(wait)
    time.sleep(8)

print("补采完成")
