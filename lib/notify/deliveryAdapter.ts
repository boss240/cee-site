import { Socket } from "node:net";
import { createHash } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { siteOrigin } from "@/lib/siteUrl";
import { centerNotification, clientAutoReply, telegramText, type LeadForMail } from "./templates";

export type DeliveryTarget = {
  id: string;
  event_id: string;
  channel: "email_client" | "email_center" | "telegram";
  recipient: string;
};
export type DeliveryOutcome = {
  status: "accepted" | "retry" | "blocked" | "uncertain" | "dead" | "cancelled";
  code: string;
  retryAfterSeconds?: number;
};

const result = (status: DeliveryOutcome["status"], code: string): DeliveryOutcome => ({ status, code });
const list = (value?: string) => (value ?? "").split(",").map(v => v.trim()).filter(Boolean);
const email = (value: string) => value.length <= 255 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" ? value as Record<string, unknown> : {};

/** One target only. Acceptance means provider acceptance, never inbox delivery/exactly-once. */
export async function deliverTarget(target: DeliveryTarget, lead: LeadForMail): Promise<DeliveryOutcome> {
  if (!target.recipient) return result("blocked", "missing_recipient");
  let origin: string;
  try { origin = siteOrigin(); } catch { return result("blocked", "invalid_site_origin"); }
  // Do not include the full conversation in transport payloads even if a caller supplies it.
  const summary = { ...lead, transcript: null };
  if (target.channel === "telegram") {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return result("blocked", "missing_telegram_config");
    if (!list(process.env.TELEGRAM_CHAT_ID).includes(target.recipient)) return result("blocked", "recipient_config_changed");
    if (!/^(?:-?\d+|@[A-Za-z][A-Za-z0-9_]{4,31})$/.test(target.recipient)) return result("dead", "invalid_recipient");
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: target.recipient, text: telegramText(summary, origin), parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = record(await response.json().catch(() => null));
      if (response.ok && body.ok === true) return result("accepted", "provider_accepted");
      const status = typeof body.error_code === "number" ? body.error_code : response.status;
      if (status === 429) {
        const seconds = record(body.parameters).retry_after;
        return { status: "retry", code: "provider_rate_limit", retryAfterSeconds: typeof seconds === "number" && Number.isFinite(seconds) ? Math.max(1, Math.min(86400, Math.ceil(seconds))) : 60 };
      }
      if (status === 401) return result("blocked", "provider_auth");
      if (status === 403 || status === 400 || status === 404) return result("dead", "provider_rejected");
      // Server errors/malformed replies may follow acceptance; never blindly replay them.
      return result("uncertain", "provider_outcome_unknown");
    } catch { return result("uncertain", "provider_outcome_unknown"); }
  }
  if (!email(target.recipient)) return result("dead", "invalid_recipient");
  if (target.channel === "email_center" && !list(process.env.NOTIFY_TO).some(v => v.toLowerCase() === target.recipient.toLowerCase())) {
    return result("blocked", "recipient_config_changed");
  }
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass, MAIL_FROM: from } = process.env;
  if (!host || !user || !pass || !from) return result("blocked", "missing_smtp_config");
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || /[\s/]/.test(host) || /[\r\n]/.test(from)) return result("blocked", "invalid_smtp_config");
  // Fresh transport: no stale credential cache and no connection can outlive this attempt.
  // Public Nodemailer getSocket hook: retain the root TCP socket across TLS wrapping.
  // transport.close() alone does NOT abort an active non-pooled Nodemailer SMTP send.
  const socket = new Socket();
  socket.on("error", () => { /* Transport reports a sanitized outcome; never log socket errors. */ });
  let expired = false;
  let transport: Transporter;
  try {
    transport = nodemailer.createTransport({
      getSocket: (_options, callback) => {
        // Connect directly once, rather than allowing a delayed transport DNS callback to
        // reconnect a socket after our deadline. A late hook must not open a new connection.
        if (expired) { callback(new Error("attempt_expired"), {}); return; }
        let completed = false;
        const finish = (error: Error | null) => {
          if (completed) return;
          completed = true;
          if (expired || error) { socket.destroy(); callback(error ?? new Error("attempt_expired"), {}); }
          else callback(null, { connection: socket });
        };
        socket.once("connect", () => finish(null));
        socket.once("error", finish);
        socket.once("close", () => finish(new Error("connection_closed")));
        socket.connect(port, host);
      },
      host, port, secure: port === 465, requireTLS: port !== 465,
      auth: { user, pass }, connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 10_000,
    });
  } catch { socket.destroy(); return result("blocked", "invalid_smtp_config"); }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const template = target.channel === "email_client" ? clientAutoReply(summary, origin) : centerNotification(summary, origin);
    const reply = target.channel === "email_client" ? list(process.env.NOTIFY_TO)[0] : lead.email;
    const replyTo = reply && email(reply) ? reply : undefined;
    const identity = createHash("sha256").update(JSON.stringify([target.event_id, target.channel, target.recipient])).digest("hex");
    // Stable Message-ID is useful for reconciliation, not a provider idempotency guarantee.
    const info = await Promise.race([
      transport.sendMail({ from, to: target.recipient, ...template, replyTo, messageId: `<cee-${identity}@notifications.invalid>` }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { expired = true; socket.destroy(); reject(new Error("attempt_timeout")); }, 25_000); }),
    ]);
    if (Array.isArray(info.accepted) && info.accepted.length === 1) return result("accepted", "provider_accepted");
    if (Array.isArray(info.pending) && info.pending.length) return result("uncertain", "provider_outcome_unknown");
    if (Array.isArray(info.rejected) && info.rejected.length) return result("dead", "provider_rejected");
    return result("uncertain", "provider_outcome_unknown");
  } catch (error) {
    const e = record(error);
    if (e.code === "EAUTH" || e.responseCode === 530 || e.responseCode === 535) return result("blocked", "provider_auth");
    if (typeof e.responseCode === "number" && e.responseCode >= 400 && e.responseCode < 500) return result("retry", "provider_temporary_rejection");
    if (typeof e.responseCode === "number" && e.responseCode >= 500 && e.responseCode < 600) return result("dead", "provider_rejected");
    if (e.code === "ENOTFOUND" || e.code === "EAI_AGAIN" || e.code === "ECONNREFUSED") return result("retry", "provider_connection_unavailable");
    return result("uncertain", "provider_outcome_unknown");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    expired = true;
    socket.destroy();
    try { transport.close(); } catch { /* Cleanup cannot replace the recorded provider outcome. */ }
  }
}
