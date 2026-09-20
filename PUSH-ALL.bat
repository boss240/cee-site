@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === CEE site: commit ALL local changes + push (fix Vercel build) ===
git add -A
git commit -m "Fix Vercel build + security hardening from local audit" -m "- next build --webpack (Next 16 Turbopack + standalone breaks onBuildComplete: ENOENT .next/next-server.js.nft.json)" -m "- output: standalone only outside Vercel (Docker keeps working)" -m "- CSP + HSTS headers, rate limits, privacy notice, nodemailer 10 (local changes never pushed before)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01MZSbCgtZpyHJvUzs1hUGxe"
git push origin main
echo.
echo === DONE. Vercel will start a new deployment automatically. ===
timeout /t 20
