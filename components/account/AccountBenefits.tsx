import { getTranslations } from "next-intl/server";
import { MessageSquareText, History, Gauge, BadgeCheck, ShieldCheck, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PLANS } from "@/lib/knowledge/plans";

const ICONS = [MessageSquareText, History, Gauge, BadgeCheck, ShieldCheck];

/**
 * Пояснення, навіщо клієнту реєструватися і що він отримує.
 * variant="full" — блок із картками (реєстрація, база знань);
 * variant="compact" — короткий список (вхід, підказки поруч із формами).
 */
export async function AccountBenefits({ variant = "full", showCta = true }: { variant?: "full" | "compact"; showCta?: boolean }) {
  const t = await getTranslations("AccountBenefits");
  const vars = { guest: PLANS.guest.dailyAsk ?? 0, free: PLANS.free.dailyAsk ?? 0 };

  if (variant === "compact") {
    const items = t.raw("compactItems") as string[];
    return (
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p className="font-semibold">{t("compactTitle")}</p>
        <ul className="mt-3 space-y-2">
          {items.map((raw) => (
            <li key={raw} className="flex items-start gap-2 text-sm text-[var(--color-fg-muted)]">
              <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-brand-text)]" />
              <span>{raw.replace("{free}", String(vars.free)).replace("{guest}", String(vars.guest))}</span>
            </li>
          ))}
        </ul>
        {showCta && (
          <Link href="/account/register" className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
            {t("cta")}
          </Link>
        )}
      </div>
    );
  }

  const items = t.raw("items") as { title: string; text: string }[];
  const fill = (s: string) => s.replace("{free}", String(vars.free)).replace("{guest}", String(vars.guest));
  return (
    <section aria-labelledby="account-benefits-title">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h2 id="account-benefits-title" className="mt-2">{t("title")}</h2>
      <p className="mt-3 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => {
          const Icon = ICONS[i] ?? Check;
          return (
            <li key={it.title} className="flex gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5] text-[var(--color-brand-text)] dark:bg-white/10">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-semibold leading-snug">{fill(it.title)}</p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{fill(it.text)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 rounded-xl border border-dashed border-[var(--color-line)] p-4 text-sm">
        <p className="font-semibold">{t("noAccountTitle")}</p>
        <p className="mt-1 text-[var(--color-fg-muted)]">{t("noAccountText")}</p>
      </div>
      {showCta && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account/register" className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-brand)] px-6 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
            {t("cta")}
          </Link>
          <Link href="/account/login" className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-line)] px-6 font-semibold text-[var(--color-brand-text)] transition hover:bg-[var(--color-surface)]">
            {t("ctaSecondary")}
          </Link>
        </div>
      )}
    </section>
  );
}
