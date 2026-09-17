import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth/options";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  // Адмін уже увійшов → одразу в панель. Звичайний користувач бази знань
  // (role "user") бачить форму входу адміна — без циклу редиректів.
  if (session && role === "admin") {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations("Admin.login");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elevated)] p-8 shadow-sm">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
        <LoginForm
          locale={locale}
          labels={{
            email: t("email"),
            password: t("password"),
            submit: t("submit"),
            error: t("error"),
          }}
        />
      </div>
    </div>
  );
}
