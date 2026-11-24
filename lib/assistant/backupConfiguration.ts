/** Server-owned activation only. Never derive these settings from request JSON,
 * cookies, headers, editable model price estimates or browser state. */
export function backupConfiguration(env: Record<string, string | undefined>) {
  return Object.freeze({
    enabled: env.CEE_AI_BACKUP_ENABLED === "true",
    openaiConfigured: Boolean(env.OPENAI_API_KEY),
    anthropicConfigured: Boolean(env.ANTHROPIC_API_KEY),
    maxAttempts: 3 as const,
    rollingBackupBudgetMicroUSD: 2_000_000,
    globalAttemptsPer24Hours: 20,
    maxUnsettled: 2,
  });
}
