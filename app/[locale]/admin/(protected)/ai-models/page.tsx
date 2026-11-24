import { getTranslations } from "next-intl/server";
import { backupConfiguration } from "@/lib/assistant/backupConfiguration";
import { BackupConnectionTests } from "./BackupConnectionTests";
import { AIModelsManager } from "./AIModelsManager";

export default async function AIModelsPage() {
  const t = await getTranslations("Admin.aiModels");
  const backups = backupConfiguration(process.env);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      <p className="mt-3 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5 px-4 py-3 text-sm text-[var(--color-brand-text)]">
        {t(backups.enabled ? "fallbackNoteWithBackups" : "fallbackNote")}
      </p>

      <p className="my-3 rounded-lg border p-3 text-sm">
        {t(backups.enabled ? "backupEnabled" : "backupDisabled")} {t("backupPolicy")}
        {" OpenAI: "}{t(backups.openaiConfigured ? "configuredNotVerified" : "noKey")}
        {"; Anthropic: "}{t(backups.anthropicConfigured ? "configuredNotVerified" : "noKey")}
      </p>

      <BackupConnectionTests enabled={backups.enabled} openaiConfigured={backups.openaiConfigured}
        anthropicConfigured={backups.anthropicConfigured} labels={{
          title: t("backupTestTitle"), warning: t("backupTestWarning"), test: t("backupTest"),
          running: t("testing"), success: t("backupTestSuccess"), accounting_unresolved: t("backupTestAccounting"), unknown: t("backupTestUnknown"),
          denied: t("backupTestDenied"), unconfigured: t("backupTestUnconfigured"), refusal: t("backupTestRefusal"),
        }} />

      <AIModelsManager
        labels={{
          addNew: t("addNew"),
          name: t("name"),
          provider: t("provider"),
          model: t("model"),
          apiKeyEnvVar: t("apiKeyEnvVar"),
          priority: t("priority"),
          priorityHint: t("priorityHint"),
          active: t("active"),
          inactive: t("inactive"),
          default: t("default"),
          configuredNotVerified: t("configuredNotVerified"),
          providerNotApproved: t("providerNotApproved"),
          operationFailed: t("operationFailed"),
          refreshFailed: t("refreshFailed"),
          inputCost: t("inputCost"),
          outputCost: t("outputCost"),
          testConnection: t("testConnection"),
          testing: t("testing"),
          testOk: t("testOk"),
          testFail: t("testFail"),
          noKey: t("noKey"),
          edit: t("edit"),
          delete: t("delete"),
          save: t("save"),
          cancel: t("cancel"),
          usageTitle: t("usageTitle"),
          usageEmpty: t("usageEmpty"),
          status: t("status"),
          responseTime: t("responseTime"),
          cost: t("cost"),
          tokens: t("tokens"),
        }}
      />
    </div>
  );
}
