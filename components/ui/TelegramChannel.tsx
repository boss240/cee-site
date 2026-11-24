import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { ceeTelegramUrl } from "@/lib/telegram";
import { TelegramIcon } from "@/components/ui/TelegramIcon";

/** Блок «Підписатися на Telegram-канал ЦЕЕ». Без посилання в налаштуваннях — нічого не показує. */
export async function TelegramChannel() {
  const url = ceeTelegramUrl();
  if (!url) return null;
  const t = await getTranslations("Telegram");
  return (
    <aside className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mono-label flex items-center gap-2 text-[var(--color-brand-text)]">
            <TelegramIcon size={18} /> Telegram
          </p>
          <h2 className="mt-2 text-2xl">{t("title")}</h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t("text")}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex flex-wrap items-center justify-center gap-2 self-start rounded-lg bg-[var(--color-brand)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand)] sm:shrink-0">
          {t("button")}
          <ArrowUpRight size={16} aria-hidden="true" />
          <span className="sr-only">{t("newTab")}</span>
        </a>
      </div>
    </aside>
  );
}
