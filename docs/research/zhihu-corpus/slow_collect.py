# -*- coding: utf-8 -*-
"""慢速补采：限流下每次间隔 45s，总时限 25 分钟，成功即停。"""
import json, os, subprocess, time

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")
CLI = r"C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe"
DEADLINE = time.time() + 25 * 60

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

print("待补采 %d 个: %s" % (len(pending), [k for _, k in pending]), flush=True)

done = 0
for n, kw in pending:
    p = os.path.join(RAW, f"kw_{n}.json")
    got = False
    while time.time() < DEADLINE:
        try:
            r = subprocess.run([CLI, "search", "zhihu", "--query", kw, "--count", "10"],
                               capture_output=True, text=True, encoding="utf-8", timeout=90)
            out = r.stdout or ""
        except Exception as e:
            out = ""
        try:
            d = json.loads(out)
            items = (d.get("Data") or {}).get("Items") or []
        except Exception:
            d, items = {}, []
        if items:
            open(p, "w", encoding="utf-8").write(out)
            print(f"OK [{n}] {kw} -> {len(items)} 条", flush=True)
            got = True
            done += 1
            break
        time.sleep(45)
    if not got:
        print(f"SKIP [{n}] {kw} 仍未恢复", flush=True)
        break  # 仍未恢复则不再空转
    time.sleep(12)

print(f"补采完成，新增 {done} 个关键词", flush=True)
