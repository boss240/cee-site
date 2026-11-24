"use client";
import { useRef, useState } from "react";
import { normalizedRecipient } from "@/lib/notify/canaryRecipient";
type Channel = "email" | "telegram";
type Preflight = { status: string; chatDisplayName?: string; chatType?: string; maskedChatId?: string; botUsername?: string };
export function CanaryForm({ english }: { english: boolean }) {
  const [channel, setChannel] = useState<Channel>("email");
  const [recipient, setRecipient] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [attempted, setAttempted] = useState<string[]>([]);
  const sent = useRef(new Set<string>());
  const lock = useRef(false);
  const [results, setResults] = useState<string[]>([]);
  const [halted, setHalted] = useState(false);
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const normalized = normalizedRecipient(channel, recipient);
  const targetKey = `${channel}:${normalized ?? ""}`;
  const t = (uk: string, en: string) => english ? en : uk;
  async function probe() {
    if (lock.current || halted) return;
    lock.current = true; setRunning(true); setConfirmed(false); setPreflight(null);
    try {
      const response = await fetch("/api/admin/notify/preflight", { method: "POST",
        headers: { "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15_000),
        body: JSON.stringify(channel === "email" ? { channel, recipient } : { channel }),
      });
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("status" in data) || typeof data.status !== "string") throw new Error("invalid_reply");
      const d = data as Record<string, unknown>;
      if (d.status === "matched" && response.ok) {
        if (channel === "telegram") {
          if (typeof d.targetReference !== "string" || !/^configured:[0-9a-f]{64}$/.test(d.targetReference) ||
              d.botUsername !== "@cee_ladyzhyn_bot" || typeof d.chatDisplayName !== "string" || typeof d.chatType !== "string" || typeof d.maskedChatId !== "string") throw new Error("invalid_reply");
          setRecipient(d.targetReference);
          setPreflight({ status: "matched", chatDisplayName: d.chatDisplayName, chatType: d.chatType, maskedChatId: d.maskedChatId, botUsername: d.botUsername });
        } else setPreflight({ status: "matched" });
      } else setPreflight({ status: ["not_matched", "multiple_destinations", "unconfigured", "bot_mismatch", "denied", "invalid_request"].includes(String(d.status)) ? String(d.status) : "unknown" });
    } catch { setPreflight({ status: "unknown" }); }
    finally { setRunning(false); lock.current = false; }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || sent.current.has(targetKey) || halted || !confirmed || !normalized || preflight?.status !== "matched") return;
    const canaryId = crypto.randomUUID();
    // One deliberate attempt per normalized recipient/channel in this page. NOT global/replica idempotence.
    lock.current = true; sent.current.add(targetKey);
    setAttempted([...sent.current]); setRunning(true);
    setResults(previous => [...previous, `${channel} · ${canaryId} · ${t("Виконується", "Running")}`]);
    let status = "unknown";
    try {
      const response = await fetch("/api/admin/notify/canary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, recipient: normalized, canaryId }),
        signal: AbortSignal.timeout(35_000), cache: "no-store",
      });
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "status" in data && typeof data.status === "string" &&
          ["accepted", "rejected", "unknown", "unconfigured", "recipient_not_allowed", "invalid_request", "denied"].includes(data.status)) {
        status = data.status === "accepted" && !response.ok ? "unknown" : data.status;
      }
    } catch { /* No retry. Recipient may already have received the message. */ }
    finally {
      setResults(previous => previous.map(value => value.includes(canaryId) ? `${channel} · ${canaryId} · ${status}` : value));
      if (status === "unknown") setHalted(true);
      setRunning(false); lock.current = false;
    }
  }
  return <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg border p-4">
    <label className="block">{t("Канал", "Channel")}
      <select value={channel} disabled={running || halted} onChange={e => { setChannel(e.target.value as Channel); setRecipient(""); setConfirmed(false); setPreflight(null); }} className="mt-1 block w-full rounded border p-2">
        <option value="email">Email</option><option value="telegram">Telegram</option>
      </select>
    </label>
    {channel === "email" && <label className="block">{t("Погоджений власником email", "Owner-approved email")}
      <input value={recipient} onChange={e => { setRecipient(e.target.value); setConfirmed(false); setPreflight(null); }} disabled={running || halted} required maxLength={255} autoComplete="off" className="mt-1 block w-full rounded border p-2" />
    </label>}
    <button type="button" onClick={() => void probe()} disabled={running || halted || (channel === "email" && !normalized)} className="rounded border px-4 py-2 disabled:opacity-50">{t("Перевірити адресата БЕЗ надсилання", "Check destination WITHOUT sending")}</button>
    {preflight && <p role="status" className="rounded border p-3 text-sm">{t("Перевірка налаштувань, не доставка", "Configuration check, NOT delivery")}: {preflight.status}
      {preflight.chatDisplayName && <> · {preflight.botUsername} → {preflight.chatDisplayName} · {preflight.chatType} · ID {preflight.maskedChatId}</>}
    </p>}
    <p className="text-sm">{t("Адресат має вже бути у серверному списку дозволених. Інші адреси не показуються. Вміст фіксований: CEE TEST, синтетична перевірка, не заявка клієнта.", "The recipient must already be server-allowlisted. Other recipients are not displayed. Fixed content: CEE TEST, synthetic check, not a customer inquiry.")}</p>
    <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={running || halted || attempted.includes(targetKey) || preflight?.status !== "matched"} onChange={e => setConfirmed(e.target.checked)} />
      {t("Це мій погоджений тестовий адресат, не клієнт. Дозволяю одне повідомлення на вказану адресу.", "This is my approved test destination, not a client. I authorize one message to the entered recipient.")}
    </label>
    <button type="submit" disabled={running || halted || attempted.includes(targetKey) || !confirmed || !normalized || preflight?.status !== "matched"} className="rounded border px-4 py-2 disabled:opacity-50">{running ? t("Виконується…", "Running…") : t("Надіслати ОДНЕ тестове повідомлення", "Send ONE test message")}</button>
    <p className="text-sm">{t("accepted — лише прийняття провайдером. Перевірте фактичне отримання у скриньці / чаті за ID. unknown або втрачена відповідь: СТОП, не оновлюйте сторінку для повтору. Після відомого результату можна ввести іншого погодженого адресата; повтор для тієї самої адреси заблоковано. Невідомий результат зупиняє всі наступні відправлення. Автоповторів немає; захист цієї сторінки не є глобальною ідемпотентністю.", "accepted means provider acceptance only. Confirm actual receipt in inbox/chat using the ID. unknown or lost response: STOP; do not reload to retry. After a known outcome you may enter another approved recipient; the same destination cannot be resent. An unknown outcome stops all further sends. No automatic retries; this page guard is not global idempotence.")}</p>
    {results.map(value => <p key={value.split(" · ")[1]} role="status" className="break-all rounded border p-3 font-mono text-sm">{value}</p>)}
  </form>;
}
