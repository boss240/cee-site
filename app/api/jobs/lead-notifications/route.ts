import { timingSafeEqual } from "node:crypto";
import { dispatchNotifications } from "@/lib/notify/outboxWorker";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
const headers = { "Cache-Control": "private, no-store" };

function authorized(request: Request, secret: string | undefined): boolean {
  const supplied = request.headers.get("authorization") ?? "";
  const providedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(`Bearer ${secret ?? ""}`);
  return Boolean(secret && secret.length >= 32 && providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes));
}
async function run() {
  try { return Response.json(await dispatchNotifications(), { headers }); }
  catch { return Response.json({ error: "Notification worker unavailable" }, { status: 503, headers }); }
}

/** Dedicated manual/external POST trigger; never query-string credentials. */
export async function POST(request: Request) {
  if (!authorized(request, process.env.CEE_NOTIFICATION_JOB_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  return run();
}

/** Vercel cron uses GET + CRON_SECRET. Additional gate defaults OFF; no schedule is installed. */
export async function GET(request: Request) {
  if (!authorized(request, process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  if (process.env.CEE_NOTIFICATION_OUTBOX_SCHEDULED_TRIGGER !== "true") {
    return Response.json({ disabled: true, processed: 0 }, { headers });
  }
  return run(); // Dispatcher still independently requires its exact "true" activation flag.
}
