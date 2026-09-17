import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { getPublicContacts } from "@/lib/publicProfile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ContactsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic = "" } = await searchParams;
  const t = await getTranslations("ContactsPage");
  const tf = await getTranslations("ContactForm");
  // /contacts?topic=subscription-premium — заявка на підписку з тарифів
  const planMatch = /^subscription-(premium|enterprise)$/.exec(topic);
  const initialMessage = planMatch ? tf("subscriptionMessage", { plan: tf(`planNames.${planMatch[1]}`) }) : "";
  const c = await getPublicContacts();
  const address = c.address || t("address");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
      <h1 className="mt-2">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-xl">{t("formTitle")}</h2>
          <div className="mt-6">
            <ContactForm initialMessage={initialMessage} initialSegment={planMatch ? "subscription" : undefined} />
          </div>
        </div>

        <div>
          <h2 className="text-xl">{t("detailsTitle")}</h2>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-brand-text)]">
                <MapPin size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("addressLabel")}</p>
                <p className="mt-1 text-[var(--color-fg-muted)]">{address}</p>
              </div>
            </li>

            {c.phone && (
              <li className="flex gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-brand-text)]">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("phoneLabel")}</p>
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="mt-1 block text-[var(--color-fg)] underline-offset-2 hover:underline">
                    {c.phone}
                  </a>
                </div>
              </li>
            )}

            {c.email && (
              <li className="flex gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-brand-text)]">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("emailLabel")}</p>
                  <a href={`mailto:${c.email}`} className="mt-1 block text-[var(--color-fg)] underline-offset-2 hover:underline">
                    {c.email}
                  </a>
                </div>
              </li>
            )}

            <li className="flex gap-4 rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface)] p-5">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("assistantLabel")}</p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("assistantText")}</p>
              </div>
            </li>
          </ul>

          <p className="mt-6 text-sm text-[var(--color-fg-placeholder)]">{t("responseNote")}</p>
        </div>
      </div>
    </div>
  );
}
