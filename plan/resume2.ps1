$r="C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp"; Set-Location $r
$log="$r\plan\resume.log"
while(Get-Process -Id 6340 -ErrorAction SilentlyContinue){ Start-Sleep 10 }
Add-Content $log "UIKIT end $(Get-Date)"
Add-Content $log "SHELL start $(Get-Date)"; Get-Content -Raw "plan/BUILD_SHELL.md" | codex exec -s workspace-write - *> "plan/SHELL.out"; Add-Content $log "SHELL end $(Get-Date)"
$note="`n`nNOTE: Other role builds run in parallel. Edit only files for your role; when committing use 'git add <your paths>' and 'git commit -- <your paths>' only, never 'git add -A'. If a commit fails due to lock, wait and retry."
$jobs=foreach($b in "ADMIN","TEACHER","STUDENT","PARENT"){ Start-Job -ArgumentList $r,$b,$log,$note { param($r,$b,$log,$note) Set-Location $r; Add-Content $log "$b start $(Get-Date)"; ((Get-Content -Raw "plan/BUILD_$b.md")+$note) | codex exec -s workspace-write - *> "plan/$b.out"; Add-Content $log "$b end $(Get-Date)" } }
$jobs | Wait-Job | Out-Null
Add-Content $log "FINAL start $(Get-Date)"; Get-Content -Raw "plan/BUILD_FINAL.md" | codex exec -s workspace-write - *> "plan/FINAL.out"; Add-Content $log "FINAL end $(Get-Date)"
Add-Content $log "ALL DONE $(Get-Date)"
