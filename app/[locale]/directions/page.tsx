import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/lib/seo";
import { EngineeringDirections, EngineeringProcess } from "@/components/ui/EngineeringDirections";

type Props = { params: Promise<{ locale: string }> };
export const revalidate = 3600;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DirectionsPage");
  return { title: t("title"), description: t("intro"), alternates: await alternatesFor("/directions") };
}
export default async function DirectionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DirectionsPage");
  return <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
    <h1>{t("title")}</h1><p className="mt-5 max-w-3xl text-lg text-[var(--color-fg-muted)]">{t("intro")}</p>
    <EngineeringDirections detailed />
    <EngineeringProcess />
    <p className="mt-8 max-w-3xl text-[var(--color-fg-muted)]">{t("scopeNote")}</p>
    <div className="mt-8 flex flex-wrap gap-4"><Link href="/contacts" className="rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white">{t("cta")}</Link><Link href="/services" className="rounded-lg border border-[var(--color-line)] px-6 py-3">{t("servicesLink")}</Link></div>
  </div>;
}
