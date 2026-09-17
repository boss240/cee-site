import { getTranslations } from "next-intl/server";

type Section = { title: string; paragraphs: string[]; items?: string[] };

/** Юридична сторінка: заголовок, дата, розділи з абзацами й переліками. */
export async function LegalPage({ namespace }: { namespace: "PrivacyPage" | "TermsPage" }) {
  const t = await getTranslations(namespace);
  const sections = t.raw("sections") as Section[];

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h1 className="mt-2">{t("title")}</h1>
      <p className="mt-3 text-sm text-[var(--color-fg-placeholder)]">{t("updated")}</p>
      <p className="mt-6 text-[var(--color-fg-muted)]">{t("intro")}</p>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="text-xl">
              <span className="mono-label mr-3 text-[var(--color-fg-placeholder)]">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="mt-3 text-[var(--color-fg-muted)]">
                {p}
              </p>
            ))}
            {s.items && (
              <ul className="mt-3 space-y-1.5 pl-5 text-[var(--color-fg-muted)]">
                {s.items.map((it) => (
                  <li key={it} className="list-disc">
                    {it}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-12 border-l-2 border-[var(--color-brand)] pl-5 text-sm text-[var(--color-fg-muted)]">{t("contact")}</p>
    </article>
  );
}
