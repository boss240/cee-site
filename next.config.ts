import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Content-Security-Policy. Сайт не підвантажує сторонніх скриптів, шрифтів чи трекерів,
// тому політика жорстка: усе лише з власного домену. 'unsafe-inline' для script потрібен
// Next.js для гідрації (без nonce-режиму), для style — Tailwind/framer-motion (інлайн-стилі).
// Вихідні з'єднання з браузера — тільки на свій домен (API сайту).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS: рік, разом із піддоменами. Діє лише по HTTPS (Caddy/Vercel видають сертифікат автоматично).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// На Vercel standalone-режим не потрібен (Vercel сам трасує залежності) і в Next 16
// ламає крок onBuildComplete (ENOENT .next/next-server.js.nft.json).
// Для Docker (docker-compose / Dockerfile) standalone лишається.
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Для Docker: мінімальний самодостатній білд у .next/standalone
  output: isVercel ? undefined : "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg", "pg-native", "libpq"],
  // Шрифти для og-картинки та PDF-рахунків читаються з диска під час виконання —
  // гарантуємо, що вони потраплять у бандл serverless-функцій на Vercel.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/libpq/build/Release/addon.node", "./node_modules/libpq/build/Release/libpq.so.5"],
    "/[locale]/opengraph-image": ["./assets/fonts/**"],
    "/api/admin/invoices/[id]/pdf": ["./assets/fonts/**"],
  },
  // Блог, новини й дайджести об'єднано в один розділ «Новини і статті» (/news).
  // Старі адреси списків ведуть туди назавжди; сторінки окремих матеріалів не змінилися.
  async redirects() {
    return [
      { source: "/:locale(uk|en)/blog", destination: "/:locale/news?type=articles", permanent: true },
      { source: "/:locale(uk|en)/knowledge/digests", destination: "/:locale/news?type=digests", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
