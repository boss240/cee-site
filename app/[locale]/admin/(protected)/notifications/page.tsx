import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { readOutboxHealth } from "@/lib/notify/outboxHealth";
import { Link } from "@/i18n/navigation";
import { TelegramChannelCard } from "./TelegramChannelCard";

export const dynamic = "force-dynamic";
const copy = {
  uk: {
    title: "Черга сповіщень", intro: "Лише перегляд стану. Ця сторінка не надсилає повідомлень, не змінює адресатів і не повторює спроби.",
    ready: "Схема черги доступна", absent: "Чергу не налаштовано: таблиця відсутня", unavailable: "Стан черги недоступний — це не означає, що вона порожня",
    flags: "Захоплення / відправлення / плановий виклик", flagsNote: "Це значення перемикачів, а не підтвердження налаштованого розкладу чи доставки.", on: "Увімкнено", off: "Вимкнено", observed: "Час перевірки БД", refresh: "Оновити", leads: "До заявок",
    due: "Готові до обробки", expired: "Прострочені оренди", oldest: "Найдавніша готова доставка", counts: "Кількість за станом і каналом", entries: "До 50 записів для перевірки", empty: "Немає записів у вибраних станах.",
    status: "Стан", channel: "Канал", count: "Кількість", delivery: "Доставка / подія / заявка", attempts: "Спроби", reason: "Код причини", time: "Оновлено / доступно після / оренда до",
    missingWarning: "Не вмикайте захоплення до окремо погодженого створення та перевірки таблиці. Інакше запис заявки буде відхилено, а не мовчки втратить сповіщення.",
    disabledWarning: "Захоплення вимкнено: нові заявки використовують попередню доставку без гарантованого збереження наміру. Старі та вже розпочаті відправлення можуть виконуватися окремо.",
    noDeliveryClaim: "accepted означає прийняття провайдером, а не підтвердження доставки до скриньки. Нуль готових записів не гарантує відсутність blocked, uncertain або dead.",
    reconcile: "Безпечна перевірка оператором", guidance: [
      "uncertain або прострочена оренда: спочатку звірте докази провайдера. Не повторюйте відправлення автоматично — попередня спроба могла бути прийнята.",
      "blocked: перевірте налаштування та погоджених адресатів. Для порожнього адресата потрібне окремо погоджене атомарне створення конкретних цілей і скасування заглушки, а не заміна адресата навмання.",
      "dead: з’ясуйте причину. Нову спробу погоджують окремо; не скидайте лічильник і не запускайте нескінченні повтори.",
      "accepted і cancelled не ставте в чергу повторно. Видалена заявка не має відновлюватися чи надсилатися автоматично.",
      "Увімкнення диспетчера обробляє всі придатні записи, не лише тестовий. Для реального тесту спочатку погодьте точних адресатів і обсяг.",
    ],
    privacy: "Вміст заявок, розмови, адреси одержувачів та секрети тут не вибираються. Дії звірення й аудит рішень не автоматизовані цією сторінкою.",
  },
  en: {
    title: "Notification queue", intro: "Read-only status. This page does not send messages, change recipients or retry deliveries.",
    ready: "Queue schema available", absent: "Queue not configured: table is missing", unavailable: "Queue status unavailable — this does not mean the queue is empty",
    flags: "Capture / dispatch / scheduled trigger", flagsNote: "These are gate settings, not proof that a schedule exists or messages were delivered.", on: "Enabled", off: "Disabled", observed: "Database observation time", refresh: "Refresh", leads: "View leads",
    due: "Ready to process", expired: "Expired leases", oldest: "Oldest due delivery", counts: "Counts by status and channel", entries: "Up to 50 records for review", empty: "No records in the selected states.",
    status: "Status", channel: "Channel", count: "Count", delivery: "Delivery / event / lead", attempts: "Attempts", reason: "Reason code", time: "Updated / available after / leased until",
    missingWarning: "Do not enable capture before separately approved table creation and verification. Otherwise lead storage will fail closed rather than silently lose its notification intent.",
    disabledWarning: "Capture is disabled: new leads use the previous best-effort delivery path. Old or already-running sends may execute separately.",
    noDeliveryClaim: "accepted means provider acceptance, not confirmed inbox delivery. Zero due records does not mean there are no blocked, uncertain or dead deliveries.",
    reconcile: "Safe operator reconciliation", guidance: [
      "uncertain or expired lease: inspect provider evidence first. Never automatically resend; the previous attempt may already have been accepted.",
      "blocked: verify configuration and approved recipients. An empty-recipient placeholder requires separately approved atomic concrete-target insertion and placeholder cancellation, not an arbitrary recipient edit.",
      "dead: diagnose the cause. A new attempt needs a separate decision; do not reset counters or create an infinite retry loop.",
      "Do not requeue accepted or cancelled work. Deleted leads must not be recreated or notified automatically.",
      "Enabling dispatch processes all eligible queued records, not only a test. Approve exact recipients and scope before any real test.",
    ],
    privacy: "Lead content, conversations, recipient addresses and secrets are not selected here. This page does not automate reconciliation writes or decision auditing.",
  },
};

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const guard = await requireAdminSession();
  if (guard.response) redirect(`/${locale === "en" ? "en" : "uk"}/admin/login`);
  const t = locale === "en" ? copy.en : copy.uk;
  const health = await readOutboxHealth();
  return <section className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold">{t.title}</h1><p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t.intro}</p></div>
      <div className="flex items-center gap-4"><Link href="/admin/leads" className="text-sm underline">{t.leads}</Link><form method="get"><button type="submit" className="rounded border px-3 py-2 text-sm">{t.refresh}</button></form></div>
    </header>
    <TelegramChannelCard locale={locale} />
    <div role="status" className="rounded-lg border p-4">
      <p className="font-semibold">{health.state === "ready" ? t.ready : health.state === "not_configured" ? t.absent : t.unavailable}</p>
      <p className="mt-2 text-sm">{t.flags}: {[health.captureEnabled, health.dispatchEnabled, health.scheduledTriggerEnabled].map(v => v ? t.on : t.off).join(" / ")}</p>
      <p className="mt-1 text-sm">{t.flagsNote}</p>
      <p className="mt-1 text-sm">{t.observed}: {health.observedAt ?? "—"}</p>
      {health.state === "not_configured" && <p className="mt-3 text-sm">{t.missingWarning}</p>}
      {!health.captureEnabled && <p className="mt-3 text-sm">{t.disabledWarning}</p>}
    </div>
    {health.state === "ready" && <>
      <dl className="grid gap-3 sm:grid-cols-3">{[[t.due, health.due], [t.expired, health.expiredLeases], [t.oldest, health.oldestDueAt ?? "—"]].map(([label, value]) => <div key={String(label)} className="rounded-lg border p-3"><dt className="text-sm">{label}</dt><dd className="mt-1 break-all font-semibold">{value}</dd></div>)}</dl>
      <div><h2 className="font-semibold">{t.counts}</h2><div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>{t.status}</th><th>{t.channel}</th><th>{t.count}</th></tr></thead><tbody>{health.counts.map(row => <tr key={`${row.status}:${row.channel}`} className="border-t"><td className="py-2">{row.status}</td><td>{row.channel}</td><td>{row.count}</td></tr>)}</tbody></table></div><p className="mt-3 text-sm">{t.noDeliveryClaim}</p></div>
      <div><h2 className="font-semibold">{t.entries}</h2>{!health.entries.length ? <p className="mt-2 text-sm">{t.empty}</p> : <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-xs"><thead><tr><th>{t.delivery}</th><th>{t.status}</th><th>{t.channel}</th><th>{t.attempts}</th><th>{t.reason}</th><th>{t.time}</th></tr></thead><tbody>{health.entries.map(entry => <tr key={entry.id} className="border-t align-top"><td className="py-3"><code>{entry.id}</code><br /><code>{entry.eventId}</code><br />{entry.leadId ?? "—"}</td><td className="py-3">{entry.status}</td><td className="py-3">{entry.channel}</td><td className="py-3">{entry.attempts}</td><td className="py-3">{entry.errorCode ?? "—"}</td><td className="py-3">{entry.updatedAt}<br />{entry.availableAt}<br />{entry.leaseUntil ?? "—"}</td></tr>)}</tbody></table></div>}</div>
    </>}
    <aside className="rounded-lg border p-4"><h2 className="font-semibold">{t.reconcile}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{t.guidance.map(item => <li key={item}>{item}</li>)}</ul><p className="mt-4 text-sm text-[var(--color-fg-muted)]">{t.privacy}</p></aside>
  </section>;
}
