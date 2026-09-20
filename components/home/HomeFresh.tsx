import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { listPublishedDigests } from "@/lib/knowledge/digests";
import { listPublishedPosts } from "@/lib/blog/queries";

/** Блок «Свіже» на головній: останні дайджести (енергетика + місцеві) і статті блогу. Без БД — блок просто не показується. */
export async function HomeFresh({ locale }: { locale: string }) {
  const t = await getTranslations("HomePage");
  const [energy, local, posts] = await Promise.all([
    listPublishedDigests(2, "energy"),
    listPublishedDigests(2, "local"),
    listPublishedPosts(locale as "uk" | "en").then((p) => p.slice(0, 3)).catch(() => []),
  ]);
  const digests = [...local, ...energy].slice(0, 3);
  if (digests.length === 0 && posts.length === 0) return null;
  const fmt = (d: Date | null | undefined) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "short", year: "numeric" }) : "");

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <p className="mono-label text-[var(--color-brand-text)]">{t("freshLabel")}</p>
        <h2 className="mt-2">{t("freshTitle")}</h2>
      </Reveal>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl">{t("freshNews")}</h3>
            <Link href="/knowledge/digests" className="text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("freshAll")} →</Link>
          </div>
          <ul className="mt-4 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
            {digests.length === 0 && <li className="p-5 text-sm text-[var(--color-fg-muted)]">{t("freshNoNews")}</li>}
            {digests.map((g) => (
              <li key={g.id}>
                <Link href={`/knowledge/digests/${g.slug}`} className="flex flex-col gap-1 px-5 py-4 transition hover:bg-[var(--color-surface)]">
                  <span className="mono-label text-[var(--color-fg-placeholder)]">{g.kind === "local" ? t("freshLocalTag") : t("freshEnergyTag")} · {fmt(g.publishedAt)}</span>
                  <span className="font-semibold">{g.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={90}>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl">{t("freshBlog")}</h3>
            <Link href="/blog" className="text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("freshAll")} →</Link>
          </div>
          <ul className="mt-4 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
            {posts.length === 0 && <li className="p-5 text-sm text-[var(--color-fg-muted)]">{t("freshNoPosts")}</li>}
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex flex-col gap-1 px-5 py-4 transition hover:bg-[var(--color-surface)]">
                  <span className="mono-label text-[var(--color-fg-placeholder)]">{fmt(p.publishedAt)}</span>
                  <span className="font-semibold">{p.title}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-brand-text)]">{t("freshRead")} <ArrowRight size={14} aria-hidden className="transition group-hover:translate-x-0.5" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
