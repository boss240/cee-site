import pg from "pg";
import { databaseConfig } from "./connection";
import { nativeDatabaseConfig, nativeDrizzleTypes } from "./nativeConnection";
import { nodeTrustBundle } from "./nativeTrust";

/** Require means require in every environment. No native-to-JS fallback. */
export function createDatabasePool(raw: string | undefined, env: Record<string, string | undefined> = process.env): pg.Pool {
  let bindingRequested = false;
  if (raw) {
    try { bindingRequested = new URL(raw).searchParams.has("channel_binding"); }
    catch { throw new Error("invalid_database_url"); }
  }
  const max = Number(env.DATABASE_POOL_MAX ?? 5);
  if (bindingRequested) {
    // Validate before reading trust or loading native dependencies. Other binding modes reject.
    const config = nativeDatabaseConfig(raw, env);
    const native = pg.native;
    if (!native) throw new Error("native_database_driver_unavailable");
    const rootCertificate = nodeTrustBundle();
    return new native.Pool({ ...nativeDatabaseConfig(raw, env, rootCertificate),
      host: config.host, max, types: nativeDrizzleTypes(pg.types) });
  }
  // URLs without a binding requirement keep the existing certificate-verifying JS policy.
  return new pg.Pool({ ...databaseConfig(raw, env), max });
}
