import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { siteOrigin } from "@/lib/siteUrl";
import { backupConfiguration } from "@/lib/assistant/backupConfiguration";
import { runBackupCanary } from "@/lib/assistant/backupCanary";
import { quoteFor, invokeBackup } from "@/lib/assistant/backupProviders";
import { reserveBackupCall, settleResolvedBackupCall } from "@/lib/assistant/backupBudget";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  return runBackupCanary(request, {
    authorize: async () => !(await requireAdminSession()).response,
    origin: () => siteOrigin(),
    enabled: () => backupConfiguration(process.env).enabled,
    credential: provider => provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY,
    quote: quoteFor, reserve: reserveBackupCall, invoke: invokeBackup, settle: settleResolvedBackupCall,
  });
}
