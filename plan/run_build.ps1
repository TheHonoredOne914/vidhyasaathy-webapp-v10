$r='C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp'; Set-Location $r
while(-not (Select-String -Path plan\games\run.log -Pattern 'ALL DONE' -Quiet -EA 0)){ Start-Sleep 30 }
function Run($n){ "$n start $(Get-Date)" | Add-Content plan\build.log; Get-Content -Raw "plan\BUILD_$n.md" | codex exec -s workspace-write - *> "plan\build_$n.log"; "$n end $(Get-Date)" | Add-Content plan\build.log }
Run 'UIKIT'; Run 'SHELL'; Run 'ADMIN'; Run 'TEACHER'; Run 'STUDENT'; Run 'PARENT'; Run 'FINAL'
"ALL DONE $(Get-Date)" | Add-Content plan\build.log
