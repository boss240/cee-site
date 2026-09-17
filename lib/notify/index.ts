import { isEmailConfigured, notifyRecipients, sendEmail } from "./email";
import { isTelegramConfigured, sendTelegram } from "./telegram";
import { centerNotification, clientAutoReply, telegramText, type LeadForMail } from "./templates";

export { isEmailConfigured, isTelegramConfigured };

function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export type NotifyReport = {
  clientEmail: "sent" | "skipped" | "no-address" | "failed";
  centerEmail: "sent" | "skipped" | "no-recipients" | "failed";
  telegram: "sent" | "skipped" | "failed";
};

/**
 * Розсилка при новій заявці. Ніколи не кидає виключень — заявка вже в БД,
 * і збій каналу сповіщень не має ламати відповідь клієнту.
 * Викликається як fire-and-forget із /api/leads.
 */
export async function notifyNewLead(lead: LeadForMail): Promise<NotifyReport> {
  const url = siteUrl();
  const report: NotifyReport = { clientEmail: "skipped", centerEmail: "skipped", telegram: "skipped" };

  if (isEmailConfigured()) {
    // 1) автовідповідь клієнту — лише якщо є пошта
    if (lead.email) {
      try {
        const mail = clientAutoReply(lead, url);
        await sendEmail({ to: lead.email, ...mail, replyTo: notifyRecipients()[0] });
        report.clientEmail = "sent";
      } catch (err) {
        console.error("[notify] client email failed", err);
        report.clientEmail = "failed";
      }
    } else {
      report.clientEmail = "no-address";
    }

    // 2) сповіщення Центру
    const to = notifyRecipients();
    if (to.length) {
      try {
        const mail = centerNotification(lead, url);
        await sendEmail({ to, ...mail, replyTo: lead.email ?? undefined });
        report.centerEmail = "sent";
      } catch (err) {
        console.error("[notify] center email failed", err);
        report.centerEmail = "failed";
      }
    } else {
      report.centerEmail = "no-recipients";
    }
  }

  // 3) Telegram
  if (isTelegramConfigured()) {
    try {
      await sendTelegram(telegramText(lead, url));
      report.telegram = "sent";
    } catch (err) {
      console.error("[notify] telegram failed", err);
      report.telegram = "failed";
    }
  }

  return report;
}
