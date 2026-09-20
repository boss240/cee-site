import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { EnergyField } from "@/components/ui/EnergyField";
import { CalculatorsClient } from "./CalculatorsClient";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calculators");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/calculators") };
}

export default async function CalculatorsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab } = await searchParams;
  const t = await getTranslations("Calculators");
  const initialTab = (["bess", "arb", "finance", "express"] as const).find((x) => x === tab) ?? "bess";
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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <CalculatorsClient initialTab={initialTab} />
        <p className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-4 text-sm text-[var(--color-fg-muted)]">{t("disclaimer")}</p>
      </div>
    </>
  );
}
