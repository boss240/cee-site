import { getTranslations } from "next-intl/server";
import { DigestsManager, type DigestLabels } from "./DigestsManager";

export default async function AdminDigestsPage() {
  const t = await getTranslations("Admin.digests");
  const keys: (keyof DigestLabels)[] = ["tabSources","tabNews","tabDigests","addSource","name","url","category","enabled","check","fetch","fetchAll","lastStatus","items","never","sourcesHint","newsHint","from","to","unassignedOnly","showNews","generateDraft","draftMode.ai","draftMode.template","draftMode.empty","addNew","published","draft","edit","delete","save","cancel","publish","unpublish","confirmDelete","slug","title","intro","body","markdownHint","empty","loading","open","saved","error","inDigest","noNews"];
  const labels = Object.fromEntries(keys.map((k) => [k, t(k)])) as DigestLabels;
  const categoryNames = Object.fromEntries(["regulator","government","operator","market","media"].map((k) => [k, t(`categories.${k}`)]));
  return (
    <div>
      <h1>{t("pageTitle")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      <DigestsManager labels={labels} categoryNames={categoryNames} />
    </div>
  );
}
