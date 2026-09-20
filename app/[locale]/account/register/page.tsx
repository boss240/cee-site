import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/requireAdmin";
import { RegisterForm } from "../AuthForms";
import { PLANS } from "@/lib/knowledge/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("registerTitle"), alternates: await alternatesFor("/account/register") };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const s = await getUserSession();
  if (s?.user.role === "user") redirect(`/${locale}/account`);
  const t = await getTranslations("Account");
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h1 className="mt-2">{t("registerTitle")}</h1>
      <p className="mt-3 max-w-xl text-[var(--color-fg-muted)]">{t("registerIntro", { guest: PLANS.guest.dailyAsk ?? 0, free: PLANS.free.dailyAsk ?? 0 })}</p>
      <div className="mt-8"><RegisterForm /></div>
    </div>
  );
}
