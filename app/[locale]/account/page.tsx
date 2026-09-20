import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { db, schema } from "@/lib/db";
import { getUserSession } from "@/lib/auth/requireAdmin";
import { userIdFromSession } from "@/lib/auth/options";
import { planFor } from "@/lib/knowledge/plans";
import { SignOutButton } from "./AuthForms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("title"), alternates: await alternatesFor("/account") };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const s = await getUserSession();
  const userId = userIdFromSession(s?.user);
  if (!s || !userId) redirect(`/${locale}/account/login`);

  const t = await getTranslations("Account");
  const tp = await getTranslations("Pricing");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) redirect(`/${locale}/account/login`);
  const plan = planFor(user.plan, user.planUntil);

  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const recent = await db.select().from(schema.usageEvents).where(eq(schema.usageEvents.userId, userId)).orderBy(desc(schema.usageEvents.createdAt)).limit(10);
  const usedToday = recent.filter((r) => r.createdAt >= since).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h1 className="mt-2">{t("title")}</h1>
      <p className="mt-3 text-[var(--color-fg-muted)]">{user.name || user.email}{user.organization ? ` · ${user.organization}` : ""}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface)] p-6">
          <p className="mono-label text-[var(--color-fg-placeholder)]">{t("planLabel")}</p>
          <p className="mt-2 text-2xl font-bold">{tp(`plans.${plan.id}.name`)}</p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {plan.dailyAsk === null ? t("unlimited", { fair: plan.fairUseAsk }) : t("dailyLimit", { n: plan.dailyAsk })}
          </p>
          {user.planUntil && <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{t("until", { date: new Date(user.planUntil).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA") })}</p>}
          {plan.id === "free" && (
            <Link href="/knowledge/pricing" className="mt-4 inline-block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">{t("upgrade")}</Link>
          )}
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <p className="mono-label text-[var(--color-fg-placeholder)]">{t("todayLabel")}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{usedToday}{plan.dailyAsk !== null ? ` / ${plan.dailyAsk}` : ""}</p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("todayText")}</p>
          <Link href="/knowledge/ask" className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand-text)] underline-offset-2 hover:underline">{t("goAsk")} →</Link>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl">{t("historyTitle")}</h2>
          <ul className="mt-4 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="shrink-0 text-xs tabular-nums text-[var(--color-fg-placeholder)]">{new Date(r.createdAt).toLocaleString(locale === "en" ? "en-GB" : "uk-UA")}</span>
                <span className="text-sm text-[var(--color-fg-muted)]">{r.question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10"><SignOutButton label={t("signOut")} /></div>
    </div>
  );
}
