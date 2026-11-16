# Sobe o Financity (versão PostgreSQL) NA SUA MÁQUINA, com uma cópia local dos dados reais, para testar no navegador.
# Não toca na VPS nem no sistema atual (SQLite). Para encerrar: .\parar-local.ps1
#   .\testar-local.ps1                      # usa o backup final mais recente
#   .\testar-local.ps1 -Reiniciar           # apaga a cópia local (fc_local) e importa de novo
param([switch]$Reiniciar)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$api = Join-Path $root "apps\api"
$bk = Get-ChildItem "D:\Projetos Serios\Jogos Novos\financity-backups\final-*" -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $bk) { throw "Backup final não encontrado em financity-backups." }
$sqlite = Join-Path $bk.FullName "financity.db"
$secret = "segredo-local-de-teste-com-mais-de-32-caracteres"
$pidFile = Join-Path $root ".e2e\local-pids.json"
New-Item -ItemType Directory -Force (Join-Path $root ".e2e") | Out-Null
function Listening($port) {
  # teste de conexão TCP direto (Get-NetTCPConnection não reconhece o estado de escuta em alguns Windows)
  $c = New-Object System.Net.Sockets.TcpClient
  try { $a = $c.BeginConnect("127.0.0.1", $port, $null, $null); $ok = $a.AsyncWaitHandle.WaitOne(400) -and $c.Connected; return [bool]$ok } catch { return $false } finally { $c.Close() }
}
function Wait-Port($port, $s) { for ($i = 0; $i -lt $s; $i++) { if (Listening $port) { return $true }; Start-Sleep 1 }; return $false }
$pids = @{}

# 1) PostgreSQL 16 local de desenvolvimento
if (-not (Listening 54329)) {
  Write-Host "Iniciando PostgreSQL local..."
  $p = Start-Process node -ArgumentList "`"$root\node_modules\tsx\dist\cli.mjs`"", "scripts/pg-dev.ts" -WorkingDirectory $api -PassThru -WindowStyle Hidden -RedirectStandardOutput "$root\.e2e\pg-local.log" -RedirectStandardError "$root\.e2e\pg-local.err"
  $pids.pg = $p.Id
  if (-not (Wait-Port 54329 90)) { throw "PostgreSQL local não iniciou (veja .e2e\pg-local.err)." }
  Start-Sleep 2
}

# 2) banco fc_local com a cópia dos dados reais
if ($Reiniciar) { Push-Location $api; node -e "const pg=require('pg');(async()=>{const c=new pg.Client('postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres');await c.connect();await c.query('DROP DATABASE IF EXISTS fc_local WITH (FORCE)');await c.end()})()"; Pop-Location }
Push-Location $api
$state = node scripts/ensure-local-db.mjs
if ($state -eq "created") {
  Write-Host "Importando a cópia dos dados reais para o banco local (fc_local)..."
  $env:DATABASE_URL = "postgres://financity_dev:dev-local-only@127.0.0.1:54329/fc_local"
  npx tsx scripts/sqlite-to-pg.ts $sqlite
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Importação falhou." }
}
Pop-Location

# aluno de teste com PIN conhecido (so neste banco local)
Push-Location $api; $env:DATABASE_URL = "postgres://financity_dev:dev-local-only@127.0.0.1:54329/fc_local"; npx tsx scripts/criar-aluno-teste.ts; Pop-Location

# 3) API (porta 8788) e telas (porta 3300)
if (-not (Listening 8788)) {
  $env:DATABASE_URL = "postgres://financity_dev:dev-local-only@127.0.0.1:54329/fc_local"; $env:PORT = "8788"; $env:HOST = "127.0.0.1"
  $env:GATEWAY_SECRET = $secret; $env:ALLOWED_ORIGINS = "http://localhost:3300"; $env:UNLOCK_ALL_MAPS = "1"
  $p = Start-Process node -ArgumentList "dist/server.js" -WorkingDirectory $api -PassThru -WindowStyle Hidden -RedirectStandardOutput "$root\.e2e\api-local.log" -RedirectStandardError "$root\.e2e\api-local.err"
  $pids.api = $p.Id
  if (-not (Wait-Port 8788 30)) { throw "API não iniciou (veja .e2e\api-local.err)." }
}
if (-not (Listening 3300)) {
  $env:API_URL = "http://127.0.0.1:8788"; $env:GATEWAY_SECRET = $secret; $env:NEXT_TELEMETRY_DISABLED = "1"
  $p = Start-Process node -ArgumentList "`"$root\node_modules\next\dist\bin\next`"", "start", "-p", "3300" -WorkingDirectory (Join-Path $root "apps\web") -PassThru -WindowStyle Hidden -RedirectStandardOutput "$root\.e2e\web-local.log" -RedirectStandardError "$root\.e2e\web-local.err"
  $pids.web = $p.Id
  if (-not (Wait-Port 3300 40)) { throw "Telas não iniciaram (veja .e2e\web-local.err)." }
}
$pids | ConvertTo-Json | Set-Content $pidFile

Write-Host ""
Write-Host "PRONTO. Abra: http://localhost:3300" -ForegroundColor Green
Write-Host "Professor: usuário e senha estão em D:\Projetos Serios\Jogos Novos\financity\data\credenciais-professor.txt"
Write-Host "Aluno de teste: usuario e PIN 135790 aparecem acima. TODOS os mapas ficam desbloqueados neste ambiente (so aqui; a VPS continua em sequencia)."
Write-Host "Para encerrar: .\parar-local.ps1"
