import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { Search, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { DOC_KINDS, searchDocuments } from "@/lib/knowledge/documents";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Knowledge.documents");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/knowledge/documents") };
}

type Props = { searchParams: Promise<{ q?: string; kind?: string }> };

export default async function DocumentsPage({ searchParams }: Props) {
  const { q = "", kind = "" } = await searchParams;
  const t = await getTranslations("Knowledge.documents");
  const tk = await getTranslations("Knowledge.kinds");
  const ts = await getTranslations("Knowledge.status");
  const locale = (await getLocale()) as "uk" | "en";
  const docs = await searchDocuments({ q, kind, limit: 100 });
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "short", year: "numeric" }) : "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Reveal>
        <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
        <h1 className="mt-2">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>
      </Reveal>

      <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row" role="search">
        <label className="relative flex-1">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-fg-placeholder)]" />
          <input
            id="doc-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-[var(--color-fg)] transition focus:border-[var(--color-brand-dark)] focus:bg-[var(--color-bg)]"
          />
        </label>
        <select
          id="doc-kind"
          name="kind"
          defaultValue={kind}
          aria-label={t("kindLabel")}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-fg)]"
        >
          <option value="">{t("allKinds")}</option>
          {DOC_KINDS.map((k) => (
            <option key={k} value={k}>{tk(k)}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
          {t("searchButton")}
        </button>
      </form>

      <p className="mt-4 text-sm text-[var(--color-fg-placeholder)]">
        {docs.length === 0 ? t("none") : t("found", { n: docs.length })}
        {(q || kind) && (
          <>
            {" · "}
            <Link href="/knowledge/documents" className="text-[var(--color-brand-text)] hover:underline">{t("reset")}</Link>
          </>
        )}
      </p>

      {docs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-[var(--color-fg-muted)]">
          <p>{t("emptyHint")}</p>
          <Link href="/knowledge/ask" className="mt-3 inline-block text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("askInstead")} →</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {docs.map((d, i) => {
            const tags = Array.isArray(d.tags) ? (d.tags as string[]) : [];
            return (
              <Reveal as="li" key={d.id} delay={(i % 2) * 60}>
                <article className="lift flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#ecfdf5] px-2 py-0.5 text-xs font-semibold text-[var(--color-brand-text)] dark:bg-white/10">{tk(d.kind)}</span>
                    {d.number && <span className="mono-label text-[var(--color-fg-placeholder)]">{d.number}</span>}
                    <span className={`ml-auto text-xs ${d.status === "active" ? "text-[var(--color-fg-placeholder)]" : "text-amber-600 dark:text-amber-400"}`}>{ts(d.status)}</span>
                  </div>
                  <h2 className="mt-3 text-lg leading-snug">
                    <Link href={`/knowledge/documents/${d.slug}`} className="hover:text-[var(--color-brand-text)]">{d.title}</Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--color-fg-muted)]">{d.summary.replace(/[#*_>`]/g, "").slice(0, 260)}</p>
                  {tags.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {tags.slice(0, 5).map((tag) => (
                        <li key={tag}>
                          <Link href={`/knowledge/documents?q=${encodeURIComponent(tag)}`} className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-fg-muted)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]">#{tag}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-fg-placeholder)]">
                    <span>{d.issuer ?? ""}{d.checkedAt ? ` · ${t("checked")} ${fmt(d.checkedAt)}` : ""}</span>
                    {d.sourceUrl && (
                      <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--color-brand-text)] hover:underline">
                        {t("source")} <ExternalLink size={12} aria-hidden />
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      )}

      <p className="mt-10 max-w-3xl border-l-2 border-[var(--color-brand)] pl-5 text-sm text-[var(--color-fg-muted)]">{t("disclaimer")}</p>
    </div>
  );
}
