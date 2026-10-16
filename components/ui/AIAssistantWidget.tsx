"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated } from "@/lib/hooks/browser";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, X, Send, Sparkles, UserRound, Check } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  source?: "ai" | "knowledge-base";
  /** системна картка всередині стрічки: форма контакту або підтвердження */
  kind?: "lead-form" | "lead-done";
};

type StoredChat = { path: string; messages: ChatMessage[] };

const STORAGE_KEY = "cee-assistant-chat";
const NUDGE_KEY = "cee-assistant-nudged";
const NUDGE_DELAY_MS = 25_000;

function uid() {
  return Math.random().toString(36).slice(2);
}

/** Шлях без префікса локалі → ключ сторінки для контекстних текстів */
function pageKey(pathname: string): string {
  const clean = pathname.replace(/^\/(uk|en)(?=\/|$)/, "") || "/";
  const known = ["/", "/community", "/business", "/osbb", "/developers", "/donors", "/citizens", "/services", "/contacts", "/about"];
  return known.includes(clean) ? clean : "default";
}

/** Ключ у словнику (pageGreetings.*, pageQuickReplies.*, nudges.*) */
function dictKey(key: string): string {
  if (key === "/") return "home";
  if (key === "default") return "default";
  return key.slice(1);
}

function segmentForPath(key: string): string | undefined {
  const map: Record<string, string> = {
    "/community": "community",
    "/business": "business",
    "/osbb": "osbb",
    "/developers": "developer",
    "/donors": "donor",
    "/citizens": "citizen",
  };
  return map[key];
}

/** Наміри «хочу людину / контакт» — відкриваємо форму без зайвого кроку */
const CONTACT_INTENT =
  /(менеджер|зв'яж|звяж|передзвон|зателефон|контакт|консультац|фахів|спеціаліст|поговорити|call me|contact|manager|specialist|talk to|phone)/i;

export function AIAssistantWidget() {
  return useHydrated() ? <AssistantClient /> : null;
}

function restoredMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) as StoredChat : null;
    return Array.isArray(stored?.messages) ? stored.messages : [];
  } catch { return []; }
}

function AssistantClient() {
  const t = useTranslations("AIAssistant");
  const tNav = useTranslations("Nav");
  const locale = useLocale() as "uk" | "en";
  const pathname = usePathname();
  const key = pageKey(pathname);
  const dk = dictKey(key);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(restoredMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [nudge, setNudge] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Людська назва сторінки для шапки чату
  const pageLabel = useMemo(() => {
    const navKey: Record<string, string> = {
      "/community": "community",
      "/business": "business",
      "/osbb": "osbb",
      "/developers": "developers",
      "/donors": "donors",
      "/citizens": "citizens",
      "/services": "services",
      "/contacts": "contacts",
      "/about": "about",
    };
    if (key === "/") return t("homeLabel");
    if (navKey[key]) return tNav(navKey[key]);
    return "";
  }, [key, t, tNav]);

  // Контекстні тексти: вітання і швидкі питання залежно від сторінки
  const greeting = t.has(`pageGreetings.${dk}`) ? t(`pageGreetings.${dk}`) : t("greeting");
  const quickReplies = (t.has(`pageQuickReplies.${dk}`)
    ? t.raw(`pageQuickReplies.${dk}`)
    : t.raw("quickReplies")) as string[];
  const nudgeText = t.has(`nudges.${dk}`) ? t(`nudges.${dk}`) : t("nudges.default");

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: pathname, messages } satisfies StoredChat));
    } catch {
      /* ігноруємо */
    }
  }, [messages, pathname]);

  function openChat() {
    setNudge(false);
    setMessages((previous) => previous.length ? previous : [{ id: uid(), role: "assistant", text: greeting }]);
    setOpen(true);
  }

  // ---- Прокрутка донизу, фокус у поле, Escape закриває
  useEffect(() => {
    const scroll = () => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    scroll();
    // Картка форми контакту рендериться вищою за звичайну бульбашку — доганяємо після layout.
    const id = window.setTimeout(scroll, 180);
    return () => window.clearTimeout(id);
  }, [messages, thinking]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ---- М'яка підказка: один раз за сесію, після паузи, лише якщо чат закритий і порожній
  useEffect(() => {
    if (open) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(NUDGE_KEY) === "1";
    } catch {
      /* ігноруємо */
    }
    if (seen || messages.length > 0) return;
    const id = window.setTimeout(() => {
      setNudge(true);
      try {
        sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {
        /* ігноруємо */
      }
    }, NUDGE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [open, messages.length]);


  // ---- Відкрити форму контакту всередині стрічки (не дублюючи)
  const openLeadForm = useCallback(() => {
    setMessages((m) => {
      if (m.some((x) => x.kind === "lead-form" || x.kind === "lead-done")) return m;
      return [...m, { id: uid(), role: "assistant", text: t("leadIntro"), kind: "lead-form" }];
    });
  }, [t]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 2000 || thinking) return;

    const history = messages.filter((m) => !m.kind).slice(-10).map((m) => ({ role: m.role, text: m.text.slice(0, 1500) }));

    setMessages((m) => [...m, { id: uid(), role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);

    const wantsContact = CONTACT_INTENT.test(trimmed);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, locale, page: pathname, history }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.reply !== "string" || !data.reply.trim()) {
        setMessages((m) => [...m, { id: uid(), role: "assistant", text: t(res.status === 429 ? "rateLimited" : "requestFailed") }]);
      } else {
        setMessages((m) => [...m, { id: uid(), role: "assistant", text: data.reply, source: data.source }]);
      }
    } catch {
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: t("requestFailed") }]);
    } finally {
      setThinking(false);
      if (wantsContact) openLeadForm();
    }
  }

  async function submitLead(lead: { name: string; contact: string }) {
    const transcript = messages.filter((m) => !m.kind).slice(-60).map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));
    const isEmail = lead.contact.includes("@");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lead.name,
        email: isEmail ? lead.contact : "",
        phone: isEmail ? "" : lead.contact,
        segment: segmentForPath(key),
        message: t("leadMessagePrefix", { page: pageLabel || pathname }),
        source: "chat",
        page: pathname,
        locale,
        transcript,
      }),
    });
    if (!res.ok) throw new Error("lead failed");
    setMessages((m) => [
      ...m.filter((x) => x.kind !== "lead-form"),
      { id: uid(), role: "assistant", text: t("leadDone", { name: lead.name }), kind: "lead-done" },
    ]);
  }

  const leadFormShown = messages.some((m) => m.kind === "lead-form");
  const leadDone = messages.some((m) => m.kind === "lead-done");

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <div
          role="dialog"
          aria-label={t("widgetLabel")}
          className="mb-3 flex h-[min(72vh,600px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elevated)] shadow-2xl"
        >
          {/* Шапка */}
          <div className="flex items-center justify-between gap-2 bg-[var(--color-brand-dark)] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={16} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">{t("widgetLabel")}</p>
                {pageLabel && (
                  <p className="text-[11px] leading-tight text-white/70">{t("contextHint", { page: pageLabel })}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeLabel")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {/* Стрічка */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-surface)] px-4 py-4">
            {messages.map((m) =>
              m.kind === "lead-form" ? (
                <LeadCard key={m.id} intro={m.text} onSubmit={submitLead} t={t} />
              ) : (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-[var(--color-brand)] text-white"
                        : m.kind === "lead-done"
                          ? "rounded-bl-sm border border-[var(--color-brand)] bg-[var(--color-bg)] text-[var(--color-fg)]"
                          : "rounded-bl-sm border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-fg)]"
                    }`}
                  >
                    {m.kind === "lead-done" && (
                      <Check size={14} aria-hidden className="mr-1 inline text-[var(--color-brand-text)]" />
                    )}
                    {m.source === "knowledge-base" && <span className="mb-1 block text-xs font-semibold text-[var(--color-fg-muted)]">{t("referenceMode")}</span>}
                    {m.text}
                  </p>
                </div>
              )
            )}

            {thinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-fg-placeholder)] [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-fg-placeholder)] [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-fg-placeholder)]" />
                </div>
              </div>
            )}
          </div>

          {/* Швидкі питання + «Залишити контакт» */}
          <div className="border-t border-[var(--color-line)] bg-[var(--color-bg-elevated)] px-3 pt-3">
            <div className="flex flex-wrap gap-1.5 pb-1">
              {!leadDone && !leadFormShown && (
                <button
                  type="button"
                  onClick={openLeadForm}
                  disabled={thinking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-text)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:opacity-50"
                >
                  <UserRound size={12} aria-hidden />
                  {t("leadButton")}
                </button>
              )}
              {messages.length <= 1 && quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={thinking}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-fg-muted)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-text)] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Поле вводу */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-bg-elevated)] p-3"
          >
            <input
              ref={inputRef}
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputPlaceholder")}
              aria-label={t("inputPlaceholder")}
              className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none transition focus:border-[var(--color-brand-dark)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label={t("send")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-40"
            >
              <Send size={16} aria-hidden />
            </button>
          </form>
          <p className="bg-[var(--color-bg-elevated)] px-4 pb-2 text-center text-[10px] text-[var(--color-fg-placeholder)]">
            {t("disclaimer")}
            <Link href="/knowledge/ask" className="mt-1 block text-xs text-[var(--color-brand-text)] underline underline-offset-2">{t("documentsConsultant")}</Link>
          </p>
        </div>
      )}

      {/* М'яка підказка біля кнопки */}
      {nudge && !open && (
        <div
          role="status"
          className="rise absolute bottom-16 right-0 mb-2 w-[min(80vw,300px)] rounded-2xl rounded-br-sm border border-[var(--color-line)] bg-[var(--color-bg-elevated)] p-3.5 text-sm shadow-xl"
        >
          <p className="pr-6 leading-relaxed text-[var(--color-fg)]">{nudgeText}</p>
          <button
            type="button"
            onClick={openChat}
            className="mt-2 text-sm font-semibold text-[var(--color-brand-text)] underline-offset-2 hover:underline"
          >
            {t("nudgeAction")}
          </button>
          <button
            type="button"
            onClick={() => setNudge(false)}
            aria-label={t("nudgeDismiss")}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-placeholder)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)]"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => { if (open) setOpen(false); else openChat(); }}
        aria-expanded={open}
        aria-label={open ? t("closeLabel") : t("openLabel")}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-lg shadow-emerald-900/20 transition hover:scale-105 hover:bg-[var(--color-brand-hover)] active:scale-95"
      >
        {!open && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-[var(--color-brand)] opacity-60 [animation-duration:2.5s] group-hover:opacity-0"
          />
        )}
        {open ? <X size={22} aria-hidden className="relative" /> : <MessageCircle size={22} aria-hidden className="relative" />}
      </button>
    </div>
  );
}

/** Картка збору контакту всередині стрічки чату */
function LeadCard({
  intro,
  onSubmit,
  t,
}: {
  intro: string;
  onSubmit: (lead: { name: string; contact: string }) => Promise<void>;
  t: ReturnType<typeof useTranslations<"AIAssistant">>;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length >= 2 &&
    (contact.includes("@")
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
      : contact.replace(/[^\d+]/g, "").length >= 7);

  return (
    <div className="flex justify-start">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid || busy) return;
          setBusy(true);
          setError(null);
          try {
            await onSubmit({ name: name.trim(), contact: contact.trim() });
          } catch {
            setError(t("leadError"));
            setBusy(false);
          }
        }}
        className="w-[92%] space-y-2.5 rounded-2xl rounded-bl-sm border border-[var(--color-brand)] bg-[var(--color-bg)] p-3.5 text-sm"
      >
        <p className="leading-relaxed text-[var(--color-fg)]">{intro}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("leadName")}
          aria-label={t("leadName")}
          autoComplete="name"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-dark)]"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t("leadContact")}
          aria-label={t("leadContact")}
          autoComplete="tel"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-dark)]"
        />
        {error && <p className="text-xs text-[#b91c1c] dark:text-[#f87171]">{error}</p>}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] leading-tight text-[var(--color-fg-placeholder)]">{t("leadConsent")}</p>
          <button
            type="submit"
            disabled={!valid || busy}
            aria-label={t("leadSubmitLabel")}
            className="shrink-0 rounded-lg bg-[var(--color-brand)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-40"
          >
            {busy ? t("leadSending") : t("leadSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}
