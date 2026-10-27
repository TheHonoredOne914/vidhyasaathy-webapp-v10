$env:Path = 'C:\Users\jce\AppData\Local\node24;' + $env:Path
Set-Location 'C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-p2'
$prompt = Get-Content -Raw 'plan\v9\codex-phase2-prompt.txt'
$prompt | codex exec -C 'C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-p2' -s workspace-write --dangerously-bypass-approvals-and-sandbox -c model_reasoning_effort="medium" -o 'plan\v9\logs\phase2-last.txt' - 2>&1 | Tee-Object -FilePath 'C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp\plan\v9\logs\phase2-codex.log'
Write-Output "PHASE2_EXIT=$LASTEXITCODE"
