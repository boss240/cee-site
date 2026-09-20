"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AUDIENCES, HEADER_NAV, SECTIONS } from "@/lib/nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { AccountLink } from "@/components/layout/AccountLink";

export function Header() {
  const [open, setOpen] = useState(false);
  const [audiencesOpen, setAudiencesOpen] = useState(false);
  const audiencesRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Header");
  const tNav = useTranslations("Nav");

  // Закриття випадного списку: клік поза ним або Escape
  useEffect(() => {
    if (!audiencesOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const node = audiencesRef.current;
      if (node && !node.contains(event.target as Node)) setAudiencesOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAudiencesOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [audiencesOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-lg"
          >
            🌱
          </span>
          <span className="leading-tight">
            ЦЕЕ
            <span className="ml-1 hidden font-normal text-[var(--color-fg-muted)] sm:inline">
              Ладижин
            </span>
          </span>
        </Link>

        <nav aria-label={t("mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-5">
            <li>
              <div ref={audiencesRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAudiencesOpen((v) => !v)}
                  aria-expanded={audiencesOpen}
                  aria-controls="audiences-menu"
                  className="flex items-center gap-1 text-sm text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand-text)]"
                >
                  {tNav("audiences")}
                  <ChevronDown
                    aria-hidden="true"
                    size={15}
                    className={`transition-transform ${audiencesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {audiencesOpen && (
                  <ul
                    id="audiences-menu"
                    className="absolute left-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-elevated)] py-2 shadow-xl shadow-black/10"
                  >
                    {AUDIENCES.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setAudiencesOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[var(--color-fg)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]"
                        >
                          {tNav(item.key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>

            {HEADER_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand-text)]"
                >
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <AccountLink className="mr-1 hidden lg:inline-flex" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <Link
            href="/contacts"
            className="hidden rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] sm:inline-block"
          >
            {t("cta")}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] lg:hidden"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label={t("mobileNav")}
          className="border-t border-[var(--color-line)] bg-[var(--color-surface)] lg:hidden"
        >
          <div className="mx-auto max-w-6xl px-4 py-2">
            {/* Головна дія — на телефоні кнопки в шапці немає, тому вона перша в меню */}
            <Link
              href="/contacts"
              onClick={() => setOpen(false)}
              className="mt-2 flex h-12 items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-base font-semibold text-white transition hover:bg-[var(--color-brand-hover)]"
            >
              {t("cta")}
            </Link>

            <p className="mono-label px-2 pb-1 pt-3 text-[var(--color-fg-placeholder)]">
              {tNav("audiences")}
            </p>
            <ul>
              {AUDIENCES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-3 text-[var(--color-fg)] transition hover:bg-[var(--color-bg-elevated)]"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-2 border-t border-[var(--color-line)] pt-2">
              {SECTIONS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-3 text-[var(--color-fg)] transition hover:bg-[var(--color-bg-elevated)]"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto flex max-w-6xl items-center gap-2 border-t border-[var(--color-line)] px-4 py-3">
            <AccountLink className="mr-auto" onClick={() => setOpen(false)} />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
