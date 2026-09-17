import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CircleDot, Handshake, CheckCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";

type Product = { name: string; task: string; results: string[] };
type Format = { title: string; text: string; main?: boolean };
type WindowItem = { title: string; text: string };

const WINDOW_ICONS = [CircleDot, Handshake, CheckCheck];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ServicesPage");
  return { title: t("heroTitle"), description: t("heroText") };
}

export default async function ServicesPage() {
  const t = await getTranslations("ServicesPage");

  const windowItems = t.raw("window") as WindowItem[];
  const formats = t.raw("formats") as Format[];
  const products = t.raw("products") as Product[];

  return (
    <>
      {/* Герой — обіцянка результату */}
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
            <Link
              href="/contacts"
              className="mt-8 inline-block rounded-lg bg-[var(--color-brand)] px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-[var(--color-brand-hover)]"
            >
              {t("ctaPrimary")}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Одне вікно */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("windowLabel")}</p>
            <h2 className="mt-2">{t("windowTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("windowText")}</p>
          </Reveal>

          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {windowItems.map((item, i) => {
              const Icon = WINDOW_ICONS[i] ?? CircleDot;
              return (
                <Reveal as="li" key={item.title} delay={i * 90}>
                  <div className="lift h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]"
                    >
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

      {/* Формати співпраці — глибина залучення зростає донизу */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="mono-label text-[var(--color-brand-text)]">{t("formatsLabel")}</p>
          <h2 className="mt-2">{t("formatsTitle")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("formatsText")}</p>
        </Reveal>

        <ol className="mt-10 space-y-3">
          {formats.map((format, i) => (
            <Reveal as="li" key={format.title} delay={i * 70}>
              <div
                className={`lift flex flex-col gap-3 rounded-xl border bg-[var(--color-bg)] p-5 sm:flex-row sm:items-center sm:gap-6 ${
                  format.main
                    ? "border-[var(--color-brand)] shadow-lg shadow-emerald-900/10"
                    : "border-[var(--color-line)]"
                }`}
              >
                {/* Глибина залучення: i+1 із загальної кількості форматів */}
                <div aria-hidden="true" className="flex h-7 shrink-0 items-end gap-1">
                  {formats.map((_, bar) => (
                    <span
                      key={bar}
                      className={`w-1.5 rounded-sm ${
                        bar <= i ? "bg-[var(--color-brand)]" : "bg-[var(--color-line)]"
                      }`}
                      style={{ height: `${8 + bar * 5}px` }}
                    />
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-semibold">{format.title}</h3>
                    {format.main ? (
                      <span className="mono-label rounded-full bg-[var(--color-brand)] px-2.5 py-0.5 text-white">
                        {t("formatsBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{format.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Вісім блоків усередині роботи */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("productsLabel")}</p>
            <h2 className="mt-2">{t("productsTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("productsText")}</p>
          </Reveal>

          <ul className="mt-10 grid gap-5 lg:grid-cols-2">
            {products.map((product, i) => (
              <Reveal as="li" key={product.name} delay={(i % 2) * 90}>
                <article className="lift flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-[var(--color-fg)]">{product.name}</h3>
                    <span aria-hidden="true" className="mono-label text-[var(--color-fg-placeholder)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{product.task}</p>

                  <div className="mt-5 border-t border-[var(--color-line)] pt-4">
                    <p className="mono-label text-[var(--color-brand-text)]">{t("resultLabel")}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {product.results.map((result) => (
                        <li
                          key={result}
                          className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-fg-muted)]"
                        >
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <p className="mt-8 max-w-3xl border-l-2 border-[var(--color-brand)] pl-5 text-sm text-[var(--color-fg-muted)]">
              {t("priceNote")}
            </p>
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
