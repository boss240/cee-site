import type { LucideIcon } from "lucide-react";
import { ShieldCheck, SlidersHorizontal, Scale, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";
import { BridgeDiagram } from "@/components/ui/BridgeDiagram";

type Pier = { label: string; items: string[] };
type Bridge = { from: Pier; center: Pier; to: Pier };
type Guarantee = { title: string; text: string };
type Block = { name: string; text: string };

const GUARANTEE_ICONS = [ShieldCheck, SlidersHorizontal, Scale];

type Props = {
  /** Простір імен у messages: DevelopersPage | DonorsPage */
  namespace: "DevelopersPage" | "DonorsPage";
  /** Іконки трьох опор містка: звідки → Центр → куди */
  icons: { from: LucideIcon; center: LucideIcon; to: LucideIcon };
};

/**
 * Сторінка напряму, побудована навколо «містка»:
 * Центр між тим, хто дає кошти й рішення, і тим, що є на місці.
 * Використовується для девелоперів та донорів — один каркас, різний зміст.
 */
export async function AudienceBridgePage({ namespace, icons }: Props) {
  const t = await getTranslations(namespace);

  const bridge = t.raw("bridge") as Bridge;
  const guarantees = t.raw("guarantees") as Guarantee[];
  const blocks = t.raw("blocks") as Block[];

  return (
    <>
      {/* Герой */}
      <section className="relative isolate overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="hero" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("heroLabel")}</p>
            <h1 className="hero-title mt-3 max-w-4xl">{t("heroTitle")}</h1>
          </Reveal>

          <Reveal delay={90}>
            <p className="mt-6 max-w-2xl text-lg text-[var(--color-fg-muted)]">{t("heroText")}</p>
          </Reveal>

          <Reveal delay={170}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contacts"
                className="rounded-lg bg-[var(--color-brand)] px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-[var(--color-brand-hover)]"
              >
                {t("ctaPrimary")}
              </Link>
              <a
                href="#blocks"
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/70 px-7 py-3.5 font-semibold text-[var(--color-brand-text)] backdrop-blur transition hover:bg-[var(--color-surface)]"
              >
                {t("ctaSecondary")}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Місток */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("bridgeLabel")}</p>
            <h2 className="mt-2">{t("bridgeTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("bridgeText")}</p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10">
              <BridgeDiagram
                from={{ ...bridge.from, icon: icons.from }}
                center={{ ...bridge.center, icon: icons.center }}
                to={{ ...bridge.to, icon: icons.to }}
                backLabel={t("bridgeBack")}
                footer={t("bridgeFooter")}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Три гарантії */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="mono-label text-[var(--color-brand-text)]">{t("guaranteesLabel")}</p>
          <h2 className="mt-2">{t("guaranteesTitle")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("guaranteesText")}</p>
        </Reveal>

        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {guarantees.map((g, i) => {
            const Icon = GUARANTEE_ICONS[i] ?? ShieldCheck;
            return (
              <Reveal as="li" key={g.title} delay={i * 90}>
                <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                  <div className="flex items-center justify-between">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]"
                    >
                      <Icon size={20} />
                    </span>
                    <span aria-hidden="true" className="mono-label text-[var(--color-fg-placeholder)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4">{g.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{g.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Блоки роботи під напрям */}
      <section id="blocks" className="scroll-mt-20 border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("blocksLabel")}</p>
            <h2 className="mt-2">{t("blocksTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("blocksText")}</p>
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {blocks.map((b, i) => (
              <Reveal as="li" key={b.name} delay={(i % 2) * 90}>
                <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                  <h3 className="text-base font-semibold">{b.name}</h3>
                  <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={200}>
            <Link
              href="/services"
              className="underline-grow mt-8 inline-flex items-center gap-1.5 font-semibold text-[var(--color-brand-text)]"
            >
              {t("blocksLink")}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#070b12] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <EnergyField variant="band" forceDark />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#070b12_95%)]"
            />
            <div className="relative">
              <h2 className="text-white">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/90">{t("ctaText")}</p>
              <Link
                href="/contacts"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-[var(--color-brand-dark)] transition hover:bg-[var(--color-surface)]"
              >
                {t("ctaPrimary")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
