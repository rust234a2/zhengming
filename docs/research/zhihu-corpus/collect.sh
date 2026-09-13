#!/usr/bin/env bash
# 按句式关键词批量采集知乎标题语料
CLI="/c/Users/Lenovo/AppData/Local/ZhihuCLI/current/zhihu-cli.exe"
# 路径相对脚本自身推导（用 ${BASH_SOURCE[0]} 而非 dirname，本机 coreutils 可能缺失）
DIR="$(cd "${BASH_SOURCE[0]%/*}" && pwd)"
OUT="$DIR/raw"
mkdir -p "$OUT"
: > "$DIR/mapping.tsv"

i=0
while IFS= read -r kw; do
  [ -z "$kw" ] && continue
  i=$((i+1))
  n=$(printf "%02d" $i)
  "$CLI" search zhihu --query "$kw" --count 10 > "$OUT/kw_${n}.json" 2>&1
  printf "%s\t%s\n" "$n" "$kw" >> "$DIR/mapping.tsv"
  echo "[$n] $kw ok"
done < "$DIR/keywords.txt"

echo "total keywords: $i"
