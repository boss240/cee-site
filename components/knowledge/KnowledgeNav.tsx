"use client";

import { useTranslations } from "next-intl";
import { BookOpenText, FileText, Newspaper, MessageSquareText, BadgeCheck } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/knowledge", key: "hub", Icon: BookOpenText, exact: true },
  { href: "/knowledge/documents", key: "documents", Icon: FileText, exact: false },
  { href: "/knowledge/digests", key: "digests", Icon: Newspaper, exact: false },
  { href: "/knowledge/ask", key: "ask", Icon: MessageSquareText, exact: false },
  { href: "/knowledge/pricing", key: "pricing", Icon: BadgeCheck, exact: false },
] as const;

/** Підменю розділу «База знань» — липке під шапкою, працює на телефоні горизонтальним скролом */
export function KnowledgeNav() {
  const t = useTranslations("Knowledge.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("aria")} className="sticky top-[3.85rem] z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 backdrop-blur">
      {/* На телефоні список ширший за екран — градієнт праворуч підказує, що можна гортати */}
      <div className="relative after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-12 after:bg-gradient-to-l after:from-[var(--color-bg)] after:to-transparent md:after:hidden">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 pr-12 [scrollbar-width:none] md:pr-4">
        {ITEMS.map(({ href, key, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${active ? "bg-[var(--color-brand)] text-white" : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"}`}
              >
                <Icon size={15} aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
      </div>
    </nav>
  );
}
