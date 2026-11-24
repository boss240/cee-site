#!/usr/bin/env bash
set -euo pipefail
# Validation only: never rewrite deployment identity, origin or feature flags.
[ "${VERCEL:-}:${VERCEL_ENV:-}" = 1:production ] || { echo 'production_stage_environment_required' >&2; exit 1; }
[ "${VERCEL_PROJECT_ID:-}" = prj_JmAsZX65Qx58gtg62XnvOaawja7V ] || { echo 'production_stage_project_mismatch' >&2; exit 1; }
[ "${NEXT_PUBLIC_APP_URL:-}" = https://cee.energy ] || { echo 'production_stage_origin_mismatch' >&2; exit 1; }
# Validate configuration only; this does not authorize activation, establish schema,
# verify provider credentials/recipient ownership or prove a scheduler exists.
node <<'JS'
const env = process.env;
const fail = code => { console.error(code); process.exit(1); };
const flag = key => {
  const value = env[key];
  if (value !== undefined && value !== "" && value !== "true" && value !== "false") fail("production_stage_outbox_invalid_boolean");
  return value === "true";
};
const capture = flag("CEE_NOTIFICATION_OUTBOX_CAPTURE");
const dispatch = flag("CEE_NOTIFICATION_OUTBOX_DISPATCH");
const scheduled = flag("CEE_NOTIFICATION_OUTBOX_SCHEDULED_TRIGGER");
if (dispatch && !capture) fail("production_stage_outbox_dispatch_requires_capture");
if (scheduled && !dispatch) fail("production_stage_outbox_schedule_requires_dispatch");
const secret = key => typeof env[key] === "string" && /^[\x21-\x7e]{32,}$/.test(env[key]);
if (scheduled && !secret("CRON_SECRET")) fail("production_stage_outbox_cron_secret_required");
if (dispatch && !scheduled && !secret("CEE_NOTIFICATION_JOB_SECRET")) fail("production_stage_outbox_job_secret_required");
if (capture) {
  const present = key => typeof env[key] === "string" && env[key].trim().length > 0;
  if (dispatch && !["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"].every(present)) fail("production_stage_outbox_smtp_required");
  const port = Number(env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || /[\s/]/.test(env.SMTP_HOST ?? "") || /[\r\n]/.test(env.MAIL_FROM ?? "")) fail("production_stage_outbox_smtp_invalid");
  const split = value => [...new Set((value ?? "").split(",").map(v => v.trim()).filter(Boolean))];
  const centers = [...new Map(split(env.NOTIFY_TO).map(v => [v.toLowerCase(), v])).values()];
  const chats = split(env.TELEGRAM_CHAT_ID);
  const email = value => value.length <= 255 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
  if ((dispatch && !centers.length) || centers.length > 50 || !centers.every(email)) fail("production_stage_outbox_email_targets_invalid");
  if ((dispatch && (!present("TELEGRAM_BOT_TOKEN") || !chats.length)) || chats.length > 50 || !chats.every(v => v.length <= 320 && /^(?:-?\d+|@[A-Za-z][A-Za-z0-9_]{4,31})$/.test(v))) fail("production_stage_outbox_telegram_targets_invalid");
}
JS
