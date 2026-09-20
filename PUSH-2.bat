@echo off
chcp 65001 >nul
cd /d "%~dp0"
git add -A
git commit -m "Fix build: move PostSchema out of route.ts (route files may only export handlers)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01MZSbCgtZpyHJvUzs1hUGxe"
git push origin main
timeout /t 15
