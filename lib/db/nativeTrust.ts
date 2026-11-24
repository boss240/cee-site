import { getCACertificates } from "node:tls";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let certificateFile: string | undefined;

/** Export the existing Node TLS trust set, never extend or replace it.
 * Public CA certificates only; the private temporary directory prevents tampering.
 * Each process retains its bundle while its pool may create new connections.
 */
export function nodeTrustBundle(): string {
  if (certificateFile) return certificateFile;
  let directory: string | undefined;
  try {
    const certificates = getCACertificates("default");
    if (!certificates.length) throw new Error("empty_trust_store");
    directory = mkdtempSync(join(tmpdir(), "cee-pg-ca-"));
    const file = join(directory, "roots.pem");
    writeFileSync(file, certificates.join("\n"), { flag: "wx", mode: 0o600 });
    const ownDirectory = directory;
    process.once("exit", () => {
      try { rmSync(ownDirectory, { recursive: true, force: true }); } catch { /* Ephemeral public CA bundle only. */ }
    });
    certificateFile = file;
    return file;
  } catch {
    if (directory) {
      try { rmSync(directory, { recursive: true, force: true }); } catch { /* Preserve original fail-closed result. */ }
    }
    throw new Error("native_trust_bundle_unavailable");
  }
}
