import { getTranslations } from "next-intl/server";
import { ServicesManager } from "./ServicesManager";

export default async function AdminServicesPage() {
  const t = await getTranslations("Admin.services");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>

      <ServicesManager
        labels={{
          addNew: t("addNew"),
          name: t("name"),
          description: t("description"),
          price: t("price"),
          currency: t("currency"),
          status: t("status"),
          page: t("page"),
          active: t("active"),
          hidden: t("hidden"),
          edit: t("edit"),
          delete: t("delete"),
          save: t("save"),
          cancel: t("cancel"),
        }}
      />
    </div>
  );
}
