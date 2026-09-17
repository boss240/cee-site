"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Eye, EyeOff, History, ShieldCheck } from "lucide-react";

type Doc = {
  id: number; slug: string; kind: string; number: string | null; title: string; issuer: string | null;
  adoptedAt: string | null; status: string; summary: string; keyPoints: string[] | null; tags: string[] | null;
  sourceUrl: string | null; checkedAt: string | null; published: boolean; updatedAt: string;
};
type Upd = { id: number; date: string; note: string; sourceUrl: string | null };

export type DocLabels = Record<
  | "addNew" | "published" | "draft" | "edit" | "delete" | "save" | "cancel" | "publish" | "unpublish" | "confirmDelete" | "slug" | "slugHint"
  | "kind" | "number" | "title" | "issuer" | "adoptedAt" | "status" | "summary" | "summaryHint" | "keyPoints" | "keyPointsHint" | "tags" | "tagsHint"
  | "sourceUrl" | "checked" | "checkedHint" | "empty" | "loading" | "open" | "saved" | "error" | "filter" | "updates" | "addUpdate" | "updateDate"
  | "updateNote" | "updateSource" | "noUpdates" | "checkedAt" | "never",
  string
>;

const KINDS = ["law", "resolution", "regulator", "dbn", "dstu", "iso", "eu", "other"] as const;
const STATUSES = ["active", "amended", "repealed", "draft"] as const;

const empty = () => ({ slug: "", kind: "law", number: "", title: "", issuer: "", adoptedAt: "", status: "active", summary: "", keyPoints: "", tags: "", sourceUrl: "", checked: true, published: false });
type Form = ReturnType<typeof empty>;

function slugify(s: string) {
  const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia","'":"","ʼ":"" };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
}
const dateInput = (s: string | null) => (s ? s.slice(0, 10) : "");

export function DocumentsManager({ labels: l, kindNames, statusNames }: { labels: DocLabels; kindNames: Record<string, string>; statusNames: Record<string, string> }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [updates, setUpdates] = useState<Upd[]>([]);
  const [upd, setUpd] = useState({ date: "", note: "", sourceUrl: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/knowledge/documents");
    const d = await r.json();
    setDocs(d.documents ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function loadUpdates(id: number) {
    const r = await fetch(`/api/admin/knowledge/documents/${id}/updates`);
    const d = await r.json();
    setUpdates(d.updates ?? []);
  }

  function startNew() { setForm(empty()); setEditing("new"); setUpdates([]); setMsg(null); }
  function startEdit(d: Doc) {
    setForm({ slug: d.slug, kind: d.kind, number: d.number ?? "", title: d.title, issuer: d.issuer ?? "", adoptedAt: dateInput(d.adoptedAt), status: d.status, summary: d.summary, keyPoints: (d.keyPoints ?? []).join("\n"), tags: (d.tags ?? []).join(", "), sourceUrl: d.sourceUrl ?? "", checked: false, published: d.published });
    setEditing(d.id); setMsg(null); loadUpdates(d.id);
  }

  function payload() {
    return {
      ...form,
      number: form.number || null, issuer: form.issuer || null, sourceUrl: form.sourceUrl || null, adoptedAt: form.adoptedAt || null,
      keyPoints: form.keyPoints.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
  }

  async function save() {
    setBusy(true); setMsg(null);
    const res = editing === "new"
      ? await fetch("/api/admin/knowledge/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) })
      : await fetch(`/api/admin/knowledge/documents/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
    setBusy(false);
    if (res.ok) { setMsg(l.saved); setEditing(null); load(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error ? `${l.error}: ${d.error}` : l.error); }
  }

  async function togglePublish(d: Doc) {
    await fetch(`/api/admin/knowledge/documents/${d.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !d.published }) });
    load();
  }
  async function remove(d: Doc) {
    if (!confirm(l.confirmDelete)) return;
    await fetch(`/api/admin/knowledge/documents/${d.id}`, { method: "DELETE" });
    load();
  }
  async function addUpdate() {
    if (editing === "new" || editing === null || upd.note.trim().length < 2) return;
    setBusy(true);
    await fetch(`/api/admin/knowledge/documents/${editing}/updates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: upd.date || null, note: upd.note, sourceUrl: upd.sourceUrl || null }) });
    setUpd({ date: "", note: "", sourceUrl: "" });
    await loadUpdates(editing);
    setBusy(false);
    load();
  }
  async function removeUpdate(id: number) {
    if (editing === "new" || editing === null) return;
    await fetch(`/api/admin/knowledge/updates/${id}`, { method: "DELETE" });
    loadUpdates(editing);
  }

  const field = "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-placeholder)]";
  const shown = docs.filter((d) => !filter || `${d.number ?? ""} ${d.title} ${d.slug} ${(d.tags ?? []).join(" ")}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mt-8">
      {editing === null ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
              <Plus size={16} aria-hidden /> {l.addNew}
            </button>
            <input id="doc-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={l.filter} className={`${field} sm:max-w-xs`} />
          </div>
          {msg && <p className="mt-3 text-sm text-[var(--color-brand-text)]">{msg}</p>}
          {loading ? (
            <p className="mt-8 flex items-center gap-2 text-[var(--color-fg-muted)]"><Loader2 size={16} className="animate-spin" aria-hidden /> {l.loading}</p>
          ) : shown.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-[var(--color-fg-muted)]">{l.empty}</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {shown.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className={`mono-label shrink-0 rounded-full px-2.5 py-1 ${d.published ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-line)] text-[var(--color-fg-muted)]"}`}>{d.published ? l.published : l.draft}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{d.number ? `${d.number} — ` : ""}{d.title}</span>
                    <span className="block truncate text-xs text-[var(--color-fg-placeholder)]">{kindNames[d.kind] ?? d.kind} · {statusNames[d.status] ?? d.status} · {l.checkedAt}: {d.checkedAt ? d.checkedAt.slice(0, 10) : l.never}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {d.published && <a href={`/uk/knowledge/documents/${d.slug}`} target="_blank" rel="noreferrer" aria-label={l.open} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"><ExternalLink size={16} aria-hidden /></a>}
                    <button type="button" onClick={() => togglePublish(d)} aria-label={d.published ? l.unpublish : l.publish} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]">{d.published ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}</button>
                    <button type="button" onClick={() => startEdit(d)} aria-label={l.edit} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"><Pencil size={16} aria-hidden /></button>
                    <button type="button" onClick={() => remove(d)} aria-label={l.delete} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-red-500"><Trash2 size={16} aria-hidden /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="d-title">{l.title}</label>
              <input id="d-title" className={field} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: editing === "new" && !f.slug ? slugify(e.target.value) : f.slug }))} required />
            </div>
            <div>
              <label className={label} htmlFor="d-kind">{l.kind}</label>
              <select id="d-kind" className={field} value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                {KINDS.map((k) => <option key={k} value={k}>{kindNames[k] ?? k}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="d-number">{l.number}</label>
              <input id="d-number" className={field} value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="d-slug">{l.slug}</label>
              <input id="d-slug" className={field} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} pattern="[a-z0-9\-]+" required />
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.slugHint}</p>
            </div>
            <div>
              <label className={label} htmlFor="d-issuer">{l.issuer}</label>
              <input id="d-issuer" className={field} value={form.issuer} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="d-adopted">{l.adoptedAt}</label>
              <input id="d-adopted" type="date" className={field} value={form.adoptedAt} onChange={(e) => setForm((f) => ({ ...f, adoptedAt: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="d-status">{l.status}</label>
              <select id="d-status" className={field} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusNames[s] ?? s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="d-source">{l.sourceUrl}</label>
              <input id="d-source" type="url" className={field} value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="d-summary">{l.summary}</label>
              <textarea id="d-summary" className={`${field} min-h-[220px] font-mono text-xs`} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.summaryHint}</p>
            </div>
            <div>
              <label className={label} htmlFor="d-kp">{l.keyPoints}</label>
              <textarea id="d-kp" className={`${field} min-h-[140px]`} value={form.keyPoints} onChange={(e) => setForm((f) => ({ ...f, keyPoints: e.target.value }))} />
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.keyPointsHint}</p>
            </div>
            <div>
              <label className={label} htmlFor="d-tags">{l.tags}</label>
              <textarea id="d-tags" className={`${field} min-h-[140px]`} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.tagsHint}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.checked} onChange={(e) => setForm((f) => ({ ...f, checked: e.target.checked }))} /> <ShieldCheck size={14} aria-hidden /> {l.checked}<span className="text-xs text-[var(--color-fg-placeholder)]">— {l.checkedHint}</span></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} /> {l.published}</label>
          </div>

          {editing !== "new" && (
            <section className="rounded-lg border border-[var(--color-line)] p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold"><History size={14} aria-hidden /> {l.updates}</p>
              {updates.length === 0 ? <p className="mt-2 text-xs text-[var(--color-fg-placeholder)]">{l.noUpdates}</p> : (
                <ul className="mt-3 space-y-2">
                  {updates.map((u) => (
                    <li key={u.id} className="flex items-start gap-3 text-sm">
                      <span className="mono-label shrink-0 text-[var(--color-fg-placeholder)]">{u.date.slice(0, 10)}</span>
                      <span className="flex-1">{u.note}{u.sourceUrl && <a href={u.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-[var(--color-brand-text)] underline">↗</a>}</span>
                      <button type="button" onClick={() => removeUpdate(u.id)} aria-label={l.delete} className="text-[var(--color-fg-placeholder)] hover:text-red-500"><Trash2 size={14} aria-hidden /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr_1fr_auto]">
                <input type="date" aria-label={l.updateDate} className={field} value={upd.date} onChange={(e) => setUpd((u) => ({ ...u, date: e.target.value }))} />
                <input placeholder={l.updateNote} className={field} value={upd.note} onChange={(e) => setUpd((u) => ({ ...u, note: e.target.value }))} />
                <input placeholder={l.updateSource} type="url" className={field} value={upd.sourceUrl} onChange={(e) => setUpd((u) => ({ ...u, sourceUrl: e.target.value }))} />
                <button type="button" onClick={addUpdate} disabled={busy || upd.note.trim().length < 2} className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-semibold text-[var(--color-brand-text)] disabled:opacity-50">{l.addUpdate}</button>
              </div>
            </section>
          )}

          {msg && <p className="text-sm text-red-500">{msg}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60">{busy && <Loader2 size={14} className="animate-spin" aria-hidden />} {l.save}</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-[var(--color-line)] px-5 py-2.5 text-sm font-semibold">{l.cancel}</button>
          </div>
        </form>
      )}
    </div>
  );
}
