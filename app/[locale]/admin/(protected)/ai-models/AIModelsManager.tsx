"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2, Plus, CheckCircle2, XCircle, Loader2, Star } from "lucide-react";

type Labels = {
  addNew: string;
  name: string;
  provider: string;
  model: string;
  apiKeyEnvVar: string;
  priority: string;
  priorityHint: string;
  active: string;
  inactive: string;
  default: string;
  setDefault: string;
  inputCost: string;
  outputCost: string;
  testConnection: string;
  testing: string;
  testOk: string;
  testFail: string;
  noKey: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  usageTitle: string;
  usageEmpty: string;
  status: string;
  responseTime: string;
  cost: string;
  tokens: string;
};

type AIModel = {
  id: number;
  name: string;
  provider: string;
  model: string;
  apiKeyEnvVar: string;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  systemPrompt: string | null;
};

type UsageLog = {
  id: number;
  modelNameSnapshot: string | null;
  status: string;
  errorMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  responseTimeMs: number;
  createdAt: string;
};

const emptyForm = () => ({
  name: "",
  provider: "openai",
  model: "",
  apiKeyEnvVar: "OPENAI_API_KEY",
  priority: 0,
  inputCostPer1kTokens: 0,
  outputCostPer1kTokens: 0,
});

export function AIModelsManager({ labels: l }: { labels: Labels }) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [testState, setTestState] = useState<
    Record<number, { status: "testing" | "ok" | "fail"; message?: string } | undefined>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    const [modelsRes, logsRes] = await Promise.all([
      fetch("/api/admin/ai-models"),
      fetch("/api/admin/ai-usage"),
    ]);
    const modelsData = await modelsRes.json();
    const logsData = await logsRes.json();
    setModels(modelsData.models ?? []);
    setLogs(logsData.logs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(m: AIModel) {
    setEditingId(m.id);
    setAdding(false);
    setForm({
      name: m.name,
      provider: m.provider,
      model: m.model,
      apiKeyEnvVar: m.apiKeyEnvVar,
      priority: m.priority,
      inputCostPer1kTokens: m.inputCostPer1kTokens,
      outputCostPer1kTokens: m.outputCostPer1kTokens,
    });
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
      await fetch(`/api/admin/ai-models/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (adding) {
      await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    cancel();
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/admin/ai-models/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleActive(m: AIModel) {
    await fetch(`/api/admin/ai-models/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    await load();
  }

  async function setDefault(id: number) {
    await fetch(`/api/admin/ai-models/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await load();
  }

  async function testConnection(id: number) {
    setTestState((s) => ({ ...s, [id]: { status: "testing" } }));
    try {
      const res = await fetch(`/api/admin/ai-models/${id}/test-connection`, { method: "POST" });
      const data = await res.json();
      setTestState((s) => ({ ...s, [id]: { status: data.ok ? "ok" : "fail", message: data.message } }));
    } catch (err) {
      setTestState((s) => ({
        ...s,
        [id]: { status: "fail", message: err instanceof Error ? err.message : String(err) },
      }));
    }
  }

  const field =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)]";

  return (
    <div className="mt-6">
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
              {l.name}
              <input className={`mt-1 ${field}`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="text-sm">
              {l.provider}
              <select className={`mt-1 ${field}`} value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="openrouter">OpenRouter (Qwen, Gemini, DeepSeek, …)</option>
              </select>
            </label>
            <label className="text-sm">
              {l.model}
              <input
                className={`mt-1 ${field}`}
                placeholder="gpt-4o-mini"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              {l.apiKeyEnvVar}
              <input
                className={`mt-1 ${field}`}
                placeholder="OPENAI_API_KEY"
                value={form.apiKeyEnvVar}
                onChange={(e) => setForm((f) => ({ ...f, apiKeyEnvVar: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              {l.priority}
              <input
                type="number"
                className={`mt-1 ${field}`}
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
              />
              <span className="mt-1 block text-xs text-[var(--color-fg-placeholder)]">{l.priorityHint}</span>
            </label>
            <div />
            <label className="text-sm">
              {l.inputCost}
              <input
                type="number"
                step="0.0001"
                className={`mt-1 ${field}`}
                value={form.inputCostPer1kTokens}
                onChange={(e) => setForm((f) => ({ ...f, inputCostPer1kTokens: Number(e.target.value) }))}
              />
            </label>
            <label className="text-sm">
              {l.outputCost}
              <input
                type="number"
                step="0.0001"
                className={`mt-1 ${field}`}
                value={form.outputCostPer1kTokens}
                onChange={(e) => setForm((f) => ({ ...f, outputCostPer1kTokens: Number(e.target.value) }))}
              />
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
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-[var(--color-surface)] text-left text-[var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">{l.name}</th>
              <th className="px-4 py-3 font-semibold">{l.priority}</th>
              <th className="px-4 py-3 font-semibold">{l.status}</th>
              <th className="px-4 py-3 font-semibold">{l.default}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-fg-muted)]">
                  <Loader2 className="mx-auto animate-spin" size={18} aria-hidden />
                </td>
              </tr>
            )}
            {!loading &&
              models.map((m) => {
                const state = testState[m.id];
                return (
                  <tr key={m.id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        {m.provider} · {m.model} · {m.apiKeyEnvVar}
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{m.priority}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(m)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          m.isActive
                            ? "bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]"
                            : "bg-[var(--color-line)] text-[var(--color-fg-muted)]"
                        }`}
                      >
                        {m.isActive ? l.active : l.inactive}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {m.isDefault ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-text)]">
                          <Star size={14} fill="currentColor" aria-hidden />
                          {l.default}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDefault(m.id)}
                          className="text-xs text-[var(--color-fg-placeholder)] underline-offset-2 hover:underline"
                        >
                          {l.setDefault}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => testConnection(m.id)}
                          className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"
                        >
                          {state?.status === "testing" && <Loader2 size={13} className="animate-spin" aria-hidden />}
                          {state?.status === "ok" && <CheckCircle2 size={13} className="text-green-500" aria-hidden />}
                          {state?.status === "fail" && <XCircle size={13} className="text-red-500" aria-hidden />}
                          {state?.status === "testing"
                            ? l.testing
                            : state?.status === "ok"
                              ? l.testOk
                              : state?.status === "fail"
                                ? l.testFail
                                : l.testConnection}
                        </button>
                        <button aria-label={l.edit} onClick={() => startEdit(m)} type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]">
                          <Pencil size={15} aria-hidden />
                        </button>
                        <button aria-label={l.delete} onClick={() => remove(m.id)} type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b91c1c] hover:bg-[var(--color-surface)] dark:text-[#f87171]">
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                      {state?.status === "fail" && state.message && (
                        <p className="mt-1 max-w-[260px] whitespace-normal break-words text-right text-xs text-[#b91c1c] dark:text-[#f87171]">
                          {state.message}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-bold">{l.usageTitle}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--color-line)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[var(--color-surface)] text-left text-[var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">{l.name}</th>
              <th className="px-4 py-3 font-semibold">{l.status}</th>
              <th className="px-4 py-3 font-semibold">{l.tokens}</th>
              <th className="px-4 py-3 font-semibold">{l.cost}</th>
              <th className="px-4 py-3 font-semibold">{l.responseTime}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-fg-muted)]">
                  {l.usageEmpty}
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3">{log.modelNameSnapshot ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      log.status === "success"
                        ? "bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]"
                        : log.status === "fallback"
                          ? "bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f] dark:text-[#fcd34d]"
                          : "bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fca5a5]"
                    }`}
                  >
                    {log.status}
                  </span>
                  {log.errorMessage && (
                    <p className="mt-1 max-w-xs whitespace-normal break-words text-xs text-[#b91c1c] dark:text-[#f87171]">
                      {log.errorMessage}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-fg-muted)]">
                  {log.inputTokens + log.outputTokens}
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-fg-muted)]">${log.costUsd.toFixed(4)}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-fg-muted)]">{log.responseTimeMs} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
