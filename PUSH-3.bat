@echo off
chcp 65001 >nul
cd /d "%~dp0"
git add -A
git commit -m "Add /api/setup: run DB migrations + seed on hosting (Vercel + Neon)" -m "- lib/db/migrations.ts: embedded initial schema (drizzle-kit generate), idempotent runner" -m "- lib/db/seedData.ts: seed logic as a function; seed.ts stays the CLI wrapper" -m "- protected by SETUP_TOKEN header; safe to call repeatedly" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01MZSbCgtZpyHJvUzs1hUGxe"
git push origin main
timeout /t 15
