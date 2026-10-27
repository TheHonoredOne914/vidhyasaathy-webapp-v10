$r='C:\Users\jce\OneDrive\Desktop\VidhyaSaathy\Frontend\vidhyasaathy-webapp'; Set-Location $r
function Run($n){ "$n start $(Get-Date)" | Add-Content plan\games\run.log; Get-Content -Raw "plan\games\$n.md" | codex exec -s workspace-write - *> "plan\games\$n.log"; "$n end $(Get-Date)" | Add-Content plan\games\run.log }
Run 'ENGINE'
$batches=@(@('GAME_atom','GAME_cell','GAME_matter'),@('GAME_motion','GAME_newton','GAME_float'),@('GAME_energy','GAME_sound','GAME_graphs','GAME_poly'))
foreach($b in $batches){ $j=$b | % { Start-Job -ArgumentList $r,$_ -ScriptBlock { param($r,$n) Set-Location $r; "$n start $(Get-Date)" | Add-Content plan\games\run.log; Get-Content -Raw "plan\games\$n.md" | codex exec -s workspace-write - *> "plan\games\$n.log"; "$n end $(Get-Date)" | Add-Content plan\games\run.log } }; $j | Wait-Job | Out-Null }
"ALL DONE $(Get-Date)" | Add-Content plan\games\run.log
