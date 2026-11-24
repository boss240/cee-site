import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { siteOrigin } from "@/lib/siteUrl";
import { runNotificationCanary } from "@/lib/notify/canary";
import { sendNotificationCanary } from "@/lib/notify/canaryTransport";
import { singleTelegramTarget } from "@/lib/notify/canaryTargets";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 40;
export async function POST(request: Request) {
  return runNotificationCanary(request, {
    authorize: async () => !(await requireAdminSession()).response,
    origin: siteOrigin,
    recipients: channel => channel === "email" ? process.env.NOTIFY_TO?.split(",") ?? [] : [singleTelegramTarget(process.env)?.reference ?? ""],
    send: async input => {
      if (input.channel === "email") return sendNotificationCanary(input);
      const target = singleTelegramTarget(process.env);
      if (!target || target.reference !== input.recipient) return "unconfigured";
      return sendNotificationCanary({ ...input, recipient: target.recipient });
    },
  });
}
