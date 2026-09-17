import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AUDIENCES, SECTIONS } from "@/lib/nav";
import { getPublicContacts } from "@/lib/publicProfile";

export async function Footer() {
  const year = new Date().getFullYear();
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const c = await getPublicContacts();

  const linkCls = "text-sm text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand-text)]";

  return (
    <footer className="mt-20 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-bold">{t("title")}</p>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{c.address || t("address")}</p>
          <ul className="mt-4 space-y-1.5">
            {c.phone && (
              <li>
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className={linkCls}>
                  {c.phone}
                </a>
              </li>
            )}
            {c.email && (
              <li>
                <a href={`mailto:${c.email}`} className={linkCls}>
                  {c.email}
                </a>
              </li>
            )}
            <li>
              <Link href="/contacts" className={linkCls}>
                {t("writeUs")}
              </Link>
            </li>
          </ul>
        </div>

        <nav aria-label={t("audiencesNav")}>
          <p className="font-semibold">{t("audiencesTitle")}</p>
          <ul className="mt-3 space-y-2">
            {AUDIENCES.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("sectionsNav")}>
          <p className="font-semibold">{t("sectionsTitle")}</p>
          <ul className="mt-3 space-y-2">
            {SECTIONS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("documentsNav")}>
          <p className="font-semibold">{t("documentsTitle")}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/privacy" className={linkCls}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkCls}>
                {t("terms")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-[var(--color-line)]">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-[var(--color-fg-muted)]">{t("copyright", { year })}</p>
      </div>
    </footer>
  );
}
