import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  /** Назва розділу або дії, якої ще немає */
  title?: string;
  /** Необовʼязкове уточнення, що саме тут буде */
  hint?: string;
};

/**
 * Єдина заглушка проєкту.
 * Використовується для всіх нереалізованих сторінок і дій,
 * щоб на сайті не було мертвих посилань і німих кнопок.
 */
export function Placeholder({ title, hint }: Props) {
  const t = useTranslations("Common");

  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-20 text-center sm:py-28"
    >
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand)] text-3xl"
      >
        🌱
      </span>

      {title ? (
        <h1 className="text-[var(--color-fg)]">{title}</h1>
      ) : null}

      <p className="text-lg font-semibold text-[var(--color-brand-text)]">
        {t("apologize")}
      </p>

      <p className="text-[var(--color-fg-muted)]">
        {hint ?? t("inWorkDefault")}
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/contacts"
          className="rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]"
        >
          {t("contactUs")}
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-[var(--color-line)] px-6 py-3 font-semibold text-[var(--color-brand-text)] transition hover:bg-[var(--color-surface)]"
        >
          {t("backToHome")}
        </Link>
      </div>
    </section>
  );
}

/**
 * Компактний варіант — для нереалізованої дії всередині готової сторінки
 * (наприклад, кнопка калькулятора або блок, який ще не підключений).
 */
export function PlaceholderInline({ hint }: { hint?: string }) {
  const t = useTranslations("Common");

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6 text-center"
    >
      <p className="font-semibold text-[var(--color-brand-text)]">
        {t("apologize")}
      </p>
      {hint ? (
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
