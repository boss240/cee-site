/** Shared admin/runtime eligibility. No keys or network work in this module. */
export const APPROVED_AI_PROVIDER = "openrouter";
export const APPROVED_AI_KEY_NAME = "OPENROUTER_API_KEY_CEE";
export function approvedModel(model: { provider: string; apiKeyEnvVar: string }): boolean {
  return model.provider === APPROVED_AI_PROVIDER && model.apiKeyEnvVar === APPROVED_AI_KEY_NAME;
}
export type RoutingModel = { id: number; priority: number; isActive: boolean; provider: string; apiKeyEnvVar: string };
export type RoutingStatus = "inactive" | "provider_not_approved" | "credential_missing" | "configured_not_verified";
export function modelRoutingState(models: RoutingModel[], credentialPresent: boolean) {
  const sorted = [...models].sort((a,b) => a.priority - b.priority || a.id - b.id);
  const primary = sorted.find(m => m.isActive && approvedModel(m) && credentialPresent)?.id ?? null;
  return sorted.map(m => ({ id: m.id, runtimePrimary: m.id === primary,
    routingStatus: (!m.isActive ? "inactive" : !approvedModel(m) ? "provider_not_approved" :
      !credentialPresent ? "credential_missing" : "configured_not_verified") as RoutingStatus }));
}
export type ModelInput = {
  name?: string; provider?: string; model?: string; apiKeyEnvVar?: string; priority?: number;
  isActive?: boolean; inputCostPer1kTokens?: number; outputCostPer1kTokens?: number; systemPrompt?: string | null;
};
/** Reject unsupported settings rather than save a UI promise runtime will ignore. */
export function validateModelInput(body: unknown, creating: boolean):
  { ok: true; value: ModelInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok:false, error:"invalid_body" };
  const data = body as Record<string, unknown>;
  const allowed = ["name","provider","model","apiKeyEnvVar","priority","isActive","inputCostPer1kTokens","outputCostPer1kTokens","systemPrompt"];
  if (Object.keys(data).some(k => !allowed.includes(k))) return { ok:false, error:"unsupported_setting" };
  if (creating && ["name","provider","model","apiKeyEnvVar"].some(k => !(k in data))) return { ok:false, error:"missing_required_field" };
  const value: ModelInput = {};
  for (const key of ["name","model"] as const) {
    if (key in data) {
      const text=data[key];
      if (typeof text !== "string" || !text.trim() || text.trim().length>128) return { ok:false, error:"invalid_model_text" };
      value[key]=text.trim();
    }
  }
  if ("provider" in data) {
    if (data.provider !== APPROVED_AI_PROVIDER) return { ok:false, error:"provider_not_approved" };
    value.provider=APPROVED_AI_PROVIDER;
  }
  if ("apiKeyEnvVar" in data) {
    if (data.apiKeyEnvVar !== APPROVED_AI_KEY_NAME) return { ok:false, error:"credential_reference_not_approved" };
    value.apiKeyEnvVar=APPROVED_AI_KEY_NAME;
  }
  if ("priority" in data) {
    if (typeof data.priority !== "number" || !Number.isSafeInteger(data.priority) || data.priority<0 || data.priority>2147483647) return { ok:false, error:"invalid_priority" };
    value.priority=data.priority;
  }
  if ("isActive" in data) {
    if (typeof data.isActive !== "boolean") return { ok:false, error:"invalid_active_flag" };
    value.isActive=data.isActive;
  }
  for (const key of ["inputCostPer1kTokens","outputCostPer1kTokens"] as const) {
    if (key in data) {
      const cost=data[key];
      if (typeof cost !== "number" || !Number.isFinite(cost) || cost<0) return { ok:false, error:"invalid_cost_estimate" };
      value[key]=cost;
    }
  }
  if ("systemPrompt" in data) {
    if (data.systemPrompt !== null && (typeof data.systemPrompt !== "string" || data.systemPrompt.length>8000)) return { ok:false, error:"invalid_system_prompt" };
    value.systemPrompt=data.systemPrompt as string | null;
  }
  if (!Object.keys(value).length) return { ok:false, error:"empty_update" };
  return { ok:true, value };
}
