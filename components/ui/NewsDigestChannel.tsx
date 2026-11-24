import { ArrowUpRight, Newspaper } from "lucide-react";

/** Static external channel link: no Telegram embed, request, or copied posts. */
export function NewsDigestChannel({ locale }: { locale: string }) {
  const english = locale === "en";
  return (
    <aside className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mono-label flex items-center gap-2 text-[var(--color-brand-text)]">
            <Newspaper size={18} aria-hidden="true" /> EnergyNodeNews · Telegram
          </p>
          <h2 className="mt-2 text-2xl">{english ? "News digests" : "Дайджести новин"}</h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            {english ? "Read the EnergyNodeNews channel on Telegram." : "Читайте канал EnergyNodeNews у Telegram."}
          </p>
        </div>
        <a href="https://t.me/energynodenews" target="_blank" rel="noopener noreferrer"
          className="inline-flex flex-wrap items-center justify-center gap-2 self-start rounded-lg bg-[var(--color-brand)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand)] sm:shrink-0">
          {english ? "Read on Telegram" : "Читати в Telegram"}
          <ArrowUpRight size={16} aria-hidden="true" />
          <span className="sr-only">{english ? " (opens in a new tab)" : " (відкриється в новій вкладці)"}</span>
        </a>
      </div>
    </aside>
  );
}
