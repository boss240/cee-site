"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";

const field =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-fg)] transition focus:border-[var(--color-brand-dark)] focus:bg-[var(--color-bg)]";
const label = "mb-1.5 block text-sm font-semibold";

export function LoginForm({ next = "/knowledge/ask" }: { next?: string }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await signIn("credentials", { email, password, scope: "user", redirect: false });
    setBusy(false);
    if (res?.error) return setError(true);
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={label} htmlFor="email">{t("email")}</label>
        <input id="email" type="email" autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className={label} htmlFor="password">{t("password")}</label>
        <input id="password" type="password" autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-[#b91c1c] dark:text-[#f87171]">{t("loginError")}</p>}
      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50 sm:w-auto">
        {busy && <Loader2 size={16} className="animate-spin" aria-hidden />} {t("loginSubmit")}
      </button>
      <p className="text-sm text-[var(--color-fg-muted)]">
        {t("noAccount")}{" "}
        <Link href="/account/register" className="font-semibold text-[var(--color-brand-text)] underline-offset-2 hover:underline">{t("registerLink")}</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, organization, email, password, locale, website }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setBusy(false);
      return setError(d.error === "exists" ? t("existsError") : d.error === "too-many" ? t("tooManyError") : t("registerError"));
    }
    const login = await signIn("credentials", { email, password, scope: "user", redirect: false });
    setBusy(false);
    if (login?.error) return setError(t("registerError"));
    router.push("/knowledge/ask");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="relative space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">{t("name")}</label>
          <input id="name" autoComplete="name" className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="organization">{t("organization")}</label>
          <input id="organization" autoComplete="organization" className={field} value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="email">{t("email")}</label>
        <input id="email" type="email" autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className={label} htmlFor="password">{t("password")}</label>
        <input id="password" type="password" autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">{t("passwordHint")}</p>
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <label className="flex items-start gap-3 text-sm text-[var(--color-fg-muted)]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        <span>
          {t("consent")}{" "}
          <Link href="/privacy" className="underline underline-offset-2">{t("privacyLink")}</Link>.
        </span>
      </label>
      {error && <p className="text-sm text-[#b91c1c] dark:text-[#f87171]">{error}</p>}
      <button type="submit" disabled={busy || !consent} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50 sm:w-auto">
        {busy && <Loader2 size={16} className="animate-spin" aria-hidden />} {t("registerSubmit")}
      </button>
      <p className="text-sm text-[var(--color-fg-muted)]">
        {t("haveAccount")}{" "}
        <Link href="/account/login" className="font-semibold text-[var(--color-brand-text)] underline-offset-2 hover:underline">{t("loginLink")}</Link>
      </p>
    </form>
  );
}

export function SignOutButton({ label: text }: { label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { signOut } = await import("next-auth/react");
        await signOut({ callbackUrl: "/" });
      }}
      className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)] disabled:opacity-50"
    >
      {text}
    </button>
  );
}
