import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";

type Props = { params: Promise<{ locale: string }> };

/** Статична сторінка, ISR: оновлення раз на 10 хв */
export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AboutPage");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/about") };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const principles = t.raw("principles") as { title: string; text: string }[];
  const channels = t.raw("channels") as { title: string; text: string }[];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="band" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
          <h1 className="mt-3">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--color-fg-muted)]">
            {t("intro")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <h2>{t("principlesTitle")}</h2>
        </Reveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 80}>
              <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                <h3>{p.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                  {p.text}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <Reveal>
            <h2>{t("channelsTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
              {t("channelsText")}
            </p>
          </Reveal>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {channels.map((c) => (
              <div key={c.title}>
                <dt className="font-semibold">{c.title}</dt>
                <dd className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {c.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#070b12] px-6 py-14 text-center text-white sm:px-12">
            <EnergyField variant="band" forceDark />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#070b12_95%)]" />
            <div className="relative">
              <h2 className="text-white">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/90">
                {t("ctaText")}
              </p>
              <Link
                href="/contacts"
                className="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-[var(--color-brand-dark)] transition hover:bg-[var(--color-surface)]"
              >
                {t("ctaButton")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
