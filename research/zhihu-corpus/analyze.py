# -*- coding: utf-8 -*-
import json, glob, os, re, collections

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")

# 关键词映射
mapping = {}
with open(os.path.join(BASE, "mapping.tsv"), encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        n, kw = line.split("\t")
        mapping[n] = kw

rows = []  # {title, kw, source, ctype}

def clean(t):
    t = t.strip()
    t = re.sub(r"\s*-\s*知乎\s*$", "", t)
    t = re.sub(r"\s+", " ", t)
    return t

# 热榜
p = os.path.join(RAW, "hot.json")
with open(p, encoding="utf-8") as f:
    d = json.load(f)
for it in d.get("Data", {}).get("Items", []):
    rows.append({"title": clean(it.get("Title", "")), "kw": "__hot__",
                 "ctype": "Hot", "url": it.get("Url", "")})

# 关键词搜索
for p in sorted(glob.glob(os.path.join(RAW, "kw_*.json"))):
    n = os.path.basename(p)[3:5]
    kw = mapping.get(n, "?")
    try:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
    except Exception as e:
        print("PARSE FAIL", p, e)
        continue
    data = d.get("Data") or {}
    items = data.get("Items") or []
    if not items:
        print(f"  !! 无结果: [{n}] {kw}  code={d.get('Code')} msg={d.get('Message')}")
    for it in items:
        rows.append({"title": clean(it.get("Title", "")), "kw": kw,
                     "ctype": it.get("ContentType", ""), "url": it.get("Url", "")})

# 去重（按标题）
seen = {}
for r in rows:
    if not r["title"]:
        continue
    k = r["title"]
    if k in seen:
        seen[k]["kw"].add(r["kw"])
    else:
        seen[k] = {"title": k, "kw": {r["kw"]}, "ctype": r["ctype"], "url": r["url"]}

print("原始条目:", len(rows), " 去重后标题:", len(seen))
print("内容类型分布:", collections.Counter(r["ctype"] for r in rows))
print("各关键词命中数:")
for n in sorted(mapping):
    c = sum(1 for r in rows if r["kw"] == mapping[n])
    print(f"  {mapping[n]:<8} {c}")

with open(os.path.join(BASE, "titles.txt"), "w", encoding="utf-8") as f:
    for i, (k, v) in enumerate(seen.items(), 1):
        f.write(f"{i}\t{k}\t{','.join(sorted(v['kw']))}\t{v['ctype']}\n")

with open(os.path.join(BASE, "titles.json"), "w", encoding="utf-8") as f:
    json.dump([{"title": v["title"], "kw": sorted(v["kw"]), "ctype": v["ctype"],
                "url": v["url"]} for v in seen.values()], f, ensure_ascii=False, indent=1)
