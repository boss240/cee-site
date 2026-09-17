import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";
import { Users, Home, Zap, CheckCircle2, ChevronRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Placeholder.community");
  return { title: t("title"), description: t("hint") };
}

type Item = { title: string; text: string };

export default async function CommunityPage() {
  const t = await getTranslations("CommunityPage");
  const tCommon = await getTranslations("Common");

  const whyItems = t.raw("whyItems") as Item[];
  const objects = t.raw("objects") as Item[];

  return (
    <>
      {/* Герой */}
      <section className="relative isolate border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="hero" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Reveal>
            <p className="mono-label mb-4 text-[var(--color-brand-text)]">{t("heroLabel")}</p>
            <h1 className="hero-title max-w-4xl">{t("heroTitle")}</h1>
          </Reveal>

          <Reveal delay={80}>
            <p className="mt-6 max-w-2xl text-lg text-[var(--color-fg-muted)]">
              {t("heroText")}
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contacts"
                className="rounded-lg bg-[var(--color-brand)] px-7 py-3.5 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/about"
                className="rounded-lg border border-[var(--color-line)] px-7 py-3.5 font-semibold text-[var(--color-brand-text)] transition hover:bg-[var(--color-surface)]"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Чому для громади */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("whyLabel")}</p>
            <h2 className="mt-2">{t("whyTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
              {t("whyText")}
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item, i) => {
              const icons = [Users, Zap, Home];
              const Icon = icons[i % icons.length];
              return (
                <Reveal as="li" key={item.title} delay={i * 90}>
                  <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Типові об'єкти */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="mono-label text-[var(--color-brand-text)]">{t("objectsLabel")}</p>
          <h2 className="mt-2">{t("objectsTitle")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
            {t("objectsText")}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {objects.map((obj, i) => (
            <Reveal as="div" key={obj.title} delay={i * 90}>
              <Link
                href="/contacts"
                className="lift group flex h-full flex-col gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{obj.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{obj.text}</p>
                  </div>
                  <CheckCircle2 size={20} className="text-[var(--color-brand)] flex-shrink-0" />
                </div>
                <span className="text-sm font-semibold text-[var(--color-brand-text)]">
                  {tCommon("detailsMore")} <ChevronRight className="inline" size={16} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#070b12] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <EnergyField variant="band" forceDark />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#070b12_95%)]" />
            <div className="relative">
              <h2 className="text-white">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/90">
                {t("ctaText")}
              </p>
              <Link
                href="/contacts"
                className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-[var(--color-brand-dark)] transition hover:bg-[var(--color-surface)]"
              >
                {t("ctaPrimary")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
