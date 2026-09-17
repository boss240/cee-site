import { getTranslations } from "next-intl/server";
import { LeadsManager } from "./LeadsManager";

export default async function AdminLeadsPage() {
  const t = await getTranslations("Admin.leads");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>

      <LeadsManager
        labels={{
          all: t("all"),
          statusNew: t("status.new"),
          statusInProgress: t("status.in_progress"),
          statusDone: t("status.done"),
          statusSpam: t("status.spam"),
          sourceForm: t("source.form"),
          sourceChat: t("source.chat"),
          empty: t("empty"),
          loading: t("loading"),
          contact: t("contact"),
          message: t("message"),
          transcript: t("transcript"),
          note: t("note"),
          notePlaceholder: t("notePlaceholder"),
          saveNote: t("saveNote"),
          saved: t("saved"),
          delete: t("delete"),
          confirmDelete: t("confirmDelete"),
          clearSpam: t("clearSpam"),
          page: t("page"),
          segment: t("segment"),
          copy: t("copy"),
          copied: t("copied"),
          you: t("you"),
          assistant: t("assistant"),
          segments: {
            osbb: t("segments.osbb"),
            business: t("segments.business"),
            community: t("segments.community"),
            developer: t("segments.developer"),
            donor: t("segments.donor"),
            citizen: t("segments.citizen"),
            other: t("segments.other"),
            subscription: t("segments.subscription"),
          },
        }}
      />
    </div>
  );
}
