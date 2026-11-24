/**
 * Automatic drafts are disabled: a public retrieval miss must never cause a
 * background provider charge or database write. Keep the inert export for old
 * internal callers; re-enabling requires an explicit, budgeted editorial flow.
 * No environment flag can enable this path.
 */
export async function draftKnowledgeCandidate(_question: string, _locale: "uk" | "en"): Promise<void> {
  // Intentionally no side effects, including for concurrent/repeated calls.
  void _question;
  void _locale;
}
