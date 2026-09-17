import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Inbox, Newspaper, Package, ClipboardList, Receipt, Bot, LogOut, KeyRound, FileText, Rss, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { authOptions } from "@/lib/auth/options";

const NAV = [
  { href: "/admin", key: "dashboard", Icon: LayoutDashboard },
  { href: "/admin/leads", key: "leads", Icon: Inbox },
  { href: "/admin/blog", key: "blog", Icon: Newspaper },
  { href: "/admin/knowledge/documents", key: "documents", Icon: FileText },
  { href: "/admin/knowledge/digests", key: "digests", Icon: Rss },
  { href: "/admin/knowledge/users", key: "users", Icon: Users },
  { href: "/admin/services", key: "services", Icon: Package },
  { href: "/admin/surveys", key: "surveys", Icon: ClipboardList },
  { href: "/admin/billing", key: "billing", Icon: Receipt },
  { href: "/admin/ai-models", key: "aiModels", Icon: Bot },
] as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "admin") {
    redirect(`/${locale}/admin/login`);
  }

  const t = await getTranslations("Admin");

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-placeholder)]">
            {t("title")}
          </p>
          <nav className="mt-3 space-y-1">
            {NAV.map(({ href, key, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"
              >
                <Icon size={16} aria-hidden />
                {t(`nav.${key}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-6 space-y-2 border-t border-[var(--color-line)] pt-4">
            <p className="px-3 text-xs text-[var(--color-fg-placeholder)]">
              {session.user?.email}
            </p>
            <Link
              href="/admin/account"
              className="flex items-center gap-2 px-3 text-sm text-[var(--color-fg-placeholder)] transition hover:text-[var(--color-brand-text)]"
            >
              <KeyRound size={14} aria-hidden />
              {t("nav.account")}
            </Link>
            <Link
              href="/"
              className="block px-3 text-sm text-[var(--color-fg-placeholder)] transition hover:text-[var(--color-brand-text)]"
            >
              {t("backToSite")}
            </Link>
            <a
              href={`/${locale}/admin/logout`}
              className="flex items-center gap-2 px-3 text-sm text-[var(--color-fg-placeholder)] transition hover:text-red-500"
            >
              <LogOut size={14} aria-hidden />
              {t("logout")}
            </a>
          </div>
        </div>
      </aside>

      {/* Мобільна навігація адмінки */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-[var(--color-line)] bg-[var(--color-bg-elevated)] py-2 lg:hidden">
        {NAV.map(({ href, key, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-[var(--color-fg-muted)]"
          >
            <Icon size={18} aria-hidden />
            {t(`nav.${key}`)}
          </Link>
        ))}
      </nav>

      <div className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</div>
    </div>
  );
}
