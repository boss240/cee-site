@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === CEE site: commit + push fix for Vercel build ===
git add next.config.ts package.json PUSH-FIX.bat
git commit -m "Fix Vercel build: webpack bundler, no standalone output on Vercel" -m "- next build --webpack (Next 16 Turbopack + standalone breaks onBuildComplete: ENOENT .next/next-server.js.nft.json)" -m "- output: standalone only outside Vercel (Docker keeps working)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01MZSbCgtZpyHJvUzs1hUGxe"
git push origin main
echo.
echo === DONE. Vercel will start a new deployment automatically. ===
pause
