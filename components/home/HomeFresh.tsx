import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { listPublishedDigests } from "@/lib/knowledge/digests";
import { listPublishedPosts } from "@/lib/blog/queries";

/** Блок «Новини і статті» на головній: одна стрічка з останніх статей і дайджестів. Порожньо — блок не показується. */
export async function HomeFresh({ locale }: { locale: string }) {
  const t = await getTranslations("HomePage");
  const tNews = await getTranslations("NewsPage");
  const [digests, posts] = await Promise.all([
    listPublishedDigests(4).catch(() => []),
    listPublishedPosts(locale as "uk" | "en").catch(() => []),
  ]);
  const items = [
    ...digests.map((g) => ({ key: `d-${g.id}`, href: `/knowledge/digests/${g.slug}`, date: g.publishedAt, title: g.title, tag: g.kind === "local" ? tNews("tagLocal") : tNews("tagDigest"), uk: locale === "en" })),
    ...posts.slice(0, 4).map((p) => ({ key: `p-${p.slug}`, href: `/blog/${p.slug}`, date: p.publishedAt, title: p.title, tag: p.tag || tNews("tagArticle"), uk: Boolean(p.untranslated) })),
  ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)).slice(0, 4);
  if (items.length === 0) return null;
  const fmt = (d: Date | null | undefined) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "short", year: "numeric" }) : "");

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="mono-label text-[var(--color-brand-text)]">{t("freshLabel")}</p>
            <h2 className="mt-2">{t("freshTitle")}</h2>
          </div>
          <Link href="/news" className="text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("freshAll")} →</Link>
        </div>
      </Reveal>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {items.map((item, i) => (
          <Reveal as="li" key={item.key} delay={(i % 2) * 80}>
            <Link href={item.href} className="lift group flex h-full flex-col gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-4">
              <span className="mono-label text-[var(--color-fg-placeholder)]">{item.tag} · {fmt(item.date)}</span>
              <span className="font-semibold" lang={item.uk ? "uk" : undefined}>{item.title}</span>
              {item.uk && <span className="text-xs text-[var(--color-fg-muted)]">{tNews("inUkrainian")}</span>}
              <span className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-brand-text)]">{t("freshRead")} <ArrowRight size={14} aria-hidden className="transition group-hover:translate-x-0.5" /></span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
