$ErrorActionPreference = "Continue"
$cli = "C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe"
$out = Join-Path $PSScriptRoot "raw"

# 5 个同域议题：AI 与技术职业。彼此共享"人是否可替代""能力如何定义""教育有无意义"等底层争论，
# 这样跨议题的 same-claim 关系才是真实存在的，不是硬凑。
$queries = @{
  "t1_ai_replace_programmer" = "AI 会取代程序员吗"
  "t2_learn_programming"     = "AI 时代还值得学编程吗 大学计算机专业"
  "t3_ai_replace_creator"    = "AI 会取代设计师和内容创作者吗"
  "t4_cs_major_value"        = "计算机专业还值得报考吗 就业前景"
  "t5_ai_human_judgment"     = "AI 无法替代人类的核心能力是什么"
}

foreach ($k in $queries.Keys) {
  $f = Join-Path $out "$k.json"
  if (Test-Path $f) { Write-Output "SKIP(exists) $k"; continue }
  Write-Output "FETCH $k <= $($queries[$k])"
  & $cli search zhihu --query $queries[$k] --count 10 --timeout 90s 2>$null | Out-File -FilePath $f -Encoding utf8
  Start-Sleep -Seconds 2
}
Write-Output "DONE"
