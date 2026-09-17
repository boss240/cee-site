"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";

type Labels = {
  addNew: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  status: string;
  page: string;
  active: string;
  hidden: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
};

type Service = {
  id: number;
  titleUk: string;
  titleEn: string;
  descriptionUk: string;
  descriptionEn: string;
  price: number;
  currency: string;
  status: "active" | "draft" | "archived";
};

const emptyForm = () => ({
  titleUk: "",
  titleEn: "",
  descriptionUk: "",
  descriptionEn: "",
  price: 0,
  currency: "UAH",
  status: "active" as Service["status"],
});

/** CRUD через /api/admin/services (Drizzle + PostgreSQL) — реальні дані, без in-memory моку. */
export function ServicesManager({ labels: l }: { labels: Labels }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(s: Service) {
    setEditingId(s.id);
    setForm({
      titleUk: s.titleUk,
      titleEn: s.titleEn,
      descriptionUk: s.descriptionUk,
      descriptionEn: s.descriptionEn,
      price: s.price,
      currency: s.currency,
      status: s.status,
    });
    setAdding(false);
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setForm(emptyForm());
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
  }

  async function save() {
    if (editingId) {
      await fetch(`/api/admin/services/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (adding) {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    cancel();
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleStatus(s: Service) {
    const status = s.status === "active" ? "draft" : "active";
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  const field = "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)]";

  return (
    <div className="mt-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={startAdd}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]"
        >
          <Plus size={16} aria-hidden />
          {l.addNew}
        </button>
      </div>

      {(adding || editingId) && (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              {l.name} (UK)
              <input className={`mt-1 ${field}`} value={form.titleUk} onChange={(e) => setForm((f) => ({ ...f, titleUk: e.target.value }))} />
            </label>
            <label className="text-sm">
              {l.name} (EN)
              <input className={`mt-1 ${field}`} value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
            </label>
            <label className="text-sm">
              {l.description} (UK)
              <input className={`mt-1 ${field}`} value={form.descriptionUk} onChange={(e) => setForm((f) => ({ ...f, descriptionUk: e.target.value }))} />
            </label>
            <label className="text-sm">
              {l.description} (EN)
              <input className={`mt-1 ${field}`} value={form.descriptionEn} onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} />
            </label>
            <label className="text-sm">
              {l.price}
              <input type="number" className={`mt-1 ${field}`} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </label>
            <label className="text-sm">
              {l.currency}
              <input className={`mt-1 ${field}`} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} type="button" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]">
              {l.save}
            </button>
            <button onClick={cancel} type="button" className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-fg-muted)]">
              {l.cancel}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-line)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--color-surface)] text-left text-[var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">{l.name}</th>
              <th className="px-4 py-3 font-semibold">{l.price}</th>
              <th className="px-4 py-3 font-semibold">{l.status}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-fg-muted)]">
                  <Loader2 className="mx-auto animate-spin" size={18} aria-hidden />
                </td>
              </tr>
            )}
            {!loading &&
              services.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.titleUk}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">{s.descriptionUk}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {s.price.toLocaleString()} {s.currency}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        s.status === "active"
                          ? "bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]"
                          : "bg-[var(--color-line)] text-[var(--color-fg-muted)]"
                      }`}
                    >
                      {s.status === "active" ? l.active : l.hidden}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button aria-label={l.edit} onClick={() => startEdit(s)} type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]">
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button aria-label={l.delete} onClick={() => remove(s.id)} type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b91c1c] hover:bg-[var(--color-surface)] dark:text-[#f87171]">
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
