import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { readOutboxHealth } from "@/lib/notify/outboxHealth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only operator evidence; no requeue, configuration changes or provider calls. */
export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const health = await readOutboxHealth();
  return Response.json(health, {
    status: health.state === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
