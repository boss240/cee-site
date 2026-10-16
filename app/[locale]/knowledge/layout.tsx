import { getLocale } from "next-intl/server";
import { KnowledgeNav } from "@/components/knowledge/KnowledgeNav";

export default async function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <>
      <KnowledgeNav />
      {locale === "en" && <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-[var(--color-fg-muted)]">Document summaries and news digests are provided in Ukrainian. Navigation and forms are available in English.</p>}
      {children}
    </>
  );
}
