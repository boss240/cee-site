"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Уникаємо розсинхрону SSR/CSR: рендеримо іконку лише після монтування.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("toggle")}
      title={isDark ? t("light") : t("dark")}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-fg-muted)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)]"
    >
      {mounted ? (
        isDark ? (
          <Sun size={18} aria-hidden />
        ) : (
          <Moon size={18} aria-hidden />
        )
      ) : (
        <span className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}
