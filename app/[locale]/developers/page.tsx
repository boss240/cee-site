import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { Briefcase, Landmark, MapPin } from "lucide-react";
import { AudienceBridgePage } from "@/components/ui/AudienceBridgePage";

type Props = { params: Promise<{ locale: string }> };

/** Статична сторінка, ISR: оновлення раз на 10 хв */
export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DevelopersPage");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/developers") };
}

export default async function DevelopersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AudienceBridgePage
      namespace="DevelopersPage"
      icons={{ from: Briefcase, center: Landmark, to: MapPin }}
    />
  );
}
