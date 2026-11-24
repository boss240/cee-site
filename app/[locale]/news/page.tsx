// Свіжість опублікованих матеріалів — як і раніше на сторінках блогу й дайджестів.
export const revalidate = 600;

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { alternatesFor } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { TelegramChannel } from "@/components/ui/TelegramChannel";
import { listPublishedDigests, type DigestKind } from "@/lib/knowledge/digests";
import { listPublishedPosts } from "@/lib/blog/queries";

type NewsType = "all" | "articles" | "digests";
type Item = { key: string; href: string; date: Date | null; title: string; text: string | null; tag: string; uk: boolean };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NewsPage");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/news") };
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ type?: string; kind?: string }> }) {
  const { type: typeParam, kind: kindParam } = await searchParams;
  const type: NewsType = typeParam === "articles" || typeParam === "digests" ? typeParam : "all";
  const kind: DigestKind | undefined = kindParam === "local" ? "local" : kindParam === "energy" ? "energy" : undefined;
  const t = await getTranslations("NewsPage");
  const locale = (await getLocale()) as "uk" | "en";

  const [digests, posts] = await Promise.all([
    type === "articles" ? Promise.resolve([]) : listPublishedDigests(60, kind).catch(() => []),
    type === "digests" ? Promise.resolve([]) : listPublishedPosts(locale).catch(() => []),
  ]);

  const items: Item[] = [
    ...digests.map((g) => ({
      key: `d-${g.id}`, href: `/knowledge/digests/${g.slug}`, date: g.publishedAt, title: g.title, text: g.intro,
      tag: g.kind === "local" ? t("tagLocal") : t("tagDigest"), uk: locale === "en",
    })),
    ...posts.map((p) => ({
      key: `p-${p.slug}`, href: `/blog/${p.slug}`, date: p.publishedAt, title: p.title, text: p.excerpt,
      tag: p.tag || t("tagArticle"), uk: Boolean(p.untranslated),
    })),
  ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "");
  const tabs: { id: NewsType; href: string }[] = [
    { id: "all", href: "/news" },
    { id: "articles", href: "/news?type=articles" },
    { id: "digests", href: "/news?type=digests" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Reveal>
        <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
        <h1 className="mt-2">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>
      </Reveal>

      <nav aria-label={t("filtersAria")} className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href} aria-current={type === tab.id ? "page" : undefined}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${type === tab.id ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"}`}>
            {t(`filters.${tab.id}`)}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-[var(--color-fg-muted)]">{t("empty")}</p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal as="li" key={item.key} delay={(i % 3) * 80}>
              <Link href={item.href} className="lift group flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="mono-label text-[var(--color-brand-text)]">{item.tag}</span>
                  <span className="text-xs text-[var(--color-fg-placeholder)]">{fmt(item.date)}</span>
                </div>
                <h2 className="mt-4 text-xl" lang={item.uk ? "uk" : undefined}>{item.title}</h2>
                {item.text && <p className="mt-2 flex-1 text-sm text-[var(--color-fg-muted)]" lang={item.uk ? "uk" : undefined}>{item.text}</p>}
                {item.uk && <span className="mt-2 text-xs text-[var(--color-fg-muted)]">{t("inUkrainian")}</span>}
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-text)]">
                  {t("read")} <ArrowRight size={14} aria-hidden className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}

      <div className="mt-12"><TelegramChannel /></div>
    </div>
  );
}
