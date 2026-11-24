export type CanaryChannel = "email" | "telegram";
export function normalizedRecipient(channel: CanaryChannel, raw: string): string | null {
  const value = raw.trim();
  if (channel === "email") {
    if (value.length > 255 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(value)) return null;
    // Preserve local-part case; only DNS names are case-insensitive.
    const at = value.lastIndexOf("@");
    return value.slice(0, at) + "@" + value.slice(at + 1).toLowerCase();
  }
  if (/^configured:[0-9a-f]{64}$/.test(value)) return value;
  if (!/^(?:-?[1-9]\d{0,19}|@[A-Za-z][A-Za-z0-9_]{4,31})$/.test(value)) return null;
  return value.startsWith("@") ? value.toLowerCase() : value;
}
