import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Rss } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { listPublishedDigests } from "@/lib/knowledge/digests";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Knowledge.digests");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function DigestsPage() {
  const t = await getTranslations("Knowledge.digests");
  const locale = (await getLocale()) as "uk" | "en";
  const digests = await listPublishedDigests(60);
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "");
  const period = (from: Date | null, to: Date | null) => (from && to ? `${fmt(from)} — ${fmt(to)}` : "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Reveal>
        <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
        <h1 className="mt-2">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>
      </Reveal>

      {digests.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-[var(--color-fg-muted)]">{t("empty")}</p>
      ) : (
        <ol className="mt-10 space-y-4">
          {digests.map((g, i) => (
            <Reveal as="li" key={g.id} delay={Math.min(i, 4) * 70}>
              <Link href={`/knowledge/digests/${g.slug}`} className="lift group grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                <div>
                  <p className="mono-label text-[var(--color-fg-placeholder)]">{fmt(g.publishedAt)}</p>
                  {period(g.periodFrom, g.periodTo) && <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{period(g.periodFrom, g.periodTo)}</p>}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl">{g.title}</h2>
                  {g.intro && <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{g.intro}</p>}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-text)]">
                  {t("read")} <ArrowRight size={14} aria-hidden className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      )}

      <div className="mt-12 flex flex-col gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Rss size={20} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-brand-text)]" />
          <div>
            <p className="font-semibold">{t("subscribeTitle")}</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("subscribeText")}</p>
          </div>
        </div>
        <Link href="/account/register" className="shrink-0 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">{t("subscribeButton")}</Link>
      </div>
    </div>
  );
}
