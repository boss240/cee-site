# =====================================================================
#  Сайт ЦЕЕ — локальний запуск на Windows одним скриптом
#
#  Що робить:
#   1) перевіряє Node.js / npm / PostgreSQL
#   2) створює базу cee_site (якщо ще нема)
#   3) створює .env.local (якщо ще нема) з вашим паролем до PostgreSQL
#   4) npm install → схема БД → початкові дані
#   5) звільняє порт 3000 від старого сервера і запускає сайт
#
#  Запуск (з PowerShell):
#    powershell -ExecutionPolicy Bypass -File .\run-local.ps1
# =====================================================================

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$env:PGCLIENTENCODING = "UTF8"

function Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    OK  $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    ПОМИЛКА: $msg" -ForegroundColor Red; exit 1 }

Step "Перевірка інструментів"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Node.js не знайдено. Встановіть з https://nodejs.org (LTS) і перезапустіть PowerShell." }
if (-not (Get-Command npm  -ErrorAction SilentlyContinue)) { Fail "npm не знайдено (йде разом з Node.js)." }
Ok ("Node.js " + (node --version) + ", npm " + (npm --version))

$psql = $null
foreach ($v in 18,17,16,15) {
  $p = "C:\Program Files\PostgreSQL\$v\bin\psql.exe"
  if (Test-Path $p) { $psql = $p; break }
}
if (-not $psql) {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { $psql = $cmd.Source }
}
if (-not $psql) { Fail "PostgreSQL (psql.exe) не знайдено. Встановіть з https://www.postgresql.org/download/windows/" }
Ok "PostgreSQL: $psql"

Step "Пароль користувача postgres (той, що задавали під час встановлення PostgreSQL)"
$envFile = Join-Path $root ".env.local"
$pgPassword = $null
if (Test-Path $envFile) {
  $line = (Get-Content $envFile) | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
  if ($line -match 'postgresql://postgres:([^@]*)@') { $pgPassword = [uri]::UnescapeDataString($matches[1]) }
}

function Test-PgPassword($pwd) {
  $env:PGPASSWORD = $pwd
  $out = & $psql -U postgres -h localhost -tAc "SELECT 1" 2>&1
  return ($LASTEXITCODE -eq 0)
}

$attempt = 0
while (-not ($pgPassword -and (Test-PgPassword $pgPassword))) {
  if ($pgPassword) { Write-Host "    Пароль не підійшов. Перевірте розкладку клавіатури (має бути EN) і Caps Lock." -ForegroundColor Yellow }
  $attempt++
  if ($attempt -gt 3) {
    Write-Host ""
    Write-Host "    Не вдалося увійти в PostgreSQL 3 рази." -ForegroundColor Red
    Write-Host "    Якщо пароль забуто — його можна скинути: відкрийте 'SQL Shell (psql)' з меню Пуск" -ForegroundColor Yellow
    Write-Host "    або напишіть Claude — підкаже, як скинути через pg_hba.conf." -ForegroundColor Yellow
    exit 1
  }
  Write-Host "    (пароль показується як є — щоб бачити розкладку; розкладка EN; Enter після вводу)" -ForegroundColor DarkGray
  $secure = Read-Host "Введіть пароль postgres"
  $pgPassword = "$secure"
  if (-not $pgPassword) { $pgPassword = $null; continue }
}
$env:PGPASSWORD = $pgPassword
Ok "Підключення до PostgreSQL працює"

Step "База даних cee_site"
$exists = & $psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='cee_site'" 2>&1
if ("$exists".Trim() -eq "1") { Ok "База cee_site вже існує" }
else {
  & $psql -U postgres -h localhost -c "CREATE DATABASE cee_site;" 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail "Не вдалося створити базу cee_site" }
  Ok "Базу cee_site створено"
}

Step "Файл .env.local"
if (-not (Test-Path $envFile)) {
  $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = [Convert]::ToBase64String($bytes)
  $encPwd = [uri]::EscapeDataString($pgPassword)
  @"
DATABASE_URL="postgresql://postgres:$encPwd@localhost:5432/cee_site"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
NEXTAUTH_SECRET="$secret"
NEXTAUTH_URL="http://localhost:3000"
SEED_ADMIN_EMAIL="admin@cee.org.ua"
SEED_ADMIN_PASSWORD="ChangeMe123!"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Set-Content -Encoding utf8 $envFile
  Ok ".env.local створено"
} else {
  $encPwd = [uri]::EscapeDataString($pgPassword)
  $content = Get-Content $envFile
  $content = $content | ForEach-Object { if ($_ -match '^DATABASE_URL=') { "DATABASE_URL=`"postgresql://postgres:$encPwd@localhost:5432/cee_site`"" } else { $_ } }
  $content | Set-Content -Encoding utf8 $envFile
  Ok ".env.local вже є — оновив рядок DATABASE_URL"
}

# Експортуємо DATABASE_URL для CLI-кроків (drizzle-kit / seed) — надійніше, ніж покладатися на .env.local
$encPwdEnv = [uri]::EscapeDataString($pgPassword)
$env:DATABASE_URL = "postgresql://postgres:$encPwdEnv@localhost:5432/cee_site"

Step "npm install (перший раз може тривати 2–5 хв)"
npm install
if ($LASTEXITCODE -ne 0) { Fail "npm install завершився з помилкою" }

Step "Схема БД (drizzle push)"
npm run db:push
if ($LASTEXITCODE -ne 0) { Fail "db:push завершився з помилкою" }

Step "Початкові дані (адмін, AI-моделі, профіль компанії)"
npm run db:seed
if ($LASTEXITCODE -ne 0) { Fail "db:seed завершився з помилкою" }

Step "Порт 3000"
$conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
  foreach ($c in $conns | Select-Object -Unique OwningProcess) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
      Write-Host ("    Порт 3000 зайнятий процесом " + $proc.ProcessName + " (PID " + $proc.Id + ") — зупиняю") -ForegroundColor Yellow
      Stop-Process -Id $proc.Id -Force
    }
  }
  Start-Sleep -Seconds 1
}
Ok "Порт 3000 вільний"

Step "Запуск сайту"
Write-Host ""
Write-Host "    Сайт:    http://localhost:3000/uk" -ForegroundColor Green
Write-Host "    Адмінка: http://localhost:3000/uk/admin/login  (admin@cee.org.ua / ChangeMe123!)" -ForegroundColor Green
Write-Host "    Зупинити: Ctrl+C" -ForegroundColor DarkGray
Write-Host ""
npm run dev -- -p 3000
