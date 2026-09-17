import { getTranslations } from "next-intl/server";
import { BlogManager } from "./BlogManager";

export default async function AdminBlogPage() {
  const t = await getTranslations("Admin.blog");
  const keys = ["addNew","published","draft","edit","delete","save","cancel","publish","unpublish","confirmDelete","slug","slugHint","titleUk","titleEn","excerptUk","excerptEn","bodyUk","bodyEn","tag","tagHint","markdownHint","empty","loading","open","saved","error"] as const;
  const labels = Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<(typeof keys)[number], string>;
  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      <BlogManager labels={labels} />
    </div>
  );
}
