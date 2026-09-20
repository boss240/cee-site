import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIAssistantWidget } from "@/components/ui/AIAssistantWidget";
import { PrivacyNotice } from "@/components/ui/PrivacyNotice";
import { routing } from "@/i18n/routing";
import { getPublicContacts } from "@/lib/publicProfile";
import "../globals.css";

// Примітка: свідомо НЕ використовуємо next/font/google (Inter), щоб збірка
// не залежала від мережевого доступу до fonts.googleapis.com під час build.
// Замість цього — системний sans-serif стек (див. --font-sans у globals.css),
// який виглядає майже ідентично і не має накладних витрат на завантаження.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL((process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")),
    title: {
      default: t("titleDefault"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    openGraph: {
      title: t("titleDefault"),
      description: t("description"),
      locale: locale === "uk" ? "uk_UA" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("titleDefault"),
      description: t("description"),
    },
    alternates: {
      languages: {
        uk: "/uk",
        en: "/en",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Header" });
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  const contacts = await getPublicContacts();
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  // Структуровані дані для локальної видачі Google (назва, адреса, телефон беруться з профілю в адмінці)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#organization`,
    name: contacts.legalName || tMeta("titleDefault"),
    description: tMeta("description"),
    url: `${siteUrl}/${locale}`,
    logo: `${siteUrl}/icon.png`,
    image: `${siteUrl}/${locale}/opengraph-image`,
    ...(contacts.phone ? { telephone: contacts.phone } : {}),
    ...(contacts.email ? { email: contacts.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: contacts.address || undefined,
      addressLocality: locale === "uk" ? "Ладижин" : "Ladyzhyn",
      addressRegion: locale === "uk" ? "Вінницька область" : "Vinnytsia Oblast",
      addressCountry: "UA",
    },
    areaServed: locale === "uk" ? "Вінницька область, Україна" : "Vinnytsia Oblast, Ukraine",
    availableLanguage: ["uk", "en"],
  };

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col bg-[var(--color-bg)] font-sans">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <NextIntlClientProvider>
          <ThemeProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--color-bg)] focus:px-4 focus:py-2 focus:shadow"
            >
              {t("skipToContent")}
            </a>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <AIAssistantWidget />
            <PrivacyNotice />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
