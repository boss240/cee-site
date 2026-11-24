import type { ObservedFailure } from "./failoverPolicy";

/** Read only allowlisted classification fields from an already-buffered SDK error.
 * No raw message, prompt, header or provider metadata is returned or logged. */
export function primaryFailure(error: unknown, observedStatus: number | null): ObservedFailure {
  const status = observedStatus ?? undefined;
  if ([400, 401, 403, 422].includes(status ?? 0)) return { status };
  const roots: unknown[] = [error];
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    roots.push(record.data);
    if (typeof record.responseBody === "string" && record.responseBody.length <= 8192) {
      try { roots.push(JSON.parse(record.responseBody)); } catch { /* Unknown stays closed below. */ }
    } else if (record.responseBody && typeof record.responseBody === "object") roots.push(record.responseBody);
  }
  let limitSource: ObservedFailure["limitSource"];
  let blockedStatus: number | undefined;
  let preDispatchProof = false;
  for (const root of roots) {
    if (!root || typeof root !== "object") continue;
    const outer = root as Record<string, unknown>;
    const inner = outer.error && typeof outer.error === "object" ? outer.error as Record<string, unknown> : outer;
    if ([400,401,403,422].includes(Number(inner.code))) blockedStatus = Number(inner.code);
    if (["content_filter", "permission_denied", "image_content_policy_violation"].includes(String(inner.code))) blockedStatus = 403;
    if (["invalid_prompt", "context_length_exceeded"].includes(String(inner.code))) blockedStatus = 400;
    if (inner.code === "invalid_api_key") blockedStatus = 401;
    const metadata = inner.metadata;
    if (metadata && typeof metadata === "object") {
      const value = (metadata as Record<string,unknown>).limit_source;
      const reason = (metadata as Record<string,unknown>).reason;
      if ((inner.code === 402 || inner.code === "insufficient_quota") &&
          ((value === "openrouter_in_flight_budget" && reason === "in_flight_budget_exhausted") ||
           (value === "openrouter_credits" && reason === "weight_exceeds_budget"))) preDispatchProof = true;
      if (value === "openrouter_key_limit" || value === "openrouter_guardrail_budget" || value === "openrouter_workspace_budget") blockedStatus = 403;
      if (value === "openrouter_credits" || value === "openrouter_in_flight_budget") limitSource = value;
    }
  }
  if (blockedStatus) return { status: blockedStatus };
  // Ambiguous 402 may be a key spending restriction, not account exhaustion.
  // Never use the backup to bypass an unidentified spending restriction.
  if (status === 402 && !limitSource) return { status: 403 };
  return { status, ...(limitSource ? { limitSource } : {}),
    ...(status === 402 && limitSource && preDispatchProof ? { workNotStarted: true } : {}) };
}
