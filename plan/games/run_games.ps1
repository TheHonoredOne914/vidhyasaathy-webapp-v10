# Runs the engine, then each game, through Codex in sequence. Do not run until approved.
Set-Location C:\Users\HP\vidhyasaathy-webapp
$list = @("ENGINE","GAME_atom","GAME_cell","GAME_matter","GAME_motion","GAME_newton","GAME_float","GAME_energy","GAME_sound","GAME_graphs","GAME_poly")
foreach ($x in $list) {
  "$(Get-Date -f s) START $x" | Add-Content plan\games\run.log
  Get-Content -Raw "plan\games\$x.md" | codex exec -s workspace-write - *> "plan\games\$x.log"
  "$(Get-Date -f s) END $x exit=$LASTEXITCODE" | Add-Content plan\games\run.log
}
