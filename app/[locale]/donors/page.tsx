import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HandCoins, Landmark, Users } from "lucide-react";
import { AudienceBridgePage } from "@/components/ui/AudienceBridgePage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("DonorsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function DonorsPage() {
  return (
    <AudienceBridgePage
      namespace="DonorsPage"
      icons={{ from: HandCoins, center: Landmark, to: Users }}
    />
  );
}
