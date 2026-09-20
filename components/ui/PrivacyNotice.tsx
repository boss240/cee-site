"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Повідомлення відвідувачу при першому візиті: які дані зберігає сайт і де політика.
 * Сайт не використовує рекламних/трекінгових cookie — лише технічні (тема, мова, сесія),
 * тому це інформування, а не блокувальний банер. Погодження запам'ятовується локально
 * (localStorage, ключ версіонований — при зміні політики достатньо підняти версію).
 */
const KEY = "cee:privacy-notice:v1";

export function PrivacyNotice() {
  const t = useTranslations("PrivacyNotice");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setVisible(true);
    } catch {
      // приватний режим / вимкнене сховище — показуємо лише в межах цієї сторінки
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-[55] px-3 pb-20 sm:px-6 sm:pb-6 sm:pr-24 print:hidden"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elevated)] p-4 shadow-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <ShieldCheck size={22} aria-hidden className="hidden shrink-0 text-[var(--color-brand)] sm:block" />
        <p className="flex-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {t("text")}{" "}
          <Link href="/privacy" className="font-medium text-[var(--color-fg)] underline underline-offset-2">
            {t("link")}
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={accept}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={accept}
            aria-label={t("close")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-fg-placeholder)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)] sm:hidden"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
