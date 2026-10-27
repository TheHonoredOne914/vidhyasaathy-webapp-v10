$r="C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp"; Set-Location $r; $log="$r\plan\v3\run.log"
function Run($n){ Add-Content $log "$n start $(Get-Date)"; Get-Content -Raw "plan/v3/$n.md" | codex exec -s workspace-write - *> "plan/v3/$n.out"; Add-Content $log "$n end $(Get-Date)" }
function Par($a){ $j=foreach($n in $a){ Start-Job -ArgumentList $r,$n,$log { param($r,$n,$log) Set-Location $r; Add-Content $log "$n start $(Get-Date)"; Get-Content -Raw "plan/v3/$n.md" | codex exec -s workspace-write - *> "plan/v3/$n.out"; Add-Content $log "$n end $(Get-Date)" } }; $j | Wait-Job | Out-Null }
Run P1_UIKIT
Par @('P2_LANDING','P3_STUDENT')
Add-Content $log "UI_MILESTONE $(Get-Date)"
Par @('G_ATOM','G_CELL')
Add-Content $log "GAMES_MILESTONE $(Get-Date)"
Par @('P4_STAFF','P5_EXAMINER')
Add-Content $log "ALL DONE $(Get-Date)"
