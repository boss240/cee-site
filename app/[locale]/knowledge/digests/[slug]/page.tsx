import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Markdown } from "@/components/ui/Markdown";
import { getDigest } from "@/lib/knowledge/digests";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDigest(slug);
  if (!d) return {};
  return { title: d.title, description: d.intro };
}

export default async function DigestPage({ params }: Params) {
  const { slug } = await params;
  const d = await getDigest(slug);
  if (!d) notFound();
  const t = await getTranslations("Knowledge.digests");
  const locale = (await getLocale()) as "uk" | "en";
  const fmt = (x: Date | null) => (x ? new Date(x).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <Link href="/knowledge/digests" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)]">
        <ArrowLeft size={14} aria-hidden /> {t("back")}
      </Link>
      <p className="mono-label mt-6 text-[var(--color-fg-placeholder)]">
        {fmt(d.publishedAt)}
        {d.periodFrom && d.periodTo ? ` · ${t("period")}: ${fmt(d.periodFrom)} — ${fmt(d.periodTo)}` : ""}
      </p>
      <h1 className="mt-3 text-3xl sm:text-4xl">{d.title}</h1>
      {d.intro && <p className="mt-5 text-lg text-[var(--color-fg-muted)]">{d.intro}</p>}
      <div className="mt-8 border-t border-[var(--color-line)] pt-2">
        <Markdown source={d.body} />
      </div>
      <p className="mt-10 border-l-2 border-[var(--color-brand)] pl-5 text-sm text-[var(--color-fg-muted)]">{t("disclaimer")}</p>
      <div className="mt-10 rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface)] p-6">
        <p className="font-semibold">{t("ctaTitle")}</p>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("ctaText")}</p>
        <Link href="/knowledge/ask" className="mt-4 inline-block rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">{t("ctaButton")}</Link>
      </div>
    </article>
  );
}
