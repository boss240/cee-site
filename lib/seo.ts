import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * canonical + hreflang для сторінки. Шлях — без префікса локалі ("/osbb", "/blog/slug").
 * Абсолютні URL збираються з metadataBase (NEXT_PUBLIC_APP_URL) у layout.
 */
export async function alternatesFor(path: string) {
  const locale = await getLocale();
  const p = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `/${l}${p}`;
  languages["x-default"] = `/${routing.defaultLocale}${p}`;
  return { canonical: `/${locale}${p}`, languages };
}
