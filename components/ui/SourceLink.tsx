import type { ReactNode } from "react";
import { safeExternalUrl } from "@/lib/safeExternalUrl";

/** Legacy invalid values remain in the DB but never become clickable URLs. */
export function SourceLink({ href, children, className, locale = "uk" }: {
  href: string | null | undefined;
  children: ReactNode;
  className?: string;
  locale?: string;
}) {
  if (!href) return null;
  const safe = safeExternalUrl(href);
  if (!safe) return <span className={className}>{locale === "en" ? "Source link needs verification" : "Посилання на джерело потребує перевірки"}</span>;
  return <a href={safe} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}
