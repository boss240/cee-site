"use client";

import { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";

type Labels = {
  addNew: string;
  text: string;
  single: string;
  multi: string;
  nps: string;
  trigger: string;
  results: string;
  export: string;
};

type QType = "text" | "single" | "multi" | "nps";

type Question = { id: string; label: string; type: QType };

const SEED_QUESTIONS: Question[] = [
  { id: "q1", label: "Наскільки ймовірно ви порекомендуєте ЦЕЕ? (0–10)", type: "nps" },
  { id: "q2", label: "Що вам сподобалось найбільше?", type: "text" },
  { id: "q3", label: "Який розділ сайту був корисним?", type: "single" },
];

// DEMO: мок-відповіді для інтерактивної хмари слів і розподілу NPS.
const WORD_CLOUD = [
  { word: "швидко", weight: 9 },
  { word: "зрозуміло", weight: 7 },
  { word: "калькулятор", weight: 5 },
  { word: "програми", weight: 8 },
  { word: "підтримка", weight: 4 },
  { word: "ОСББ", weight: 6 },
  { word: "ціна", weight: 3 },
  { word: "СЕС", weight: 7 },
  { word: "чат", weight: 5 },
  { word: "зручно", weight: 6 },
  { word: "терміни", weight: 3 },
  { word: "документи", weight: 4 },
];

const NPS_DISTRIBUTION = [2, 1, 0, 1, 2, 3, 5, 9, 14, 20, 26]; // scores 0..10

export function SurveysManager({ labels: l }: { labels: Labels }) {
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<QType>("text");

  const typeLabel: Record<QType, string> = { text: l.text, single: l.single, multi: l.multi, nps: l.nps };

  const maxWeight = useMemo(() => Math.max(...WORD_CLOUD.map((w) => w.weight)), []);
  const npsTotal = useMemo(() => NPS_DISTRIBUTION.reduce((a, b) => a + b, 0), []);
  const maxNps = useMemo(() => Math.max(...NPS_DISTRIBUTION), []);

  function addQuestion() {
    if (!newLabel.trim()) return;
    setQuestions((q) => [...q, { id: `q${Date.now()}`, label: newLabel.trim(), type: newType }]);
    setNewLabel("");
  }

  function removeQuestion(id: string) {
    setQuestions((q) => q.filter((item) => item.id !== id));
  }

  function exportCsv() {
    const rows = [
      ["question", "type"],
      ...questions.map((q) => [q.label, q.type]),
      [],
      ["nps_score", "responses"],
      ...NPS_DISTRIBUTION.map((v, i) => [String(i), String(v)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "survey-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Конструктор */}
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Текст питання…"
            className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as QType)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          >
            <option value="text">{l.text}</option>
            <option value="single">{l.single}</option>
            <option value="multi">{l.multi}</option>
            <option value="nps">{l.nps}</option>
          </select>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            <Plus size={16} aria-hidden />
            {l.addNew}
          </button>
        </div>

        <ul className="mt-4 divide-y divide-[var(--color-line)]">
          {questions.map((q) => (
            <li key={q.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p>{q.label}</p>
                <p className="text-xs text-[var(--color-fg-muted)]">{typeLabel[q.type]}</p>
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="text-xs font-semibold text-[#b91c1c] dark:text-[#f87171]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Результати */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl">{l.results}</h2>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-semibold text-[var(--color-fg-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]"
          >
            <Download size={15} aria-hidden />
            {l.export}
          </button>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {/* NPS chart */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <p className="text-sm font-semibold">NPS ({npsTotal} відповідей)</p>
            <div className="mt-4 flex items-end gap-1.5" style={{ height: 120 }}>
              {NPS_DISTRIBUTION.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-[var(--color-brand)]"
                    style={{ height: `${(v / maxNps) * 100}%`, minHeight: 2 }}
                    title={`${i}: ${v}`}
                  />
                  <span className="text-[10px] text-[var(--color-fg-placeholder)]">{i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Інтерактивна хмара слів */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <p className="text-sm font-semibold">Хмара слів (відкриті відповіді)</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-3">
              {WORD_CLOUD.map((w) => {
                const size = 0.75 + (w.weight / maxWeight) * 1.15;
                const opacity = 0.55 + (w.weight / maxWeight) * 0.45;
                return (
                  <span
                    key={w.word}
                    title={`${w.word}: ${w.weight}`}
                    style={{ fontSize: `${size}rem`, opacity }}
                    className="cursor-default font-semibold text-[var(--color-brand-text)] transition hover:scale-110"
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
