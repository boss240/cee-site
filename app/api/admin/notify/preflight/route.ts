import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { siteOrigin } from "@/lib/siteUrl";
import { notificationPreflight } from "@/lib/notify/canaryPreflight";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;
export async function POST(request: Request) {
  return notificationPreflight(request, { authorize: async () => !(await requireAdminSession()).response,
    origin: siteOrigin, env: process.env, fetch });
}
