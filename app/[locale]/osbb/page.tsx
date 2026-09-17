import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPrograms } from "@/lib/programs";
import { ProgramCard } from "@/components/ui/ProgramCard";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OsbbPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function OsbbPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "OsbbPage" });
  const whyItems = t.raw("whyItems") as { title: string; text: string }[];
  const steps = t.raw("steps") as { title: string; text: string }[];
  const reminders = t.raw("reminders") as string[];
  const programs = getPrograms(locale as "uk" | "en");

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="band" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <h1>{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--color-fg-muted)]">
            {t("intro")}
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Reveal>
            <h2 className="text-2xl">{t("whyTitle")}</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {whyItems.map((item) => (
                <div key={item.title}>
                  <dt className="font-semibold">{item.title}</dt>
                  <dd className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    {item.text}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2>{t("programsTitle")}</h2>
        <p className="mt-3 max-w-2xl text-[var(--color-fg-muted)]">
          {t("programsText")}
        </p>

        <div className="mt-8 space-y-8">
          {programs.map((program, i) => (
            <Reveal key={program.id} delay={i * 80}>
              <ProgramCard program={program} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2>{t("stepsTitle")}</h2>
          <p className="mt-3 max-w-2xl text-[var(--color-fg-muted)]">
            {t("stepsText")}
          </p>

          <ol className="mt-8 space-y-5">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 80} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg">{step.title}</h3>
                  <p className="mt-1 text-[var(--color-fg-muted)]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-14">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
          <h2 className="text-xl">{t("remindersTitle")}</h2>
          <ul className="mt-4 space-y-2.5 text-[var(--color-fg-muted)]">
            {reminders.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-2xl bg-[var(--color-brand-dark)] px-6 py-12 text-center text-white sm:px-12">
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
      </section>
    </>
  );
}
