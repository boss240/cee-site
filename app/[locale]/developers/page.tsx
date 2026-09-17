import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Briefcase, Landmark, MapPin } from "lucide-react";
import { AudienceBridgePage } from "@/components/ui/AudienceBridgePage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("DevelopersPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function DevelopersPage() {
  return (
    <AudienceBridgePage
      namespace="DevelopersPage"
      icons={{ from: Briefcase, center: Landmark, to: MapPin }}
    />
  );
}
