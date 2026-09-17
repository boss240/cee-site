import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { PasswordForm } from "./PasswordForm";

export default async function AdminAccountPage() {
  const t = await getTranslations("Admin.account");
  const session = await getServerSession(authOptions);
  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle", { email: session?.user?.email ?? "" })}</p>
      <PasswordForm
        labels={{
          current: t("current"),
          next: t("next"),
          confirm: t("confirm"),
          hint: t("hint"),
          save: t("save"),
          saved: t("saved"),
          mismatch: t("mismatch"),
          wrongCurrent: t("wrongCurrent"),
          weak: t("weak"),
          error: t("error"),
        }}
      />
    </div>
  );
}
