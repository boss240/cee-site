import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { LegalPage } from "@/components/ui/LegalPage";

type Props = { params: Promise<{ locale: string }> };

/** Статична сторінка: запит після години запускає ISR (SWR), не таймер */
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("TermsPage");
  return { title: t("title"), description: t("intro"), alternates: await alternatesFor("/terms") };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage namespace="TermsPage" />;
}
