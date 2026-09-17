import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { FileText, Newspaper, MessageSquareText, ArrowRight, ShieldCheck, RefreshCw, Link2 } from "lucide-react";
import { sql } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";
import { db, schema } from "@/lib/db";
import { searchDocuments } from "@/lib/knowledge/documents";
import { listPublishedDigests } from "@/lib/knowledge/digests";
import { PLANS } from "@/lib/knowledge/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Knowledge.hub");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type Principle = { title: string; text: string };
const PRINCIPLE_ICONS = [ShieldCheck, RefreshCw, Link2];

async function counts() {
  try {
    const [d] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.documents).where(sql`published = true`);
    const [g] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.digests).where(sql`published = true`);
    return { documents: d?.n ?? 0, digests: g?.n ?? 0 };
  } catch {
    return { documents: 0, digests: 0 };
  }
}

export default async function KnowledgeHub() {
  const t = await getTranslations("Knowledge.hub");
  const locale = (await getLocale()) as "uk" | "en";
  const [n, recentDocs, recentDigests] = await Promise.all([counts(), searchDocuments({ limit: 4 }), listPublishedDigests(3)]);
  const principles = t.raw("principles") as Principle[];
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "short", year: "numeric" }) : "");

  const cards = [
    { href: "/knowledge/documents", Icon: FileText, title: t("cards.documents.title"), text: t("cards.documents.text"), meta: t("cards.documents.meta", { n: n.documents }) },
    { href: "/knowledge/digests", Icon: Newspaper, title: t("cards.digests.title"), text: t("cards.digests.text"), meta: t("cards.digests.meta", { n: n.digests }) },
    { href: "/knowledge/ask", Icon: MessageSquareText, title: t("cards.ask.title"), text: t("cards.ask.text"), meta: t("cards.ask.meta", { guest: PLANS.guest.dailyAsk ?? 0, free: PLANS.free.dailyAsk ?? 0 }) },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="hero" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
            <h1 className="hero-title mt-3 max-w-4xl">{t("title")}</h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-6 max-w-2xl text-lg text-[var(--color-fg-muted)]">{t("text")}</p>
          </Reveal>
          <Reveal delay={180}>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {cards.map(({ href, Icon, title, text, meta }) => (
                <li key={href}>
                  <Link href={href} className="lift group flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/80 p-6 backdrop-blur">
                    <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#ecfdf5] text-[var(--color-brand-text)] transition group-hover:bg-[var(--color-brand)] group-hover:text-white dark:bg-white/10">
                      <Icon size={20} />
                    </span>
                    <h2 className="mt-4 text-xl">{title}</h2>
                    <p className="mt-2 flex-1 text-sm text-[var(--color-fg-muted)]">{text}</p>
                    <span className="mono-label mt-4 text-[var(--color-fg-placeholder)]">{meta}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-text)]">
                      {t("open")} <ArrowRight size={14} aria-hidden className="transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Принципи */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("principlesLabel")}</p>
            <h2 className="mt-2">{t("principlesTitle")}</h2>
          </Reveal>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i] ?? ShieldCheck;
              return (
                <Reveal as="li" key={p.title} delay={i * 90}>
                  <div className="h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                    <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-brand-text)]"><Icon size={20} /></span>
                    <h3 className="mt-4">{p.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{p.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Свіже */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-baseline justify-between gap-4">
              <h2>{t("recentDocs")}</h2>
              <Link href="/knowledge/documents" className="text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("all")} →</Link>
            </div>
            <ul className="mt-5 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
              {recentDocs.length === 0 && <li className="p-5 text-sm text-[var(--color-fg-muted)]">{t("emptyDocs")}</li>}
              {recentDocs.map((d) => (
                <li key={d.id}>
                  <Link href={`/knowledge/documents/${d.slug}`} className="flex flex-col gap-1 px-5 py-4 transition hover:bg-[var(--color-surface)]">
                    <span className="mono-label text-[var(--color-fg-placeholder)]">{d.number ?? d.kind.toUpperCase()}{d.checkedAt ? ` · ${t("checked")} ${fmt(d.checkedAt)}` : ""}</span>
                    <span className="font-semibold">{d.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={90}>
            <div className="flex items-baseline justify-between gap-4">
              <h2>{t("recentDigests")}</h2>
              <Link href="/knowledge/digests" className="text-sm font-semibold text-[var(--color-brand-text)] hover:underline">{t("all")} →</Link>
            </div>
            <ul className="mt-5 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
              {recentDigests.length === 0 && <li className="p-5 text-sm text-[var(--color-fg-muted)]">{t("emptyDigests")}</li>}
              {recentDigests.map((g) => (
                <li key={g.id}>
                  <Link href={`/knowledge/digests/${g.slug}`} className="flex flex-col gap-1 px-5 py-4 transition hover:bg-[var(--color-surface)]">
                    <span className="mono-label text-[var(--color-fg-placeholder)]">{fmt(g.publishedAt)}</span>
                    <span className="font-semibold">{g.title}</span>
                    {g.intro && <span className="text-sm text-[var(--color-fg-muted)]">{g.intro}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
