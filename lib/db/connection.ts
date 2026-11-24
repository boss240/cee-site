import { checkServerIdentity } from "node:tls";

/** One policy for app, migration CLI and Drizzle. No URL-derived TLS overrides. */
export function databaseConfig(
  raw: string | undefined,
  env: Record<string, string | undefined> = process.env,
  options: { allowPreviewChannelBindingPrefer?: boolean } = {},
) {
  if (!raw) throw new Error("database_url_required");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("invalid_database_url"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("invalid_database_protocol");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host.includes("%") || url.hash) throw new Error("invalid_database_target");
  const mode = env.DATABASE_TLS_MODE ?? "verify-full";
  if (!["verify-full", "local"].includes(mode)) throw new Error("invalid_database_tls_mode");
  const local = mode === "local";
  if (local && !["localhost", "127.0.0.1", "::1"].includes(host)) throw new Error("local_database_requires_loopback");
  const seen = new Set<string>();
  let enableChannelBinding = false;
  for (const [key, value] of url.searchParams) {
    if (seen.has(key)) throw new Error("duplicate_database_url_option");
    seen.add(key);
    if (key === "sslmode" && (local ? value === "disable" : ["require", "verify-ca", "verify-full"].includes(value))) continue;
    if (key === "application_name") continue;
    // Explicitly approved compatibility policy for this isolated Vercel Preview.
    // pg only supports prefer, not require. Never apply this policy to CLI or production.
    if (key === "channel_binding" && value === "require" && !local &&
        options.allowPreviewChannelBindingPrefer === true &&
        env.VERCEL === "1" && env.VERCEL_ENV === "preview") {
      enableChannelBinding = true;
      continue;
    }
    throw new Error("unsupported_database_url_option");
  }
  let user: string, password: string, database: string;
  try { user = decodeURIComponent(url.username); password = decodeURIComponent(url.password); database = decodeURIComponent(url.pathname.slice(1)); }
  catch { throw new Error("invalid_database_url"); }
  if (!user || !database) throw new Error("explicit_database_identity_required");
  return {
    host, port: Number(url.port || 5432), user, password, database,
    application_name: url.searchParams.get("application_name") ?? "cee-site",
    ...(enableChannelBinding ? { enableChannelBinding: true } : {}),
    ssl: local ? false as const : {
      rejectUnauthorized: true,
      // Explicit identity check also covers IP hosts (pg only supplies SNI for DNS).
      checkServerIdentity: (_hostname: string, cert: Parameters<typeof checkServerIdentity>[1]) => checkServerIdentity(host, cert),
    },
  };
}
