import { backupConfiguration } from "./backupConfiguration";
import { runOrderedBackups, type ObservedFailure } from "./failoverPolicy";
import { quoteFor, invokeBackup } from "./backupProviders";
import { reserveBackupCall, settleResolvedBackupCall, type BackupReservation } from "./backupBudget";

/** Chat-only continuation. Primary has already been charged once. No primary
 * retry, no double reservation, no automatic reconciliation or provider key logs.
 * env is server-owned; this function is never given request-body options. */
export async function backupAfterPrimaryFailure(
  input: string,
  failure: ObservedFailure,
  remainingMs: number,
): Promise<{ text: string; modelName: string } | null> {
  const configuration = backupConfiguration(process.env);
  if (!configuration.enabled || !Number.isInteger(remainingMs) || remainingMs < 1) return null;
  const time = Math.min(20_000, remainingMs);
  const providers = ["openai", "anthropic"] as const;
  const adapters = providers.map(provider => ({
    provider,
    enabled: true,
    configured: provider === "openai" ? configuration.openaiConfigured : configuration.anthropicConfigured,
    invoke: async (request: {input: string; signal: AbortSignal; maxOutputTokens: number; admission: BackupReservation}) => {
      const apiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return { ok: false as const, failure: { workNotStarted: true } };
      const outcome = await invokeBackup({
        provider, input: request.input, signal: request.signal, maxOutputTokens: request.maxOutputTokens,
        reservation: request.admission, apiKey, enabled: true,
      });
      if (outcome.ok) {
        // Failure to settle safely retains BOTH holds, but does not lose an answer.
        await settleResolvedBackupCall(request.admission, {
          kind: "verified_final_usage", actualCostMicroUSD: outcome.actualCostMicroUSD,
        });
      }
      return outcome;
    },
  }));
  const result = await runOrderedBackups<BackupReservation>(input, { kind: "provider", failure }, {
    adapters,
    reserve: async ({provider}) => {
      if (provider !== "openai" && provider !== "anthropic") return null;
      const quote = quoteFor(provider);
      return quote ? reserveBackupCall(quote) : null;
    },
    reference: () => "reference",
  }, {
    multiAttemptApproved: true, independentProviderApproved: true,
    allowNextAfterUnknown: true, maxAttempts: configuration.maxAttempts,
    totalTimeoutMs: time, perAttemptTimeoutMs: Math.min(6_000, time),
  });
  if (result.source !== "independent" || !result.text) return null;
  return { text: result.text, modelName: result.provider === "openai" ? "OpenAI · GPT-5.6 Luna" : "Anthropic · Claude Haiku 5.5" };
}
