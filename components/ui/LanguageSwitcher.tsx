"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Language");
  const locale = useLocale();
  const pathname = usePathname();

  function switchTo(next: string) {
    if (next === locale) return;
    // Повне перезавантаження замість клієнтської навігації: кореневий
    // layout ([locale]) і так перемонтовується при зміні мови, а повний
    // перехід гарантує чисте завантаження словника й тем без дев-попереджень.
    const href = getPathname({
      href: pathname,
      locale: next as (typeof routing.locales)[number],
    });
    const search = typeof window !== "undefined" ? window.location.search : "";
    window.location.assign(href + search);
  }

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-line)]">
      <span
        aria-hidden="true"
        className="flex h-11 w-9 items-center justify-center text-[var(--color-fg-muted)]"
      >
        <Languages size={16} />
      </span>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          aria-pressed={locale === loc}
          aria-label={t(loc)}
          className={`h-11 px-2.5 text-sm font-semibold uppercase transition ${
            locale === loc
              ? "bg-[var(--color-brand)] text-white"
              : "text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)]"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
