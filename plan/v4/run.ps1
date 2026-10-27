$ErrorActionPreference='Continue'; Set-Location (Split-Path $PSScriptRoot -Parent | Split-Path -Parent)
function L($m){Add-Content plan\v4\run.log "$m $(Get-Date)"}
function Run($n){L "$n start"; Get-Content -Raw "plan\v4\$n.md" | codex exec -s workspace-write - *> "plan\v4\$n.out"; L "$n end"}
function C($p,$m){git add $p 2>$null; git commit -qm $m 2>$null}
Run FIX; C 'apps/web/src' 'v4: atom interleave, cell contrast, landing fit, examiner nulls'
C 'apps/web/src' 'v3: staff + examiner'
$pairs=@(@('matter','motion'),@('newton','float'),@('energy','sound'),@('graphs','poly'))
foreach($p in $pairs){$j=$p|%{$x=$_;Start-Job -Init ([scriptblock]::Create("Set-Location '$PWD'")) -ScriptBlock {param($n) Add-Content plan\v4\run.log "G_$n start $(Get-Date)"; Get-Content -Raw "plan\v4\G_$n.md" | codex exec -s workspace-write - *> "plan\v4\G_$n.out"; Add-Content plan\v4\run.log "G_$n end $(Get-Date)"} -Arg $x}; $j|Wait-Job|Out-Null; foreach($n in $p){C "apps/web/src/games/$n" "v4: $n rewrite"}}
L 'ALL DONE'
