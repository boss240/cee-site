import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, ArrowRight } from "lucide-react";
import { alternatesFor } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { EnergyField } from "@/components/ui/EnergyField";
import { PLANS } from "@/lib/knowledge/plans";

type Props = { params: Promise<{ locale: string }> };
type Plan = { slug: string; name: string; for: string; period: string; includes: string[]; price: string };
type KbPlan = { name: string; price: string; text: string };
type Step = { title: string; text: string };
type Faq = { q: string; a: string };

export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Subscriptions");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/subscriptions") };
}

export default async function SubscriptionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Subscriptions");
  const plans = t.raw("plans") as Plan[];
  const kbPlans = t.raw("kbPlans") as KbPlan[];
  const steps = t.raw("steps") as Step[];
  const faq = t.raw("faq") as Faq[];
  const vars = { guest: String(PLANS.guest.dailyAsk ?? 0), free: String(PLANS.free.dailyAsk ?? 0) };
  const fill = (s: string) => s.replace("{free}", vars.free).replace("{guest}", vars.guest);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="band" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
          <h1 className="mt-2">{t("title")}</h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--color-fg-muted)]">{t("intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="mono-label text-[var(--color-brand-text)]">{t("servicesLabel")}</p>
        <h2 className="mt-2">{t("servicesTitle")}</h2>
        <p className="mt-3 max-w-3xl text-[var(--color-fg-muted)]">{t("servicesText")}</p>
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <li key={p.slug} className="flex flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
              <h3 className="text-xl">{p.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{p.for}</p>
              <p className="mt-3 text-lg font-bold text-[var(--color-brand-text)]">{p.price} <span className="text-sm font-normal text-[var(--color-fg-muted)]">· {p.period}</span></p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-fg-muted)]">
                    <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-brand-text)]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/contacts?topic=service-${p.slug}`} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-brand)] px-5 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
                {t("order")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="mono-label text-[var(--color-brand-text)]">{t("kbLabel")}</p>
          <h2 className="mt-2">{t("kbTitle")}</h2>
          <p className="mt-3 max-w-3xl text-[var(--color-fg-muted)]">{t("kbText")}</p>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {kbPlans.map((p) => (
              <li key={p.name} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                <h3 className="text-xl">{p.name}</h3>
                <p className="mt-1 font-semibold text-[var(--color-brand-text)]">{p.price}</p>
                <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{fill(p.text)}</p>
              </li>
            ))}
          </ul>
          <Link href="/knowledge/pricing" className="mt-6 inline-flex items-center gap-1 font-semibold text-[var(--color-brand-text)] hover:underline">
            {t("kbLink")} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="mono-label text-[var(--color-brand-text)]">{t("howLabel")}</p>
        <h2 className="mt-2">{t("howTitle")}</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-[var(--color-line)] p-5">
              <span className="mono-label text-[var(--color-fg-placeholder)]">0{i + 1}</span>
              <h3 className="mt-2">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{s.text}</p>
            </li>
          ))}
        </ol>
        <h2 className="mt-16">{t("faqTitle")}</h2>
        <div className="mt-6 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
          {faq.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:content-none">{f.q}</summary>
              <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
