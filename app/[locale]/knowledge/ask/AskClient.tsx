"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, SendHorizontal, Sparkles, FileText, LockKeyhole } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Markdown } from "@/components/ui/Markdown";

type Quota = { used: number; limit: number | null; remaining: number | null; plan: string };
type Citation = { slug: string; title: string; number: string | null; kind: string };
type Turn = { id: number; question: string; answer?: string; citations?: Citation[]; mode?: "ai" | "retrieval"; error?: "quota" | "burst" | "other" };

/** Замінює [slug] у відповіді на посилання на картку документа */
function linkify(answer: string, citations: Citation[], locale: string) {
  let out = answer;
  for (const c of citations) {
    const label = c.number ? `${c.number}` : c.title;
    out = out.replaceAll(`[${c.slug}]`, `[${label}](/${locale}/knowledge/documents/${c.slug})`);
  }
  return out;
}

export function AskClient({ initialQuestion = "" }: { initialQuestion?: string }) {
  const t = useTranslations("Knowledge.ask");
  const locale = useLocale() as "uk" | "en";
  const [question, setQuestion] = useState(initialQuestion);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const examples = t.raw("examples") as string[];

  useEffect(() => {
    fetch("/api/knowledge/usage")
      .then((r) => r.json())
      .then((d) => { setQuota(d); setSignedIn(Boolean(d.signedIn)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (turns.length) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length, busy]);

  async function submit(q?: string) {
    const text = (q ?? question).trim();
    if (text.length < 5 || busy) return;
    const id = Date.now();
    setTurns((prev) => [...prev, { id, question: text }]);
    setQuestion("");
    setBusy(true);
    try {
      const res = await fetch("/api/knowledge/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, locale }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.quota) setQuota(d.quota);
        if (typeof d.signedIn === "boolean") setSignedIn(d.signedIn);
        setTurns((prev) => prev.map((x) => (x.id === id ? { ...x, error: d.error === "quota" ? "quota" : d.error === "burst" ? "burst" : "other" } : x)));
      } else {
        setQuota(d.quota);
        setSignedIn(Boolean(d.signedIn));
        setTurns((prev) => prev.map((x) => (x.id === id ? { ...x, answer: d.answer, citations: d.citations, mode: d.mode } : x)));
      }
    } catch {
      setTurns((prev) => prev.map((x) => (x.id === id ? { ...x, error: "other" } : x)));
    } finally {
      setBusy(false);
    }
  }

  const exhausted = quota?.remaining !== null && quota?.remaining !== undefined && quota.remaining <= 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {/* Діалог */}
        <div className="space-y-6">
          {turns.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--color-line)] p-6">
              <p className="text-sm text-[var(--color-fg-muted)]">{t("examplesLabel")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <li key={ex}>
                    <button type="button" onClick={() => submit(ex)} className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-left text-sm transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]">
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {turns.map((turn) => (
            <div key={turn.id} className="space-y-3">
              <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-[var(--color-brand)] px-4 py-3 text-sm text-white sm:max-w-[75%]">{turn.question}</div>
              <div className="max-w-full rounded-2xl rounded-bl-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
                {!turn.answer && !turn.error && (
                  <p className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)]"><Loader2 size={14} className="animate-spin" aria-hidden /> {t("thinking")}</p>
                )}
                {turn.error === "quota" && (
                  <div className="text-sm">
                    <p className="inline-flex items-center gap-2 font-semibold"><LockKeyhole size={14} aria-hidden /> {t("quotaTitle")}</p>
                    <p className="mt-1 text-[var(--color-fg-muted)]">{signedIn ? t("quotaUser") : t("quotaGuest")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!signedIn && <Link href="/account/register" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-white">{t("register")}</Link>}
                      {!signedIn && <Link href="/account/login" className="rounded-lg border border-[var(--color-line)] px-4 py-2 font-semibold">{t("login")}</Link>}
                      <Link href="/knowledge/pricing" className={`rounded-lg px-4 py-2 font-semibold ${signedIn ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-line)]"}`}>{t("plans")}</Link>
                    </div>
                  </div>
                )}
                {turn.error === "burst" && <p className="text-sm text-[var(--color-fg-muted)]">{t("burst")}</p>}
                {turn.error === "other" && <p className="text-sm text-[var(--color-fg-muted)]">{t("error")}</p>}
                {turn.answer && (
                  <>
                    <div className="-mt-3 text-sm"><Markdown source={linkify(turn.answer, turn.citations ?? [], locale)} /></div>
                    {turn.citations && turn.citations.length > 0 && (
                      <div className="mt-4 border-t border-[var(--color-line)] pt-3">
                        <p className="mono-label text-[var(--color-fg-placeholder)]">{t("sources")}</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {turn.citations.map((c) => (
                            <li key={c.slug}>
                              <Link href={`/knowledge/documents/${c.slug}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-xs transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]">
                                <FileText size={12} aria-hidden /> {c.number ?? c.title.slice(0, 40)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-[var(--color-fg-placeholder)]">{turn.mode === "ai" ? t("modeAi") : t("modeRetrieval")}</p>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Форма */}
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3 sm:flex-row sm:items-end"
        >
          <label className="flex-1">
            <span className="sr-only">{t("inputLabel")}</span>
            <textarea
              id="ask-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={2}
              maxLength={1500}
              placeholder={exhausted ? t("placeholderExhausted") : t("placeholder")}
              disabled={busy || exhausted}
              className="w-full resize-none rounded-lg bg-transparent px-3 py-2 text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-placeholder)] disabled:opacity-60"
            />
          </label>
          <button
            type="submit"
            disabled={busy || exhausted || question.trim().length < 5}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <SendHorizontal size={16} aria-hidden />}
            {t("send")}
          </button>
        </form>
        <p className="mt-2 text-xs text-[var(--color-fg-placeholder)]">{t("hint")}</p>
      </div>

      {/* Бічна панель: ліміт і план */}
      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <p className="mono-label inline-flex items-center gap-1.5 text-[var(--color-brand-text)]"><Sparkles size={13} aria-hidden /> {t("quotaLabel")}</p>
          {quota ? (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {quota.limit === null ? "∞" : <>{quota.remaining}<span className="text-base font-normal text-[var(--color-fg-placeholder)]"> / {quota.limit}</span></>}
              </p>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{quota.limit === null ? t("quotaUnlimited") : t("quotaLeft")}</p>
              {quota.limit !== null && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-line)]">
                  <div className="h-full rounded-full bg-[var(--color-brand)] transition-all" style={{ width: `${Math.max(0, Math.min(100, ((quota.remaining ?? 0) / quota.limit) * 100))}%` }} />
                </div>
              )}
              <p className="mt-3 text-xs text-[var(--color-fg-placeholder)]">{t("planLabel")}: {t(`planNames.${quota.plan}`)}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-fg-muted)]">…</p>
          )}
        </div>
        {!signedIn ? (
          <div className="rounded-xl border border-[var(--color-brand)] p-5">
            <p className="font-semibold">{t("upsellGuestTitle")}</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("upsellGuestText")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/account/register" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white">{t("register")}</Link>
              <Link href="/account/login" className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold">{t("login")}</Link>
            </div>
          </div>
        ) : quota?.plan === "free" ? (
          <div className="rounded-xl border border-[var(--color-brand)] p-5">
            <p className="font-semibold">{t("upsellFreeTitle")}</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("upsellFreeText")}</p>
            <Link href="/knowledge/pricing" className="mt-3 inline-block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white">{t("plans")}</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-line)] p-5">
            <p className="font-semibold">{t("accountTitle")}</p>
            <Link href="/account" className="mt-2 inline-block text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("accountLink")} →</Link>
          </div>
        )}
        <p className="text-xs text-[var(--color-fg-placeholder)]">{t("disclaimer")}</p>
      </aside>
    </div>
  );
}
