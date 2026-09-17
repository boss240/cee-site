"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Eye, EyeOff, RefreshCw, Radio, Wand2, Newspaper, Rss } from "lucide-react";

type Source = { id: number; name: string; url: string; category: string | null; enabled: boolean; lastFetchedAt: string | null; lastStatus: string | null; itemsCount: number };
type News = { id: number; title: string; url: string; publishedAt: string | null; fetchedAt: string; summary: string | null; digestId: number | null; sourceName: string };
type Digest = { id: number; slug: string; title: string; periodFrom: string | null; periodTo: string | null; intro: string; body: string; published: boolean; publishedAt: string | null; updatedAt: string };

export type DigestLabels = Record<
  | "tabSources" | "tabNews" | "tabDigests" | "addSource" | "name" | "url" | "category" | "enabled" | "check" | "fetch" | "fetchAll" | "lastStatus" | "items" | "never"
  | "sourcesHint" | "newsHint" | "from" | "to" | "unassignedOnly" | "showNews" | "generateDraft" | "draftMode.ai" | "draftMode.template" | "draftMode.empty"
  | "addNew" | "published" | "draft" | "edit" | "delete" | "save" | "cancel" | "publish" | "unpublish" | "confirmDelete" | "slug" | "title" | "intro" | "body" | "markdownHint"
  | "empty" | "loading" | "open" | "saved" | "error" | "inDigest" | "noNews",
  string
>;

const CATS = ["regulator", "government", "operator", "market", "media"] as const;
const emptyDigest = () => ({ slug: "", title: "", periodFrom: "", periodTo: "", intro: "", body: "", published: false, newsIds: [] as number[] });
type DForm = ReturnType<typeof emptyDigest>;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function DigestsManager({ labels: l, categoryNames }: { labels: DigestLabels; categoryNames: Record<string, string> }) {
  const [tab, setTab] = useState<"sources" | "news" | "digests">("digests");
  const [sources, setSources] = useState<Source[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newSrc, setNewSrc] = useState({ name: "", url: "", category: "media" });
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [range, setRange] = useState({ from: iso(weekAgo), to: iso(new Date()), unassignedOnly: true });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<DForm>(emptyDigest());
  const [draftMode, setDraftMode] = useState<string | null>(null);

  const field = "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-placeholder)]";
  const iconBtn = "flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)] disabled:opacity-50";

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, d] = await Promise.all([fetch("/api/admin/knowledge/sources").then((r) => r.json()), fetch("/api/admin/knowledge/digests").then((r) => r.json())]);
    setSources(s.sources ?? []); setDigests(d.digests ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadNews() {
    setBusy("news");
    const q = new URLSearchParams({ from: range.from, to: range.to, unassigned: range.unassignedOnly ? "1" : "0" });
    const d = await fetch(`/api/admin/knowledge/news?${q}`).then((r) => r.json());
    setNews(d.news ?? []);
    setBusy(null);
  }

  // ---- sources ----
  async function addSource() {
    if (!newSrc.name || !newSrc.url) return;
    setBusy("addSource"); setMsg(null);
    const r = await fetch("/api/admin/knowledge/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSrc) });
    if (r.ok) { setNewSrc({ name: "", url: "", category: "media" }); loadAll(); } else { const d = await r.json().catch(() => ({})); setMsg(d.error ?? l.error); }
    setBusy(null);
  }
  async function toggleSource(s: Source) {
    await fetch(`/api/admin/knowledge/sources/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !s.enabled }) });
    loadAll();
  }
  async function sourceAction(s: Source, action: "check" | "fetch") {
    setBusy(`${action}-${s.id}`); setMsg(null);
    const d = await fetch(`/api/admin/knowledge/sources/${s.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).then((r) => r.json());
    setMsg(`${s.name}: ${d.result?.status ?? l.error}`);
    setBusy(null); loadAll();
  }
  async function fetchAll() {
    setBusy("fetchAll"); setMsg(null);
    const d = await fetch("/api/admin/knowledge/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fetchAll" }) }).then((r) => r.json());
    setMsg((d.results ?? []).map((x: { source: string; result: { status: string } }) => `${x.source}: ${x.result.status}`).join(" · ") || l.empty);
    setBusy(null); loadAll();
  }
  async function removeSource(s: Source) {
    if (!confirm(l.confirmDelete)) return;
    await fetch(`/api/admin/knowledge/sources/${s.id}`, { method: "DELETE" });
    loadAll();
  }

  // ---- digests ----
  async function generateDraft() {
    setBusy("draft"); setMsg(null); setDraftMode(null);
    const d = await fetch("/api/admin/knowledge/digests/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(range) }).then((r) => r.json());
    if (d.draft) {
      setForm({ slug: d.draft.slug, title: d.draft.title, periodFrom: range.from, periodTo: range.to, intro: d.draft.intro, body: d.draft.body, published: false, newsIds: d.draft.newsIds });
      setDraftMode(d.draft.mode);
      setEditing("new"); setTab("digests");
    } else setMsg(d.error ?? l.error);
    setBusy(null);
  }
  function startNew() { setForm(emptyDigest()); setDraftMode(null); setEditing("new"); setMsg(null); }
  function startEdit(d: Digest) {
    setForm({ slug: d.slug, title: d.title, periodFrom: d.periodFrom?.slice(0, 10) ?? "", periodTo: d.periodTo?.slice(0, 10) ?? "", intro: d.intro, body: d.body, published: d.published, newsIds: [] });
    setDraftMode(null); setEditing(d.id); setMsg(null);
  }
  async function saveDigest() {
    setBusy("save"); setMsg(null);
    const payload = { ...form, periodFrom: form.periodFrom || null, periodTo: form.periodTo || null };
    const r = editing === "new"
      ? await fetch("/api/admin/knowledge/digests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`/api/admin/knowledge/digests/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(null);
    if (r.ok) { setMsg(l.saved); setEditing(null); loadAll(); } else { const d = await r.json().catch(() => ({})); setMsg(d.error ? `${l.error}: ${d.error}` : l.error); }
  }
  async function togglePublish(d: Digest) {
    await fetch(`/api/admin/knowledge/digests/${d.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !d.published }) });
    loadAll();
  }
  async function removeDigest(d: Digest) {
    if (!confirm(l.confirmDelete)) return;
    await fetch(`/api/admin/knowledge/digests/${d.id}`, { method: "DELETE" });
    loadAll();
  }

  const tabs = [
    { id: "digests" as const, Icon: Newspaper, text: l.tabDigests },
    { id: "news" as const, Icon: Radio, text: l.tabNews },
    { id: "sources" as const, Icon: Rss, text: l.tabSources },
  ];

  return (
    <div className="mt-8">
      {editing === null && (
        <div className="flex flex-wrap gap-1 border-b border-[var(--color-line)]">
          {tabs.map(({ id, Icon, text }) => (
            <button key={id} type="button" onClick={() => { setTab(id); if (id === "news" && news.length === 0) loadNews(); }} className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold ${tab === id ? "border-[var(--color-brand)] text-[var(--color-brand-text)]" : "border-transparent text-[var(--color-fg-muted)]"}`}>
              <Icon size={15} aria-hidden /> {text}
            </button>
          ))}
        </div>
      )}
      {msg && <p className="mt-3 break-words text-sm text-[var(--color-brand-text)]">{msg}</p>}
      {loading && <p className="mt-6 flex items-center gap-2 text-[var(--color-fg-muted)]"><Loader2 size={16} className="animate-spin" aria-hidden /> {l.loading}</p>}

      {/* ---- Джерела ---- */}
      {!loading && editing === null && tab === "sources" && (
        <div className="mt-6">
          <p className="text-sm text-[var(--color-fg-muted)]">{l.sourcesHint}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_160px_auto]">
            <input placeholder={l.name} className={field} value={newSrc.name} onChange={(e) => setNewSrc((s) => ({ ...s, name: e.target.value }))} />
            <input placeholder={l.url} type="url" className={field} value={newSrc.url} onChange={(e) => setNewSrc((s) => ({ ...s, url: e.target.value }))} />
            <select className={field} value={newSrc.category} onChange={(e) => setNewSrc((s) => ({ ...s, category: e.target.value }))}>
              {CATS.map((c) => <option key={c} value={c}>{categoryNames[c] ?? c}</option>)}
            </select>
            <button type="button" onClick={addSource} disabled={busy === "addSource"} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Plus size={16} aria-hidden /> {l.addSource}</button>
          </div>
          <div className="mt-4">
            <button type="button" onClick={fetchAll} disabled={busy === "fetchAll"} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-text)] disabled:opacity-60">
              {busy === "fetchAll" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />} {l.fetchAll}
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {sources.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4 sm:flex-row sm:items-center">
                <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" checked={s.enabled} onChange={() => toggleSource(s)} /> {l.enabled}</label>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.name} <span className="ml-1 text-xs font-normal text-[var(--color-fg-placeholder)]">{categoryNames[s.category ?? ""] ?? s.category}</span></span>
                  <span className="block truncate text-xs text-[var(--color-fg-placeholder)]">{s.url}</span>
                  <span className={`block text-xs ${s.lastStatus?.startsWith("error") ? "text-red-500" : "text-[var(--color-fg-muted)]"}`}>{l.lastStatus}: {s.lastStatus ?? l.never}{s.lastFetchedAt ? ` (${new Date(s.lastFetchedAt).toLocaleString("uk-UA")})` : ""} · {l.items}: {s.itemsCount}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => sourceAction(s, "check")} disabled={busy === `check-${s.id}`} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{busy === `check-${s.id}` ? "…" : l.check}</button>
                  <button type="button" onClick={() => sourceAction(s, "fetch")} disabled={busy === `fetch-${s.id}`} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-text)] disabled:opacity-50">{busy === `fetch-${s.id}` ? "…" : l.fetch}</button>
                  <button type="button" onClick={() => removeSource(s)} aria-label={l.delete} className={`${iconBtn} hover:text-red-500`}><Trash2 size={16} aria-hidden /></button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Новини ---- */}
      {!loading && editing === null && tab === "news" && (
        <div className="mt-6">
          <p className="text-sm text-[var(--color-fg-muted)]">{l.newsHint}</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div><label className={label} htmlFor="n-from">{l.from}</label><input id="n-from" type="date" className={field} value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></div>
            <div><label className={label} htmlFor="n-to">{l.to}</label><input id="n-to" type="date" className={field} value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></div>
            <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={range.unassignedOnly} onChange={(e) => setRange((r) => ({ ...r, unassignedOnly: e.target.checked }))} /> {l.unassignedOnly}</label>
            <button type="button" onClick={loadNews} disabled={busy === "news"} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold disabled:opacity-60">{l.showNews}</button>
            <button type="button" onClick={generateDraft} disabled={busy === "draft"} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy === "draft" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Wand2 size={14} aria-hidden />} {l.generateDraft}
            </button>
          </div>
          {news.length === 0 ? <p className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-fg-muted)]">{l.noNews}</p> : (
            <ul className="mt-4 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
              {news.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <a href={n.url} target="_blank" rel="noreferrer" className="font-medium hover:text-[var(--color-brand-text)]">{n.title}</a>
                  <p className="text-xs text-[var(--color-fg-placeholder)]">{n.sourceName} · {(n.publishedAt ?? n.fetchedAt).slice(0, 10)}{n.digestId ? ` · ${l.inDigest} #${n.digestId}` : ""}</p>
                  {n.summary && <p className="mt-1 line-clamp-2 text-xs text-[var(--color-fg-muted)]">{n.summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---- Дайджести ---- */}
      {!loading && editing === null && tab === "digests" && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"><Plus size={16} aria-hidden /> {l.addNew}</button>
            <button type="button" onClick={() => { setTab("news"); if (news.length === 0) loadNews(); }} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-text)]"><Wand2 size={14} aria-hidden /> {l.generateDraft}</button>
          </div>
          {digests.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-[var(--color-fg-muted)]">{l.empty}</p> : (
            <ul className="mt-6 space-y-3">
              {digests.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className={`mono-label shrink-0 rounded-full px-2.5 py-1 ${d.published ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-line)] text-[var(--color-fg-muted)]"}`}>{d.published ? l.published : l.draft}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{d.title}</span>
                    <span className="block truncate text-xs text-[var(--color-fg-placeholder)]">/{d.slug}{d.periodFrom && d.periodTo ? ` · ${d.periodFrom.slice(0, 10)} — ${d.periodTo.slice(0, 10)}` : ""}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {d.published && <a href={`/uk/knowledge/digests/${d.slug}`} target="_blank" rel="noreferrer" aria-label={l.open} className={iconBtn}><ExternalLink size={16} aria-hidden /></a>}
                    <button type="button" onClick={() => togglePublish(d)} aria-label={d.published ? l.unpublish : l.publish} className={iconBtn}>{d.published ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}</button>
                    <button type="button" onClick={() => startEdit(d)} aria-label={l.edit} className={iconBtn}><Pencil size={16} aria-hidden /></button>
                    <button type="button" onClick={() => removeDigest(d)} aria-label={l.delete} className={`${iconBtn} hover:text-red-500`}><Trash2 size={16} aria-hidden /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing !== null && (
        <form onSubmit={(e) => { e.preventDefault(); saveDigest(); }} className="space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
          {draftMode && <p className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">{l[`draftMode.${draftMode}` as keyof DigestLabels] ?? draftMode}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className={label} htmlFor="g-title">{l.title}</label><input id="g-title" className={field} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
            <div><label className={label} htmlFor="g-slug">{l.slug}</label><input id="g-slug" className={field} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} pattern="[a-z0-9\-]+" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label} htmlFor="g-from">{l.from}</label><input id="g-from" type="date" className={field} value={form.periodFrom} onChange={(e) => setForm((f) => ({ ...f, periodFrom: e.target.value }))} /></div>
              <div><label className={label} htmlFor="g-to">{l.to}</label><input id="g-to" type="date" className={field} value={form.periodTo} onChange={(e) => setForm((f) => ({ ...f, periodTo: e.target.value }))} /></div>
            </div>
            <div className="sm:col-span-2"><label className={label} htmlFor="g-intro">{l.intro}</label><textarea id="g-intro" className={`${field} min-h-[70px]`} value={form.intro} onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))} /></div>
            <div className="sm:col-span-2"><label className={label} htmlFor="g-body">{l.body}</label><textarea id="g-body" className={`${field} min-h-[360px] font-mono text-xs`} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} /><p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.markdownHint}</p></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} /> {l.published}</label>
          <div className="flex gap-3">
            <button type="submit" disabled={busy === "save"} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === "save" && <Loader2 size={14} className="animate-spin" aria-hidden />} {l.save}</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-[var(--color-line)] px-5 py-2.5 text-sm font-semibold">{l.cancel}</button>
          </div>
        </form>
      )}
    </div>
  );
}
