import { Socket } from "node:net";
import nodemailer, { type Transporter } from "nodemailer";
import type { CanaryInput, CanaryStatus } from "./canary";

/** App-owned transports only. Exactly one target/attempt, no retries and no lead writes. */
export async function sendNotificationCanary(input: CanaryInput): Promise<CanaryStatus> {
  const subject = `[CEE TEST ${input.canaryId}] Synthetic delivery check`;
  const text = `${subject}. No customer inquiry. No action required. Please confirm receipt to the operator.`;
  if (input.channel === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return "unconfigured";
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: input.recipient, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10_000), redirect: "error",
      });
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok === true) return "accepted";
      if ([400, 401, 403, 404, 429].includes(response.status) && body?.ok === false) return "rejected";
      return "unknown";
    } catch { return "unknown"; }
  }
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass, MAIL_FROM: from } = process.env;
  if (!host || !user || !pass || !from) return "unconfigured";
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || /[\s/]/.test(host) || /[\r\n]/.test(from)) return "unconfigured";
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
  } catch { socket.destroy(); return "unconfigured"; }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const info = await Promise.race([
      transport.sendMail({ from, to: input.recipient, subject, text, html: `<p>${text}</p>`, messageId: `<cee-canary-${input.canaryId}@notifications.invalid>` }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { expired = true; socket.destroy(); reject(new Error("attempt_timeout")); }, 25_000); }),
    ]);
    if (Array.isArray(info.accepted) && info.accepted.length === 1 && !info.rejected?.length && !info.pending?.length) return "accepted";
    if (Array.isArray(info.rejected) && info.rejected.length && !info.accepted?.length && !info.pending?.length) return "rejected";
    return "unknown";
  } catch { return "unknown"; // May already have been accepted; never retry.
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    expired = true;
    socket.destroy();
    try { transport.close(); } catch { /* Cleanup cannot replace the recorded provider outcome. */ }
  }
}
