"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";

type Post = {
  id: number;
  slug: string;
  titleUk: string;
  titleEn: string;
  excerptUk: string;
  excerptEn: string;
  bodyUk: string;
  bodyEn: string;
  tag: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type Labels = Record<
  "addNew" | "published" | "draft" | "edit" | "delete" | "save" | "cancel" | "publish" | "unpublish" | "confirmDelete" | "slug" | "slugHint" | "titleUk" | "titleEn" | "excerptUk" | "excerptEn" | "bodyUk" | "bodyEn" | "tag" | "tagHint" | "markdownHint" | "empty" | "loading" | "open" | "saved" | "error",
  string
>;

const empty = () => ({ slug: "", titleUk: "", titleEn: "", excerptUk: "", excerptEn: "", bodyUk: "", bodyEn: "", tag: "", published: false });
type Form = ReturnType<typeof empty>;

function slugify(s: string) {
  const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia","'":"" ,"ʼ":"" };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
}

export function BlogManager({ labels: l }: { labels: Labels }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/posts");
    const d = await r.json();
    setPosts(d.posts ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function startNew() { setForm(empty()); setEditing("new"); setMsg(null); }
  function startEdit(p: Post) {
    setForm({ slug: p.slug, titleUk: p.titleUk, titleEn: p.titleEn, excerptUk: p.excerptUk, excerptEn: p.excerptEn, bodyUk: p.bodyUk, bodyEn: p.bodyEn, tag: p.tag ?? "", published: p.published });
    setEditing(p.id); setMsg(null);
  }

  async function save() {
    setBusy(true); setMsg(null);
    const payload = { ...form, tag: form.tag || null };
    const res = editing === "new"
      ? await fetch("/api/admin/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`/api/admin/posts/${editing}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (res.ok) { setMsg(l.saved); setEditing(null); load(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error ? `${l.error}: ${d.error}` : l.error); }
  }

  async function togglePublish(p: Post) {
    await fetch(`/api/admin/posts/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !p.published }) });
    load();
  }

  async function remove(p: Post) {
    if (!confirm(l.confirmDelete)) return;
    await fetch(`/api/admin/posts/${p.id}`, { method: "DELETE" });
    load();
  }

  const field = "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-placeholder)]";

  return (
    <div className="mt-8">
      {editing === null ? (
        <>
          <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
            <Plus size={16} aria-hidden /> {l.addNew}
          </button>
          {msg && <p className="mt-3 text-sm text-[var(--color-brand-text)]">{msg}</p>}
          {loading ? (
            <p className="mt-8 flex items-center gap-2 text-[var(--color-fg-muted)]"><Loader2 size={16} className="animate-spin" aria-hidden /> {l.loading}</p>
          ) : posts.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-[var(--color-fg-muted)]">{l.empty}</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className={`mono-label shrink-0 rounded-full px-2.5 py-1 ${p.published ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-line)] text-[var(--color-fg-muted)]"}`}>
                    {p.published ? l.published : l.draft}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.titleUk}</span>
                    <span className="block truncate text-xs text-[var(--color-fg-placeholder)]">/{p.slug}{p.tag ? ` · ${p.tag}` : ""}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {p.published && (
                      <a href={`/uk/blog/${p.slug}`} target="_blank" rel="noreferrer" aria-label={l.open} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"><ExternalLink size={16} aria-hidden /></a>
                    )}
                    <button type="button" onClick={() => togglePublish(p)} aria-label={p.published ? l.unpublish : l.publish} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]">{p.published ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}</button>
                    <button type="button" onClick={() => startEdit(p)} aria-label={l.edit} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"><Pencil size={16} aria-hidden /></button>
                    <button type="button" onClick={() => remove(p)} aria-label={l.delete} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] hover:bg-[var(--color-surface)] hover:text-red-500"><Trash2 size={16} aria-hidden /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="titleUk">{l.titleUk}</label>
              <input id="titleUk" className={field} value={form.titleUk} onChange={(e) => setForm((f) => ({ ...f, titleUk: e.target.value, slug: editing === "new" && !f.slug ? slugify(e.target.value) : f.slug }))} required />
            </div>
            <div>
              <label className={label} htmlFor="titleEn">{l.titleEn}</label>
              <input id="titleEn" className={field} value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="slug">{l.slug}</label>
              <input id="slug" className={field} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} pattern="[a-z0-9\-]+" required />
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.slugHint}</p>
            </div>
            <div>
              <label className={label} htmlFor="tag">{l.tag}</label>
              <input id="tag" className={field} value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} />
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{l.tagHint}</p>
            </div>
            <div>
              <label className={label} htmlFor="excerptUk">{l.excerptUk}</label>
              <textarea id="excerptUk" rows={3} className={field} value={form.excerptUk} onChange={(e) => setForm((f) => ({ ...f, excerptUk: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="excerptEn">{l.excerptEn}</label>
              <textarea id="excerptEn" rows={3} className={field} value={form.excerptEn} onChange={(e) => setForm((f) => ({ ...f, excerptEn: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="bodyUk">{l.bodyUk}</label>
              <textarea id="bodyUk" rows={18} className={`${field} font-mono text-xs`} value={form.bodyUk} onChange={(e) => setForm((f) => ({ ...f, bodyUk: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="bodyEn">{l.bodyEn}</label>
              <textarea id="bodyEn" rows={18} className={`${field} font-mono text-xs`} value={form.bodyEn} onChange={(e) => setForm((f) => ({ ...f, bodyEn: e.target.value }))} />
            </div>
          </div>
          <p className="text-xs text-[var(--color-fg-placeholder)]">{l.markdownHint}</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="h-4 w-4" />
            {l.published}
          </label>
          {msg && <p className="text-sm text-[#b91c1c] dark:text-[#f87171]">{msg}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50">{busy ? "…" : l.save}</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium">{l.cancel}</button>
          </div>
        </form>
      )}
    </div>
  );
}
