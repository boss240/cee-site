import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Markdown } from "@/components/ui/Markdown";
import { getPublishedPost } from "@/lib/blog/queries";

type Params = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getPublishedPost(slug, locale === "en" ? "en" : "uk");
  if (!post) return {};
  return { title: post.title, description: post.excerpt, alternates: await alternatesFor(`/blog/${slug}`) };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const locale = (await getLocale()) as "uk" | "en";
  const t = await getTranslations("BlogPage");
  const post = await getPublishedPost(slug, locale);
  if (!post) notFound();

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)]">
        <ArrowLeft size={14} aria-hidden /> {t("backToList")}
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1">
        {post.tag && <span className="mono-label text-[var(--color-brand-text)]">{post.tag}</span>}
        {date && <span className="text-sm text-[var(--color-fg-placeholder)]">{date}</span>}
      </div>
      <h1 className="mt-3">{post.title}</h1>
      <p className="mt-5 text-lg text-[var(--color-fg-muted)]">{post.excerpt}</p>
      <div className="mt-8 border-t border-[var(--color-line)] pt-2">
        <Markdown source={post.body} />
      </div>

      <div className="mt-14 rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface)] p-6">
        <p className="font-semibold">{t("ctaTitle")}</p>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("ctaText")}</p>
        <Link href="/contacts" className="mt-4 inline-block rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
          {t("ctaButton")}
        </Link>
      </div>
    </article>
  );
}
