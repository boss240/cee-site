/** Pure server-side routing core, not a provider integration or an authorization UI.
 * Caller supplies reviewed server-owned approvals and a shared durable reservation gate.
 * Defaults preserve one external attempt. Never pass request-body flags as policy.
 * No credential, SDK, network, database, refund, settlement or circuit implementation.
 */
export type FailureClass =
  | "model_unavailable" | "account_credits" | "key_limit" | "in_flight_budget"
  | "capacity" | "auth" | "security" | "invalid_request" | "unknown";
export type ObservedFailure = {
  status?: number;
  /** Only the bounded, allowlisted metadata field, never a raw upstream error body. */
  limitSource?: "openrouter_credits" | "openrouter_key_limit" | "openrouter_in_flight_budget";
  modelUnavailable?: boolean;
  /** Adapter must prove pre-dispatch rejection; HTTP status alone is insufficient. */
  workNotStarted?: boolean;
};
export function classifyFailure(failure: ObservedFailure): FailureClass {
  if (failure.status === 401) return "auth";
  if (failure.status === 403) return "security";
  if (failure.status === 400 || failure.status === 422) return "invalid_request";
  if (failure.status === 402) {
    if (failure.limitSource === "openrouter_credits") return "account_credits";
    if (failure.limitSource === "openrouter_key_limit") return "key_limit";
    if (failure.limitSource === "openrouter_in_flight_budget") return "in_flight_budget";
    return "unknown";
  }
  if ((failure.status === 404 || failure.status === 503) && failure.modelUnavailable === true) return "model_unavailable";
  if (failure.status === 429 || failure.status === 503) return "capacity";
  return "unknown";
}
export type AdapterOutcome = { ok: true; text: string } | { ok: false; failure: ObservedFailure };
export type Adapter = {
  enabled: boolean;
  configured: boolean;
  invoke: (request: { input: string; signal: AbortSignal; maxOutputTokens: number; reservation: string }) => Promise<AdapterOutcome>;
};
export type FailoverPolicy = {
  /** Both false unless separately authorized; five tiers are not five attempts. */
  multiAttemptApproved?: boolean;
  independentProviderApproved?: boolean;
  allowSecondAfterUnknown?: boolean;
  maxAttempts?: 1 | 2;
  totalTimeoutMs?: number;
  perAttemptTimeoutMs?: number;
};
export type RouteResult = {
  tier: 1 | 2 | 3 | 4 | 5;
  source: "openrouter" | "independent" | "reference" | "client-local";
  text: string | null;
  attempts: number;
  reason: FailureClass | "quota_unavailable" | "database_unavailable" | "not_configured" | "deadline" | "input_limit" | "policy_invalid" | null;
};
export type RouteDependencies = {
  primary?: Adapter;
  sameGateway?: Adapter;
  independent?: Adapter;
  /** Same durable 20/24h gate for EVERY attempt; rejected/unknown work stays charged. */
  reserve: () => Promise<string | null>;
  reference: () => string;
};
const MAX_TOTAL_MS = 20_000;
const MAX_INPUT_BYTES = 24_000;
const MAX_OUTPUT_TOKENS = 1_500;
const eligible = (adapter?: Adapter): adapter is Adapter => !!adapter && adapter.enabled === true && adapter.configured === true;

/** An abort bounds our wait, not remote billing. No reservation is released here. */
async function bounded<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<{ done: true; value: T } | { done: false }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<{ done: false }>(resolve => {
    timer = setTimeout(() => { controller.abort(); resolve({ done: false }); }, ms);
  });
  try {
    const completed = Promise.resolve().then(() => work(controller.signal)).then(
      value => ({ done: true as const, value }),
      () => ({ done: false as const }),
    );
    return await Promise.race([completed, expired]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function runFailover(input: string, dependencies: RouteDependencies, policy: FailoverPolicy = {}): Promise<RouteResult> {
  let attempts = 0;
  const local = (reason: RouteResult["reason"]): RouteResult => {
    try {
      const text = dependencies.reference();
      if (typeof text !== "string" || !text.trim()) throw new Error("Reference unavailable");
      return { tier: 4, source: "reference", text, attempts, reason };
    } catch {
      return { tier: 5, source: "client-local", text: null, attempts, reason };
    }
  };
  const totalMs = policy.totalTimeoutMs ?? MAX_TOTAL_MS;
  const attemptMs = policy.perAttemptTimeoutMs ?? 10_000;
  if (!Number.isInteger(totalMs) || totalMs < 1 || totalMs > MAX_TOTAL_MS ||
      !Number.isInteger(attemptMs) || attemptMs < 1 || attemptMs > totalMs ||
      (policy.maxAttempts !== undefined && policy.maxAttempts !== 1 && policy.maxAttempts !== 2)) return local("policy_invalid");
  if (typeof input !== "string" || !input.trim() || new TextEncoder().encode(input).length > MAX_INPUT_BYTES) return local("input_limit");
  const maxAttempts = policy.multiAttemptApproved === true ? (policy.maxAttempts ?? 2) : 1;
  const deadline = performance.now() + totalMs;
  const invoked = new Set<Adapter>();
  let tier: 1 | 2 | 3 = 1;
  let adapter = dependencies.primary;
  if (!eligible(adapter)) {
    // Missing primary configuration isn't permission to enable a different provider.
    if (policy.independentProviderApproved === true && eligible(dependencies.independent)) {
      tier = 3; adapter = dependencies.independent;
    } else return local("not_configured");
  }
  for (;;) {
    if (invoked.has(adapter)) return local("not_configured");
    const remaining = deadline - performance.now();
    if (remaining <= 0) return local("deadline");
    const reservation = await bounded(() => dependencies.reserve(), remaining);
    if (!reservation.done || typeof reservation.value !== "string" || !reservation.value) return local("quota_unavailable");
    const reservationId = reservation.value;
    // Reservation may have committed late: retain it, but do not start expired work.
    const available = deadline - performance.now();
    if (available <= 0) return local("deadline");
    invoked.add(adapter);
    attempts += 1;
    const result = await bounded(signal => adapter!.invoke({ input, signal, maxOutputTokens: MAX_OUTPUT_TOKENS, reservation: reservationId }), Math.min(attemptMs, available));
    if (result.done && result.value?.ok === true && typeof result.value.text === "string" && result.value.text.trim()) {
      return { tier, source: tier === 3 ? "independent" : "openrouter", text: result.value.text.trim(), attempts, reason: null };
    }
    const failure = result.done && result.value?.ok === false && result.value.failure && typeof result.value.failure === "object" ? result.value.failure : {};
    const reason = classifyFailure(failure);
    // Configuration, permission, moderation and spending caps are never bypassed.
    if (["auth", "security", "invalid_request", "key_limit"].includes(reason)) return local(reason);
    if (attempts >= maxAttempts || tier === 3) return local(reason);
    const knownNotStarted = failure.workNotStarted === true;
    if (!knownNotStarted && policy.allowSecondAfterUnknown !== true) return local(reason);
    if (tier === 1 && reason === "model_unavailable" && eligible(dependencies.sameGateway)) {
      tier = 2; adapter = dependencies.sameGateway;
    } else if (policy.independentProviderApproved === true && eligible(dependencies.independent)) {
      tier = 3; adapter = dependencies.independent;
    } else return local(reason);
  }
}

/** Ordered production integration seam. This is server configuration, never a
 * request-body option. The caller must separately authorize credentials, data
 * destinations, second/third-attempt cost and any unknown-outcome continuation.
 */
export type OrderedProvider = "openrouter" | "openai" | "anthropic";
export type Admission = { id: string };
export type OrderedAdapter<A extends Admission = Admission> = Omit<Adapter, "invoke"> & {
  provider: OrderedProvider;
  invoke: (request: { input: string; signal: AbortSignal; maxOutputTokens: number; reservation: string; admission: A }) => Promise<AdapterOutcome>;
};
export type OrderedPolicy = {
  multiAttemptApproved?: boolean;
  independentProviderApproved?: boolean;
  allowNextAfterUnknown?: boolean;
  /** Three is allowed only when explicitly selected AND multiAttemptApproved. */
  maxAttempts?: 1 | 2 | 3;
  totalTimeoutMs?: number;
  perAttemptTimeoutMs?: number;
};
export type OrderedReservationRequest = {
  provider: OrderedProvider;
  inputBytes: number;
  maxOutputTokens: number;
  attemptNumber: number;
};
export type OrderedDependencies<A extends Admission = Admission> = {
  adapters: readonly OrderedAdapter<A>[];
  /** MUST atomically gate shared20 attempts,2unsettled and shared USD2/24h backup
   * allowance. No per-provider independent counters and no refund on failure.
   * This pure engine never implements, bypasses or resets those durable gates.
   */
  reserve: (request: OrderedReservationRequest) => Promise<A | null>;
  reference: () => string;
};
export type OrderedRouteResult = RouteResult & { provider: OrderedProvider | null };
const PROVIDER_ORDER: readonly OrderedProvider[] = ["openrouter", "openai", "anthropic"];

/** At most one invocation per provider, in fixed approved order. No same-provider
 * retry, SDK call, credential read or settlement. A held/unknown primary remains
 * held even when a later provider succeeds. Every invocation needs a unique ID
 * from the same durable reservation gate. Missing earlier providers may be skipped.
 */
async function runOrderedChain<A extends Admission>(input: string, dependencies: OrderedDependencies<A>, policy: OrderedPolicy, initialFailure?: ObservedFailure): Promise<OrderedRouteResult> {
  let attempts = initialFailure === undefined ? 0 : 1;
  const local = (reason: RouteResult["reason"]): OrderedRouteResult => {
    try {
      const text = dependencies.reference();
      if (typeof text !== "string" || !text.trim()) throw new Error("Reference unavailable");
      return { tier: 4, source: "reference", text, attempts, reason, provider: null };
    } catch {
      return { tier: 5, source: "client-local", text: null, attempts, reason, provider: null };
    }
  };
  const totalMs = policy.totalTimeoutMs ?? MAX_TOTAL_MS;
  const attemptMs = policy.perAttemptTimeoutMs ?? 6_000;
  if (!Number.isInteger(totalMs) || totalMs < 1 || totalMs > MAX_TOTAL_MS ||
      !Number.isInteger(attemptMs) || attemptMs < 1 || attemptMs > totalMs ||
      (policy.maxAttempts !== undefined && ![1, 2, 3].includes(policy.maxAttempts))) return local("policy_invalid");
  if (typeof input !== "string" || !input.trim()) return local("input_limit");
  const inputBytes = new TextEncoder().encode(input).length;
  if (inputBytes > MAX_INPUT_BYTES) return local("input_limit");
  // Reject misordered/duplicate providers even if a duplicate is disabled. This
  // catches registry mistakes rather than disguising them as availability faults.
  if (!Array.isArray(dependencies.adapters)) return local("policy_invalid");
  let previous = -1;
  const callbacks = new Set<OrderedAdapter<A>["invoke"]>();
  for (const adapter of dependencies.adapters) {
    if (!adapter || typeof adapter !== "object") return local("policy_invalid");
    const position = PROVIDER_ORDER.indexOf(adapter.provider);
    if (position < 0 || position <= previous || typeof adapter.invoke !== "function" || callbacks.has(adapter.invoke)) return local("policy_invalid");
    previous = position;
    callbacks.add(adapter.invoke);
  }
  const maxAttempts = policy.multiAttemptApproved === true ? (policy.maxAttempts ?? 1) : 1;
  const deadline = performance.now() + totalMs;
  const reservations = new Set<string>();
  let lastReason: RouteResult["reason"] = initialFailure === undefined ? "not_configured" : classifyFailure(initialFailure);
  if (initialFailure !== undefined) {
    if (["auth", "security", "invalid_request", "key_limit"].includes(lastReason)) return local(lastReason);
    if (initialFailure.workNotStarted !== true && policy.allowNextAfterUnknown !== true) return local(lastReason);
  }
  for (const adapter of dependencies.adapters) {
    if (initialFailure !== undefined && adapter.provider === "openrouter") return local("policy_invalid");
    if (adapter.enabled !== true || adapter.configured !== true) continue;
    if (adapter.provider !== "openrouter" && policy.independentProviderApproved !== true) continue;
    if (attempts >= maxAttempts) return local(lastReason);
    const remaining = deadline - performance.now();
    if (remaining <= 0) return local("deadline");
    const reservation = await bounded(() => dependencies.reserve({
      provider: adapter.provider, inputBytes, maxOutputTokens: MAX_OUTPUT_TOKENS, attemptNumber: attempts + 1,
    }), remaining);
    if (!reservation.done || !reservation.value || typeof reservation.value !== "object" || typeof reservation.value.id !== "string" || !reservation.value.id || reservations.has(reservation.value.id)) return local("quota_unavailable");
    const admission = reservation.value;
    const reservationId = admission.id;
    reservations.add(reservationId);
    // A late or uncertain reservation is never refunded, nor reused for another call.
    const available = deadline - performance.now();
    if (available <= 0) return local("deadline");
    attempts += 1;
    const result = await bounded<AdapterOutcome>(signal => adapter.invoke({ input, signal, maxOutputTokens: MAX_OUTPUT_TOKENS, reservation: reservationId, admission }), Math.min(attemptMs, available));
    if (result.done && result.value?.ok === true && typeof result.value.text === "string" && result.value.text.trim()) {
      return { tier: adapter.provider === "openrouter" ? 1 : 3,
        source: adapter.provider === "openrouter" ? "openrouter" : "independent",
        text: result.value.text.trim(), attempts, reason: null, provider: adapter.provider };
    }
    const failure = result.done && result.value?.ok === false && result.value.failure && typeof result.value.failure === "object" ? result.value.failure : {};
    lastReason = classifyFailure(failure);
    if (["auth", "security", "invalid_request", "key_limit"].includes(lastReason)) return local(lastReason);
    if (failure.workNotStarted !== true && policy.allowNextAfterUnknown !== true) return local(lastReason);
  }
  return local(lastReason);
}

/** Whole-chain seam for simulations/future integrations; primary is invoked here. */
export async function runOrderedFailover<A extends Admission>(input: string, dependencies: OrderedDependencies<A>, policy: OrderedPolicy = {}): Promise<OrderedRouteResult> {
  return runOrderedChain(input, dependencies, policy);
}

export type PrimaryOutcome =
  | { kind: "provider"; failure: ObservedFailure }
  | { kind: "input_limit" | "quota_unavailable" | "database_unavailable" };

/** Integration seam AFTER existing generateReserved has already attempted primary.
 * Never reserves or re-invokes OpenRouter. Primary's durable hold stays untouched.
 * Dependencies must contain backups only. A non-provider failure permits no call.
 */
export async function runOrderedBackups<A extends Admission>(input: string, primaryOutcome: PrimaryOutcome, dependencies: OrderedDependencies<A>, policy: OrderedPolicy = {}): Promise<OrderedRouteResult> {
  if (primaryOutcome.kind === "provider") {
    if (dependencies.adapters.some(adapter => adapter.provider === "openrouter")) {
      return runOrderedChain(input, { ...dependencies, adapters: [] }, { maxAttempts: 1 }, primaryOutcome.failure);
    }
    return runOrderedChain(input, dependencies, policy, primaryOutcome.failure);
  }
  const reason = ["input_limit", "quota_unavailable", "database_unavailable"].includes(primaryOutcome.kind) ? primaryOutcome.kind : "policy_invalid";
  try {
    const text = dependencies.reference();
    if (typeof text !== "string" || !text.trim()) throw new Error("Reference unavailable");
    return { tier: 4, source: "reference", text, attempts: 0, reason, provider: null };
  } catch {
    return { tier: 5, source: "client-local", text: null, attempts: 0, reason, provider: null };
  }
}
