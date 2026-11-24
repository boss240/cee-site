"use client";
import { useRef, useState } from "react";

type Labels = {title: string; warning: string; test: string; running: string; success: string; accounting_unresolved: string; unknown: string; denied: string; unconfigured: string; refusal: string};
type Status = "success" | "accounting_unresolved" | "unknown" | "denied" | "unconfigured" | "refusal";
export function BackupConnectionTests({enabled, openaiConfigured, anthropicConfigured, labels}: {
  enabled: boolean; openaiConfigured: boolean; anthropicConfigured: boolean; labels: Labels;
}) {
  const lock = useRef(false);
  const [running, setRunning] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [result, setResult] = useState<{provider: string; status: Status} | null>(null);
  async function test(provider: "openai" | "anthropic") {
    if (lock.current || uncertain || !enabled) return;
    lock.current = true;
    setRunning(provider);
    setResult(null);
    let status: Status = "unknown";
    try {
      const response = await fetch("/api/admin/ai-backups/test-connection", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({provider}), signal: AbortSignal.timeout(11_000), cache: "no-store",
      });
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "status" in data &&
          ["success", "accounting_unresolved", "denied", "unconfigured", "unknown", "refusal"].includes(String(data.status))) {
        status = data.status as Status;
        if (status === "success" && !response.ok) status = "unknown";
      }
    } catch { /* Unknown may still have incurred cost: never retry automatically. */ }
    finally {
      setResult({provider, status});
      if (status === "unknown" || status === "refusal" || status === "accounting_unresolved") setUncertain(true);
      setRunning(null);
      lock.current = false;
    }
  }
  return <section className="my-4 rounded-lg border p-4" aria-label={labels.title}>
    <h2 className="font-semibold">{labels.title}</h2>
    <p className="my-2 text-sm text-[var(--color-fg-muted)]">{labels.warning}</p>
    <div className="flex flex-wrap gap-2">
      {(["openai", "anthropic"] as const).map(provider => <button key={provider} type="button"
        disabled={!enabled || !(provider === "openai" ? openaiConfigured : anthropicConfigured) || Boolean(running) || uncertain}
        onClick={() => void test(provider)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">
        {running === provider ? labels.running : labels.test} {provider === "openai" ? "OpenAI" : "Anthropic"}
      </button>)}
    </div>
    {result && <p className="mt-3 text-sm" role="status">{result.provider}: {labels[result.status]}</p>}
  </section>;
}
