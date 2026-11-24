"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, RotateCcw, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Помічник-провідник: кнопки замість тексту, без запитів до AI і без мережі.
 * Хто ви → 3 прості питання → відповідь простою мовою + схема + відео → заявка з відповідями.
 */
export type Audience = "osbb" | "business" | "home" | "community";
const AUDIENCES: Audience[] = ["osbb", "business", "home", "community"];
type Topic = "power" | "heat" | "water" | "general";

/** Перше питання визначає тему відповіді. Ключі варіантів — у AIAssistant.guide.flows.<audience>.questions.0.options */
const TOPIC_OF: Record<string, Topic> = { power: "power", outages: "power", bills: "power", heat: "heat", water: "water", unknown: "general" };
/** Пояснювальні ролики ~30 с: public/assets/guide-video/<audience>-<uk|en>.mp4 (+ .jpg обкладинка). */
/** Сегмент заявки — як у формі контактів */
export const SEGMENT_OF: Record<Audience, string> = { osbb: "osbb", business: "business", home: "citizen", community: "community" };

type Question = { q: string; options: Record<string, string> };

export function GuidedAdvisor({ onLead, disabled }: { onLead: (audience: Audience, summary: string) => void; disabled?: boolean }) {
  const t = useTranslations("AIAssistant.guide");
  const lang = useLocale() === "en" ? "en" : "uk";
  const [audience, setAudience] = useState<Audience | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  const btn = "rounded-full border border-[var(--color-line)] px-3 py-1.5 text-left text-xs font-medium text-[var(--color-fg)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)] disabled:opacity-50";
  const card = "w-full rounded-2xl rounded-bl-sm border border-[var(--color-line)] bg-[var(--color-bg)] p-3.5 text-sm";

  if (!audience) {
    return (
      <div className={card}>
        <p className="font-semibold">{t("who")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AUDIENCES.map((a) => (
            <button key={a} type="button" className={btn} onClick={() => setAudience(a)}>{t(`audiences.${a}`)}</button>
          ))}
        </div>
      </div>
    );
  }

  const questions = t.raw(`flows.${audience}.questions`) as Question[];
  const step = answers.length;

  if (step < questions.length) {
    const question = questions[step];
    return (
      <div className={card}>
        <p className="text-xs text-[var(--color-fg-muted)]">{t(`audiences.${audience}`)} · {t("step", { n: step + 1, total: questions.length })}</p>
        <p className="mt-1 font-semibold">{question.q}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(question.options).map(([key, label]) => (
            <button key={key} type="button" className={btn} onClick={() => setAnswers((x) => [...x, key])}>{label}</button>
          ))}
        </div>
        <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)]"
          onClick={() => (step === 0 ? setAudience(null) : setAnswers((x) => x.slice(0, -1)))}>
          <ArrowLeft size={12} aria-hidden /> {t("back")}
        </button>
      </div>
    );
  }

  const main = answers[0];
  const topic = TOPIC_OF[main] ?? "general";
  const result = t.raw(`flows.${audience}.results.${main}`) as { do: string[]; prepare: string[]; first: string };
  const diagram = t.raw(`diagrams.${topic}`) as string[];
  const video = `/assets/guide-video/${audience}-${lang}`;
  const summary = [
    `${t("summaryAudience")}: ${t(`audiences.${audience}`)}`,
    ...questions.map((q, i) => `${q.q} — ${q.options[answers[i]]}`),
  ].join("\n");

  return (
    <div className={card}>
      <p className="text-xs text-[var(--color-fg-muted)]">{t(`audiences.${audience}`)}</p>
      <p className="mt-1 font-semibold">{t("resultTitle")}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4">{result.do.map((x) => <li key={x}>{x}</li>)}</ul>

      <p className="mt-3 font-semibold">{t("diagramTitle")}</p>
      <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs" aria-label={t("diagramTitle")}>
        {diagram.map((node, i) => (
          <li key={node} className="flex items-center gap-1">
            <span className="rounded-lg border border-[var(--color-brand)] bg-[var(--color-surface)] px-2 py-1">{node}</span>
            {i < diagram.length - 1 && <ArrowRight size={12} aria-hidden className="text-[var(--color-fg-muted)]" />}
          </li>
        ))}
      </ol>

      <p className="mt-3 font-semibold">{t("prepareTitle")}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4">{result.prepare.map((x) => <li key={x}>{x}</li>)}</ul>

      <p className="mt-3 font-semibold">{t("firstStepTitle")}</p>
      <p className="mt-1">{result.first}</p>

      <video className="mt-3 w-full rounded-lg border border-[var(--color-line)]" controls muted playsInline preload="none"
        poster={`${video}.jpg`} aria-label={t("videoLabel")}>
        <source src={`${video}.mp4`} type="video/mp4" />
      </video>

      <p className="mt-3 text-xs text-[var(--color-fg-muted)]">{t("note")}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" disabled={disabled} onClick={() => onLead(audience, summary)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
          <UserRound size={12} aria-hidden /> {t("lead")}
        </button>
        <Link href="/calculators" className={btn}>{t("calculators")}</Link>
        <button type="button" className={`${btn} inline-flex items-center gap-1`} onClick={() => { setAudience(null); setAnswers([]); }}>
          <RotateCcw size={12} aria-hidden /> {t("restart")}
        </button>
      </div>
    </div>
  );
}
