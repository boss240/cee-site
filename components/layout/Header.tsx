"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AUDIENCES, HEADER_NAV, TOOLS } from "@/lib/nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { AccountLink } from "@/components/layout/AccountLink";
import { TelegramIcon } from "@/components/ui/TelegramIcon";
import { ceeTelegramUrl } from "@/lib/telegram";

const TELEGRAM_URL = ceeTelegramUrl();

export function Header() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("Header");
  const tNav = useTranslations("Nav");

  function closeMenus() {
    headerRef.current?.querySelectorAll("details[open]").forEach((node) => node.removeAttribute("open"));
    setOpen(false);
  }

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      headerRef.current?.querySelectorAll("details[open]").forEach((node) => {
        if (!node.contains(event.target as Node)) node.removeAttribute("open");
      });
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const expanded = headerRef.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (expanded) {
        expanded.open = false;
        expanded.querySelector("summary")?.focus();
      } else if (open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navigation = (mobile: boolean) => HEADER_NAV.map((item) => {
    const children = item.key === "audiences" ? AUDIENCES : item.key === "tools" ? TOOLS : null;
    return <li key={item.key}>
      {children ? <details className="group relative" onToggle={(event) => {
        if (!event.currentTarget.open) return;
        const current = event.currentTarget;
        headerRef.current?.querySelectorAll("details[open]").forEach((node) => { if (node !== current) node.removeAttribute("open"); });
      }}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-1 rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)] [&::-webkit-details-marker]:hidden">
          {tNav(item.key)}<ChevronDown size={15} aria-hidden className="shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <ul className={mobile ? "ml-3 border-l border-[var(--color-line)] pl-2" : "absolute left-0 top-full z-50 w-64 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-elevated)] p-2 shadow-xl"}>
          {children.map((child) => <li key={child.href}><Link href={child.href} onClick={closeMenus} className="block rounded-lg px-3 py-3 text-sm hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-text)]">{tNav(child.key)}</Link></li>)}
        </ul>
      </details> : <Link href={item.href!} onClick={closeMenus} className="flex min-h-11 items-center rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-brand-text)]">{tNav(item.key)}</Link>}
    </li>;
  });

  return <header ref={headerRef} className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-bg)]/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
      <Link href="/" onClick={closeMenus} className="flex shrink-0 items-center gap-2 font-bold"><span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-lg">🌱</span><span>ЦЕЕ</span></Link>
      <nav aria-label={t("mainNav")} className="hidden xl:block"><ul className="flex items-center gap-1">{navigation(false)}</ul></nav>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex"><AccountLink className="hidden xl:inline-flex" />{TELEGRAM_URL && <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={t("telegram")} title={t("telegram")} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)] hover:bg-[var(--color-surface)]"><TelegramIcon size={18} /></a>}<LanguageSwitcher /><ThemeToggle /></div>
        <Link href="/contacts" className="hidden rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] 2xl:inline-block">{t("cta")}</Link>
        <button ref={toggleRef} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t("closeMenu") : t("openMenu")} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] xl:hidden">{open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}</button>
      </div>
    </div>
    {open && <nav id="mobile-nav" aria-label={t("mobileNav")} className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-[var(--color-line)] bg-[var(--color-surface)] xl:hidden">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-2"><AccountLink className="mr-auto" onClick={closeMenus} />{TELEGRAM_URL && <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={t("telegram")} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]"><TelegramIcon size={18} /></a>}<LanguageSwitcher /><ThemeToggle /></div>
        <ul>{navigation(true)}</ul>
      </div>
    </nav>}
  </header>;
}
