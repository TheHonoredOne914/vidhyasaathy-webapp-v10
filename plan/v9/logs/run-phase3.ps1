$env:Path = 'C:\Users\jce\AppData\Local\node24;' + $env:Path
Set-Location 'C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-p3'
$prompt = Get-Content -Raw 'plan\v9\codex-phase3-prompt.txt'
$prompt | codex exec -C 'C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-p3' -s workspace-write --dangerously-bypass-approvals-and-sandbox -c model_reasoning_effort="medium" -o 'plan\v9\logs\phase3-last.txt' - 2>&1 | Tee-Object -FilePath 'C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp\plan\v9\logs\phase3-codex.log'
Write-Output "PHASE3_EXIT=$LASTEXITCODE"
