"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, MessageSquare, FileText, Trash2, Loader2, Copy, Check } from "lucide-react";

type Status = "new" | "in_progress" | "done" | "spam";
type Source = "form" | "chat";

type Lead = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string | null;
  message: string;
  source: Source;
  page: string | null;
  locale: string | null;
  transcript: { role: "user" | "assistant"; text: string }[] | null;
  status: Status;
  adminNote: string | null;
  createdAt: string;
};

type Labels = {
  all: string;
  statusNew: string;
  statusInProgress: string;
  statusDone: string;
  statusSpam: string;
  sourceForm: string;
  sourceChat: string;
  empty: string;
  loading: string;
  contact: string;
  message: string;
  transcript: string;
  note: string;
  notePlaceholder: string;
  saveNote: string;
  saved: string;
  delete: string;
  confirmDelete: string;
  clearSpam: string;
  page: string;
  segment: string;
  copy: string;
  copied: string;
  you: string;
  assistant: string;
  segments: Record<string, string>;
};

const STATUS_ORDER: Status[] = ["new", "in_progress", "done", "spam"];

function statusTone(s: Status) {
  switch (s) {
    case "new":
      return "bg-[var(--color-brand)] text-white";
    case "in_progress":
      return "bg-[var(--color-accent)] text-white";
    case "done":
      return "border border-[var(--color-line)] text-[var(--color-fg-muted)]";
    case "spam":
      return "border border-[var(--color-line)] text-[var(--color-fg-placeholder)] line-through";
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* буфер недоступний — нічого страшного */
        }
      }}
      aria-label={copied ? copiedLabel : label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-placeholder)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
    </button>
  );
}

/** Заявки з форми та чату: список, статуси, нотатка, транскрипт. Дані — /api/admin/leads. */
export function LeadsManager({ labels: l }: { labels: Labels }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savedId, setSavedId] = useState<number | null>(null);

  const statusLabel: Record<Status, string> = {
    new: l.statusNew,
    in_progress: l.statusInProgress,
    done: l.statusDone,
    spam: l.statusSpam,
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/leads");
    const data = await res.json();
    setLeads(data.leads ?? []);
    setByStatus(data.byStatus ?? {});
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: number, body: Partial<Pick<Lead, "status" | "adminNote">>) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { lead } = await res.json();
      setLeads((prev) => prev.map((x) => (x.id === id ? lead : x)));
      setByStatus((prev) => {
        if (!body.status) return prev;
        const old = leads.find((x) => x.id === id)?.status;
        const next = { ...prev };
        if (old) next[old] = Math.max(0, (next[old] ?? 1) - 1);
        next[body.status] = (next[body.status] ?? 0) + 1;
        return next;
      });
    }
  }

  async function remove(id: number) {
    if (!confirm(l.confirmDelete)) return;
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function clearSpam() {
    if (!confirm(l.confirmDelete)) return;
    await fetch("/api/admin/leads", { method: "DELETE" });
    load();
  }

  const visible = useMemo(
    () => (filter === "all" ? leads : leads.filter((x) => x.status === filter)),
    [leads, filter]
  );

  const total = leads.length;

  return (
    <div className="mt-8">
      {/* Фільтри за статусом — лічильники живі */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            filter === "all" ? "bg-[var(--color-fg)] text-[var(--color-bg)]" : "border border-[var(--color-line)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          }`}
        >
          {l.all} <span className="tabular-nums opacity-70">{total}</span>
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === s ? "bg-[var(--color-fg)] text-[var(--color-bg)]" : "border border-[var(--color-line)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
          >
            {statusLabel[s]} <span className="tabular-nums opacity-70">{byStatus[s] ?? 0}</span>
          </button>
        ))}
        {(byStatus.spam ?? 0) > 0 && (
          <button
            type="button"
            onClick={clearSpam}
            className="ml-auto text-sm text-[var(--color-fg-placeholder)] underline-offset-2 hover:underline"
          >
            {l.clearSpam}
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-10 flex items-center gap-2 text-[var(--color-fg-muted)]">
          <Loader2 size={16} className="animate-spin" aria-hidden /> {l.loading}
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-[var(--color-fg-muted)]">
          {l.empty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((lead) => {
            const open = openId === lead.id;
            const note = notes[lead.id] ?? lead.adminNote ?? "";
            return (
              <li
                key={lead.id}
                className={`rounded-xl border bg-[var(--color-bg)] transition ${
                  lead.status === "new" ? "border-[var(--color-brand)]/60" : "border-[var(--color-line)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : lead.id)}
                  aria-expanded={open}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className={`mono-label shrink-0 rounded-full px-2.5 py-1 ${statusTone(lead.status)}`}>
                    {statusLabel[lead.status]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{lead.name}</span>
                    <span className="ml-2 text-sm text-[var(--color-fg-muted)]">
                      {lead.segment ? l.segments[lead.segment] ?? lead.segment : ""}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--color-fg-muted)]">
                      {lead.source === "chat" ? lead.transcript?.filter((m) => m.role === "user").at(-1)?.text : lead.message}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-[var(--color-fg-placeholder)]">
                    <span className="inline-flex items-center gap-1">
                      {lead.source === "chat" ? <MessageSquare size={13} aria-hidden /> : <FileText size={13} aria-hidden />}
                      {lead.source === "chat" ? l.sourceChat : l.sourceForm}
                    </span>
                    <span className="tabular-nums">{formatDate(lead.createdAt)}</span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-[var(--color-line)] px-4 py-4">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                      <div className="space-y-4">
                        <div>
                          <p className="mono-label text-[var(--color-fg-placeholder)]">{l.contact}</p>
                          <ul className="mt-2 space-y-1.5 text-sm">
                            {lead.phone && (
                              <li className="flex items-center gap-2">
                                <Phone size={14} aria-hidden className="text-[var(--color-brand-text)]" />
                                <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                                <CopyButton value={lead.phone} label={l.copy} copiedLabel={l.copied} />
                              </li>
                            )}
                            {lead.email && (
                              <li className="flex items-center gap-2">
                                <Mail size={14} aria-hidden className="text-[var(--color-brand-text)]" />
                                <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                                <CopyButton value={lead.email} label={l.copy} copiedLabel={l.copied} />
                              </li>
                            )}
                          </ul>
                        </div>

                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                          <dt className="text-[var(--color-fg-placeholder)]">{l.segment}</dt>
                          <dd>{lead.segment ? l.segments[lead.segment] ?? lead.segment : "—"}</dd>
                          <dt className="text-[var(--color-fg-placeholder)]">{l.page}</dt>
                          <dd className="truncate">{lead.page ?? "—"}</dd>
                        </dl>

                        <div>
                          <p className="mono-label text-[var(--color-fg-placeholder)]">{l.note}</p>
                          <textarea
                            rows={3}
                            value={note}
                            onChange={(e) => setNotes((n) => ({ ...n, [lead.id]: e.target.value }))}
                            placeholder={l.notePlaceholder}
                            className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                          />
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={async () => {
                                await patch(lead.id, { adminNote: note });
                                setSavedId(lead.id);
                                setTimeout(() => setSavedId(null), 1500);
                              }}
                              className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]"
                            >
                              {savedId === lead.id ? l.saved : l.saveNote}
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(lead.id)}
                              className="ml-auto inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-placeholder)] transition hover:text-red-500"
                            >
                              <Trash2 size={14} aria-hidden /> {l.delete}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="mono-label text-[var(--color-fg-placeholder)]">
                            {lead.source === "chat" ? l.transcript : l.message}
                          </p>
                          {lead.source === "chat" && lead.transcript ? (
                            <ol className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm">
                              {lead.transcript.map((m, i) => (
                                <li key={i} className={m.role === "user" ? "text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]"}>
                                  <span className="mono-label mr-2 text-[var(--color-fg-placeholder)]">
                                    {m.role === "user" ? l.you : l.assistant}
                                  </span>
                                  {m.text}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm">
                              {lead.message || "—"}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {STATUS_ORDER.map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={lead.status === s}
                              onClick={() => patch(lead.id, { status: s })}
                              className={`rounded-full px-3 py-1.5 text-sm font-medium transition disabled:cursor-default ${
                                lead.status === s ? statusTone(s) : "border border-[var(--color-line)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                              }`}
                            >
                              {statusLabel[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
