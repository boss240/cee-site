"use client";

import { useState } from "react";

type Labels = Record<"current" | "next" | "confirm" | "hint" | "save" | "saved" | "mismatch" | "wrongCurrent" | "weak" | "error", string>;

export function PasswordForm({ labels: l }: { labels: Labels }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) return setMsg({ ok: false, text: l.mismatch });
    if (next.length < 10) return setMsg({ ok: false, text: l.weak });
    setBusy(true);
    const r = await fetch("/api/admin/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }) });
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: l.saved }); setCurrent(""); setNext(""); setConfirm(""); return; }
    const d = await r.json().catch(() => ({}));
    setMsg({ ok: false, text: d.error === "wrong-current" ? l.wrongCurrent : d.error === "weak" ? l.weak : l.error });
  }

  const field = "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2";
  const label = "mb-1 block text-sm font-semibold";
  return (
    <form onSubmit={submit} className="mt-8 max-w-md space-y-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
      <div><label className={label} htmlFor="cur">{l.current}</label><input id="cur" type="password" autoComplete="current-password" className={field} value={current} onChange={(e) => setCurrent(e.target.value)} required /></div>
      <div><label className={label} htmlFor="new">{l.next}</label><input id="new" type="password" autoComplete="new-password" className={field} value={next} onChange={(e) => setNext(e.target.value)} required minLength={10} /><p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.hint}</p></div>
      <div><label className={label} htmlFor="conf">{l.confirm}</label><input id="conf" type="password" autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
      {msg && <p className={`text-sm ${msg.ok ? "text-[var(--color-brand-text)]" : "text-[#b91c1c] dark:text-[#f87171]"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50">{l.save}</button>
    </form>
  );
}
