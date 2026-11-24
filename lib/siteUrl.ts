/** Public origin only: never log the supplied value (it may be misconfigured). */
export function siteOrigin(env: NodeJS.ProcessEnv = {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  // Explicit access is intentional: Next inlines the build-time public origin.
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}): string {
  // Only explicit local development/test may use localhost or HTTP.
  // Every hosted environment (including Preview) must supply its public origin.
  const localDevelopment = !env.VERCEL && !env.VERCEL_ENV &&
    (env.NODE_ENV === "development" || env.NODE_ENV === "test");
  const requirePublicHttps = !localDevelopment;
  const raw = env.NEXT_PUBLIC_APP_URL;
  if (!raw) {
    if (requirePublicHttps) throw new Error("NEXT_PUBLIC_APP_URL is required outside local development/test");
    return "http://localhost:3000";
  }
  try {
    const url = new URL(raw);
    if (raw !== raw.trim() || url.username || url.password || url.search || url.hash ||
        url.pathname !== "/" || !["https:", "http:"].includes(url.protocol)) throw new Error();
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (requirePublicHttps && (url.protocol !== "https:" || !host.includes(".") || host.endsWith(".localhost") ||
        host.endsWith(".local") || /^[\d.]+$/.test(host) || host.includes(":"))) throw new Error();
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid public HTTPS origin outside local development/test");
  }
}

export function isPreviewDeployment(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL_ENV === "preview";
}
