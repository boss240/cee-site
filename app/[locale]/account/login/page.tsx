import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/requireAdmin";
import { LoginForm } from "../AuthForms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("loginTitle") };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const s = await getUserSession();
  if (s?.user.role === "user") redirect(`/${locale}/account`);
  const t = await getTranslations("Account");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h1 className="mt-2">{t("loginTitle")}</h1>
      <p className="mt-3 text-[var(--color-fg-muted)]">{t("loginIntro")}</p>
      <div className="mt-8"><LoginForm /></div>
    </div>
  );
}
