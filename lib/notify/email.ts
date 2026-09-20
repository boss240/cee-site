import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email через SMTP (nodemailer). Працює з будь-яким провайдером —
 * Gmail (пароль застосунку), ukr.net, Zoho, корпоративний Exchange тощо.
 *
 * Змінні середовища (.env.local):
 *   SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS), SMTP_USER, SMTP_PASS
 *   MAIL_FROM   — від кого (наприклад "ЦЕЕ <info@cee.org.ua>")
 *   NOTIFY_TO   — куди надсилати сповіщення про заявки (можна кілька через кому)
 */
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);
}

export function notifyRecipients(): string[] {
  return (process.env.NOTIFY_TO ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

let cached: Transporter | null = null;

function transporter() {
  if (cached) return cached;
  const port = Number(process.env.SMTP_PORT ?? 587);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return cached;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  if (!isEmailConfigured()) return { skipped: true as const };
  const info = await transporter().sendMail({
    from: process.env.MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
  });
  return { skipped: false as const, messageId: info.messageId };
}

/** Для кнопки «Перевірити з'єднання» в адмінці */
export async function verifyEmail(): Promise<{ ok: boolean; message: string }> {
  if (!isEmailConfigured()) return { ok: false, message: "SMTP не налаштовано в .env.local" };
  try {
    await transporter().verify();
    return { ok: true, message: "OK" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
