import { databaseConfig } from "./connection";

/** Candidate only: use with libpq >= 17 and independently verified native packaging.
 * No fallback to JS/prefer is permitted. CA paths are explicit: the app supplies its exported Node default trust set;
 * isolated harnesses may supply their own synthetic CA. No environment CA override.
 */
export function nativeDatabaseConfig(
  raw: string | undefined,
  env: Record<string, string | undefined> = process.env,
  rootCertificate = "system",
) {
  if (!raw) throw new Error("database_url_required");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("invalid_database_url"); }
  const binding = url.searchParams.getAll("channel_binding");
  if (binding.length !== 1 || binding[0] !== "require") throw new Error("strict_channel_binding_required");
  if ((env.DATABASE_TLS_MODE ?? "verify-full") !== "verify-full") throw new Error("strict_channel_binding_requires_tls");
  // Existing allowlist validates every other option; do not forward arbitrary libpq options.
  url.searchParams.delete("channel_binding");
  const config = databaseConfig(url.toString(), env);
  if (!config.ssl) throw new Error("strict_channel_binding_requires_tls");
  if (!config.password) throw new Error("explicit_database_password_required");
  // libpq uses these environment defaults only when the corresponding explicit
  // connection option is absent. The validated URI pins all four nonempty values.
  // PGHOST_UNPOOLED is integration metadata, not a libpq connection option.
  // Never delete/change process.env: other pools and concurrent requests share it.
  if ([config.host, config.user, config.password, config.database].some(value => value.includes("\0"))) {
    throw new Error("invalid_database_identity");
  }
  const redundantIntegrationDefaults = new Set(["PGHOST", "PGUSER", "PGPASSWORD", "PGDATABASE", "PGHOST_UNPOOLED"]);
  if (Object.keys(env).some(key =>
    (key.startsWith("PG") && !redundantIntegrationDefaults.has(key) ||
      ["SSL_CERT_FILE", "SSL_CERT_DIR"].includes(key)) && env[key])) {
    throw new Error("native_ambient_configuration_not_allowed");
  }
  url.search = "";
  url.searchParams.set("application_name", config.application_name);
  url.searchParams.set("sslmode", "verify-full");
  url.searchParams.set("sslrootcert", rootCertificate);
  url.searchParams.set("channel_binding", "require");
  url.searchParams.set("sslcertmode", "disable");
  url.searchParams.set("gssencmode", "disable");
  url.searchParams.set("connect_timeout", "10");
  return { ...config, nativeConnectionString: url.toString(), connectionTimeoutMillis: 10_000 };
}

/** Match Drizzle node-postgres parsers per pool: native ignores per-query overrides. */
export function nativeDrizzleTypes(base: { getTypeParser: (oid: number, format?: "text" | "binary") => (value: string) => unknown }) {
  const identity = new Set([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182]);
  return { getTypeParser(oid: number, format?: "text" | "binary") {
    return identity.has(oid) ? (value: string) => value : base.getTypeParser(oid, format);
  } };
}
