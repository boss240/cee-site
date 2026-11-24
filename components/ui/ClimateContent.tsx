import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function ClimateBrandIntroduction() {
  const t = await getTranslations("ClimateContent");
  return (
    <div className="mb-5 max-w-3xl">
      <p className="font-semibold text-[var(--color-fg)]">{t("name")}</p>
      <p className="mt-1 text-base text-[var(--color-fg-muted)] sm:text-lg">{t("subtitle")}</p>
    </div>
  );
}

export async function ClimateContent({ variant }: { variant: "home" | "community" | "about" }) {
  const t = await getTranslations(`ClimateContent.${variant}`);
  const items = variant === "community" ? t.raw("items") as { title: string; text: string }[] : [];
  return (
    <section aria-labelledby={`climate-${variant}-title`} className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {variant === "about" && <p className="mono-label mb-3 text-[var(--color-brand-text)]">{t("status")}</p>}
        <h2 id={`climate-${variant}-title`} className="max-w-4xl">{t("title")}</h2>
        <p className="mt-4 max-w-3xl text-[var(--color-fg-muted)]">{t(variant === "community" ? "intro" : "body")}</p>
        {variant === "community" && (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {items.map((item) => <li key={item.title} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
              <h3>{item.title}</h3>
              <p className="mt-2 text-[var(--color-fg-muted)]">{item.text}</p>
            </li>)}
          </ul>
        )}
        {variant !== "home" && (
          <div className="mt-8 max-w-3xl border-l-2 border-[var(--color-brand)] pl-5">
            {variant === "community" && <h3>{t("developmentTitle")}</h3>}
            <p className="mt-3 text-[var(--color-fg-muted)]">{t("development")}</p>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{t(variant === "community" ? "financing" : "clarification")}</p>
          </div>
        )}
        {variant !== "about" && (
          <div className="mt-7">
            <Link href={variant === "home" ? "/community" : "/contacts"} className="inline-flex max-w-full rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">{t("cta")}</Link>
            {variant === "community" && <p className="mt-3 max-w-2xl text-sm text-[var(--color-fg-muted)]">{t("helper")}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
