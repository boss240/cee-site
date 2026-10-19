import { randomUUID } from "node:crypto";
import { isEmailConfigured, notifyRecipients, sendEmail } from "./email";
import { isTelegramConfigured, sendTelegram } from "./telegram";
import { centerNotification, clientAutoReply, telegramText, type LeadForMail } from "./templates";

export { isEmailConfigured, isTelegramConfigured };

type ChannelStatus = "accepted" | "partial" | "failed" | "skipped" | "no-address" | "no-recipients";
export type NotifyReport = { clientEmail: ChannelStatus; centerEmail: ChannelStatus; telegram: ChannelStatus };

/** No contact details, content, provider errors, tokens or message IDs in logs. */
export async function notifyNewLead(lead: LeadForMail, attemptId = randomUUID()): Promise<NotifyReport> {
  const started = Date.now();
  const url = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const report: NotifyReport = { clientEmail: "skipped", centerEmail: "skipped", telegram: "skipped" };
  console.info(JSON.stringify({ event: "lead_notification_started", leadId: lead.id, attemptId }));
  await Promise.all([
    (async () => {
      if (!isEmailConfigured()) return;
      if (!lead.email) { report.clientEmail = "no-address"; return; }
      try {
        const r = await sendEmail({ to: lead.email, ...clientAutoReply(lead, url), replyTo: notifyRecipients()[0] });
        report.clientEmail = r.skipped ? "skipped" : r.status;
      } catch { report.clientEmail = "failed"; }
    })(),
    (async () => {
      if (!isEmailConfigured()) return;
      const to = notifyRecipients();
      if (!to.length) { report.centerEmail = "no-recipients"; return; }
      try {
        const r = await sendEmail({ to, ...centerNotification(lead, url), replyTo: lead.email ?? undefined });
        report.centerEmail = r.skipped ? "skipped" : r.status;
      } catch { report.centerEmail = "failed"; }
    })(),
    (async () => {
      if (!isTelegramConfigured()) return;
      try {
        const r = await sendTelegram(telegramText(lead, url));
        report.telegram = r.skipped ? "skipped" : r.sent === 0 ? "failed" : r.sent === r.total ? "accepted" : "partial";
      } catch { report.telegram = "failed"; }
    })(),
  ]);
  console.info(JSON.stringify({ event: "lead_notification_completed", leadId: lead.id, attemptId, elapsedMs: Date.now() - started, ...report }));
  return report;
}
