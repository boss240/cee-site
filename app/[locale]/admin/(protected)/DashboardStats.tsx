"use client";

import { useEffect, useState } from "react";
import { Inbox, MessageSquare, Activity, Clock, Mail, Send, Bot, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Labels = {
  channelsTitle: string;
  channelsHint: string;
  channelEmail: string;
  channelTelegram: string;
  channelAi: string;
  on: string;
  off: string;
  testChannels: string;
  testing: string;
  previewClient: string;
  previewCenter: string;
  newLeads: string;
  leadsTotal: string;
  aiChats: string;
  aiSuccessRate: string;
  systemStatus: string;
  systemOk: string;
  errorLog: string;
  noErrors: string;
  apiResponseTime: string;
};

type Stats = {
  channels: { email: boolean; emailRecipients: number; telegram: boolean; ai: boolean };
  leadsTotal: number;
  leadsNew: number;
  aiTotal: number;
  aiSuccess: number;
  aiFallback: number;
  aiErrors: number;
  avgResponseMs: number;
  totalCostUsd: number;
  errorsLast24h: number;
};

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  highlight = false,
}: {
  icon: typeof Inbox;
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-[var(--color-bg)] p-5 ${
        highlight ? "border-[var(--color-brand)] shadow-lg shadow-emerald-900/10" : "border-[var(--color-line)]"
      }`}
    >
      <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
        <Icon size={16} aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-base font-medium text-[var(--color-fg-muted)]">{suffix}</span>}
      </p>
    </div>
  );
}

/**
 * Усі показники — реальні: заявки з таблиці leads, AI-метрики з ai_usage_logs.
 * Відвідуваність сайту тут не показуємо, поки не підключено веб-аналітику
 * (Plausible / GA) — вигаданих цифр на дашборді немає.
 */
export function DashboardStats({ labels }: { labels: Labels }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ email: { ok: boolean; message: string }; telegram: { ok: boolean; message: string } } | null>(null);

  async function runTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/admin/notify/test", { method: "POST" });
      setTestResult(await r.json());
    } catch {
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const successRate = stats && stats.aiTotal > 0 ? Math.round((stats.aiSuccess / stats.aiTotal) * 100) : 0;
  const hasErrors = (stats?.errorsLast24h ?? 0) > 0;

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/leads" className="block transition hover:-translate-y-0.5">
          <StatCard icon={Inbox} label={labels.newLeads} value={stats?.leadsNew ?? "—"} highlight={(stats?.leadsNew ?? 0) > 0} />
        </Link>
        <StatCard icon={Inbox} label={labels.leadsTotal} value={stats?.leadsTotal ?? "—"} />
        <StatCard icon={MessageSquare} label={labels.aiChats} value={stats?.aiTotal ?? "—"} />
        <StatCard icon={Activity} label={labels.aiSuccessRate} value={successRate} suffix="%" />
        <StatCard icon={Clock} label={labels.apiResponseTime} value={stats?.avgResponseMs ?? "—"} suffix="ms" />
      </div>

      {/* Канали спілкування з клієнтом: що ввімкнено, перевірка, прев'ю листів */}
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{labels.channelsTitle}</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{labels.channelsHint}</p>
          </div>
          <button
            type="button"
            onClick={runTest}
            disabled={testing || !stats}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)] disabled:opacity-50"
          >
            {testing ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
            {testing ? labels.testing : labels.testChannels}
          </button>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              { key: "email", icon: Mail, label: labels.channelEmail, on: stats?.channels.email ?? false, extra: stats?.channels.email ? `→ ${stats.channels.emailRecipients}` : "" },
              { key: "telegram", icon: Send, label: labels.channelTelegram, on: stats?.channels.telegram ?? false, extra: "" },
              { key: "ai", icon: Bot, label: labels.channelAi, on: stats?.channels.ai ?? false, extra: "" },
            ] as const
          ).map(({ key, icon: Icon, label, on, extra }) => {
            const result = key === "email" ? testResult?.email : key === "telegram" ? testResult?.telegram : null;
            return (
              <li key={key} className="flex items-start gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${on ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-line)] text-[var(--color-fg-placeholder)]"}`}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label} {extra && <span className="font-normal text-[var(--color-fg-muted)]">{extra}</span>}</span>
                  <span className={`mono-label block ${on ? "text-[var(--color-brand-text)]" : "text-[var(--color-fg-placeholder)]"}`}>
                    {on ? labels.on : labels.off}
                  </span>
                  {result && (
                    <span className={`mt-1 block text-xs ${result.ok ? "text-[var(--color-brand-text)]" : "text-[#b91c1c] dark:text-[#f87171]"}`}>
                      {result.message}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <a href="/api/admin/notify/preview?type=client" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--color-brand-text)] underline-offset-2 hover:underline">
            {labels.previewClient} <ExternalLink size={12} aria-hidden />
          </a>
          <a href="/api/admin/notify/preview?type=center" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--color-brand-text)] underline-offset-2 hover:underline">
            {labels.previewCenter} <ExternalLink size={12} aria-hidden />
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{labels.systemStatus}</p>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              hasErrors
                ? "bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fca5a5]"
                : "bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {hasErrors ? `${stats?.errorsLast24h} помилок за 24 год` : labels.systemOk}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
        <p className="font-semibold">{labels.errorLog}</p>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          {hasErrors
            ? `${stats?.errorsLast24h} помилок AI-провайдерів за останні 24 години (система автоматично перемкнулась на резервну модель)`
            : labels.noErrors}
        </p>
        {stats && stats.totalCostUsd > 0 && (
          <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">
            Сумарні витрати на AI: ${stats.totalCostUsd.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
