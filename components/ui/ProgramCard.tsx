import { useLocale, useTranslations } from "next-intl";
import type { Program } from "@/lib/programs";
import { STATUS_LABEL } from "@/lib/programs";

const STATUS_STYLE: Record<Program["status"], string> = {
  active: "bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]",
  paused: "bg-[#fed7aa] text-[#92400e] dark:bg-[#78350f] dark:text-[#fdba74]",
  unknown: "bg-[#e5e7eb] text-[#374151] dark:bg-[#27272a] dark:text-[#d4d4d8]",
};

function formatDate(iso: string, locale: string) {
  const [y, m, d] = iso.split("-");
  return locale === "en" ? `${m}/${d}/${y}` : `${d}.${m}.${y}`;
}

function isStale(iso: string, days = 60) {
  const diff = Date.now() - new Date(iso).getTime();
  return diff > days * 24 * 60 * 60 * 1000;
}

export function ProgramCard({ program }: { program: Program }) {
  const locale = useLocale();
  const t = useTranslations("ProgramCard");
  const stale = isStale(program.checkedAt);
  const statusLabel = (STATUS_LABEL[locale as "uk" | "en"] ?? STATUS_LABEL.uk)[program.status];

  return (
    <article className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl">{program.name}</h3>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {program.administrator}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[program.status]}`}
        >
          {statusLabel}
        </span>
      </div>

      {program.statusNote && (
        <p className="mt-4 rounded-lg border-l-4 border-[var(--color-accent)] bg-[#fffbeb] px-4 py-3 text-sm text-[#111827] dark:bg-[#3f2d05] dark:text-[#fde68a]">
          {program.statusNote}
        </p>
      )}

      <p className="mt-5 text-[var(--color-fg-muted)]">{program.summary}</p>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold">{t("amountLabel")}</dt>
          <dd className="mt-1 text-[var(--color-fg-muted)]">{program.amount}</dd>
        </div>
        {program.cofinancing && (
          <div>
            <dt className="text-sm font-semibold">{t("cofinancingLabel")}</dt>
            <dd className="mt-1 text-[var(--color-fg-muted)]">
              {program.cofinancing}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold">{t("coversLabel")}</h4>
          <ul className="mt-2 space-y-1.5">
            {program.covers.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-[var(--color-fg-muted)]"
              >
                <span aria-hidden="true" className="text-[var(--color-brand-text)]">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">{t("requirementsLabel")}</h4>
          <ul className="mt-2 space-y-1.5">
            {program.requirements.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-[var(--color-fg-muted)]"
              >
                <span aria-hidden="true" className="text-[var(--color-brand-text)]">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--color-line)] pt-5">
        <h4 className="text-sm font-semibold">{t("contactsLabel")}</h4>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {program.contacts.map((c) => (
            <li key={c.label} className="text-sm text-[var(--color-fg-muted)]">
              <span className="font-medium text-[var(--color-fg)]">
                {c.label}:
              </span>{" "}
              {c.href ? (
                <a
                  href={c.href}
                  className="text-[var(--color-brand-text)] underline underline-offset-2"
                  {...(c.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {c.value}
                </a>
              ) : (
                c.value
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--color-fg-placeholder)]">
        {t("sourceLabel")}: {program.source}. {t("checkedLabel")} {formatDate(program.checkedAt, locale)}.
        {stale && ` ${t("staleWarning")}`}
      </p>
    </article>
  );
}
