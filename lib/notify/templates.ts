/**
 * HTML-шаблони листів у стилі сайту.
 *
 * Правила email-верстки: таблиці, інлайн-стилі, без зовнішніх CSS і шрифтів,
 * ширина 600px, кольори з палітри сайту (смарагд #10b981, темний #070b12).
 * Жодних цифр і обіцянок, яких немає на сайті.
 */

type Locale = "uk" | "en";

export type LeadForMail = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string | null;
  message: string;
  source: "form" | "chat";
  page: string | null;
  locale: string | null;
  transcript: { role: "user" | "assistant"; text: string }[] | null;
  createdAt: Date | string;
};

const BRAND = "#10b981";
const BRAND_DARK = "#047857";
const INK = "#070b12";
const MUTED = "#4b5563";
const LINE = "#e5e7eb";
const SURFACE = "#f9fafb";

const SEGMENT_LABEL: Record<Locale, Record<string, string>> = {
  uk: {
    osbb: "ОСББ",
    business: "Бізнес або промисловість",
    community: "Громада, КП або НГО",
    developer: "Девелопер ВДЕ / BESS",
    donor: "Донор або інвестор",
    citizen: "Приватний власник",
    other: "Інше",
  },
  en: {
    osbb: "HOA",
    business: "Business or industry",
    community: "Community, utility or NGO",
    developer: "RES / BESS developer",
    donor: "Donor or investor",
    citizen: "Private owner",
    other: "Other",
  },
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function nl2br(s: string) {
  return esc(s).replace(/\n/g, "<br>");
}

/** Спільний каркас: темна шапка зі смарагдовою лінією, білий корпус, тихий підвал */
function shell(opts: { locale: Locale; preheader: string; body: string; siteUrl: string; footer?: string }) {
  const { locale, preheader, body, siteUrl } = opts;
  const org = locale === "uk" ? "Центр енергоефективності · Ладижин" : "Center for Energy Efficiency · Ladyzhyn";
  const footer =
    opts.footer ??
    (locale === "uk"
      ? "Ви отримали цей лист, бо залишили звернення на сайті Центру. Відповісти можна просто на цей лист."
      : "You received this email because you left a request on the Center's website. You can reply directly to this email.");

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(org)}</title>
</head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif;color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${SURFACE};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

  <!-- Шапка -->
  <tr><td style="background:${INK};border-radius:14px 14px 0 0;padding:22px 28px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td style="vertical-align:middle;">
        <span style="display:inline-block;width:34px;height:34px;border-radius:9px;background:${BRAND};vertical-align:middle;text-align:center;line-height:34px;font-size:18px;">⚡</span>
        <span style="display:inline-block;vertical-align:middle;margin-left:10px;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.01em;">ЦЕЕ</span>
        <span style="display:inline-block;vertical-align:middle;margin-left:6px;color:#9aa5b8;font-size:13px;">${esc(org.split(" · ")[1] ?? "")}</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND},#6aa8ff);font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- Корпус -->
  <tr><td style="background:#ffffff;padding:32px 28px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
    ${body}
  </td></tr>

  <!-- Підвал -->
  <tr><td style="background:#ffffff;border:1px solid ${LINE};border-top:0;border-radius:0 0 14px 14px;padding:18px 28px 22px;">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">${footer}</p>
    <p style="margin:8px 0 0;font-size:12px;color:#6b7280;"><a href="${esc(siteUrl)}" style="color:${BRAND_DARK};text-decoration:none;">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function label(text: string) {
  return `<p style="margin:0 0 6px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.09em;text-transform:uppercase;color:${BRAND_DARK};">${esc(text)}</p>`;
}

function step(n: number, title: string, text: string) {
  return `<tr>
    <td style="width:36px;vertical-align:top;padding:0 12px 14px 0;">
      <span style="display:inline-block;width:28px;height:28px;border-radius:14px;background:${BRAND};color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;">${n}</span>
    </td>
    <td style="vertical-align:top;padding:0 0 14px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:${INK};">${esc(title)}</p>
      <p style="margin:3px 0 0;font-size:14px;line-height:1.55;color:${MUTED};">${esc(text)}</p>
    </td>
  </tr>`;
}

/** Автовідповідь клієнту: заявку отримано, ось що далі */
export function clientAutoReply(lead: LeadForMail, siteUrl: string): { subject: string; html: string; text: string } {
  const locale: Locale = lead.locale === "en" ? "en" : "uk";
  const name = esc(lead.name);

  if (locale === "en") {
    const subject = "We received your request — Center for Energy Efficiency";
    const body = `
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;letter-spacing:-0.02em;color:${INK};">Thank you, ${name}. Request received.</h1>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${MUTED};">A Center specialist will look at your situation and get back to you within one business day via the channel you provided. No action is needed from you right now.</p>
      ${label("What happens next")}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 22px;">
        ${step(1, "We read your request", "Type of site, what has been done, what worries you — this is enough to start.")}
        ${step(2, "We clarify the details in a conversation", "Usually a short call or a few questions by email: consumption, metering, connection.")}
        ${step(3, "We suggest where to start", "Which block of work fits your task and what it will need. No obligations at this stage.")}
      </table>
      ${lead.message ? `${label("Your message")}<div style="margin:8px 0 22px;padding:14px 16px;border:1px solid ${LINE};border-radius:10px;background:${SURFACE};font-size:14px;line-height:1.6;color:${INK};">${nl2br(lead.message)}</div>` : ""}
      <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">While you wait, the assistant on the site can answer general questions about the process, programmes and documents.</p>`;
    return {
      subject,
      html: shell({ locale, preheader: "Request received. A specialist will reply within one business day.", body, siteUrl }),
      text: `Thank you, ${lead.name}. Request received.\n\nA Center specialist will get back to you within one business day via the channel you provided.\n\n${lead.message ? `Your message:\n${lead.message}\n\n` : ""}${siteUrl}`,
    };
  }

  const subject = "Заявку отримано — Центр енергоефективності";
  const body = `
    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;letter-spacing:-0.02em;color:${INK};">Дякуємо, ${name}. Заявку отримано.</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${MUTED};">Фахівець Центру подивиться на вашу ситуацію і зв'яжеться протягом робочого дня тим каналом, який ви вказали. Зараз від вас нічого не потрібно.</p>
    ${label("Що буде далі")}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 22px;">
      ${step(1, "Читаємо ваше звернення", "Тип об'єкта, що вже зроблено, що турбує — цього достатньо, щоб почати.")}
      ${step(2, "Уточнюємо деталі в розмові", "Зазвичай короткий дзвінок або кілька питань поштою: споживання, облік, приєднання.")}
      ${step(3, "Кажемо, з чого почати", "Який блок роботи закриває вашу задачу і що для нього знадобиться. Без зобов'язань на цьому етапі.")}
    </table>
    ${lead.message ? `${label("Ваше повідомлення")}<div style="margin:8px 0 22px;padding:14px 16px;border:1px solid ${LINE};border-radius:10px;background:${SURFACE};font-size:14px;line-height:1.6;color:${INK};">${nl2br(lead.message)}</div>` : ""}
    <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Поки чекаєте — помічник на сайті відповість на загальні питання про порядок дій, програми й документи.</p>`;
  return {
    subject,
    html: shell({ locale, preheader: "Заявку отримано. Фахівець відповість протягом робочого дня.", body, siteUrl }),
    text: `Дякуємо, ${lead.name}. Заявку отримано.\n\nФахівець Центру зв'яжеться протягом робочого дня тим каналом, який ви вказали.\n\n${lead.message ? `Ваше повідомлення:\n${lead.message}\n\n` : ""}${siteUrl}`,
  };
}

/** Сповіщення Центру: нова заявка з усіма даними і посиланням в адмінку */
export function centerNotification(lead: LeadForMail, siteUrl: string): { subject: string; html: string; text: string } {
  const seg = lead.segment ? SEGMENT_LABEL.uk[lead.segment] ?? lead.segment : "—";
  const source = lead.source === "chat" ? "Чат помічника" : "Форма «Контакти»";
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/uk/admin/leads`;
  const when = new Date(lead.createdAt).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" });
  const subject = `Нова заявка #${lead.id}: ${lead.name} · ${seg}`;

  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:${INK};">${v}</td></tr>`;

  const transcript =
    lead.source === "chat" && lead.transcript?.length
      ? `${label("Діалог із помічником")}<div style="margin:8px 0 22px;padding:12px 16px;border:1px solid ${LINE};border-radius:10px;background:${SURFACE};font-size:13px;line-height:1.6;">${lead.transcript
          .map(
            (m) =>
              `<p style="margin:0 0 6px;"><span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin-right:8px;">${m.role === "user" ? "клієнт" : "помічник"}</span>${esc(m.text)}</p>`
          )
          .join("")}</div>`
      : "";

  const body = `
    <p style="margin:0 0 6px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.09em;text-transform:uppercase;color:${BRAND_DARK};">Нова заявка · ${esc(source)}</p>
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.2;letter-spacing:-0.02em;color:${INK};">${esc(lead.name)} <span style="font-weight:400;color:#6b7280;">· ${esc(seg)}</span></h1>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;">
      ${lead.phone ? row("Телефон", `<a href="tel:${esc(lead.phone)}" style="color:${BRAND_DARK};text-decoration:none;font-weight:600;">${esc(lead.phone)}</a>`) : ""}
      ${lead.email ? row("Пошта", `<a href="mailto:${esc(lead.email)}" style="color:${BRAND_DARK};text-decoration:none;font-weight:600;">${esc(lead.email)}</a>`) : ""}
      ${row("Сторінка", esc(lead.page ?? "—"))}
      ${row("Мова", esc(lead.locale ?? "—"))}
      ${row("Час", esc(when))}
    </table>
    ${lead.message ? `${label("Повідомлення")}<div style="margin:8px 0 22px;padding:14px 16px;border:1px solid ${LINE};border-radius:10px;background:${SURFACE};font-size:14px;line-height:1.6;color:${INK};">${nl2br(lead.message)}</div>` : ""}
    ${transcript}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:${BRAND};">
      <a href="${esc(adminUrl)}" style="display:inline-block;padding:12px 20px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;">Відкрити в адмінці →</a>
    </td></tr></table>`;

  return {
    subject,
    html: shell({
      locale: "uk",
      preheader: `${lead.name} · ${seg} · ${source}`,
      body,
      siteUrl,
      footer: lead.email
        ? "Службове сповіщення з сайту. Відповідь на цей лист піде клієнту — Reply-To вже підставлено."
        : "Службове сповіщення з сайту. У клієнта немає пошти — зв'яжіться телефоном.",
    }),
    text: `Нова заявка #${lead.id} (${source})\n${lead.name} · ${seg}\n${lead.phone ? `Тел: ${lead.phone}\n` : ""}${lead.email ? `Пошта: ${lead.email}\n` : ""}Сторінка: ${lead.page ?? "—"}\n\n${lead.message}\n\n${adminUrl}`,
  };
}

/** Коротке повідомлення для Telegram (HTML-режим) */
export function telegramText(lead: LeadForMail, siteUrl: string): string {
  const seg = lead.segment ? SEGMENT_LABEL.uk[lead.segment] ?? lead.segment : "—";
  const source = lead.source === "chat" ? "чат" : "форма";
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/uk/admin/leads`;
  const lines = [
    `<b>Нова заявка #${lead.id}</b> · ${esc(source)}`,
    `${esc(lead.name)} · ${esc(seg)}`,
    lead.phone ? `☎ ${esc(lead.phone)}` : "",
    lead.email ? `✉ ${esc(lead.email)}` : "",
    lead.message ? `\n${esc(lead.message.slice(0, 600))}${lead.message.length > 600 ? "…" : ""}` : "",
    `\n<a href="${esc(adminUrl)}">Відкрити в адмінці</a>`,
  ].filter(Boolean);
  return lines.join("\n");
}
