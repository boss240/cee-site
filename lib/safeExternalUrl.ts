/** URL contract for outbound source links, not an SSRF/network access policy. */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 500 || !/^https?:\/\/[^/?#]/i.test(candidate)) return null;
  // Browsers silently repair these characters; do not accept ambiguous source addresses.
  if (/[\u0000-\u0020\u007f\\]/.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    if (!url.hostname || url.username || url.password || !["http:", "https:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}
