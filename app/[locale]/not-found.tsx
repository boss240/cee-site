import { getTranslations } from "next-intl/server";
import { Placeholder } from "@/components/ui/Placeholder";

export default async function NotFound() {
  const t = await getTranslations("Placeholder.notFound");
  return <Placeholder title={t("title")} hint={t("hint")} />;
}
