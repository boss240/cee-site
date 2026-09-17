import { getTranslations } from "next-intl/server";
import { UsersManager, type UserLabels } from "./UsersManager";

export default async function AdminUsersPage() {
  const t = await getTranslations("Admin.users");
  const tp = await getTranslations("Pricing");
  const keys: (keyof UserLabels)[] = ["empty","loading","plan","planUntil","save","saved","delete","confirmDelete","registered","lastLogin","asks30d","asksTotal","never","filter","hint"];
  const labels = Object.fromEntries(keys.map((k) => [k, t(k)])) as UserLabels;
  const planNames = Object.fromEntries(["free","premium","enterprise"].map((p) => [p, tp(`plans.${p}.name`)]));
  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      <UsersManager labels={labels} planNames={planNames} />
    </div>
  );
}
