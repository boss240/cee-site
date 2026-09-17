import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Check, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { PLANS, type PlanId } from "@/lib/knowledge/plans";
import { getUserSession } from "@/lib/auth/requireAdmin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pricing");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const ORDER: PlanId[] = ["free", "premium", "enterprise"];
const FEATURE_KEYS = ["documents", "documentSearch", "digests", "ask", "askHistory", "analytics", "api"] as const;

export default async function PricingPage() {
  const t = await getTranslations("Pricing");
  const s = await getUserSession();
  const signedIn = Boolean(s && s.user.role === "user");
  const faq = t.raw("faq") as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Reveal>
        <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
        <h1 className="mt-2">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>
      </Reveal>

      <ul className="mt-10 grid gap-5 lg:grid-cols-3">
        {ORDER.map((id, i) => {
          const p = PLANS[id];
          const highlight = id === "premium";
          const priceText = p.priceMonth === 0 ? t("free") : p.priceMonth === null ? t("priceTbd") : `${p.priceMonth} ${p.currency}`;
          const cta = id === "free" ? (signedIn ? { href: "/knowledge/ask", label: t("ctaGoAsk") } : { href: "/account/register", label: t("ctaRegister") }) : { href: `/contacts?topic=subscription-${id}`, label: t("ctaRequest") };
          return (
            <Reveal as="li" key={id} delay={i * 90}>
              <div className={`flex h-full flex-col rounded-xl border p-6 ${highlight ? "border-[var(--color-brand)] bg-[var(--color-surface)] shadow-lg shadow-emerald-900/10" : "border-[var(--color-line)] bg-[var(--color-bg)]"}`}>
                {highlight && <span className="mono-label mb-3 text-[var(--color-brand-text)]">{t("recommended")}</span>}
                <h2 className="text-2xl">{t(`plans.${id}.name`)}</h2>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t(`plans.${id}.for`)}</p>
                <p className="mt-5 text-3xl font-bold">{priceText}</p>
                <p className="text-xs text-[var(--color-fg-placeholder)]">{p.priceMonth === null ? t("priceNote") : t("perMonth")}</p>
                <p className="mt-4 rounded-lg bg-[var(--color-bg)] px-3 py-2 text-sm dark:bg-white/5">
                  {p.dailyAsk === null ? t("askUnlimited", { fair: p.fairUseAsk }) : t("askDaily", { n: p.dailyAsk })}
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {FEATURE_KEYS.map((f) => (
                    <li key={f} className={`flex gap-2 ${p.features[f] ? "" : "text-[var(--color-fg-placeholder)]"}`}>
                      {p.features[f] ? <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-brand)]" /> : <Minus size={16} aria-hidden className="mt-0.5 shrink-0" />}
                      <span>{t(`features.${f}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link href={cta.href} className={`mt-6 rounded-lg px-5 py-3 text-center font-semibold transition ${highlight ? "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]" : "border border-[var(--color-line)] text-[var(--color-brand-text)] hover:bg-[var(--color-surface)]"}`}>
                  {cta.label}
                </Link>
              </div>
            </Reveal>
          );
        })}
      </ul>

      <p className="mt-6 text-sm text-[var(--color-fg-muted)]">{t("guestNote", { n: PLANS.guest.dailyAsk ?? 0 })}</p>

      <section className="mt-16">
        <h2>{t("faqTitle")}</h2>
        <dl className="mt-6 grid gap-5 md:grid-cols-2">
          {faq.map((f) => (
            <div key={f.q} className="rounded-xl border border-[var(--color-line)] p-5">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-2 text-sm text-[var(--color-fg-muted)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
