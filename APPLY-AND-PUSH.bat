@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo.
echo ==========================================================
echo   CEE site: install ^> build ^> commit ^> push  (17.09.2026)
echo ==========================================================
echo.

echo [1/4] npm install (nodemailer 10, lockfile)...
call npm install
if errorlevel 1 goto :err

echo.
echo [2/4] npm run build (production build check)...
call npm run build
if errorlevel 1 goto :err

echo.
echo [3/4] git commit...
git add -A
git commit -m "Security and privacy hardening after pre-launch audit (17.09.2026)" -m "- login brute-force rate limit (10/email, 30/IP per 15 min)" -m "- Content-Security-Policy + HSTS headers" -m "- privacy notice on first visit; privacy policy: account + billing sections" -m "- mobile horizontal overflow fix (overflow-x: clip)" -m "- footer contacts cached 10 min, revalidated on admin save" -m "- assistant KB: energy audit answers (uk/en)" -m "- nodemailer 7 -> 10 (10 CVEs), npm overrides" -m "- fix Admin.digests.draftMode.* i18n keys"
if errorlevel 1 echo (nothing to commit or commit failed - continuing to push)

echo.
echo [4/4] git push...
git push origin HEAD
if errorlevel 1 goto :err

echo.
echo ==========================================================
echo   DONE. Code is on GitHub. If Vercel is connected to the
echo   repo, the deploy starts automatically. Otherwise follow
echo   ULTIMATE_DEPLOYMENT_CHECKLIST.md (step 1-2: import repo).
echo ==========================================================
echo.
pause
exit /b 0

:err
echo.
echo !!! STEP FAILED. Scroll up to see the error, then send it to Claude.
echo.
pause
exit /b 1
