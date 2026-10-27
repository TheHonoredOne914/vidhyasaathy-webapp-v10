$r="C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp"; Set-Location $r
$log="$r\plan\resume.log"
$jobs=foreach($g in "motion","newton","float","energy","sound","graphs","poly"){ Start-Job -ArgumentList $r,$g,$log { param($r,$g,$log) Set-Location $r; Add-Content $log "GAME_$g start $(Get-Date)"; Get-Content -Raw "plan/games/GAME_$g.md" | codex exec -s workspace-write - *> "plan/games/$g.out"; Add-Content $log "GAME_$g end $(Get-Date)" } }
$jobs | Wait-Job | Out-Null
foreach($b in "UIKIT","SHELL","ADMIN","TEACHER","STUDENT","PARENT","FINAL"){ Add-Content $log "$b start $(Get-Date)"; Get-Content -Raw "plan/BUILD_$b.md" | codex exec -s workspace-write - *> "plan/$b.out"; Add-Content $log "$b end $(Get-Date)" }
Add-Content $log "ALL DONE $(Get-Date)"
