"use client";

import { useEffect, useState } from "react";
import { UserRound, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type Me = { signedIn: boolean; role?: string };

/** Кнопка «Увійти» / «Кабінет» у шапці. Стан підтягується після завантаження, щоб сторінки лишались статичними. */
export function AccountLink({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  const t = useTranslations("Header");
  const [me, setMe] = useState<Me | null>(null);
  const pathname = usePathname();
  // Перевіряємо сесію при кожній навігації — після входу/виходу кнопка оновлюється без перезавантаження
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me").then((r) => r.json()).then((d) => { if (alive) setMe(d); }).catch(() => { if (alive) setMe({ signedIn: false }); });
    return () => { alive = false; };
  }, [pathname]);
  const admin = me?.signedIn && me.role === "admin";
  const href = admin ? "/admin" : me?.signedIn ? "/account" : "/account/login";
  const text = admin ? t("admin") : me?.signedIn ? t("account") : t("login");
  const Icon = admin ? ShieldCheck : UserRound;
  return (
    <Link href={href} onClick={onClick} aria-label={text} className={`inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand-text)] ${className}`}>
      <Icon size={16} aria-hidden />
      <span>{text}</span>
    </Link>
  );
}
