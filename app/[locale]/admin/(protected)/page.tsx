import { getTranslations } from "next-intl/server";
import { DashboardStats } from "./DashboardStats";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin.dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>

      <DashboardStats
        labels={{
          channelsTitle: t("channelsTitle"),
          channelsHint: t("channelsHint"),
          channelEmail: t("channelEmail"),
          channelTelegram: t("channelTelegram"),
          channelAi: t("channelAi"),
          on: t("on"),
          off: t("off"),
          testChannels: t("testChannels"),
          testing: t("testing"),
          previewClient: t("previewClient"),
          previewCenter: t("previewCenter"),
          newLeads: t("newLeads"),
          leadsTotal: t("leadsTotal"),
          aiChats: t("aiChats"),
          aiSuccessRate: t("aiSuccessRate"),
          systemStatus: t("systemStatus"),
          systemOk: t("systemOk"),
          errorLog: t("errorLog"),
          noErrors: t("noErrors"),
          apiResponseTime: t("apiResponseTime"),
        }}
      />
    </div>
  );
}
