"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { usePathname } from "@/i18n/navigation";

type Errors = Partial<Record<"name" | "contact" | "message", string>>;
type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm({ initialMessage = "", initialSegment }: { initialMessage?: string; initialSegment?: string } = {}) {
  const t = useTranslations("ContactForm");
  const locale = useLocale();
  const pathname = usePathname();
  const segments = t.raw("segments") as { value: string; label: string }[];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [segment, setSegment] = useState(initialSegment && segments.some((s) => s.value === initialSegment) ? initialSegment : (segments[0]?.value ?? "other"));
  const [message, setMessage] = useState(initialMessage);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — люди не бачать
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = t("nameError");
    const emailOk = email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const phoneOk = phone.trim() === "" || phone.replace(/[^\d+]/g, "").length >= 7;
    if (!email.trim() && !phone.trim()) e.contact = t("contactError");
    else if (!emailOk) e.contact = t("emailError");
    else if (!phoneOk) e.contact = t("phoneError");
    if (message.trim().length < 10) e.message = t("messageError");
    return e;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          segment,
          message: message.trim(),
          source: "form",
          page: pathname,
          locale,
          website,
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface)] p-6"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[var(--color-brand-text)]" aria-hidden />
          <div>
            <p className="font-semibold">{t("sentTitle", { name: name.trim() })}</p>
            <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t("sentText")}</p>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{t("sentNext")}</p>
          </div>
        </div>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-fg)] transition focus:border-[var(--color-brand-dark)] focus:bg-[var(--color-bg)]";
  const label = "mb-2 block text-sm font-semibold";
  const err = "mt-1 text-sm text-[#b91c1c] dark:text-[#f87171]";

  return (
    <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
      <div>
        <label htmlFor="name" className={label}>
          {t("nameLabel")} <span aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={field}
        />
        {errors.name && (
          <p id="name-error" className={err}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>
              {t("phoneLabel")}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? "contact-error" : "contact-hint"}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="email" className={label}>
              {t("emailLabel")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? "contact-error" : "contact-hint"}
              className={field}
            />
          </div>
        </div>
        {errors.contact ? (
          <p id="contact-error" className={err}>
            {errors.contact}
          </p>
        ) : (
          <p id="contact-hint" className="mt-1 text-sm text-[var(--color-fg-placeholder)]">
            {t("contactHint")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="segment" className={label}>
          {t("segmentLabel")}
        </label>
        <select
          id="segment"
          name="segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className={field}
        >
          {segments.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={label}>
          {t("messageLabel")} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={field}
        />
        {errors.message && (
          <p id="message-error" className={err}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: поза потоком, невидиме і для читачів екрана */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-[var(--color-line)]"
        />
        <label htmlFor="consent" className="text-sm text-[var(--color-fg-muted)]">
          {t("consent")}
        </label>
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--color-accent)] bg-[var(--color-surface)] p-3 text-sm"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-accent-text)]" aria-hidden />
          <span>{t("errorHint")}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={!consent || status === "sending"}
        className="w-full rounded-lg bg-[var(--color-brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {status === "sending" ? t("sending") : t("submit")}
      </button>

      {!consent && <p className="text-sm text-[var(--color-fg-muted)]">{t("submitHint")}</p>}
    </form>
  );
}
