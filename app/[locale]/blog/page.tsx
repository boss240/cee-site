import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { listPublishedPosts } from "@/lib/blog/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("BlogPage");
  return { title: t("title"), description: t("intro"), alternates: await alternatesFor("/blog") };
}

function fmt(d: Date | null, locale: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const t = await getTranslations("BlogPage");
  const locale = (await getLocale()) as "uk" | "en";
  const posts = await listPublishedPosts(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h1 className="mt-2">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-[var(--color-fg-muted)]">{t("empty")}</p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 3) * 80}>
              <Link href={`/blog/${p.slug}`} className="lift group flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                <div className="flex items-center justify-between gap-3">
                  {p.tag ? <span className="mono-label text-[var(--color-brand-text)]">{p.tag}</span> : <span />}
                  <span className="text-xs text-[var(--color-fg-placeholder)]">{fmt(p.publishedAt, locale)}</span>
                </div>
                <h2 className="mt-4 text-xl">{p.title}</h2>
                <p className="mt-2 flex-1 text-sm text-[var(--color-fg-muted)]">{p.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-text)]">
                  {t("read")} <ArrowRight size={14} aria-hidden className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
