import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { ArrowLeft, ExternalLink, CheckCircle2, History, MessageSquareText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Markdown } from "@/components/ui/Markdown";
import { getDocument } from "@/lib/knowledge/documents";

type Params = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const res = await getDocument(slug);
  if (!res) return {};
  return { title: `${res.doc.number ? `${res.doc.number} — ` : ""}${res.doc.title}`, description: res.doc.summary.replace(/[#*_>`]/g, "").slice(0, 160), alternates: await alternatesFor(`/knowledge/documents/${slug}`) };
}

export default async function DocumentPage({ params }: Params) {
  const { slug } = await params;
  const res = await getDocument(slug);
  if (!res) notFound();
  const { doc, updates } = res;
  const t = await getTranslations("Knowledge.document");
  const tk = await getTranslations("Knowledge.kinds");
  const ts = await getTranslations("Knowledge.status");
  const locale = (await getLocale()) as "uk" | "en";
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "—");
  const keyPoints = Array.isArray(doc.keyPoints) ? (doc.keyPoints as string[]) : [];
  const tags = Array.isArray(doc.tags) ? (doc.tags as string[]) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Link href="/knowledge/documents" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)]">
        <ArrowLeft size={14} aria-hidden /> {t("back")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#ecfdf5] px-2 py-0.5 text-xs font-semibold text-[var(--color-brand-text)] dark:bg-white/10">{tk(doc.kind)}</span>
            {doc.number && <span className="mono-label text-[var(--color-fg-placeholder)]">{doc.number}</span>}
            <span className={`text-xs ${doc.status === "active" ? "text-[var(--color-fg-placeholder)]" : "text-amber-600 dark:text-amber-400"}`}>{ts(doc.status)}</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl">{doc.title}</h1>

          {keyPoints.length > 0 && (
            <section className="mt-8 rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface)] p-6">
              <p className="mono-label text-[var(--color-brand-text)]">{t("keyPoints")}</p>
              <ul className="mt-3 space-y-2">
                {keyPoints.map((k) => (
                  <li key={k} className="flex gap-2.5 text-sm">
                    <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <p className="mono-label text-[var(--color-brand-text)]">{t("summary")}</p>
            <Markdown source={doc.summary} />
          </section>

          <section className="mt-10">
            <p className="mono-label inline-flex items-center gap-1.5 text-[var(--color-brand-text)]"><History size={14} aria-hidden /> {t("updates")}</p>
            {updates.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{t("noUpdates")}</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l border-[var(--color-line)] pl-5">
                {updates.map((u) => (
                  <li key={u.id} className="relative">
                    <span aria-hidden className="absolute -left-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]" />
                    <p className="mono-label text-[var(--color-fg-placeholder)]">{fmt(u.date)}</p>
                    <p className="mt-1 text-sm">{u.note}</p>
                    {u.sourceUrl && (
                      <a href={u.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-brand-text)] hover:underline">
                        {t("sourceLink")} <ExternalLink size={11} aria-hidden />
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <p className="mt-10 max-w-3xl border-l-2 border-[var(--color-brand)] pl-5 text-sm text-[var(--color-fg-muted)]">{t("disclaimer")}</p>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <dl className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm">
            <div className="flex justify-between gap-3 py-1.5"><dt className="text-[var(--color-fg-muted)]">{t("issuer")}</dt><dd className="text-right font-medium">{doc.issuer ?? "—"}</dd></div>
            <div className="flex justify-between gap-3 border-t border-[var(--color-line)] py-1.5"><dt className="text-[var(--color-fg-muted)]">{t("adopted")}</dt><dd className="text-right font-medium">{fmt(doc.adoptedAt)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-[var(--color-line)] py-1.5"><dt className="text-[var(--color-fg-muted)]">{t("checkedAt")}</dt><dd className="text-right font-medium">{fmt(doc.checkedAt)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-[var(--color-line)] py-1.5"><dt className="text-[var(--color-fg-muted)]">{t("statusLabel")}</dt><dd className="text-right font-medium">{ts(doc.status)}</dd></div>
          </dl>
          {doc.sourceUrl && (
            <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-line)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-text)] transition hover:bg-[var(--color-surface)]">
              {t("openSource")} <ExternalLink size={14} aria-hidden />
            </a>
          )}
          <Link href={`/knowledge/ask?q=${encodeURIComponent(doc.number ? `${doc.number} ${doc.title}` : doc.title)}`} className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
            <MessageSquareText size={14} aria-hidden /> {t("askAbout")}
          </Link>
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag}>
                  <Link href={`/knowledge/documents?q=${encodeURIComponent(tag)}`} className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-fg-muted)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]">#{tag}</Link>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-xl border border-[var(--color-line)] p-5">
            <p className="font-semibold">{t("ctaTitle")}</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("ctaText")}</p>
            <Link href="/contacts" className="mt-3 inline-block text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("ctaButton")} →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
