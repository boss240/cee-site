import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/requireAdmin";
import { RegisterForm } from "../AuthForms";
import { PLANS } from "@/lib/knowledge/plans";
import { AccountBenefits } from "@/components/account/AccountBenefits";

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
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
      {/* Форма — перша на телефоні, праворуч на десктопі; пояснення переваг — поруч */}
      <div className="lg:order-2">
        <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
        <h1 className="mt-2">{t("registerTitle")}</h1>
        <p className="mt-3 max-w-xl text-[var(--color-fg-muted)]">{t("registerIntro", { guest: PLANS.guest.dailyAsk ?? 0, free: PLANS.free.dailyAsk ?? 0 })}</p>
        <div className="mt-8"><RegisterForm /></div>
      </div>
      <div className="lg:order-1">
        <AccountBenefits showCta={false} />
      </div>
    </div>
  );
}
