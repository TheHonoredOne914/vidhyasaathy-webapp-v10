cd C:\Users\HP\vidhyasaathy-webapp
Get-CimInstance Win32_Process | ?{$_.CommandLine -match 'index.js -p'} | %{ Wait-Process -Id $_.ProcessId -EA SilentlyContinue }
git add -A; git commit -m "v2 auth redesign, landing v2, perf, test fixes" | Out-Null
$cur = $null
foreach($p in 3..7){
  Get-Content -Raw "plan\CODEX_P$p.md" | codex exec -s workspace-write - *> "plan\codex_p$p.log"
  if($cur){ $cur.WaitForExit() }
  "P$p codex done $(Get-Date)" | Add-Content plan\pipeline.log
  $cur = Start-Process powershell -PassThru -WindowStyle Hidden -ArgumentList '-Command',"cd C:\Users\HP\vidhyasaathy-webapp; cursor-agent -p --force (Get-Content -Raw plan\CURSOR_P$p.md) *> plan\cursor_p$p.log"
}
$cur.WaitForExit(); "ALL DONE $(Get-Date)" | Add-Content plan\pipeline.log
