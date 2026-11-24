#!/usr/bin/env bash
set -euo pipefail
# Staging-only validation for the isolated Vercel project project-7q1q9 (own test Neon DB).
# Mirrors the staging build command used there since 26.10.2026. Never relaxes production.
[ "${VERCEL:-}:${VERCEL_ENV:-}" = 1:preview ] || { echo 'staging_stage_preview_required' >&2; exit 1; }
[ "${VERCEL_PROJECT_ID:-}" = prj_swbuhEFJNiaPqVkEAyPomH1c05Ln ] || { echo 'staging_stage_project_mismatch' >&2; exit 1; }
[ -n "${VERCEL_URL:-}" ] || { echo 'staging_stage_url_required' >&2; exit 1; }
# No real notifications, no scheduled jobs from staging.
for flag in CEE_NOTIFICATION_OUTBOX_CAPTURE CEE_NOTIFICATION_OUTBOX_DISPATCH CEE_NOTIFICATION_OUTBOX_SCHEDULED_TRIGGER; do
  [ "${!flag:-}" != true ] || { echo "staging_stage_${flag,,}_must_be_off" >&2; exit 1; }
done
[ -z "${CRON_SECRET:-}" ] || { echo 'staging_stage_cron_secret_forbidden' >&2; exit 1; }
