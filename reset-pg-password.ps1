# =====================================================================
#  Скидання пароля користувача postgres (локальний PostgreSQL на Windows)
#
#  ЗАПУСКАТИ ВІД ІМЕНІ АДМІНІСТРАТОРА:
#    Пуск → "PowerShell" → правою кнопкою → "Запуск від імені адміністратора"
#    cd C:\dev\cee-site
#    powershell -ExecutionPolicy Bypass -File .\reset-pg-password.ps1
#
#  Що робить: тимчасово дозволяє локальний вхід без пароля (pg_hba.conf → trust),
#  перезапускає службу, встановлює новий пароль, повертає pg_hba.conf як було.
# =====================================================================

$ErrorActionPreference = "Continue"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

function Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    OK  $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    ПОМИЛКА: $msg" -ForegroundColor Red; exit 1 }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Fail "Потрібно запустити PowerShell від імені адміністратора (див. шапку скрипта)." }

Step "Пошук служби PostgreSQL"
$svc = Get-CimInstance Win32_Service | Where-Object { $_.Name -like "postgresql*" } | Select-Object -First 1
if (-not $svc) { Fail "Службу postgresql-x64-* не знайдено." }
Ok ("Служба: " + $svc.Name)

# Каталог даних беремо з рядка запуску служби: ... -D "C:\PostgreSQL" ...
$dataDir = $null
if ($svc.PathName -match '-D\s+"([^"]+)"') { $dataDir = $matches[1] }
elseif ($svc.PathName -match '-D\s+(\S+)') { $dataDir = $matches[1] }
if (-not $dataDir -or -not (Test-Path (Join-Path $dataDir "pg_hba.conf"))) {
  foreach ($cand in @("C:\PostgreSQL", "C:\Program Files\PostgreSQL\18\data", "C:\Program Files\PostgreSQL\17\data", "C:\Program Files\PostgreSQL\16\data")) {
    if (Test-Path (Join-Path $cand "pg_hba.conf")) { $dataDir = $cand; break }
  }
}
if (-not $dataDir) { Fail "Не знайдено pg_hba.conf (каталог даних PostgreSQL)." }
$hba = Join-Path $dataDir "pg_hba.conf"
Ok "pg_hba.conf: $hba"

$psql = $null
foreach ($v in 18,17,16,15) { $p = "C:\Program Files\PostgreSQL\$v\bin\psql.exe"; if (Test-Path $p) { $psql = $p; break } }
if (-not $psql) { Fail "psql.exe не знайдено." }

Step "Новий пароль"
Write-Host "    Розкладка EN. Пароль показується як є. Латиниця і цифри, без пробілів." -ForegroundColor DarkGray
$newPwd = Read-Host "Введіть НОВИЙ пароль postgres"
if (-not $newPwd -or $newPwd -match "[\s']") { Fail "Пароль порожній або містить пробіл/апостроф." }

Step "Тимчасово дозволяю локальний вхід без пароля"
$backup = "$hba.bak-" + (Get-Date -Format "yyyyMMdd-HHmmss")
Copy-Item $hba $backup -Force
$orig = Get-Content $hba
$patched = $orig | ForEach-Object {
  if ($_ -match '^\s*host\s+all\s+all\s+(127\.0\.0\.1/32|::1/128)\s+\S+') { $_ -replace '(\S+)\s*$', 'trust' } else { $_ }
}
$patched | Set-Content -Encoding ascii $hba
Ok "Резервна копія: $backup"

Step "Перезапуск служби"
Restart-Service -Name $svc.Name -Force
Start-Sleep -Seconds 3
Ok "Службу перезапущено"

Step "Встановлення пароля"
$env:PGPASSWORD = ""
$out = & $psql -U postgres -h localhost -c "ALTER USER postgres PASSWORD '$newPwd';" 2>&1
$okSet = ($LASTEXITCODE -eq 0)
if ($okSet) { Ok "Пароль змінено" } else { Write-Host "    Не вдалося змінити пароль: $out" -ForegroundColor Red }

Step "Повертаю pg_hba.conf як було"
Copy-Item $backup $hba -Force
Restart-Service -Name $svc.Name -Force
Start-Sleep -Seconds 3
Ok "Захист паролем відновлено"

if (-not $okSet) { exit 1 }

Step "Перевірка"
$env:PGPASSWORD = $newPwd
& $psql -U postgres -h localhost -tAc "SELECT 'password-ok'" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Ok "Вхід з новим паролем працює" } else { Fail "Вхід з новим паролем не спрацював." }

Write-Host ""
Write-Host "Готово. Тепер у звичайному PowerShell:" -ForegroundColor Green
Write-Host "    cd C:\dev\cee-site" -ForegroundColor Green
Write-Host "    powershell -ExecutionPolicy Bypass -File .\run-local.ps1" -ForegroundColor Green
Write-Host "і введіть цей новий пароль, коли скрипт запитає." -ForegroundColor Green
