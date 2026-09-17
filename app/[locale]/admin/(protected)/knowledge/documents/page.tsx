import { getTranslations } from "next-intl/server";
import { DocumentsManager, type DocLabels } from "./DocumentsManager";

export default async function AdminDocumentsPage() {
  const t = await getTranslations("Admin.documents");
  const tk = await getTranslations("Knowledge.kinds");
  const ts = await getTranslations("Knowledge.status");
  const keys: (keyof DocLabels)[] = ["addNew","published","draft","edit","delete","save","cancel","publish","unpublish","confirmDelete","slug","slugHint","kind","number","title","issuer","adoptedAt","status","summary","summaryHint","keyPoints","keyPointsHint","tags","tagsHint","sourceUrl","checked","checkedHint","empty","loading","open","saved","error","filter","updates","addUpdate","updateDate","updateNote","updateSource","noUpdates","checkedAt","never"];
  const labels = Object.fromEntries(keys.map((k) => [k, t(k)])) as DocLabels;
  const kindNames = Object.fromEntries(["law","resolution","regulator","dbn","dstu","iso","eu","other"].map((k) => [k, tk(k)]));
  const statusNames = Object.fromEntries(["active","amended","repealed","draft"].map((k) => [k, ts(k)]));
  return (
    <div>
      <h1>{t("pageTitle")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      <DocumentsManager labels={labels} kindNames={kindNames} statusNames={statusNames} />
    </div>
  );
}
