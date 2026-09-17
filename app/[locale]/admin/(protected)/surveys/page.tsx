import { getTranslations } from "next-intl/server";
import { SurveysManager } from "./SurveysManager";

export default async function AdminSurveysPage() {
  const t = await getTranslations("Admin.surveys");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>

      <SurveysManager
        labels={{
          addNew: t("addNew"),
          text: t("questionTypes.text"),
          single: t("questionTypes.single"),
          multi: t("questionTypes.multi"),
          nps: t("questionTypes.nps"),
          trigger: t("trigger"),
          results: t("results"),
          export: t("export"),
        }}
      />
    </div>
  );
}
