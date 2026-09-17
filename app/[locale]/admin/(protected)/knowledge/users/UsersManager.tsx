"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Save } from "lucide-react";

type User = { id: number; email: string; name: string | null; organization: string | null; plan: string; planUntil: string | null; locale: string | null; createdAt: string; lastLoginAt: string | null; asksTotal: number; asks30d: number };

export type UserLabels = Record<"empty" | "loading" | "plan" | "planUntil" | "save" | "saved" | "delete" | "confirmDelete" | "registered" | "lastLogin" | "asks30d" | "asksTotal" | "never" | "filter" | "hint", string>;

export function UsersManager({ labels: l, planNames }: { labels: UserLabels; planNames: Record<string, string> }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, { plan: string; planUntil: string }>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/users").then((r) => r.json());
    setUsers(d.users ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function edit(u: User) {
    return edits[u.id] ?? { plan: u.plan, planUntil: u.planUntil ? u.planUntil.slice(0, 10) : "" };
  }
  async function save(u: User) {
    setBusy(u.id); setMsg(null);
    const e = edit(u);
    const r = await fetch(`/api/admin/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: e.plan, planUntil: e.planUntil || null }) });
    setBusy(null);
    if (r.ok) { setMsg(`${u.email}: ${l.saved}`); setEdits((x) => { const c = { ...x }; delete c[u.id]; return c; }); load(); }
  }
  async function remove(u: User) {
    if (!confirm(`${l.confirmDelete} ${u.email}`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    load();
  }

  const field = "rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm";
  const shown = users.filter((u) => !filter || `${u.email} ${u.name ?? ""} ${u.organization ?? ""}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mt-8">
      <p className="text-sm text-[var(--color-fg-muted)]">{l.hint}</p>
      <input id="u-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={l.filter} className={`${field} mt-4 w-full sm:max-w-xs`} />
      {msg && <p className="mt-3 text-sm text-[var(--color-brand-text)]">{msg}</p>}
      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-[var(--color-fg-muted)]"><Loader2 size={16} className="animate-spin" aria-hidden /> {l.loading}</p>
      ) : shown.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-[var(--color-fg-muted)]">{l.empty}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((u) => {
            const e = edit(u);
            const dirty = e.plan !== u.plan || e.planUntil !== (u.planUntil ? u.planUntil.slice(0, 10) : "");
            return (
              <li key={u.id} className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="font-semibold">{u.email}{u.name ? ` · ${u.name}` : ""}{u.organization ? ` · ${u.organization}` : ""}</p>
                  <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">
                    {l.registered}: {u.createdAt.slice(0, 10)} · {l.lastLogin}: {u.lastLoginAt ? u.lastLoginAt.slice(0, 10) : l.never} · {l.asks30d}: {u.asks30d} · {l.asksTotal}: {u.asksTotal}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label={l.plan} className={field} value={e.plan} onChange={(ev) => setEdits((x) => ({ ...x, [u.id]: { ...e, plan: ev.target.value } }))}>
                    {["free", "premium", "enterprise"].map((p) => <option key={p} value={p}>{planNames[p] ?? p}</option>)}
                  </select>
                  <input aria-label={l.planUntil} type="date" className={field} value={e.planUntil} disabled={e.plan === "free"} onChange={(ev) => setEdits((x) => ({ ...x, [u.id]: { ...e, planUntil: ev.target.value } }))} />
                  <button type="button" onClick={() => save(u)} disabled={!dirty || busy === u.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                    {busy === u.id ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Save size={14} aria-hidden />} {l.save}
                  </button>
                  <button type="button" onClick={() => remove(u)} aria-label={l.delete} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:text-red-500"><Trash2 size={16} aria-hidden /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
