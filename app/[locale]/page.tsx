import {
  Ruler,
  Calculator,
  FileCode2,
  Wrench,
  Users,
  Factory,
  Building2,
  Home as HomeIcon,
  Gauge,
  Timer,
  Receipt,
  ShieldCheck,
  ChevronDown,
  BatteryCharging,
  HandCoins,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Ticker } from "@/components/ui/Ticker";
import { SystemDiagram } from "@/components/ui/SystemDiagram";
import { EnergyField } from "@/components/ui/EnergyField";

const WHY_ICONS = [Gauge, Timer, Receipt, ShieldCheck];
/* Порядок збігається з HomePage.segments: громади, бізнес, ОСББ, девелопери, донори, власники */
const SEGMENT_ICONS = [Users, Factory, Building2, BatteryCharging, HandCoins, HomeIcon];
const COMPETENCY_ICONS = [Ruler, Calculator, FileCode2, Wrench];

export default function HomePage() {
  const t = useTranslations("HomePage");
  const tCommon = useTranslations("Common");

  const whyItems = t.raw("whyItems") as { title: string; text: string }[];
  const segments = t.raw("segments") as { href: string; title: string; text: string }[];
  const competencies = t.raw("competencies") as { n: string; title: string; text: string }[];
  const ticker = t.raw("ticker") as string[];
  const heroStats = t.raw("heroStats") as { value: string; label: string }[];

  return (
    <>
      {/* Hero — кінематографічний, повноекранний (референс: Tesla Megapack / SparkGrid) */}
      <section className="relative isolate flex flex-col overflow-hidden lg:min-h-[calc(100svh-4rem)] border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="hero" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-8 pt-14 sm:pt-16">
          <Reveal>
            <p className="mb-6 inline-flex items-center gap-2 self-start rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/70 px-4 py-1.5 text-sm backdrop-blur">
              <Ticker words={ticker} />
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="hero-title max-w-5xl">
              {t("heroTitlePrefix")}{" "}
              <span className="hero-highlight">{t("heroTitleHighlight")}</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg text-[var(--color-fg-muted)] sm:text-xl">
              {t("heroText")}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contacts"
                className="rounded-lg bg-[var(--color-brand)] px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-[var(--color-brand-hover)]"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/osbb"
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/70 px-7 py-3.5 font-semibold text-[var(--color-brand-text)] backdrop-blur transition hover:bg-[var(--color-surface)]"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Рядок показників — як технічна специфікація Megapack */}
        <Reveal delay={320}>
          <div className="relative mx-auto w-full max-w-6xl px-4 pb-7">
            <dl className="grid gap-5 border-t border-[var(--color-line)] pt-5 sm:grid-cols-3 sm:gap-8">
              {heroStats.map(({ value, label }) => (
                <div key={label} className="flex flex-col gap-2">
                  <dd className="stat-num text-[var(--color-fg)]">{value}</dd>
                  <dt className="text-sm text-[var(--color-fg-muted)]">{label}</dt>
                </div>
              ))}
            </dl>
            <p className="mono-label mt-3 text-[var(--color-fg-placeholder)]">{t("heroStatsSource")}</p>
          </div>
        </Reveal>

        <div
          aria-hidden="true"
          className="scroll-hint pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-[var(--color-fg-placeholder)] lg:block"
        >
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Чому електроенергія */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("whyLabel")}</p>
            <h2 className="mt-2">{t("whyTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
              {t("whyText")}
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map(({ title, text }, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <Reveal as="li" key={title} delay={i * 90}>
                  <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]"
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4">{title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                      {text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ul>

          <Reveal delay={380}>
            <p className="mt-8 max-w-3xl border-l-2 border-[var(--color-brand)] pl-5 text-[var(--color-fg-muted)]">
              {t("whyFooter")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Сегменти */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="mono-label text-[var(--color-brand-text)]">{t("segmentsLabel")}</p>
          <h2 className="mt-2">{t("segmentsTitle")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
            {t("segmentsText")}
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map(({ href, title, text }, i) => {
            const Icon = SEGMENT_ICONS[i];
            return (
              <Reveal as="li" key={href} delay={i * 90}>
                <Link
                  href={href}
                  className="lift group flex h-full flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ecfdf5] text-[var(--color-brand-text)] transition group-hover:bg-[var(--color-brand)] group-hover:text-white dark:bg-white/10"
                  >
                    <Icon size={24} />
                  </span>
                  <h3>{title}</h3>
                  <p className="text-sm text-[var(--color-fg-muted)]">{text}</p>
                  <span className="mt-auto pt-3 text-sm font-semibold text-[var(--color-brand-text)]">
                    {tCommon("detailsMore")}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Проблема */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">
              {t("competenciesLabel")}
            </p>
            <h2 className="mt-2">{t("competenciesTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
              {t("competenciesText")}
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {competencies.map(({ n, title, text }, i) => {
              const Icon = COMPETENCY_ICONS[i];
              return (
                <Reveal as="li" key={n} delay={i * 90}>
                  <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                    <div className="flex items-center justify-between">
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]"
                      >
                        <Icon size={20} />
                      </span>
                      <span
                        aria-hidden="true"
                        className="mono-label text-[var(--color-fg-placeholder)]"
                      >
                        {n}
                      </span>
                    </div>
                    <h3 className="mt-4">{title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                      {text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Схема системи */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="mono-label text-[var(--color-brand-text)]">{t("diagramLabel")}</p>
          <h2 className="mt-2">{t("diagramTitle")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
            {t("diagramText")}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-10">
            <SystemDiagram />
          </div>
        </Reveal>
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
