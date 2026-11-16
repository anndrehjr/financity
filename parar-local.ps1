# Encerra o ambiente de teste local iniciado por testar-local.ps1 (só os processos que ele registrou).
$root = $PSScriptRoot
$pidFile = Join-Path $root ".e2e\local-pids.json"
$all = Get-CimInstance Win32_Process
function Desc($id) { $all | Where-Object { $_.ParentProcessId -eq $id } | ForEach-Object { $_.ProcessId; Desc $_.ProcessId } }
if (Test-Path $pidFile) {
  $p = Get-Content $pidFile | ConvertFrom-Json
  foreach ($n in "web", "api") {
    $id = $p.$n
    if ($id) { foreach ($x in @($id) + @(Desc $id)) { Stop-Process -Id $x -Force -ErrorAction SilentlyContinue }; Write-Host "encerrado: $n" }
  }
  Remove-Item $pidFile -Force
}
# PostgreSQL local: parada limpa pelo diretório de dados (não mexe em outros PostgreSQL da máquina)
$ctl = Join-Path $root "apps\api\node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe"
if (-not (Test-Path $ctl)) { $ctl = Join-Path $root "node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe" }
if (Test-Path "$root\apps\api\.pgdev\postmaster.pid") { & $ctl stop -D "$root\apps\api\.pgdev" -m fast | Out-Null; Write-Host "encerrado: PostgreSQL local" }
Write-Host "Ambiente local encerrado."
