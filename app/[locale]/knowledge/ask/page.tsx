import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/Reveal";
import { AskClient } from "./AskClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Knowledge.ask");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: await alternatesFor("/knowledge/ask") };
}

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const t = await getTranslations("Knowledge.ask");
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Reveal>
        <p className="mono-label text-[var(--color-brand-text)]">{t("label")}</p>
        <h1 className="mt-2">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("intro")}</p>
      </Reveal>
      <div className="mt-10">
        <AskClient initialQuestion={q.slice(0, 500)} />
      </div>
    </div>
  );
}
